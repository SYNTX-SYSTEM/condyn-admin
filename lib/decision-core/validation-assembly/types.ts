import type { StructuralConsequence, StructuralConsequencePropagationBasis } from "../structural-consequences";
import type { StructuralExpectation } from "../structural-findings";
import type { StructuralGap, StructuralGapObservationBasis } from "../structural-gaps";

export const DECISION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION = "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1";

export interface EvidenceBindingStructuralValidationBasisDescriptor {
  kind: "EVIDENCE_BINDING";
  bindingIds: string[];
}

export interface ContextRoleStructuralValidationBasisDescriptor {
  kind: "CONTEXT_ROLE";
}

export interface DependencyStructuralValidationBasisDescriptor {
  kind: "DEPENDENCY";
  relationProposalIds: string[];
}

export type StructuralValidationBasisDescriptor =
  | EvidenceBindingStructuralValidationBasisDescriptor
  | ContextRoleStructuralValidationBasisDescriptor
  | DependencyStructuralValidationBasisDescriptor;

export interface NoGapStructuralExpectationValidationResult {
  expectationId: string;
  basis: StructuralValidationBasisDescriptor;
  outcome: "NO_GAP";
}

export interface GapStructuralExpectationValidationResult {
  expectationId: string;
  basis: StructuralValidationBasisDescriptor;
  outcome: "GAP";
  gapId: string;
}

export type StructuralExpectationValidationResult = NoGapStructuralExpectationValidationResult | GapStructuralExpectationValidationResult;

export interface StructuralExpectationValidationInput {
  expectation: StructuralExpectation;
  basis: StructuralGapObservationBasis;
  result: StructuralGap | null;
}

export interface StructuralConsequenceValidationInput {
  expectation: StructuralExpectation;
  gapBasis: StructuralGapObservationBasis;
  gap: StructuralGap;
  propagationBasis: StructuralConsequencePropagationBasis;
  consequence: StructuralConsequence;
}

export interface DecisionContextValidationAssemblyInput {
  expectationValidations: readonly StructuralExpectationValidationInput[];
  consequenceValidations: readonly StructuralConsequenceValidationInput[];
}

/** Deterministic derivational coherence only; not truth, completeness, or decision state. */
export interface DecisionContextValidationAssembly {
  artifactKind: "DECISION_CONTEXT_VALIDATION_ASSEMBLY";
  schemaVersion: typeof DECISION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION;
  assemblyId: string;
  contextId: string;
  expectationResults: StructuralExpectationValidationResult[];
  consequenceIds: string[];
}
