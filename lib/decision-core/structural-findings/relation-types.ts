import type { DecisionContextItemProvenance } from "../context";

export const STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION = "STRUCTURAL_RELATION_PROPOSAL_V1";

export const STRUCTURAL_RELATION_PROPOSAL_KINDS = [
  "CONTRADICTION",
  "DEPENDENCY"
] as const;

export type StructuralRelationProposalKind = typeof STRUCTURAL_RELATION_PROPOSAL_KINDS[number];

export interface ContradictionStructuralRelationProposalInput {
  kind: "CONTRADICTION";
  itemIds: readonly [string, string];
  provenance: DecisionContextItemProvenance;
}

export interface DependencyStructuralRelationProposalInput {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
  provenance: DecisionContextItemProvenance;
}

export type StructuralRelationProposalInput =
  | ContradictionStructuralRelationProposalInput
  | DependencyStructuralRelationProposalInput;

interface StructuralRelationProposalCommon {
  artifactKind: "STRUCTURAL_RELATION_PROPOSAL";
  schemaVersion: typeof STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION;
  relationProposalId: string;
  contextId: string;
  provenance: DecisionContextItemProvenance;
}

/** Proposal data only: it is not a finding, verified truth, or decision state. */
export interface ContradictionStructuralRelationProposal extends StructuralRelationProposalCommon {
  kind: "CONTRADICTION";
  itemIds: [string, string];
}

/** Proposal data only: it is not a finding, verified truth, or decision state. */
export interface DependencyStructuralRelationProposal extends StructuralRelationProposalCommon {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
}

export type StructuralRelationProposal =
  | ContradictionStructuralRelationProposal
  | DependencyStructuralRelationProposal;
