import type { DecisionAssessmentRequest } from "../assessment-request";
import type { DecisionContextRevision } from "../revisions";

export const DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION = "DECISION_ASSESSMENT_BASIS_V1";

export interface DecisionAssessmentBasisRevisionReader {
  getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>;
}

export interface DecisionAssessmentBasis {
  artifactKind: "DECISION_ASSESSMENT_BASIS";
  schemaVersion: typeof DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION;
  assessmentBasisId: string;
  assessmentRequest: DecisionAssessmentRequest;
  revision: DecisionContextRevision;
}

export interface BoundDecisionAssessmentBasisBinder {
  bind(assessmentRequest: DecisionAssessmentRequest): Promise<DecisionAssessmentBasis>;
}
