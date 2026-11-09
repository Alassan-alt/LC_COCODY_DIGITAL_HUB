import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, Sparkles, Trash2 } from "lucide-react";
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
import type { Report, ReportType } from "./api";
import {
  useCreateReport,
  useDeleteReport,
  useGenerateReport,
  useReports,
  useUpdateReport,
} from "./hooks";

const types: ReportType[] = ["MONTHLY", "DEPARTMENTAL", "MANDATE"];

const typeLabels: Record<ReportType, string> = {
  MONTHLY: "Mensuel",
  DEPARTMENTAL: "Départemental",
  MANDATE: "De mandat",
};

const typeTones: Record<ReportType, "primary" | "cyan" | "purple"> = {
  MONTHLY: "primary",
  DEPARTMENTAL: "cyan",
  MANDATE: "purple",
};

const reportSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  type: z.enum(["MONTHLY", "DEPARTMENTAL", "MANDATE"]),
  period: z.string().min(1, "La période est requise"),
  content: z.string().optional(),
  departmentId: z.string().optional(),
  mandateId: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ReportType | "">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);

  const { data, isLoading, isError } = useReports({ page, type: typeFilter || undefined });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });

  const createReport = useCreateReport();
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();

  const departments = departmentsData?.items ?? [];
  const mandates = mandatesData?.items ?? [];
  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Rapports</h1>
          <p className="text-sm text-neutral-500">Rapports mensuels, départementaux et de mandat</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouveau rapport
        </Button>
      </div>

      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value as ReportType | "");
            setPage(1);
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">Tous les types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {typeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Période</th>
              <th className="px-4 py-3 font-medium">Département</th>
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
                  Erreur lors du chargement des rapports.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Aucun rapport trouvé.
                </td>
              </tr>
            )}
            {data?.items.map((report) => (
              <tr key={report.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{report.title}</td>
                <td className="px-4 py-3">
                  <Badge tone={typeTones[report.type]}>{typeLabels[report.type]}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">{report.period}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {report.departmentId ? departmentsById.get(report.departmentId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setViewingReport(report)} title="Voir le contenu">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setDeletingReport(report)} title="Supprimer">
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

      {isCreateOpen && (
        <ReportFormModal
          departments={departments}
          mandates={mandates}
          isSaving={createReport.isPending || generateReport.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmitManual={(values) => {
            createReport.mutate(
              {
                title: values.title,
                type: values.type,
                period: values.period,
                content: cleanOptional(values.content),
                departmentId: cleanOptional(values.departmentId),
                mandateId: cleanOptional(values.mandateId),
              },
              { onSuccess: () => setIsCreateOpen(false) },
            );
          }}
          onSubmitGenerate={(values) => {
            generateReport.mutate(
              {
                title: values.title,
                type: values.type,
                period: values.period,
                departmentId: cleanOptional(values.departmentId),
                mandateId: cleanOptional(values.mandateId),
              },
              { onSuccess: () => setIsCreateOpen(false) },
            );
          }}
        />
      )}

      {viewingReport && (
        <ReportContentModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}

      {deletingReport && (
        <ConfirmDialog
          title="Supprimer le rapport"
          message={`Confirmez-vous la suppression de "${deletingReport.title}" ?`}
          confirmLabel="Supprimer"
          isLoading={deleteReport.isPending}
          onCancel={() => setDeletingReport(null)}
          onConfirm={() =>
            deleteReport.mutate(deletingReport.id, { onSuccess: () => setDeletingReport(null) })
          }
        />
      )}
    </div>
  );
}

function ReportContentModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const updateReport = useUpdateReport();
  const [content, setContent] = useState(report.content ?? "");

  return (
    <Modal title={report.title} onClose={onClose}>
      <textarea
        rows={12}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className={`${inputClassName} font-mono text-xs`}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Fermer
        </Button>
        <Button
          isLoading={updateReport.isPending}
          onClick={() =>
            updateReport.mutate(
              { id: report.id, input: { content: content || null } },
              { onSuccess: onClose },
            )
          }
        >
          Enregistrer
        </Button>
      </div>
    </Modal>
  );
}

interface ReportFormModalProps {
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmitManual: (values: ReportFormValues) => void;
  onSubmitGenerate: (values: ReportFormValues) => void;
}

function ReportFormModal({
  departments,
  mandates,
  isSaving,
  onClose,
  onSubmitManual,
  onSubmitGenerate,
}: ReportFormModalProps) {
  const [mode, setMode] = useState<"generate" | "manual">("generate");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { title: "", type: "MONTHLY", period: "", content: "" },
  });

  return (
    <Modal title="Nouveau rapport" onClose={onClose}>
      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant={mode === "generate" ? "primary" : "ghost"}
          onClick={() => setMode("generate")}
        >
          <Sparkles className="size-4" />
          Générer automatiquement
        </Button>
        <Button type="button" variant={mode === "manual" ? "primary" : "ghost"} onClick={() => setMode("manual")}>
          Rédiger manuellement
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(mode === "generate" ? onSubmitGenerate : onSubmitManual)}
        className="space-y-4"
      >
        <FormField label="Titre" htmlFor="title" error={errors.title?.message}>
          <input id="title" className={inputClassName} {...register("title")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" htmlFor="type" error={errors.type?.message}>
            <select id="type" className={inputClassName} {...register("type")}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Période" htmlFor="period" error={errors.period?.message}>
            <input id="period" placeholder="ex: Septembre 2026" className={inputClassName} {...register("period")} />
          </FormField>
        </div>
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
        {mode === "generate" ? (
          <p className="text-xs text-neutral-500">
            Le contenu sera généré automatiquement à partir des projets, documents, événements,
            partenaires, KPIs et du solde financier réels de ce périmètre.
          </p>
        ) : (
          <FormField label="Contenu" htmlFor="content" error={errors.content?.message}>
            <textarea id="content" rows={6} className={inputClassName} {...register("content")} />
          </FormField>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {mode === "generate" ? "Générer" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
