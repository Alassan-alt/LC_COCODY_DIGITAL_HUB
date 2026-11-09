import type { Request, Response } from "express";
import { lessonLearnedService } from "../services/lessonLearned.service";
import type { UpsertLessonLearnedInput } from "../validators/lessonLearned.validator";

export const lessonLearnedController = {
  async getByProject(req: Request, res: Response): Promise<void> {
    const lessonLearned = await lessonLearnedService.getByProject(req.params.id);
    res.status(200).json({ success: true, data: lessonLearned });
  },

  async upsert(req: Request, res: Response): Promise<void> {
    const lessonLearned = await lessonLearnedService.upsert(
      req.params.id,
      req.body as UpsertLessonLearnedInput,
      req.user!.sub,
    );
    res.status(200).json({ success: true, data: lessonLearned });
  },
};
