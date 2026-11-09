import type { Role, Task } from "@prisma/client";
import { projectRepository } from "../repositories/project.repository";
import { taskRepository } from "../repositories/task.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import { withEffectiveStatus } from "../utils/taskStatus";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "../validators/task.validator";
import { recordAuditLog } from "./audit.service";
import { notificationService } from "./notification.service";

const MANAGER_ROLES: Role[] = ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"];

function canModify(task: Pick<Task, "createdById" | "assigneeId">, ctx: { userId: string; role: Role }): boolean {
  return (
    MANAGER_ROLES.includes(ctx.role) ||
    task.createdById === ctx.userId ||
    task.assigneeId === ctx.userId
  );
}

export const taskService = {
  async list(query: ListTasksQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await taskRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      status: query.status,
      priority: query.priority,
      projectId: query.projectId,
      assigneeId: query.assigneeId,
    });
    return buildPaginatedResult(items.map(withEffectiveStatus), total, query.page, query.limit);
  },

  async getById(id: string) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError("Tâche introuvable", 404);
    }
    return withEffectiveStatus(task);
  },

  async create(input: CreateTaskInput, createdById: string) {
    if (input.projectId) {
      const project = await projectRepository.findById(input.projectId);
      if (!project) {
        throw new AppError("Projet introuvable", 404);
      }
    }

    const task = await taskRepository.create({ ...input, createdById });

    await recordAuditLog({
      action: "TASK_CREATED",
      entityType: "Task",
      entityId: task.id,
      userId: createdById,
      metadata: { title: input.title, projectId: input.projectId },
    });

    if (task.assigneeId && task.assigneeId !== createdById) {
      await notificationService.notifyUser(
        task.assigneeId,
        "TASK_ASSIGNED",
        `Une nouvelle tâche vous a été assignée : « ${task.title} »`,
        "Task",
        task.id,
      );
    }

    return withEffectiveStatus(task);
  },

  async update(id: string, input: UpdateTaskInput, ctx: { userId: string; role: Role }) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError("Tâche introuvable", 404);
    }
    if (!canModify(task, ctx)) {
      throw new AppError("Seul le créateur, l'assigné ou un responsable peut modifier cette tâche", 403);
    }
    if (input.projectId) {
      const project = await projectRepository.findById(input.projectId);
      if (!project) {
        throw new AppError("Projet introuvable", 404);
      }
    }
    const updated = await taskRepository.update(id, input);

    if (
      input.assigneeId &&
      input.assigneeId !== task.assigneeId &&
      input.assigneeId !== ctx.userId
    ) {
      await notificationService.notifyUser(
        input.assigneeId,
        "TASK_ASSIGNED",
        `Une tâche vous a été assignée : « ${updated.title} »`,
        "Task",
        updated.id,
      );
    }

    return withEffectiveStatus(updated);
  },

  async remove(id: string, ctx: { userId: string; role: Role }) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError("Tâche introuvable", 404);
    }
    if (!canModify(task, ctx)) {
      throw new AppError("Seul le créateur, l'assigné ou un responsable peut supprimer cette tâche", 403);
    }
    await taskRepository.delete(id);
  },
};
