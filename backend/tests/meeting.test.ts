import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const organizerId = "000000000000000000000070";
const organizerToken = signAuthToken({ sub: organizerId, role: "LCP" });
const responsibleId = "000000000000000000000071";
const memberToken = signAuthToken({ sub: "000000000000000000000072", role: "MEMBER" });

async function cleanup(): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { entityType: "Task" } });
  await prisma.task.deleteMany({ where: { title: { startsWith: "Décision TestWorkflow" } } });
  await prisma.meetingDecision.deleteMany({
    where: { meeting: { title: { startsWith: "Réunion TestCRUD" } } },
  });
  await prisma.meeting.deleteMany({ where: { title: { startsWith: "Réunion TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Réunions — CRUD, permissions, suppression contrôlée", () => {
  let meetingId: string;

  it("refuse la création à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Réunion TestCRUD X", date: "2026-01-01" });
    expect(response.status).toBe(403);
  });

  it("crée une réunion avec ordre du jour", async () => {
    const response = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ title: "Réunion TestCRUD Bureau", date: "2026-01-05", agenda: "Bilan du mois" });
    expect(response.status).toBe(201);
    meetingId = response.body.data.id;
  });

  it("met à jour le compte rendu (minutes)", async () => {
    const response = await request(app)
      .patch(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ minutes: "Décisions actées, voir liste des décisions." });
    expect(response.status).toBe(200);
    expect(response.body.data.minutes).toBe("Décisions actées, voir liste des décisions.");
  });
});

describe("Workflow Réunion → Décision → Responsable → Tâche → Deadline", () => {
  let meetingId: string;

  beforeAll(async () => {
    const meeting = await prisma.meeting.create({
      data: { title: "Réunion TestCRUD Workflow", date: new Date("2026-02-01"), organizerId },
    });
    meetingId = meeting.id;
  });

  afterAll(async () => {
    await prisma.meetingDecision.deleteMany({ where: { meetingId } });
    await prisma.meeting.deleteMany({ where: { id: meetingId } });
  });

  it("une décision de réunion génère automatiquement une tâche assignée au responsable avec la même échéance", async () => {
    const dueDate = "2026-02-15T00:00:00.000Z";

    const response = await request(app)
      .post(`/api/meetings/${meetingId}/decisions`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        description: "Décision TestWorkflow Organiser la collecte de fonds",
        responsibleId,
        dueDate,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.responsibleId).toBe(responsibleId);
    expect(response.body.data.generatedTaskId).toBeDefined();

    const task = await prisma.task.findUniqueOrThrow({
      where: { id: response.body.data.generatedTaskId },
    });
    expect(task.title).toBe("Décision TestWorkflow Organiser la collecte de fonds");
    expect(task.assigneeId).toBe(responsibleId);
    expect(task.dueDate?.toISOString()).toBe(dueDate);
    expect(task.status).toBe("TODO");
    expect(task.createdById).toBe(organizerId);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Task", entityId: task.id, action: "TASK_CREATED" },
    });
    expect(auditLogs).toHaveLength(1);

    const decisionsList = await request(app)
      .get(`/api/meetings/${meetingId}/decisions`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(decisionsList.body.data).toHaveLength(1);
  });

  it("refuse la suppression de la réunion tant que la décision existe (409)", async () => {
    const response = await request(app)
      .delete(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(response.status).toBe(409);
  });
});
