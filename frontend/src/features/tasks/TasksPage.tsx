import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { inputClassName } from "../../components/FormField";
import { Pagination } from "../../components/Pagination";
import { useProjects } from "../projects/hooks";
import { useUsers } from "../users/hooks";
import type { Task, TaskPriority, TaskStatus } from "./api";
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from "./hooks";
import { TaskFormModal } from "./TaskFormModal";
import { priorityLabels, priorityTones, statusLabels, statusTones } from "./taskDisplay";

const statusFilters: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"];
const priorityFilters: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function TasksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const { data, isLoading, isError } = useTasks({
    page,
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const projects = projectsData?.items ?? [];
  const users = usersData?.items ?? [];
  const projectsById = new Map(projects.map((p) => [p.id, p.name]));
  const usersById = new Map(
    users.map((u) => [u.id, u.memberProfile ? `${u.memberProfile.firstName} ${u.memberProfile.lastName}` : u.email]),
  );

  const isFormOpen = isCreateOpen || editingTask !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingTask(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Tâches</h1>
          <p className="text-sm text-neutral-500">Toutes les tâches, tous projets confondus</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher une tâche..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className={`${inputClassName} max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as TaskStatus | "");
            setPage(1);
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">Tous les statuts</option>
          {statusFilters.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => {
            setPriorityFilter(event.target.value as TaskPriority | "");
            setPage(1);
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">Toutes les priorités</option>
          {priorityFilters.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Projet</th>
              <th className="px-4 py-3 font-medium">Assigné à</th>
              <th className="px-4 py-3 font-medium">Priorité</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Échéance</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Chargement...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-error">
                  Erreur lors du chargement des tâches.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Aucune tâche trouvée.
                </td>
              </tr>
            )}
            {data?.items.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{task.title}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {task.projectId ? projectsById.get(task.projectId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {task.assigneeId ? usersById.get(task.assigneeId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={priorityTones[task.priority]}>{priorityLabels[task.priority]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTones[task.status]}>{statusLabels[task.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditingTask(task)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setDeletingTask(task)} title="Supprimer">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {isFormOpen && (
        <TaskFormModal
          task={editingTask}
          projects={projects}
          users={users}
          isSaving={createTask.isPending || updateTask.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              description: cleanOptional(values.description),
              dueDate: cleanOptional(values.dueDate),
              projectId: cleanOptional(values.projectId),
              assigneeId: cleanOptional(values.assigneeId),
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
