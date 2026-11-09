import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { useDepartments } from "../departments/hooks";
import { useMandates } from "../mandates/hooks";
import type { Kpi } from "./api";
import { useCreateKpi, useDeleteKpi, useKpis, useUpdateKpi } from "./hooks";

const kpiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  target: z.string().min(1, "L'objectif est requis").refine((v) => Number(v) > 0, "Doit être positif"),
  currentValue: z.string().refine((v) => v === "" || Number(v) >= 0, "Doit être positif ou nul"),
  unit: z.string().optional(),
  period: z.string().min(1, "La période est requise"),
  departmentId: z.string().optional(),
  mandateId: z.string().optional(),
});

type KpiFormValues = z.infer<typeof kpiSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

function progressTone(ratio: number): string {
  if (ratio >= 1) return "bg-success";
  if (ratio >= 0.5) return "bg-primary";
  return "bg-warning";
}

export function KpisPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingKpi, setDeletingKpi] = useState<Kpi | null>(null);

  const { data, isLoading, isError } = useKpis({ page, search: search || undefined });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });

  const createKpi = useCreateKpi();
  const updateKpi = useUpdateKpi();
  const deleteKpi = useDeleteKpi();

  const departments = departmentsData?.items ?? [];
  const mandates = mandatesData?.items ?? [];
  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  const isFormOpen = isCreateOpen || editingKpi !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingKpi(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">KPIs</h1>
          <p className="text-sm text-neutral-500">Objectifs et progression du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau KPI
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher un KPI..."
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
              <th className="px-4 py-3 font-medium">Période</th>
              <th className="px-4 py-3 font-medium">Progression</th>
              <th className="px-4 py-3 font-medium">Département</th>
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
                  Erreur lors du chargement des KPIs.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucun KPI trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((kpi) => {
              const ratio = kpi.target > 0 ? kpi.currentValue / kpi.target : 0;
              const percent = Math.round(ratio * 100);
              return (
                <tr key={kpi.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{kpi.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{kpi.period}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={`h-full ${progressTone(ratio)}`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-600">
                        {kpi.currentValue}/{kpi.target} {kpi.unit ?? ""} ({percent}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {kpi.departmentId ? departmentsById.get(kpi.departmentId) ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" onClick={() => setEditingKpi(kpi)} title="Modifier">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" onClick={() => setDeletingKpi(kpi)} title="Supprimer">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
        <KpiFormModal
          kpi={editingKpi}
          departments={departments}
          mandates={mandates}
          isSaving={createKpi.isPending || updateKpi.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              name: values.name,
              target: Number(values.target),
              currentValue: values.currentValue ? Number(values.currentValue) : undefined,
              period: values.period,
              unit: cleanOptional(values.unit),
              departmentId: cleanOptional(values.departmentId),
              mandateId: cleanOptional(values.mandateId),
            };
            if (editingKpi) {
              updateKpi.mutate({ id: editingKpi.id, input: payload }, { onSuccess: closeForm });
            } else {
              createKpi.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingKpi && (
        <ConfirmDialog
          title="Supprimer le KPI"
          message={`Confirmez-vous la suppression de "${deletingKpi.name}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteKpi.isPending}
          onCancel={() => setDeletingKpi(null)}
          onConfirm={() => deleteKpi.mutate(deletingKpi.id, { onSuccess: () => setDeletingKpi(null) })}
        />
      )}
    </div>
  );
}

interface KpiFormModalProps {
  kpi: Kpi | null;
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: KpiFormValues) => void;
}

function KpiFormModal({ kpi, departments, mandates, isSaving, onClose, onSubmit }: KpiFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KpiFormValues>({
    resolver: zodResolver(kpiSchema),
    defaultValues: {
      name: kpi?.name ?? "",
      target: kpi ? String(kpi.target) : "",
      currentValue: kpi ? String(kpi.currentValue) : "0",
      unit: kpi?.unit ?? "",
      period: kpi?.period ?? "",
      departmentId: kpi?.departmentId ?? "",
      mandateId: kpi?.mandateId ?? "",
    },
  });

  return (
    <Modal title={kpi ? "Modifier le KPI" : "Nouveau KPI"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Objectif" htmlFor="target" error={errors.target?.message}>
            <input id="target" type="number" className={inputClassName} {...register("target")} />
          </FormField>
          <FormField label="Valeur actuelle" htmlFor="currentValue" error={errors.currentValue?.message}>
            <input id="currentValue" type="number" className={inputClassName} {...register("currentValue")} />
          </FormField>
          <FormField label="Unité" htmlFor="unit" error={errors.unit?.message}>
            <input id="unit" placeholder="%, XOF, ..." className={inputClassName} {...register("unit")} />
          </FormField>
        </div>
        <FormField label="Période" htmlFor="period" error={errors.period?.message}>
          <input id="period" placeholder="ex: Septembre 2026" className={inputClassName} {...register("period")} />
        </FormField>
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
