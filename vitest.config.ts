import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        // ドメイン層はブラウザに依存しないので素の node で回す
        extends: true,
        test: {
          name: "domain",
          environment: "node",
          include: ["src/domain/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/app/**/*.test.tsx"],
          setupFiles: ["src/app/test-setup.ts"],
        },
      },
    ],
  },
});
