import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/Button";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import type { Task, TaskPriority, TaskStatus } from "./api";
import { priorityLabels, statusLabels } from "./taskDisplay";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const taskSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  task: Task | null;
  projects: { id: string; name: string }[];
  users: { id: string; email: string; memberProfile: { firstName: string; lastName: string } | null }[];
  lockedProjectId?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

function userLabel(user: TaskFormModalProps["users"][number]): string {
  return user.memberProfile ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}` : user.email;
}

export function TaskFormModal({
  task,
  projects,
  users,
  lockedProjectId,
  isSaving,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
      projectId: lockedProjectId ?? task?.projectId ?? "",
      assigneeId: task?.assigneeId ?? "",
    },
  });

  return (
    <Modal title={task ? "Modifier la tâche" : "Nouvelle tâche"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Titre" htmlFor="title" error={errors.title?.message}>
          <input id="title" className={inputClassName} {...register("title")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={2} className={inputClassName} {...register("description")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Statut" htmlFor="status" error={errors.status?.message}>
            <select id="status" className={inputClassName} {...register("status")}>
              {statuses
                .filter((status) => status !== "OVERDUE")
                .map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Priorité" htmlFor="priority" error={errors.priority?.message}>
            <select id="priority" className={inputClassName} {...register("priority")}>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Échéance" htmlFor="dueDate" error={errors.dueDate?.message}>
          <input id="dueDate" type="date" className={inputClassName} {...register("dueDate")} />
        </FormField>
        {!lockedProjectId && (
          <FormField label="Projet" htmlFor="projectId" error={errors.projectId?.message}>
            <select id="projectId" className={inputClassName} {...register("projectId")}>
              <option value="">Aucun</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>
        )}
        <FormField label="Assigné à" htmlFor="assigneeId" error={errors.assigneeId?.message}>
          <select id="assigneeId" className={inputClassName} {...register("assigneeId")}>
            <option value="">Non assignée</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {userLabel(user)}
              </option>
            ))}
          </select>
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
