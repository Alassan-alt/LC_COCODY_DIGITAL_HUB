import type { Request, Response } from "express";
import { reportService } from "../services/report.service";
import type {
  CreateReportInput,
  GenerateReportInput,
  ListReportsQuery,
  UpdateReportInput,
} from "../validators/report.validator";

export const reportController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await reportService.list(req.query as unknown as ListReportsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const report = await reportService.getById(req.params.id);
    res.status(200).json({ success: true, data: report });
  },

  async create(req: Request, res: Response): Promise<void> {
    const report = await reportService.create(req.body as CreateReportInput, req.user!.sub);
    res.status(201).json({ success: true, data: report });
  },

  async generate(req: Request, res: Response): Promise<void> {
    const report = await reportService.generate(req.body as GenerateReportInput, req.user!.sub);
    res.status(201).json({ success: true, data: report });
  },

  async update(req: Request, res: Response): Promise<void> {
    const report = await reportService.update(req.params.id, req.body as UpdateReportInput);
    res.status(200).json({ success: true, data: report });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await reportService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Rapport supprimé" });
  },
};
