import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

/**
 * OVERDUE n'est pas toujours une valeur stockée : une tâche TODO/IN_PROGRESS
 * dont l'échéance est passée est considérée OVERDUE dynamiquement (voir
 * `task.service.ts` → `withEffectiveStatus`). Ce filtre reflète la même
 * règle côté requête pour que la liste et l'affichage restent cohérents.
 */
function buildStatusWhere(status?: TaskStatus): Prisma.TaskWhereInput {
  if (!status) return {};
  const now = new Date();

  if (status === "OVERDUE") {
    return {
      OR: [{ status: "OVERDUE" }, { status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { lt: now } }],
    };
  }

  if (status === "TODO" || status === "IN_PROGRESS") {
    return { status, OR: [{ dueDate: null }, { dueDate: { gte: now } }] };
  }

  return { status };
}

export const taskRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
    assigneeId?: string;
  }) {
    const where: Prisma.TaskWhereInput = {
      AND: [
        params.search ? { title: { contains: params.search, mode: "insensitive" } } : {},
        params.priority ? { priority: params.priority } : {},
        params.projectId ? { projectId: params.projectId } : {},
        params.assigneeId ? { assigneeId: params.assigneeId } : {},
        buildStatusWhere(params.status),
      ],
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
      prisma.task.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.task.findUnique({ where: { id } });
  },

  findByProject(projectId: string) {
    return prisma.task.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
  },

  create(data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Date;
    projectId?: string;
    assigneeId?: string;
    createdById: string;
  }) {
    return prisma.task.create({ data });
  },

  update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },
};
