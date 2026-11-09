import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");

const actionSchema = z.enum([
  "LOGIN",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DOWNLOADED",
  "DOCUMENT_UPDATED",
  "DOCUMENT_DELETED",
  "MEMBER_CREATED",
  "MEMBER_UPDATED",
  "TASK_CREATED",
]);

export const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  userId: objectIdString.optional(),
  action: actionSchema.optional(),
  entityType: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
