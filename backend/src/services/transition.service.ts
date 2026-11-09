import { prisma } from "../config/prisma";
import { financeRepository } from "../repositories/finance.repository";
import { mandateRepository } from "../repositories/mandate.repository";
import {
  transitionChecklistRepository,
  transitionRepository,
} from "../repositories/transition.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateChecklistItemInput,
  CreateTransitionPackageInput,
  ListTransitionPackagesQuery,
  UpdateChecklistItemInput,
  UpdateTransitionPackageInput,
} from "../validators/transition.validator";
import { notificationService } from "./notification.service";

async function assertMandatesExist(input: {
  outgoingMandateId?: string;
  incomingMandateId?: string | null;
}): Promise<void> {
  if (input.outgoingMandateId) {
    const mandate = await mandateRepository.findById(input.outgoingMandateId);
    if (!mandate) {
      throw new AppError("Mandat sortant introuvable", 404);
    }
  }
  if (input.incomingMandateId) {
    const mandate = await mandateRepository.findById(input.incomingMandateId);
    if (!mandate) {
      throw new AppError("Mandat entrant introuvable", 404);
    }
  }
}

export const transitionService = {
  async list(query: ListTransitionPackagesQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await transitionRepository.findMany({
      skip,
      take: query.limit,
      outgoingMandateId: query.outgoingMandateId,
      incomingMandateId: query.incomingMandateId,
      status: query.status,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const transitionPackage = await transitionRepository.findById(id);
    if (!transitionPackage) {
      throw new AppError("Package de transition introuvable", 404);
    }
    return transitionPackage;
  },

  async create(input: CreateTransitionPackageInput, createdById: string) {
    await assertMandatesExist(input);
    const transitionPackage = await transitionRepository.create({ ...input, createdById });

    const mandate = await mandateRepository.findById(input.outgoingMandateId);
    await notificationService.notifyRoles(
      ["SUPER_ADMIN", "LCP"],
      "TRANSITION",
      `Un package de transition a été créé pour le mandat « ${mandate?.label ?? input.outgoingMandateId} »`,
      { relatedEntityType: "TransitionPackage", relatedEntityId: transitionPackage.id, excludeUserId: createdById },
    );

    return transitionPackage;
  },

  async update(id: string, input: UpdateTransitionPackageInput) {
    await this.getById(id);
    await assertMandatesExist(input);
    return transitionRepository.update(id, input);
  },

  /**
   * Le package de transition ne duplique pas de références (documents,
   * rapports, KPI, projets, finances, partenaires) : ces entités portent déjà
   * un `mandateId` (Phases 6-12). Le contenu est donc agrégé à la demande,
   * comme les rapports (Phase 12) — toujours à jour, pas de fausse donnée.
   */
  async getContent(id: string) {
    const transitionPackage = await this.getById(id);
    const mandateId = transitionPackage.outgoingMandateId;

    // Phase 20 — taille des réponses : un mandat peut accumuler des centaines
    // de documents/articles au fil du temps ; plafond raisonnable sur les
    // listes non naturellement bornées (identifié à la relecture, pas mesuré
    // sous charge — voir ARCHITECTURE_DECISIONS.md).
    const CONTENT_LIST_LIMIT = 200;

    const [documents, reports, kpis, projects, partners, finance, procedures, lessonsLearned] =
      await Promise.all([
        prisma.document.findMany({ where: { mandateId, isDeleted: false }, take: CONTENT_LIST_LIMIT }),
        prisma.report.findMany({ where: { mandateId }, take: CONTENT_LIST_LIMIT }),
        prisma.kPI.findMany({ where: { mandateId } }),
        prisma.project.findMany({ where: { mandateId } }),
        prisma.partner.findMany({ where: { mandateId } }),
        financeRepository.getBalance({ mandateId }),
        // La base de connaissances (Phase 15) n'est pas rattachée à un mandat
        // (un guide reste valable au-delà d'un seul mandat) : renvoyée entière,
        // plafonnée pour les mêmes raisons.
        prisma.knowledgeArticle.findMany({ take: CONTENT_LIST_LIMIT }),
        prisma.lessonLearned.findMany({ where: { project: { mandateId } } }),
      ]);

    return {
      documents,
      reports,
      kpis,
      projects,
      partners,
      finance,
      procedures,
      lessonsLearned,
      recommendations: transitionPackage.recommendations,
    };
  },

  async listChecklist(transitionPackageId: string) {
    await this.getById(transitionPackageId);
    return transitionChecklistRepository.findByPackage(transitionPackageId);
  },

  async addChecklistItem(transitionPackageId: string, input: CreateChecklistItemInput) {
    await this.getById(transitionPackageId);
    return transitionChecklistRepository.create({ label: input.label, transitionPackageId });
  },

  async updateChecklistItem(
    transitionPackageId: string,
    itemId: string,
    input: UpdateChecklistItemInput,
  ) {
    const item = await transitionChecklistRepository.findById(itemId);
    if (!item || item.transitionPackageId !== transitionPackageId) {
      throw new AppError("Élément de checklist introuvable pour ce package", 404);
    }
    return transitionChecklistRepository.update(itemId, input);
  },

  async deleteChecklistItem(transitionPackageId: string, itemId: string) {
    const item = await transitionChecklistRepository.findById(itemId);
    if (!item || item.transitionPackageId !== transitionPackageId) {
      throw new AppError("Élément de checklist introuvable pour ce package", 404);
    }
    await transitionChecklistRepository.delete(itemId);
  },
};
