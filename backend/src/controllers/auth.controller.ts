import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../validators/auth.validator";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body as LoginInput);
    res.status(200).json({ success: true, data: result });
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError("Authentification requise", 401);
    }
    const user = await authService.getById(req.user.sub);
    res.status(200).json({ success: true, data: { user } });
  },

  logout(_req: Request, res: Response): void {
    // JWT sans état côté serveur : la déconnexion consiste à supprimer le
    // token côté client. Aucune donnée serveur à invalider pour l'instant.
    res.status(200).json({ success: true, message: "Déconnexion effectuée" });
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError("Authentification requise", 401);
    }
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    await authService.changePassword(req.user.sub, currentPassword, newPassword);
    res.status(200).json({ success: true, message: "Mot de passe mis à jour" });
  },
};
