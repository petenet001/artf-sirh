import { defineVitestConfig } from "@nuxt/test-utils/config";

// Tests unitaires et de composants. Chaque fonctionnalité doit être couverte.
export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    include: ["app/**/*.{test,spec}.ts"],
    globals: true,
  },
});
