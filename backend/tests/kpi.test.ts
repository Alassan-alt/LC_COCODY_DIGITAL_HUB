import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const managerToken = signAuthToken({ sub: "000000000000000000000100", role: "VP" });
const memberToken = signAuthToken({ sub: "000000000000000000000101", role: "MEMBER" });

async function cleanup(): Promise<void> {
  await prisma.kPI.deleteMany({ where: { name: { startsWith: "KPI TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("KPI — CRUD, progression calculée, permissions", () => {
  let kpiId: string;

  it("refuse la création à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/kpis")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "KPI TestCRUD X", target: 100, period: "2026-Q1" });
    expect(response.status).toBe(403);
  });

  it("crée un KPI et calcule la progression (0/100 = 0%)", async () => {
    const response = await request(app)
      .post("/api/kpis")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "KPI TestCRUD Recrutement", target: 100, period: "2026-Q1", unit: "membres" });

    expect(response.status).toBe(201);
    expect(response.body.data.progressPercent).toBe(0);
    kpiId = response.body.data.id;
  });

  it("met à jour la valeur actuelle et recalcule la progression", async () => {
    const response = await request(app)
      .patch(`/api/kpis/${kpiId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ currentValue: 40 });

    expect(response.status).toBe(200);
    expect(response.body.data.progressPercent).toBe(40);
  });

  it("liste et filtre les KPI (accessible à tout rôle authentifié en lecture)", async () => {
    const response = await request(app)
      .get("/api/kpis")
      .query({ search: "KPI TestCRUD" })
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((k: { id: string }) => k.id === kpiId)).toBe(true);
    expect(response.body.items.find((k: { id: string }) => k.id === kpiId).progressPercent).toBe(40);
  });

  it("supprime le KPI", async () => {
    const response = await request(app)
      .delete(`/api/kpis/${kpiId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(200);
  });
});
