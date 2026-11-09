import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const statusSchema = z.enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  description: z.string().trim().min(1).optional(),
  status: statusSchema.default("PLANNED"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  status: statusSchema.optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  departmentId: objectIdString.nullable().optional(),
  mandateId: objectIdString.nullable().optional(),
});

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  status: statusSchema.optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
