import type { Role } from "@prisma/client";
import { attendanceRepository, eventRepository } from "../repositories/event.repository";
import { departmentRepository } from "../repositories/department.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateEventInput,
  ListEventsQuery,
  MarkAttendanceInput,
  UpdateEventInput,
} from "../validators/event.validator";
import { notificationService } from "./notification.service";

const MANAGER_ROLES: Role[] = ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"];

export const eventService = {
  async list(query: ListEventsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await eventRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new AppError("Événement introuvable", 404);
    }
    return event;
  },

  async create(input: CreateEventInput, organizerId: string) {
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
    const event = await eventRepository.create({ ...input, organizerId });

    await notificationService.notifyDepartment(input.departmentId, "EVENT_NEW", `Nouvel événement : « ${input.title} »`, {
      relatedEntityType: "Event",
      relatedEntityId: event.id,
      excludeUserId: organizerId,
    });

    return event;
  },

  async update(id: string, input: UpdateEventInput) {
    await this.getById(id);
    return eventRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const attendanceCount = await eventRepository.countAttendances(id);
    if (attendanceCount > 0) {
      throw new AppError("Impossible de supprimer un événement ayant des présences enregistrées", 409);
    }
    await eventRepository.delete(id);
  },

  async listAttendances(eventId: string) {
    await this.getById(eventId);
    return attendanceRepository.findByEvent(eventId);
  },

  async markAttendance(eventId: string, input: MarkAttendanceInput, ctx: { userId: string; role: Role }) {
    await this.getById(eventId);

    const targetUserId = input.userId ?? ctx.userId;
    if (targetUserId !== ctx.userId && !MANAGER_ROLES.includes(ctx.role)) {
      throw new AppError("Seul un responsable peut enregistrer la présence d'une autre personne", 403);
    }

    return attendanceRepository.upsert(eventId, targetUserId, input.status);
  },

  async updateAttendance(
    eventId: string,
    attendanceId: string,
    status: "PRESENT" | "ABSENT" | "EXCUSED",
    ctx: { role: Role },
  ) {
    await this.getById(eventId);
    if (!MANAGER_ROLES.includes(ctx.role)) {
      throw new AppError("Seul un responsable peut modifier une présence enregistrée", 403);
    }
    const attendance = await attendanceRepository.findById(attendanceId);
    if (!attendance || attendance.eventId !== eventId) {
      throw new AppError("Présence introuvable pour cet événement", 404);
    }
    return attendanceRepository.updateStatus(attendanceId, status);
  },
};
