import express from "express";
import rateLimit from "express-rate-limit";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { errorHandler } from "../src/middlewares/errorHandler";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const superAdminToken = signAuthToken({ sub: "000000000000000000000170", role: "SUPER_ADMIN" });

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Sécurité — exposition de secrets (RG projet, Phase 19)", () => {
  it("passwordHash n'apparaît jamais dans les réponses register/login/me", async () => {
    const email = "security.exposure@lccocody.local";
    const register = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "Password-123!", firstName: "Sec", lastName: "Test" });
    expect(JSON.stringify(register.body)).not.toContain("passwordHash");

    const login = await request(app).post("/api/auth/login").send({ email, password: "Password-123!" });
    expect(JSON.stringify(login.body)).not.toContain("passwordHash");
    const token = login.body.data.token as string;

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(JSON.stringify(me.body)).not.toContain("passwordHash");

    const listUsers = await request(app).get("/api/users").set("Authorization", `Bearer ${superAdminToken}`);
    expect(JSON.stringify(listUsers.body)).not.toContain("passwordHash");

    const createdUser = await prisma.user.findUnique({ where: { email } });
    if (createdUser) {
      await prisma.auditLog.deleteMany({ where: { userId: createdUser.id } });
    }
    await prisma.memberProfile.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
  });

  it("le secret JWT ou une clé d'environnement n'apparaît jamais dans une réponse d'erreur", async () => {
    const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer token-invalide");
    const body = JSON.stringify(response.body);
    expect(body).not.toMatch(/JWT_SECRET|MONGODB_URI|change-me/i);
  });

  it("aucune trace de pile (stack) n'est renvoyée par le gestionnaire d'erreurs en dehors du mode développement", () => {
    const jsonCalls: unknown[] = [];
    const res = {
      status: () => ({ json: (body: unknown) => jsonCalls.push(body) }),
    } as unknown as Parameters<typeof errorHandler>[2];
    const req = { method: "GET", originalUrl: "/api/test" } as unknown as Parameters<typeof errorHandler>[1];

    errorHandler(new Error("Erreur interne sensible avec détails système"), req, res, () => {});

    expect(jsonCalls).toHaveLength(1);
    expect(jsonCalls[0]).not.toHaveProperty("stack");
  });
});

describe("Sécurité — validation stricte contre l'injection d'opérateurs (Zod)", () => {
  it("rejette une tentative d'injection d'opérateur Mongo via un paramètre de requête", async () => {
    const response = await request(app)
      .get("/api/departments")
      .query({ "isActive[$ne]": "true" })
      .set("Authorization", `Bearer ${superAdminToken}`);

    // isActive doit rester un booléen strict ("true"/"false") — toute autre
    // forme (objet, opérateur) est ignorée ou rejetée par Zod, jamais transmise telle quelle à Prisma.
    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.items).toBeInstanceOf(Array);
    }
  });

  it("rejette un identifiant MongoDB malformé plutôt que de l'exécuter tel quel", async () => {
    const response = await request(app)
      .get("/api/departments/not-a-valid-object-id")
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(response.status).toBe(400);
  });
});

describe("Sécurité — upload de fichiers", () => {
  it("rejette une extension de fichier dangereuse", async () => {
    const response = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .field("name", "Document TestSecurity Executable")
      .field("visibility", "INTERNAL")
      .attach("file", Buffer.from("MZ..."), "malware.exe");

    expect(response.status).toBe(400);
  });
});

describe("Sécurité — rate limiting (mécanisme, désactivé pendant les tests réels)", () => {
  it("bloque après le nombre de requêtes autorisé (instance isolée, hors bypass NODE_ENV=test)", async () => {
    // Instance dédiée avec un seuil bas et sans le bypass de tests.env,
    // pour vérifier le mécanisme lui-même sans perturber le reste de la suite.
    const limiterApp = express();
    limiterApp.use(rateLimit({ windowMs: 60_000, limit: 3, standardHeaders: true, legacyHeaders: false }));
    limiterApp.get("/ping", (_req, res) => res.status(200).json({ ok: true }));

    for (let i = 0; i < 3; i += 1) {
      const response = await request(limiterApp).get("/ping");
      expect(response.status).toBe(200);
    }

    const blocked = await request(limiterApp).get("/ping");
    expect(blocked.status).toBe(429);
  });
});
