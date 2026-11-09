import { departmentRepository } from "../repositories/department.repository";
import { getOrCreateDefaultLocalCommittee } from "../repositories/localCommittee.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateDepartmentInput,
  ListDepartmentsQuery,
  UpdateDepartmentInput,
} from "../validators/department.validator";

export const departmentService = {
  async list(query: ListDepartmentsQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await departmentRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      isActive: query.isActive,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError("Département introuvable", 404);
    }
    return department;
  },

  async create(input: CreateDepartmentInput) {
    const localCommittee = await getOrCreateDefaultLocalCommittee();
    return departmentRepository.create({ ...input, localCommitteeId: localCommittee.id });
  },

  async update(id: string, input: UpdateDepartmentInput) {
    await this.getById(id);
    return departmentRepository.update(id, input);
  },

  async softDelete(id: string) {
    await this.getById(id);
    return departmentRepository.softDelete(id);
  },
};
