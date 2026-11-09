import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { inputClassName } from "../../components/FormField";
import { useUsers } from "../users/hooks";
import type { Task, TaskStatus } from "../tasks/api";
import { useCreateTask, useDeleteTask, useUpdateTask } from "../tasks/hooks";
import { TaskFormModal } from "../tasks/TaskFormModal";
import { priorityLabels, priorityTones, statusLabels } from "../tasks/taskDisplay";
import { useProject, useProjectBoard } from "./hooks";

const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"];

const columnTones: Record<TaskStatus, string> = {
  TODO: "border-t-neutral-400",
  IN_PROGRESS: "border-t-primary",
  DONE: "border-t-success",
  OVERDUE: "border-t-error",
};

export function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data: board, isLoading } = useProjectBoard(id ?? null);
  const { data: usersData } = useUsers({ limit: 100 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const users = usersData?.items ?? [];
  const usersById = new Map(
    users.map((u) => [u.id, u.memberProfile ? `${u.memberProfile.firstName} ${u.memberProfile.lastName}` : u.email]),
  );

  if (!id) return null;

  const isFormOpen = isCreateOpen || editingTask !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingTask(null);
  };

  return (
    <div>
      <Link to="/projects" className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary">
        <ArrowLeft className="size-4" />
        Retour aux projets
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{project?.name ?? "Tableau"}</h1>
          <p className="text-sm text-neutral-500">Tableau Kanban des tâches</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvelle tâche
        </Button>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Chargement...</p>}

      {board && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column} className={`rounded-lg border-t-4 bg-white ${columnTones[column]} border border-neutral-200`}>
              <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
                <h2 className="text-sm font-semibold text-neutral-700">{statusLabels[column]}</h2>
                <span className="text-xs text-neutral-500">{board[column].length}</span>
              </div>
              <div className="space-y-2 p-2">
                {board[column].length === 0 && (
                  <p className="px-2 py-3 text-center text-xs text-neutral-400">Aucune tâche</p>
                )}
                {board[column].map((task) => (
                  <div key={task.id} className="rounded-md border border-neutral-200 p-3 text-sm">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="font-medium text-neutral-900">{task.title}</p>
                      <Badge tone={priorityTones[task.priority]}>{priorityLabels[task.priority]}</Badge>
                    </div>
                    {task.assigneeId && (
                      <p className="text-xs text-neutral-500">{usersById.get(task.assigneeId) ?? "—"}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-neutral-500">
                        Échéance : {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <select
                        value={task.status === "OVERDUE" ? "TODO" : task.status}
                        onChange={(event) =>
                          updateTask.mutate({
                            id: task.id,
                            input: { status: event.target.value as TaskStatus },
                          })
                        }
                        className={`${inputClassName} !py-1 text-xs`}
                      >
                        <option value="TODO">{statusLabels.TODO}</option>
                        <option value="IN_PROGRESS">{statusLabels.IN_PROGRESS}</option>
                        <option value="DONE">{statusLabels.DONE}</option>
                      </select>
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => setEditingTask(task)} title="Modifier">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" onClick={() => setDeletingTask(task)} title="Supprimer">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <TaskFormModal
          task={editingTask}
          projects={[]}
          users={users}
          lockedProjectId={id}
          isSaving={createTask.isPending || updateTask.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              description: values.description || undefined,
              dueDate: values.dueDate || undefined,
              projectId: id,
              assigneeId: values.assigneeId || undefined,
            };
            if (editingTask) {
              updateTask.mutate({ id: editingTask.id, input: payload }, { onSuccess: closeForm });
            } else {
              createTask.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Supprimer la tâche"
          message={`Confirmez-vous la suppression de "${deletingTask.title}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteTask.isPending}
          onCancel={() => setDeletingTask(null)}
          onConfirm={() => deleteTask.mutate(deletingTask.id, { onSuccess: () => setDeletingTask(null) })}
        />
      )}
    </div>
  );
}
