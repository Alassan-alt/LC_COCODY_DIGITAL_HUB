import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const authorId = "000000000000000000000140";
const authorToken = signAuthToken({ sub: authorId, role: "MEMBER" });
const otherMemberToken = signAuthToken({ sub: "000000000000000000000141", role: "MEMBER" });
const superAdminToken = signAuthToken({ sub: "000000000000000000000142", role: "SUPER_ADMIN" });

async function cleanup(): Promise<void> {
  await prisma.knowledgeArticle.deleteMany({ where: { title: { startsWith: "Article TestCRUD" } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Knowledge Base — CRUD, visibilité, permissions", () => {
  let publicArticleId: string;
  let restrictedArticleId: string;

  it("crée un article (tout rôle authentifié peut contribuer)", async () => {
    const response = await request(app)
      .post("/api/knowledge-articles")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        title: "Article TestCRUD Comment organiser un événement",
        content: "Contenu de démonstration.",
        category: "événementiel",
        tags: "guide,evenement",
        visibility: "INTERNAL",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.tags).toEqual(["guide", "evenement"]);
    publicArticleId = response.body.data.id;
  });

  it("crée un article RESTRICTED", async () => {
    const response = await request(app)
      .post("/api/knowledge-articles")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        title: "Article TestCRUD Notes personnelles",
        content: "Brouillon privé",
        visibility: "RESTRICTED",
      });
    expect(response.status).toBe(201);
    restrictedArticleId = response.body.data.id;
  });

  it("un article INTERNAL est visible par tout le monde, RESTRICTED seulement par l'auteur", async () => {
    const publicView = await request(app)
      .get(`/api/knowledge-articles/${publicArticleId}`)
      .set("Authorization", `Bearer ${otherMemberToken}`);
    expect(publicView.status).toBe(200);

    const restrictedView = await request(app)
      .get(`/api/knowledge-articles/${restrictedArticleId}`)
      .set("Authorization", `Bearer ${otherMemberToken}`);
    expect(restrictedView.status).toBe(403);

    const adminView = await request(app)
      .get(`/api/knowledge-articles/${restrictedArticleId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(adminView.status).toBe(200);
  });

  it("un autre membre ne peut pas modifier l'article (403)", async () => {
    const response = await request(app)
      .patch(`/api/knowledge-articles/${publicArticleId}`)
      .set("Authorization", `Bearer ${otherMemberToken}`)
      .send({ content: "Modification non autorisée" });
    expect(response.status).toBe(403);
  });

  it("l'auteur peut modifier son article, recherche et filtre par catégorie fonctionnent", async () => {
    const update = await request(app)
      .patch(`/api/knowledge-articles/${publicArticleId}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ content: "Contenu mis à jour" });
    expect(update.status).toBe(200);
    expect(update.body.data.content).toBe("Contenu mis à jour");

    const search = await request(app)
      .get("/api/knowledge-articles")
      .query({ category: "événementiel", search: "TestCRUD" })
      .set("Authorization", `Bearer ${otherMemberToken}`);
    expect(search.status).toBe(200);
    expect(search.body.items.some((a: { id: string }) => a.id === publicArticleId)).toBe(true);
  });

  it("supprime les articles créés", async () => {
    const del1 = await request(app)
      .delete(`/api/knowledge-articles/${publicArticleId}`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(del1.status).toBe(200);

    const del2 = await request(app)
      .delete(`/api/knowledge-articles/${restrictedArticleId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(del2.status).toBe(200);
  });
});
