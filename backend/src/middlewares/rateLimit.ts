import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Désactivé en environnement de test : la suite de tests envoie des
// centaines de requêtes depuis la même IP en quelques secondes, ce qui
// déclencherait des 429 sans rapport avec la logique testée. Le mécanisme
// lui-même est vérifié séparément (tests/security.test.ts, instance dédiée).
const skipInTest = (): boolean => env.NODE_ENV === "test";

/**
 * Phase 19 — Audit de sécurité : limite générale sur l'API (protection
 * basique contre les abus/DoS applicatif).
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: "Trop de requêtes, veuillez réessayer plus tard" },
});

/**
 * Limite stricte sur les routes d'authentification (register/login) pour
 * ralentir les attaques par force brute sur les mots de passe.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipInTest,
  message: { success: false, message: "Trop de tentatives, veuillez réessayer plus tard" },
});
