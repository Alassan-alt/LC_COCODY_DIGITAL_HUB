import { z } from "zod";
import { booleanQueryParam, paginationQuerySchema } from "./common.validator";

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  isRead: booleanQueryParam.optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
