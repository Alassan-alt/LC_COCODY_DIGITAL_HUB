import type { TaskPriority, TaskStatus } from "./api";

export const statusLabels: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  OVERDUE: "En retard",
};

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export const priorityTones: Record<TaskPriority, "neutral" | "primary" | "warning" | "error"> = {
  LOW: "neutral",
  MEDIUM: "primary",
  HIGH: "warning",
  URGENT: "error",
};

export const statusTones: Record<TaskStatus, "neutral" | "primary" | "success" | "error"> = {
  TODO: "neutral",
  IN_PROGRESS: "primary",
  DONE: "success",
  OVERDUE: "error",
};
