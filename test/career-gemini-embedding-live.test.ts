import { describe, it, expect } from "vitest";
import { GeminiEmbeddingProvider } from "../lib/career/embeddings/gemini";

const shouldRunLive =
  process.env.RUN_LIVE_EMBEDDING_TESTS === "true" &&
  Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!shouldRunLive)(
  "CONDYN Career Analysis Protocol v1.0 — Step 21b: Live Gemini Embedding Provider (`test/career-gemini-embedding-live.test.ts`)",
  () => {
    it("should generate real 768-dimensional embedding from Google Gemini API", async () => {
      const provider = new GeminiEmbeddingProvider();
      const vec = await provider.generateEmbedding("Cloud Native Distributed Architecture");

      expect(Array.isArray(vec)).toBe(true);
      expect(vec.length).toBeGreaterThan(0);
      expect(provider.dimensions).toBe(vec.length);
    });
  }
);
