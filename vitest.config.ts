import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Les tests d'integration partagent la meme base : on les execute en serie
    // pour eviter que deux fichiers ne se marchent dessus.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  // Transformation JSX automatique : les tests de composants n'ont pas besoin
  // d'importer React explicitement.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
