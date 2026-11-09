import { departmentRepository } from "../repositories/department.repository";
import { documentRepository } from "../repositories/document.repository";
import { financeRepository } from "../repositories/finance.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  BalanceQuery,
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from "../validators/finance.validator";

async function assertReferencesExist(input: {
  departmentId?: string | null;
  mandateId?: string | null;
  documentId?: string | null;
}): Promise<void> {
  if (input.departmentId) {
    const department = await departmentRepository.findById(input.departmentId);
    if (!department) {
      throw new AppError("Département introuvable", 404);
    }
  }
  if (input.mandateId) {
    const mandate = await mandateRepository.findById(input.mandateId);
    if (!mandate) {
      throw new AppError("Mandat introuvable", 404);
    }
  }
  if (input.documentId) {
    const document = await documentRepository.findById(input.documentId);
    if (!document || document.isDeleted) {
      throw new AppError("Document justificatif introuvable", 404);
    }
  }
}

export const financeService = {
  async list(query: ListTransactionsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await financeRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      type: query.type,
      category: query.category,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const transaction = await financeRepository.findById(id);
    if (!transaction || transaction.isDeleted) {
      throw new AppError("Transaction introuvable", 404);
    }
    return transaction;
  },

  async create(input: CreateTransactionInput, recordedById: string) {
    await assertReferencesExist(input);
    return financeRepository.create({ ...input, recordedById });
  },

  async update(id: string, input: UpdateTransactionInput) {
    await this.getById(id);
    await assertReferencesExist(input);
    return financeRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    return financeRepository.softDelete(id);
  },

  async getBalance(query: BalanceQuery) {
    return financeRepository.getBalance(query);
  },
};
