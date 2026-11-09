import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const ownerId = "000000000000000000000040";
const ownerToken = signAuthToken({ sub: ownerId, role: "VP" });
const memberToken = signAuthToken({ sub: "000000000000000000000041", role: "MEMBER" });
const superAdminToken = signAuthToken({ sub: "000000000000000000000042", role: "SUPER_ADMIN" });

let departmentId: string;
let mandateId: string;

async function cleanup(): Promise<void> {
  await prisma.task.deleteMany({ where: { title: { startsWith: "Tâche TestBoard" } } });
  await prisma.project.deleteMany({ where: { name: { startsWith: "Projet TestCRUD" } } });
  await prisma.department.deleteMany({ where: { name: "Département TestCRUD Projets" } });
  await prisma.mandate.deleteMany({ where: { label: "Mandat TestCRUD Projets" } });
}

beforeAll(async () => {
  await cleanup();
  const localCommittee =
    (await prisma.localCommittee.findFirst()) ??
    (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));

  const department = await prisma.department.create({
    data: { name: "Département TestCRUD Projets", localCommitteeId: localCommittee.id },
  });
  const mandate = await prisma.mandate.create({
    data: {
      label: "Mandat TestCRUD Projets",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      localCommitteeId: localCommittee.id,
    },
  });
  departmentId = department.id;
  mandateId = mandate.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Projets — CRUD, relations Department/Mandate, permissions", () => {
  let projectId: string;

  it("refuse la création à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Projet TestCRUD X" });
    expect(response.status).toBe(403);
  });

  it("crée un projet lié à un département et un mandat (relation Department → Project)", async () => {
    const response = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Projet TestCRUD Collecte de fonds", departmentId, mandateId });

    expect(response.status).toBe(201);
    expect(response.body.data.departmentId).toBe(departmentId);
    expect(response.body.data.mandateId).toBe(mandateId);
    expect(response.body.data.status).toBe("PLANNED");
    projectId = response.body.data.id;
  });

  it("liste filtrée par département et par statut", async () => {
    const response = await request(app)
      .get("/api/projects")
      .query({ departmentId, status: "PLANNED" })
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((p: { id: string }) => p.id === projectId)).toBe(true);
  });

  it("met à jour le statut du projet", async () => {
    const response = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "IN_PROGRESS" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("IN_PROGRESS");
  });

  it("refuse la suppression d'un projet ayant des tâches (409)", async () => {
    await prisma.task.create({
      data: { title: "Tâche TestBoard Blocante", projectId, createdById: ownerId },
    });

    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(409);

    await prisma.task.deleteMany({ where: { title: "Tâche TestBoard Blocante" } });
  });

  it("supprime un projet sans tâche", async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(200);
  });
});

describe("Kanban — GET /projects/:id/board", () => {
  let boardProjectId: string;

  beforeAll(async () => {
    const project = await prisma.project.create({
      data: { name: "Projet TestCRUD Kanban", departmentId, mandateId, ownerId },
    });
    boardProjectId = project.id;

    const past = new Date();
    past.setDate(past.getDate() - 3);
    const future = new Date();
    future.setDate(future.getDate() + 30);

    await prisma.task.createMany({
      data: [
        { title: "Tâche TestBoard A (todo)", projectId: boardProjectId, status: "TODO", createdById: ownerId, dueDate: future },
        { title: "Tâche TestBoard B (en retard)", projectId: boardProjectId, status: "TODO", createdById: ownerId, dueDate: past },
        { title: "Tâche TestBoard C (done)", projectId: boardProjectId, status: "DONE", createdById: ownerId, dueDate: past },
      ],
    });
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { projectId: boardProjectId } });
    await prisma.project.deleteMany({ where: { id: boardProjectId } });
  });

  it("groupe les tâches par statut effectif, y compris OVERDUE calculé dynamiquement", async () => {
    const response = await request(app)
      .get(`/api/projects/${boardProjectId}/board`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.TODO).toHaveLength(1);
    expect(response.body.data.OVERDUE).toHaveLength(1);
    expect(response.body.data.OVERDUE[0].title).toBe("Tâche TestBoard B (en retard)");
    expect(response.body.data.DONE).toHaveLength(1);
    expect(response.body.data.IN_PROGRESS).toHaveLength(0);
  });
});
