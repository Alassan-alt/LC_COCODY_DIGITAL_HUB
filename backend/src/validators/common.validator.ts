import { z } from "zod";

/**
 * `z.coerce.boolean()` transforme toute chaîne non vide (y compris "false")
 * en `true` — piège classique de Zod avec les query params HTTP, qui sont
 * toujours des chaînes. On accepte explicitement "true"/"false".
 */
export const booleanQueryParam = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
