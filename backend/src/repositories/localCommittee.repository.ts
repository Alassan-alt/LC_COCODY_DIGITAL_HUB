import { prisma } from "../config/prisma";

const DEFAULT_LOCAL_COMMITTEE_NAME = "LC Cocody";

/**
 * Plateforme mono-LC pour l'instant (voir ARCHITECTURE_DECISIONS.md, Phase 5) :
 * aucune API CRUD publique pour LocalCommittee (non demandée par instruction.md),
 * un seul enregistrement est provisionné automatiquement au premier besoin.
 */
export async function getOrCreateDefaultLocalCommittee() {
  const existing = await prisma.localCommittee.findFirst();
  if (existing) {
    return existing;
  }
  return prisma.localCommittee.create({ data: { name: DEFAULT_LOCAL_COMMITTEE_NAME } });
}
