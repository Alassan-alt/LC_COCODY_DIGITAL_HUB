import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const managerToken = signAuthToken({ sub: "000000000000000000000110", role: "LCP" });
const memberToken = signAuthToken({ sub: "000000000000000000000111", role: "MEMBER" });

let departmentId: string;

async function cleanup(): Promise<void> {
  await prisma.report.deleteMany({ where: { title: { startsWith: "Rapport TestCRUD" } } });
  await prisma.department.deleteMany({ where: { name: "Département TestCRUD Rapports" } });
}

beforeAll(async () => {
  await cleanup();
  const localCommittee =
    (await prisma.localCommittee.findFirst()) ??
    (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));
  const department = await prisma.department.create({
    data: { name: "Département TestCRUD Rapports", localCommitteeId: localCommittee.id },
  });
  departmentId = department.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Rapports — CRUD, génération à partir de données réelles, permissions", () => {
  let reportId: string;

  it("refuse tout accès à un simple MEMBER (403)", async () => {
    const response = await request(app).get("/api/reports").set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("crée un rapport manuel avec contenu fourni", async () => {
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "Rapport TestCRUD Mensuel", type: "MONTHLY", period: "2026-09", content: "Résumé manuel" });

    expect(response.status).toBe(201);
    expect(response.body.data.content).toBe("Résumé manuel");
    reportId = response.body.data.id;
  });

  it("génère un rapport départemental avec un contenu basé sur des données réelles", async () => {
    // donnée réelle vérifiable : un projet existant dans ce département
    const project = await prisma.project.create({
      data: { name: "Projet TestCRUD Pour Rapport", departmentId, ownerId: "000000000000000000000110" },
    });

    const response = await request(app)
      .post("/api/reports/generate")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "Rapport TestCRUD Départemental",
        type: "DEPARTMENTAL",
        period: "2026-09",
        departmentId,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.content).toContain("Projets : 1");
    expect(response.body.data.content).toContain("Solde financier");

    await prisma.project.deleteMany({ where: { id: project.id } });
  });

  it("filtre les rapports par type", async () => {
    const response = await request(app)
      .get("/api/reports")
      .query({ type: "MONTHLY", search: "Rapport TestCRUD" })
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.every((r: { type: string }) => r.type === "MONTHLY")).toBe(true);
  });

  it("met à jour et supprime un rapport", async () => {
    const update = await request(app)
      .patch(`/api/reports/${reportId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ content: "Résumé mis à jour" });
    expect(update.status).toBe(200);
    expect(update.body.data.content).toBe("Résumé mis à jour");

    const del = await request(app)
      .delete(`/api/reports/${reportId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(del.status).toBe(200);
  });
});
