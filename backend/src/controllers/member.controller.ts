import type { Request, Response } from "express";
import { memberService } from "../services/member.service";
import type {
  CreateMemberInput,
  ListMembersQuery,
  UpdateMemberInput,
} from "../validators/member.validator";

export const memberController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await memberService.list(req.query as unknown as ListMembersQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const member = await memberService.getById(req.params.id);
    res.status(200).json({ success: true, data: member });
  },

  async create(req: Request, res: Response): Promise<void> {
    const member = await memberService.create(req.body as CreateMemberInput, req.user!.sub);
    res.status(201).json({ success: true, data: member });
  },

  async update(req: Request, res: Response): Promise<void> {
    const member = await memberService.update(req.params.id, req.body as UpdateMemberInput, req.user!.sub);
    res.status(200).json({ success: true, data: member });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const member = await memberService.deactivate(req.params.id);
    res.status(200).json({ success: true, data: member });
  },
};
