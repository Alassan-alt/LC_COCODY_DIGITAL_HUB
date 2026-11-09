import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type AuditAction =
  | "LOGIN"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_DELETED"
  | "MEMBER_CREATED"
  | "MEMBER_UPDATED"
  | "TASK_CREATED";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  userId: string;
  createdAt: string;
}

export interface ListAuditLogsParams {
  page?: number;
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAuditLogs(params: ListAuditLogsParams): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await api.get<PaginatedResponse<AuditLog>>("/audit-logs", { params });
  return data;
}
