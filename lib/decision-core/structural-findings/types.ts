import type { EvidenceBindingDisposition } from "../evidence-binding";
import type { DecisionContextItemProvenance, DecisionContextItemRole } from "../context";

export const STRUCTURAL_EXPECTATION_SCHEMA_VERSION = "STRUCTURAL_EXPECTATION_V1";

export const STRUCTURAL_EXPECTATION_KINDS = [
  "EVIDENCE_BINDING",
  "CONTEXT_ROLE",
  "DEPENDENCY"
] as const;

export type StructuralExpectationKind = typeof STRUCTURAL_EXPECTATION_KINDS[number];

export interface EvidenceBindingStructuralExpectationInput {
  kind: "EVIDENCE_BINDING";
  subjectItemId: string;
  acceptedDispositions: readonly EvidenceBindingDisposition[];
  provenance: DecisionContextItemProvenance;
}

export interface ContextRoleStructuralExpectationInput {
  kind: "CONTEXT_ROLE";
  role: DecisionContextItemRole;
  minimumCount: number;
  provenance: DecisionContextItemProvenance;
}

export interface DependencyStructuralExpectationInput {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
  provenance: DecisionContextItemProvenance;
}

export type StructuralExpectationInput =
  | EvidenceBindingStructuralExpectationInput
  | ContextRoleStructuralExpectationInput
  | DependencyStructuralExpectationInput;

interface StructuralExpectationCommon {
  artifactKind: "STRUCTURAL_EXPECTATION";
  schemaVersion: typeof STRUCTURAL_EXPECTATION_SCHEMA_VERSION;
  expectationId: string;
  contextId: string;
  provenance: DecisionContextItemProvenance;
}

export interface EvidenceBindingStructuralExpectation extends StructuralExpectationCommon {
  kind: "EVIDENCE_BINDING";
  subjectItemId: string;
  acceptedDispositions: EvidenceBindingDisposition[];
}

export interface ContextRoleStructuralExpectation extends StructuralExpectationCommon {
  kind: "CONTEXT_ROLE";
  role: DecisionContextItemRole;
  minimumCount: number;
}

export interface DependencyStructuralExpectation extends StructuralExpectationCommon {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
}

/** Explicit structural comparison target only; it is not a gap or a finding. */
export type StructuralExpectation =
  | EvidenceBindingStructuralExpectation
  | ContextRoleStructuralExpectation
  | DependencyStructuralExpectation;
