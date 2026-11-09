import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();

const demoUser = {
  email: "auth.test@lccocody.local",
  password: "Password-123!",
  firstName: "Auth",
  lastName: "Test",
};

async function cleanup(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: demoUser.email } });
  if (existing) {
    await prisma.auditLog.deleteMany({ where: { userId: existing.id } });
  }
  await prisma.memberProfile.deleteMany({ where: { user: { email: demoUser.email } } });
  await prisma.user.deleteMany({ where: { email: demoUser.email } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("crée un compte et retourne un token (201)", async () => {
    const response = await request(app).post("/api/auth/register").send(demoUser);

    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe(demoUser.email);
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejette un email déjà utilisé (409)", async () => {
    const response = await request(app).post("/api/auth/register").send(demoUser);
    expect(response.status).toBe(409);
  });

  it("rejette un mot de passe trop court (400)", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...demoUser, email: "autre@lccocody.local", password: "123" });
    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("connecte avec des identifiants valides (200)", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: demoUser.password });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });

  it("rejette un mauvais mot de passe (401)", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: "mauvais-mot-de-passe" });
    expect(response.status).toBe(401);
  });

  it("rejette un utilisateur inexistant (401)", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "inexistant@lccocody.local", password: "peu-importe123" });
    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("refuse l'accès sans authentification (401)", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("refuse un token invalide (401)", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token-invalide");
    expect(response.status).toBe(401);
  });

  it("refuse un token expiré (401)", async () => {
    const expiredToken = jwt.sign(
      { sub: "000000000000000000000000", role: "MEMBER" },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 },
    );
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(response.status).toBe(401);
  });

  it("retourne l'utilisateur courant avec un token valide (200)", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: demoUser.password });
    const { token } = loginResponse.body.data;

    const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(demoUser.email);
  });
});

describe("PATCH /api/auth/change-password", () => {
  it("refuse un mauvais mot de passe actuel (401)", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: demoUser.password });
    const { token } = loginResponse.body.data;

    const response = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "faux-mot-de-passe", newPassword: "Nouveau-Password-123!" });

    expect(response.status).toBe(401);
  });

  it("change le mot de passe et permet la reconnexion avec le nouveau (200)", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: demoUser.password });
    const { token } = loginResponse.body.data;

    const changeResponse = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: demoUser.password, newPassword: "Nouveau-Password-123!" });
    expect(changeResponse.status).toBe(200);

    const newLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: "Nouveau-Password-123!" });
    expect(newLoginResponse.status).toBe(200);

    const oldLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: demoUser.password });
    expect(oldLoginResponse.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("refuse l'accès sans authentification (401)", async () => {
    const response = await request(app).post("/api/auth/logout");
    expect(response.status).toBe(401);
  });

  it("confirme la déconnexion avec un token valide (200)", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: demoUser.email, password: "Nouveau-Password-123!" });
    const { token } = loginResponse.body.data;

    const response = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
