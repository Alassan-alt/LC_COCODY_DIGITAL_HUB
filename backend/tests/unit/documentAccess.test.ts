import { describe, expect, it } from "vitest";
import { canAccess } from "../../src/utils/documentAccess";

describe("canAccess() — politique de visibilité (unitaire, sans DB)", () => {
  it("SUPER_ADMIN et LCP accèdent à tout, quelle que soit la visibilité", () => {
    const subject = { visibility: "RESTRICTED" as const, departmentId: null, ownerId: "owner-1" };
    expect(canAccess(subject, { role: "SUPER_ADMIN", userId: "someone-else" })).toBe(true);
    expect(canAccess(subject, { role: "LCP", userId: "someone-else" })).toBe(true);
  });

  it.each(["PUBLIC", "INTERNAL"] as const)("%s est accessible à tout utilisateur authentifié", (visibility) => {
    const subject = { visibility, departmentId: null, ownerId: "owner-1" };
    expect(canAccess(subject, { role: "MEMBER", userId: "n-importe-qui" })).toBe(true);
  });

  it("DEPARTMENT n'est accessible qu'aux membres du même département", () => {
    const subject = { visibility: "DEPARTMENT" as const, departmentId: "dept-A", ownerId: "owner-1" };
    expect(canAccess(subject, { role: "MEMBER", userId: "u1", departmentId: "dept-A" })).toBe(true);
    expect(canAccess(subject, { role: "MEMBER", userId: "u2", departmentId: "dept-B" })).toBe(false);
    expect(canAccess(subject, { role: "MEMBER", userId: "u3", departmentId: null })).toBe(false);
  });

  it("CONFIDENTIAL est accessible au VP/TEAM_LEADER du département ou au propriétaire", () => {
    const subject = { visibility: "CONFIDENTIAL" as const, departmentId: "dept-A", ownerId: "owner-1" };
    expect(canAccess(subject, { role: "VP", userId: "vp1", departmentId: "dept-A" })).toBe(true);
    expect(canAccess(subject, { role: "TEAM_LEADER", userId: "tl1", departmentId: "dept-A" })).toBe(true);
    expect(canAccess(subject, { role: "MEMBER", userId: "owner-1", departmentId: null })).toBe(true);
    expect(canAccess(subject, { role: "MEMBER", userId: "quelqu-un-dautre", departmentId: "dept-A" })).toBe(
      false,
    );
    expect(canAccess(subject, { role: "VP", userId: "vp2", departmentId: "dept-B" })).toBe(false);
  });

  it("RESTRICTED n'est accessible qu'au propriétaire", () => {
    const subject = { visibility: "RESTRICTED" as const, departmentId: null, ownerId: "owner-1" };
    expect(canAccess(subject, { role: "VP", userId: "owner-1" })).toBe(true);
    expect(canAccess(subject, { role: "VP", userId: "quelqu-un-dautre" })).toBe(false);
  });
});
