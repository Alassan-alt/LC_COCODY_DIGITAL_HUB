import type { Request, Response } from "express";
import { teamService } from "../services/team.service";
import type { CreateTeamInput, ListTeamsQuery, UpdateTeamInput } from "../validators/team.validator";

export const teamController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await teamService.list(req.query as unknown as ListTeamsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const team = await teamService.getById(req.params.id);
    res.status(200).json({ success: true, data: team });
  },

  async create(req: Request, res: Response): Promise<void> {
    const team = await teamService.create(req.body as CreateTeamInput);
    res.status(201).json({ success: true, data: team });
  },

  async update(req: Request, res: Response): Promise<void> {
    const team = await teamService.update(req.params.id, req.body as UpdateTeamInput);
    res.status(200).json({ success: true, data: team });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await teamService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Équipe supprimée" });
  },
};
