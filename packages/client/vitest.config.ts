import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.test.json",
      include: ["src/**/*.test-d.ts"],
    },
  },
});
