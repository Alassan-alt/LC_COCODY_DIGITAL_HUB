import { config } from "dotenv";
import { afterAll } from "vitest";

config({ path: ".env.test", override: true });

/**
 * Filet de sécurité : la base de test est isolée (jamais les données de dev),
 * donc un nettoyage complet après chaque fichier de test est sans risque.
 * Ajouté après plusieurs occurrences du même bug (un `AuditLog`/enregistrement
 * lié non nettoyé bloquant la suppression de son parent) répétées dans
 * plusieurs fichiers — voir ARCHITECTURE_DECISIONS.md (Phase 18).
 * L'ordre respecte les dépendances (enfants avant parents).
 */
afterAll(async () => {
  const { prisma } = await import("../src/config/prisma");

  await prisma.transitionChecklistItem.deleteMany();
  await prisma.transitionPackage.deleteMany();
  await prisma.lessonLearned.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.partnerActivity.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.report.deleteMany();
  await prisma.kPI.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.meetingDecision.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.team.deleteMany();
  await prisma.memberProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.mandate.deleteMany();
  await prisma.localCommittee.deleteMany();
});
