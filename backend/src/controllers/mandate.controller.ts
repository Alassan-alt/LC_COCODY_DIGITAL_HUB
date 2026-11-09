import type { Request, Response } from "express";
import { mandateService } from "../services/mandate.service";
import type {
  CreateMandateInput,
  ListMandatesQuery,
  UpdateMandateInput,
} from "../validators/mandate.validator";

export const mandateController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await mandateService.list(req.query as unknown as ListMandatesQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const mandate = await mandateService.getById(req.params.id);
    res.status(200).json({ success: true, data: mandate });
  },

  async create(req: Request, res: Response): Promise<void> {
    const mandate = await mandateService.create(req.body as CreateMandateInput);
    res.status(201).json({ success: true, data: mandate });
  },

  async update(req: Request, res: Response): Promise<void> {
    const mandate = await mandateService.update(req.params.id, req.body as UpdateMandateInput);
    res.status(200).json({ success: true, data: mandate });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const mandate = await mandateService.close(req.params.id);
    res.status(200).json({ success: true, data: mandate });
  },
};
