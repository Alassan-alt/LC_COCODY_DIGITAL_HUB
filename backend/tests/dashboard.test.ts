import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { signAuthToken } from "../src/utils/jwt";

const app = createApp();

const authorId = "000000000000000000000030";
const authorToken = signAuthToken({ sub: authorId, role: "MEMBER" });
const otherMemberToken = signAuthToken({ sub: "000000000000000000000031", role: "MEMBER" });
const vpToken = signAuthToken({ sub: "000000000000000000000032", role: "VP" });

async function cleanup(): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { userId: authorId } });
  await prisma.documentVersion.deleteMany({
    where: { document: { name: { startsWith: "Document TestDashboard" } } },
  });
  await prisma.document.deleteMany({ where: { name: { startsWith: "Document TestDashboard" } } });
  await prisma.mandate.deleteMany({ where: { label: { startsWith: "Mandat TestDashboard" } } });
  await prisma.user.deleteMany({ where: { id: authorId } });
}

beforeAll(async () => {
  await cleanup();
  await prisma.user.create({
    data: { id: authorId, email: "dashboard.author@lccocody.local", passwordHash: "x", role: "MEMBER" },
  });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Dashboard — statistiques réelles, alertes, pas de fausses données", () => {
  it("refuse l'accès sans authentification (401)", async () => {
    const response = await request(app).get("/api/dashboard");
    expect(response.status).toBe(401);
  });

  it("retourne des statistiques réelles et n'invente pas les modules non implémentés", async () => {
    const before = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${authorToken}`);
    expect(before.status).toBe(200);
    const membersBefore = before.body.data.stats.members;
    const documentsBefore = before.body.data.stats.documents;

    // pas de fausses statistiques : tous les modules du plan de développement
    // sont maintenant couverts (depuis la Phase 12 — KPI), aucun pendingModule.
    expect(typeof before.body.data.stats.projects).toBe("number");
    expect(typeof before.body.data.stats.tasks).toBe("number");
    expect(typeof before.body.data.stats.events).toBe("number");
    expect(typeof before.body.data.stats.kpis).toBe("number");
    expect(before.body.data.pendingModules).toEqual([]);

    await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${authorToken}`)
      .field("name", "Document TestDashboard Public")
      .field("visibility", "INTERNAL")
      .attach("file", Buffer.from("contenu"), "doc.txt");

    const after = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${authorToken}`);
    expect(after.body.data.stats.documents).toBe(documentsBefore + 1);
    expect(after.body.data.stats.members).toBe(membersBefore);
  });

  it("le compteur de documents respecte la visibilité selon le rôle du demandeur", async () => {
    await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${authorToken}`)
      .field("name", "Document TestDashboard Restreint")
      .field("visibility", "RESTRICTED")
      .attach("file", Buffer.from("contenu secret"), "secret.txt");

    const asAuthor = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${authorToken}`);
    const asOther = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${otherMemberToken}`);

    expect(asAuthor.body.data.stats.documents).toBeGreaterThan(asOther.body.data.stats.documents);
  });

  it("génère une alerte pour un mandat qui se termine bientôt, pas pour un mandat lointain", async () => {
    const localCommittee =
      (await prisma.localCommittee.findFirst()) ??
      (await prisma.localCommittee.create({ data: { name: "LC Cocody" } }));

    const soonEnd = new Date();
    soonEnd.setDate(soonEnd.getDate() + 10);
    await prisma.mandate.create({
      data: {
        label: "Mandat TestDashboard Proche",
        startDate: new Date("2020-01-01"),
        endDate: soonEnd,
        status: "ACTIVE",
        localCommitteeId: localCommittee.id,
      },
    });

    const farEnd = new Date();
    farEnd.setFullYear(farEnd.getFullYear() + 5);
    await prisma.mandate.create({
      data: {
        label: "Mandat TestDashboard Lointain",
        startDate: new Date(),
        endDate: farEnd,
        status: "ACTIVE",
        localCommitteeId: localCommittee.id,
      },
    });

    const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${authorToken}`);
    const messages = response.body.data.alerts.map((a: { message: string }) => a.message);

    expect(messages.some((m: string) => m.includes("Mandat TestDashboard Proche"))).toBe(true);
    expect(messages.some((m: string) => m.includes("Mandat TestDashboard Lointain"))).toBe(false);
  });

  it("le solde financier n'apparaît que pour les rôles autorisés (cohérence avec /api/finance)", async () => {
    const asMember = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${authorToken}`);
    expect(asMember.body.data.stats.finance).toBeUndefined();

    const asVp = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${vpToken}`);
    expect(asVp.body.data.stats.finance).toBeDefined();
    expect(typeof asVp.body.data.stats.finance.balance).toBe("number");
  });
});
