import { z } from "zod";
import { booleanQueryParam, paginationQuerySchema } from "./common.validator";

const roleSchema = z.enum(["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER", "MEMBER"]);

export const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: roleSchema.default("MEMBER"),
});

export const updateUserSchema = z.object({
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: roleSchema.optional(),
  isActive: booleanQueryParam.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
