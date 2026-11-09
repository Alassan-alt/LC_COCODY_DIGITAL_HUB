import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const visibilitySchema = z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]);

const tagsField = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value): string[] => {
    if (!value) return [];
    const list = Array.isArray(value) ? value : value.split(",");
    return list.map((tag) => tag.trim()).filter(Boolean);
  });

export const uploadDocumentSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  description: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  tags: tagsField,
  visibility: visibilitySchema.default("INTERNAL"),
  folderId: objectIdString.optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  category: z.string().trim().min(1).nullable().optional(),
  tags: z.array(z.string()).optional(),
  visibility: visibilitySchema.optional(),
  folderId: objectIdString.nullable().optional(),
});

export const newVersionSchema = z.object({
  changeNote: z.string().trim().min(1).optional(),
});

export const listDocumentsQuerySchema = paginationQuerySchema.extend({
  folderId: objectIdString.optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  visibility: visibilitySchema.optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type NewVersionInput = z.infer<typeof newVersionSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
