import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const ownerId = "000000000000000000000150";
const managerToken = signAuthToken({ sub: ownerId, role: "VP" });
const memberToken = signAuthToken({ sub: "000000000000000000000151", role: "MEMBER" });

let projectId: string;

async function cleanup(): Promise<void> {
  await prisma.lessonLearned.deleteMany({ where: { project: { name: "Projet TestCRUD LessonsLearned" } } });
  await prisma.project.deleteMany({ where: { name: "Projet TestCRUD LessonsLearned" } });
}

beforeAll(async () => {
  await cleanup();
  const project = await prisma.project.create({
    data: { name: "Projet TestCRUD LessonsLearned", ownerId },
  });
  projectId = project.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Lessons Learned — une entrée par projet (upsert), permissions", () => {
  it("retourne 404 tant qu'aucune leçon n'est enregistrée", async () => {
    const response = await request(app)
      .get(`/api/projects/${projectId}/lessons-learned`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(404);
  });

  it("refuse l'écriture à un simple MEMBER (403)", async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}/lessons-learned`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ whatWorked: "La communication" });
    expect(response.status).toBe(403);
  });

  it("crée les lessons learned (première écriture)", async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}/lessons-learned`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        whatWorked: "La communication interne",
        whatDidNotWork: "Le budget initial était sous-estimé",
        difficulties: "Recrutement de bénévoles",
        recommendations: "Prévoir une marge budgétaire",
        lessonsLearned: "Anticiper davantage les imprévus",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.whatWorked).toBe("La communication interne");
  });

  it("met à jour (upsert) la même entrée au lieu d'en créer une seconde", async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}/lessons-learned`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ whatWorked: "La communication interne (révisée)" });

    expect(response.status).toBe(200);
    expect(response.body.data.whatWorked).toBe("La communication interne (révisée)");

    const count = await prisma.lessonLearned.count({ where: { projectId } });
    expect(count).toBe(1);
  });

  it("lit les lessons learned désormais enregistrées", async () => {
    const response = await request(app)
      .get(`/api/projects/${projectId}/lessons-learned`)
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.recommendations).toBe("Prévoir une marge budgétaire");
  });
});
