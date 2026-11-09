import type { Request, Response } from "express";
import { financeService } from "../services/finance.service";
import type {
  BalanceQuery,
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from "../validators/finance.validator";

export const financeController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await financeService.list(req.query as unknown as ListTransactionsQuery);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const transaction = await financeService.getById(req.params.id);
    res.status(200).json({ success: true, data: transaction });
  },

  async create(req: Request, res: Response): Promise<void> {
    const transaction = await financeService.create(req.body as CreateTransactionInput, req.user!.sub);
    res.status(201).json({ success: true, data: transaction });
  },

  async update(req: Request, res: Response): Promise<void> {
    const transaction = await financeService.update(req.params.id, req.body as UpdateTransactionInput);
    res.status(200).json({ success: true, data: transaction });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const transaction = await financeService.remove(req.params.id);
    res.status(200).json({ success: true, data: transaction });
  },

  async getBalance(req: Request, res: Response): Promise<void> {
    const balance = await financeService.getBalance(req.query as unknown as BalanceQuery);
    res.status(200).json({ success: true, data: balance });
  },
};
