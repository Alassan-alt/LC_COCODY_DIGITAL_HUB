import type { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";

export const notificationRepository = {
  async findMany(params: { userId: string; skip: number; take: number; isRead?: boolean }) {
    const where = {
      userId: params.userId,
      ...(params.isRead !== undefined ? { isRead: params.isRead } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
      prisma.notification.count({ where }),
    ]);

    return { items, total };
  },

  countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  },

  create(data: {
    type: NotificationType;
    message: string;
    userId: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    return prisma.notification.create({ data });
  },

  createMany(
    data: Array<{
      type: NotificationType;
      message: string;
      userId: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }>,
  ) {
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return prisma.notification.createMany({ data });
  },

  existsForEntity(userId: string, type: NotificationType, relatedEntityId: string) {
    return prisma.notification
      .findFirst({ where: { userId, type, relatedEntityId }, select: { id: true } })
      .then((n) => n !== null);
  },

  markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};
