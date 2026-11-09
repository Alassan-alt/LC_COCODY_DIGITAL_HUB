import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Identifiant invalide");

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est requis"),
    description: z.string().trim().min(1).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: z.string().trim().min(1).optional(),
    departmentId: objectIdString.optional(),
    mandateId: objectIdString.optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  });

export const updateEventSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().trim().min(1).nullable().optional(),
  departmentId: objectIdString.nullable().optional(),
  mandateId: objectIdString.nullable().optional(),
});

export const listEventsQuerySchema = paginationQuerySchema.extend({
  departmentId: objectIdString.optional(),
  mandateId: objectIdString.optional(),
});

const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "EXCUSED"]);

export const markAttendanceSchema = z.object({
  userId: objectIdString.optional(),
  status: attendanceStatusSchema.default("PRESENT"),
});

export const updateAttendanceSchema = z.object({
  status: attendanceStatusSchema,
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
