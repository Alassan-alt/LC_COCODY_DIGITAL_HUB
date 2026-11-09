import type { Request, Response } from "express";
import { eventService } from "../services/event.service";
import type {
  CreateEventInput,
  ListEventsQuery,
  MarkAttendanceInput,
  UpdateAttendanceInput,
  UpdateEventInput,
} from "../validators/event.validator";

export const eventController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await eventService.list(req.query as unknown as ListEventsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const event = await eventService.getById(req.params.id);
    res.status(200).json({ success: true, data: event });
  },

  async create(req: Request, res: Response): Promise<void> {
    const event = await eventService.create(req.body as CreateEventInput, req.user!.sub);
    res.status(201).json({ success: true, data: event });
  },

  async update(req: Request, res: Response): Promise<void> {
    const event = await eventService.update(req.params.id, req.body as UpdateEventInput);
    res.status(200).json({ success: true, data: event });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await eventService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Événement supprimé" });
  },

  async listAttendances(req: Request, res: Response): Promise<void> {
    const attendances = await eventService.listAttendances(req.params.id);
    res.status(200).json({ success: true, data: attendances });
  },

  async markAttendance(req: Request, res: Response): Promise<void> {
    const attendance = await eventService.markAttendance(req.params.id, req.body as MarkAttendanceInput, {
      userId: req.user!.sub,
      role: req.user!.role,
    });
    res.status(201).json({ success: true, data: attendance });
  },

  async updateAttendance(req: Request, res: Response): Promise<void> {
    const { status } = req.body as UpdateAttendanceInput;
    const attendance = await eventService.updateAttendance(req.params.id, req.params.attendanceId, status, {
      role: req.user!.role,
    });
    res.status(200).json({ success: true, data: attendance });
  },
};
