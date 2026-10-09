import { assertVerifiedCapabilitySnapshot, computeSnapshotKey } from "../career/capability-core";
import { assertEvolutionInputState } from "../career/relation/evolution-input";
import { assertRecommendationProposal, type RecommendationProposalItem } from "../career/relation/recommendation-proposal";
import { assertRoleRelation } from "../career/relation/role-relation";
import { assertTensionState } from "../career/relation/tension-state";
import { assertTargetRequirementRevision, assertTargetRoleProfileRevision, type TargetRequirementRevision } from "../career/target/role";
import { CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, CAPABILITY_CORE_PRODUCER_ID } from "../decision-adapters/capability-core";
import { CAREER_CANONICAL_FAMILIES, CAREER_CANONICAL_PRODUCER_ID, careerCanonicalItemLocator } from "../decision-adapters/career-canonical";
import { createDecisionContextDraft, type AuthoritativeStateReference, type DecisionContextDraftInput, type DecisionContextItemInput } from "../decision-core";
import type { HrDecisionContextDraftRequest, HrDecisionContextSourceState } from "./types";

const SOURCE_STATE_INVALID = "ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID";
const LINEAGE_MISMATCH = "ERR_HR_DECISION_CONTEXT_LINEAGE_MISMATCH";
const QUESTION_INVALID = "ERR_HR_DECISION_CONTEXT_QUESTION_INVALID";
const NO_PROPOSED_ITEM = "ERR_HR_DECISION_CONTEXT_NO_PROPOSED_ITEM";
const REQUEST_INVALID = "ERR_HR_DECISION_CONTEXT_REQUEST_INVALID";

const fail = (code: string): never => { throw new Error(code); };
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function careerReference(family: keyof typeof CAREER_CANONICAL_FAMILIES, artifactId: string, locator: string = artifactId): AuthoritativeStateReference {
  return {
    producerId: CAREER_CANONICAL_PRODUCER_ID,
    authorityContractId: CAREER_CANONICAL_FAMILIES[family].authorityContractId,
    artifactId,
    locator
  };
}

function captureExactObject(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
  const names = Object.keys(value);
  if (names.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) return fail(code);
  return value as Record<string, unknown>;
}

function assertSourceState(value: unknown): HrDecisionContextSourceState {
  const captured = captureExactObject(value, [
    "verifiedCapabilitySnapshot", "recommendationProposal", "evolutionInputState", "tensionState", "roleRelation", "targetRoleProfileRevision", "targetRequirementRevisions"
  ], REQUEST_INVALID) as unknown as HrDecisionContextSourceState;
  try {
    assertVerifiedCapabilitySnapshot(captured.verifiedCapabilitySnapshot);
    assertRecommendationProposal(captured.recommendationProposal);
    assertEvolutionInputState(captured.evolutionInputState);
    assertTensionState(captured.tensionState);
    assertRoleRelation(captured.roleRelation);
    assertTargetRoleProfileRevision(captured.targetRoleProfileRevision);
    if (!Array.isArray(captured.targetRequirementRevisions)) fail(SOURCE_STATE_INVALID);
    for (const revision of captured.targetRequirementRevisions) assertTargetRequirementRevision(revision);
  } catch {
    return fail(SOURCE_STATE_INVALID);
  }
  const snapshot = captured.verifiedCapabilitySnapshot;
  if (snapshot.status !== "VERIFIED" || snapshot.publication?.mode !== "PHASE4_VERIFIED") fail(SOURCE_STATE_INVALID);
  return captured;
}

/** Every copied lineage id must point at the exact artifact supplied; nothing is discovered by search. */
function assertLineage(state: HrDecisionContextSourceState): void {
  const proposal = state.recommendationProposal;
  const profileId = state.targetRoleProfileRevision.targetRoleProfileRevisionId;
  const snapshotId = state.verifiedCapabilitySnapshot.snapshotId;
  const coherent =
    proposal.evolutionInputStateId === state.evolutionInputState.evolutionInputStateId &&
    proposal.tensionStateId === state.tensionState.tensionStateId &&
    proposal.roleRelationId === state.roleRelation.roleRelationId &&
    proposal.verifiedCapabilitySnapshotId === snapshotId &&
    proposal.targetRoleProfileRevisionId === profileId &&
    state.evolutionInputState.tensionStateId === state.tensionState.tensionStateId &&
    state.evolutionInputState.roleRelationId === state.roleRelation.roleRelationId &&
    state.tensionState.roleRelationId === state.roleRelation.roleRelationId &&
    state.roleRelation.verifiedCapabilitySnapshotId === snapshotId &&
    state.roleRelation.targetRoleProfileRevisionId === profileId &&
    state.targetRequirementRevisions.every((revision) => revision.targetRoleProfileRevisionId === profileId) &&
    new Set(state.targetRequirementRevisions.map((revision) => revision.targetRequirementRevisionId)).size === state.targetRequirementRevisions.length;
  if (!coherent) fail(LINEAGE_MISMATCH);
}

/**
 * Statements render only closed enumeration literals of the referenced item, never its
 * caller-chosen identifiers or copied lineage ids. The exact item stays reachable through
 * the provenance reference; the payload itself is never Decision Context content.
 */
function optionStatement(item: RecommendationProposalItem): string {
  return `RCP item ${item.sourceEvolutionInputItemOrdinal}: ${item.recommendationKind} from ${item.evolutionInputClass}`;
}

function constraintStatement(revision: TargetRequirementRevision): string {
  return `Target requirement [${revision.requirement.necessityState.kind}]: ${revision.requirement.normalizedStatement}`;
}

/**
 * Builds the G2 Decision Context draft input for one HR decision over one exact RCP.
 *
 * OPTION items come only from PROPOSED proposal items, each with AUTHORITATIVE_STATE
 * provenance to the exact RCP item locator. CONSTRAINT items come from the exact target
 * requirement revisions. The question is HUMAN_INPUT. Nothing here resolves a reference,
 * copies an upstream payload into the context, or establishes recommendation authority:
 * the bound reader of the runtime resolves every reference when the context is persisted.
 */
export function buildHrDecisionContextDraftInput(request: HrDecisionContextDraftRequest): DecisionContextDraftInput {
  const captured = captureExactObject(request, ["question", "sourceState"], REQUEST_INVALID);
  const question = captureExactObject(captured.question, ["statement", "actorId"], QUESTION_INVALID);
  const questionStatement = question.statement;
  const questionActorId = question.actorId;
  if (!isNonEmptyString(questionStatement) || !isNonEmptyString(questionActorId)) return fail(QUESTION_INVALID);
  const state = assertSourceState(captured.sourceState);
  assertLineage(state);

  const proposal = state.recommendationProposal;
  const proposedItems = proposal.items.filter((item) => item.recommendationDisposition === "PROPOSED");
  if (proposedItems.length === 0) fail(NO_PROPOSED_ITEM);

  const snapshotReference: AuthoritativeStateReference = {
    producerId: CAPABILITY_CORE_PRODUCER_ID,
    authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
    artifactId: state.verifiedCapabilitySnapshot.snapshotId,
    locator: computeSnapshotKey(state.verifiedCapabilitySnapshot)
  };
  const proposalReference = careerReference("RCP", proposal.recommendationProposalId);
  const itemReferences = proposedItems.map((item) => careerReference("RCP", proposal.recommendationProposalId, careerCanonicalItemLocator(proposal.recommendationProposalId, item.sourceEvolutionInputItemOrdinal)));
  const requirementReferences = state.targetRequirementRevisions.map((revision) => careerReference("TRQREV", revision.targetRequirementRevisionId));

  const sourceStateReferences: AuthoritativeStateReference[] = [
    snapshotReference,
    proposalReference,
    ...itemReferences,
    careerReference("EIS", state.evolutionInputState.evolutionInputStateId),
    careerReference("TSN", state.tensionState.tensionStateId),
    careerReference("RRL", state.roleRelation.roleRelationId),
    careerReference("TRPREV", state.targetRoleProfileRevision.targetRoleProfileRevisionId),
    ...requirementReferences
  ];

  const items: DecisionContextItemInput[] = [
    { role: "DECISION_QUESTION", statement: questionStatement, provenance: { origin: "HUMAN_INPUT", actorId: questionActorId } },
    ...proposedItems.map((item, index): DecisionContextItemInput => ({
      role: "OPTION",
      statement: optionStatement(item),
      provenance: { origin: "AUTHORITATIVE_STATE", stateReference: itemReferences[index] }
    })),
    ...state.targetRequirementRevisions.map((revision, index): DecisionContextItemInput => ({
      role: "CONSTRAINT",
      statement: constraintStatement(revision),
      provenance: { origin: "AUTHORITATIVE_STATE", stateReference: requirementReferences[index] }
    }))
  ];

  const input: DecisionContextDraftInput = { sourceStateReferences, items };
  // Admissibility check only: the kernel decides the canonical draft; no reference is resolved here.
  createDecisionContextDraft(input);
  return structuredClone(input);
}
