import { useState } from "react";
import { Badge } from "../../components/Badge";
import { inputClassName } from "../../components/FormField";
import { Pagination } from "../../components/Pagination";
import { useUsers } from "../users/hooks";
import type { AuditAction } from "./api";
import { useAuditLogs } from "./hooks";

const actions: AuditAction[] = [
  "LOGIN",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DOWNLOADED",
  "DOCUMENT_UPDATED",
  "DOCUMENT_DELETED",
  "MEMBER_CREATED",
  "MEMBER_UPDATED",
  "TASK_CREATED",
];

const actionLabels: Record<AuditAction, string> = {
  LOGIN: "Connexion",
  DOCUMENT_UPLOADED: "Document téléversé",
  DOCUMENT_DOWNLOADED: "Document téléchargé",
  DOCUMENT_UPDATED: "Document modifié",
  DOCUMENT_DELETED: "Document supprimé",
  MEMBER_CREATED: "Membre créé",
  MEMBER_UPDATED: "Membre modifié",
  TASK_CREATED: "Tâche créée",
};

const actionTones: Record<AuditAction, "success" | "primary" | "warning" | "error" | "neutral"> = {
  LOGIN: "neutral",
  DOCUMENT_UPLOADED: "success",
  DOCUMENT_DOWNLOADED: "primary",
  DOCUMENT_UPDATED: "warning",
  DOCUMENT_DELETED: "error",
  MEMBER_CREATED: "success",
  MEMBER_UPDATED: "warning",
  TASK_CREATED: "primary",
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");

  const { data, isLoading, isError } = useAuditLogs({ page, action: actionFilter || undefined });
  const { data: usersData } = useUsers({ limit: 100 });

  const usersById = new Map(
    (usersData?.items ?? []).map((u) => [
      u.id,
      u.memberProfile ? `${u.memberProfile.firstName} ${u.memberProfile.lastName}` : u.email,
    ]),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Journal d'audit</h1>
        <p className="text-sm text-neutral-500">
          Historique des actions importantes — lecture seule, non modifiable
        </p>
      </div>

      <div className="mb-4">
        <select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value as AuditAction | "");
            setPage(1);
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">Toutes les actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {actionLabels[action]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entité</th>
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
                  Erreur lors du chargement du journal d'audit.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Aucune entrée trouvée.
                </td>
              </tr>
            )}
            {data?.items.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-neutral-600">{usersById.get(log.userId) ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={actionTones[log.action]}>{actionLabels[log.action]}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {log.entityType}
                  {log.entityId ? ` · ${log.entityId}` : ""}
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
    </div>
  );
}
