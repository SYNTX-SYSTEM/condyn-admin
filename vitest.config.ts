import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    env: loadEnv(mode, process.cwd(), ""),
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    fileParallelism: false
  },
}));
