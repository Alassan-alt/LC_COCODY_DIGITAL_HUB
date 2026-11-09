import type { Request, Response } from "express";
import { kpiService } from "../services/kpi.service";
import type { CreateKpiInput, ListKpisQuery, UpdateKpiInput } from "../validators/kpi.validator";

export const kpiController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await kpiService.list(req.query as unknown as ListKpisQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const kpi = await kpiService.getById(req.params.id);
    res.status(200).json({ success: true, data: kpi });
  },

  async create(req: Request, res: Response): Promise<void> {
    const kpi = await kpiService.create(req.body as CreateKpiInput, req.user!.sub);
    res.status(201).json({ success: true, data: kpi });
  },

  async update(req: Request, res: Response): Promise<void> {
    const kpi = await kpiService.update(req.params.id, req.body as UpdateKpiInput);
    res.status(200).json({ success: true, data: kpi });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await kpiService.remove(req.params.id);
    res.status(200).json({ success: true, message: "KPI supprimé" });
  },
};
