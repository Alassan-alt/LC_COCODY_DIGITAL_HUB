import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  deleteTransaction,
  getBalance,
  listTransactions,
  updateTransaction,
  type BalanceParams,
  type ListTransactionsParams,
  type TransactionInput,
} from "./api";

const QUERY_KEY = "transactions";
const BALANCE_KEY = "finance-balance";

export function useTransactions(params: ListTransactionsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listTransactions(params),
    placeholderData: (previous) => previous,
  });
}

export function useBalance(params: BalanceParams) {
  return useQuery({
    queryKey: [BALANCE_KEY, params],
    queryFn: () => getBalance(params),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BALANCE_KEY] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      updateTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BALANCE_KEY] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BALANCE_KEY] });
    },
  });
}
