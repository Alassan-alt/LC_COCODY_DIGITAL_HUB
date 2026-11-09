import { memberRepository } from "../repositories/member.repository";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateMemberInput,
  ListMembersQuery,
  UpdateMemberInput,
} from "../validators/member.validator";
import { recordAuditLog } from "./audit.service";

export const memberService = {
  async list(query: ListMembersQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await memberRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      departmentId: query.departmentId,
      teamId: query.teamId,
      mandateId: query.mandateId,
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string) {
    const member = await memberRepository.findById(id);
    if (!member) {
      throw new AppError("Membre introuvable", 404);
    }
    return member;
  },

  async create(input: CreateMemberInput, actorId: string) {
    const user = await userRepository.findById(input.userId);
    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }
    if (user.memberProfile) {
      throw new AppError("Cet utilisateur a déjà un profil membre", 409);
    }

    const member = await memberRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      position: input.position,
      user: { connect: { id: input.userId } },
      ...(input.departmentId ? { department: { connect: { id: input.departmentId } } } : {}),
      ...(input.teamId ? { team: { connect: { id: input.teamId } } } : {}),
      ...(input.mandateId ? { mandate: { connect: { id: input.mandateId } } } : {}),
    });

    await recordAuditLog({
      action: "MEMBER_CREATED",
      entityType: "MemberProfile",
      entityId: member.id,
      userId: actorId,
      metadata: { firstName: input.firstName, lastName: input.lastName },
    });

    return member;
  },

  async update(id: string, input: UpdateMemberInput, actorId: string) {
    await this.getById(id);
    const member = await memberRepository.update(id, input);

    await recordAuditLog({
      action: "MEMBER_UPDATED",
      entityType: "MemberProfile",
      entityId: id,
      userId: actorId,
      metadata: { fields: Object.keys(input) },
    });

    return member;
  },

  /**
   * Un profil membre est conservé pour la mémoire organisationnelle (RG-08) :
   * « supprimer » un membre désactive son compte utilisateur (isActive=false)
   * plutôt que d'effacer physiquement le profil.
   */
  async deactivate(id: string) {
    const member = await this.getById(id);
    await userRepository.deactivate(member.userId);
    return this.getById(id);
  },
};
