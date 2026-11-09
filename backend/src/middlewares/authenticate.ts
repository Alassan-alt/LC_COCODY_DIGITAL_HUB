import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAuthToken } from "../utils/jwt";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Authentification requise", 401));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(new AppError("Token invalide ou expiré", 401));
  }
}
