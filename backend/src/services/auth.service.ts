import type { Prisma } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { signAuthToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import type { LoginInput, RegisterInput } from "../validators/auth.validator";
import { recordAuditLog } from "./audit.service";

type UserWithProfile = Prisma.UserGetPayload<{ include: { memberProfile: true } }>;

function sanitizeUser(user: UserWithProfile) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const authService = {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Un compte existe déjà avec cet email", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.createWithMemberProfile({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const token = signAuthToken({ sub: user.id, role: user.role });
    return { user: sanitizeUser(user), token };
  },

  async login(input: LoginInput) {
    const email = input.email.toLowerCase();
    const user = await userRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new AppError("Email ou mot de passe incorrect", 401);
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Email ou mot de passe incorrect", 401);
    }

    const token = signAuthToken({ sub: user.id, role: user.role });

    await recordAuditLog({
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      userId: user.id,
    });

    return { user: sanitizeUser(user), token };
  },

  async getById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }
    return sanitizeUser(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError("Mot de passe actuel incorrect", 401);
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePasswordHash(userId, passwordHash);
  },
};
