import type { Request, Response } from "express";
import { folderService } from "../services/folder.service";
import { resolveAccessContext } from "../utils/requestContext";
import type {
  CreateFolderInput,
  ListFoldersQuery,
  UpdateFolderInput,
} from "../validators/folder.validator";

export const folderController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const result = await folderService.list(req.query as unknown as ListFoldersQuery, ctx);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const folder = await folderService.getById(req.params.id, ctx);
    res.status(200).json({ success: true, data: folder });
  },

  async create(req: Request, res: Response): Promise<void> {
    const folder = await folderService.create(req.body as CreateFolderInput, req.user!.sub);
    res.status(201).json({ success: true, data: folder });
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const folder = await folderService.update(req.params.id, req.body as UpdateFolderInput, ctx);
    res.status(200).json({ success: true, data: folder });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    await folderService.remove(req.params.id, ctx);
    res.status(200).json({ success: true, message: "Dossier supprimé" });
  },
};
