import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminToken = signAuthToken({ sub: "000000000000000000000001", role: "SUPER_ADMIN" });
const lcpToken = signAuthToken({ sub: "000000000000000000000002", role: "LCP" });
const memberToken = signAuthToken({ sub: "000000000000000000000003", role: "MEMBER" });

const testEmail = "user.crud.test@lccocody.local";

async function cleanup(): Promise<void> {
  await prisma.user.deleteMany({ where: { email: testEmail } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Utilisateurs (admin) — CRUD, pagination, recherche, filtres, permissions", () => {
  let createdId: string;

  it("refuse l'accès à la liste à un MEMBER (403)", async () => {
    const response = await request(app).get("/api/users").set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("refuse la création à un LCP (403) — réservé SUPER_ADMIN", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ email: testEmail, password: "Password-123!", role: "VP" });
    expect(response.status).toBe(403);
  });

  it("crée un utilisateur (201) en tant que SUPER_ADMIN", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ email: testEmail, password: "Password-123!", role: "VP" });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe(testEmail);
    expect(response.body.data.role).toBe("VP");
    expect(response.body.data.passwordHash).toBeUndefined();
    createdId = response.body.data.id;
  });

  it("rejette un email déjà utilisé (409)", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ email: testEmail, password: "Password-123!", role: "MEMBER" });
    expect(response.status).toBe(409);
  });

  it("LCP peut lister et lire (200), lecture seule", async () => {
    const list = await request(app).get("/api/users").set("Authorization", `Bearer ${lcpToken}`);
    expect(list.status).toBe(200);
    expect(list.body.items.some((u: { id: string }) => u.id === createdId)).toBe(true);

    const detail = await request(app)
      .get(`/api/users/${createdId}`)
      .set("Authorization", `Bearer ${lcpToken}`);
    expect(detail.status).toBe(200);
  });

  it("filtre la liste par rôle", async () => {
    const response = await request(app)
      .get("/api/users")
      .query({ role: "VP", search: "user.crud.test" })
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.every((u: { role: string }) => u.role === "VP")).toBe(true);
  });

  it("LCP ne peut pas modifier le rôle (403)", async () => {
    const response = await request(app)
      .patch(`/api/users/${createdId}`)
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ role: "TEAM_LEADER" });
    expect(response.status).toBe(403);
  });

  it("SUPER_ADMIN modifie le rôle (200)", async () => {
    const response = await request(app)
      .patch(`/api/users/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ role: "TEAM_LEADER" });

    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe("TEAM_LEADER");
  });

  it("désactive (DELETE) l'utilisateur (200, isActive=false)", async () => {
    const response = await request(app)
      .delete(`/api/users/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isActive).toBe(false);
  });

  it("un utilisateur désactivé ne peut plus se connecter (401)", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "Password-123!" });
    expect(response.status).toBe(401);
  });
});
