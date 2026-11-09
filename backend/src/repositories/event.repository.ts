import type { AttendanceStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const eventRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    departmentId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.EventWhereInput = {
      ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.event.findMany({ where, skip: params.skip, take: params.take, orderBy: { startDate: "desc" } }),
      prisma.event.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  },

  create(data: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    departmentId?: string;
    mandateId?: string;
    organizerId: string;
  }) {
    return prisma.event.create({ data });
  },

  update(id: string, data: Prisma.EventUpdateInput) {
    return prisma.event.update({ where: { id }, data });
  },

  countAttendances(eventId: string) {
    return prisma.attendance.count({ where: { eventId } });
  },

  delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },
};

export const attendanceRepository = {
  findByEvent(eventId: string) {
    return prisma.attendance.findMany({ where: { eventId }, orderBy: { checkedInAt: "asc" } });
  },

  findByEventAndUser(eventId: string, userId: string) {
    return prisma.attendance.findUnique({ where: { eventId_userId: { eventId, userId } } });
  },

  findById(id: string) {
    return prisma.attendance.findUnique({ where: { id } });
  },

  upsert(eventId: string, userId: string, status: AttendanceStatus) {
    return prisma.attendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status },
    });
  },

  updateStatus(id: string, status: AttendanceStatus) {
    return prisma.attendance.update({ where: { id }, data: { status } });
  },
};
