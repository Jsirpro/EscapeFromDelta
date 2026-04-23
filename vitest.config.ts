import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["clients/tests/**/*.test.ts", "tests/**/*.test.ts", "app/tests/**/*.spec.ts"]
  }
});
