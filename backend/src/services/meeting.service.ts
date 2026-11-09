import { meetingDecisionRepository, meetingRepository } from "../repositories/meeting.repository";
import { departmentRepository } from "../repositories/department.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateDecisionInput,
  CreateMeetingInput,
  ListMeetingsQuery,
  UpdateMeetingInput,
} from "../validators/meeting.validator";
import { notificationService } from "./notification.service";
import { taskService } from "./task.service";

export const meetingService = {
  async list(query: ListMeetingsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await meetingRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw new AppError("Réunion introuvable", 404);
    }
    return meeting;
  },

  async create(input: CreateMeetingInput, organizerId: string) {
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
    const meeting = await meetingRepository.create({ ...input, organizerId });

    await notificationService.notifyDepartment(
      input.departmentId,
      "MEETING_NEW",
      `Nouvelle réunion : « ${input.title} »`,
      { relatedEntityType: "Meeting", relatedEntityId: meeting.id, excludeUserId: organizerId },
    );

    return meeting;
  },

  async update(id: string, input: UpdateMeetingInput) {
    await this.getById(id);
    return meetingRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const decisionCount = await meetingRepository.countDecisions(id);
    if (decisionCount > 0) {
      throw new AppError("Impossible de supprimer une réunion ayant des décisions enregistrées", 409);
    }
    await meetingRepository.delete(id);
  },

  async listDecisions(meetingId: string) {
    await this.getById(meetingId);
    return meetingDecisionRepository.findByMeeting(meetingId);
  },

  /**
   * Workflow explicite instruction.md Phase 9 :
   * Réunion → Décision → Responsable → Tâche → Deadline.
   * Chaque décision de réunion génère automatiquement une tâche assignée à
   * son responsable, avec la même échéance (voir PHASE0_ANALYSIS.md §8.3).
   */
  async createDecision(meetingId: string, input: CreateDecisionInput, createdById: string) {
    await this.getById(meetingId);

    const decision = await meetingDecisionRepository.create({
      description: input.description,
      dueDate: input.dueDate,
      meetingId,
      responsibleId: input.responsibleId,
    });

    const task = await taskService.create(
      {
        title: decision.description,
        status: "TODO",
        priority: "MEDIUM",
        dueDate: input.dueDate,
        assigneeId: input.responsibleId,
      },
      createdById,
    );

    return meetingDecisionRepository.setGeneratedTask(decision.id, task.id);
  },
};
