import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { useAuthStore } from "../../store/authStore";
import { useDepartments } from "../departments/hooks";
import { useMandates } from "../mandates/hooks";
import { useUsers } from "../users/hooks";
import type { AttendanceStatus, Event } from "./api";
import {
  useAttendances,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useMarkAttendance,
  useUpdateEvent,
} from "./hooks";

const MANAGER_ROLES = ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"];

const attendanceStatuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "EXCUSED"];

const attendanceLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  EXCUSED: "Excusé",
};

const attendanceTones: Record<AttendanceStatus, "success" | "error" | "warning"> = {
  PRESENT: "success",
  ABSENT: "error",
  EXCUSED: "warning",
};

const eventSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    startDate: z.string().min(1, "La date de début est requise"),
    endDate: z.string().min(1, "La date de fin est requise"),
    location: z.string().optional(),
    departmentId: z.string().optional(),
    mandateId: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  });

type EventFormValues = z.infer<typeof eventSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

function toDateTimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

export function EventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null);

  const { data, isLoading, isError } = useEvents({ page, search: search || undefined });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const departments = departmentsData?.items ?? [];
  const mandates = mandatesData?.items ?? [];
  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  const isFormOpen = isCreateOpen || editingEvent !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingEvent(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Événements</h1>
          <p className="text-sm text-neutral-500">Événements du LC et suivi des présences</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvel événement
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher un événement..."
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
              <th className="px-4 py-3 font-medium">Début</th>
              <th className="px-4 py-3 font-medium">Fin</th>
              <th className="px-4 py-3 font-medium">Lieu</th>
              <th className="px-4 py-3 font-medium">Département</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Chargement...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-error">
                  Erreur lors du chargement des événements.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Aucun événement trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{event.title}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(event.startDate).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(event.endDate).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-neutral-600">{event.location || "—"}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {event.departmentId ? departmentsById.get(event.departmentId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => setAttendanceEvent(event)}
                      title="Présences"
                    >
                      <CalendarCheck className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingEvent(event)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setDeletingEvent(event)} title="Supprimer">
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
        <EventFormModal
          event={editingEvent}
          departments={departments}
          mandates={mandates}
          isSaving={createEvent.isPending || updateEvent.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              description: cleanOptional(values.description),
              location: cleanOptional(values.location),
              departmentId: cleanOptional(values.departmentId),
              mandateId: cleanOptional(values.mandateId),
            };
            if (editingEvent) {
              updateEvent.mutate({ id: editingEvent.id, input: payload }, { onSuccess: closeForm });
            } else {
              createEvent.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingEvent && (
        <ConfirmDialog
          title="Supprimer l'événement"
          message={`Confirmez-vous la suppression de "${deletingEvent.title}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteEvent.isPending}
          onCancel={() => setDeletingEvent(null)}
          onConfirm={() => deleteEvent.mutate(deletingEvent.id, { onSuccess: () => setDeletingEvent(null) })}
        />
      )}

      {attendanceEvent && (
        <AttendanceModal event={attendanceEvent} onClose={() => setAttendanceEvent(null)} />
      )}
    </div>
  );
}

interface EventFormModalProps {
  event: Event | null;
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: EventFormValues) => void;
}

function EventFormModal({ event, departments, mandates, isSaving, onClose, onSubmit }: EventFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: event ? toDateTimeLocal(event.startDate) : "",
      endDate: event ? toDateTimeLocal(event.endDate) : "",
      location: event?.location ?? "",
      departmentId: event?.departmentId ?? "",
      mandateId: event?.mandateId ?? "",
    },
  });

  return (
    <Modal title={event ? "Modifier l'événement" : "Nouvel événement"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Titre" htmlFor="title" error={errors.title?.message}>
          <input id="title" className={inputClassName} {...register("title")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={2} className={inputClassName} {...register("description")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Début" htmlFor="startDate" error={errors.startDate?.message}>
            <input id="startDate" type="datetime-local" className={inputClassName} {...register("startDate")} />
          </FormField>
          <FormField label="Fin" htmlFor="endDate" error={errors.endDate?.message}>
            <input id="endDate" type="datetime-local" className={inputClassName} {...register("endDate")} />
          </FormField>
        </div>
        <FormField label="Lieu" htmlFor="location" error={errors.location?.message}>
          <input id="location" className={inputClassName} {...register("location")} />
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

function AttendanceModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const currentUser = useAuthStore((state) => state.user);
  const isManager = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const { data: attendances, isLoading } = useAttendances(event.id);
  const { data: usersData } = useUsers({ limit: 100 });
  const markAttendance = useMarkAttendance();

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("PRESENT");

  const users = usersData?.items ?? [];
  const usersById = new Map(
    users.map((u) => [u.id, u.memberProfile ? `${u.memberProfile.firstName} ${u.memberProfile.lastName}` : u.email]),
  );

  const myAttendance = attendances?.find((a) => a.userId === currentUser?.id);

  return (
    <Modal title={`Présences — ${event.title}`} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
        <p className="text-sm text-neutral-700">
          Mon statut : {myAttendance ? <Badge tone={attendanceTones[myAttendance.status]}>{attendanceLabels[myAttendance.status]}</Badge> : <span className="text-neutral-500">non renseigné</span>}
        </p>
        <Button
          variant="secondary"
          isLoading={markAttendance.isPending}
          onClick={() => markAttendance.mutate({ eventId: event.id, status: "PRESENT" })}
        >
          <UserCheck className="size-4" />
          Marquer ma présence
        </Button>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {isLoading && <p className="text-sm text-neutral-500">Chargement...</p>}
        {attendances?.length === 0 && <p className="text-sm text-neutral-500">Aucune présence enregistrée.</p>}
        {attendances?.map((attendance) => (
          <div
            key={attendance.id}
            className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <span className="text-neutral-800">{usersById.get(attendance.userId) ?? attendance.userId}</span>
            <Badge tone={attendanceTones[attendance.status]}>{attendanceLabels[attendance.status]}</Badge>
          </div>
        ))}
      </div>

      {isManager && (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">Enregistrer la présence de quelqu'un</p>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className={inputClassName}
            >
              <option value="">Sélectionner...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {usersById.get(user.id)}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as AttendanceStatus)}
              className={`${inputClassName} w-40`}
            >
              {attendanceStatuses.map((status) => (
                <option key={status} value={status}>
                  {attendanceLabels[status]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!selectedUserId}
              isLoading={markAttendance.isPending}
              onClick={() =>
                markAttendance.mutate({
                  eventId: event.id,
                  userId: selectedUserId,
                  status: selectedStatus,
                })
              }
            >
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
