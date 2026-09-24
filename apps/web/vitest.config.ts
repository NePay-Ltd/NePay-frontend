import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser environment
    environment: "jsdom",
    globals: true,

    // verbose: shows every test name individually with ✓ / ✗
    // and always prints "X passed | Y failed" even when failures = 0
    reporters: ["verbose"],

    // Load jest-dom matchers (toBeInTheDocument, toHaveValue, etc.)
    setupFiles: ["./src/__tests__/setup.ts"],

    // Only pick up files in __tests__ directories
    include: ["src/__tests__/**/*.test.{ts,tsx}"],

    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts", "src/lib/**/*.tsx"],
      exclude: ["src/lib/types/**", "src/__tests__/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
