import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminToken = signAuthToken({ sub: "000000000000000000000001", role: "SUPER_ADMIN" });
const teamLeaderToken = signAuthToken({ sub: "000000000000000000000004", role: "TEAM_LEADER" });
const memberToken = signAuthToken({ sub: "000000000000000000000003", role: "MEMBER" });

let userWithoutProfileId: string;

async function cleanup(): Promise<void> {
  await prisma.memberProfile.deleteMany({ where: { lastName: "MembreTest" } });
  await prisma.user.deleteMany({ where: { email: "member.crud.test@lccocody.local" } });
}

beforeAll(async () => {
  await cleanup();
  const user = await prisma.user.create({
    data: { email: "member.crud.test@lccocody.local", passwordHash: "x", role: "MEMBER" },
  });
  userWithoutProfileId = user.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Membres — CRUD, pagination, recherche, filtres, permissions", () => {
  let createdId: string;

  it("refuse l'accès à la liste à un simple MEMBER (403)", async () => {
    const response = await request(app).get("/api/members").set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("TEAM_LEADER peut lister mais pas créer (403 sur create)", async () => {
    const list = await request(app).get("/api/members").set("Authorization", `Bearer ${teamLeaderToken}`);
    expect(list.status).toBe(200);

    const create = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${teamLeaderToken}`)
      .send({ userId: userWithoutProfileId, firstName: "Test", lastName: "MembreTest" });
    expect(create.status).toBe(403);
  });

  it("rejette la création pour un utilisateur inexistant (404)", async () => {
    const response = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ userId: "000000000000000000000099", firstName: "Test", lastName: "MembreTest" });
    expect(response.status).toBe(404);
  });

  it("crée un profil membre pour un utilisateur existant (201)", async () => {
    const response = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ userId: userWithoutProfileId, firstName: "Test", lastName: "MembreTest", phone: "0000000000" });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe("member.crud.test@lccocody.local");
    createdId = response.body.data.id;
  });

  it("rejette un second profil pour le même utilisateur (409)", async () => {
    const response = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ userId: userWithoutProfileId, firstName: "Doublon", lastName: "MembreTest" });
    expect(response.status).toBe(409);
  });

  it("recherche par nom (pagination + search)", async () => {
    const response = await request(app)
      .get("/api/members")
      .query({ search: "MembreTest", page: 1, limit: 10 })
      .set("Authorization", `Bearer ${teamLeaderToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((m: { id: string }) => m.id === createdId)).toBe(true);
  });

  it("met à jour un profil membre (200)", async () => {
    const response = await request(app)
      .patch(`/api/members/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ position: "Bénévole" });

    expect(response.status).toBe(200);
    expect(response.body.data.position).toBe("Bénévole");
  });

  it("« supprime » un membre : désactive son compte utilisateur (200)", async () => {
    const response = await request(app)
      .delete(`/api/members/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.isActive).toBe(false);
  });
});
