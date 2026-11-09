import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminToken = signAuthToken({ sub: "000000000000000000000001", role: "SUPER_ADMIN" });
const memberToken = signAuthToken({ sub: "000000000000000000000003", role: "MEMBER" });

async function cleanup(): Promise<void> {
  await prisma.mandate.deleteMany({ where: { label: { startsWith: "Mandat TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Mandats — CRUD, pagination, recherche, filtres, permissions", () => {
  let createdId: string;

  it("refuse la création à un MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/mandates")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ label: "Mandat TestCRUD 2025", startDate: "2025-01-01", endDate: "2025-12-31" });
    expect(response.status).toBe(403);
  });

  it("rejette une date de fin antérieure à la date de début (400)", async () => {
    const response = await request(app)
      .post("/api/mandates")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ label: "Mandat TestCRUD Invalide", startDate: "2025-12-31", endDate: "2025-01-01" });
    expect(response.status).toBe(400);
  });

  it("crée un mandat (201)", async () => {
    const response = await request(app)
      .post("/api/mandates")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ label: "Mandat TestCRUD 2025-2026", startDate: "2025-07-01", endDate: "2026-06-30" });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("ACTIVE");
    createdId = response.body.data.id;
  });

  it("liste avec filtre de statut", async () => {
    const response = await request(app)
      .get("/api/mandates")
      .query({ status: "ACTIVE", search: "Mandat TestCRUD" })
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((m: { id: string }) => m.id === createdId)).toBe(true);
  });

  it("met à jour un mandat (200)", async () => {
    const response = await request(app)
      .patch(`/api/mandates/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ label: "Mandat TestCRUD 2025-2026 (modifié)" });

    expect(response.status).toBe(200);
    expect(response.body.data.label).toBe("Mandat TestCRUD 2025-2026 (modifié)");
  });

  it("« supprime » un mandat en le clôturant (200, status CLOSED)", async () => {
    const response = await request(app)
      .delete(`/api/mandates/${createdId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("CLOSED");
  });
});
