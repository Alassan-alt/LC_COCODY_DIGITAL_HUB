import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");

export const createMemberSchema = z.object({
  userId: objectIdString,
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
  departmentId: objectIdString.optional(),
  teamId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const updateMemberSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  position: z.string().trim().min(1).nullable().optional(),
  departmentId: objectIdString.nullable().optional(),
  teamId: objectIdString.nullable().optional(),
  mandateId: objectIdString.nullable().optional(),
});

export const listMembersQuerySchema = paginationQuerySchema.extend({
  departmentId: objectIdString.optional(),
  teamId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
