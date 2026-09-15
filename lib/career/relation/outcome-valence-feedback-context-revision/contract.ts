import { createHash } from "node:crypto";
import type { CareerDecisionContextRevision } from "../decision-context";
import {
  assertCareerOutcomeValenceFeedbackContextContent,
  type CareerOutcomeValenceFeedbackContextContent,
} from "../outcome-valence-feedback-context-content";
import {
  assertCareerOutcomeValenceFeedbackContextTransition,
  type CareerOutcomeValenceFeedbackContextTransition,
} from "../outcome-valence-feedback-context-transition";
import {
  CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION,
  type CareerOutcomeValenceFeedbackContextParent,
  type CareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevisionInput,
  type CareerOutcomeValenceFeedbackContextRevisionSemanticBody,
} from "./types";

const parentInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_INVALID";
const transitionInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_TRANSITION_INVALID";
const parentModeMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_MODE_MISMATCH";
const parentContentMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_CONTENT_MISMATCH";
const baseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_BASE_MISMATCH";
const selfParent = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SELF_PARENT";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_ID_MISMATCH";
const dctxId = /^DCTXREV_[0-9A-F]{32}$/;
const covfcrId = /^COVFCR_[0-9A-F]{32}$/;
const revisionId = /^COVFCR_[0-9A-F]{32}$/;
const rootKeys = [
  "careerOutcomeValenceFeedbackContextRevisionId",
  "parent",
  "careerOutcomeValenceFeedbackContextTransition",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = ["parent", "careerOutcomeValenceFeedbackContextTransition", "schemaVersion"] as const;
const inputKeys = ["createdAt"] as const;
const firstParentKeys = ["parentRevisionKind", "parentRevisionId"] as const;
const subsequentParentKeys = ["parentRevisionKind", "parentRevisionId", "parentFeedbackContextContent"] as const;

type Captured = Record<string, unknown>;

const fail = (code: string): never => { throw new Error(code); };

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

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Captured).sort().map(key => [key, canonical((value as Captured)[key])]));
  }
  return value;
}

function stable(value: unknown): string {
  try { return JSON.stringify(canonical(structuredClone(value))); } catch { return fail(invalid); }
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function baseBody(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  const {
    careerDecisionContextRevisionId: _careerDecisionContextRevisionId,
    createdAt: _createdAt,
    ...body
  } = captured;
  const semantic = [
    "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "contextEvidenceRefs",
    "authorityScope", "permittedDecisionClasses", "permittedSubjectKinds", "schemaVersion",
  ];
  if (Object.keys(body).length !== semantic.length || semantic.some(key => !(key in body))) return fail(code);
  return canonical(body) as Captured;
}

function representationBody(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  const {
    careerOutcomeValenceFeedbackReturnRepresentationId: _representationId,
    createdAt: _createdAt,
    careerOutcomeValenceFeedbackTargetRevisionBinding,
    representedFeedback,
    schemaVersion,
    ...unexpected
  } = captured;
  if (Object.keys(unexpected).length !== 0 || schemaVersion !== "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_V1") return fail(code);
  const binding = capture(careerOutcomeValenceFeedbackTargetRevisionBinding, code);
  const {
    careerOutcomeValenceFeedbackTargetRevisionBindingId: _bindingId,
    createdAt: _bindingCreatedAt,
    careerOutcomeValenceFeedbackTargetDeclaration,
    targetCareerDecisionContextRevision,
    schemaVersion: bindingSchema,
    ...bindingUnexpected
  } = binding;
  if (Object.keys(bindingUnexpected).length !== 0 || bindingSchema !== "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_V1") return fail(code);
  const declaration = capture(careerOutcomeValenceFeedbackTargetDeclaration, code);
  const {
    careerOutcomeValenceFeedbackTargetDeclarationId: _declarationId,
    createdAt: _declarationCreatedAt,
    ...declarationBody
  } = declaration;
  if (Object.keys(declarationBody).length === 0) return fail(code);
  return canonical({
    careerOutcomeValenceFeedbackTargetRevisionBinding: {
      careerOutcomeValenceFeedbackTargetDeclaration: declarationBody,
      targetCareerDecisionContextRevision: baseBody(targetCareerDecisionContextRevision, code),
      schemaVersion: bindingSchema,
    },
    representedFeedback,
    schemaVersion,
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
  return canonical({
    careerOutcomeValenceFeedbackReturnRepresentation: representationBody(careerOutcomeValenceFeedbackReturnRepresentation, code),
    schemaVersion,
  }) as Captured;
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
  const members = feedbackReturnItems.map(item => {
    const capturedItem = capture(item, code);
    const id = capturedItem.careerOutcomeValenceFeedbackReturnItemId;
    if (typeof id !== "string") return fail(code);
    return { id, body: itemBody(capturedItem, code) };
  }).sort((left, right) => left.id.localeCompare(right.id)).map(entry => entry.body);
  return canonical({
    baseCareerDecisionContextRevision: baseBody(baseCareerDecisionContextRevision, code),
    feedbackReturnItems: members,
    schemaVersion,
  }) as Captured;
}

function transitionBody(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  const {
    careerOutcomeValenceFeedbackContextTransitionId: _transitionId,
    createdAt: _createdAt,
    baseCareerDecisionContextRevision,
    previousFeedbackContextContent,
    addedFeedbackReturnItem,
    resultingFeedbackContextContent,
    schemaVersion,
    ...unexpected
  } = captured;
  if (Object.keys(unexpected).length !== 0 || schemaVersion !== "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_V1") return fail(code);
  return canonical({
    baseCareerDecisionContextRevision: baseBody(baseCareerDecisionContextRevision, code),
    previousFeedbackContextContent: previousFeedbackContextContent === null ? "FIRST_TRANSITION_FROM_BASE" : contentBody(previousFeedbackContextContent, code),
    addedFeedbackReturnItem: itemBody(addedFeedbackReturnItem, code),
    resultingFeedbackContextContent: contentBody(resultingFeedbackContextContent, code),
    schemaVersion,
  }) as Captured;
}

function completeTransition(value: unknown, code: string): CareerOutcomeValenceFeedbackContextTransition {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackContextTransition;
    assertCareerOutcomeValenceFeedbackContextTransition(result);
    return result;
  } catch { return fail(code); }
}

function completeContent(value: unknown, code: string): CareerOutcomeValenceFeedbackContextContent {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackContextContent;
    assertCareerOutcomeValenceFeedbackContextContent(result);
    return result;
  } catch { return fail(code); }
}

function sameBase(left: CareerDecisionContextRevision, right: CareerDecisionContextRevision): boolean {
  return left.careerDecisionContextRevisionId === right.careerDecisionContextRevisionId &&
    stable(baseBody(left, invalid)) === stable(baseBody(right, invalid));
}

function sameContent(left: CareerOutcomeValenceFeedbackContextContent, right: CareerOutcomeValenceFeedbackContextContent): boolean {
  return left.careerOutcomeValenceFeedbackContextContentId === right.careerOutcomeValenceFeedbackContextContentId &&
    stable(contentBody(left, invalid)) === stable(contentBody(right, invalid));
}

function parentBody(value: unknown, code: string): Captured {
  const parent = capture(value, code);
  if (parent.parentRevisionKind === "CAREER_DECISION_CONTEXT_REVISION") {
    const exactParent = exact(parent, firstParentKeys, code);
    if (typeof exactParent.parentRevisionId !== "string") return fail(code);
    return canonical(exactParent) as Captured;
  }
  if (parent.parentRevisionKind === "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION") {
    const exactParent = exact(parent, subsequentParentKeys, code);
    if (typeof exactParent.parentRevisionId !== "string") return fail(code);
    return canonical({
      parentRevisionKind: exactParent.parentRevisionKind,
      parentRevisionId: exactParent.parentRevisionId,
      parentFeedbackContextContent: contentBody(exactParent.parentFeedbackContextContent, code),
    }) as Captured;
  }
  return fail(code);
}

function completeParent(value: unknown, code: string): CareerOutcomeValenceFeedbackContextParent {
  const parent = capture(value, code);
  if (parent.parentRevisionKind === "CAREER_DECISION_CONTEXT_REVISION") {
    const exactParent = exact(parent, firstParentKeys, code);
    if (typeof exactParent.parentRevisionId !== "string" || !dctxId.test(exactParent.parentRevisionId)) return fail(code);
    return {
      parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION",
      parentRevisionId: exactParent.parentRevisionId,
    };
  }
  if (parent.parentRevisionKind === "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION") {
    const exactParent = exact(parent, subsequentParentKeys, code);
    if (typeof exactParent.parentRevisionId !== "string" || !covfcrId.test(exactParent.parentRevisionId)) return fail(code);
    return {
      parentRevisionKind: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION",
      parentRevisionId: exactParent.parentRevisionId,
      parentFeedbackContextContent: completeContent(exactParent.parentFeedbackContextContent, code),
    };
  }
  return fail(code);
}

function assertCompatibility(
  parent: CareerOutcomeValenceFeedbackContextParent,
  transition: CareerOutcomeValenceFeedbackContextTransition,
): void {
  if (transition.previousFeedbackContextContent === null) {
    if (parent.parentRevisionKind !== "CAREER_DECISION_CONTEXT_REVISION") fail(parentModeMismatch);
    if (parent.parentRevisionId !== transition.baseCareerDecisionContextRevision.careerDecisionContextRevisionId) fail(baseMismatch);
    return;
  }
  if (parent.parentRevisionKind !== "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION") fail(parentModeMismatch);
  if (!sameContent(parent.parentFeedbackContextContent, transition.previousFeedbackContextContent)) fail(parentContentMismatch);
  if (!sameBase(parent.parentFeedbackContextContent.baseCareerDecisionContextRevision, transition.baseCareerDecisionContextRevision)) fail(baseMismatch);
}

function semanticBody(value: unknown, code: string): CareerOutcomeValenceFeedbackContextRevisionSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION) return fail(code);
  return {
    parent: parentBody(result.parent, code),
    careerOutcomeValenceFeedbackContextTransition: transitionBody(result.careerOutcomeValenceFeedbackContextTransition, code),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  parent: CareerOutcomeValenceFeedbackContextParent,
  transition: CareerOutcomeValenceFeedbackContextTransition,
): CareerOutcomeValenceFeedbackContextRevisionSemanticBody {
  return {
    parent: parentBody(parent, invalid),
    careerOutcomeValenceFeedbackContextTransition: transitionBody(transition, invalid),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION,
  };
}

function deriveId(body: CareerOutcomeValenceFeedbackContextRevisionSemanticBody): string {
  const identity = [
    CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION,
    canonical(body.parent),
    canonical(body.careerOutcomeValenceFeedbackContextTransition),
  ];
  return `COVFCR_${createHash("sha256").update(stable(identity), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

function input(value: unknown): CareerOutcomeValenceFeedbackContextRevisionInput {
  const result = exact(value, inputKeys, invalid);
  if (!timestamp(result.createdAt)) return fail(invalid);
  return { createdAt: result.createdAt as string };
}

export function stableCareerOutcomeValenceFeedbackContextRevision(value: unknown): string {
  return stable(value);
}

export function deriveCareerOutcomeValenceFeedbackContextRevisionId(
  value: CareerOutcomeValenceFeedbackContextRevisionSemanticBody,
): string {
  return deriveId(semanticBody(value, invalid));
}

export function createCareerOutcomeValenceFeedbackContextRevision(
  parentValue: CareerOutcomeValenceFeedbackContextParent,
  transitionValue: CareerOutcomeValenceFeedbackContextTransition,
  inputValue: CareerOutcomeValenceFeedbackContextRevisionInput,
): CareerOutcomeValenceFeedbackContextRevision {
  const transition = completeTransition(transitionValue, transitionInvalid);
  const parent = completeParent(parentValue, parentInvalid);
  assertCompatibility(parent, transition);
  const capturedInput = input(inputValue);
  const id = deriveId(semanticFromComplete(parent, transition));
  if (parent.parentRevisionKind === "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION" && id === parent.parentRevisionId) fail(selfParent);
  const result: CareerOutcomeValenceFeedbackContextRevision = {
    careerOutcomeValenceFeedbackContextRevisionId: id,
    parent,
    careerOutcomeValenceFeedbackContextTransition: transition,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION,
    createdAt: capturedInput.createdAt,
  };
  assertCareerOutcomeValenceFeedbackContextRevision(result);
  return structuredClone(result);
}

export function assertCareerOutcomeValenceFeedbackContextRevision(
  value: unknown,
): asserts value is CareerOutcomeValenceFeedbackContextRevision {
  try {
    const result = exact(value, rootKeys, invalid);
    if (
      result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION ||
      typeof result.careerOutcomeValenceFeedbackContextRevisionId !== "string" ||
      !revisionId.test(result.careerOutcomeValenceFeedbackContextRevisionId) ||
      !timestamp(result.createdAt)
    ) return fail(invalid);
    const transition = completeTransition(result.careerOutcomeValenceFeedbackContextTransition, invalid);
    const parent = completeParent(result.parent, invalid);
    assertCompatibility(parent, transition);
    const expected = deriveId(semanticFromComplete(parent, transition));
    if (parent.parentRevisionKind === "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION" && expected === parent.parentRevisionId) fail(selfParent);
    if (result.careerOutcomeValenceFeedbackContextRevisionId !== expected) fail(idMismatch);
  } catch (error) {
    if (error instanceof Error && [parentModeMismatch, parentContentMismatch, baseMismatch, selfParent, idMismatch].includes(error.message)) throw error;
    return fail(invalid);
  }
}
