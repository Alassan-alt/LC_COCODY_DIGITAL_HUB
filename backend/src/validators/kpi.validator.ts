import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");

export const createKpiSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  target: z.coerce.number().positive("L'objectif doit être positif"),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().trim().min(1).optional(),
  period: z.string().trim().min(1, "La période est requise"),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const updateKpiSchema = z.object({
  name: z.string().trim().min(1).optional(),
  target: z.coerce.number().positive().optional(),
  currentValue: z.coerce.number().min(0).optional(),
  unit: z.string().trim().min(1).nullable().optional(),
  period: z.string().trim().min(1).optional(),
  departmentId: objectIdString.nullable().optional(),
  mandateId: objectIdString.nullable().optional(),
});

export const listKpisQuerySchema = paginationQuerySchema.extend({
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export type CreateKpiInput = z.infer<typeof createKpiSchema>;
export type UpdateKpiInput = z.infer<typeof updateKpiSchema>;
export type ListKpisQuery = z.infer<typeof listKpisQuerySchema>;
