import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  date: string;
  departmentId: string | null;
  mandateId: string | null;
  documentId: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListTransactionsParams {
  page?: number;
  search?: string;
  type?: TransactionType;
  category?: string;
  departmentId?: string;
  mandateId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listTransactions(
  params: ListTransactionsParams,
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await api.get<PaginatedResponse<Transaction>>("/finance/transactions", { params });
  return data;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  currency?: string;
  category: string;
  description?: string;
  date: string;
  departmentId?: string;
  mandateId?: string;
  documentId?: string;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await api.post<{ success: boolean; data: Transaction }>(
    "/finance/transactions",
    input,
  );
  return data.data;
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>,
): Promise<Transaction> {
  const { data } = await api.patch<{ success: boolean; data: Transaction }>(
    `/finance/transactions/${id}`,
    input,
  );
  return data.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/finance/transactions/${id}`);
}

export interface Balance {
  income: number;
  expense: number;
  balance: number;
}

export interface BalanceParams {
  departmentId?: string;
  mandateId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getBalance(params: BalanceParams): Promise<Balance> {
  const { data } = await api.get<{ success: boolean; data: Balance }>("/finance/balance", { params });
  return data.data;
}
