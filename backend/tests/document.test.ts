import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const authorId = "000000000000000000000010";
const otherMemberId = "000000000000000000000011";
const superAdminId = "000000000000000000000012";

const authorToken = signAuthToken({ sub: authorId, role: "MEMBER" });
const otherMemberToken = signAuthToken({ sub: otherMemberId, role: "MEMBER" });
const superAdminToken = signAuthToken({ sub: superAdminId, role: "SUPER_ADMIN" });

const TEST_USER_IDS = [authorId, otherMemberId, superAdminId];

async function cleanup(): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { entityType: "Document" } });
  await prisma.documentVersion.deleteMany({ where: { document: { name: { startsWith: "Document TestCRUD" } } } });
  await prisma.document.deleteMany({ where: { name: { startsWith: "Document TestCRUD" } } });
}

beforeAll(async () => {
  await cleanup();
  await prisma.user.deleteMany({ where: { id: { in: TEST_USER_IDS } } });
  await Promise.all(
    TEST_USER_IDS.map((id, index) =>
      prisma.user.create({
        data: { id, email: `document.test.${index}@lccocody.local`, passwordHash: "x", role: "MEMBER" },
      }),
    ),
  );
});
afterAll(async () => {
  await cleanup();
  await prisma.user.deleteMany({ where: { id: { in: TEST_USER_IDS } } });
  await prisma.$disconnect();
});

describe("Documents — upload, téléchargement, versions, restauration, audit, permissions", () => {
  let documentId: string;
  let versionOneId: string;

  it("refuse l'upload sans fichier (400)", async () => {
    const response = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${authorToken}`)
      .field("name", "Document TestCRUD Sans Fichier");
    expect(response.status).toBe(400);
  });

  it("upload un document (version 1) et enregistre un audit log DOCUMENT_UPLOADED", async () => {
    const response = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${authorToken}`)
      .field("name", "Document TestCRUD Rapport")
      .field("description", "Rapport de démonstration")
      .field("category", "rapport")
      .field("tags", "demo,test")
      .field("visibility", "RESTRICTED")
      .attach("file", Buffer.from("Contenu version 1"), "rapport-v1.txt");

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Document TestCRUD Rapport");
    expect(response.body.data.tags).toEqual(["demo", "test"]);
    documentId = response.body.data.id;
    versionOneId = response.body.data.currentVersionId;

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Document", entityId: documentId, action: "DOCUMENT_UPLOADED" },
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].userId).toBe(authorId);
  });

  it("permission — un autre MEMBER ne peut pas voir un document RESTRICTED (403)", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${otherMemberToken}`);
    expect(response.status).toBe(403);
  });

  it("permission — SUPER_ADMIN peut tout voir (200)", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(200);
  });

  it("téléchargement — l'auteur télécharge la version courante et un audit DOCUMENT_DOWNLOADED est créé", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toBe("Contenu version 1");

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Document", entityId: documentId, action: "DOCUMENT_DOWNLOADED" },
    });
    expect(auditLogs).toHaveLength(1);
  });

  it("téléchargement — un autre MEMBER n'a pas accès (403)", async () => {
    const response = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${otherMemberToken}`);
    expect(response.status).toBe(403);
  });

  it("recherche — le document apparaît dans une recherche par nom pour l'auteur", async () => {
    const response = await request(app)
      .get("/api/documents")
      .query({ search: "Document TestCRUD Rapport" })
      .set("Authorization", `Bearer ${authorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((d: { id: string }) => d.id === documentId)).toBe(true);
  });

  it("recherche — invisible pour un autre MEMBER (filtrage par visibilité, pas seulement 403 unitaire)", async () => {
    const response = await request(app)
      .get("/api/documents")
      .query({ search: "Document TestCRUD Rapport" })
      .set("Authorization", `Bearer ${otherMemberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.some((d: { id: string }) => d.id === documentId)).toBe(false);
  });

  it("un autre MEMBER ne peut pas ajouter de version (403)", async () => {
    const response = await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${otherMemberToken}`)
      .attach("file", Buffer.from("Tentative non autorisée"), "hack.txt");
    expect(response.status).toBe(403);
  });

  it("version 2 — l'auteur ajoute une nouvelle version", async () => {
    const response = await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${authorToken}`)
      .field("changeNote", "Correction de la section 2")
      .attach("file", Buffer.from("Contenu version 2"), "rapport-v2.txt");

    expect(response.status).toBe(201);
    expect(response.body.data.currentVersionId).not.toBe(versionOneId);

    const versionsResponse = await request(app)
      .get(`/api/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(versionsResponse.body.data).toHaveLength(2);
    expect(versionsResponse.body.data[1].versionNumber).toBe(2);

    const downloadResponse = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(downloadResponse.text).toBe("Contenu version 2");
  });

  it("restauration — revient à la version 1 sans supprimer la version 2", async () => {
    const response = await request(app)
      .post(`/api/documents/${documentId}/versions/${versionOneId}/restore`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.currentVersionId).toBe(versionOneId);

    const downloadResponse = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(downloadResponse.text).toBe("Contenu version 1");

    const versionsResponse = await request(app)
      .get(`/api/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(versionsResponse.body.data).toHaveLength(2);
  });

  it("suppression — un autre MEMBER ne peut pas supprimer (403)", async () => {
    const response = await request(app)
      .delete(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${otherMemberToken}`);
    expect(response.status).toBe(403);
  });

  it("suppression — l'auteur supprime (soft delete) et un audit DOCUMENT_DELETED est créé", async () => {
    const response = await request(app)
      .delete(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(response.status).toBe(200);

    const getResponse = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(getResponse.status).toBe(404);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Document", entityId: documentId, action: "DOCUMENT_DELETED" },
    });
    expect(auditLogs).toHaveLength(1);
  });
});

describe("Documents — visibilité DEPARTMENT (filtrage par périmètre)", () => {
  let departmentAId: string;
  let departmentBId: string;
  let userInDeptA: string;
  let userInDeptB: string;
  let tokenInDeptA: string;
  let tokenInDeptB: string;
  let deptDocumentId: string;

  beforeAll(async () => {
    const localCommittee =
      (await prisma.localCommittee.findFirst()) ??
      (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));

    const deptA = await prisma.department.create({
      data: { name: "Département TestCRUD Docs A", localCommitteeId: localCommittee.id },
    });
    const deptB = await prisma.department.create({
      data: { name: "Département TestCRUD Docs B", localCommitteeId: localCommittee.id },
    });
    departmentAId = deptA.id;
    departmentBId = deptB.id;

    const userA = await prisma.user.create({
      data: { email: "doc.deptA@lccocody.local", passwordHash: "x", role: "MEMBER" },
    });
    await prisma.memberProfile.create({
      data: { userId: userA.id, firstName: "A", lastName: "Test", departmentId: deptA.id },
    });
    const userB = await prisma.user.create({
      data: { email: "doc.deptB@lccocody.local", passwordHash: "x", role: "MEMBER" },
    });
    await prisma.memberProfile.create({
      data: { userId: userB.id, firstName: "B", lastName: "Test", departmentId: deptB.id },
    });

    userInDeptA = userA.id;
    userInDeptB = userB.id;
    tokenInDeptA = signAuthToken({ sub: userA.id, role: "MEMBER" });
    tokenInDeptB = signAuthToken({ sub: userB.id, role: "MEMBER" });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { entityType: "Document", entityId: deptDocumentId } });
    await prisma.documentVersion.deleteMany({ where: { documentId: deptDocumentId } });
    await prisma.document.deleteMany({ where: { id: deptDocumentId } });
    await prisma.memberProfile.deleteMany({ where: { userId: { in: [userInDeptA, userInDeptB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userInDeptA, userInDeptB] } } });
    await prisma.department.deleteMany({ where: { id: { in: [departmentAId, departmentBId] } } });
  });

  it("un document DEPARTMENT est visible pour un membre du même département", async () => {
    const upload = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${tokenInDeptA}`)
      .field("name", "Document TestCRUD Département A")
      .field("visibility", "DEPARTMENT")
      .field("departmentId", departmentAId)
      .attach("file", Buffer.from("Contenu département A"), "dept-a.txt");
    expect(upload.status).toBe(201);
    deptDocumentId = upload.body.data.id;

    const sameDept = await request(app)
      .get(`/api/documents/${deptDocumentId}`)
      .set("Authorization", `Bearer ${tokenInDeptA}`);
    expect(sameDept.status).toBe(200);
  });

  it("le même document DEPARTMENT est invisible pour un membre d'un autre département (403)", async () => {
    const response = await request(app)
      .get(`/api/documents/${deptDocumentId}`)
      .set("Authorization", `Bearer ${tokenInDeptB}`);
    expect(response.status).toBe(403);
  });
});
