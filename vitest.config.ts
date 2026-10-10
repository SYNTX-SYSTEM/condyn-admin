import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Only the process environment may name the test database; .env files never can.
  delete env.DATABASE_URL;
  return {
    test: {
      env,
      globalSetup: ["./test/support/database-isolation/global-setup.ts"],
      setupFiles: ["./test/support/database-isolation/setup.ts"],
      poolOptions: {
        threads: {
          singleThread: true
        }
      },
      fileParallelism: false
    },
  };
});
