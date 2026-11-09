import type { Request, Response } from "express";
import { userService } from "../services/user.service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "../validators/user.validator";

export const userController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await userService.list(req.query as unknown as ListUsersQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const user = await userService.getById(req.params.id);
    res.status(200).json({ success: true, data: user });
  },

  async create(req: Request, res: Response): Promise<void> {
    const user = await userService.create(req.body as CreateUserInput);
    res.status(201).json({ success: true, data: user });
  },

  async update(req: Request, res: Response): Promise<void> {
    const user = await userService.update(req.params.id, req.body as UpdateUserInput);
    res.status(200).json({ success: true, data: user });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const user = await userService.deactivate(req.params.id);
    res.status(200).json({ success: true, data: user });
  },
};
