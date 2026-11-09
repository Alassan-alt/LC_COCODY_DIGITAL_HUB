import { describe, expect, it } from "vitest";
import { buildPaginatedResult } from "../../src/utils/pagination";
import { isValidObjectId } from "../../src/utils/objectId";

describe("buildPaginatedResult() — unitaire, sans DB", () => {
  it("calcule totalPages correctement (arrondi au supérieur)", () => {
    const result = buildPaginatedResult(["a", "b"], 25, 1, 10);
    expect(result.meta.totalPages).toBe(3);
  });

  it("totalPages vaut au minimum 1, même sans résultat", () => {
    const result = buildPaginatedResult([], 0, 1, 10);
    expect(result.meta.totalPages).toBe(1);
  });

  it("conserve les items tels quels", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const result = buildPaginatedResult(items, 2, 1, 20);
    expect(result.items).toBe(items);
  });
});

describe("isValidObjectId() — unitaire, sans DB", () => {
  it("accepte un ObjectId Mongo valide (24 caractères hexadécimaux)", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("rejette une chaîne trop courte", () => {
    expect(isValidObjectId("abc123")).toBe(false);
  });

  it("rejette une chaîne contenant des caractères non hexadécimaux", () => {
    expect(isValidObjectId("zzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
  });

  it("rejette une tentative d'injection", () => {
    expect(isValidObjectId('{"$ne": null}')).toBe(false);
  });
});
