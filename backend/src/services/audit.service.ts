import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export async function recordAuditLog(params: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      metadata: params.metadata,
    },
  });
}
