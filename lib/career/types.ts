import { CanonicalCareerAnalysis } from "./schema";

/**
 * Branded/intersected lifecycle type representing an analysis that has passed
 * the full validation pipeline and been stamped as VERIFIED.
 */
export type VerifiedCareerAnalysis = CanonicalCareerAnalysis & {
  structured_data: {
    analysis: {
      metadata: {
        validation_state: "VERIFIED";
      };
    };
  };
};

/**
 * Lightweight index descriptor returned by list() operations.
 * Strictly backed by canonical domain fields without UI or title coupling.
 */
export interface AnalysisIndexEntry {
  analysisId: string;
  createdAt: string;
  validationState: "VERIFIED";
  overallConfidence?: number;
}
