import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const visibilitySchema = z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]);

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  visibility: visibilitySchema.default("INTERNAL"),
  parentFolderId: objectIdString.optional(),
  departmentId: objectIdString.optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1).optional(),
  visibility: visibilitySchema.optional(),
  departmentId: objectIdString.nullable().optional(),
});

export const listFoldersQuerySchema = paginationQuerySchema.extend({
  parentFolderId: objectIdString.optional(),
  departmentId: objectIdString.optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type ListFoldersQuery = z.infer<typeof listFoldersQuerySchema>;
