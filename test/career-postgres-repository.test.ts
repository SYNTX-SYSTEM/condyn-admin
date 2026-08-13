/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * STEP 10: POSTGRESQL & DRIZZLE PERSISTENCE LAYER (`test/career-postgres-repository.test.ts`)
 * 
 * Status: Phase 10 TDD Red-Green-Refactor
 * Scope: Verifies PostgresCareerAnalysisRepository adherence to CareerAnalysisRepository contract,
 * JSONB payload roundtrip, unverified rejection, lightweight list projection, and InMemory parity.
 */

import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { InMemoryCareerAnalysisRepository } from "../lib/career/repository";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";
import { db, initDbSchema, closeDbConnection } from "../lib/career/db/client";

describe("CONDYN Career Analysis Protocol v1.0 - Step 10: PostgreSQL & Drizzle Persistence Layer", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  beforeAll(async () => {
    // Ensure table exists in test postgres instance
    try {
      await initDbSchema();
    } catch (e) {
      console.warn("Could not init postgres schema (DB might be offline or uninstalled yet):", e);
    }
  });

  afterAll(async () => {
    try {
      await closeDbConnection();
    } catch (e) {
      // ignore close errors if not connected
    }
  });

  it("should reject an unverified analysis with error code ERR_UNVERIFIED_ANALYSIS_PERSISTENCE", async () => {
    const pgRepo = new PostgresCareerAnalysisRepository();
    
    const dirtyAnalysis = {
      ...unverifiedPayload,
      structured_data: {
        ...unverifiedPayload.structured_data,
        analysis: {
          ...unverifiedPayload.structured_data.analysis,
          metadata: {
            ...unverifiedPayload.structured_data.analysis.metadata,
            validation_state: "UNVERIFIED"
          }
        }
      }
    } as VerifiedCareerAnalysis;

    await expect(pgRepo.save(dirtyAnalysis)).rejects.toThrow("ERR_UNVERIFIED_ANALYSIS_PERSISTENCE");
  });

  it("should save a VERIFIED analysis and load it by analysisId via Postgres repository", async () => {
    const pgRepo = new PostgresCareerAnalysisRepository();
    const validationResult = validateCareerAnalysis(unverifiedPayload);
    expect(validationResult.success).toBe(true);
    
    const verifiedAnalysis = validationResult.data as VerifiedCareerAnalysis;
    await pgRepo.save(verifiedAnalysis);

    const loaded = await pgRepo.load("ANL_20260706_000001");
    expect(loaded).toBeDefined();
    expect(loaded!.structured_data.analysis.metadata.analysis_id).toBe("ANL_20260706_000001");
    expect(loaded!.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  });

  it("should preserve exact structural JSONB roundtrip identity between saved and loaded models", async () => {
    const pgRepo = new PostgresCareerAnalysisRepository();
    const validationResult = validateCareerAnalysis(unverifiedPayload);
    const verifiedAnalysis = validationResult.data as VerifiedCareerAnalysis;
    await pgRepo.save(verifiedAnalysis);

    const loaded = await pgRepo.load("ANL_20260706_000001");
    expect(loaded).toEqual(verifiedAnalysis);
  });

  it("should return lightweight AnalysisIndexEntry[] via list() without JSONB payload bloating", async () => {
    const pgRepo = new PostgresCareerAnalysisRepository();
    const list = await pgRepo.list();
    
    expect(list.length).toBeGreaterThanOrEqual(1);
    const entry = list.find(e => e.analysisId === "ANL_20260706_000001");
    expect(entry).toBeDefined();
    expect(entry!.validationState).toBe("VERIFIED");
    expect(entry!.overallConfidence).toBe(0.94);
    
    // Verify no UI or full JSON payload properties leaked into index entry
    expect((entry as any).title).toBeUndefined();
    expect((entry as any).ui_layout).toBeUndefined();
    expect((entry as any).structured_data).toBeUndefined();
  });

  it("should demonstrate 100% Contract Parity between InMemory and Postgres repositories", async () => {
    const inMemRepo = new InMemoryCareerAnalysisRepository();
    const pgRepo = new PostgresCareerAnalysisRepository();
    
    const validationResult = validateCareerAnalysis(unverifiedPayload);
    const verifiedAnalysis = validationResult.data as VerifiedCareerAnalysis;
    
    await inMemRepo.save(verifiedAnalysis);
    await pgRepo.save(verifiedAnalysis);
    
    const inMemLoaded = await inMemRepo.load("ANL_20260706_000001");
    const pgLoaded = await pgRepo.load("ANL_20260706_000001");
    
    expect(pgLoaded).toEqual(inMemLoaded);
  });
});
