import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import type { Mandate } from "./api";
import { useCloseMandate, useCreateMandate, useMandates, useUpdateMandate } from "./hooks";

const mandateSchema = z
  .object({
    label: z.string().min(2, "Le libellé doit contenir au moins 2 caractères"),
    startDate: z.string().min(1, "La date de début est requise"),
    endDate: z.string().min(1, "La date de fin est requise"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["endDate"],
  });

type MandateFormValues = z.infer<typeof mandateSchema>;

function toDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("fr-FR");
}

export function MandatesPage() {
  const [page, setPage] = useState(1);
  const [editingMandate, setEditingMandate] = useState<Mandate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingMandate, setClosingMandate] = useState<Mandate | null>(null);

  const { data, isLoading, isError } = useMandates({ page });
  const createMandate = useCreateMandate();
  const updateMandate = useUpdateMandate();
  const closeMandate = useCloseMandate();

  const isFormOpen = isCreateOpen || editingMandate !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingMandate(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Mandats</h1>
          <p className="text-sm text-neutral-500">Gestion des mandats du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau mandat
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Libellé</th>
              <th className="px-4 py-3 font-medium">Début</th>
              <th className="px-4 py-3 font-medium">Fin</th>
              <th className="px-4 py-3 font-medium">Statut</th>
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
                  Erreur lors du chargement des mandats.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucun mandat trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((mandate) => (
              <tr key={mandate.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{mandate.label}</td>
                <td className="px-4 py-3 text-neutral-600">{formatDate(mandate.startDate)}</td>
                <td className="px-4 py-3 text-neutral-600">{formatDate(mandate.endDate)}</td>
                <td className="px-4 py-3">
                  <Badge tone={mandate.status === "ACTIVE" ? "success" : "neutral"}>
                    {mandate.status === "ACTIVE" ? "Actif" : "Clôturé"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditingMandate(mandate)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    {mandate.status === "ACTIVE" && (
                      <Button
                        variant="ghost"
                        onClick={() => setClosingMandate(mandate)}
                        title="Clôturer"
                      >
                        <Lock className="size-4" />
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
        <MandateFormModal
          mandate={editingMandate}
          isSaving={createMandate.isPending || updateMandate.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            if (editingMandate) {
              updateMandate.mutate({ id: editingMandate.id, input: values }, { onSuccess: closeForm });
            } else {
              createMandate.mutate(values, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {closingMandate && (
        <ConfirmDialog
          title="Clôturer le mandat"
          message={`Confirmez-vous la clôture du mandat "${closingMandate.label}" ?`}
          confirmLabel="Clôturer"
          isLoading={closeMandate.isPending}
          onCancel={() => setClosingMandate(null)}
          onConfirm={() =>
            closeMandate.mutate(closingMandate.id, { onSuccess: () => setClosingMandate(null) })
          }
        />
      )}
    </div>
  );
}

interface MandateFormModalProps {
  mandate: Mandate | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: MandateFormValues) => void;
}

function MandateFormModal({ mandate, isSaving, onClose, onSubmit }: MandateFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MandateFormValues>({
    resolver: zodResolver(mandateSchema),
    defaultValues: {
      label: mandate?.label ?? "",
      startDate: mandate ? toDateInputValue(mandate.startDate) : "",
      endDate: mandate ? toDateInputValue(mandate.endDate) : "",
    },
  });

  return (
    <Modal title={mandate ? "Modifier le mandat" : "Nouveau mandat"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Libellé" htmlFor="label" error={errors.label?.message}>
          <input id="label" className={inputClassName} {...register("label")} />
        </FormField>
        <FormField label="Date de début" htmlFor="startDate" error={errors.startDate?.message}>
          <input id="startDate" type="date" className={inputClassName} {...register("startDate")} />
        </FormField>
        <FormField label="Date de fin" htmlFor="endDate" error={errors.endDate?.message}>
          <input id="endDate" type="date" className={inputClassName} {...register("endDate")} />
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
