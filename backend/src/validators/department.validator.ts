import { z } from "zod";
import { booleanQueryParam, paginationQuerySchema } from "./common.validator";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  description: z.string().trim().min(1).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listDepartmentsQuerySchema = paginationQuerySchema.extend({
  isActive: booleanQueryParam.optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
