import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Power } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import type { Department } from "./api";
import {
  useCreateDepartment,
  useDeactivateDepartment,
  useDepartments,
  useUpdateDepartment,
} from "./hooks";

const departmentSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deactivatingDepartment, setDeactivatingDepartment] = useState<Department | null>(null);

  const { data, isLoading, isError } = useDepartments({ page, search: search || undefined });
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deactivateDepartment = useDeactivateDepartment();

  const isFormOpen = isCreateOpen || editingDepartment !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingDepartment(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Départements</h1>
          <p className="text-sm text-neutral-500">Gestion des départements du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau département
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher un département..."
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
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Statut</th>
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
                  Erreur lors du chargement des départements.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Aucun département trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((department) => (
              <tr key={department.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{department.name}</td>
                <td className="px-4 py-3 text-neutral-600">{department.description || "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={department.isActive ? "success" : "neutral"}>
                    {department.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingDepartment(department)}
                      title="Modifier"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {department.isActive && (
                      <Button
                        variant="ghost"
                        onClick={() => setDeactivatingDepartment(department)}
                        title="Désactiver"
                      >
                        <Power className="size-4" />
                      </Button>
                    )}
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
        <DepartmentFormModal
          department={editingDepartment}
          isSaving={createDepartment.isPending || updateDepartment.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            if (editingDepartment) {
              updateDepartment.mutate(
                { id: editingDepartment.id, input: values },
                { onSuccess: closeForm },
              );
            } else {
              createDepartment.mutate(values, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deactivatingDepartment && (
        <ConfirmDialog
          title="Désactiver le département"
          message={`Confirmez-vous la désactivation de "${deactivatingDepartment.name}" ?`}
          confirmLabel="Désactiver"
          isLoading={deactivateDepartment.isPending}
          onCancel={() => setDeactivatingDepartment(null)}
          onConfirm={() =>
            deactivateDepartment.mutate(deactivatingDepartment.id, {
              onSuccess: () => setDeactivatingDepartment(null),
            })
          }
        />
      )}
    </div>
  );
}

interface DepartmentFormModalProps {
  department: Department | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => void;
}

function DepartmentFormModal({ department, isSaving, onClose, onSubmit }: DepartmentFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? "",
      description: department?.description ?? "",
    },
  });

  return (
    <Modal title={department ? "Modifier le département" : "Nouveau département"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={3} className={inputClassName} {...register("description")} />
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
