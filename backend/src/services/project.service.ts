import type { TaskStatus } from "@prisma/client";
import { departmentRepository } from "../repositories/department.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { projectRepository } from "../repositories/project.repository";
import { taskRepository } from "../repositories/task.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import { withEffectiveStatus } from "../utils/taskStatus";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "../validators/project.validator";

export const projectService = {
  async list(query: ListProjectsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await projectRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      status: query.status,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError("Projet introuvable", 404);
    }
    return project;
  },

  async create(input: CreateProjectInput, ownerId: string) {
    if (input.departmentId) {
      const department = await departmentRepository.findById(input.departmentId);
      if (!department) {
        throw new AppError("Département introuvable", 404);
      }
    }
    if (input.mandateId) {
      const mandate = await mandateRepository.findById(input.mandateId);
      if (!mandate) {
        throw new AppError("Mandat introuvable", 404);
      }
    }
    return projectRepository.create({ ...input, ownerId });
  },

  async update(id: string, input: UpdateProjectInput) {
    await this.getById(id);
    if (input.departmentId) {
      const department = await departmentRepository.findById(input.departmentId);
      if (!department) {
        throw new AppError("Département introuvable", 404);
      }
    }
    if (input.mandateId) {
      const mandate = await mandateRepository.findById(input.mandateId);
      if (!mandate) {
        throw new AppError("Mandat introuvable", 404);
      }
    }
    return projectRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const taskCount = await projectRepository.countTasks(id);
    if (taskCount > 0) {
      throw new AppError("Impossible de supprimer un projet qui a encore des tâches", 409);
    }
    await projectRepository.delete(id);
  },

  /** Vue Kanban : tâches du projet groupées par statut effectif (TODO/IN_PROGRESS/DONE/OVERDUE). */
  async getBoard(id: string) {
    await this.getById(id);
    const tasks = (await taskRepository.findByProject(id)).map(withEffectiveStatus);

    const board: Record<TaskStatus, typeof tasks> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      OVERDUE: [],
    };
    for (const task of tasks) {
      board[task.status].push(task);
    }
    return board;
  },
};
