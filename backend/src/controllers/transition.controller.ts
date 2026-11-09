import type { Request, Response } from "express";
import { transitionService } from "../services/transition.service";
import type {
  CreateChecklistItemInput,
  CreateTransitionPackageInput,
  ListTransitionPackagesQuery,
  UpdateChecklistItemInput,
  UpdateTransitionPackageInput,
} from "../validators/transition.validator";

export const transitionController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await transitionService.list(req.query as unknown as ListTransitionPackagesQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const transitionPackage = await transitionService.getById(req.params.id);
    res.status(200).json({ success: true, data: transitionPackage });
  },

  async getContent(req: Request, res: Response): Promise<void> {
    const content = await transitionService.getContent(req.params.id);
    res.status(200).json({ success: true, data: content });
  },

  async create(req: Request, res: Response): Promise<void> {
    const transitionPackage = await transitionService.create(
      req.body as CreateTransitionPackageInput,
      req.user!.sub,
    );
    res.status(201).json({ success: true, data: transitionPackage });
  },

  async update(req: Request, res: Response): Promise<void> {
    const transitionPackage = await transitionService.update(
      req.params.id,
      req.body as UpdateTransitionPackageInput,
    );
    res.status(200).json({ success: true, data: transitionPackage });
  },

  async listChecklist(req: Request, res: Response): Promise<void> {
    const checklist = await transitionService.listChecklist(req.params.id);
    res.status(200).json({ success: true, data: checklist });
  },

  async addChecklistItem(req: Request, res: Response): Promise<void> {
    const item = await transitionService.addChecklistItem(
      req.params.id,
      req.body as CreateChecklistItemInput,
    );
    res.status(201).json({ success: true, data: item });
  },

  async updateChecklistItem(req: Request, res: Response): Promise<void> {
    const item = await transitionService.updateChecklistItem(
      req.params.id,
      req.params.itemId,
      req.body as UpdateChecklistItemInput,
    );
    res.status(200).json({ success: true, data: item });
  },

  async deleteChecklistItem(req: Request, res: Response): Promise<void> {
    await transitionService.deleteChecklistItem(req.params.id, req.params.itemId);
    res.status(200).json({ success: true, message: "Élément de checklist supprimé" });
  },
};
