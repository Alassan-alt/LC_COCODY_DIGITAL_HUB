import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { useDepartments } from "../departments/hooks";
import { useMandates } from "../mandates/hooks";
import type { Team } from "./api";
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from "./hooks";

const objectIdRegex = /^[a-f\d]{24}$/i;

const teamSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  departmentId: z.string().regex(objectIdRegex, "Sélectionnez un département"),
  mandateId: z.string().regex(objectIdRegex, "Sélectionnez un mandat"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export function TeamsPage() {
  const [page, setPage] = useState(1);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError } = useTeams({ page });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const departmentsById = new Map((departmentsData?.items ?? []).map((d) => [d.id, d.name]));
  const mandatesById = new Map((mandatesData?.items ?? []).map((m) => [m.id, m.label]));

  const isFormOpen = isCreateOpen || editingTeam !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingTeam(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Équipes</h1>
          <p className="text-sm text-neutral-500">Gestion des équipes du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvelle équipe
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Département</th>
              <th className="px-4 py-3 font-medium">Mandat</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Chargement...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-error">
                  Erreur lors du chargement des équipes.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Aucune équipe trouvée.
                </td>
              </tr>
            )}
            {data?.items.map((team) => (
              <tr key={team.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{team.name}</td>
                <td className="px-4 py-3">
                  <Badge tone="primary">{departmentsById.get(team.departmentId) ?? "—"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="cyan">{mandatesById.get(team.mandateId) ?? "—"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditingTeam(team)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDeleteError(null);
                        setDeletingTeam(team);
                      }}
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
        <TeamFormModal
          team={editingTeam}
          departments={departmentsData?.items ?? []}
          mandates={mandatesData?.items ?? []}
          isSaving={createTeam.isPending || updateTeam.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            if (editingTeam) {
              updateTeam.mutate({ id: editingTeam.id, input: values }, { onSuccess: closeForm });
            } else {
              createTeam.mutate(values, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingTeam && (
        <ConfirmDialog
          title="Supprimer l'équipe"
          message={
            deleteError ?? `Confirmez-vous la suppression de l'équipe "${deletingTeam.name}" ?`
          }
          confirmLabel="Supprimer"
          isLoading={deleteTeam.isPending}
          onCancel={() => setDeletingTeam(null)}
          onConfirm={() =>
            deleteTeam.mutate(deletingTeam.id, {
              onSuccess: () => setDeletingTeam(null),
              onError: (error) => {
                const message = axios.isAxiosError(error)
                  ? ((error.response?.data as { message?: string } | undefined)?.message ??
                    "Suppression impossible")
                  : "Suppression impossible";
                setDeleteError(message);
              },
            })
          }
        />
      )}
    </div>
  );
}

interface TeamFormModalProps {
  team: Team | null;
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: TeamFormValues) => void;
}

function TeamFormModal({ team, departments, mandates, isSaving, onClose, onSubmit }: TeamFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team?.name ?? "",
      departmentId: team?.departmentId ?? "",
      mandateId: team?.mandateId ?? "",
    },
  });

  return (
    <Modal title={team ? "Modifier l'équipe" : "Nouvelle équipe"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <FormField label="Département" htmlFor="departmentId" error={errors.departmentId?.message}>
          <select id="departmentId" className={inputClassName} {...register("departmentId")}>
            <option value="">Sélectionner...</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Mandat" htmlFor="mandateId" error={errors.mandateId?.message}>
          <select id="mandateId" className={inputClassName} {...register("mandateId")}>
            <option value="">Sélectionner...</option>
            {mandates.map((mandate) => (
              <option key={mandate.id} value={mandate.id}>
                {mandate.label}
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
