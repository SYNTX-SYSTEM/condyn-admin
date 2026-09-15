import { createHash } from "node:crypto";
import {
  assertCareerDecisionContextRevision,
  deriveCareerDecisionContextRevisionId,
  type CareerDecisionContextRevision,
} from "../decision-context";
import {
  assertCareerOutcomeValenceFeedbackContextContent,
  deriveCareerOutcomeValenceFeedbackContextContentId,
  type CareerOutcomeValenceFeedbackContextContent,
} from "../outcome-valence-feedback-context-content";
import {
  assertCareerOutcomeValenceFeedbackReturnItem,
  deriveCareerOutcomeValenceFeedbackReturnItemId,
  type CareerOutcomeValenceFeedbackReturnItem,
} from "../outcome-valence-feedback-return-item";
import {
  CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION,
  type CareerOutcomeValenceFeedbackContextTransition,
  type CareerOutcomeValenceFeedbackContextTransitionInput,
  type CareerOutcomeValenceFeedbackContextTransitionSemanticBody,
} from "./types";

type Captured = Record<string, unknown>;

const fail = (code: string): never => { throw new Error(code); };
const baseInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_BASE_INVALID";
const previousInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_PREVIOUS_INVALID";
const addedInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_ADDED_MEMBER_INVALID";
const resultInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_RESULT_INVALID";
const baseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_BASE_MISMATCH";
const alreadyPresent = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_MEMBER_ALREADY_PRESENT";
const notPlusOne = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_NOT_PLUS_ONE";
const priorMissing = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_PRIOR_MEMBER_MISSING";
const unexpectedMember = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_UNEXPECTED_MEMBER";
const memberSemanticMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_MEMBER_SEMANTIC_MISMATCH";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_ID_MISMATCH";
const firstTransitionSentinel = "FIRST_TRANSITION_FROM_BASE" as const;

const artifactKeys = [
  "careerOutcomeValenceFeedbackContextTransitionId",
  "baseCareerDecisionContextRevision",
  "previousFeedbackContextContent",
  "addedFeedbackReturnItem",
  "resultingFeedbackContextContent",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = [
  "baseCareerDecisionContextRevision",
  "previousFeedbackContextContent",
  "addedFeedbackReturnItem",
  "resultingFeedbackContextContent",
  "schemaVersion",
] as const;
const inputKeys = ["createdAt"] as const;
const baseArtifactKeys = [
  "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId",
  "decisionSubjects", "contextEvidenceRefs", "authorityScope", "permittedDecisionClasses",
  "permittedSubjectKinds", "schemaVersion", "createdAt",
] as const;
const baseSemanticKeys = baseArtifactKeys.filter(key => key !== "careerDecisionContextRevisionId" && key !== "createdAt");
const contentArtifactKeys = [
  "careerOutcomeValenceFeedbackContextContentId", "baseCareerDecisionContextRevision", "feedbackReturnItems",
  "schemaVersion", "createdAt",
] as const;
const contentSemanticKeys = ["baseCareerDecisionContextRevision", "feedbackReturnItems", "schemaVersion"] as const;
const transitionIdPattern = /^COVFCT_[0-9A-F]{32}$/;

function capture(value: unknown, code: string): Captured {
  try {
    const result = structuredClone(value);
    if (result === null || Array.isArray(result) || typeof result !== "object") return fail(code);
    return result as Captured;
  } catch { return fail(code); }
}

function exact(value: unknown, keys: readonly string[], code: string): Captured {
  const result = capture(value, code);
  const actual = Object.keys(result);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(result, key))) return fail(code);
  return result;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Captured).sort().map(key => [key, canonical((value as Captured)[key]) ]));
  }
  return value;
}

function removeAuditTimes(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeAuditTimes);
  if (value !== null && typeof value === "object") {
    const result: Captured = {};
    for (const key of Object.keys(value as Captured)) if (key !== "createdAt") result[key] = removeAuditTimes((value as Captured)[key]);
    return result;
  }
  return value;
}

function stable(value: unknown): string {
  try { return JSON.stringify(canonical(structuredClone(value))); } catch { return fail(invalid); }
}

function completeBase(value: unknown, code: string): CareerDecisionContextRevision {
  try {
    const result = capture(value, code) as unknown as CareerDecisionContextRevision;
    assertCareerDecisionContextRevision(result);
    return result;
  } catch { return fail(code); }
}

function baseBodyFromComplete(value: CareerDecisionContextRevision): Captured {
  const { careerDecisionContextRevisionId: _id, createdAt: _createdAt, ...body } = value;
  return canonical(removeAuditTimes(body)) as Captured;
}

function baseBody(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  if (Object.keys(captured).length === baseArtifactKeys.length && baseArtifactKeys.every(key => key in captured)) {
    return baseBodyFromComplete(completeBase(captured, code));
  }
  const { careerDecisionContextRevisionId: _id, createdAt: _createdAt, ...body } = captured;
  const semantic = exact(body, baseSemanticKeys, code);
  try { deriveCareerDecisionContextRevisionId(semantic as never); } catch { return fail(code); }
  return canonical(removeAuditTimes(semantic)) as Captured;
}

function representationBody(value: unknown, code: string): Captured {
  const representation = capture(value, code);
  const withoutAudit = removeAuditTimes(representation) as Captured;
  const {
    careerOutcomeValenceFeedbackReturnRepresentationId: _representationId,
    careerOutcomeValenceFeedbackTargetRevisionBinding,
    ...representationResult
  } = withoutAudit;
  const binding = capture(careerOutcomeValenceFeedbackTargetRevisionBinding, code);
  const {
    careerOutcomeValenceFeedbackTargetRevisionBindingId: _bindingId,
    careerOutcomeValenceFeedbackTargetDeclaration,
    targetCareerDecisionContextRevision,
    ...bindingResult
  } = binding;
  const declaration = capture(careerOutcomeValenceFeedbackTargetDeclaration, code);
  const { careerOutcomeValenceFeedbackTargetDeclarationId: _declarationId, ...declarationResult } = declaration;
  const target = capture(targetCareerDecisionContextRevision, code);
  const { careerDecisionContextRevisionId: _targetId, ...targetResult } = target;
  return canonical({
    ...representationResult,
    careerOutcomeValenceFeedbackTargetRevisionBinding: {
      ...bindingResult,
      careerOutcomeValenceFeedbackTargetDeclaration: declarationResult,
      targetCareerDecisionContextRevision: targetResult,
    },
  }) as Captured;
}

function itemBody(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  const {
    careerOutcomeValenceFeedbackReturnItemId: _itemId,
    createdAt: _createdAt,
    careerOutcomeValenceFeedbackReturnRepresentation,
    schemaVersion,
    ...unexpected
  } = captured;
  if (Object.keys(unexpected).length !== 0 || schemaVersion !== "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_V1") return fail(code);
  try {
    deriveCareerOutcomeValenceFeedbackReturnItemId({
      careerOutcomeValenceFeedbackReturnRepresentation,
      schemaVersion,
    } as never);
  } catch { return fail(code); }
  return canonical({
    careerOutcomeValenceFeedbackReturnRepresentation: representationBody(careerOutcomeValenceFeedbackReturnRepresentation, code),
    schemaVersion,
  }) as Captured;
}

function completeItem(value: unknown, code: string): CareerOutcomeValenceFeedbackReturnItem {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackReturnItem;
    assertCareerOutcomeValenceFeedbackReturnItem(result);
    return result;
  } catch { return fail(code); }
}

function itemId(value: CareerOutcomeValenceFeedbackReturnItem): string {
  return value.careerOutcomeValenceFeedbackReturnItemId;
}

function sameItem(left: CareerOutcomeValenceFeedbackReturnItem, right: CareerOutcomeValenceFeedbackReturnItem): boolean {
  return itemId(left) === itemId(right) && stable(itemBody(left, invalid)) === stable(itemBody(right, invalid));
}

function contentBody(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  const {
    careerOutcomeValenceFeedbackContextContentId: _contentId,
    createdAt: _createdAt,
    baseCareerDecisionContextRevision,
    feedbackReturnItems,
    schemaVersion,
    ...unexpected
  } = captured;
  if (Object.keys(unexpected).length !== 0 || schemaVersion !== "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_V1" || !Array.isArray(feedbackReturnItems)) return fail(code);
  try {
    deriveCareerOutcomeValenceFeedbackContextContentId({
      baseCareerDecisionContextRevision,
      feedbackReturnItems,
      schemaVersion,
    } as never);
  } catch { return fail(code); }
  const entries = feedbackReturnItems.map(member => {
    const item = capture(member, code);
    let id: string;
    try {
      id = deriveCareerOutcomeValenceFeedbackReturnItemId({
        careerOutcomeValenceFeedbackReturnRepresentation: item.careerOutcomeValenceFeedbackReturnRepresentation,
        schemaVersion: item.schemaVersion,
      } as never);
    } catch { return fail(code); }
    return { id, body: itemBody(item, code) };
  }).sort((left, right) => left.id.localeCompare(right.id));
  return canonical({
    baseCareerDecisionContextRevision: baseBody(baseCareerDecisionContextRevision, code),
    feedbackReturnItems: entries.map(entry => entry.body),
    schemaVersion,
  }) as Captured;
}

function completeContent(value: unknown, code: string): CareerOutcomeValenceFeedbackContextContent {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackContextContent;
    assertCareerOutcomeValenceFeedbackContextContent(result);
    return result;
  } catch { return fail(code); }
}

function targetFromItem(item: CareerOutcomeValenceFeedbackReturnItem): CareerDecisionContextRevision {
  return item.careerOutcomeValenceFeedbackReturnRepresentation
    .careerOutcomeValenceFeedbackTargetRevisionBinding.targetCareerDecisionContextRevision;
}

function sameBase(left: CareerDecisionContextRevision, right: CareerDecisionContextRevision): boolean {
  return left.careerDecisionContextRevisionId === right.careerDecisionContextRevisionId &&
    stable(baseBodyFromComplete(left)) === stable(baseBodyFromComplete(right));
}

function assertBaseWitnesses(
  base: CareerDecisionContextRevision,
  previous: CareerOutcomeValenceFeedbackContextContent | null,
  added: CareerOutcomeValenceFeedbackReturnItem,
  result: CareerOutcomeValenceFeedbackContextContent,
): void {
  if (!sameBase(result.baseCareerDecisionContextRevision, base) || !sameBase(targetFromItem(added), base)) fail(baseMismatch);
  if (previous !== null && !sameBase(previous.baseCareerDecisionContextRevision, base)) fail(baseMismatch);
}

function mapMembers(content: CareerOutcomeValenceFeedbackContextContent): Map<string, CareerOutcomeValenceFeedbackReturnItem> {
  return new Map(content.feedbackReturnItems.map(member => [itemId(member), member]));
}

function assertFirst(
  added: CareerOutcomeValenceFeedbackReturnItem,
  result: CareerOutcomeValenceFeedbackContextContent,
): void {
  if (result.feedbackReturnItems.length !== 1) fail(notPlusOne);
  const member = result.feedbackReturnItems[0];
  if (itemId(member) !== itemId(added)) fail(unexpectedMember);
  if (!sameItem(member, added)) fail(memberSemanticMismatch);
}

function assertSubsequent(
  previous: CareerOutcomeValenceFeedbackContextContent,
  added: CareerOutcomeValenceFeedbackReturnItem,
  result: CareerOutcomeValenceFeedbackContextContent,
): void {
  const prior = mapMembers(previous);
  const output = mapMembers(result);
  if (prior.has(itemId(added))) fail(alreadyPresent);
  if (result.feedbackReturnItems.length !== previous.feedbackReturnItems.length + 1) fail(notPlusOne);
  for (const [id, member] of prior) {
    const retained = output.get(id);
    if (retained === undefined) fail(priorMissing);
    if (!sameItem(retained, member)) fail(memberSemanticMismatch);
  }
  for (const [id, member] of output) {
    if (!prior.has(id) && id !== itemId(added)) fail(unexpectedMember);
    if (id === itemId(added) && !sameItem(member, added)) fail(memberSemanticMismatch);
  }
  if (!output.has(itemId(added))) fail(unexpectedMember);
  if (result.careerOutcomeValenceFeedbackContextContentId === previous.careerOutcomeValenceFeedbackContextContentId) fail(notPlusOne);
}

function input(value: unknown): CareerOutcomeValenceFeedbackContextTransitionInput {
  const result = exact(value, inputKeys, invalid);
  if (!timestamp(result.createdAt)) return fail(invalid);
  return { createdAt: result.createdAt as string };
}

function semanticBody(value: unknown, code: string): CareerOutcomeValenceFeedbackContextTransitionSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION) return fail(code);
  const previous = result.previousFeedbackContextContent === null
    ? firstTransitionSentinel
    : contentBody(result.previousFeedbackContextContent, code);
  return {
    baseCareerDecisionContextRevision: baseBody(result.baseCareerDecisionContextRevision, code),
    previousFeedbackContextContent: previous,
    addedFeedbackReturnItem: itemBody(result.addedFeedbackReturnItem, code),
    resultingFeedbackContextContent: contentBody(result.resultingFeedbackContextContent, code),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  base: CareerDecisionContextRevision,
  previous: CareerOutcomeValenceFeedbackContextContent | null,
  added: CareerOutcomeValenceFeedbackReturnItem,
  result: CareerOutcomeValenceFeedbackContextContent,
): CareerOutcomeValenceFeedbackContextTransitionSemanticBody {
  return {
    baseCareerDecisionContextRevision: baseBodyFromComplete(base),
    previousFeedbackContextContent: previous === null ? firstTransitionSentinel : contentBody(previous, invalid),
    addedFeedbackReturnItem: itemBody(added, invalid),
    resultingFeedbackContextContent: contentBody(result, invalid),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION,
  };
}

export function stableCareerOutcomeValenceFeedbackContextTransition(value: unknown): string {
  return stable(value);
}

function deriveId(body: CareerOutcomeValenceFeedbackContextTransitionSemanticBody): string {
  const identity = [
    CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION,
    canonical(body.baseCareerDecisionContextRevision),
    body.previousFeedbackContextContent === firstTransitionSentinel
      ? firstTransitionSentinel
      : canonical(body.previousFeedbackContextContent),
    canonical(body.addedFeedbackReturnItem),
    canonical(body.resultingFeedbackContextContent),
  ];
  return `COVFCT_${createHash("sha256").update(stable(identity), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function deriveCareerOutcomeValenceFeedbackContextTransitionId(
  value: CareerOutcomeValenceFeedbackContextTransitionSemanticBody,
): string {
  return deriveId(semanticBody(value, invalid));
}

function validateTransition(
  baseValue: unknown,
  previousValue: unknown,
  addedValue: unknown,
  resultValue: unknown,
  assertion: boolean,
) {
  const base = completeBase(baseValue, assertion ? invalid : baseInvalid);
  let previous: CareerOutcomeValenceFeedbackContextContent | null;
  if (previousValue === null) previous = null;
  else previous = completeContent(previousValue, assertion ? invalid : previousInvalid);
  const added = completeItem(addedValue, assertion ? invalid : addedInvalid);
  const result = completeContent(resultValue, assertion ? invalid : resultInvalid);
  assertBaseWitnesses(base, previous, added, result);
  if (previous === null) assertFirst(added, result);
  else assertSubsequent(previous, added, result);
  return { base, previous, added, result };
}

export function createCareerOutcomeValenceFeedbackContextTransition(
  baseValue: CareerDecisionContextRevision,
  previousValue: CareerOutcomeValenceFeedbackContextContent | null,
  addedValue: CareerOutcomeValenceFeedbackReturnItem,
  resultValue: CareerOutcomeValenceFeedbackContextContent,
  inputValue: CareerOutcomeValenceFeedbackContextTransitionInput,
): CareerOutcomeValenceFeedbackContextTransition {
  const { base, previous, added, result } = validateTransition(baseValue, previousValue, addedValue, resultValue, false);
  const capturedInput = input(inputValue);
  const transition: CareerOutcomeValenceFeedbackContextTransition = {
    careerOutcomeValenceFeedbackContextTransitionId: deriveId(semanticFromComplete(base, previous, added, result)),
    baseCareerDecisionContextRevision: base,
    previousFeedbackContextContent: previous,
    addedFeedbackReturnItem: added,
    resultingFeedbackContextContent: result,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION,
    createdAt: capturedInput.createdAt,
  };
  assertCareerOutcomeValenceFeedbackContextTransition(transition);
  return structuredClone(transition);
}

export function assertCareerOutcomeValenceFeedbackContextTransition(
  value: unknown,
): asserts value is CareerOutcomeValenceFeedbackContextTransition {
  try {
    const result = exact(value, artifactKeys, invalid);
    if (
      result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION ||
      typeof result.careerOutcomeValenceFeedbackContextTransitionId !== "string" ||
      !transitionIdPattern.test(result.careerOutcomeValenceFeedbackContextTransitionId) ||
      !timestamp(result.createdAt)
    ) return fail(invalid);
    const checked = validateTransition(
      result.baseCareerDecisionContextRevision,
      result.previousFeedbackContextContent,
      result.addedFeedbackReturnItem,
      result.resultingFeedbackContextContent,
      true,
    );
    const expected = deriveId(semanticFromComplete(checked.base, checked.previous, checked.added, checked.result));
    if (result.careerOutcomeValenceFeedbackContextTransitionId !== expected) fail(idMismatch);
  } catch (error) {
    if (error instanceof Error && [idMismatch, baseMismatch, alreadyPresent, notPlusOne, priorMissing, unexpectedMember, memberSemanticMismatch].includes(error.message)) throw error;
    return fail(invalid);
  }
}
