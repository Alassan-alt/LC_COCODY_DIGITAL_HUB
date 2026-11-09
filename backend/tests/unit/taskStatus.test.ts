import { describe, expect, it } from "vitest";
import { withEffectiveStatus } from "../../src/utils/taskStatus";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

describe("withEffectiveStatus() — statut OVERDUE calculé (unitaire, sans DB)", () => {
  it("TODO avec échéance passée devient OVERDUE", () => {
    const result = withEffectiveStatus({ status: "TODO" as const, dueDate: daysFromNow(-1) });
    expect(result.status).toBe("OVERDUE");
  });

  it("IN_PROGRESS avec échéance passée devient OVERDUE", () => {
    const result = withEffectiveStatus({ status: "IN_PROGRESS" as const, dueDate: daysFromNow(-1) });
    expect(result.status).toBe("OVERDUE");
  });

  it("TODO avec échéance future reste TODO", () => {
    const result = withEffectiveStatus({ status: "TODO" as const, dueDate: daysFromNow(5) });
    expect(result.status).toBe("TODO");
  });

  it("sans échéance, le statut n'est jamais recalculé", () => {
    const result = withEffectiveStatus({ status: "TODO" as const, dueDate: null });
    expect(result.status).toBe("TODO");
  });

  it("DONE n'est jamais recalculé en OVERDUE, même en retard", () => {
    const result = withEffectiveStatus({ status: "DONE" as const, dueDate: daysFromNow(-10) });
    expect(result.status).toBe("DONE");
  });

  it("ne mute pas l'objet original", () => {
    const original = { status: "TODO" as const, dueDate: daysFromNow(-1) };
    const result = withEffectiveStatus(original);
    expect(original.status).toBe("TODO");
    expect(result).not.toBe(original);
  });
});
