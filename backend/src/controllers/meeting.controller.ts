import type { Request, Response } from "express";
import { meetingService } from "../services/meeting.service";
import type {
  CreateDecisionInput,
  CreateMeetingInput,
  ListMeetingsQuery,
  UpdateMeetingInput,
} from "../validators/meeting.validator";

export const meetingController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await meetingService.list(req.query as unknown as ListMeetingsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const meeting = await meetingService.getById(req.params.id);
    res.status(200).json({ success: true, data: meeting });
  },

  async create(req: Request, res: Response): Promise<void> {
    const meeting = await meetingService.create(req.body as CreateMeetingInput, req.user!.sub);
    res.status(201).json({ success: true, data: meeting });
  },

  async update(req: Request, res: Response): Promise<void> {
    const meeting = await meetingService.update(req.params.id, req.body as UpdateMeetingInput);
    res.status(200).json({ success: true, data: meeting });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await meetingService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Réunion supprimée" });
  },

  async listDecisions(req: Request, res: Response): Promise<void> {
    const decisions = await meetingService.listDecisions(req.params.id);
    res.status(200).json({ success: true, data: decisions });
  },

  async createDecision(req: Request, res: Response): Promise<void> {
    const decision = await meetingService.createDecision(
      req.params.id,
      req.body as CreateDecisionInput,
      req.user!.sub,
    );
    res.status(201).json({ success: true, data: decision });
  },
};
