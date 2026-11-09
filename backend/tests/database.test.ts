import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const prisma = new PrismaClient();

describe("Base de données — entités fondamentales (Phase 2)", () => {
  beforeAll(async () => {
    await prisma.memberProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();
    await prisma.department.deleteMany();
    await prisma.mandate.deleteMany();
    await prisma.localCommittee.deleteMany();
  });

  afterAll(async () => {
    await prisma.memberProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();
    await prisma.department.deleteMany();
    await prisma.mandate.deleteMany();
    await prisma.localCommittee.deleteMany();
    await prisma.$disconnect();
  });

  it("se connecte à MongoDB et effectue une requête simple", async () => {
    const count = await prisma.localCommittee.count();
    expect(count).toBe(0);
  });

  it("crée un LocalCommittee, un Mandate, un Department, un Team, un User et un MemberProfile liés", async () => {
    const localCommittee = await prisma.localCommittee.create({
      data: { name: "LC Test" },
    });

    const mandate = await prisma.mandate.create({
      data: {
        label: "Mandat Test",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        localCommitteeId: localCommittee.id,
      },
    });

    const department = await prisma.department.create({
      data: { name: "Département Test", localCommitteeId: localCommittee.id },
    });

    const team = await prisma.team.create({
      data: { name: "Équipe Test", departmentId: department.id, mandateId: mandate.id },
    });

    const user = await prisma.user.create({
      data: {
        email: "test.integration@lccocody.local",
        passwordHash: "hash-de-test-non-utilisable",
        role: "MEMBER",
      },
    });

    const memberProfile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        firstName: "Test",
        lastName: "Intégration",
        departmentId: department.id,
        teamId: team.id,
        mandateId: mandate.id,
      },
    });

    expect(localCommittee.id).toBeDefined();
    expect(mandate.localCommitteeId).toBe(localCommittee.id);
    expect(department.localCommitteeId).toBe(localCommittee.id);
    expect(team.departmentId).toBe(department.id);
    expect(team.mandateId).toBe(mandate.id);
    expect(memberProfile.userId).toBe(user.id);
    expect(memberProfile.departmentId).toBe(department.id);
    expect(memberProfile.teamId).toBe(team.id);
    expect(memberProfile.mandateId).toBe(mandate.id);
  });

  it("lit les relations imbriquées (include) correctement", async () => {
    const department = await prisma.department.findFirstOrThrow({
      where: { name: "Département Test" },
      include: {
        localCommittee: true,
        teams: true,
        memberProfiles: { include: { user: true } },
      },
    });

    expect(department.localCommittee.name).toBe("LC Test");
    expect(department.teams).toHaveLength(1);
    expect(department.memberProfiles).toHaveLength(1);
    expect(department.memberProfiles[0]?.user.email).toBe("test.integration@lccocody.local");
  });

  it("empêche la création d'un second User avec le même email (contrainte unique)", async () => {
    await expect(
      prisma.user.create({
        data: {
          email: "test.integration@lccocody.local",
          passwordHash: "autre-hash",
          role: "MEMBER",
        },
      }),
    ).rejects.toThrow();
  });

  it("empêche la création d'un second MemberProfile pour le même User (relation 1-1)", async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: "test.integration@lccocody.local" },
    });

    await expect(
      prisma.memberProfile.create({
        data: { userId: user.id, firstName: "Doublon", lastName: "Test" },
      }),
    ).rejects.toThrow();
  });
});
