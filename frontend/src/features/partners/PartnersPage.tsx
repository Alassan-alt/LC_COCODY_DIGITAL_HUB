import { zodResolver } from "@hookform/resolvers/zod";
import { History, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { useMandates } from "../mandates/hooks";
import { useUsers } from "../users/hooks";
import type { Partner, PartnerStatus } from "./api";
import {
  useAddActivity,
  useCreatePartner,
  useDeletePartner,
  usePartnerActivities,
  usePartners,
  useUpdatePartner,
} from "./hooks";

const statuses: PartnerStatus[] = ["PROSPECT", "CONTACTED", "MEETING", "NEGOTIATION", "PARTNER", "LOST"];

const statusLabels: Record<PartnerStatus, string> = {
  PROSPECT: "Prospect",
  CONTACTED: "Contacté",
  MEETING: "Rendez-vous",
  NEGOTIATION: "Négociation",
  PARTNER: "Partenaire",
  LOST: "Perdu",
};

const statusTones: Record<PartnerStatus, "neutral" | "primary" | "cyan" | "warning" | "success" | "error"> = {
  PROSPECT: "neutral",
  CONTACTED: "primary",
  MEETING: "cyan",
  NEGOTIATION: "warning",
  PARTNER: "success",
  LOST: "error",
};

const partnerSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  responsibleId: z.string().min(1, "Sélectionnez un responsable"),
  mandateId: z.string().optional(),
});

const activitySchema = z.object({
  note: z.string().min(1, "La note est requise"),
  status: z.string().optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;
type ActivityFormValues = z.infer<typeof activitySchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function PartnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "">("");
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [activitiesPartner, setActivitiesPartner] = useState<Partner | null>(null);

  const { data, isLoading, isError } = usePartners({
    page,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });

  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();

  const users = usersData?.items ?? [];
  const mandates = mandatesData?.items ?? [];
  const usersById = new Map(
    users.map((u) => [u.id, u.memberProfile ? `${u.memberProfile.firstName} ${u.memberProfile.lastName}` : u.email]),
  );

  const isFormOpen = isCreateOpen || editingPartner !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingPartner(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Partenaires</h1>
          <p className="text-sm text-neutral-500">Suivi du pipeline partenaires (mini CRM)</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau partenaire
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher un partenaire..."
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
            setStatusFilter(event.target.value as PartnerStatus | "");
            setPage(1);
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">Tous les statuts</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Responsable</th>
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
                  Erreur lors du chargement des partenaires.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucun partenaire trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((partner) => (
              <tr key={partner.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{partner.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTones[partner.status]}>{statusLabels[partner.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {partner.contactName || partner.contactEmail || "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">{usersById.get(partner.responsibleId) ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => setActivitiesPartner(partner)}
                      title="Historique de suivi"
                    >
                      <History className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingPartner(partner)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeletingPartner(partner)}
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
        <PartnerFormModal
          partner={editingPartner}
          users={users}
          mandates={mandates}
          isSaving={createPartner.isPending || updatePartner.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              contactName: cleanOptional(values.contactName),
              contactEmail: cleanOptional(values.contactEmail),
              contactPhone: cleanOptional(values.contactPhone),
              mandateId: cleanOptional(values.mandateId),
            };
            if (editingPartner) {
              updatePartner.mutate({ id: editingPartner.id, input: payload }, { onSuccess: closeForm });
            } else {
              createPartner.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingPartner && (
        <ConfirmDialog
          title="Supprimer le partenaire"
          message={`Confirmez-vous la suppression de "${deletingPartner.name}" ?`}
          confirmLabel="Supprimer"
          isLoading={deletePartner.isPending}
          onCancel={() => setDeletingPartner(null)}
          onConfirm={() =>
            deletePartner.mutate(deletingPartner.id, { onSuccess: () => setDeletingPartner(null) })
          }
        />
      )}

      {activitiesPartner && (
        <ActivitiesModal partner={activitiesPartner} onClose={() => setActivitiesPartner(null)} />
      )}
    </div>
  );
}

interface PartnerFormModalProps {
  partner: Partner | null;
  users: { id: string; email: string; memberProfile: { firstName: string; lastName: string } | null }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: PartnerFormValues) => void;
}

function PartnerFormModal({ partner, users, mandates, isSaving, onClose, onSubmit }: PartnerFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: partner?.name ?? "",
      contactName: partner?.contactName ?? "",
      contactEmail: partner?.contactEmail ?? "",
      contactPhone: partner?.contactPhone ?? "",
      responsibleId: partner?.responsibleId ?? "",
      mandateId: partner?.mandateId ?? "",
    },
  });

  return (
    <Modal title={partner ? "Modifier le partenaire" : "Nouveau partenaire"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nom du contact" htmlFor="contactName" error={errors.contactName?.message}>
            <input id="contactName" className={inputClassName} {...register("contactName")} />
          </FormField>
          <FormField label="Téléphone" htmlFor="contactPhone" error={errors.contactPhone?.message}>
            <input id="contactPhone" className={inputClassName} {...register("contactPhone")} />
          </FormField>
        </div>
        <FormField label="Email du contact" htmlFor="contactEmail" error={errors.contactEmail?.message}>
          <input id="contactEmail" type="email" className={inputClassName} {...register("contactEmail")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Responsable" htmlFor="responsibleId" error={errors.responsibleId?.message}>
            <select id="responsibleId" className={inputClassName} {...register("responsibleId")}>
              <option value="">Sélectionner...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.memberProfile ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}` : user.email}
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
        {!partner && (
          <p className="text-xs text-neutral-500">
            Le nouveau partenaire démarre avec le statut « Prospect ». Utilisez l'historique de suivi pour
            faire avancer le pipeline.
          </p>
        )}
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

function ActivitiesModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const { data: activities, isLoading } = usePartnerActivities(partner.id);
  const addActivity = useAddActivity();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: { note: "", status: "" },
  });

  return (
    <Modal title={`Historique de suivi — ${partner.name}`} onClose={onClose}>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {isLoading && <p className="text-sm text-neutral-500">Chargement...</p>}
        {activities?.length === 0 && <p className="text-sm text-neutral-500">Aucune activité enregistrée.</p>}
        {activities
          ?.slice()
          .reverse()
          .map((activity) => (
            <div key={activity.id} className="rounded-md border border-neutral-200 p-3 text-sm">
              <p className="text-neutral-800">{activity.note}</p>
              {activity.toStatus && (
                <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                  {activity.fromStatus && (
                    <>
                      <Badge tone={statusTones[activity.fromStatus]}>{statusLabels[activity.fromStatus]}</Badge>
                      →
                    </>
                  )}
                  <Badge tone={statusTones[activity.toStatus]}>{statusLabels[activity.toStatus]}</Badge>
                </div>
              )}
              <p className="mt-1 text-xs text-neutral-400">
                {new Date(activity.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
          ))}
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-4">
        <p className="mb-2 text-sm font-medium text-neutral-700">Ajouter une activité</p>
        <form
          onSubmit={handleSubmit((values) => {
            addActivity.mutate(
              {
                partnerId: partner.id,
                input: {
                  note: values.note,
                  status: values.status ? (values.status as Partner["status"]) : undefined,
                },
              },
              { onSuccess: () => reset({ note: "", status: "" }) },
            );
          })}
          className="space-y-3"
        >
          <FormField label="Note" htmlFor="note" error={errors.note?.message}>
            <textarea id="note" rows={2} className={inputClassName} {...register("note")} />
          </FormField>
          <FormField label="Nouveau statut (optionnel)" htmlFor="status" error={errors.status?.message}>
            <select id="status" className={inputClassName} {...register("status")}>
              <option value="">Ne pas changer</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" isLoading={addActivity.isPending}>
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
