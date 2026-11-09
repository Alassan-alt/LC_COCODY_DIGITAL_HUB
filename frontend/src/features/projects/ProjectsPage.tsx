import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Kanban, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { useDepartments } from "../departments/hooks";
import { useLessonLearned, useUpsertLessonLearned } from "../lessonsLearned/hooks";
import { useMandates } from "../mandates/hooks";
import type { Project, ProjectStatus } from "./api";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "./hooks";

const statuses: ProjectStatus[] = ["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

const statusLabels: Record<ProjectStatus, string> = {
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  ON_HOLD: "En pause",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const statusTones: Record<ProjectStatus, "neutral" | "primary" | "warning" | "success" | "error"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "primary",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
};

const projectSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.string().optional(),
  mandateId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [lessonsProject, setLessonsProject] = useState<Project | null>(null);

  const { data, isLoading, isError } = useProjects({ page, search: search || undefined });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const departmentsById = new Map((departmentsData?.items ?? []).map((d) => [d.id, d.name]));
  const mandatesById = new Map((mandatesData?.items ?? []).map((m) => [m.id, m.label]));

  const isFormOpen = isCreateOpen || editingProject !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingProject(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Projets</h1>
          <p className="text-sm text-neutral-500">Projets et suivi Kanban des tâches</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau projet
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher un projet..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className={`${inputClassName} max-w-xs`}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Département</th>
              <th className="px-4 py-3 font-medium">Mandat</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Chargement...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-error">
                  Erreur lors du chargement des projets.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucun projet trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{project.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTones[project.status]}>{statusLabels[project.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {project.departmentId ? departmentsById.get(project.departmentId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {project.mandateId ? mandatesById.get(project.mandateId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link to={`/projects/${project.id}/board`}>
                      <Button variant="ghost" title="Tableau Kanban">
                        <Kanban className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => setLessonsProject(project)}
                      title="Lessons Learned"
                    >
                      <GraduationCap className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingProject(project)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeletingProject(project)}
                      title="Supprimer"
                    >
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
        <ProjectFormModal
          project={editingProject}
          departments={departmentsData?.items ?? []}
          mandates={mandatesData?.items ?? []}
          isSaving={createProject.isPending || updateProject.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              description: cleanOptional(values.description),
              startDate: cleanOptional(values.startDate),
              endDate: cleanOptional(values.endDate),
              departmentId: cleanOptional(values.departmentId),
              mandateId: cleanOptional(values.mandateId),
            };
            if (editingProject) {
              updateProject.mutate({ id: editingProject.id, input: payload }, { onSuccess: closeForm });
            } else {
              createProject.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingProject && (
        <ConfirmDialog
          title="Supprimer le projet"
          message={`Confirmez-vous la suppression de "${deletingProject.name}" ? Les tâches associées ne seront plus rattachées.`}
          confirmLabel="Supprimer"
          isLoading={deleteProject.isPending}
          onCancel={() => setDeletingProject(null)}
          onConfirm={() =>
            deleteProject.mutate(deletingProject.id, { onSuccess: () => setDeletingProject(null) })
          }
        />
      )}

      {lessonsProject && (
        <LessonLearnedModal project={lessonsProject} onClose={() => setLessonsProject(null)} />
      )}
    </div>
  );
}

interface ProjectFormModalProps {
  project: Project | null;
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
}

function ProjectFormModal({
  project,
  departments,
  mandates,
  isSaving,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "PLANNED",
      startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project?.endDate ? project.endDate.slice(0, 10) : "",
      departmentId: project?.departmentId ?? "",
      mandateId: project?.mandateId ?? "",
    },
  });

  return (
    <Modal title={project ? "Modifier le projet" : "Nouveau projet"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={2} className={inputClassName} {...register("description")} />
        </FormField>
        <FormField label="Statut" htmlFor="status" error={errors.status?.message}>
          <select id="status" className={inputClassName} {...register("status")}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date de début" htmlFor="startDate" error={errors.startDate?.message}>
            <input id="startDate" type="date" className={inputClassName} {...register("startDate")} />
          </FormField>
          <FormField label="Date de fin" htmlFor="endDate" error={errors.endDate?.message}>
            <input id="endDate" type="date" className={inputClassName} {...register("endDate")} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Département" htmlFor="departmentId" error={errors.departmentId?.message}>
            <select id="departmentId" className={inputClassName} {...register("departmentId")}>
              <option value="">Aucun</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Mandat" htmlFor="mandateId" error={errors.mandateId?.message}>
            <select id="mandateId" className={inputClassName} {...register("mandateId")}>
              <option value="">Aucun</option>
              {mandates.map((mandate) => (
                <option key={mandate.id} value={mandate.id}>
                  {mandate.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
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

const lessonLearnedSchema = z.object({
  whatWorked: z.string().optional(),
  whatDidNotWork: z.string().optional(),
  difficulties: z.string().optional(),
  recommendations: z.string().optional(),
  lessonsLearned: z.string().optional(),
});

type LessonLearnedFormValues = z.infer<typeof lessonLearnedSchema>;

function LessonLearnedModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const { data: lessonLearned, isLoading } = useLessonLearned(project.id);
  const upsert = useUpsertLessonLearned();

  const { register, handleSubmit, reset } = useForm<LessonLearnedFormValues>({
    resolver: zodResolver(lessonLearnedSchema),
    defaultValues: {
      whatWorked: "",
      whatDidNotWork: "",
      difficulties: "",
      recommendations: "",
      lessonsLearned: "",
    },
    values: lessonLearned
      ? {
          whatWorked: lessonLearned.whatWorked ?? "",
          whatDidNotWork: lessonLearned.whatDidNotWork ?? "",
          difficulties: lessonLearned.difficulties ?? "",
          recommendations: lessonLearned.recommendations ?? "",
          lessonsLearned: lessonLearned.lessonsLearned ?? "",
        }
      : undefined,
  });

  return (
    <Modal title={`Lessons Learned — ${project.name}`} onClose={onClose}>
      {isLoading ? (
        <p className="text-sm text-neutral-500">Chargement...</p>
      ) : (
        <form
          onSubmit={handleSubmit((values) => {
            const clean = (v?: string) => (v ? v : undefined);
            upsert.mutate(
              {
                projectId: project.id,
                input: {
                  whatWorked: clean(values.whatWorked),
                  whatDidNotWork: clean(values.whatDidNotWork),
                  difficulties: clean(values.difficulties),
                  recommendations: clean(values.recommendations),
                  lessonsLearned: clean(values.lessonsLearned),
                },
              },
              { onSuccess: () => reset(values) },
            );
          })}
          className="space-y-4"
        >
          <FormField label="Ce qui a bien fonctionné" htmlFor="whatWorked">
            <textarea id="whatWorked" rows={2} className={inputClassName} {...register("whatWorked")} />
          </FormField>
          <FormField label="Ce qui n'a pas fonctionné" htmlFor="whatDidNotWork">
            <textarea id="whatDidNotWork" rows={2} className={inputClassName} {...register("whatDidNotWork")} />
          </FormField>
          <FormField label="Difficultés rencontrées" htmlFor="difficulties">
            <textarea id="difficulties" rows={2} className={inputClassName} {...register("difficulties")} />
          </FormField>
          <FormField label="Recommandations" htmlFor="recommendations">
            <textarea id="recommendations" rows={2} className={inputClassName} {...register("recommendations")} />
          </FormField>
          <FormField label="Leçons apprises" htmlFor="lessonsLearned">
            <textarea id="lessonsLearned" rows={2} className={inputClassName} {...register("lessonsLearned")} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button type="submit" isLoading={upsert.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
