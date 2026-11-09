import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminId = "000000000000000000000130";
const superAdminToken = signAuthToken({ sub: superAdminId, role: "SUPER_ADMIN" });
const vpToken = signAuthToken({ sub: "000000000000000000000131", role: "VP" });
const memberToken = signAuthToken({ sub: "000000000000000000000132", role: "MEMBER" });

const loginEmail = "auditlog.login@lccocody.local";
const loginPassword = "Password-123!";
let loginUserId: string;
let newMemberUserId: string;

async function cleanup(): Promise<void> {
  await prisma.auditLog.deleteMany({
    where: { userId: { in: [superAdminId, loginUserId, newMemberUserId].filter(Boolean) as string[] } },
  });
  await prisma.memberProfile.deleteMany({ where: { userId: { in: [loginUserId, newMemberUserId].filter(Boolean) as string[] } } });
  await prisma.user.deleteMany({ where: { email: { in: [loginEmail, "auditlog.newmember@lccocody.local"] } } });
  await prisma.user.deleteMany({ where: { id: superAdminId } });
}

beforeAll(async () => {
  const passwordHash = await hashPassword(loginPassword);
  const loginUser = await prisma.user.create({
    data: { email: loginEmail, passwordHash, role: "MEMBER" },
  });
  loginUserId = loginUser.id;

  await prisma.user.create({
    data: { id: superAdminId, email: "auditlog.superadmin@lccocody.local", passwordHash: "x", role: "SUPER_ADMIN" },
  });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Audit Logs — LOGIN, MEMBER_CREATED/UPDATED, lecture seule, permissions", () => {
  it("enregistre un LOGIN lors d'une connexion réussie", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: loginEmail, password: loginPassword });
    expect(response.status).toBe(200);

    const logs = await prisma.auditLog.findMany({ where: { userId: loginUserId, action: "LOGIN" } });
    expect(logs).toHaveLength(1);
  });

  it("enregistre MEMBER_CREATED puis MEMBER_UPDATED avec l'auteur correct", async () => {
    const newUser = await prisma.user.create({
      data: { email: "auditlog.newmember@lccocody.local", passwordHash: "x", role: "MEMBER" },
    });
    newMemberUserId = newUser.id;

    const create = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ userId: newUser.id, firstName: "Audit", lastName: "TestMember" });
    expect(create.status).toBe(201);
    const memberId = create.body.data.id;

    const createdLogs = await prisma.auditLog.findMany({
      where: { entityType: "MemberProfile", entityId: memberId, action: "MEMBER_CREATED" },
    });
    expect(createdLogs).toHaveLength(1);
    expect(createdLogs[0].userId).toBe(superAdminId);

    const update = await request(app)
      .patch(`/api/members/${memberId}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ position: "Bénévole" });
    expect(update.status).toBe(200);

    const updatedLogs = await prisma.auditLog.findMany({
      where: { entityType: "MemberProfile", entityId: memberId, action: "MEMBER_UPDATED" },
    });
    expect(updatedLogs).toHaveLength(1);
  });

  it("refuse l'accès à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("refuse l'accès à un VP (403) — réservé SUPER_ADMIN/LCP", async () => {
    const response = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${vpToken}`);
    expect(response.status).toBe(403);
  });

  it("SUPER_ADMIN peut lister et filtrer par action", async () => {
    const response = await request(app)
      .get("/api/audit-logs")
      .query({ action: "LOGIN", userId: loginUserId })
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].action).toBe("LOGIN");
  });

  it("n'expose aucune route d'écriture (les logs ne sont pas modifiables)", async () => {
    const post = await request(app)
      .post("/api/audit-logs")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ action: "LOGIN" });
    expect(post.status).toBe(404);
  });
});
