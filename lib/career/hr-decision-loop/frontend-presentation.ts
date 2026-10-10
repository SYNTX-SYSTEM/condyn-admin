/**
 * Client-safe decoders for the HR Decision Loop frontend. They accept only the
 * documented wire shapes and label exact artifacts already persisted and reread
 * by the server. A decoder never selects a current, latest or head artifact,
 * never derives a loop state, and never turns a persisted record into truth.
 */
import type { HrDecisionLoopRegionName, HrDecisionLoopRegionState } from "./read-model";

export type HrDecisionLoopPresentationRegionState = HrDecisionLoopRegionState;

export interface HrDecisionLoopArtifactRow {
  id: string;
  /** Short exact facts for the row, each already a persisted field; no derived judgement. */
  facts: readonly { label: string; value: string }[];
}

export interface HrDecisionLoopPresentationRegion {
  name: HrDecisionLoopRegionName;
  state: HrDecisionLoopPresentationRegionState;
  count: number;
  artifactIds: readonly string[];
  rows: readonly HrDecisionLoopArtifactRow[];
  failureCode?: string;
}

export interface HrDecisionSubjectPresentation {
  sourceEvolutionInputItemOrdinal: number;
  recommendationDisposition: string;
  recommendationKind: string | null;
  evolutionInputClass: string | null;
  tensionClassificationCode: string;
}

export interface HrDecisionLoopPresentation {
  mode: "HR_DECISION_LOOP_EXACT_CONTEXT";
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  authorizedActorId: string;
  grantorActorId: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  permittedDecisionClasses: readonly string[];
  subjects: readonly HrDecisionSubjectPresentation[];
  regions: readonly HrDecisionLoopPresentationRegion[];
}

export const HR_DECISION_LOOP_REGION_ORDER: readonly HrDecisionLoopRegionName[] = [
  "decisions",
  "actionIntents",
  "commitments",
  "executionAuthorityGrants",
  "executionContexts",
  "actionOccurrences",
  "stateChanges",
  "associations",
  "outcomeRoles",
  "outcomeValences",
  "feedbackAdmissions",
  "feedbackTargets",
  "feedbackTargetBindings",
  "feedbackContextRevisions"
];

/** Exact id field of every family, used to label rows; this is identity, not selection. */
const REGION_ID_FIELD: Record<HrDecisionLoopRegionName, string> = {
  decisions: "humanDecisionRecordId",
  actionIntents: "careerDecisionActionIntentId",
  commitments: "careerHumanCommitmentId",
  executionAuthorityGrants: "careerExecutionAuthorityGrantRevisionId",
  executionContexts: "careerExecutionContextRevisionId",
  actionOccurrences: "careerActionOccurrenceId",
  stateChanges: "careerStateChangeDeclarationId",
  associations: "careerActionStateChangeAssociationDeclarationId",
  outcomeRoles: "careerOutcomeRoleDeclarationId",
  outcomeValences: "careerOutcomeValenceDeclarationId",
  feedbackAdmissions: "careerOutcomeValenceFeedbackAdmissionDeclarationId",
  feedbackTargets: "careerOutcomeValenceFeedbackTargetDeclarationId",
  feedbackTargetBindings: "careerOutcomeValenceFeedbackTargetRevisionBindingId",
  feedbackContextRevisions: "careerOutcomeValenceFeedbackContextRevisionId"
};

/** Persisted fields shown per family; every value is copied verbatim from the artifact. */
const REGION_FACT_FIELDS: Record<HrDecisionLoopRegionName, readonly string[]> = {
  decisions: ["declarationClass", "declarantActorId", "declaredAt"],
  actionIntents: ["actionIntentClass", "declaredByActorId", "declaredAt"],
  commitments: ["committedByActorId", "committedAt"],
  executionAuthorityGrants: ["executionAuthorityScope", "authorizedExecutionActorId", "effectiveFrom", "effectiveUntil"],
  executionContexts: ["declaredByActorId", "declaredAt"],
  actionOccurrences: ["performedByActorId", "occurredAt", "externalOccurrenceRef"],
  stateChanges: ["stateDimension", "observedByActorId", "observedAt"],
  associations: ["declaredByActorId", "declaredAt"],
  outcomeRoles: ["declaredByActorId", "declaredAt"],
  outcomeValences: ["valence", "declaredByActorId", "declaredAt"],
  feedbackAdmissions: ["admittedByActorId", "admittedAt"],
  feedbackTargets: ["targetCareerDecisionContextRevisionId", "declaredByActorId", "declaredAt"],
  feedbackTargetBindings: ["createdAt"],
  feedbackContextRevisions: ["createdAt"]
};

const regionStates: readonly HrDecisionLoopRegionState[] = ["AVAILABLE", "EMPTY", "NOT_PROVISIONED", "FAILED"];
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const isState = (value: unknown): value is HrDecisionLoopRegionState => typeof value === "string" && regionStates.some(state => state === value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === "string");

function scalar(value: unknown): string | null {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

/** Nested exact facts for the two feedback families whose payloads are compositions. */
function compositionFacts(name: HrDecisionLoopRegionName, artifact: Record<string, unknown>): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  if (name === "feedbackTargetBindings") {
    const declaration = artifact.careerOutcomeValenceFeedbackTargetDeclaration;
    const target = artifact.targetCareerDecisionContextRevision;
    if (isRecord(declaration) && typeof declaration.careerOutcomeValenceFeedbackTargetDeclarationId === "string") facts.push({ label: "careerOutcomeValenceFeedbackTargetDeclarationId", value: declaration.careerOutcomeValenceFeedbackTargetDeclarationId });
    if (isRecord(target) && typeof target.careerDecisionContextRevisionId === "string") facts.push({ label: "targetCareerDecisionContextRevisionId", value: target.careerDecisionContextRevisionId });
  }
  if (name === "feedbackContextRevisions") {
    const parent = artifact.parent;
    if (isRecord(parent) && typeof parent.parentRevisionKind === "string" && typeof parent.parentRevisionId === "string") {
      facts.push({ label: "parentRevisionKind", value: parent.parentRevisionKind });
      facts.push({ label: "parentRevisionId", value: parent.parentRevisionId });
    }
    const transition = artifact.careerOutcomeValenceFeedbackContextTransition;
    if (isRecord(transition)) {
      const added = transition.addedFeedbackReturnItem;
      const representation = isRecord(added) ? added.careerOutcomeValenceFeedbackReturnRepresentation : null;
      const represented = isRecord(representation) ? representation.representedFeedback : null;
      if (isRecord(represented) && typeof represented.valence === "string") facts.push({ label: "addedFeedbackValence", value: represented.valence });
      const resulting = transition.resultingFeedbackContextContent;
      if (isRecord(resulting) && Array.isArray(resulting.feedbackReturnItems)) facts.push({ label: "feedbackReturnItemCount", value: String(resulting.feedbackReturnItems.length) });
    }
  }
  return facts;
}

function decodeRegion(name: HrDecisionLoopRegionName, value: unknown): HrDecisionLoopPresentationRegion | null {
  if (!isRecord(value) || !isState(value.state) || !isStringArray(value.artifactIds) || !Array.isArray(value.artifacts)) return null;
  if (value.state === "FAILED" && typeof value.failureCode !== "string") return null;
  const rows: HrDecisionLoopArtifactRow[] = [];
  for (const artifact of value.artifacts) {
    if (!isRecord(artifact)) return null;
    const id = artifact[REGION_ID_FIELD[name]];
    if (typeof id !== "string") return null;
    const facts: { label: string; value: string }[] = [];
    for (const field of REGION_FACT_FIELDS[name]) {
      if (!Object.prototype.hasOwnProperty.call(artifact, field)) continue;
      const text = scalar(artifact[field]);
      if (text !== null) facts.push({ label: field, value: text });
    }
    facts.push(...compositionFacts(name, artifact));
    rows.push({ id, facts });
  }
  if (value.state === "AVAILABLE" && rows.length !== value.artifactIds.length) return null;
  return {
    name,
    state: value.state,
    count: value.state === "AVAILABLE" ? rows.length : 0,
    artifactIds: [...value.artifactIds],
    rows,
    ...(value.state === "FAILED" ? { failureCode: value.failureCode as string } : {})
  };
}

/** Decodes the `hrDecisionLoop` member of the GET envelope; any undocumented shape yields null. */
export function decodeHrDecisionLoopPresentation(value: unknown): HrDecisionLoopPresentation | null {
  if (!isRecord(value) || value.schemaVersion !== "HR_DECISION_LOOP_READ_MODEL_V1") return null;
  const context = value.careerDecisionContextRevision;
  const authority = value.decisionAuthorityGrantRevision;
  const proposal = value.recommendationProposal;
  if (!isRecord(context) || !isRecord(authority) || !isRecord(proposal)) return null;
  if (typeof context.careerDecisionContextRevisionId !== "string" || typeof context.decisionAuthorityGrantRevisionId !== "string" || typeof context.recommendationProposalId !== "string") return null;
  if (!isStringArray(context.permittedDecisionClasses) || !Array.isArray(context.decisionSubjects)) return null;
  if (typeof authority.authorizedActorId !== "string" || typeof authority.grantorActorId !== "string" || typeof authority.effectiveFrom !== "string") return null;
  if (authority.effectiveUntil !== null && typeof authority.effectiveUntil !== "string") return null;
  if (!Array.isArray(proposal.items)) return null;
  const subjects: HrDecisionSubjectPresentation[] = [];
  for (const subject of context.decisionSubjects) {
    if (!isRecord(subject) || typeof subject.sourceEvolutionInputItemOrdinal !== "number") return null;
    const item = proposal.items.find(candidate => isRecord(candidate) && candidate.sourceEvolutionInputItemOrdinal === subject.sourceEvolutionInputItemOrdinal);
    if (!isRecord(item) || typeof item.recommendationDisposition !== "string" || typeof item.tensionClassificationCode !== "string") return null;
    subjects.push({
      sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
      recommendationDisposition: item.recommendationDisposition,
      recommendationKind: typeof item.recommendationKind === "string" ? item.recommendationKind : null,
      evolutionInputClass: typeof item.evolutionInputClass === "string" ? item.evolutionInputClass : null,
      tensionClassificationCode: item.tensionClassificationCode
    });
  }
  const regions: HrDecisionLoopPresentationRegion[] = [];
  for (const name of HR_DECISION_LOOP_REGION_ORDER) {
    const region = decodeRegion(name, value[name]);
    if (region === null) return null;
    regions.push(region);
  }
  return {
    mode: "HR_DECISION_LOOP_EXACT_CONTEXT",
    careerDecisionContextRevisionId: context.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: context.decisionAuthorityGrantRevisionId,
    recommendationProposalId: context.recommendationProposalId,
    authorizedActorId: authority.authorizedActorId,
    grantorActorId: authority.grantorActorId,
    effectiveFrom: authority.effectiveFrom,
    effectiveUntil: authority.effectiveUntil,
    permittedDecisionClasses: [...context.permittedDecisionClasses],
    subjects,
    regions
  };
}

/**
 * Frozen Decision Context API v1 (`GET /api/decision-contexts/{revisionId}`):
 * only the documented fields are decoded. The revision is represented as a
 * persisted historical revision; `previousRevisionId` is an exact lineage
 * pointer, not a head or current marker.
 */
export interface DecisionContextRevisionItemPresentation {
  itemId: string;
  role: string;
  statement: string;
  provenanceOrigin: string;
  provenanceDetail: string;
}

export interface DecisionContextRevisionPresentation {
  revisionId: string;
  previousRevisionId: string | null;
  contextId: string;
  decisionQuestionId: string;
  validationStatus: string;
  sourceStateReferences: readonly { producerId: string; authorityContractId: string; artifactId: string; locator: string }[];
  items: readonly DecisionContextRevisionItemPresentation[];
}

const DECISION_CONTEXT_ITEM_ROLES = ["DECISION_QUESTION", "OBJECTIVE", "CONSTRAINT", "OPTION", "OBSERVATION", "ASSUMPTION", "UNCERTAINTY"];

function provenanceDetail(provenance: Record<string, unknown>): string | null {
  switch (provenance.origin) {
    case "AUTHORITATIVE_STATE": {
      const reference = provenance.stateReference;
      return isRecord(reference) && typeof reference.artifactId === "string" && typeof reference.authorityContractId === "string" ? `${reference.authorityContractId} · ${reference.artifactId}` : null;
    }
    case "HUMAN_INPUT": return typeof provenance.actorId === "string" ? provenance.actorId : null;
    case "MODEL_PROPOSAL": return typeof provenance.proposalRef === "string" ? provenance.proposalRef : null;
    case "DETERMINISTIC_DERIVATION": return typeof provenance.ruleId === "string" ? provenance.ruleId : null;
    default: return null;
  }
}

export function decodeDecisionContextRevisionPresentation(value: unknown): DecisionContextRevisionPresentation | null {
  if (!isRecord(value) || value.artifactKind !== "DECISION_CONTEXT_REVISION" || value.schemaVersion !== "DECISION_CONTEXT_REVISION_V1") return null;
  if (typeof value.revisionId !== "string") return null;
  if (value.previousRevisionId !== null && typeof value.previousRevisionId !== "string") return null;
  const context = value.context;
  if (!isRecord(context) || context.artifactKind !== "DECISION_CONTEXT_DRAFT" || typeof context.contextId !== "string" || typeof context.decisionQuestionId !== "string" || typeof context.validationStatus !== "string") return null;
  if (!Array.isArray(context.sourceStateReferences) || !Array.isArray(context.items)) return null;
  const sourceStateReferences: DecisionContextRevisionPresentation["sourceStateReferences"][number][] = [];
  for (const reference of context.sourceStateReferences) {
    if (!isRecord(reference) || typeof reference.producerId !== "string" || typeof reference.authorityContractId !== "string" || typeof reference.artifactId !== "string" || typeof reference.locator !== "string") return null;
    sourceStateReferences.push({ producerId: reference.producerId, authorityContractId: reference.authorityContractId, artifactId: reference.artifactId, locator: reference.locator });
  }
  const items: DecisionContextRevisionItemPresentation[] = [];
  for (const item of context.items) {
    if (!isRecord(item) || typeof item.itemId !== "string" || typeof item.role !== "string" || !DECISION_CONTEXT_ITEM_ROLES.includes(item.role) || typeof item.statement !== "string" || !isRecord(item.provenance) || typeof item.provenance.origin !== "string") return null;
    const detail = provenanceDetail(item.provenance);
    if (detail === null) return null;
    items.push({ itemId: item.itemId, role: item.role, statement: item.statement, provenanceOrigin: item.provenance.origin, provenanceDetail: detail });
  }
  return {
    revisionId: value.revisionId,
    previousRevisionId: value.previousRevisionId,
    contextId: context.contextId,
    decisionQuestionId: context.decisionQuestionId,
    validationStatus: context.validationStatus,
    sourceStateReferences,
    items
  };
}

export interface HumanDecisionRecordPresentation {
  humanDecisionRecordId: string;
  careerDecisionContextRevisionId: string;
  declarationClass: string;
  declarantActorId: string;
  declaredAt: string;
  declarationEvidenceRefs: readonly string[];
}

export function decodeHumanDecisionRecordPresentation(value: unknown): HumanDecisionRecordPresentation | null {
  if (!isRecord(value) || value.schemaVersion !== "HUMAN_DECISION_RECORD_V1") return null;
  if (typeof value.humanDecisionRecordId !== "string" || typeof value.careerDecisionContextRevisionId !== "string" || typeof value.declarationClass !== "string" || typeof value.declarantActorId !== "string" || typeof value.declaredAt !== "string" || !isStringArray(value.declarationEvidenceRefs)) return null;
  return {
    humanDecisionRecordId: value.humanDecisionRecordId,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
    declarationClass: value.declarationClass,
    declarantActorId: value.declarantActorId,
    declaredAt: value.declaredAt,
    declarationEvidenceRefs: [...value.declarationEvidenceRefs]
  };
}

/** The exact lineage walk ends at a null predecessor, at a missing revision, or at the bound depth. */
export const DECISION_CONTEXT_LINEAGE_MAX_DEPTH = 32;

export type DecisionContextLineageTerminal = "ROOT_REACHED" | "PREDECESSOR_NOT_FOUND" | "PREDECESSOR_UNDECODABLE" | "DEPTH_BOUND_REACHED";

export interface DecisionContextLineagePresentation {
  revisions: readonly DecisionContextRevisionPresentation[];
  terminal: DecisionContextLineageTerminal;
}

/**
 * Pure lineage walk over an exact reader. It follows `previousRevisionId`
 * only; it never searches descendants and never picks a latest revision.
 */
export async function walkDecisionContextLineage(
  startRevisionId: string,
  readRevision: (revisionId: string) => Promise<unknown | null>
): Promise<DecisionContextLineagePresentation> {
  const revisions: DecisionContextRevisionPresentation[] = [];
  let next: string | null = startRevisionId;
  for (let depth = 0; depth < DECISION_CONTEXT_LINEAGE_MAX_DEPTH && next !== null; depth += 1) {
    const raw = await readRevision(next);
    if (raw === null) return { revisions, terminal: "PREDECESSOR_NOT_FOUND" };
    const decoded = decodeDecisionContextRevisionPresentation(raw);
    if (decoded === null) return { revisions, terminal: "PREDECESSOR_UNDECODABLE" };
    revisions.push(decoded);
    next = decoded.previousRevisionId;
  }
  return { revisions, terminal: next === null ? "ROOT_REACHED" : "DEPTH_BOUND_REACHED" };
}
