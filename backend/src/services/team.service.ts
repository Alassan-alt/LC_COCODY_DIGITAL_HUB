import { departmentRepository } from "../repositories/department.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { teamRepository } from "../repositories/team.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type { CreateTeamInput, ListTeamsQuery, UpdateTeamInput } from "../validators/team.validator";

export const teamService = {
  async list(query: ListTeamsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await teamRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError("Équipe introuvable", 404);
    }
    return team;
  },

  async create(input: CreateTeamInput) {
    const [department, mandate] = await Promise.all([
      departmentRepository.findById(input.departmentId),
      mandateRepository.findById(input.mandateId),
    ]);
    if (!department) {
      throw new AppError("Département introuvable", 404);
    }
    if (!mandate) {
      throw new AppError("Mandat introuvable", 404);
    }
    return teamRepository.create(input);
  },

  async update(id: string, input: UpdateTeamInput) {
    await this.getById(id);
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
    return teamRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const memberCount = await teamRepository.countMembers(id);
    if (memberCount > 0) {
      throw new AppError(
        "Impossible de supprimer une équipe qui a encore des membres rattachés",
        409,
      );
    }
    await teamRepository.delete(id);
  },
};
