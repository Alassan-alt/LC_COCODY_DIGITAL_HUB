import type { KPI } from "@prisma/client";
import { departmentRepository } from "../repositories/department.repository";
import { kpiRepository } from "../repositories/kpi.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type { CreateKpiInput, ListKpisQuery, UpdateKpiInput } from "../validators/kpi.validator";

function withProgress<T extends Pick<KPI, "target" | "currentValue">>(kpi: T) {
  const progressPercent = Math.round((kpi.currentValue / kpi.target) * 100);
  return { ...kpi, progressPercent };
}

async function assertReferencesExist(input: {
  departmentId?: string | null;
  mandateId?: string | null;
}): Promise<void> {
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
}

export const kpiService = {
  async list(query: ListKpisQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await kpiRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items.map(withProgress), total, query.page, query.limit);
  },

  async getById(id: string) {
    const kpi = await kpiRepository.findById(id);
    if (!kpi) {
      throw new AppError("KPI introuvable", 404);
    }
    return withProgress(kpi);
  },

  async create(input: CreateKpiInput, createdById: string) {
    await assertReferencesExist(input);
    const kpi = await kpiRepository.create({ ...input, createdById });
    return withProgress(kpi);
  },

  async update(id: string, input: UpdateKpiInput) {
    await this.getById(id);
    await assertReferencesExist(input);
    const kpi = await kpiRepository.update(id, input);
    return withProgress(kpi);
  },

  async remove(id: string) {
    await this.getById(id);
    await kpiRepository.delete(id);
  },
};
