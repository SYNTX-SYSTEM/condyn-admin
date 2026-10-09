import type { CareerDecisionContextRevision } from "../decision-context";
import type { AuthoritativeStateReference } from "../state-change-declaration";

export const CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION =
  "CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_V1" as const;

/**
 * Exact shape witness of one generic Decision Core revision as returned by a
 * bound reader. The Career field validates only the represented shape and the
 * exact identifiers it binds to; generic validity is supplied by the reader.
 *
 * SHAPE WITNESS != GENERIC VALIDITY. READER RETURN != PERSISTENCE PROOF.
 */
export interface GenericDecisionContextRevisionWitness {
  artifactKind: "DECISION_CONTEXT_REVISION";
  schemaVersion: "DECISION_CONTEXT_REVISION_V1";
  revisionId: string;
  previousRevisionId: string | null;
  context: {
    artifactKind: "DECISION_CONTEXT_DRAFT";
    schemaVersion: "DECISION_CONTEXT_DRAFT_V1";
    contextId: string;
    validationStatus: "NOT_RUN";
    sourceStateReferences: readonly AuthoritativeStateReference[];
    decisionQuestionId: string;
    items: readonly unknown[];
  };
  validationInput: unknown;
  validationAssembly: unknown;
}

/** Bound exact-id read of a generic revision. It never selects current, head or latest state. */
export interface GenericDecisionContextRevisionReader {
  getDecisionContextRevisionById(revisionId: string): Promise<unknown>;
}

export interface CareerDecisionContextRevisionReader {
  getCareerDecisionContextRevisionById(careerDecisionContextRevisionId: string): Promise<CareerDecisionContextRevision | null>;
}

export interface CareerDecisionContextDecisionRevisionBindingInput {
  careerDecisionContextRevisionId: string;
  decisionContextRevisionId: string;
  createdAt: string;
}

/**
 * Immutable exact binding of one Career decision context (DCTXREV) to one
 * generic Decision Context revision (DREV) whose source-state inventory names
 * the exact recommendation proposal the DCTXREV is built over.
 *
 * BINDING != CURRENTNESS. BINDING != ACCEPTANCE. BINDING != DECISION AUTHORITY.
 * BINDING != SEMANTIC SUPPORT. RCP WITNESS != OPTION CORRESPONDENCE.
 */
export interface CareerDecisionContextDecisionRevisionBinding {
  careerDecisionContextDecisionRevisionBindingId: string;
  careerDecisionContextRevision: CareerDecisionContextRevision;
  decisionContextRevision: GenericDecisionContextRevisionWitness;
  /** The exact DREV source-state reference that names the DCTXREV recommendation proposal. Derived; immutable. */
  recommendationProposalWitness: AuthoritativeStateReference;
  schemaVersion: typeof CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerDecisionContextDecisionRevisionBindingSemanticBody {
  careerDecisionContextRevision: Omit<CareerDecisionContextRevision, "createdAt">;
  decisionContextRevision: GenericDecisionContextRevisionWitness;
  recommendationProposalWitness: AuthoritativeStateReference;
  schemaVersion: typeof CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION;
}

export interface BoundCareerDecisionContextDecisionRevisionBinder {
  bind(input: CareerDecisionContextDecisionRevisionBindingInput): Promise<CareerDecisionContextDecisionRevisionBinding>;
}
