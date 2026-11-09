import type { Prisma, TransitionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export const transitionRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    outgoingMandateId?: string;
    incomingMandateId?: string;
    status?: TransitionStatus;
  }) {
    const where: Prisma.TransitionPackageWhereInput = {
      ...(params.outgoingMandateId ? { outgoingMandateId: params.outgoingMandateId } : {}),
      ...(params.incomingMandateId ? { incomingMandateId: params.incomingMandateId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.transitionPackage.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transitionPackage.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.transitionPackage.findUnique({ where: { id } });
  },

  create(data: {
    outgoingMandateId: string;
    incomingMandateId?: string;
    recommendations?: string;
    createdById: string;
  }) {
    return prisma.transitionPackage.create({ data });
  },

  update(id: string, data: Prisma.TransitionPackageUpdateInput) {
    return prisma.transitionPackage.update({ where: { id }, data });
  },
};

export const transitionChecklistRepository = {
  findByPackage(transitionPackageId: string) {
    return prisma.transitionChecklistItem.findMany({
      where: { transitionPackageId },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.transitionChecklistItem.findUnique({ where: { id } });
  },

  create(data: { label: string; transitionPackageId: string }) {
    return prisma.transitionChecklistItem.create({ data });
  },

  update(id: string, data: Prisma.TransitionChecklistItemUpdateInput) {
    return prisma.transitionChecklistItem.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.transitionChecklistItem.delete({ where: { id } });
  },
};
