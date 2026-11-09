import { prisma } from "../config/prisma";
import { departmentRepository } from "../repositories/department.repository";
import { documentRepository } from "../repositories/document.repository";
import { financeRepository } from "../repositories/finance.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { reportRepository } from "../repositories/report.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateReportInput,
  GenerateReportInput,
  ListReportsQuery,
  UpdateReportInput,
} from "../validators/report.validator";
import { notificationService } from "./notification.service";

async function notifyNewReport(
  reportId: string,
  title: string,
  departmentId: string | undefined,
  authorId: string,
): Promise<void> {
  await notificationService.notifyDepartment(departmentId, "REPORT_NEW", `Nouveau rapport : « ${title} »`, {
    relatedEntityType: "Report",
    relatedEntityId: reportId,
    excludeUserId: authorId,
  });
}

async function assertReferencesExist(input: {
  departmentId?: string | null;
  mandateId?: string | null;
  documentId?: string | null;
}): Promise<void> {
  if (input.departmentId) {
    const department = await departmentRepository.findById(input.departmentId);
    if (!department) {
      throw new AppError("Département introuvable", 404);
    }
  }
  if (input.mandateId) {
    const mandate = await mandateRepository.findById(input.mandateId);
    if (!mandate) {
      throw new AppError("Mandat introuvable", 404);
    }
  }
  if (input.documentId) {
    const document = await documentRepository.findById(input.documentId);
    if (!document || document.isDeleted) {
      throw new AppError("Document introuvable", 404);
    }
  }
}

/**
 * Agrège des données réellement existantes (pas de fausses statistiques,
 * même principe que le dashboard Phase 7) pour pré-remplir le contenu d'un
 * rapport. L'export binaire (PDF/Excel/CSV) reste « futur » (voir
 * ARCHITECTURE_DECISIONS.md) ; ce texte est la base qu'un export consommera.
 */
async function buildGeneratedContent(scope: { departmentId?: string; mandateId?: string }): Promise<string> {
  const scopeWhere = {
    ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
    ...(scope.mandateId ? { mandateId: scope.mandateId } : {}),
  };

  const [projectCount, documentCount, eventCount, partnerCount, kpis, balance] = await Promise.all([
    prisma.project.count({ where: scopeWhere }),
    prisma.document.count({ where: { ...scopeWhere, isDeleted: false } }),
    prisma.event.count({ where: scopeWhere }),
    scope.mandateId
      ? prisma.partner.count({ where: { mandateId: scope.mandateId } })
      : prisma.partner.count(),
    prisma.kPI.findMany({ where: scopeWhere }),
    financeRepository.getBalance({ departmentId: scope.departmentId, mandateId: scope.mandateId }),
  ]);

  const kpiLines = kpis.length
    ? kpis
        .map((k) => `- ${k.name} : ${k.currentValue}/${k.target} ${k.unit ?? ""} (${Math.round((k.currentValue / k.target) * 100)}%)`)
        .join("\n")
    : "Aucun KPI suivi sur ce périmètre.";

  return [
    `Projets : ${projectCount}`,
    `Documents : ${documentCount}`,
    `Événements : ${eventCount}`,
    `Partenaires : ${partnerCount}`,
    `Solde financier : ${balance.balance} XOF (revenus ${balance.income} / dépenses ${balance.expense})`,
    "",
    "KPIs :",
    kpiLines,
  ].join("\n");
}

export const reportService = {
  async list(query: ListReportsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await reportRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      type: query.type,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const report = await reportRepository.findById(id);
    if (!report) {
      throw new AppError("Rapport introuvable", 404);
    }
    return report;
  },

  async create(input: CreateReportInput, authorId: string) {
    await assertReferencesExist(input);
    const report = await reportRepository.create({ ...input, authorId });
    await notifyNewReport(report.id, report.title, input.departmentId, authorId);
    return report;
  },

  async generate(input: GenerateReportInput, authorId: string) {
    await assertReferencesExist(input);
    const content = await buildGeneratedContent(input);
    const report = await reportRepository.create({ ...input, content, authorId });
    await notifyNewReport(report.id, report.title, input.departmentId, authorId);
    return report;
  },

  async update(id: string, input: UpdateReportInput) {
    await this.getById(id);
    await assertReferencesExist(input);
    return reportRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    await reportRepository.delete(id);
  },
};
