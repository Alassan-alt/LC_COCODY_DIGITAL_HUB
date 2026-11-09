import { Router } from "express";
import { auditLogController } from "../controllers/auditLog.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { listAuditLogsQuerySchema } from "../validators/auditLog.validator";

export const auditLogRouter = Router();

// Lecture seule, réservée à SUPER_ADMIN/LCP (RG-06 : non modifiable par les
// utilisateurs ordinaires — aucune route POST/PATCH/DELETE n'existe ici).
auditLogRouter.use(authenticate, authorize("SUPER_ADMIN", "LCP"));

auditLogRouter.get("/", validateQuery(listAuditLogsQuerySchema), asyncHandler(auditLogController.list));
