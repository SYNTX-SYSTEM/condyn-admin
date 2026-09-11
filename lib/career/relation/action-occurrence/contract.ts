import { createHash } from "node:crypto";
import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import {
  type CareerExecutionAuthorityScope,
  type CareerExecutionChannelKind,
  type CareerExecutionTargetKind,
} from "../execution-authority-grant";
import {
  assertCareerExecutionContextRevision,
  type CareerExecutionContextRevision,
} from "../execution-context-revision";
import {
  CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION,
  type CareerActionOccurrence,
  type CareerActionOccurrenceInput,
} from "./types";

const fail = (): never => { throw new Error("ERR_CAREER_ACTION_OCCURRENCE_INVALID"); };
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();
const canonicalTimestamp = (value: unknown): value is string =>
  canonicalText(value) && Number.isFinite(new Date(value).getTime()) &&
  new Date(value).toISOString() === value;

const artifactKeys = [
  "careerActionOccurrenceId", "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
  "careerDecisionActionIntentId", "humanDecisionRecordId",
  "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
  "recommendationProposalId", "performedByActorId", "decisionSubjects",
  "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
  "executionAuthorityScope", "executionTarget", "executionChannel", "occurredAt",
  "occurrenceEvidenceRefs", "externalOccurrenceRef", "schemaVersion", "createdAt",
] as const;
const semanticKeys = artifactKeys.filter(key =>
  key !== "careerActionOccurrenceId" && key !== "createdAt",
);
const inputKeys = [
  "careerExecutionContextRevisionId", "performedByActorId", "occurredAt",
  "occurrenceEvidenceRefs", "externalOccurrenceRef", "createdAt",
] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const targetKeys = ["targetKind", "targetRef"] as const;
const channelKeys = ["channelKind", "channelRef"] as const;

const aoc = /^AOC_[0-9A-F]{32}$/;
const ectx = /^ECTXREV_[0-9A-F]{32}$/;
const eagr = /^EAGR_[0-9A-F]{32}$/;
const hcom = /^HCOM_[0-9A-F]{32}$/;
const daint = /^DAINT_[0-9A-F]{32}$/;
const dcr = /^DCR_[0-9A-F]{32}$/;
const dctx = /^DCTXREV_[0-9A-F]{32}$/;
const dar = /^DAR_[0-9A-F]{32}$/;
const rcp = /^RCP_[0-9A-F]{32}$/;
const declarationClasses = [
  "ACCEPT_RECOMMENDATION", "REJECT_RECOMMENDATION", "DEFER_DECISION",
  "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION",
] as const;
const actionClasses = [
  "RECOMMENDATION_OPERATIONALIZATION",
  "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION",
  "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION",
] as const;
const scopes = [
  "RECOMMENDATION_OPERATION_EXECUTION",
  "FURTHER_EVIDENCE_REQUEST_EXECUTION",
  "TARGET_CLARIFICATION_REQUEST_EXECUTION",
] as const;
const targetKinds = [
  "PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT",
] as const;
const channelKinds = ["EMAIL", "MESSAGE", "API", "DOCUMENT", "HUMAN_HANDOFF"] as const;

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const actual = Object.keys(value as Record<string, unknown>);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(value, key))) fail();
  return value as Record<string, unknown>;
}

function subjectKey(subject: DecisionSubjectReference): string {
  return `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
}

function subjects(value: unknown, canonicalRequired: boolean): DecisionSubjectReference[] {
  if (!Array.isArray(value) || value.length === 0) fail();
  const captured = value.map(item => {
    const subject = exactObject(item, subjectKeys);
    if (
      !rcp.test(subject.recommendationProposalId as string) ||
      !Number.isSafeInteger(subject.sourceEvolutionInputItemOrdinal) ||
      (subject.sourceEvolutionInputItemOrdinal as number) < 0
    ) fail();
    return {
      recommendationProposalId: subject.recommendationProposalId as string,
      sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal as number,
    };
  });
  if (new Set(captured.map(subjectKey)).size !== captured.length) fail();
  const canonical = [...captured].sort((left, right) => compare(subjectKey(left), subjectKey(right)));
  if (canonicalRequired && JSON.stringify(captured) !== JSON.stringify(canonical)) fail();
  return captured;
}

function evidence(value: unknown, normalize: boolean, canonicalRequired: boolean): string[] {
  if (!Array.isArray(value) || value.length === 0) fail();
  const captured = value.map(item => {
    if (typeof item !== "string" || item.trim().length === 0) fail();
    return normalize ? item.trim() : item;
  });
  if (captured.some(item => !canonicalText(item)) || new Set(captured).size !== captured.length) fail();
  const canonical = [...captured].sort(compare);
  if (canonicalRequired && JSON.stringify(captured) !== JSON.stringify(canonical)) fail();
  return normalize ? canonical : captured;
}

function target(value: unknown): { targetKind: CareerExecutionTargetKind; targetRef: string } {
  const captured = exactObject(value, targetKeys);
  if (
    !targetKinds.includes(captured.targetKind as CareerExecutionTargetKind) ||
    !canonicalText(captured.targetRef)
  ) fail();
  return {
    targetKind: captured.targetKind as CareerExecutionTargetKind,
    targetRef: captured.targetRef as string,
  };
}

function channel(value: unknown): { channelKind: CareerExecutionChannelKind; channelRef: string } {
  const captured = exactObject(value, channelKeys);
  if (
    !channelKinds.includes(captured.channelKind as CareerExecutionChannelKind) ||
    !canonicalText(captured.channelRef)
  ) fail();
  return {
    channelKind: captured.channelKind as CareerExecutionChannelKind,
    channelRef: captured.channelRef as string,
  };
}

function externalReference(value: unknown, normalize: boolean): string | null {
  if (value === null) return null;
  if (typeof value !== "string") fail();
  const captured = normalize ? value.trim() : value;
  if (!canonicalText(captured)) fail();
  return captured;
}

function semantic(
  value: Record<string, unknown>,
  normalizeEvidence: boolean,
  canonicalEvidenceRequired: boolean,
) {
  const performedByActorId = value.performedByActorId;
  const operationDescription = value.operationDescription;
  if (
    !ectx.test(value.careerExecutionContextRevisionId as string) ||
    !eagr.test(value.careerExecutionAuthorityGrantRevisionId as string) ||
    !hcom.test(value.careerHumanCommitmentId as string) ||
    !daint.test(value.careerDecisionActionIntentId as string) ||
    !dcr.test(value.humanDecisionRecordId as string) ||
    !dctx.test(value.careerDecisionContextRevisionId as string) ||
    !dar.test(value.decisionAuthorityGrantRevisionId as string) ||
    !rcp.test(value.recommendationProposalId as string) ||
    !canonicalText(performedByActorId) ||
    !canonicalText(operationDescription) ||
    !declarationClasses.includes(value.sourceDeclarationClass as HumanDecisionDeclarationClass) ||
    !actionClasses.includes(value.sourceActionIntentClass as CareerDecisionActionIntentClass) ||
    !scopes.includes(value.executionAuthorityScope as CareerExecutionAuthorityScope) ||
    !canonicalTimestamp(value.occurredAt) ||
    value.schemaVersion !== CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION
  ) fail();
  return {
    careerExecutionContextRevisionId: value.careerExecutionContextRevisionId as string,
    careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId as string,
    careerHumanCommitmentId: value.careerHumanCommitmentId as string,
    careerDecisionActionIntentId: value.careerDecisionActionIntentId as string,
    humanDecisionRecordId: value.humanDecisionRecordId as string,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId as string,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId as string,
    recommendationProposalId: value.recommendationProposalId as string,
    performedByActorId: performedByActorId as string,
    decisionSubjects: subjects(value.decisionSubjects, canonicalEvidenceRequired),
    sourceDeclarationClass: value.sourceDeclarationClass as HumanDecisionDeclarationClass,
    sourceActionIntentClass: value.sourceActionIntentClass as CareerDecisionActionIntentClass,
    operationDescription: operationDescription as string,
    executionAuthorityScope: value.executionAuthorityScope as CareerExecutionAuthorityScope,
    executionTarget: target(value.executionTarget),
    executionChannel: channel(value.executionChannel),
    occurredAt: value.occurredAt as string,
    occurrenceEvidenceRefs: evidence(value.occurrenceEvidenceRefs, normalizeEvidence, canonicalEvidenceRequired),
    externalOccurrenceRef: externalReference(value.externalOccurrenceRef, false),
    schemaVersion: CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION,
  };
}

export function stableCareerActionOccurrence(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare)
        .map(key => [key, (item as Record<string, unknown>)[key]]))
      : item,
  );
}

export function deriveCareerActionOccurrenceId(
  value: Omit<CareerActionOccurrence, "careerActionOccurrenceId" | "createdAt">,
): string {
  const canonical = semantic(exactObject(value, semanticKeys), false, false);
  const payload = [
    CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION,
    canonical.careerExecutionContextRevisionId,
    canonical.careerExecutionAuthorityGrantRevisionId,
    canonical.careerHumanCommitmentId,
    canonical.careerDecisionActionIntentId,
    canonical.humanDecisionRecordId,
    canonical.careerDecisionContextRevisionId,
    canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId,
    canonical.performedByActorId,
    canonical.decisionSubjects,
    canonical.sourceDeclarationClass,
    canonical.sourceActionIntentClass,
    canonical.operationDescription,
    canonical.executionAuthorityScope,
    canonical.executionTarget,
    canonical.executionChannel,
    canonical.occurredAt,
    canonical.occurrenceEvidenceRefs,
    canonical.externalOccurrenceRef,
    canonical.schemaVersion,
  ];
  return `AOC_${createHash("sha256")
    .update(stableCareerActionOccurrence(payload), "utf8")
    .digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerActionOccurrence(
  value: unknown,
): asserts value is CareerActionOccurrence {
  const captured = exactObject(value, artifactKeys);
  if (!aoc.test(captured.careerActionOccurrenceId as string) || !canonicalTimestamp(captured.createdAt)) fail();
  const canonical = semantic(captured, false, true);
  if (captured.careerActionOccurrenceId !== deriveCareerActionOccurrenceId(canonical)) fail();
}

/**
 * AOC records a context-bound occurrence declaration, not external proof.
 * EAGR occurrence-time applicability is intentionally deferred to persistence/replay.
 */
export function createCareerActionOccurrence(
  context: CareerExecutionContextRevision,
  input: CareerActionOccurrenceInput,
): CareerActionOccurrence {
  try {
    assertCareerExecutionContextRevision(context);
  } catch {
    fail();
  }
  const captured = exactObject(input, inputKeys);
  if (
    captured.careerExecutionContextRevisionId !== context.careerExecutionContextRevisionId ||
    !canonicalTimestamp(captured.occurredAt) ||
    !canonicalTimestamp(captured.createdAt)
  ) fail();
  const performedByActorId = typeof captured.performedByActorId === "string"
    ? captured.performedByActorId.trim()
    : fail();
  if (
    !canonicalText(performedByActorId) ||
    performedByActorId !== context.declaredByActorId ||
    (captured.occurredAt as string) < context.declaredAt
  ) fail();
  const occurrenceEvidenceRefs = evidence(captured.occurrenceEvidenceRefs, true, false);
  const externalOccurrenceRef = externalReference(captured.externalOccurrenceRef, true);
  const canonical = semantic({
    careerExecutionContextRevisionId: context.careerExecutionContextRevisionId,
    careerExecutionAuthorityGrantRevisionId: context.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: context.careerHumanCommitmentId,
    careerDecisionActionIntentId: context.careerDecisionActionIntentId,
    humanDecisionRecordId: context.humanDecisionRecordId,
    careerDecisionContextRevisionId: context.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: context.decisionAuthorityGrantRevisionId,
    recommendationProposalId: context.recommendationProposalId,
    performedByActorId,
    decisionSubjects: context.decisionSubjects,
    sourceDeclarationClass: context.sourceDeclarationClass,
    sourceActionIntentClass: context.sourceActionIntentClass,
    operationDescription: context.operationDescription,
    executionAuthorityScope: context.executionAuthorityScope,
    executionTarget: structuredClone(context.executionTarget),
    executionChannel: structuredClone(context.executionChannel),
    occurredAt: captured.occurredAt,
    occurrenceEvidenceRefs,
    externalOccurrenceRef,
    schemaVersion: CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION,
  }, false, true);
  const artifact: CareerActionOccurrence = {
    careerActionOccurrenceId: deriveCareerActionOccurrenceId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerActionOccurrence(artifact);
  return structuredClone(artifact);
}
