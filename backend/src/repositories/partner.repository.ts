import type { PartnerStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const partnerRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    status?: PartnerStatus;
    responsibleId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.PartnerWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.responsibleId ? { responsibleId: params.responsibleId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.partner.findMany({ where, skip: params.skip, take: params.take, orderBy: { updatedAt: "desc" } }),
      prisma.partner.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.partner.findUnique({ where: { id } });
  },

  create(data: {
    name: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    responsibleId: string;
    mandateId?: string;
  }) {
    return prisma.partner.create({ data });
  },

  update(id: string, data: Prisma.PartnerUpdateInput) {
    return prisma.partner.update({ where: { id }, data });
  },

  countActivities(partnerId: string) {
    return prisma.partnerActivity.count({ where: { partnerId } });
  },

  delete(id: string) {
    return prisma.partner.delete({ where: { id } });
  },
};

export const partnerActivityRepository = {
  findByPartner(partnerId: string) {
    return prisma.partnerActivity.findMany({ where: { partnerId }, orderBy: { createdAt: "asc" } });
  },

  create(data: {
    note: string;
    fromStatus?: PartnerStatus;
    toStatus?: PartnerStatus;
    partnerId: string;
    authorId: string;
  }) {
    return prisma.partnerActivity.create({ data });
  },
};
