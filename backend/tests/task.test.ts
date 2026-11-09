import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const creatorId = "000000000000000000000050";
const assigneeId = "000000000000000000000051";
const outsiderId = "000000000000000000000052";

const creatorToken = signAuthToken({ sub: creatorId, role: "MEMBER" });
const assigneeToken = signAuthToken({ sub: assigneeId, role: "MEMBER" });
const outsiderToken = signAuthToken({ sub: outsiderId, role: "MEMBER" });
const superAdminToken = signAuthToken({ sub: "000000000000000000000053", role: "SUPER_ADMIN" });

let projectId: string;

async function cleanup(): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { entityType: "Task" } });
  await prisma.task.deleteMany({ where: { title: { startsWith: "Tâche TestCRUD" } } });
  await prisma.project.deleteMany({ where: { name: "Projet TestCRUD Pour Tâches" } });
}

beforeAll(async () => {
  await cleanup();
  const project = await prisma.project.create({
    data: { name: "Projet TestCRUD Pour Tâches", ownerId: creatorId },
  });
  projectId = project.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Tâches — CRUD, relations Project/User, statut OVERDUE calculé, permissions, audit", () => {
  let taskId: string;

  it("crée une tâche liée à un projet et un assigné (relations Project → Task, User → Task)", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Tâche TestCRUD Rédiger le rapport",
        projectId,
        assigneeId,
        priority: "HIGH",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.projectId).toBe(projectId);
    expect(response.body.data.assigneeId).toBe(assigneeId);
    expect(response.body.data.createdById).toBe(creatorId);
    expect(response.body.data.status).toBe("TODO");
    taskId = response.body.data.id;

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Task", entityId: taskId, action: "TASK_CREATED" },
    });
    expect(auditLogs).toHaveLength(1);
  });

  it("rejette une référence de projet inexistante (404)", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Tâche TestCRUD Invalide", projectId: "000000000000000000000099" });
    expect(response.status).toBe(404);
  });

  it("un tiers non impliqué ne peut pas modifier la tâche (403)", async () => {
    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ status: "IN_PROGRESS" });
    expect(response.status).toBe(403);
  });

  it("l'assigné peut modifier le statut de sa tâche", async () => {
    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${assigneeToken}`)
      .send({ status: "IN_PROGRESS" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("IN_PROGRESS");
  });

  it("le statut effectif passe à OVERDUE quand l'échéance est dépassée, sans écraser la valeur stockée", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);

    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${assigneeToken}`)
      .send({ dueDate: past.toISOString() });

    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${assigneeToken}`);
    expect(response.body.data.status).toBe("OVERDUE");

    const stored = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    expect(stored.status).toBe("IN_PROGRESS");
  });

  it("le filtre status=OVERDUE inclut les tâches en retard calculées dynamiquement", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .query({ status: "OVERDUE", assigneeId })
      .set("Authorization", `Bearer ${assigneeToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((t: { id: string }) => t.id === taskId)).toBe(true);
  });

  it("le filtre status=IN_PROGRESS exclut désormais cette tâche devenue OVERDUE", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .query({ status: "IN_PROGRESS", assigneeId })
      .set("Authorization", `Bearer ${assigneeToken}`);

    expect(response.body.items.some((t: { id: string }) => t.id === taskId)).toBe(false);
  });

  it("un tiers non impliqué ne peut pas supprimer la tâche (403)", async () => {
    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(response.status).toBe(403);
  });

  it("un SUPER_ADMIN peut supprimer n'importe quelle tâche", async () => {
    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(200);
  });
});
