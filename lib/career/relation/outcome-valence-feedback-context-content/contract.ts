import { createHash } from "node:crypto";
import {
  assertCareerDecisionContextRevision,
  deriveCareerDecisionContextRevisionId,
  type CareerDecisionContextRevision,
} from "../decision-context";
import {
  assertCareerOutcomeValenceFeedbackReturnItem,
  deriveCareerOutcomeValenceFeedbackReturnItemId,
  type CareerOutcomeValenceFeedbackReturnItem,
  type CareerOutcomeValenceFeedbackReturnItemSemanticBody,
} from "../outcome-valence-feedback-return-item";
import {
  CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION,
  type CareerOutcomeValenceFeedbackContextContent,
  type CareerOutcomeValenceFeedbackContextContentInput,
  type CareerOutcomeValenceFeedbackContextContentSemanticBody,
} from "./types";

type Captured = Record<string, unknown>;

const fail = (code: string): never => { throw new Error(code); };
const baseInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_BASE_INVALID";
const memberInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_MEMBER_INVALID";
const baseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_BASE_MISMATCH";
const duplicateMember = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_DUPLICATE_MEMBER";
const emptyMemberInventory = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_EMPTY_MEMBER_INVENTORY";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_ID_MISMATCH";

const artifactKeys = [
  "careerOutcomeValenceFeedbackContextContentId",
  "baseCareerDecisionContextRevision",
  "feedbackReturnItems",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = [
  "baseCareerDecisionContextRevision",
  "feedbackReturnItems",
  "schemaVersion",
] as const;
const inputKeys = ["createdAt"] as const;
const baseArtifactKeys = [
  "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId",
  "recommendationProposalId",
  "decisionSubjects",
  "contextEvidenceRefs",
  "authorityScope",
  "permittedDecisionClasses",
  "permittedSubjectKinds",
  "schemaVersion",
  "createdAt",
] as const;
const baseSemanticKeys = baseArtifactKeys.filter(key =>
  key !== "careerDecisionContextRevisionId" && key !== "createdAt",
);
const itemIdPattern = /^COVFRI_[0-9A-F]{32}$/;
const contentIdPattern = /^COVFCC_[0-9A-F]{32}$/;

function capture(value: unknown, code: string): Captured {
  try {
    const result = structuredClone(value);
    if (result === null || Array.isArray(result) || typeof result !== "object") return fail(code);
    return result as Captured;
  } catch {
    return fail(code);
  }
}

function exact(value: unknown, keys: readonly string[], code: string): Captured {
  const result = capture(value, code);
  const actual = Object.keys(result);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(result, key))) {
    return fail(code);
  }
  return result;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Captured).sort().map(key => [
      key,
      canonical((value as Captured)[key]),
    ]));
  }
  return value;
}

function removeAuditTimes(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeAuditTimes);
  if (value !== null && typeof value === "object") {
    const result: Captured = {};
    for (const key of Object.keys(value as Captured)) {
      if (key !== "createdAt") result[key] = removeAuditTimes((value as Captured)[key]);
    }
    return result;
  }
  return value;
}

function completeBase(value: unknown, code: string): CareerDecisionContextRevision {
  try {
    const result = capture(value, code) as unknown as CareerDecisionContextRevision;
    assertCareerDecisionContextRevision(result);
    return result;
  } catch {
    return fail(code);
  }
}

function baseSemanticFromComplete(value: CareerDecisionContextRevision): Captured {
  const {
    careerDecisionContextRevisionId: _revisionId,
    createdAt: _createdAt,
    ...body
  } = value;
  return canonical(removeAuditTimes(body)) as Captured;
}

function baseSemantic(value: unknown, code: string): Captured {
  const captured = capture(value, code);
  if (Object.keys(captured).length === baseArtifactKeys.length && baseArtifactKeys.every(key => key in captured)) {
    return baseSemanticFromComplete(completeBase(captured, code));
  }
  const {
    careerDecisionContextRevisionId: _revisionId,
    createdAt: _createdAt,
    ...body
  } = captured;
  const semantic = exact(body, baseSemanticKeys, code);
  try {
    deriveCareerDecisionContextRevisionId(semantic as never);
  } catch {
    return fail(code);
  }
  return canonical(removeAuditTimes(semantic)) as Captured;
}

function canonicalRepresentationSemanticBody(value: Captured, code: string): Captured {
  const result = removeAuditTimes(value) as Captured;
  const {
    careerOutcomeValenceFeedbackReturnRepresentationId: _representationId,
    careerOutcomeValenceFeedbackTargetRevisionBinding,
    ...representationBody
  } = result;
  const binding = capture(careerOutcomeValenceFeedbackTargetRevisionBinding, code);
  const {
    careerOutcomeValenceFeedbackTargetRevisionBindingId: _bindingId,
    careerOutcomeValenceFeedbackTargetDeclaration,
    targetCareerDecisionContextRevision,
    ...bindingBody
  } = binding;
  const declaration = capture(careerOutcomeValenceFeedbackTargetDeclaration, code);
  const {
    careerOutcomeValenceFeedbackTargetDeclarationId: _declarationId,
    ...declarationBody
  } = declaration;
  const target = capture(targetCareerDecisionContextRevision, code);
  const {
    careerDecisionContextRevisionId: _targetRevisionId,
    ...targetBody
  } = target;
  return canonical({
    ...representationBody,
    careerOutcomeValenceFeedbackTargetRevisionBinding: {
      ...bindingBody,
      careerOutcomeValenceFeedbackTargetDeclaration: declarationBody,
      targetCareerDecisionContextRevision: targetBody,
    },
  }) as Captured;
}

function itemSemantic(value: unknown, code: string): CareerOutcomeValenceFeedbackReturnItemSemanticBody {
  const captured = capture(value, code);
  const {
    careerOutcomeValenceFeedbackReturnItemId: _itemId,
    createdAt: _createdAt,
    careerOutcomeValenceFeedbackReturnRepresentation,
    schemaVersion,
    ...unexpected
  } = captured;
  if (Object.keys(unexpected).length !== 0 || schemaVersion !== "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_V1") {
    return fail(code);
  }
  const source = {
    careerOutcomeValenceFeedbackReturnRepresentation,
    schemaVersion,
  };
  try {
    deriveCareerOutcomeValenceFeedbackReturnItemId(source as never);
  } catch {
    return fail(code);
  }
  return {
    careerOutcomeValenceFeedbackReturnRepresentation:
      canonicalRepresentationSemanticBody(capture(careerOutcomeValenceFeedbackReturnRepresentation, code), code) as never,
    schemaVersion: "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_V1",
  };
}

function completeItem(value: unknown, code: string): CareerOutcomeValenceFeedbackReturnItem {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackReturnItem;
    assertCareerOutcomeValenceFeedbackReturnItem(result);
    return result;
  } catch {
    return fail(code);
  }
}

function itemSemanticFromComplete(value: CareerOutcomeValenceFeedbackReturnItem): CareerOutcomeValenceFeedbackReturnItemSemanticBody {
  return itemSemantic(value, invalid);
}

function targetFromItem(value: CareerOutcomeValenceFeedbackReturnItem): CareerDecisionContextRevision {
  return value.careerOutcomeValenceFeedbackReturnRepresentation
    .careerOutcomeValenceFeedbackTargetRevisionBinding.targetCareerDecisionContextRevision;
}

function assertBaseMatch(
  base: CareerDecisionContextRevision,
  member: CareerOutcomeValenceFeedbackReturnItem,
): void {
  const target = targetFromItem(member);
  if (target.careerDecisionContextRevisionId !== base.careerDecisionContextRevisionId) fail(baseMismatch);
  if (stableCareerOutcomeValenceFeedbackContextContent(baseSemanticFromComplete(target)) !==
      stableCareerOutcomeValenceFeedbackContextContent(baseSemanticFromComplete(base))) fail(baseMismatch);
}

function inventory(
  value: unknown,
  memberCode: string,
  canonicalRequired: boolean,
): CareerOutcomeValenceFeedbackReturnItem[] {
  if (!Array.isArray(value)) return fail(memberCode);
  if (value.length === 0) return fail(emptyMemberInventory);
  const captured = value.map(member => completeItem(member, memberCode));
  const ids = captured.map(member => member.careerOutcomeValenceFeedbackReturnItemId);
  if (new Set(ids).size !== ids.length) return fail(duplicateMember);
  const sorted = [...captured].sort((left, right) =>
    left.careerOutcomeValenceFeedbackReturnItemId.localeCompare(right.careerOutcomeValenceFeedbackReturnItemId),
  );
  if (canonicalRequired && JSON.stringify(ids) !== JSON.stringify(sorted.map(item =>
    item.careerOutcomeValenceFeedbackReturnItemId,
  ))) return fail(invalid);
  return sorted;
}

function input(value: unknown): CareerOutcomeValenceFeedbackContextContentInput {
  const result = exact(value, inputKeys, invalid);
  if (!timestamp(result.createdAt)) return fail(invalid);
  return { createdAt: result.createdAt as string };
}

function semanticBody(value: unknown, code: string): CareerOutcomeValenceFeedbackContextContentSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION) return fail(code);
  if (!Array.isArray(result.feedbackReturnItems) || result.feedbackReturnItems.length === 0) return fail(code);
  const entries = result.feedbackReturnItems.map(item => {
    const captured = capture(item, code);
    const body = itemSemantic(captured, code);
    let identity: string;
    try {
      identity = deriveCareerOutcomeValenceFeedbackReturnItemId({
        careerOutcomeValenceFeedbackReturnRepresentation:
          captured.careerOutcomeValenceFeedbackReturnRepresentation,
        schemaVersion: captured.schemaVersion,
      } as never);
    } catch {
      return fail(code);
    }
    return { body, identity };
  });
  if (new Set(entries.map(entry => entry.identity)).size !== entries.length) return fail(code);
  entries.sort((left, right) => left.identity.localeCompare(right.identity));
  return {
    baseCareerDecisionContextRevision: baseSemantic(result.baseCareerDecisionContextRevision, code),
    feedbackReturnItems: entries.map(entry => entry.body),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  base: CareerDecisionContextRevision,
  members: readonly CareerOutcomeValenceFeedbackReturnItem[],
): CareerOutcomeValenceFeedbackContextContentSemanticBody {
  return {
    baseCareerDecisionContextRevision: baseSemanticFromComplete(base),
    feedbackReturnItems: members.map(itemSemanticFromComplete),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION,
  };
}

export function stableCareerOutcomeValenceFeedbackContextContent(value: unknown): string {
  try {
    return JSON.stringify(canonical(structuredClone(value)));
  } catch {
    return fail(invalid);
  }
}

function deriveIdFromSemanticBody(body: CareerOutcomeValenceFeedbackContextContentSemanticBody): string {
  const identity = [
    CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION,
    canonical(body.baseCareerDecisionContextRevision),
    canonical(body.feedbackReturnItems),
  ];
  return `COVFCC_${createHash("sha256").update(
    stableCareerOutcomeValenceFeedbackContextContent(identity),
    "utf8",
  ).digest("hex").slice(0, 32).toUpperCase()}`;
}

export function deriveCareerOutcomeValenceFeedbackContextContentId(
  value: CareerOutcomeValenceFeedbackContextContentSemanticBody,
): string {
  return deriveIdFromSemanticBody(semanticBody(value, invalid));
}

export function createCareerOutcomeValenceFeedbackContextContent(
  baseValue: CareerDecisionContextRevision,
  membersValue: readonly CareerOutcomeValenceFeedbackReturnItem[],
  inputValue: CareerOutcomeValenceFeedbackContextContentInput,
): CareerOutcomeValenceFeedbackContextContent {
  const base = completeBase(baseValue, baseInvalid);
  const members = inventory(membersValue, memberInvalid, false);
  for (const member of members) assertBaseMatch(base, member);
  const capturedInput = input(inputValue);
  const result: CareerOutcomeValenceFeedbackContextContent = {
    careerOutcomeValenceFeedbackContextContentId: deriveIdFromSemanticBody(semanticFromComplete(base, members)),
    baseCareerDecisionContextRevision: base,
    feedbackReturnItems: members,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION,
    createdAt: capturedInput.createdAt,
  };
  assertCareerOutcomeValenceFeedbackContextContent(result);
  return structuredClone(result);
}

export function assertCareerOutcomeValenceFeedbackContextContent(
  value: unknown,
): asserts value is CareerOutcomeValenceFeedbackContextContent {
  try {
    const result = exact(value, artifactKeys, invalid);
    if (
      result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION ||
      typeof result.careerOutcomeValenceFeedbackContextContentId !== "string" ||
      !contentIdPattern.test(result.careerOutcomeValenceFeedbackContextContentId) ||
      !timestamp(result.createdAt)
    ) return fail(invalid);
    const base = completeBase(result.baseCareerDecisionContextRevision, invalid);
    const members = inventory(result.feedbackReturnItems, invalid, true);
    for (const member of members) assertBaseMatch(base, member);
    const expectedId = deriveIdFromSemanticBody(semanticFromComplete(base, members));
    if (result.careerOutcomeValenceFeedbackContextContentId !== expectedId) fail(idMismatch);
  } catch (error) {
    if (error instanceof Error && [
      idMismatch,
      baseMismatch,
      duplicateMember,
      emptyMemberInventory,
    ].includes(error.message)) throw error;
    return fail(invalid);
  }
}
