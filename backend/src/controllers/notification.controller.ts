import type { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import type { ListNotificationsQuery } from "../validators/notification.validator";

export const notificationController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListNotificationsQuery;
    const result = await notificationService.list(req.user!.sub, query);
    res.status(200).json({ success: true, ...result });
  },

  async markRead(req: Request, res: Response): Promise<void> {
    const notification = await notificationService.markRead(req.params.id, req.user!.sub);
    res.status(200).json({ success: true, data: notification });
  },

  async markAllRead(req: Request, res: Response): Promise<void> {
    await notificationService.markAllRead(req.user!.sub);
    res.status(200).json({ success: true, message: "Toutes les notifications ont été marquées comme lues" });
  },
};
