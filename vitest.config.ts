import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      url: "http://localhost",
    },
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
