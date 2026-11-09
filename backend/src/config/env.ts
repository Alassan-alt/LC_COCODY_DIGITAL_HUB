import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI est requis"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET doit contenir au moins 16 caractères"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuration d'environnement invalide :");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Variables d'environnement invalides. Vérifiez votre fichier .env");
}

export const env = parsed.data;
