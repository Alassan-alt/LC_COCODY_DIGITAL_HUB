import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const organizerId = "000000000000000000000060";
const organizerToken = signAuthToken({ sub: organizerId, role: "TEAM_LEADER" });
const memberId = "000000000000000000000061";
const memberToken = signAuthToken({ sub: memberId, role: "MEMBER" });
const otherMemberId = "000000000000000000000062";

async function cleanup(): Promise<void> {
  await prisma.attendance.deleteMany({ where: { event: { title: { startsWith: "Événement TestCRUD" } } } });
  await prisma.event.deleteMany({ where: { title: { startsWith: "Événement TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Événements — CRUD, présence, permissions", () => {
  let eventId: string;

  it("refuse la création à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Événement TestCRUD X", startDate: "2026-01-01", endDate: "2026-01-01" });
    expect(response.status).toBe(403);
  });

  it("rejette une date de fin antérieure à la date de début (400)", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ title: "Événement TestCRUD Invalide", startDate: "2026-01-02", endDate: "2026-01-01" });
    expect(response.status).toBe(400);
  });

  it("crée un événement", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Événement TestCRUD Journée d'accueil",
        startDate: "2026-01-01T09:00:00.000Z",
        endDate: "2026-01-01T17:00:00.000Z",
        location: "Cocody",
      });
    expect(response.status).toBe(201);
    eventId = response.body.data.id;
  });

  it("un membre peut enregistrer sa propre présence (self check-in)", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/attendances`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "PRESENT" });
    expect(response.status).toBe(201);
    expect(response.body.data.userId).toBe(memberId);
    expect(response.body.data.status).toBe("PRESENT");
  });

  it("un membre ne peut pas enregistrer la présence d'un autre (403)", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/attendances`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ userId: otherMemberId, status: "PRESENT" });
    expect(response.status).toBe(403);
  });

  it("un organisateur (rôle de gestion) peut enregistrer la présence de quelqu'un d'autre", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/attendances`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ userId: otherMemberId, status: "EXCUSED" });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("EXCUSED");
  });

  it("liste les présences de l'événement", async () => {
    const response = await request(app)
      .get(`/api/events/${eventId}/attendances`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it("un membre ne peut pas modifier une présence enregistrée (403)", async () => {
    const attendance = await prisma.attendance.findFirstOrThrow({ where: { eventId, userId: memberId } });
    const response = await request(app)
      .patch(`/api/events/${eventId}/attendances/${attendance.id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "ABSENT" });
    expect(response.status).toBe(403);
  });

  it("refuse la suppression d'un événement ayant des présences (409)", async () => {
    const response = await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(response.status).toBe(409);
  });

  it("supprime l'événement après retrait des présences", async () => {
    await prisma.attendance.deleteMany({ where: { eventId } });
    const response = await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(response.status).toBe(200);
  });
});
