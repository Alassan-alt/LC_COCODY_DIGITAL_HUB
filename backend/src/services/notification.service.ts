import type { NotificationType, Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { memberRepository } from "../repositories/member.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";

const TASK_DUE_SOON_WINDOW_DAYS = 3;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const notificationService = {
  /** Notifie un utilisateur précis (ex. tâche assignée). */
  async notifyUser(
    userId: string,
    type: NotificationType,
    message: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ) {
    return notificationRepository.create({ type, message, userId, relatedEntityType, relatedEntityId });
  },

  /**
   * Notifie les membres d'un département (ex. nouveau document/événement/
   * réunion/rapport). N'envoie rien si `departmentId` est absent — évite de
   * diffuser à toute l'organisation par défaut (voir ARCHITECTURE_DECISIONS.md).
   */
  async notifyDepartment(
    departmentId: string | undefined | null,
    type: NotificationType,
    message: string,
    options: { relatedEntityType?: string; relatedEntityId?: string; excludeUserId?: string } = {},
  ) {
    if (!departmentId) return;
    const userIds = await memberRepository.findUserIdsByDepartment(departmentId);
    const recipients = userIds.filter((id) => id !== options.excludeUserId);
    await notificationRepository.createMany(
      recipients.map((userId) => ({
        type,
        message,
        userId,
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId,
      })),
    );
  },

  /** Notifie tous les utilisateurs ayant l'un des rôles donnés (ex. gouvernance SUPER_ADMIN/LCP). */
  async notifyRoles(
    roles: Role[],
    type: NotificationType,
    message: string,
    options: { relatedEntityType?: string; relatedEntityId?: string; excludeUserId?: string } = {},
  ) {
    const users = await prisma.user.findMany({ where: { role: { in: roles } }, select: { id: true } });
    const recipients = users.map((u) => u.id).filter((id) => id !== options.excludeUserId);
    await notificationRepository.createMany(
      recipients.map((userId) => ({
        type,
        message,
        userId,
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId,
      })),
    );
  },

  /**
   * Génère (si besoin) les notifications d'échéance/retard pour les tâches
   * assignées à l'utilisateur. Appelé à la demande (pas de cron dans ce MVP,
   * même principe que le statut OVERDUE calculé dynamiquement — Phase 8).
   * Idempotent : une notification n'est créée qu'une seule fois par tâche.
   */
  async syncTaskAlerts(userId: string): Promise<void> {
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { not: null, lte: addDays(now, TASK_DUE_SOON_WINDOW_DAYS) },
      },
    });

    for (const task of tasks) {
      const isOverdue = task.dueDate!.getTime() < now.getTime();
      const type: NotificationType = isOverdue ? "TASK_OVERDUE" : "TASK_DUE_SOON";
      const alreadyNotified = await notificationRepository.existsForEntity(userId, type, task.id);
      if (!alreadyNotified) {
        const message = isOverdue
          ? `La tâche « ${task.title} » est en retard`
          : `La tâche « ${task.title} » arrive à échéance bientôt`;
        await notificationRepository.create({
          type,
          message,
          userId,
          relatedEntityType: "Task",
          relatedEntityId: task.id,
        });
      }
    }
  },

  async list(userId: string, query: { page: number; limit: number; isRead?: boolean }) {
    await this.syncTaskAlerts(userId);
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await notificationRepository.findMany({
      userId,
      skip,
      take: query.limit,
      isRead: query.isRead,
    });
    const unreadCount = await notificationRepository.countUnread(userId);
    return { ...buildPaginatedResult(items, total, query.page, query.limit), unreadCount };
  },

  async markRead(id: string, userId: string) {
    const notification = await notificationRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new AppError("Notification introuvable", 404);
    }
    return notificationRepository.markRead(id);
  },

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
  },
};
