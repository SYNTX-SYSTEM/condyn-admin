import { VerifiedCareerAnalysis, AnalysisIndexEntry } from "./types";

/**
 * Decoupled persistence contract for canonical career analyses.
 * Guarantees that only VERIFIED domain models enter persistence,
 * while preventing UI/list views from polluting canonical index descriptors.
 */
export interface CareerAnalysisRepository {
  save(analysis: VerifiedCareerAnalysis): Promise<void>;
  load(analysisId: string): Promise<VerifiedCareerAnalysis | null>;
  list(): Promise<AnalysisIndexEntry[]>;
}

/**
 * In-memory repository implementation for TDD and decoupled projection testing.
 * Enforces runtime verification guards and deep immutability of stored records.
 */
export class InMemoryCareerAnalysisRepository implements CareerAnalysisRepository {
  private store = new Map<string, VerifiedCareerAnalysis>();

  async save(analysis: VerifiedCareerAnalysis): Promise<void> {
    const state = analysis?.structured_data?.analysis?.metadata?.validation_state;
    if (state !== "VERIFIED") {
      throw new Error(`ERR_UNVERIFIED_ANALYSIS_PERSISTENCE: Cannot persist analysis with state "${state}". Only VERIFIED analyses may be stored.`);
    }

    const analysisId = analysis?.structured_data?.analysis?.metadata?.analysis_id;
    if (!analysisId) {
      throw new Error("ERR_UNVERIFIED_ANALYSIS_PERSISTENCE: Missing canonical analysis_id in metadata.");
    }

    // Deep clone to guarantee immutability of stored domain records
    const cloned = JSON.parse(JSON.stringify(analysis)) as VerifiedCareerAnalysis;
    this.store.set(analysisId, cloned);
  }

  async load(analysisId: string): Promise<VerifiedCareerAnalysis | null> {
    const item = this.store.get(analysisId);
    if (!item) {
      return null;
    }
    // Return deep copy to prevent external mutation from affecting store
    return JSON.parse(JSON.stringify(item)) as VerifiedCareerAnalysis;
  }

  async list(): Promise<AnalysisIndexEntry[]> {
    const entries: AnalysisIndexEntry[] = [];
    for (const [analysisId, analysis] of this.store.entries()) {
      const meta = analysis.structured_data.analysis.metadata;
      entries.push({
        analysisId,
        createdAt: meta.analysis_timestamp || new Date().toISOString(),
        validationState: "VERIFIED",
        overallConfidence: meta.overall_confidence ?? 0.0
      });
    }
    return entries;
  }
}
