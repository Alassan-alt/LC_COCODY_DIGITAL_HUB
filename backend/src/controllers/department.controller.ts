import type { Request, Response } from "express";
import { departmentService } from "../services/department.service";
import type {
  CreateDepartmentInput,
  ListDepartmentsQuery,
  UpdateDepartmentInput,
} from "../validators/department.validator";

export const departmentController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await departmentService.list(req.query as unknown as ListDepartmentsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const department = await departmentService.getById(req.params.id);
    res.status(200).json({ success: true, data: department });
  },

  async create(req: Request, res: Response): Promise<void> {
    const department = await departmentService.create(req.body as CreateDepartmentInput);
    res.status(201).json({ success: true, data: department });
  },

  async update(req: Request, res: Response): Promise<void> {
    const department = await departmentService.update(req.params.id, req.body as UpdateDepartmentInput);
    res.status(200).json({ success: true, data: department });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const department = await departmentService.softDelete(req.params.id);
    res.status(200).json({ success: true, data: department });
  },
};
