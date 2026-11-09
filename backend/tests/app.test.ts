import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("GET /api/health", () => {
  it("retourne 200 et un statut opérationnel", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Route inconnue", () => {
  it("retourne 404", async () => {
    const response = await request(app).get("/api/route-inexistante");
    expect(response.status).toBe(404);
  });
});
