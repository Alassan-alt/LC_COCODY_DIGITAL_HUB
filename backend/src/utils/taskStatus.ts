import type { TaskStatus } from "@prisma/client";

/**
 * OVERDUE n'est pas toujours stocké : une tâche TODO/IN_PROGRESS dont
 * l'échéance est dépassée est présentée comme OVERDUE sans que la valeur en
 * base soit modifiée (pas de tâche planifiée/cron dans ce MVP).
 */
export function withEffectiveStatus<T extends { status: TaskStatus; dueDate: Date | null }>(task: T): T {
  if (task.status === "TODO" || task.status === "IN_PROGRESS") {
    if (task.dueDate && task.dueDate.getTime() < Date.now()) {
      return { ...task, status: "OVERDUE" };
    }
  }
  return task;
}
