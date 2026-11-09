import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const statusSchema = z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED"]);

export const createTransitionPackageSchema = z.object({
  outgoingMandateId: objectIdString,
  incomingMandateId: objectIdString.optional(),
  recommendations: z.string().trim().min(1).optional(),
});

export const updateTransitionPackageSchema = z.object({
  status: statusSchema.optional(),
  incomingMandateId: objectIdString.nullable().optional(),
  recommendations: z.string().trim().min(1).nullable().optional(),
});

export const listTransitionPackagesQuerySchema = paginationQuerySchema.extend({
  outgoingMandateId: objectIdString.optional(),
  incomingMandateId: objectIdString.optional(),
  status: statusSchema.optional(),
});

export const createChecklistItemSchema = z.object({
  label: z.string().trim().min(1, "Le libellé est requis"),
});

export const updateChecklistItemSchema = z.object({
  label: z.string().trim().min(1).optional(),
  isDone: z.boolean().optional(),
});

export type CreateTransitionPackageInput = z.infer<typeof createTransitionPackageSchema>;
export type UpdateTransitionPackageInput = z.infer<typeof updateTransitionPackageSchema>;
export type ListTransitionPackagesQuery = z.infer<typeof listTransitionPackagesQuerySchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
