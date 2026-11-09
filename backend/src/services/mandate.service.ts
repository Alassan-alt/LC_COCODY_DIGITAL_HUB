import { getOrCreateDefaultLocalCommittee } from "../repositories/localCommittee.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateMandateInput,
  ListMandatesQuery,
  UpdateMandateInput,
} from "../validators/mandate.validator";

export const mandateService = {
  async list(query: ListMandatesQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await mandateRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      status: query.status,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const mandate = await mandateRepository.findById(id);
    if (!mandate) {
      throw new AppError("Mandat introuvable", 404);
    }
    return mandate;
  },

  async create(input: CreateMandateInput) {
    const localCommittee = await getOrCreateDefaultLocalCommittee();
    return mandateRepository.create({ ...input, localCommitteeId: localCommittee.id });
  },

  async update(id: string, input: UpdateMandateInput) {
    await this.getById(id);
    return mandateRepository.update(id, input);
  },

  /**
   * Un mandat porte l'historique de tout un cycle du LC (RG-08) : pas de
   * suppression physique. « Supprimer » un mandat le clôture (status CLOSED).
   */
  async close(id: string) {
    await this.getById(id);
    return mandateRepository.close(id);
  },
};
