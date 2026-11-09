import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const teamRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    departmentId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.TeamWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.team.findMany({ where, skip: params.skip, take: params.take, orderBy: { name: "asc" } }),
      prisma.team.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.team.findUnique({ where: { id } });
  },

  create(data: { name: string; departmentId: string; mandateId: string }) {
    return prisma.team.create({ data });
  },

  update(id: string, data: Prisma.TeamUpdateInput) {
    return prisma.team.update({ where: { id }, data });
  },

  countMembers(teamId: string) {
    return prisma.memberProfile.count({ where: { teamId } });
  },

  delete(id: string) {
    return prisma.team.delete({ where: { id } });
  },
};
