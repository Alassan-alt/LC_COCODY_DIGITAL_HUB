import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const memberRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    departmentId?: string;
    teamId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.MemberProfileWhereInput = {
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: "insensitive" } },
              { lastName: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.teamId ? { teamId: params.teamId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.memberProfile.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { lastName: "asc" },
        include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
      }),
      prisma.memberProfile.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.memberProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });
  },

  findByUserId(userId: string) {
    return prisma.memberProfile.findUnique({ where: { userId } });
  },

  async findUserIdsByDepartment(departmentId: string): Promise<string[]> {
    const profiles = await prisma.memberProfile.findMany({
      where: { departmentId },
      select: { userId: true },
    });
    return profiles.map((p) => p.userId);
  },

  create(data: Prisma.MemberProfileCreateInput) {
    return prisma.memberProfile.create({
      data,
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });
  },

  update(id: string, data: Prisma.MemberProfileUpdateInput) {
    return prisma.memberProfile.update({
      where: { id },
      data,
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });
  },
};
