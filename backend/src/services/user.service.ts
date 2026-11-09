import type { Prisma } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import { hashPassword } from "../utils/password";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "../validators/user.validator";

type UserWithProfile = Prisma.UserGetPayload<{ include: { memberProfile: true } }>;

function sanitizeUser(user: UserWithProfile) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const userService = {
  async list(query: ListUsersQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await userRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    });
    return buildPaginatedResult(items.map(sanitizeUser), total, query.page, query.limit);
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }
    return sanitizeUser(user);
  },

  async create(input: CreateUserInput) {
    const email = input.email.toLowerCase();
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Un compte existe déjà avec cet email", 409);
    }
    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({ email, passwordHash, role: input.role });
    return this.getById(user.id);
  },

  async update(id: string, input: UpdateUserInput) {
    await this.getById(id);
    await userRepository.updateRoleAndStatus(id, input);
    return this.getById(id);
  },

  async deactivate(id: string) {
    await this.getById(id);
    await userRepository.deactivate(id);
    return this.getById(id);
  },
};
