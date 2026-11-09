import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const departmentRepository = {
  async findMany(params: { skip: number; take: number; search?: string; isActive?: boolean }) {
    const where: Prisma.DepartmentWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { name: "asc" },
      }),
      prisma.department.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.department.findUnique({ where: { id } });
  },

  create(data: { name: string; description?: string; localCommitteeId: string }) {
    return prisma.department.create({ data });
  },

  update(id: string, data: Prisma.DepartmentUpdateInput) {
    return prisma.department.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.department.update({ where: { id }, data: { isActive: false } });
  },
};
