import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  departmentId: objectIdString,
  mandateId: objectIdString,
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1).optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const listTeamsQuerySchema = paginationQuerySchema.extend({
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
