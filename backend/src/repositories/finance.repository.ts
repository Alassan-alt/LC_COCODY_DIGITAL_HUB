import type { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../config/prisma";

function buildDateRangeWhere(dateFrom?: Date, dateTo?: Date): Prisma.FinancialTransactionWhereInput {
  if (!dateFrom && !dateTo) return {};
  return {
    date: {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    },
  };
}

export const financeRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    type?: TransactionType;
    category?: string;
    departmentId?: string;
    mandateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: Prisma.FinancialTransactionWhereInput = {
      isDeleted: false,
      ...(params.search ? { category: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
      ...buildDateRangeWhere(params.dateFrom, params.dateTo),
    };

    const [items, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { date: "desc" },
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.financialTransaction.findUnique({ where: { id } });
  },

  create(data: {
    type: TransactionType;
    amount: number;
    currency: string;
    category: string;
    description?: string;
    date: Date;
    departmentId?: string;
    mandateId?: string;
    documentId?: string;
    recordedById: string;
  }) {
    return prisma.financialTransaction.create({ data });
  },

  update(id: string, data: Prisma.FinancialTransactionUpdateInput) {
    return prisma.financialTransaction.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.financialTransaction.update({ where: { id }, data: { isDeleted: true } });
  },

  async getBalance(params: {
    departmentId?: string;
    mandateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const baseWhere: Prisma.FinancialTransactionWhereInput = {
      isDeleted: false,
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
      ...buildDateRangeWhere(params.dateFrom, params.dateTo),
    };

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { ...baseWhere, type: "INCOME" },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { ...baseWhere, type: "EXPENSE" },
        _sum: { amount: true },
      }),
    ]);

    const income = incomeAgg._sum.amount ?? 0;
    const expense = expenseAgg._sum.amount ?? 0;

    return { income, expense, balance: income - expense };
  },
};
