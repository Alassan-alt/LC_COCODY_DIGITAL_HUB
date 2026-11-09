import type { Prisma, MandateStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export const mandateRepository = {
  async findMany(params: { skip: number; take: number; search?: string; status?: MandateStatus }) {
    const where: Prisma.MandateWhereInput = {
      ...(params.search ? { label: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.mandate.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { startDate: "desc" },
      }),
      prisma.mandate.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.mandate.findUnique({ where: { id } });
  },

  create(data: { label: string; startDate: Date; endDate: Date; localCommitteeId: string }) {
    return prisma.mandate.create({ data });
  },

  update(id: string, data: Prisma.MandateUpdateInput) {
    return prisma.mandate.update({ where: { id }, data });
  },

  close(id: string) {
    return prisma.mandate.update({ where: { id }, data: { status: "CLOSED" } });
  },
};
