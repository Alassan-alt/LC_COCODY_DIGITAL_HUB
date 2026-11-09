import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminToken = signAuthToken({ sub: "000000000000000000000001", role: "SUPER_ADMIN" });
const lcpToken = signAuthToken({ sub: "000000000000000000000002", role: "LCP" });
const memberToken = signAuthToken({ sub: "000000000000000000000003", role: "MEMBER" });

async function cleanup(): Promise<void> {
  await prisma.department.deleteMany({ where: { name: { startsWith: "Département TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Départements — CRUD, pagination, recherche, filtres, permissions", () => {
  let createdId: string;

  it("refuse la création sans authentification (401)", async () => {
    const response = await request(app).post("/api/departments").send({ name: "Département TestCRUD X" });
    expect(response.status).toBe(401);
  });

  it("refuse la création à un MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Département TestCRUD X" });
    expect(response.status).toBe(403);
  });

  it("crée un département (201) avec un rôle autorisé", async () => {
    const response = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ name: "Département TestCRUD Projets", description: "Démo" });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Département TestCRUD Projets");
    expect(response.body.data.isActive).toBe(true);
    createdId = response.body.data.id;
  });

  it("rejette un nom vide (400)", async () => {
    const response = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ name: "" });
    expect(response.status).toBe(400);
  });

  it("lit un département par id (200), accessible à tout rôle authentifié", async () => {
    const response = await request(app)
      .get(`/api/departments/${createdId}`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(createdId);
  });

  it("retourne 404 pour un id inexistant", async () => {
    const response = await request(app)
      .get("/api/departments/000000000000000000000099")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(404);
  });

  it("retourne 400 pour un id malformé", async () => {
    const response = await request(app)
      .get("/api/departments/pas-un-id")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(400);
  });

  it("liste avec pagination et recherche", async () => {
    const response = await request(app)
      .get("/api/departments")
      .query({ page: 1, limit: 5, search: "Département TestCRUD Projets" })
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(5);
    expect(response.body.items.some((d: { id: string }) => d.id === createdId)).toBe(true);
  });

  it("met à jour un département (200)", async () => {
    const response = await request(app)
      .patch(`/api/departments/${createdId}`)
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ description: "Nouvelle description" });

    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe("Nouvelle description");
  });

  it("filtre par isActive après désactivation (suppression logique)", async () => {
    const del = await request(app)
      .delete(`/api/departments/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(del.status).toBe(200);
    expect(del.body.data.isActive).toBe(false);

    const list = await request(app)
      .get("/api/departments")
      .query({ isActive: false, search: "Département TestCRUD Projets" })
      .set("Authorization", `Bearer ${memberToken}`);
    expect(list.body.items.some((d: { id: string }) => d.id === createdId)).toBe(true);
  });
});
