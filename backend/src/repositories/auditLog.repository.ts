import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const auditLogRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            createdAt: {
              ...(params.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  },
};
