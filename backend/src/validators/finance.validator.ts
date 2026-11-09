import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const typeSchema = z.enum(["INCOME", "EXPENSE"]);

export const createTransactionSchema = z.object({
  type: typeSchema,
  amount: z.coerce.number().positive("Le montant doit être positif"),
  currency: z.string().trim().min(1).default("XOF"),
  category: z.string().trim().min(1, "La catégorie est requise"),
  description: z.string().trim().min(1).optional(),
  date: z.coerce.date(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
  documentId: objectIdString.optional(),
});

export const updateTransactionSchema = z.object({
  type: typeSchema.optional(),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  date: z.coerce.date().optional(),
  departmentId: objectIdString.nullable().optional(),
  mandateId: objectIdString.nullable().optional(),
  documentId: objectIdString.nullable().optional(),
});

const dateRangeFields = {
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

export const listTransactionsQuerySchema = paginationQuerySchema.extend({
  type: typeSchema.optional(),
  category: z.string().trim().min(1).optional(),
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
  ...dateRangeFields,
});

export const balanceQuerySchema = z.object({
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
  ...dateRangeFields,
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type BalanceQuery = z.infer<typeof balanceQuerySchema>;
