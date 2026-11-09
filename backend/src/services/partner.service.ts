import { mandateRepository } from "../repositories/mandate.repository";
import { partnerActivityRepository, partnerRepository } from "../repositories/partner.repository";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  AddActivityInput,
  CreatePartnerInput,
  ListPartnersQuery,
  UpdatePartnerInput,
} from "../validators/partner.validator";

async function assertReferencesExist(input: {
  responsibleId?: string;
  mandateId?: string | null;
}): Promise<void> {
  if (input.responsibleId) {
    const responsible = await userRepository.findById(input.responsibleId);
    if (!responsible) {
      throw new AppError("Responsable introuvable", 404);
    }
  }
  if (input.mandateId) {
    const mandate = await mandateRepository.findById(input.mandateId);
    if (!mandate) {
      throw new AppError("Mandat introuvable", 404);
    }
  }
}

export const partnerService = {
  async list(query: ListPartnersQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await partnerRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      status: query.status,
      responsibleId: query.responsibleId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const partner = await partnerRepository.findById(id);
    if (!partner) {
      throw new AppError("Partenaire introuvable", 404);
    }
    return partner;
  },

  async create(input: CreatePartnerInput) {
    await assertReferencesExist(input);
    return partnerRepository.create(input);
  },

  async update(id: string, input: UpdatePartnerInput) {
    await this.getById(id);
    await assertReferencesExist(input);
    return partnerRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const activityCount = await partnerRepository.countActivities(id);
    if (activityCount > 0) {
      throw new AppError("Impossible de supprimer un partenaire ayant un historique de suivi", 409);
    }
    await partnerRepository.delete(id);
  },

  async listActivities(partnerId: string) {
    await this.getById(partnerId);
    return partnerActivityRepository.findByPartner(partnerId);
  },

  /** Ajoute une note de suivi et, si un nouveau statut est fourni, fait avancer le pipeline. */
  async addActivity(partnerId: string, input: AddActivityInput, authorId: string) {
    const partner = await this.getById(partnerId);

    const statusChanged = input.status && input.status !== partner.status;

    const activity = await partnerActivityRepository.create({
      note: input.note,
      ...(statusChanged ? { fromStatus: partner.status, toStatus: input.status } : {}),
      partnerId,
      authorId,
    });

    if (statusChanged) {
      await partnerRepository.update(partnerId, { status: input.status });
    }

    return activity;
  },
};
