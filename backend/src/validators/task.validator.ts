import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");
const statusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]);
const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  description: z.string().trim().min(1).optional(),
  status: statusSchema.default("TODO"),
  priority: prioritySchema.default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
  projectId: objectIdString.optional(),
  assigneeId: objectIdString.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: z.coerce.date().nullable().optional(),
  projectId: objectIdString.nullable().optional(),
  assigneeId: objectIdString.nullable().optional(),
});

export const listTasksQuerySchema = paginationQuerySchema.extend({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  projectId: objectIdString.optional(),
  assigneeId: objectIdString.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
