import type { EvidenceBindingDisposition, SemanticEvidenceBindingProposal } from "../evidence-binding";
import type { DecisionContextItemRole } from "../context";
import type { StructuralRelationProposal } from "../structural-findings";

export const STRUCTURAL_GAP_SCHEMA_VERSION = "STRUCTURAL_GAP_V1";

export type StructuralGapKind = "EVIDENCE_BINDING" | "CONTEXT_ROLE" | "DEPENDENCY";

export interface EvidenceBindingStructuralGapObservationBasis {
  kind: "EVIDENCE_BINDING";
  bindings: readonly SemanticEvidenceBindingProposal[];
}

export interface ContextRoleStructuralGapObservationBasis {
  kind: "CONTEXT_ROLE";
}

export interface DependencyStructuralGapObservationBasis {
  kind: "DEPENDENCY";
  relationProposals: readonly StructuralRelationProposal[];
}

export type StructuralGapObservationBasis =
  | EvidenceBindingStructuralGapObservationBasis
  | ContextRoleStructuralGapObservationBasis
  | DependencyStructuralGapObservationBasis;

interface StructuralGapCommon {
  artifactKind: "STRUCTURAL_GAP";
  schemaVersion: typeof STRUCTURAL_GAP_SCHEMA_VERSION;
  gapId: string;
  contextId: string;
  expectationId: string;
}

export interface EvidenceBindingStructuralGap extends StructuralGapCommon {
  kind: "EVIDENCE_BINDING";
  subjectItemId: string;
  acceptedDispositions: EvidenceBindingDisposition[];
  observedBindingIds: string[];
}

export interface ContextRoleStructuralGap extends StructuralGapCommon {
  kind: "CONTEXT_ROLE";
  role: DecisionContextItemRole;
  minimumCount: number;
  observedCount: number;
  observedItemIds: string[];
}

export interface DependencyStructuralGap extends StructuralGapCommon {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
  observedRelationProposalIds: string[];
}

/** Deterministic basis-relative derivation only; not real-world absence or decision state. */
export type StructuralGap = EvidenceBindingStructuralGap | ContextRoleStructuralGap | DependencyStructuralGap;
