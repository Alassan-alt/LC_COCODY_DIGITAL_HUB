import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const kpiRepository = {
  async findMany(params: { skip: number; take: number; search?: string; departmentId?: string; mandateId?: string }) {
    const where: Prisma.KPIWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.kPI.findMany({ where, skip: params.skip, take: params.take, orderBy: { updatedAt: "desc" } }),
      prisma.kPI.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.kPI.findUnique({ where: { id } });
  },

  create(data: {
    name: string;
    target: number;
    currentValue: number;
    unit?: string;
    period: string;
    departmentId?: string;
    mandateId?: string;
    createdById: string;
  }) {
    return prisma.kPI.create({ data });
  },

  update(id: string, data: Prisma.KPIUpdateInput) {
    return prisma.kPI.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.kPI.delete({ where: { id } });
  },
};
