import type { StructuralRelationProposal } from "../structural-findings";

export const STRUCTURAL_CONSEQUENCE_SCHEMA_VERSION = "STRUCTURAL_CONSEQUENCE_V1";

export interface StructuralConsequencePropagationBasis {
  kind: "DEPENDENCY_PATH";
  relationProposals: readonly StructuralRelationProposal[];
}

/** Deterministic basis-relative propagation only; it is not a prediction or decision state. */
export interface StructuralConsequence {
  artifactKind: "STRUCTURAL_CONSEQUENCE";
  schemaVersion: typeof STRUCTURAL_CONSEQUENCE_SCHEMA_VERSION;
  consequenceId: string;
  contextId: string;
  sourceGapId: string;
  sourceItemId: string;
  affectedItemId: string;
  dependencyPathRelationProposalIds: string[];
}
