import type { Prisma, ReportType } from "@prisma/client";
import { prisma } from "../config/prisma";

export const reportRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    type?: ReportType;
    departmentId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.ReportWhereInput = {
      ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.report.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
      prisma.report.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.report.findUnique({ where: { id } });
  },

  create(data: {
    title: string;
    type: ReportType;
    period: string;
    content?: string;
    departmentId?: string;
    mandateId?: string;
    documentId?: string;
    authorId: string;
  }) {
    return prisma.report.create({ data });
  },

  update(id: string, data: Prisma.ReportUpdateInput) {
    return prisma.report.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.report.delete({ where: { id } });
  },
};
