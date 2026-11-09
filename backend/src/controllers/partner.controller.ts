import type { Request, Response } from "express";
import { partnerService } from "../services/partner.service";
import type {
  AddActivityInput,
  CreatePartnerInput,
  ListPartnersQuery,
  UpdatePartnerInput,
} from "../validators/partner.validator";

export const partnerController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await partnerService.list(req.query as unknown as ListPartnersQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const partner = await partnerService.getById(req.params.id);
    res.status(200).json({ success: true, data: partner });
  },

  async create(req: Request, res: Response): Promise<void> {
    const partner = await partnerService.create(req.body as CreatePartnerInput);
    res.status(201).json({ success: true, data: partner });
  },

  async update(req: Request, res: Response): Promise<void> {
    const partner = await partnerService.update(req.params.id, req.body as UpdatePartnerInput);
    res.status(200).json({ success: true, data: partner });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await partnerService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Partenaire supprimé" });
  },

  async listActivities(req: Request, res: Response): Promise<void> {
    const activities = await partnerService.listActivities(req.params.id);
    res.status(200).json({ success: true, data: activities });
  },

  async addActivity(req: Request, res: Response): Promise<void> {
    const activity = await partnerService.addActivity(
      req.params.id,
      req.body as AddActivityInput,
      req.user!.sub,
    );
    res.status(201).json({ success: true, data: activity });
  },
};
