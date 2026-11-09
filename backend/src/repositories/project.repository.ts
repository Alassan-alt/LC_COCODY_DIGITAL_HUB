import type { Prisma, ProjectStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export const projectRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    status?: ProjectStatus;
    departmentId?: string;
    mandateId?: string;
  }) {
    const where: Prisma.ProjectWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
      prisma.project.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.project.findUnique({ where: { id } });
  },

  create(data: {
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    departmentId?: string;
    mandateId?: string;
    ownerId: string;
  }) {
    return prisma.project.create({ data });
  },

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({ where: { id }, data });
  },

  countTasks(projectId: string) {
    return prisma.task.count({ where: { projectId } });
  },

  delete(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};
