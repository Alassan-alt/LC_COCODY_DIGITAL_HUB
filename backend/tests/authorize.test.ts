import { Role } from "@prisma/client";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { authenticate } from "../src/middlewares/authenticate";
import { authorize } from "../src/middlewares/authorize";
import { errorHandler } from "../src/middlewares/errorHandler";
import { signAuthToken } from "../src/utils/jwt";
import type { AuthTokenPayload } from "../src/utils/jwt";

const ALL_ROLES = Object.values(Role);

function buildReq(user?: AuthTokenPayload) {
  return { user } as unknown as Parameters<ReturnType<typeof authorize>>[0];
}

describe("authorize() — unité (mock req/res/next)", () => {
  it("laisse passer un rôle autorisé", () => {
    const next = vi.fn();
    const middleware = authorize("SUPER_ADMIN", "LCP");
    middleware(buildReq({ sub: "u1", role: "SUPER_ADMIN" }), {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("bloque un rôle non autorisé avec une erreur 403", () => {
    const next = vi.fn();
    const middleware = authorize("SUPER_ADMIN");
    middleware(buildReq({ sub: "u1", role: "MEMBER" }), {} as never, next);
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  it("bloque une requête non authentifiée avec une erreur 401", () => {
    const next = vi.fn();
    const middleware = authorize("MEMBER");
    middleware(buildReq(undefined), {} as never, next);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it.each(ALL_ROLES)("autorise explicitement le rôle %s quand il est dans la liste blanche", (role) => {
    const next = vi.fn();
    const middleware = authorize(...ALL_ROLES);
    middleware(buildReq({ sub: "u1", role }), {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("authenticate + authorize — intégration HTTP par rôle", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.get(
    "/protected/super-admin-only",
    authenticate,
    authorize("SUPER_ADMIN"),
    (_req, res) => res.status(200).json({ success: true }),
  );
  testApp.use(errorHandler);

  it("refuse l'accès sans token (401)", async () => {
    const response = await request(testApp).get("/protected/super-admin-only");
    expect(response.status).toBe(401);
  });

  it.each(ALL_ROLES)("rôle %s → statut attendu selon la liste blanche (SUPER_ADMIN uniquement)", async (role) => {
    const token = signAuthToken({ sub: "000000000000000000000000", role });
    const response = await request(testApp)
      .get("/protected/super-admin-only")
      .set("Authorization", `Bearer ${token}`);

    if (role === "SUPER_ADMIN") {
      expect(response.status).toBe(200);
    } else {
      expect(response.status).toBe(403);
    }
  });
});
