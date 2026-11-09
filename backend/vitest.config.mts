import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // Tests d'intégration partageant une même base MongoDB : exécution
    // séquentielle des fichiers pour éviter les collisions de données entre
    // suites (ex. deleteMany() non filtrés dans database.test.ts).
    fileParallelism: false,
  },
});
