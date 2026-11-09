import { auditLogRepository } from "../repositories/auditLog.repository";
import { buildPaginatedResult } from "../utils/pagination";
import type { ListAuditLogsQuery } from "../validators/auditLog.validator";

/**
 * Lecture seule (RG-06 : « les logs ne doivent pas être modifiables par les
 * utilisateurs ordinaires »). Aucune méthode create/update/delete n'est
 * exposée ici — les logs sont écrits exclusivement par
 * `services/audit.service.ts` (`recordAuditLog`), appelé depuis les autres
 * services métier.
 */
export const auditLogService = {
  async list(query: ListAuditLogsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await auditLogRepository.findMany({
      skip,
      take: query.limit,
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },
};
