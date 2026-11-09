import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  date: z.coerce.date(),
  agenda: z.string().trim().min(1).optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).optional(),
  date: z.coerce.date().optional(),
  agenda: z.string().trim().min(1).nullable().optional(),
  minutes: z.string().trim().min(1).nullable().optional(),
});

export const listMeetingsQuerySchema = paginationQuerySchema.extend({
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const createDecisionSchema = z.object({
  description: z.string().trim().min(1, "La description de la décision est requise"),
  responsibleId: objectIdString,
  dueDate: z.coerce.date().optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type ListMeetingsQuery = z.infer<typeof listMeetingsQuerySchema>;
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
