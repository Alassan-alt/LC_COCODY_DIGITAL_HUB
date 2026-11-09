import { zodResolver } from "@hookform/resolvers/zod";
import { Coins, Pencil, Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField, inputClassName } from "../../components/FormField";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { StatTile } from "../../components/StatTile";
import { formatXOF } from "../../utils/currency";
import { useDepartments } from "../departments/hooks";
import { useDocuments } from "../documents/hooks";
import { useMandates } from "../mandates/hooks";
import type { Transaction, TransactionType } from "./api";
import {
  useBalance,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "./hooks";

const typeLabels: Record<TransactionType, string> = {
  INCOME: "Recette",
  EXPENSE: "Dépense",
};

const typeTones: Record<TransactionType, "success" | "error"> = {
  INCOME: "success",
  EXPENSE: "error",
};

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .string()
    .min(1, "Le montant est requis")
    .refine((value) => Number(value) > 0, "Le montant doit être positif"),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  departmentId: z.string().optional(),
  mandateId: z.string().optional(),
  documentId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function cleanOptional(value?: string): string | undefined {
  return value ? value : undefined;
}

export function FinancePage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const { data, isLoading, isError } = useTransactions({ page, type: typeFilter || undefined });
  const { data: balance } = useBalance({});
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: mandatesData } = useMandates({ limit: 100 });
  const { data: documentsData } = useDocuments({ limit: 100 });

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const departments = departmentsData?.items ?? [];
  const mandates = mandatesData?.items ?? [];
  const documents = documentsData?.items ?? [];
  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  const isFormOpen = isCreateOpen || editingTransaction !== null;

  const closeForm = (): void => {
    setIsCreateOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Finance</h1>
          <p className="text-sm text-neutral-500">Recettes, dépenses et solde du LC</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvelle transaction
        </Button>
      </div>

      {balance && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Recettes" value={formatXOF(balance.income)} icon={TrendingUp} tone="success" />
          <StatTile label="Dépenses" value={formatXOF(balance.expense)} icon={TrendingDown} tone="error" />
          <StatTile
            label="Solde"
            value={formatXOF(balance.balance)}
            icon={Coins}
            tone={balance.balance >= 0 ? "success" : "error"}
          />
        </div>
      )}

      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value as TransactionType | "");
            setPage(1);
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">Tous les types</option>
          <option value="INCOME">Recettes</option>
          <option value="EXPENSE">Dépenses</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Montant</th>
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
                  Erreur lors du chargement des transactions.
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Aucune transaction trouvée.
                </td>
              </tr>
            )}
            {data?.items.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(transaction.date).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={typeTones[transaction.type]}>{typeLabels[transaction.type]}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">{transaction.category}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    transaction.type === "INCOME" ? "text-success" : "text-error"
                  }`}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatXOF(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {transaction.departmentId ? departmentsById.get(transaction.departmentId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingTransaction(transaction)}
                      title="Modifier"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeletingTransaction(transaction)}
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
        <TransactionFormModal
          transaction={editingTransaction}
          departments={departments}
          mandates={mandates}
          documents={documents}
          isSaving={createTransaction.isPending || updateTransaction.isPending}
          onClose={closeForm}
          onSubmit={(values) => {
            const payload = {
              ...values,
              amount: Number(values.amount),
              description: cleanOptional(values.description),
              departmentId: cleanOptional(values.departmentId),
              mandateId: cleanOptional(values.mandateId),
              documentId: cleanOptional(values.documentId),
            };
            if (editingTransaction) {
              updateTransaction.mutate(
                { id: editingTransaction.id, input: payload },
                { onSuccess: closeForm },
              );
            } else {
              createTransaction.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      {deletingTransaction && (
        <ConfirmDialog
          title="Supprimer la transaction"
          message={`Confirmez-vous la suppression de cette transaction de ${formatXOF(deletingTransaction.amount)} ?`}
          confirmLabel="Supprimer"
          isLoading={deleteTransaction.isPending}
          onCancel={() => setDeletingTransaction(null)}
          onConfirm={() =>
            deleteTransaction.mutate(deletingTransaction.id, {
              onSuccess: () => setDeletingTransaction(null),
            })
          }
        />
      )}
    </div>
  );
}

interface TransactionFormModalProps {
  transaction: Transaction | null;
  departments: { id: string; name: string }[];
  mandates: { id: string; label: string }[];
  documents: { id: string; name: string }[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => void;
}

function TransactionFormModal({
  transaction,
  departments,
  mandates,
  documents,
  isSaving,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? "EXPENSE",
      amount: transaction ? String(transaction.amount) : "",
      category: transaction?.category ?? "",
      description: transaction?.description ?? "",
      date: transaction ? transaction.date.slice(0, 10) : "",
      departmentId: transaction?.departmentId ?? "",
      mandateId: transaction?.mandateId ?? "",
      documentId: transaction?.documentId ?? "",
    },
  });

  return (
    <Modal title={transaction ? "Modifier la transaction" : "Nouvelle transaction"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" htmlFor="type" error={errors.type?.message}>
            <select id="type" className={inputClassName} {...register("type")}>
              <option value="INCOME">Recette</option>
              <option value="EXPENSE">Dépense</option>
            </select>
          </FormField>
          <FormField label="Montant (XOF)" htmlFor="amount" error={errors.amount?.message}>
            <input id="amount" type="number" step="1" className={inputClassName} {...register("amount")} />
          </FormField>
        </div>
        <FormField label="Catégorie" htmlFor="category" error={errors.category?.message}>
          <input id="category" className={inputClassName} {...register("category")} />
        </FormField>
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={2} className={inputClassName} {...register("description")} />
        </FormField>
        <FormField label="Date" htmlFor="date" error={errors.date?.message}>
          <input id="date" type="date" className={inputClassName} {...register("date")} />
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
        <FormField label="Document justificatif" htmlFor="documentId" error={errors.documentId?.message}>
          <select id="documentId" className={inputClassName} {...register("documentId")}>
            <option value="">Aucun</option>
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.name}
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
