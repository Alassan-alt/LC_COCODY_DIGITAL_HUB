import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Serveur démarré sur le port ${env.PORT} (env: ${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  logger.info(`Signal ${signal} reçu, arrêt du serveur...`);
  server.close(() => {
    logger.info("Serveur arrêté proprement");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
