import type { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma";

export const userRepository = {
  async findMany(params: { skip: number; take: number; search?: string; role?: Role; isActive?: boolean }) {
    const where: Prisma.UserWhereInput = {
      ...(params.search ? { email: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { email: "asc" },
        include: { memberProfile: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },

  create(data: { email: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data });
  },

  updateRoleAndStatus(id: string, data: { role?: Role; isActive?: boolean }) {
    return prisma.user.update({ where: { id }, data });
  },

  deactivate(id: string) {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { memberProfile: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { memberProfile: true },
    });
  },

  createWithMemberProfile(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        memberProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      },
      include: { memberProfile: true },
    });
  },

  updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  },
};
