import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { formatXOF } from "../../utils/currency";
import { useMandates } from "../mandates/hooks";
import type { TransitionPackage, TransitionStatus } from "./api";
import {
  useAddChecklistItem,
  useChecklist,
  useCreateTransitionPackage,
  useDeleteChecklistItem,
  useTransitionContent,
  useTransitionPackages,
  useUpdateChecklistItem,
  useUpdateTransitionPackage,
} from "./hooks";

const statusLabels: Record<TransitionStatus, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
};

const statusTones: Record<TransitionStatus, "neutral" | "primary" | "success"> = {
  DRAFT: "neutral",
  IN_PROGRESS: "primary",
  COMPLETED: "success",
};

const packageSchema = z.object({
  outgoingMandateId: z.string().min(1, "Sélectionnez le mandat sortant"),
  incomingMandateId: z.string().optional(),
  recommendations: z.string().optional(),
});

type PackageFormValues = z.infer<typeof packageSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function TransitionPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useTransitionPackages({ page: 1 });
  const { data: mandatesData } = useMandates({ limit: 100 });
  const createPackage = useCreateTransitionPackage();

  const mandates = mandatesData?.items ?? [];
  const mandatesById = new Map(mandates.map((m) => [m.id, m.label]));

  const selectedPackage = data?.items.find((p) => p.id === selectedId) ?? null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Transition entre mandats</h1>
          <p className="text-sm text-neutral-500">
            Package de transition, checklist et mémoire organisationnelle transmise
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau package
        </Button>
      </div>

      <div className="flex gap-6">
        <aside className="w-72 shrink-0">
          <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
            {isLoading && <p className="px-3 py-4 text-sm text-neutral-500">Chargement...</p>}
            {data?.items.length === 0 && (
              <p className="px-3 py-4 text-sm text-neutral-500">Aucun package de transition.</p>
            )}
            {data?.items.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedId(pkg.id)}
                className={`flex w-full flex-col gap-1 border-b border-neutral-100 px-3 py-2.5 text-left text-sm last:border-b-0 ${
                  selectedId === pkg.id ? "bg-primary-light" : "hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-1 text-neutral-800">
                  <span>{mandatesById.get(pkg.outgoingMandateId) ?? "—"}</span>
                  <ArrowRight className="size-3.5 text-neutral-400" />
                  <span>{pkg.incomingMandateId ? mandatesById.get(pkg.incomingMandateId) ?? "—" : "?"}</span>
                </div>
                <Badge tone={statusTones[pkg.status]}>{statusLabels[pkg.status]}</Badge>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1">
          {selectedPackage ? (
            <TransitionDetail
              transitionPackage={selectedPackage}
              mandates={mandates}
              mandatesById={mandatesById}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              Sélectionnez un package de transition pour voir son détail.
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <CreatePackageModal
          mandates={mandates}
          isSaving={createPackage.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(values) => {
            createPackage.mutate(
              {
                outgoingMandateId: values.outgoingMandateId,
                incomingMandateId: cleanOptional(values.incomingMandateId),
                recommendations: cleanOptional(values.recommendations),
              },
              {
                onSuccess: (created) => {
                  setIsCreateOpen(false);
                  setSelectedId(created.id);
                },
              },
            );
          }}
        />
      )}
    </div>
  );
}

interface TransitionDetailProps {
  transitionPackage: TransitionPackage;
  mandates: { id: string; label: string }[];
  mandatesById: Map<string, string>;
}

function TransitionDetail({ transitionPackage, mandates, mandatesById }: TransitionDetailProps) {
  const updatePackage = useUpdateTransitionPackage();
  const { data: checklist } = useChecklist(transitionPackage.id);
  const { data: content } = useTransitionContent(transitionPackage.id);
  const addItem = useAddChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const [newItemLabel, setNewItemLabel] = useState("");
  const [recommendations, setRecommendations] = useState(transitionPackage.recommendations ?? "");

  const doneCount = checklist?.filter((item) => item.isDone).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-300 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            {mandatesById.get(transitionPackage.outgoingMandateId) ?? "—"} →{" "}
            {transitionPackage.incomingMandateId
              ? mandatesById.get(transitionPackage.incomingMandateId) ?? "—"
              : "Mandat entrant non défini"}
          </h2>
          <select
            value={transitionPackage.status}
            onChange={(event) =>
              updatePackage.mutate({
                id: transitionPackage.id,
                input: { status: event.target.value as TransitionStatus },
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="DRAFT">Brouillon</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminée</option>
          </select>
        </div>
        <FormField label="Mandat entrant" htmlFor="incomingMandateId">
          <select
            id="incomingMandateId"
            value={transitionPackage.incomingMandateId ?? ""}
            onChange={(event) =>
              updatePackage.mutate({
                id: transitionPackage.id,
                input: { incomingMandateId: event.target.value || null },
              })
            }
            className={inputClassName}
          >
            <option value="">Non défini</option>
            {mandates.map((mandate) => (
              <option key={mandate.id} value={mandate.id}>
                {mandate.label}
              </option>
            ))}
          </select>
        </FormField>
        <div className="mt-3">
          <FormField label="Recommandations" htmlFor="recommendations">
            <textarea
              id="recommendations"
              rows={3}
              value={recommendations}
              onChange={(event) => setRecommendations(event.target.value)}
              className={inputClassName}
            />
          </FormField>
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              isLoading={updatePackage.isPending}
              onClick={() =>
                updatePackage.mutate({
                  id: transitionPackage.id,
                  input: { recommendations: recommendations || null },
                })
              }
            >
              Enregistrer les recommandations
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-300 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Checklist de transition {checklist ? `(${doneCount}/${checklist.length})` : ""}
        </h2>
        <div className="space-y-1.5">
          {checklist?.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2">
              <button
                type="button"
                onClick={() =>
                  updateItem.mutate({
                    id: transitionPackage.id,
                    itemId: item.id,
                    input: { isDone: !item.isDone },
                  })
                }
                className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                  item.isDone ? "border-success bg-success text-white" : "border-neutral-400"
                }`}
              >
                {item.isDone && <Check className="size-3.5" />}
              </button>
              <span className={`flex-1 text-sm ${item.isDone ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => deleteItem.mutate({ id: transitionPackage.id, itemId: item.id })}
                className="text-neutral-400 hover:text-error"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!newItemLabel.trim()) return;
            addItem.mutate(
              { id: transitionPackage.id, label: newItemLabel.trim() },
              { onSuccess: () => setNewItemLabel("") },
            );
          }}
          className="mt-2 flex gap-2"
        >
          <input
            type="text"
            placeholder="Nouvel élément de checklist..."
            value={newItemLabel}
            onChange={(event) => setNewItemLabel(event.target.value)}
            className={inputClassName}
          />
          <Button type="submit" isLoading={addItem.isPending}>
            <Plus className="size-4" />
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-neutral-300 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Mémoire organisationnelle transmise (mandat sortant)
        </h2>
        {content ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <ContentStat label="Documents" value={content.documents.length} />
            <ContentStat label="Rapports" value={content.reports.length} />
            <ContentStat label="KPIs" value={content.kpis.length} />
            <ContentStat label="Projets" value={content.projects.length} />
            <ContentStat label="Partenaires" value={content.partners.length} />
            <ContentStat label="Procédures" value={content.procedures.length} />
            <ContentStat label="Lessons Learned" value={content.lessonsLearned.length} />
            <ContentStat label="Solde financier" value={formatXOF(content.finance.balance)} />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Chargement du contenu...</p>
        )}
      </div>
    </div>
  );
}

function ContentStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-neutral-200 px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

interface CreatePackageModalProps {
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: PackageFormValues) => void;
}

function CreatePackageModal({ mandates, isSaving, onClose, onSubmit }: CreatePackageModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: { outgoingMandateId: "", incomingMandateId: "", recommendations: "" },
  });

  return (
    <Modal title="Nouveau package de transition" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Mandat sortant" htmlFor="outgoingMandateId" error={errors.outgoingMandateId?.message}>
          <select id="outgoingMandateId" className={inputClassName} {...register("outgoingMandateId")}>
            <option value="">Sélectionner...</option>
            {mandates.map((mandate) => (
              <option key={mandate.id} value={mandate.id}>
                {mandate.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Mandat entrant (optionnel)" htmlFor="incomingMandateId" error={errors.incomingMandateId?.message}>
          <select id="incomingMandateId" className={inputClassName} {...register("incomingMandateId")}>
            <option value="">Non défini</option>
            {mandates.map((mandate) => (
              <option key={mandate.id} value={mandate.id}>
                {mandate.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Recommandations" htmlFor="recommendations" error={errors.recommendations?.message}>
          <textarea id="recommendations" rows={3} className={inputClassName} {...register("recommendations")} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
