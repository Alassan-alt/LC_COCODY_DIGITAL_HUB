import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Power, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import type { Role, User } from "./api";
import { useCreateUser, useDeactivateUser, useUpdateUser, useUsers } from "./hooks";

const roles: Role[] = ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER", "MEMBER"];

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  LCP: "LCP",
  VP: "VP",
  TEAM_LEADER: "Team Leader",
  MEMBER: "Membre",
};

const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER", "MEMBER"]),
});

const editUserSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER", "MEMBER"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  const { data, isLoading, isError } = useUsers({ page });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Utilisateurs</h1>
          <p className="text-sm text-neutral-500">Gestion des comptes et des rôles</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Membre</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
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
                  Erreur lors du chargement des utilisateurs.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{user.email}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {user.memberProfile
                    ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone="purple">{roleLabels[user.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={user.isActive ? "success" : "neutral"}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditingUser(user)} title="Modifier le rôle">
                      <Pencil className="size-4" />
                    </Button>
                    {user.isActive ? (
                      <Button
                        variant="ghost"
                        onClick={() => setDeactivatingUser(user)}
                        title="Désactiver"
                      >
                        <Power className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => updateUser.mutate({ id: user.id, input: { isActive: true } })}
                        title="Réactiver"
                      >
                        <RotateCcw className="size-4" />
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

      {isCreateOpen && (
        <CreateUserModal
          isSaving={createUser.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(values) => createUser.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isSaving={updateUser.isPending}
          onClose={() => setEditingUser(null)}
          onSubmit={(values) =>
            updateUser.mutate(
              { id: editingUser.id, input: values },
              { onSuccess: () => setEditingUser(null) },
            )
          }
        />
      )}

      {deactivatingUser && (
        <ConfirmDialog
          title="Désactiver l'utilisateur"
          message={`Confirmez-vous la désactivation du compte "${deactivatingUser.email}" ?`}
          confirmLabel="Désactiver"
          isLoading={deactivateUser.isPending}
          onCancel={() => setDeactivatingUser(null)}
          onConfirm={() =>
            deactivateUser.mutate(deactivatingUser.id, {
              onSuccess: () => setDeactivatingUser(null),
            })
          }
        />
      )}
    </div>
  );
}

interface CreateUserModalProps {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserFormValues) => void;
}

function CreateUserModal({ isSaving, onClose, onSubmit }: CreateUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", password: "", role: "MEMBER" },
  });

  return (
    <Modal title="Nouvel utilisateur" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" className={inputClassName} {...register("email")} />
        </FormField>
        <FormField label="Mot de passe" htmlFor="password" error={errors.password?.message}>
          <input id="password" type="password" className={inputClassName} {...register("password")} />
        </FormField>
        <FormField label="Rôle" htmlFor="role" error={errors.role?.message}>
          <select id="role" className={inputClassName} {...register("role")}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
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

interface EditUserModalProps {
  user: User;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: EditUserFormValues) => void;
}

function EditUserModal({ user, isSaving, onClose, onSubmit }: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { role: user.role },
  });

  return (
    <Modal title={`Modifier le rôle — ${user.email}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Rôle" htmlFor="role" error={errors.role?.message}>
          <select id="role" className={inputClassName} {...register("role")}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
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
