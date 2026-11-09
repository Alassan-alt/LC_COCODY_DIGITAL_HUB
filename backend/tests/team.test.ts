import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminToken = signAuthToken({ sub: "000000000000000000000001", role: "SUPER_ADMIN" });
const memberToken = signAuthToken({ sub: "000000000000000000000003", role: "MEMBER" });

let departmentId: string;
let mandateId: string;

async function cleanup(): Promise<void> {
  await prisma.team.deleteMany({ where: { name: { startsWith: "Équipe Test" } } });
  await prisma.department.deleteMany({ where: { name: "Département Test — Équipes" } });
  await prisma.mandate.deleteMany({ where: { label: "Mandat Test — Équipes" } });
}

beforeAll(async () => {
  await cleanup();
  const localCommittee =
    (await prisma.localCommittee.findFirst()) ??
    (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));

  const department = await prisma.department.create({
    data: { name: "Département Test — Équipes", localCommitteeId: localCommittee.id },
  });
  const mandate = await prisma.mandate.create({
    data: {
      label: "Mandat Test — Équipes",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      localCommitteeId: localCommittee.id,
    },
  });
  departmentId = department.id;
  mandateId = mandate.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Équipes — CRUD, pagination, filtres, permissions, intégrité référentielle", () => {
  let createdId: string;

  it("refuse la création à un MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Équipe Test A", departmentId, mandateId });
    expect(response.status).toBe(403);
  });

  it("rejette une référence de département inexistante (404)", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ name: "Équipe Test A", departmentId: "000000000000000000000099", mandateId });
    expect(response.status).toBe(404);
  });

  it("crée une équipe (201)", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ name: "Équipe Test A", departmentId, mandateId });

    expect(response.status).toBe(201);
    createdId = response.body.data.id;
  });

  it("liste filtrée par département", async () => {
    const response = await request(app)
      .get("/api/teams")
      .query({ departmentId })
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((t: { id: string }) => t.id === createdId)).toBe(true);
  });

  it("met à jour une équipe (200)", async () => {
    const response = await request(app)
      .patch(`/api/teams/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ name: "Équipe Test A (renommée)" });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Équipe Test A (renommée)");
  });

  it("refuse la suppression d'une équipe ayant des membres rattachés (409)", async () => {
    const user = await prisma.user.create({
      data: { email: "team.member.test@lccocody.local", passwordHash: "x", role: "MEMBER" },
    });
    await prisma.memberProfile.create({
      data: { userId: user.id, firstName: "Test", lastName: "Équipe", teamId: createdId },
    });

    const response = await request(app)
      .delete(`/api/teams/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(409);

    await prisma.memberProfile.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });

  it("supprime une équipe sans membre (200)", async () => {
    const response = await request(app)
      .delete(`/api/teams/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(200);

    const getResponse = await request(app)
      .get(`/api/teams/${createdId}`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(getResponse.status).toBe(404);
  });
});
