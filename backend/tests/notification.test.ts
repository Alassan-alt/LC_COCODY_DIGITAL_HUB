import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const creatorId = "000000000000000000000120";
const assigneeId = "000000000000000000000121";
const deptMemberId = "000000000000000000000122";
const outsiderId = "000000000000000000000123";

const creatorToken = signAuthToken({ sub: creatorId, role: "VP" });
const assigneeToken = signAuthToken({ sub: assigneeId, role: "MEMBER" });
const deptMemberToken = signAuthToken({ sub: deptMemberId, role: "MEMBER" });
const outsiderToken = signAuthToken({ sub: outsiderId, role: "MEMBER" });

let departmentId: string;

async function cleanup(): Promise<void> {
  await prisma.notification.deleteMany({
    where: { userId: { in: [creatorId, assigneeId, deptMemberId, outsiderId] } },
  });
  await prisma.task.deleteMany({ where: { title: { startsWith: "Tâche TestNotif" } } });
  await prisma.documentVersion.deleteMany({
    where: { document: { name: { startsWith: "Document TestNotif" } } },
  });
  await prisma.document.deleteMany({ where: { name: { startsWith: "Document TestNotif" } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: [creatorId, deptMemberId] } } });
  await prisma.memberProfile.deleteMany({ where: { userId: { in: [creatorId, deptMemberId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [creatorId, deptMemberId] } } });
  await prisma.department.deleteMany({ where: { name: "Département TestNotif" } });
}

beforeAll(async () => {
  await cleanup();
  const localCommittee =
    (await prisma.localCommittee.findFirst()) ??
    (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));
  const department = await prisma.department.create({
    data: { name: "Département TestNotif", localCommitteeId: localCommittee.id },
  });
  departmentId = department.id;

  const creator = await prisma.user.create({
    data: { id: creatorId, email: "notif.creator@lccocody.local", passwordHash: "x", role: "VP" },
  });
  await prisma.memberProfile.create({
    data: { userId: creator.id, firstName: "Creator", lastName: "Test", departmentId },
  });

  const deptMember = await prisma.user.create({
    data: { id: deptMemberId, email: "notif.deptmember@lccocody.local", passwordHash: "x", role: "MEMBER" },
  });
  await prisma.memberProfile.create({
    data: { userId: deptMember.id, firstName: "Dept", lastName: "Member", departmentId },
  });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Notifications — événements métier, permissions, isolation par utilisateur", () => {
  it("notifie l'assigné lors de la création d'une tâche", async () => {
    const create = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ title: "Tâche TestNotif Assignation", assigneeId });
    expect(create.status).toBe(201);

    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${assigneeToken}`);
    expect(list.status).toBe(200);
    expect(list.body.items.some((n: { type: string }) => n.type === "TASK_ASSIGNED")).toBe(true);
    expect(list.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("ne notifie pas le créateur lui-même", async () => {
    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(list.body.items.some((n: { type: string }) => n.type === "TASK_ASSIGNED")).toBe(false);
  });

  it("marque une notification comme lue, refuse pour un autre utilisateur", async () => {
    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${assigneeToken}`);
    const notificationId = list.body.items[0].id;

    const forbidden = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(forbidden.status).toBe(404);

    const ok = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${assigneeToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.isRead).toBe(true);
  });

  it("notifie les membres du département pour un nouveau document visible, pas pour un document RESTRICTED", async () => {
    await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${creatorToken}`)
      .field("name", "Document TestNotif Public")
      .field("visibility", "INTERNAL")
      .field("departmentId", departmentId)
      .attach("file", Buffer.from("contenu"), "doc.txt");

    await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${creatorToken}`)
      .field("name", "Document TestNotif Secret")
      .field("visibility", "RESTRICTED")
      .field("departmentId", departmentId)
      .attach("file", Buffer.from("secret"), "secret.txt");

    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${deptMemberToken}`);

    const documentNotifs = list.body.items.filter((n: { type: string }) => n.type === "DOCUMENT_NEW");
    expect(documentNotifs).toHaveLength(1);
    expect(documentNotifs[0].message).toContain("Public");
  });

  it("ne notifie pas un utilisateur hors du département", async () => {
    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(list.body.items.some((n: { type: string }) => n.type === "DOCUMENT_NEW")).toBe(false);
  });

  it("génère une alerte de tâche en retard à la demande (pas de cron), de façon idempotente", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const task = await prisma.task.create({
      data: {
        title: "Tâche TestNotif En Retard",
        status: "TODO",
        dueDate: past,
        assigneeId,
        createdById: creatorId,
      },
    });

    const first = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${assigneeToken}`);
    const overdueNotifs1 = first.body.items.filter(
      (n: { type: string; relatedEntityId: string }) =>
        n.type === "TASK_OVERDUE" && n.relatedEntityId === task.id,
    );
    expect(overdueNotifs1).toHaveLength(1);

    const second = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${assigneeToken}`);
    const overdueNotifs2 = second.body.items.filter(
      (n: { type: string; relatedEntityId: string }) =>
        n.type === "TASK_OVERDUE" && n.relatedEntityId === task.id,
    );
    expect(overdueNotifs2).toHaveLength(1);
  });

  it("marque toutes les notifications comme lues", async () => {
    const response = await request(app)
      .post("/api/notifications/read-all")
      .set("Authorization", `Bearer ${assigneeToken}`);
    expect(response.status).toBe(200);

    const list = await request(app)
      .get("/api/notifications")
      .query({ isRead: false })
      .set("Authorization", `Bearer ${assigneeToken}`);
    expect(list.body.items).toHaveLength(0);
    expect(list.body.unreadCount).toBe(0);
  });
});
