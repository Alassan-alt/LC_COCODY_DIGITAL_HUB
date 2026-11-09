import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const meetingRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    departmentId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.MeetingWhereInput = {
      ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.meeting.findMany({ where, skip: params.skip, take: params.take, orderBy: { date: "desc" } }),
      prisma.meeting.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.meeting.findUnique({ where: { id } });
  },

  create(data: {
    title: string;
    date: Date;
    agenda?: string;
    departmentId?: string;
    mandateId?: string;
    organizerId: string;
  }) {
    return prisma.meeting.create({ data });
  },

  update(id: string, data: Prisma.MeetingUpdateInput) {
    return prisma.meeting.update({ where: { id }, data });
  },

  countDecisions(meetingId: string) {
    return prisma.meetingDecision.count({ where: { meetingId } });
  },

  delete(id: string) {
    return prisma.meeting.delete({ where: { id } });
  },
};

export const meetingDecisionRepository = {
  findByMeeting(meetingId: string) {
    return prisma.meetingDecision.findMany({ where: { meetingId }, orderBy: { createdAt: "asc" } });
  },

  create(data: {
    description: string;
    dueDate?: Date;
    meetingId: string;
    responsibleId: string;
    generatedTaskId?: string;
  }) {
    return prisma.meetingDecision.create({ data });
  },

  setGeneratedTask(id: string, generatedTaskId: string) {
    return prisma.meetingDecision.update({ where: { id }, data: { generatedTaskId } });
  },
};
