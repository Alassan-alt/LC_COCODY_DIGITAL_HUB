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
import { useDepartments } from "../departments/hooks";
import { useMandates } from "../mandates/hooks";
import { useTeams } from "../teams/hooks";
import { useUsers } from "../users/hooks";
import type { Member } from "./api";
import { useCreateMember, useDeactivateMember, useMembers, useUpdateMember } from "./hooks";

const objectIdRegex = /^[a-f\d]{24}$/i;
const optionalObjectId = z
  .string()
  .regex(objectIdRegex, "Identifiant invalide")
  .optional()
  .or(z.literal(""));

const createMemberSchema = z.object({
  userId: z.string().regex(objectIdRegex, "Sélectionnez un utilisateur"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  position: z.string().optional(),
  departmentId: optionalObjectId,
  teamId: optionalObjectId,
  mandateId: optionalObjectId,
});

const editMemberSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  position: z.string().optional(),
  departmentId: optionalObjectId,
  teamId: optionalObjectId,
  mandateId: optionalObjectId,
});

type CreateMemberFormValues = z.infer<typeof createMemberSchema>;
type EditMemberFormValues = z.infer<typeof editMemberSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function MembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deactivatingMember, setDeactivatingMember] = useState<Member | null>(null);

  const { data, isLoading, isError } = useMembers({ page, search: search || undefined });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: teamsData } = useTeams({ page: 1 });
  const { data: mandatesData } = useMandates({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deactivateMember = useDeactivateMember();

  const departmentsById = new Map((departmentsData?.items ?? []).map((d) => [d.id, d.name]));
  const teamsById = new Map((teamsData?.items ?? []).map((t) => [t.id, t.name]));
  const mandatesById = new Map((mandatesData?.items ?? []).map((m) => [m.id, m.label]));
  const availableUsers = (usersData?.items ?? []).filter((user) => !user.memberProfile);

  const isFormOpen = isCreateOpen || editingMember !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingMember(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Membres</h1>
          <p className="text-sm text-neutral-500">Profils membres du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau membre
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher un membre..."
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
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Département</th>
              <th className="px-4 py-3 font-medium">Équipe</th>
              <th className="px-4 py-3 font-medium">Mandat</th>
              <th className="px-4 py-3 font-medium">Statut</th>
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
                  Erreur lors du chargement des membres.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Aucun membre trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-4 py-3 text-neutral-600">{member.user.email}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {member.departmentId ? departmentsById.get(member.departmentId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {member.teamId ? teamsById.get(member.teamId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {member.mandateId ? mandatesById.get(member.mandateId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={member.user.isActive ? "success" : "neutral"}>
                    {member.user.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditingMember(member)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    {member.user.isActive && (
                      <Button
                        variant="ghost"
                        onClick={() => setDeactivatingMember(member)}
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
        <MemberFormModal
          member={editingMember}
          availableUsers={availableUsers}
          departments={departmentsData?.items ?? []}
          teams={teamsData?.items ?? []}
          mandates={mandatesData?.items ?? []}
          isSaving={createMember.isPending || updateMember.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              phone: cleanOptional(values.phone),
              position: cleanOptional(values.position),
              departmentId: cleanOptional(values.departmentId),
              teamId: cleanOptional(values.teamId),
              mandateId: cleanOptional(values.mandateId),
            };
            if (editingMember) {
              const { userId: _userId, ...updateValues } = payload as CreateMemberFormValues;
              updateMember.mutate({ id: editingMember.id, input: updateValues }, { onSuccess: closeForm });
            } else {
              createMember.mutate(payload as CreateMemberFormValues, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deactivatingMember && (
        <ConfirmDialog
          title="Désactiver le membre"
          message={`Confirmez-vous la désactivation de "${deactivatingMember.firstName} ${deactivatingMember.lastName}" ? Son compte utilisateur sera désactivé.`}
          confirmLabel="Désactiver"
          isLoading={deactivateMember.isPending}
          onCancel={() => setDeactivatingMember(null)}
          onConfirm={() =>
            deactivateMember.mutate(deactivatingMember.id, {
              onSuccess: () => setDeactivatingMember(null),
            })
          }
        />
      )}
    </div>
  );
}

interface MemberFormModalProps {
  member: Member | null;
  availableUsers: { id: string; email: string }[];
  departments: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CreateMemberFormValues) => void;
}

function MemberFormModal({
  member,
  availableUsers,
  departments,
  teams,
  mandates,
  isSaving,
  onClose,
  onSubmit,
}: MemberFormModalProps) {
  const schema = member ? editMemberSchema : createMemberSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMemberFormValues | EditMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: member?.userId ?? "",
      firstName: member?.firstName ?? "",
      lastName: member?.lastName ?? "",
      phone: member?.phone ?? "",
      position: member?.position ?? "",
      departmentId: member?.departmentId ?? "",
      teamId: member?.teamId ?? "",
      mandateId: member?.mandateId ?? "",
    },
  });

  const createErrors = errors as typeof errors & { userId?: { message?: string } };

  return (
    <Modal title={member ? "Modifier le membre" : "Nouveau membre"} onClose={onClose}>
      <form
        onSubmit={handleSubmit((values) => onSubmit(values as CreateMemberFormValues))}
        className="space-y-4"
      >
        {!member && (
          <FormField label="Utilisateur" htmlFor="userId" error={createErrors.userId?.message}>
            <select id="userId" className={inputClassName} {...register("userId")}>
              <option value="">Sélectionner...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Prénom" htmlFor="firstName" error={errors.firstName?.message}>
            <input id="firstName" className={inputClassName} {...register("firstName")} />
          </FormField>
          <FormField label="Nom" htmlFor="lastName" error={errors.lastName?.message}>
            <input id="lastName" className={inputClassName} {...register("lastName")} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
            <input id="phone" className={inputClassName} {...register("phone")} />
          </FormField>
          <FormField label="Poste" htmlFor="position" error={errors.position?.message}>
            <input id="position" className={inputClassName} {...register("position")} />
          </FormField>
        </div>
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
        <FormField label="Équipe" htmlFor="teamId" error={errors.teamId?.message}>
          <select id="teamId" className={inputClassName} {...register("teamId")}>
            <option value="">Aucune</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
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
