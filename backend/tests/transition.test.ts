import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const lcpId = "000000000000000000000160";
const lcpToken = signAuthToken({ sub: lcpId, role: "LCP" });
const vpToken = signAuthToken({ sub: "000000000000000000000161", role: "VP" });
const memberToken = signAuthToken({ sub: "000000000000000000000162", role: "MEMBER" });

const otherLcpId = "000000000000000000000163";
const otherLcpToken = signAuthToken({ sub: otherLcpId, role: "LCP" });

let outgoingMandateId: string;
let incomingMandateId: string;

async function cleanup(): Promise<void> {
  await prisma.notification.deleteMany({ where: { relatedEntityType: "TransitionPackage" } });
  await prisma.transitionChecklistItem.deleteMany({
    where: { transitionPackage: { outgoingMandate: { label: { startsWith: "Mandat TestTransition" } } } },
  });
  await prisma.transitionPackage.deleteMany({
    where: { outgoingMandate: { label: { startsWith: "Mandat TestTransition" } } },
  });
  await prisma.project.deleteMany({ where: { name: "Projet TestTransition" } });
  await prisma.kPI.deleteMany({ where: { name: "KPI TestTransition" } });
  await prisma.mandate.deleteMany({ where: { label: { startsWith: "Mandat TestTransition" } } });
  await prisma.user.deleteMany({ where: { id: otherLcpId } });
}

beforeAll(async () => {
  await cleanup();
  const localCommittee =
    (await prisma.localCommittee.findFirst()) ??
    (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));

  const outgoing = await prisma.mandate.create({
    data: {
      label: "Mandat TestTransition Sortant",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      status: "ACTIVE",
      localCommitteeId: localCommittee.id,
    },
  });
  const incoming = await prisma.mandate.create({
    data: {
      label: "Mandat TestTransition Entrant",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      localCommitteeId: localCommittee.id,
    },
  });
  outgoingMandateId = outgoing.id;
  incomingMandateId = incoming.id;

  await prisma.user.create({
    data: { id: otherLcpId, email: "transition.otherlcp@lccocody.local", passwordHash: "x", role: "LCP" },
  });

  // Données réelles rattachées au mandat sortant, pour vérifier l'agrégation.
  await prisma.project.create({
    data: { name: "Projet TestTransition", mandateId: outgoingMandateId, ownerId: lcpId },
  });
  await prisma.kPI.create({
    data: {
      name: "KPI TestTransition",
      target: 100,
      currentValue: 80,
      period: "2024",
      mandateId: outgoingMandateId,
      createdById: lcpId,
    },
  });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Transition — package, agrégation de contenu réel, checklist, permissions", () => {
  let packageId: string;

  it("refuse l'accès à un simple MEMBER et à un VP (403) — réservé SUPER_ADMIN/LCP", async () => {
    const asMember = await request(app)
      .get("/api/transition-packages")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(asMember.status).toBe(403);

    const asVp = await request(app)
      .post("/api/transition-packages")
      .set("Authorization", `Bearer ${vpToken}`)
      .send({ outgoingMandateId });
    expect(asVp.status).toBe(403);
  });

  it("crée un package de transition et notifie la gouvernance (SUPER_ADMIN/LCP)", async () => {
    const response = await request(app)
      .post("/api/transition-packages")
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ outgoingMandateId, incomingMandateId, recommendations: "Bien documenter les accès" });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("DRAFT");
    packageId = response.body.data.id;

    const notifications = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${otherLcpToken}`);
    expect(notifications.body.items.some((n: { type: string }) => n.type === "TRANSITION")).toBe(true);
  });

  it("agrège du contenu réellement existant (projet, KPI, finances) pour le mandat sortant", async () => {
    const response = await request(app)
      .get(`/api/transition-packages/${packageId}/content`)
      .set("Authorization", `Bearer ${lcpToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.projects.some((p: { name: string }) => p.name === "Projet TestTransition")).toBe(
      true,
    );
    expect(response.body.data.kpis.some((k: { name: string }) => k.name === "KPI TestTransition")).toBe(true);
    expect(response.body.data.finance).toHaveProperty("balance");
    expect(response.body.data.recommendations).toBe("Bien documenter les accès");
  });

  it("gère la checklist de transition (ajout, mise à jour, suppression)", async () => {
    const create = await request(app)
      .post(`/api/transition-packages/${packageId}/checklist`)
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ label: "Transférer les accès aux comptes" });
    expect(create.status).toBe(201);
    const itemId = create.body.data.id;

    const update = await request(app)
      .patch(`/api/transition-packages/${packageId}/checklist/${itemId}`)
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ isDone: true });
    expect(update.status).toBe(200);
    expect(update.body.data.isDone).toBe(true);

    const list = await request(app)
      .get(`/api/transition-packages/${packageId}/checklist`)
      .set("Authorization", `Bearer ${lcpToken}`);
    expect(list.body.data).toHaveLength(1);

    const del = await request(app)
      .delete(`/api/transition-packages/${packageId}/checklist/${itemId}`)
      .set("Authorization", `Bearer ${lcpToken}`);
    expect(del.status).toBe(200);
  });

  it("met à jour le statut du package", async () => {
    const response = await request(app)
      .patch(`/api/transition-packages/${packageId}`)
      .set("Authorization", `Bearer ${lcpToken}`)
      .send({ status: "IN_PROGRESS" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("IN_PROGRESS");
  });
});
