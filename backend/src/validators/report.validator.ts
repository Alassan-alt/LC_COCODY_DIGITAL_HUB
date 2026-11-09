import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const reportTypeSchema = z.enum(["MONTHLY", "DEPARTMENTAL", "MANDATE"]);

export const createReportSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  type: reportTypeSchema,
  period: z.string().trim().min(1, "La période est requise"),
  content: z.string().trim().min(1).optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
  documentId: objectIdString.optional(),
});

export const updateReportSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).nullable().optional(),
  documentId: objectIdString.nullable().optional(),
});

export const listReportsQuerySchema = paginationQuerySchema.extend({
  type: reportTypeSchema.optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const generateReportSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  type: reportTypeSchema,
  period: z.string().trim().min(1, "La période est requise"),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
