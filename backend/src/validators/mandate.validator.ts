import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

export const createMandateSchema = z
  .object({
    label: z.string().trim().min(1, "Le libellé est requis"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["endDate"],
  });

export const updateMandateSchema = z.object({
  label: z.string().trim().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["ACTIVE", "CLOSED"]).optional(),
});

export const listMandatesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["ACTIVE", "CLOSED"]).optional(),
});

export type CreateMandateInput = z.infer<typeof createMandateSchema>;
export type UpdateMandateInput = z.infer<typeof updateMandateSchema>;
export type ListMandatesQuery = z.infer<typeof listMandatesQuerySchema>;
