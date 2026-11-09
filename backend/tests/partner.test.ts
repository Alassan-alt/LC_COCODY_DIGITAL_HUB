import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const responsibleId = "000000000000000000000090";
const managerToken = signAuthToken({ sub: responsibleId, role: "VP" });
const memberToken = signAuthToken({ sub: "000000000000000000000091", role: "MEMBER" });

async function cleanup(): Promise<void> {
  await prisma.partnerActivity.deleteMany({ where: { partner: { name: { startsWith: "Partenaire TestCRUD" } } } });
  await prisma.partner.deleteMany({ where: { name: { startsWith: "Partenaire TestCRUD" } } });
  await prisma.user.deleteMany({ where: { id: responsibleId } });
}

beforeAll(async () => {
  await cleanup();
  await prisma.user.create({
    data: { id: responsibleId, email: "partner.responsible@lccocody.local", passwordHash: "x", role: "VP" },
  });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Partenaires — mini CRM (pipeline, notes, historique, permissions)", () => {
  let partnerId: string;

  it("refuse tout accès à un simple MEMBER (403)", async () => {
    const response = await request(app).get("/api/partners").set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("rejette un responsable inexistant (404)", async () => {
    const response = await request(app)
      .post("/api/partners")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Partenaire TestCRUD X", responsibleId: "000000000000000000000099" });
    expect(response.status).toBe(404);
  });

  it("crée un partenaire (statut PROSPECT par défaut)", async () => {
    const response = await request(app)
      .post("/api/partners")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "Partenaire TestCRUD Banque Atlantique",
        contactEmail: "contact@banqueatlantique.example",
        responsibleId,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("PROSPECT");
    partnerId = response.body.data.id;
  });

  it("ajoute une note de suivi sans changer le statut", async () => {
    const response = await request(app)
      .post(`/api/partners/${partnerId}/activities`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ note: "Premier contact téléphonique effectué" });

    expect(response.status).toBe(201);
    expect(response.body.data.toStatus).toBeNull();

    const partner = await request(app)
      .get(`/api/partners/${partnerId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(partner.body.data.status).toBe("PROSPECT");
  });

  it("fait avancer le pipeline via une activité avec changement de statut", async () => {
    const response = await request(app)
      .post(`/api/partners/${partnerId}/activities`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ note: "Rendez-vous fixé la semaine prochaine", status: "MEETING" });

    expect(response.status).toBe(201);
    expect(response.body.data.fromStatus).toBe("PROSPECT");
    expect(response.body.data.toStatus).toBe("MEETING");

    const partner = await request(app)
      .get(`/api/partners/${partnerId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(partner.body.data.status).toBe("MEETING");
  });

  it("liste l'historique complet (notes + changements de statut)", async () => {
    const response = await request(app)
      .get(`/api/partners/${partnerId}/activities`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it("filtre la liste par statut", async () => {
    const response = await request(app)
      .get("/api/partners")
      .query({ status: "MEETING", search: "Partenaire TestCRUD" })
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((p: { id: string }) => p.id === partnerId)).toBe(true);
  });

  it("refuse la suppression d'un partenaire ayant un historique (409)", async () => {
    const response = await request(app)
      .delete(`/api/partners/${partnerId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(409);
  });

  it("supprime un partenaire sans historique", async () => {
    const fresh = await request(app)
      .post("/api/partners")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Partenaire TestCRUD Sans Historique", responsibleId });

    const response = await request(app)
      .delete(`/api/partners/${fresh.body.data.id}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(200);
  });
});
