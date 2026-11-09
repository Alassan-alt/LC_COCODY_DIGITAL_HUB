import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { financeRepository } from "../repositories/finance.repository";
import type { AccessContext } from "../utils/documentAccess";
import { buildVisibilityWhere } from "../utils/documentAccess";

const MANDATE_ALERT_WINDOW_DAYS = 30;
const EVENT_ALERT_WINDOW_DAYS = 3;
const FINANCE_VISIBLE_ROLES: Role[] = ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Dashboard basé exclusivement sur des données réelles (instruction.md Phase 7 :
 * « ne pas utiliser de fausses statistiques »). Tous les modules prévus par le
 * plan de développement sont maintenant couverts ; `pendingModules` reste au
 * cas où une phase future (Knowledge Base, Lessons Learned, ...) ajoute un
 * indicateur de dashboard qui n'existe pas encore au moment où il est lu.
 */
export const dashboardService = {
  async getDashboard(ctx: AccessContext) {
    const documentVisibilityWhere = buildVisibilityWhere(ctx, "authorId");
    const now = new Date();

    const [
      memberCount,
      departmentCount,
      teamCount,
      documentCount,
      projectCount,
      taskCount,
      overdueTaskCount,
      myOverdueTasks,
      eventCount,
      upcomingEvents,
      soonEndingMandates,
      kpis,
    ] = await Promise.all([
      prisma.memberProfile.count(),
      prisma.department.count({ where: { isActive: true } }),
      prisma.team.count(),
      prisma.document.count({
        where: { isDeleted: false, ...(documentVisibilityWhere ?? {}) },
      }),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { lt: now } } }),
      prisma.task.findMany({
        where: { assigneeId: ctx.userId, status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { lt: now } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.event.count(),
      prisma.event.findMany({
        where: { startDate: { gte: now, lte: addDays(now, EVENT_ALERT_WINDOW_DAYS) } },
        orderBy: { startDate: "asc" },
      }),
      prisma.mandate.findMany({
        where: { status: "ACTIVE", endDate: { lte: addDays(now, MANDATE_ALERT_WINDOW_DAYS) } },
        orderBy: { endDate: "asc" },
      }),
      // Seuls currentValue/target sont nécessaires ici (compte + moyenne) :
      // select réduit la taille transférée depuis MongoDB (Phase 20).
      prisma.kPI.findMany({ select: { currentValue: true, target: true } }),
    ]);

    const averageKpiProgress = kpis.length
      ? Math.round(
          kpis.reduce((sum, kpi) => sum + Math.min(100, (kpi.currentValue / kpi.target) * 100), 0) /
            kpis.length,
        )
      : null;

    const mandateAlerts = soonEndingMandates.map((mandate) => {
      const dateLabel = mandate.endDate.toISOString().slice(0, 10);
      const isOverdue = mandate.endDate.getTime() < now.getTime();
      return {
        type: isOverdue ? "MANDATE_OVERDUE" : "MANDATE_ENDING_SOON",
        message: isOverdue
          ? `Le mandat « ${mandate.label} » est arrivé à échéance le ${dateLabel} et n'a pas été clôturé`
          : `Le mandat « ${mandate.label} » se termine le ${dateLabel}`,
        mandateId: mandate.id,
      };
    });

    const taskAlerts = myOverdueTasks.map((task) => ({
      type: "TASK_OVERDUE",
      message: `La tâche « ${task.title} » qui vous est assignée est en retard`,
      taskId: task.id,
    }));

    const eventAlerts = upcomingEvents.map((event) => ({
      type: "EVENT_UPCOMING",
      message: `L'événement « ${event.title} » commence le ${event.startDate.toISOString().slice(0, 10)}`,
      eventId: event.id,
    }));

    // Le solde financier respecte les mêmes permissions que /api/finance :
    // absent (pas à zéro) pour les rôles qui n'ont pas accès au module.
    const canViewFinance = FINANCE_VISIBLE_ROLES.includes(ctx.role);
    const balance = canViewFinance ? await financeRepository.getBalance({}) : undefined;

    return {
      generatedAt: now.toISOString(),
      stats: {
        members: memberCount,
        departments: departmentCount,
        teams: teamCount,
        documents: documentCount,
        projects: projectCount,
        tasks: taskCount,
        tasksOverdue: overdueTaskCount,
        events: eventCount,
        kpis: kpis.length,
        kpisAverageProgressPercent: averageKpiProgress,
        ...(balance ? { finance: balance } : {}),
      },
      alerts: [...taskAlerts, ...eventAlerts, ...mandateAlerts],
      pendingModules: [],
    };
  },
};
