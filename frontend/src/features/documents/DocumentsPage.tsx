import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FolderPlus, History, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
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
import type { Visibility } from "../folders/api";
import { useCreateFolder, useFolders } from "../folders/hooks";
import { useMandates } from "../mandates/hooks";
import { downloadDocument, downloadDocumentVersion, type Document } from "./api";
import {
  useAddDocumentVersion,
  useDeleteDocument,
  useDocumentVersions,
  useDocuments,
  useRestoreDocumentVersion,
  useUpdateDocument,
  useUploadDocument,
} from "./hooks";

const visibilities: Visibility[] = ["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"];

const visibilityLabels: Record<Visibility, string> = {
  PUBLIC: "Public",
  INTERNAL: "Interne",
  DEPARTMENT: "Département",
  CONFIDENTIAL: "Confidentiel",
  RESTRICTED: "Restreint",
};

const visibilityTones: Record<Visibility, "success" | "primary" | "cyan" | "warning" | "error"> = {
  PUBLIC: "success",
  INTERNAL: "primary",
  DEPARTMENT: "cyan",
  CONFIDENTIAL: "warning",
  RESTRICTED: "error",
};

const uploadSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]),
  folderId: z.string().optional(),
  departmentId: z.string().optional(),
  mandateId: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]),
  folderId: z.string().optional(),
});

const folderSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  visibility: z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]),
  departmentId: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type FolderFormValues = z.infer<typeof folderSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [versionsDocument, setVersionsDocument] = useState<Document | null>(null);

  const { data, isLoading, isError } = useDocuments({
    page,
    search: search || undefined,
    folderId: selectedFolderId,
  });
  const { data: foldersData } = useFolders({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });

  const uploadDocument = useUploadDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const createFolder = useCreateFolder();

  const folders = foldersData?.items ?? [];
  const departmentsById = new Map((departmentsData?.items ?? []).map((d) => [d.id, d.name]));
  const foldersById = new Map(folders.map((f) => [f.id, f.name]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Documents</h1>
          <p className="text-sm text-neutral-500">Gestion documentaire et archives du LC</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="size-4" />
          Téléverser un document
        </Button>
      </div>

      <div className="flex gap-6">
        <aside className="w-56 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">Dossiers</h2>
            <Button variant="ghost" onClick={() => setIsFolderModalOpen(true)} title="Nouveau dossier">
              <FolderPlus className="size-4" />
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId(undefined);
                setPage(1);
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${
                selectedFolderId === undefined
                  ? "bg-primary-light text-primary"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Tous les documents
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  setPage(1);
                }}
                className={`block w-full border-t border-neutral-100 px-3 py-2 text-left text-sm ${
                  selectedFolderId === folder.id
                    ? "bg-primary-light text-primary"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {folder.name}
              </button>
            ))}
            {folders.length === 0 && (
              <p className="px-3 py-2 text-xs text-neutral-500">Aucun dossier créé.</p>
            )}
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4">
            <input
              type="search"
              placeholder="Rechercher un document..."
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
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Visibilité</th>
                  <th className="px-4 py-3 font-medium">Département</th>
                  <th className="px-4 py-3 font-medium">Dossier</th>
                  <th className="px-4 py-3 font-medium">Mis à jour</th>
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
                      Erreur lors du chargement des documents.
                    </td>
                  </tr>
                )}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                      Aucun document trouvé.
                    </td>
                  </tr>
                )}
                {data?.items.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{document.name}</p>
                      {document.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {document.tags.map((tag) => (
                            <Badge key={tag} tone="neutral">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{document.category || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={visibilityTones[document.visibility]}>
                        {visibilityLabels[document.visibility]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {document.departmentId ? departmentsById.get(document.departmentId) ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {document.folderId ? foldersById.get(document.folderId) ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(document.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <DownloadButton documentId={document.id} documentName={document.name} />
                        <Button
                          variant="ghost"
                          onClick={() => setVersionsDocument(document)}
                          title="Historique des versions"
                        >
                          <History className="size-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingDocument(document)} title="Modifier">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setDeletingDocument(document)}
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
        </div>
      </div>

      {isUploadOpen && (
        <UploadDocumentModal
          folders={folders}
          departments={departmentsData?.items ?? []}
          mandates={mandatesData?.items ?? []}
          isSaving={uploadDocument.isPending}
          onClose={() => setIsUploadOpen(false)}
          onSubmit={(file, values) => {
            uploadDocument.mutate(
              { file, ...values, tags: cleanOptional(values.tags) },
              { onSuccess: () => setIsUploadOpen(false) },
            );
          }}
        />
      )}

      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          folders={folders}
          isSaving={updateDocument.isPending}
          onClose={() => setEditingDocument(null)}
          onSubmit={(values) => {
            const tags = values.tags
              ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
              : [];
            updateDocument.mutate(
              {
                id: editingDocument.id,
                input: {
                  name: values.name,
                  description: cleanOptional(values.description) ?? null,
                  category: cleanOptional(values.category) ?? null,
                  tags,
                  visibility: values.visibility,
                  folderId: cleanOptional(values.folderId) ?? null,
                },
              },
              { onSuccess: () => setEditingDocument(null) },
            );
          }}
        />
      )}

      {isFolderModalOpen && (
        <FolderFormModal
          departments={departmentsData?.items ?? []}
          isSaving={createFolder.isPending}
          onClose={() => setIsFolderModalOpen(false)}
          onSubmit={(values) =>
            createFolder.mutate(
              { ...values, departmentId: cleanOptional(values.departmentId) },
              { onSuccess: () => setIsFolderModalOpen(false) },
            )
          }
        />
      )}

      {deletingDocument && (
        <ConfirmDialog
          title="Supprimer le document"
          message={`Confirmez-vous la suppression de "${deletingDocument.name}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteDocument.isPending}
          onCancel={() => setDeletingDocument(null)}
          onConfirm={() =>
            deleteDocument.mutate(deletingDocument.id, { onSuccess: () => setDeletingDocument(null) })
          }
        />
      )}

      {versionsDocument && (
        <VersionsModal
          document={versionsDocument}
          onUpdated={setVersionsDocument}
          onClose={() => setVersionsDocument(null)}
        />
      )}
    </div>
  );
}

function DownloadButton({ documentId, documentName }: { documentId: string; documentName: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true);
    try {
      const blob = await downloadDocument(documentId);
      triggerBrowserDownload(blob, documentName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="ghost" onClick={handleDownload} isLoading={isDownloading} title="Télécharger">
      {!isDownloading && <Download className="size-4" />}
    </Button>
  );
}

interface UploadDocumentModalProps {
  folders: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (file: File, values: UploadFormValues) => void;
}

function UploadDocumentModal({
  folders,
  departments,
  mandates,
  isSaving,
  onClose,
  onSubmit,
}: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { name: "", visibility: "INTERNAL" },
  });

  return (
    <Modal title="Téléverser un document" onClose={onClose}>
      <form
        onSubmit={handleSubmit((values) => {
          if (!file) {
            setFileError("Sélectionnez un fichier");
            return;
          }
          onSubmit(file, values);
        })}
        className="space-y-4"
      >
        <FormField label="Fichier (max 20 Mo)" htmlFor="file" error={fileError ?? undefined}>
          <input
            id="file"
            type="file"
            className={inputClassName}
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setFileError(null);
              if (selected) setValue("name", selected.name);
            }}
          />
        </FormField>
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={2} className={inputClassName} {...register("description")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Catégorie" htmlFor="category" error={errors.category?.message}>
            <input id="category" className={inputClassName} {...register("category")} />
          </FormField>
          <FormField label="Tags (séparés par des virgules)" htmlFor="tags" error={errors.tags?.message}>
            <input id="tags" className={inputClassName} {...register("tags")} />
          </FormField>
        </div>
        <FormField label="Visibilité" htmlFor="visibility" error={errors.visibility?.message}>
          <select id="visibility" className={inputClassName} {...register("visibility")}>
            {visibilities.map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibilityLabels[visibility]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Dossier" htmlFor="folderId" error={errors.folderId?.message}>
          <select id="folderId" className={inputClassName} {...register("folderId")}>
            <option value="">Aucun</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
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
            Téléverser
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditDocumentModalProps {
  document: Document;
  folders: { id: string; name: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: EditFormValues) => void;
}

function EditDocumentModal({ document, folders, isSaving, onClose, onSubmit }: EditDocumentModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: document.name,
      description: document.description ?? "",
      category: document.category ?? "",
      tags: document.tags.join(", "),
      visibility: document.visibility,
      folderId: document.folderId ?? "",
    },
  });

  return (
    <Modal title="Modifier le document" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClassName} {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={2} className={inputClassName} {...register("description")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Catégorie" htmlFor="category" error={errors.category?.message}>
            <input id="category" className={inputClassName} {...register("category")} />
          </FormField>
          <FormField label="Tags (séparés par des virgules)" htmlFor="tags" error={errors.tags?.message}>
            <input id="tags" className={inputClassName} {...register("tags")} />
          </FormField>
        </div>
        <FormField label="Visibilité" htmlFor="visibility" error={errors.visibility?.message}>
          <select id="visibility" className={inputClassName} {...register("visibility")}>
            {visibilities.map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibilityLabels[visibility]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Dossier" htmlFor="folderId" error={errors.folderId?.message}>
          <select id="folderId" className={inputClassName} {...register("folderId")}>
            <option value="">Aucun</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
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

interface FolderFormModalProps {
  departments: { id: string; name: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: FolderFormValues) => void;
}

function FolderFormModal({ departments, isSaving, onClose, onSubmit }: FolderFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: "", visibility: "INTERNAL" },
  });

  return (
    <Modal title="Nouveau dossier" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom" htmlFor="folder-name" error={errors.name?.message}>
          <input id="folder-name" className={inputClassName} {...register("name")} />
        </FormField>
        <FormField label="Visibilité" htmlFor="folder-visibility" error={errors.visibility?.message}>
          <select id="folder-visibility" className={inputClassName} {...register("visibility")}>
            {visibilities.map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibilityLabels[visibility]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Département" htmlFor="folder-department" error={errors.departmentId?.message}>
          <select id="folder-department" className={inputClassName} {...register("departmentId")}>
            <option value="">Aucun</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
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

interface VersionsModalProps {
  document: Document;
  onUpdated: (document: Document) => void;
  onClose: () => void;
}

function VersionsModal({ document, onUpdated, onClose }: VersionsModalProps) {
  const { data: versions, isLoading } = useDocumentVersions(document.id);
  const restoreVersion = useRestoreDocumentVersion();
  const addVersion = useAddDocumentVersion();
  const [newFile, setNewFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");

  return (
    <Modal title={`Versions — ${document.name}`} onClose={onClose}>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {isLoading && <p className="text-sm text-neutral-500">Chargement...</p>}
        {versions?.length === 0 && <p className="text-sm text-neutral-500">Aucune version.</p>}
        {versions
          ?.slice()
          .sort((a, b) => b.versionNumber - a.versionNumber)
          .map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  v{version.versionNumber}
                  {version.id === document.currentVersionId && (
                    <Badge tone="success">actuelle</Badge>
                  )}
                </p>
                <p className="text-xs text-neutral-500">
                  {version.originalName} · {formatBytes(version.size)} ·{" "}
                  {new Date(version.createdAt).toLocaleDateString("fr-FR")}
                </p>
                {version.changeNote && <p className="text-xs text-neutral-500">{version.changeNote}</p>}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const blob = await downloadDocumentVersion(document.id, version.id);
                    triggerBrowserDownload(blob, version.originalName);
                  }}
                  title="Télécharger"
                >
                  <Download className="size-4" />
                </Button>
                {version.id !== document.currentVersionId && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      restoreVersion.mutate(
                        { documentId: document.id, versionId: version.id },
                        { onSuccess: onUpdated },
                      )
                    }
                    isLoading={
                      restoreVersion.isPending && restoreVersion.variables?.versionId === version.id
                    }
                    title="Restaurer cette version"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-4">
        <p className="mb-2 text-sm font-medium text-neutral-700">Ajouter une nouvelle version</p>
        <div className="space-y-2">
          <input
            type="file"
            className={inputClassName}
            onChange={(event) => setNewFile(event.target.files?.[0] ?? null)}
          />
          <input
            type="text"
            placeholder="Note de version (optionnel)"
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            className={inputClassName}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!newFile}
              isLoading={addVersion.isPending}
              onClick={() => {
                if (!newFile) return;
                addVersion.mutate(
                  { documentId: document.id, file: newFile, changeNote: changeNote || undefined },
                  {
                    onSuccess: (updatedDocument) => {
                      setNewFile(null);
                      setChangeNote("");
                      onUpdated(updatedDocument);
                    },
                  },
                );
              }}
            >
              <Plus className="size-4" />
              Ajouter la version
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
