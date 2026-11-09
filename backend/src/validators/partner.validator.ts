import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const statusSchema = z.enum(["PROSPECT", "CONTACTED", "MEETING", "NEGOTIATION", "PARTNER", "LOST"]);

export const createPartnerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  contactName: z.string().trim().min(1).optional(),
  contactEmail: z.string().trim().email("Email de contact invalide").optional(),
  contactPhone: z.string().trim().min(1).optional(),
  responsibleId: objectIdString,
  mandateId: objectIdString.optional(),
});

export const updatePartnerSchema = z.object({
  name: z.string().trim().min(1).optional(),
  contactName: z.string().trim().min(1).nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional(),
  contactPhone: z.string().trim().min(1).nullable().optional(),
  responsibleId: objectIdString.optional(),
  mandateId: objectIdString.nullable().optional(),
});

export const listPartnersQuerySchema = paginationQuerySchema.extend({
  status: statusSchema.optional(),
  responsibleId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

export const addActivitySchema = z.object({
  note: z.string().trim().min(1, "La note est requise"),
  status: statusSchema.optional(),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type ListPartnersQuery = z.infer<typeof listPartnersQuerySchema>;
export type AddActivityInput = z.infer<typeof addActivitySchema>;
