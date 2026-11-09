import { z } from "zod";

export const upsertLessonLearnedSchema = z.object({
  whatWorked: z.string().trim().min(1).optional(),
  whatDidNotWork: z.string().trim().min(1).optional(),
  difficulties: z.string().trim().min(1).optional(),
  recommendations: z.string().trim().min(1).optional(),
  lessonsLearned: z.string().trim().min(1).optional(),
});

export type UpsertLessonLearnedInput = z.infer<typeof upsertLessonLearnedSchema>;
