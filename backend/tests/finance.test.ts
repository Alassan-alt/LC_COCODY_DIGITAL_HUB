import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const recorderId = "000000000000000000000080";
const recorderToken = signAuthToken({ sub: recorderId, role: "VP" });
const teamLeaderToken = signAuthToken({ sub: "000000000000000000000081", role: "TEAM_LEADER" });
const memberToken = signAuthToken({ sub: "000000000000000000000082", role: "MEMBER" });

let justificatifDocumentId: string;

async function cleanup(): Promise<void> {
  await prisma.financialTransaction.deleteMany({ where: { category: { startsWith: "TestCRUD" } } });
  await prisma.auditLog.deleteMany({ where: { userId: recorderId } });
  await prisma.documentVersion.deleteMany({ where: { document: { name: "Document TestCRUD Justificatif" } } });
  await prisma.document.deleteMany({ where: { name: "Document TestCRUD Justificatif" } });
  await prisma.user.deleteMany({ where: { id: recorderId } });
}

beforeAll(async () => {
  await cleanup();
  await prisma.user.create({
    data: { id: recorderId, email: "finance.recorder@lccocody.local", passwordHash: "x", role: "VP" },
  });

  const upload = await request(app)
    .post("/api/documents")
    .set("Authorization", `Bearer ${recorderToken}`)
    .field("name", "Document TestCRUD Justificatif")
    .field("visibility", "INTERNAL")
    .attach("file", Buffer.from("reçu"), "recu.txt");
  justificatifDocumentId = upload.body.data.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Finance — CRUD, justificatif, solde, permissions", () => {
  let transactionId: string;

  it("refuse tout accès à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .get("/api/finance/transactions")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("TEAM_LEADER peut lire mais pas créer (403 sur create)", async () => {
    const list = await request(app)
      .get("/api/finance/transactions")
      .set("Authorization", `Bearer ${teamLeaderToken}`);
    expect(list.status).toBe(200);

    const create = await request(app)
      .post("/api/finance/transactions")
      .set("Authorization", `Bearer ${teamLeaderToken}`)
      .send({ type: "INCOME", amount: 1000, category: "TestCRUD Don", date: "2026-01-01" });
    expect(create.status).toBe(403);
  });

  it("rejette un montant négatif (400)", async () => {
    const response = await request(app)
      .post("/api/finance/transactions")
      .set("Authorization", `Bearer ${recorderToken}`)
      .send({ type: "EXPENSE", amount: -50, category: "TestCRUD Fournitures", date: "2026-01-01" });
    expect(response.status).toBe(400);
  });

  it("crée une recette liée à un document justificatif", async () => {
    const response = await request(app)
      .post("/api/finance/transactions")
      .set("Authorization", `Bearer ${recorderToken}`)
      .send({
        type: "INCOME",
        amount: 150000,
        category: "TestCRUD Don",
        date: "2026-01-10",
        documentId: justificatifDocumentId,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.documentId).toBe(justificatifDocumentId);
    expect(response.body.data.currency).toBe("XOF");
    transactionId = response.body.data.id;
  });

  it("crée une dépense sans justificatif", async () => {
    const response = await request(app)
      .post("/api/finance/transactions")
      .set("Authorization", `Bearer ${recorderToken}`)
      .send({ type: "EXPENSE", amount: 40000, category: "TestCRUD Fournitures", date: "2026-01-15" });
    expect(response.status).toBe(201);
  });

  it("calcule le solde réel (revenus - dépenses)", async () => {
    const response = await request(app)
      .get("/api/finance/balance")
      .set("Authorization", `Bearer ${recorderToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.income).toBeGreaterThanOrEqual(150000);
    expect(response.body.data.expense).toBeGreaterThanOrEqual(40000);
    expect(response.body.data.balance).toBe(response.body.data.income - response.body.data.expense);
  });

  it("filtre par type et par plage de dates", async () => {
    const response = await request(app)
      .get("/api/finance/transactions")
      .query({ type: "INCOME", dateFrom: "2026-01-01", dateTo: "2026-01-31", search: "TestCRUD" })
      .set("Authorization", `Bearer ${recorderToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.every((t: { type: string }) => t.type === "INCOME")).toBe(true);
  });

  it("met à jour une transaction", async () => {
    const response = await request(app)
      .patch(`/api/finance/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${recorderToken}`)
      .send({ amount: 160000 });
    expect(response.status).toBe(200);
    expect(response.body.data.amount).toBe(160000);
  });

  it("supprime (logiquement) une transaction, absente des listes et du solde ensuite", async () => {
    const before = await request(app)
      .get("/api/finance/balance")
      .set("Authorization", `Bearer ${recorderToken}`);

    const del = await request(app)
      .delete(`/api/finance/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${recorderToken}`);
    expect(del.status).toBe(200);

    const after = await request(app)
      .get("/api/finance/balance")
      .set("Authorization", `Bearer ${recorderToken}`);
    expect(after.body.data.income).toBe(before.body.data.income - 160000);

    const getResponse = await request(app)
      .get(`/api/finance/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${recorderToken}`);
    expect(getResponse.status).toBe(404);
  });
});
