/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * POSTGRESQL REPOSITORY IMPLEMENTATION (`lib/career/repositories/postgres.ts`)
 * 
 * Status: Phase 10 Implemented / Zero Client Leakage / 100% Contract Parity
 * Scope: Implements `CareerAnalysisRepository` using Drizzle ORM over PostgreSQL with JSONB storage.
 */

import { eq } from "drizzle-orm";
import { CareerAnalysisRepository } from "../repository";
import { VerifiedCareerAnalysis, AnalysisIndexEntry } from "../types";
import { db } from "../db/client";
import { careerAnalyses } from "../db/schema";
import { isDeepStrictEqual } from "util";

/**
 * PostgreSQL implementation of the canonical `CareerAnalysisRepository` contract.
 * Guarantees zero UI/client leakage, strict unverified model rejection, and lightweight index listing.
 */
export class PostgresCareerAnalysisRepository implements CareerAnalysisRepository {
  private database;

  constructor(customDb = db) {
    this.database = customDb;
  }

  async save(analysis: VerifiedCareerAnalysis): Promise<void> {
    const state = analysis?.structured_data?.analysis?.metadata?.validation_state;
    if (state !== "VERIFIED") {
      throw new Error(`ERR_UNVERIFIED_ANALYSIS_PERSISTENCE: Cannot persist analysis with state "${state}". Only VERIFIED analyses may be stored.`);
    }

    const analysisId = analysis?.structured_data?.analysis?.metadata?.analysis_id;
    if (!analysisId) {
      throw new Error("ERR_UNVERIFIED_ANALYSIS_PERSISTENCE: Missing canonical analysis_id in metadata.");
    }

    const meta = analysis.structured_data.analysis.metadata;
    const consistency = analysis.structured_data.analysis.consistency;
    const createdAt = meta.analysis_timestamp || new Date().toISOString();
    const overallConfidence = meta.overall_confidence ?? null;

    const existing = await this.load(analysisId);
    if (existing) {
      if (!isDeepStrictEqual(existing, analysis)) {
        throw new Error(`ERR_IMMUTABLE_RECORD_CONFLICT: Canonical analysis ${analysisId} already exists with a divergent payload. Silent overwrites are prohibited.`);
      }
      return; // Idempotent success
    }

    // Perform Postgres UPSERT (insert with onConflictDoNothing)
    await this.database
      .insert(careerAnalyses)
      .values({
        analysisId,
        createdAt,
        validationState: "VERIFIED",
        overallConfidence,
        payload: analysis
      })
      .onConflictDoNothing();
  }

  async load(analysisId: string): Promise<VerifiedCareerAnalysis | null> {
    const results = await this.database
      .select({ payload: careerAnalyses.payload })
      .from(careerAnalyses)
      .where(eq(careerAnalyses.analysisId, analysisId))
      .limit(1);

    if (!results || results.length === 0) {
      return null;
    }

    return results[0].payload as VerifiedCareerAnalysis;
  }

  async list(): Promise<AnalysisIndexEntry[]> {
    const results = await this.database
      .select({
        analysisId: careerAnalyses.analysisId,
        createdAt: careerAnalyses.createdAt,
        validationState: careerAnalyses.validationState,
        overallConfidence: careerAnalyses.overallConfidence
      })
      .from(careerAnalyses);

    return results.map(row => ({
      analysisId: row.analysisId,
      createdAt: row.createdAt,
      validationState: row.validationState as "VERIFIED",
      overallConfidence: row.overallConfidence ?? undefined
    }));
  }
}
