import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../lib/career/db/client";
import { careerAnalyses } from "../lib/career/db/schema";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { sql } from "drizzle-orm";

describe("Immutable Canonical Analysis Persistence", () => {
  const canonRepo = new PostgresCareerAnalysisRepository(db);

  beforeEach(async () => {
    await db.execute(sql`DELETE FROM career_analyses`);
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM career_analyses`);
  });

  const createDummyPayload = (id: string, contentMarker: string): VerifiedCareerAnalysis => ({
    structured_data: {
      analysis: {
        metadata: {
          analysis_id: id,
          created_at: new Date().toISOString(),
          validation_state: "VERIFIED",
          overall_confidence: 0.9,
          contentMarker
        },
        capabilities: [],
        requirements: [],
        role_alignments: [],
        measurements: []
      }
    }
  } as unknown as VerifiedCareerAnalysis);

  it("enforces idempotent success and blocks divergent overwrites", async () => {
    const analysisId = "ANL_IMMUTABLE_TEST_1";
    const payloadA = createDummyPayload(analysisId, "MARKER_A");
    const payloadB = createDummyPayload(analysisId, "MARKER_B");

    // 1. Save ANL_X with payload A.
    await canonRepo.save(payloadA);

    // 2. Save identical ANL_X / payload A again -> succeeds idempotently.
    // This should not throw.
    await canonRepo.save(payloadA);

    // 3. Save ANL_X with payload B where canonical content differs -> ERR_IMMUTABLE_RECORD_CONFLICT.
    await expect(canonRepo.save(payloadB)).rejects.toThrow(/ERR_IMMUTABLE_RECORD_CONFLICT/);

    // 4. Reload ANL_X -> original payload A remains byte/semantically unchanged.
    const reloaded = await canonRepo.load(analysisId);
    expect(reloaded).toBeDefined();
    expect((reloaded as any).structured_data.analysis.metadata.contentMarker).toBe("MARKER_A");

    // 5. Exactly one row exists.
    const all = await canonRepo.list();
    expect(all.length).toBe(1);
  });
});
