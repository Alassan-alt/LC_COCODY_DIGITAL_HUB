import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

/**
 * Doit toujours être utilisé après `authenticate` (dépend de req.user).
 * Liste blanche explicite par route — pas de hiérarchie de rôles implicite
 * tant qu'elle n'est pas confirmée par le responsable du LC (voir
 * ARCHITECTURE_DECISIONS.md, Phase 4).
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentification requise", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Permissions insuffisantes pour cette action", 403));
      return;
    }

    next();
  };
}
