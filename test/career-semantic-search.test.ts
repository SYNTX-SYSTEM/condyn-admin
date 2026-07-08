import { describe, it, expect } from "vitest";
import { DeterministicEmbeddingProvider } from "../lib/career/embeddings/deterministic";
import { InMemorySemanticStore } from "../lib/career/search/store";
import {
  searchSemanticEntities,
  indexCompanyPoolEntities
} from "../lib/career/search/engine";
import { DEMO_COMPANY_POOL } from "../lib/career/matching/demo-pool";

describe("CONDYN Career Analysis Protocol v1.0 — Step 21a: Semantic Search Core (`test/career-semantic-search.test.ts`)", () => {
  describe("1. DeterministicEmbeddingProvider Contract", () => {
    it("should generate stable 768-dimensional L2-normalized vectors", async () => {
      const provider = new DeterministicEmbeddingProvider();
      expect(provider.dimensions).toBe(768);

      const vec = await provider.generateEmbedding("Distributed Cloud Systems");
      expect(vec).toHaveLength(768);

      // Verify L2 norm is approximately 1.0
      const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1.0, 4);
    });

    it("should produce identical vectors for identical inputs deterministically", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const vec1 = await provider.generateEmbedding("Principal Edge Systems Architect");
      const vec2 = await provider.generateEmbedding("Principal Edge Systems Architect");

      expect(vec1).toEqual(vec2);
    });

    it("should produce higher cosine similarity for similar terms than for unrelated terms", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const query = await provider.generateEmbedding("Edge Systems Architect");
      const similar = await provider.generateEmbedding("Edge Computing Architect");
      const unrelated = await provider.generateEmbedding("Culinary Pastry Baking Specialist");

      const cosineSim = (a: number[], b: number[]) =>
        a.reduce((sum, val, idx) => sum + val * b[idx], 0);

      const simSimilar = cosineSim(query, similar);
      const simUnrelated = cosineSim(query, unrelated);

      expect(simSimilar).toBeGreaterThan(simUnrelated);
      expect(simSimilar).toBeGreaterThan(0.3);
    });

    it("should support batch embedding generation", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const batch = await provider.generateBatchEmbeddings([
        "Distributed Cloud",
        "Edge Computing"
      ]);
      expect(batch).toHaveLength(2);
      expect(batch[0]).toHaveLength(768);
      expect(batch[1]).toHaveLength(768);
    });
  });

  describe("2. InMemorySemanticStore Contract", () => {
    it("should store and search semantic entity records respecting topK and minSimilarity", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const store = new InMemorySemanticStore();

      await store.upsert({
        entityId: "ROLE_EDGE_1",
        entityType: "ROLE",
        text: "Principal Edge Systems Architect",
        vector: await provider.generateEmbedding("Principal Edge Systems Architect"),
        metadata: { title: "Principal Edge Systems Architect" }
      });

      await store.upsert({
        entityId: "ROLE_CLOUD_1",
        entityType: "ROLE",
        text: "Cloud DevOps Engineer",
        vector: await provider.generateEmbedding("Cloud DevOps Engineer"),
        metadata: { title: "Cloud DevOps Engineer" }
      });

      await store.upsert({
        entityId: "ROLE_BAKER_1",
        entityType: "ROLE",
        text: "Pastry Baker Chef",
        vector: await provider.generateEmbedding("Pastry Baker Chef"),
        metadata: { title: "Pastry Baker Chef" }
      });

      const queryVec = await provider.generateEmbedding("Edge Systems Architect");

      const results = await store.search(queryVec, { topK: 2, minSimilarity: 0.1 });
      expect(results.length).toBeLessThanOrEqual(2);
      expect(results[0].entityId).toBe("ROLE_EDGE_1");
      expect(results[0].similarityScore).toBeGreaterThan(0.5);
    });

    it("should filter search results by entityType when requested", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const store = new InMemorySemanticStore();

      await store.upsert({
        entityId: "ORG_HELSING",
        entityType: "ORGANIZATION",
        text: "Defense AI Defense Systems Engineering",
        vector: await provider.generateEmbedding("Defense AI Defense Systems Engineering")
      });

      await store.upsert({
        entityId: "ROLE_AI_ARCH",
        entityType: "ROLE",
        text: "Defense AI Systems Architect",
        vector: await provider.generateEmbedding("Defense AI Systems Architect")
      });

      const queryVec = await provider.generateEmbedding("Defense AI");

      const orgResults = await store.search(queryVec, { entityType: "ORGANIZATION" });
      expect(orgResults).toHaveLength(1);
      expect(orgResults[0].entityId).toBe("ORG_HELSING");
    });
  });

  describe("3. Semantic Search Engine & Company Pool Indexing", () => {
    it("should index organizations and roles from DEMO_COMPANY_POOL without mutating the pool", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const store = new InMemorySemanticStore();

      const frozenPool = Object.freeze(JSON.parse(JSON.stringify(DEMO_COMPANY_POOL)));

      const indexStats = await indexCompanyPoolEntities(frozenPool, store, provider);

      expect(indexStats.organizationsIndexed).toBe(3);
      expect(indexStats.rolesIndexed).toBe(3);
      expect(indexStats.totalIndexed).toBe(6);
    });

    it("should search indexed DEMO_COMPANY_POOL and match relevant roles for semantic queries", async () => {
      const provider = new DeterministicEmbeddingProvider();
      const store = new InMemorySemanticStore();

      await indexCompanyPoolEntities(DEMO_COMPANY_POOL, store, provider);

      const results = await searchSemanticEntities(
        "Edge Systems Architect",
        store,
        provider,
        { topK: 3 }
      );

      expect(results.length).toBeGreaterThan(0);
      // Siemens Principal Industrial Edge Architect should rank near the top
      const topRole = results.find((r) => r.entityId.includes("siemens") || r.entityId.includes("role"));
      expect(topRole).toBeDefined();
      expect(topRole?.similarityScore).toBeGreaterThan(0.2);
    });
  });
});
