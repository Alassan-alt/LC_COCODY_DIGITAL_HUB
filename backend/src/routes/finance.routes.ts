import { Router } from "express";
import { financeController } from "../controllers/finance.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  balanceQuerySchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from "../validators/finance.validator";

export const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.use(authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"));

financeRouter.get("/balance", validateQuery(balanceQuerySchema), asyncHandler(financeController.getBalance));

financeRouter.get(
  "/transactions",
  validateQuery(listTransactionsQuerySchema),
  asyncHandler(financeController.list),
);
financeRouter.get(
  "/transactions/:id",
  validateObjectIdParam(),
  asyncHandler(financeController.getById),
);
financeRouter.post(
  "/transactions",
  authorize("SUPER_ADMIN", "LCP", "VP"),
  validate(createTransactionSchema),
  asyncHandler(financeController.create),
);
financeRouter.patch(
  "/transactions/:id",
  authorize("SUPER_ADMIN", "LCP", "VP"),
  validateObjectIdParam(),
  validate(updateTransactionSchema),
  asyncHandler(financeController.update),
);
financeRouter.delete(
  "/transactions/:id",
  authorize("SUPER_ADMIN", "LCP", "VP"),
  validateObjectIdParam(),
  asyncHandler(financeController.remove),
);
