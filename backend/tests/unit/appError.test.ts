import { describe, expect, it } from "vitest";
import { AppError } from "../../src/utils/AppError";

describe("AppError — unitaire, sans DB", () => {
  it("porte le statusCode fourni et un statut opérationnel par défaut", () => {
    const error = new AppError("Non trouvé", 404);
    expect(error.message).toBe("Non trouvé");
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it("utilise 500 par défaut si aucun statusCode n'est fourni", () => {
    const error = new AppError("Erreur interne");
    expect(error.statusCode).toBe(500);
  });
});
