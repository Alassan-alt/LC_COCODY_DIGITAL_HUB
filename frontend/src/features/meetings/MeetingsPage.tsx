import { zodResolver } from "@hookform/resolvers/zod";
import { CheckSquare, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useUsers } from "../users/hooks";
import type { Meeting } from "./api";
import {
  useCreateDecision,
  useCreateMeeting,
  useDecisions,
  useDeleteMeeting,
  useMeetings,
  useUpdateMeeting,
} from "./hooks";

const meetingSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  date: z.string().min(1, "La date est requise"),
  agenda: z.string().optional(),
  departmentId: z.string().optional(),
  mandateId: z.string().optional(),
});

const minutesSchema = z.object({
  minutes: z.string().optional(),
});

const decisionSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  responsibleId: z.string().min(1, "Sélectionnez un responsable"),
  dueDate: z.string().optional(),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;
type MinutesFormValues = z.infer<typeof minutesSchema>;
type DecisionFormValues = z.infer<typeof decisionSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function MeetingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);
  const [minutesMeeting, setMinutesMeeting] = useState<Meeting | null>(null);
  const [decisionsMeeting, setDecisionsMeeting] = useState<Meeting | null>(null);

  const { data, isLoading, isError } = useMeetings({ page, search: search || undefined });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });

  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const departments = departmentsData?.items ?? [];
  const mandates = mandatesData?.items ?? [];
  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  const isFormOpen = isCreateOpen || editingMeeting !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingMeeting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Réunions</h1>
          <p className="text-sm text-neutral-500">Ordre du jour, comptes rendus et décisions</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvelle réunion
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher une réunion..."
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
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Département</th>
              <th className="px-4 py-3 font-medium">Compte rendu</th>
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
                  Erreur lors du chargement des réunions.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucune réunion trouvée.
                </td>
              </tr>
            )}
            {data?.items.map((meeting) => (
              <tr key={meeting.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{meeting.title}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(meeting.date).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {meeting.departmentId ? departmentsById.get(meeting.departmentId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={meeting.minutes ? "success" : "neutral"}>
                    {meeting.minutes ? "Rédigé" : "À rédiger"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setDecisionsMeeting(meeting)} title="Décisions">
                      <CheckSquare className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMinutesMeeting(meeting)}
                      title="Compte rendu"
                    >
                      <ClipboardList className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingMeeting(meeting)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeletingMeeting(meeting)}
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
        <MeetingFormModal
          meeting={editingMeeting}
          departments={departments}
          mandates={mandates}
          isSaving={createMeeting.isPending || updateMeeting.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              agenda: cleanOptional(values.agenda),
              departmentId: cleanOptional(values.departmentId),
              mandateId: cleanOptional(values.mandateId),
            };
            if (editingMeeting) {
              updateMeeting.mutate({ id: editingMeeting.id, input: payload }, { onSuccess: closeForm });
            } else {
              createMeeting.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingMeeting && (
        <ConfirmDialog
          title="Supprimer la réunion"
          message={`Confirmez-vous la suppression de "${deletingMeeting.title}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteMeeting.isPending}
          onCancel={() => setDeletingMeeting(null)}
          onConfirm={() =>
            deleteMeeting.mutate(deletingMeeting.id, { onSuccess: () => setDeletingMeeting(null) })
          }
        />
      )}

      {minutesMeeting && (
        <MinutesModal
          meeting={minutesMeeting}
          isSaving={updateMeeting.isPending}
          onClose={() => setMinutesMeeting(null)}
          onSubmit={(values) =>
            updateMeeting.mutate(
              { id: minutesMeeting.id, input: { minutes: cleanOptional(values.minutes) ?? null } },
              { onSuccess: () => setMinutesMeeting(null) },
            )
          }
        />
      )}

      {decisionsMeeting && (
        <DecisionsModal meeting={decisionsMeeting} onClose={() => setDecisionsMeeting(null)} />
      )}
    </div>
  );
}

interface MeetingFormModalProps {
  meeting: Meeting | null;
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: MeetingFormValues) => void;
}

function MeetingFormModal({ meeting, departments, mandates, isSaving, onClose, onSubmit }: MeetingFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: meeting?.title ?? "",
      date: meeting ? meeting.date.slice(0, 16) : "",
      agenda: meeting?.agenda ?? "",
      departmentId: meeting?.departmentId ?? "",
      mandateId: meeting?.mandateId ?? "",
    },
  });

  return (
    <Modal title={meeting ? "Modifier la réunion" : "Nouvelle réunion"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Titre" htmlFor="title" error={errors.title?.message}>
          <input id="title" className={inputClassName} {...register("title")} />
        </FormField>
        <FormField label="Date" htmlFor="date" error={errors.date?.message}>
          <input id="date" type="datetime-local" className={inputClassName} {...register("date")} />
        </FormField>
        <FormField label="Ordre du jour" htmlFor="agenda" error={errors.agenda?.message}>
          <textarea id="agenda" rows={3} className={inputClassName} {...register("agenda")} />
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

function MinutesModal({
  meeting,
  isSaving,
  onClose,
  onSubmit,
}: {
  meeting: Meeting;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: MinutesFormValues) => void;
}) {
  const { register, handleSubmit } = useForm<MinutesFormValues>({
    resolver: zodResolver(minutesSchema),
    defaultValues: { minutes: meeting.minutes ?? "" },
  });

  return (
    <Modal title={`Compte rendu — ${meeting.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Compte rendu" htmlFor="minutes">
          <textarea id="minutes" rows={8} className={inputClassName} {...register("minutes")} />
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

function DecisionsModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const { data: decisions, isLoading } = useDecisions(meeting.id);
  const { data: usersData } = useUsers({ limit: 100 });
  const createDecision = useCreateDecision();

  const users = usersData?.items ?? [];
  const usersById = new Map(
    users.map((u) => [u.id, u.memberProfile ? `${u.memberProfile.firstName} ${u.memberProfile.lastName}` : u.email]),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { description: "", responsibleId: "", dueDate: "" },
  });

  return (
    <Modal title={`Décisions — ${meeting.title}`} onClose={onClose}>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {isLoading && <p className="text-sm text-neutral-500">Chargement...</p>}
        {decisions?.length === 0 && <p className="text-sm text-neutral-500">Aucune décision enregistrée.</p>}
        {decisions?.map((decision) => (
          <div key={decision.id} className="rounded-md border border-neutral-200 p-3 text-sm">
            <p className="font-medium text-neutral-900">{decision.description}</p>
            <p className="text-xs text-neutral-500">
              Responsable : {usersById.get(decision.responsibleId) ?? "—"}
              {decision.dueDate && ` · Échéance : ${new Date(decision.dueDate).toLocaleDateString("fr-FR")}`}
            </p>
            {decision.generatedTaskId && (
              <Badge tone="primary">Tâche générée automatiquement</Badge>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-4">
        <p className="mb-1 text-sm font-medium text-neutral-700">Ajouter une décision</p>
        <p className="mb-2 text-xs text-neutral-500">
          Une tâche sera automatiquement créée et assignée au responsable choisi.
        </p>
        <form
          onSubmit={handleSubmit((values) => {
            createDecision.mutate(
              {
                meetingId: meeting.id,
                input: {
                  description: values.description,
                  responsibleId: values.responsibleId,
                  dueDate: values.dueDate || undefined,
                },
              },
              { onSuccess: () => reset({ description: "", responsibleId: "", dueDate: "" }) },
            );
          })}
          className="space-y-3"
        >
          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <input id="description" className={inputClassName} {...register("description")} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Responsable" htmlFor="responsibleId" error={errors.responsibleId?.message}>
              <select id="responsibleId" className={inputClassName} {...register("responsibleId")}>
                <option value="">Sélectionner...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {usersById.get(user.id)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Échéance" htmlFor="dueDate" error={errors.dueDate?.message}>
              <input id="dueDate" type="date" className={inputClassName} {...register("dueDate")} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={createDecision.isPending}>
              <Plus className="size-4" />
              Ajouter la décision
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
