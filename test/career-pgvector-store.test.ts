import { describe, it, expect } from "vitest";
import { PgVectorStore } from "../lib/career/search/pgvector-store";
import { DeterministicEmbeddingProvider } from "../lib/career/embeddings/deterministic";

describe("CONDYN Career Analysis Protocol v1.0 — Step 21c: PgVectorStore Persistence Layer (`test/career-pgvector-store.test.ts`)", () => {
  const provider = new DeterministicEmbeddingProvider();

  it("should return empty array when searching an empty store", async () => {
    const store = new PgVectorStore({ inMemoryFallback: true });
    const queryVec = await provider.generateEmbedding("Cloud Native Architect");

    const results = await store.search(queryVec, { topK: 5 });
    expect(results).toEqual([]);
  });

  it("should insert an embedding record and retrieve it via semantic search", async () => {
    const store = new PgVectorStore({ inMemoryFallback: true });
    const vec = await provider.generateEmbedding("Senior Defense AI Systems Engineer");

    await store.upsert({
      entityId: "ROLE_HELS_1",
      entityType: "ROLE",
      text: "Senior Defense AI Systems Engineer",
      vector: vec,
      metadata: { department: "AI Systems" }
    });

    const results = await store.search(vec, { topK: 3 });
    expect(results).toHaveLength(1);
    expect(results[0].entityId).toBe("ROLE_HELS_1");
    expect(results[0].similarityScore).toBeCloseTo(1.0, 4);
  });

  it("should update existing entity record on upsert with same entityId", async () => {
    const store = new PgVectorStore({ inMemoryFallback: true });
    const vec1 = await provider.generateEmbedding("Old Role Title");
    const vec2 = await provider.generateEmbedding("Updated Senior Edge Architect");

    await store.upsert({
      entityId: "ROLE_EDGE_UPDATED",
      entityType: "ROLE",
      text: "Old Role Title",
      vector: vec1
    });

    await store.upsert({
      entityId: "ROLE_EDGE_UPDATED",
      entityType: "ROLE",
      text: "Updated Senior Edge Architect",
      vector: vec2,
      metadata: { version: 2 }
    });

    const results = await store.search(vec2, { topK: 10 });
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("Updated Senior Edge Architect");
    expect(results[0].metadata?.version).toBe(2);
  });

  it("should respect topK and minSimilarity filtering options", async () => {
    const store = new PgVectorStore({ inMemoryFallback: true });

    await store.upsert({
      entityId: "ROLE_A",
      entityType: "ROLE",
      text: "Distributed Cloud Systems Architect",
      vector: await provider.generateEmbedding("Distributed Cloud Systems Architect")
    });

    await store.upsert({
      entityId: "ROLE_B",
      entityType: "ROLE",
      text: "Distributed Cloud Systems Lead Engineer",
      vector: await provider.generateEmbedding("Distributed Cloud Systems Lead Engineer")
    });

    await store.upsert({
      entityId: "ROLE_C",
      entityType: "ROLE",
      text: "Culinary Bakery Pastry Chef",
      vector: await provider.generateEmbedding("Culinary Bakery Pastry Chef")
    });

    const queryVec = await provider.generateEmbedding("Distributed Cloud Systems Architect");

    // Test minSimilarity filtering out unrelated pastry chef
    const minSimResults = await store.search(queryVec, { minSimilarity: 0.3 });
    expect(minSimResults.length).toBe(2);
    expect(minSimResults.some((r) => r.entityId === "ROLE_C")).toBe(false);

    // Test topK limiting
    const topKResults = await store.search(queryVec, { topK: 1, minSimilarity: 0.1 });
    expect(topKResults).toHaveLength(1);
    expect(topKResults[0].entityId).toBe("ROLE_A");
  });

  it("should filter search results by entityType and analysisId", async () => {
    const store = new PgVectorStore({ inMemoryFallback: true });

    const vec = await provider.generateEmbedding("AI Platform Infrastructure");

    await store.upsert({
      entityId: "ORG_HELSING",
      entityType: "ORGANIZATION",
      text: "AI Platform Infrastructure Defense",
      vector: vec,
      analysisId: "ANL_100"
    });

    await store.upsert({
      entityId: "ROLE_AI_ARCH",
      entityType: "ROLE",
      text: "AI Platform Infrastructure Architect",
      vector: vec,
      analysisId: "ANL_100"
    });

    await store.upsert({
      entityId: "ROLE_AI_OTHER",
      entityType: "ROLE",
      text: "AI Platform Infrastructure Lead",
      vector: vec,
      analysisId: "ANL_200"
    });

    // 1. Filter by entityType="ORGANIZATION"
    const orgResults = await store.search(vec, { entityType: "ORGANIZATION" });
    expect(orgResults).toHaveLength(1);
    expect(orgResults[0].entityId).toBe("ORG_HELSING");

    // 2. Filter by analysisId="ANL_100" and entityType="ROLE"
    const scopedRoleResults = await store.search(vec, {
      entityType: "ROLE",
      analysisId: "ANL_100"
    });
    expect(scopedRoleResults).toHaveLength(1);
    expect(scopedRoleResults[0].entityId).toBe("ROLE_AI_ARCH");
  });
});
