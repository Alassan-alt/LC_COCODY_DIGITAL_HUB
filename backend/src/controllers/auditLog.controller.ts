import type { Request, Response } from "express";
import { auditLogService } from "../services/auditLog.service";
import type { ListAuditLogsQuery } from "../validators/auditLog.validator";

export const auditLogController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await auditLogService.list(req.query as unknown as ListAuditLogsQuery);
    res.status(200).json({ success: true, ...result });
  },
};
