import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryCareerAnalysisRepository } from "../lib/career/repository";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { db, initDbSchema } from "../lib/career/db/client";
import { careerAnalyses } from "../lib/career/db/schema";
import { eq } from "drizzle-orm";

describe("CONDYN Career Analysis Protocol v4.0 - PHASE 4: PERSISTENCE SEMANTIC INTEGRITY (TEST004A)", () => {
  let memRepo: InMemoryCareerAnalysisRepository;
  let pgRepo: PostgresCareerAnalysisRepository;

  beforeEach(async () => {
    await initDbSchema();
    memRepo = new InMemoryCareerAnalysisRepository();
    pgRepo = new PostgresCareerAnalysisRepository();
    // clear DB
    await db.delete(careerAnalyses);
  });

  const createMockAnalysis = (id: string, confidence?: number, cohesion?: number): any => ({
    structured_data: {
      analysis: {
        metadata: {
          analysis_id: id,
          analysis_timestamp: "2026-01-01T00:00:00Z",
          validation_state: "VERIFIED",
          ...(confidence !== undefined && { overall_confidence: confidence })
        },
        consistency: {
          ...(cohesion !== undefined && { overall_cohesion_score: cohesion })
        },
        roles: [],
        requirements: [],
        capabilities: [],
        documents: [],
        relationships: []
      }
    }
  });

  const testRepos = async (analysis: any, assertFn: (entry: any) => void) => {
    await memRepo.save(analysis);
    await pgRepo.save(analysis);

    const memList = await memRepo.list();
    const pgList = await pgRepo.list();

    const memEntry = memList.find(e => e.analysisId === "TEST_ID");
    const pgEntry = pgList.find(e => e.analysisId === "TEST_ID");

    expect(memEntry).toBeDefined();
    expect(pgEntry).toBeDefined();

    assertFn(memEntry);
    assertFn(pgEntry);
  };

  it("A. overall_confidence exists -> exact value persists and reloads", async () => {
    const analysis = createMockAnalysis("TEST_ID", 0.95);
    await testRepos(analysis, (entry) => {
      expect(entry.overallConfidence).toBe(0.95);
    });
  });

  it("B. overall_confidence absent -> remains absent/null", async () => {
    const analysis = createMockAnalysis("TEST_ID");
    await testRepos(analysis, (entry) => {
      expect(entry.overallConfidence).toBeUndefined();
    });
  });

  it("C. overall_cohesion_score exists but overall_confidence absent -> MUST NOT become overallConfidence", async () => {
    const analysis = createMockAnalysis("TEST_ID", undefined, 0.88);
    await testRepos(analysis, (entry) => {
      expect(entry.overallConfidence).toBeUndefined();
    });
  });

  it("D. missing metric -> MUST NOT become 0", async () => {
    const analysis = createMockAnalysis("TEST_ID");
    await testRepos(analysis, (entry) => {
      expect(entry.overallConfidence).not.toBe(0);
      expect(entry.overallConfidence).toBeUndefined();
    });
  });

  it("E. save -> load -> canonical payload deep-equal", async () => {
    const analysis = createMockAnalysis("TEST_ID", 0.95, 0.88);
    await memRepo.save(analysis);
    await pgRepo.save(analysis);

    const memLoaded = await memRepo.load("TEST_ID");
    const pgLoaded = await pgRepo.load("TEST_ID");

    expect(memLoaded).toEqual(analysis);
    expect(pgLoaded).toEqual(analysis);
  });
});
