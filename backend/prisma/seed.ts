/* eslint-disable no-console */
/**
 * Script de seed — Phase 2 (DATABASE).
 * Données strictement fictives (noms, emails, mots de passe de démo).
 * Ne jamais utiliser de vraies données personnelles ni de vrais processus AIESEC
 * ici (voir PROJECT_CONTEXT.md, interdits absolus).
 */
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Nettoyage des données de démonstration existantes...");
  await prisma.memberProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.mandate.deleteMany();
  await prisma.localCommittee.deleteMany();

  console.log("Création du Local Committee de démonstration...");
  const localCommittee = await prisma.localCommittee.create({
    data: { name: "LC Cocody (démo)" },
  });

  const mandate = await prisma.mandate.create({
    data: {
      label: "Mandat Démo 2025-2026",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      status: "ACTIVE",
      localCommitteeId: localCommittee.id,
    },
  });

  const [deptProjets, deptFinance] = await Promise.all([
    prisma.department.create({
      data: { name: "Département Démo — Projets", localCommitteeId: localCommittee.id },
    }),
    prisma.department.create({
      data: { name: "Département Démo — Finance", localCommitteeId: localCommittee.id },
    }),
  ]);

  const teamProjets = await prisma.team.create({
    data: { name: "Équipe Démo Projets A", departmentId: deptProjets.id, mandateId: mandate.id },
  });

  const demoPasswordHash = await bcrypt.hash("Demo-Password-123!", 10);

  const demoUsers: Array<{
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    departmentId?: string;
    teamId?: string;
  }> = [
    { email: "admin.demo@lccocody.local", role: "SUPER_ADMIN", firstName: "Demo", lastName: "Admin" },
    {
      email: "lcp.demo@lccocody.local",
      role: "LCP",
      firstName: "Demo",
      lastName: "LCP",
    },
    {
      email: "vp.demo@lccocody.local",
      role: "VP",
      firstName: "Demo",
      lastName: "VP",
      departmentId: deptProjets.id,
    },
    {
      email: "teamleader.demo@lccocody.local",
      role: "TEAM_LEADER",
      firstName: "Demo",
      lastName: "TeamLeader",
      departmentId: deptProjets.id,
      teamId: teamProjets.id,
    },
    {
      email: "member.demo@lccocody.local",
      role: "MEMBER",
      firstName: "Demo",
      lastName: "Membre",
      departmentId: deptProjets.id,
      teamId: teamProjets.id,
    },
  ];

  console.log("Création des utilisateurs et profils de démonstration...");
  for (const demoUser of demoUsers) {
    const user = await prisma.user.create({
      data: {
        email: demoUser.email,
        passwordHash: demoPasswordHash,
        role: demoUser.role,
      },
    });

    await prisma.memberProfile.create({
      data: {
        userId: user.id,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        departmentId: demoUser.departmentId,
        teamId: demoUser.teamId,
        mandateId: mandate.id,
      },
    });
  }

  console.log(`Seed terminé : ${demoUsers.length} utilisateurs, 2 départements, 1 équipe, 1 mandat.`);
  console.log("Département Finance (démo) créé sans équipe rattachée :", deptFinance.name);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
