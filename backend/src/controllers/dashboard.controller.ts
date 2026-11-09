import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { resolveAccessContext } from "../utils/requestContext";

export const dashboardController = {
  async get(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const dashboard = await dashboardService.getDashboard(ctx);
    res.status(200).json({ success: true, data: dashboard });
  },
};
