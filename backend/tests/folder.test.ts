import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const ownerId = "000000000000000000000020";
const ownerToken = signAuthToken({ sub: ownerId, role: "TEAM_LEADER" });
const memberToken = signAuthToken({ sub: "000000000000000000000021", role: "MEMBER" });

async function cleanup(): Promise<void> {
  await prisma.folder.deleteMany({ where: { name: { startsWith: "Dossier TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Dossiers — CRUD, permissions, intégrité (dossier non vide)", () => {
  let folderId: string;

  it("refuse la création à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .post("/api/folders")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Dossier TestCRUD X" });
    expect(response.status).toBe(403);
  });

  it("crée un dossier (201)", async () => {
    const response = await request(app)
      .post("/api/folders")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Dossier TestCRUD Racine", visibility: "INTERNAL" });

    expect(response.status).toBe(201);
    folderId = response.body.data.id;
  });

  it("liste les dossiers (accessible à tout rôle authentifié pour INTERNAL)", async () => {
    const response = await request(app).get("/api/folders").set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(200);
    expect(response.body.items.some((f: { id: string }) => f.id === folderId)).toBe(true);
  });

  it("crée un sous-dossier rattaché au parent", async () => {
    const response = await request(app)
      .post("/api/folders")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Dossier TestCRUD Enfant", parentFolderId: folderId });
    expect(response.status).toBe(201);
    expect(response.body.data.parentFolderId).toBe(folderId);
  });

  it("refuse la suppression d'un dossier non vide (409)", async () => {
    const response = await request(app)
      .delete(`/api/folders/${folderId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(response.status).toBe(409);
  });

  it("supprime le sous-dossier puis le dossier racine devenu vide (200)", async () => {
    const child = await prisma.folder.findFirstOrThrow({ where: { name: "Dossier TestCRUD Enfant" } });
    const delChild = await request(app)
      .delete(`/api/folders/${child.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(delChild.status).toBe(200);

    const delRoot = await request(app)
      .delete(`/api/folders/${folderId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(delRoot.status).toBe(200);
  });
});
