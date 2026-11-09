import type { Request, Response } from "express";
import { projectService } from "../services/project.service";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "../validators/project.validator";

export const projectController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await projectService.list(req.query as unknown as ListProjectsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const project = await projectService.getById(req.params.id);
    res.status(200).json({ success: true, data: project });
  },

  async create(req: Request, res: Response): Promise<void> {
    const project = await projectService.create(req.body as CreateProjectInput, req.user!.sub);
    res.status(201).json({ success: true, data: project });
  },

  async update(req: Request, res: Response): Promise<void> {
    const project = await projectService.update(req.params.id, req.body as UpdateProjectInput);
    res.status(200).json({ success: true, data: project });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await projectService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Projet supprimé" });
  },

  async getBoard(req: Request, res: Response): Promise<void> {
    const board = await projectService.getBoard(req.params.id);
    res.status(200).json({ success: true, data: board });
  },
};
