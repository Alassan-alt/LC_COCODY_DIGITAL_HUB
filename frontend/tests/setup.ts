import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// `globals: false` (vite.config.ts) désactive l'enregistrement automatique du
// nettoyage de @testing-library/react — fait explicitement ici pour toute la suite.
afterEach(() => {
  cleanup();
});
