import type { Request, Response } from "express";
import { taskService } from "../services/task.service";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "../validators/task.validator";

export const taskController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await taskService.list(req.query as unknown as ListTasksQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const task = await taskService.getById(req.params.id);
    res.status(200).json({ success: true, data: task });
  },

  async create(req: Request, res: Response): Promise<void> {
    const task = await taskService.create(req.body as CreateTaskInput, req.user!.sub);
    res.status(201).json({ success: true, data: task });
  },

  async update(req: Request, res: Response): Promise<void> {
    const task = await taskService.update(req.params.id, req.body as UpdateTaskInput, {
      userId: req.user!.sub,
      role: req.user!.role,
    });
    res.status(200).json({ success: true, data: task });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await taskService.remove(req.params.id, { userId: req.user!.sub, role: req.user!.role });
    res.status(200).json({ success: true, message: "Tâche supprimée" });
  },
};
