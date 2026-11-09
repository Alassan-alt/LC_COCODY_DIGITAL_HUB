import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import type { Visibility } from "../folders/api";
import type { KnowledgeArticle } from "./api";
import {
  useCreateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useKnowledgeArticles,
  useUpdateKnowledgeArticle,
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

const articleSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  category: z.string().optional(),
  tags: z.string().optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function KnowledgeArticlesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<KnowledgeArticle | null>(null);
  const [viewingArticle, setViewingArticle] = useState<KnowledgeArticle | null>(null);

  const { data, isLoading, isError } = useKnowledgeArticles({ page, search: search || undefined });
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const isFormOpen = isCreateOpen || editingArticle !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingArticle(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Base de connaissances</h1>
          <p className="text-sm text-neutral-500">Guides et procédures du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvel article
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher un article..."
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
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Visibilité</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                  Erreur lors du chargement des articles.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Aucun article trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((article) => (
              <tr key={article.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{article.title}</p>
                  {article.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {article.tags.map((tag) => (
                        <Badge key={tag} tone="neutral">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{article.category || "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={visibilityTones[article.visibility]}>
                    {visibilityLabels[article.visibility]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setViewingArticle(article)} title="Lire">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingArticle(article)} title="Modifier">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeletingArticle(article)}
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
        <ArticleFormModal
          article={editingArticle}
          isSaving={createArticle.isPending || updateArticle.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            if (editingArticle) {
              const tags = values.tags
                ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                : [];
              updateArticle.mutate(
                {
                  id: editingArticle.id,
                  input: {
                    title: values.title,
                    content: values.content,
                    category: cleanOptional(values.category) ?? null,
                    tags,
                    visibility: values.visibility,
                  },
                },
                { onSuccess: closeForm },
              );
            } else {
              createArticle.mutate(
                {
                  title: values.title,
                  content: values.content,
                  category: cleanOptional(values.category),
                  tags: cleanOptional(values.tags),
                  visibility: values.visibility,
                },
                { onSuccess: closeForm },
              );
            }
          }}
        />
      )}

      {viewingArticle && (
        <Modal title={viewingArticle.title} onClose={() => setViewingArticle(null)}>
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={visibilityTones[viewingArticle.visibility]}>
              {visibilityLabels[viewingArticle.visibility]}
            </Badge>
            {viewingArticle.category && <Badge tone="neutral">{viewingArticle.category}</Badge>}
          </div>
          <p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-neutral-800">
            {viewingArticle.content}
          </p>
        </Modal>
      )}

      {deletingArticle && (
        <ConfirmDialog
          title="Supprimer l'article"
          message={`Confirmez-vous la suppression de "${deletingArticle.title}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteArticle.isPending}
          onCancel={() => setDeletingArticle(null)}
          onConfirm={() =>
            deleteArticle.mutate(deletingArticle.id, { onSuccess: () => setDeletingArticle(null) })
          }
        />
      )}
    </div>
  );
}

interface ArticleFormModalProps {
  article: KnowledgeArticle | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ArticleFormValues) => void;
}

function ArticleFormModal({ article, isSaving, onClose, onSubmit }: ArticleFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: article?.title ?? "",
      content: article?.content ?? "",
      category: article?.category ?? "",
      tags: article?.tags.join(", ") ?? "",
      visibility: article?.visibility ?? "INTERNAL",
    },
  });

  return (
    <Modal title={article ? "Modifier l'article" : "Nouvel article"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Titre" htmlFor="title" error={errors.title?.message}>
          <input id="title" className={inputClassName} {...register("title")} />
        </FormField>
        <FormField label="Contenu" htmlFor="content" error={errors.content?.message}>
          <textarea id="content" rows={8} className={inputClassName} {...register("content")} />
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
