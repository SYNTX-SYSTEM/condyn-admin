import { createHash } from "node:crypto";
import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";
import {
  assertCareerStateChangeDeclaration,
  type CareerStateChangeDeclaration,
  type CareerStateObservation,
  type CareerStateSubjectKind,
} from "../state-change-declaration";
import {
  CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_SCHEMA_VERSION,
  type CareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclarationInput,
} from "./types";

const fail = (): never => { throw new Error("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_INVALID"); };
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();
const canonicalTimestamp = (value: unknown): value is string =>
  canonicalText(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;

const artifactKeys = [
  "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId", "careerActionOccurrenceId",
  "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
  "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId", "recommendationProposalId", "performedByActorId", "observedByActorId",
  "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
  "executionAuthorityScope", "executionTarget", "executionChannel", "actionOccurredAt", "stateSubject",
  "stateDimension", "beforeObservation", "afterObservation", "observedAt", "declaredByActorId", "declaredAt",
  "associationEvidenceRefs", "schemaVersion", "createdAt",
] as const;
const semanticKeys = artifactKeys.filter(key =>
  key !== "careerActionStateChangeAssociationDeclarationId" && key !== "createdAt",
);
const inputKeys = [
  "careerStateChangeDeclarationId", "declaredByActorId", "declaredAt", "associationEvidenceRefs", "createdAt",
] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const targetKeys = ["targetKind", "targetRef"] as const;
const channelKeys = ["channelKind", "channelRef"] as const;
const stateSubjectKeys = ["subjectKind", "subjectRef"] as const;
const observationKeys = ["observationState", "value"] as const;

const ascad = /^ASCAD_[0-9A-F]{32}$/;
const scd = /^SCD_[0-9A-F]{32}$/;
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
  "RECOMMENDATION_OPERATIONALIZATION", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION",
  "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION",
] as const;
const scopes = [
  "RECOMMENDATION_OPERATION_EXECUTION", "FURTHER_EVIDENCE_REQUEST_EXECUTION",
  "TARGET_CLARIFICATION_REQUEST_EXECUTION",
] as const;
const targetKinds = ["PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT"] as const;
const channelKinds = ["EMAIL", "MESSAGE", "API", "DOCUMENT", "HUMAN_HANDOFF"] as const;
const stateSubjectKinds = [
  "PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT", "EXTERNAL_RESOURCE",
] as const;

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
    if (!rcp.test(subject.recommendationProposalId as string) || !Number.isSafeInteger(subject.sourceEvolutionInputItemOrdinal) || (subject.sourceEvolutionInputItemOrdinal as number) < 0) fail();
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

function inventory(value: unknown, normalize: boolean, canonicalRequired: boolean): string[] {
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

function executionTarget(value: unknown) {
  const captured = exactObject(value, targetKeys);
  if (!targetKinds.includes(captured.targetKind as CareerExecutionTargetKind) || !canonicalText(captured.targetRef)) fail();
  return { targetKind: captured.targetKind as CareerExecutionTargetKind, targetRef: captured.targetRef as string };
}

function executionChannel(value: unknown) {
  const captured = exactObject(value, channelKeys);
  if (!channelKinds.includes(captured.channelKind as CareerExecutionChannelKind) || !canonicalText(captured.channelRef)) fail();
  return { channelKind: captured.channelKind as CareerExecutionChannelKind, channelRef: captured.channelRef as string };
}

function stateSubject(value: unknown) {
  const captured = exactObject(value, stateSubjectKeys);
  if (!stateSubjectKinds.includes(captured.subjectKind as CareerStateSubjectKind) || !canonicalText(captured.subjectRef)) fail();
  return { subjectKind: captured.subjectKind as CareerStateSubjectKind, subjectRef: captured.subjectRef as string };
}

function observation(value: unknown): CareerStateObservation {
  const captured = exactObject(value, observationKeys);
  if (captured.observationState !== "OBSERVED" || !canonicalText(captured.value)) fail();
  return { observationState: "OBSERVED", value: captured.value as string };
}

function semantic(value: Record<string, unknown>, canonicalRequired: boolean, enforceChronology: boolean) {
  if (
    !scd.test(value.careerStateChangeDeclarationId as string) ||
    !aoc.test(value.careerActionOccurrenceId as string) ||
    !ectx.test(value.careerExecutionContextRevisionId as string) ||
    !eagr.test(value.careerExecutionAuthorityGrantRevisionId as string) ||
    !hcom.test(value.careerHumanCommitmentId as string) ||
    !daint.test(value.careerDecisionActionIntentId as string) ||
    !dcr.test(value.humanDecisionRecordId as string) ||
    !dctx.test(value.careerDecisionContextRevisionId as string) ||
    !dar.test(value.decisionAuthorityGrantRevisionId as string) ||
    !rcp.test(value.recommendationProposalId as string) ||
    !canonicalText(value.performedByActorId) || !canonicalText(value.observedByActorId) ||
    !canonicalText(value.operationDescription) || !canonicalText(value.stateDimension) ||
    !canonicalText(value.declaredByActorId) ||
    !declarationClasses.includes(value.sourceDeclarationClass as HumanDecisionDeclarationClass) ||
    !actionClasses.includes(value.sourceActionIntentClass as CareerDecisionActionIntentClass) ||
    !scopes.includes(value.executionAuthorityScope as CareerExecutionAuthorityScope) ||
    !canonicalTimestamp(value.actionOccurredAt) || !canonicalTimestamp(value.observedAt) ||
    !canonicalTimestamp(value.declaredAt) ||
    (enforceChronology && (value.declaredAt as string) < (value.observedAt as string)) ||
    value.schemaVersion !== CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_SCHEMA_VERSION
  ) fail();
  const beforeObservation = observation(value.beforeObservation);
  const afterObservation = observation(value.afterObservation);
  if (beforeObservation.value === afterObservation.value) fail();
  return {
    careerStateChangeDeclarationId: value.careerStateChangeDeclarationId as string,
    careerActionOccurrenceId: value.careerActionOccurrenceId as string,
    careerExecutionContextRevisionId: value.careerExecutionContextRevisionId as string,
    careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId as string,
    careerHumanCommitmentId: value.careerHumanCommitmentId as string,
    careerDecisionActionIntentId: value.careerDecisionActionIntentId as string,
    humanDecisionRecordId: value.humanDecisionRecordId as string,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId as string,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId as string,
    recommendationProposalId: value.recommendationProposalId as string,
    performedByActorId: value.performedByActorId as string,
    observedByActorId: value.observedByActorId as string,
    decisionSubjects: subjects(value.decisionSubjects, canonicalRequired),
    sourceDeclarationClass: value.sourceDeclarationClass as HumanDecisionDeclarationClass,
    sourceActionIntentClass: value.sourceActionIntentClass as CareerDecisionActionIntentClass,
    operationDescription: value.operationDescription as string,
    executionAuthorityScope: value.executionAuthorityScope as CareerExecutionAuthorityScope,
    executionTarget: executionTarget(value.executionTarget),
    executionChannel: executionChannel(value.executionChannel),
    actionOccurredAt: value.actionOccurredAt as string,
    stateSubject: stateSubject(value.stateSubject),
    stateDimension: value.stateDimension as string,
    beforeObservation,
    afterObservation,
    observedAt: value.observedAt as string,
    declaredByActorId: value.declaredByActorId as string,
    declaredAt: value.declaredAt as string,
    associationEvidenceRefs: inventory(value.associationEvidenceRefs, false, canonicalRequired),
    schemaVersion: CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_SCHEMA_VERSION,
  };
}

export function stableCareerActionStateChangeAssociationDeclaration(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
      : item,
  );
}

export function deriveCareerActionStateChangeAssociationDeclarationId(
  value: Omit<CareerActionStateChangeAssociationDeclaration, "careerActionStateChangeAssociationDeclarationId" | "createdAt">,
): string {
  const canonical = semantic(exactObject(value, semanticKeys), false, false);
  const payload = [
    CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_SCHEMA_VERSION,
    canonical.careerStateChangeDeclarationId, canonical.careerActionOccurrenceId,
    canonical.careerExecutionContextRevisionId, canonical.careerExecutionAuthorityGrantRevisionId,
    canonical.careerHumanCommitmentId, canonical.careerDecisionActionIntentId,
    canonical.humanDecisionRecordId, canonical.careerDecisionContextRevisionId,
    canonical.decisionAuthorityGrantRevisionId, canonical.recommendationProposalId,
    canonical.performedByActorId, canonical.observedByActorId, canonical.decisionSubjects,
    canonical.sourceDeclarationClass, canonical.sourceActionIntentClass, canonical.operationDescription,
    canonical.executionAuthorityScope, canonical.executionTarget, canonical.executionChannel,
    canonical.actionOccurredAt, canonical.stateSubject, canonical.stateDimension,
    canonical.beforeObservation, canonical.afterObservation, canonical.observedAt,
    canonical.declaredByActorId, canonical.declaredAt, canonical.associationEvidenceRefs,
    CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_SCHEMA_VERSION,
  ];
  return `ASCAD_${createHash("sha256").update(stableCareerActionStateChangeAssociationDeclaration(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerActionStateChangeAssociationDeclaration(
  value: unknown,
): asserts value is CareerActionStateChangeAssociationDeclaration {
  const captured = exactObject(value, artifactKeys);
  if (!ascad.test(captured.careerActionStateChangeAssociationDeclarationId as string) || !canonicalTimestamp(captured.createdAt)) fail();
  const canonical = semantic(captured, true, true);
  if (captured.careerActionStateChangeAssociationDeclarationId !== deriveCareerActionStateChangeAssociationDeclarationId(canonical)) fail();
}

/** An explicit human association declaration is historical context, not truth, effect, or causal authority. */
export function createCareerActionStateChangeAssociationDeclaration(
  stateChangeDeclaration: CareerStateChangeDeclaration,
  input: CareerActionStateChangeAssociationDeclarationInput,
): CareerActionStateChangeAssociationDeclaration {
  try { assertCareerStateChangeDeclaration(stateChangeDeclaration); } catch { fail(); }
  const captured = exactObject(input, inputKeys);
  if (
    captured.careerStateChangeDeclarationId !== stateChangeDeclaration.careerStateChangeDeclarationId ||
    !canonicalTimestamp(captured.declaredAt) || !canonicalTimestamp(captured.createdAt) ||
    (captured.declaredAt as string) < stateChangeDeclaration.observedAt
  ) fail();
  if (typeof captured.declaredByActorId !== "string") fail();
  const declaredByActorId = captured.declaredByActorId.trim();
  if (!canonicalText(declaredByActorId)) fail();
  const canonical = semantic({
    careerStateChangeDeclarationId: stateChangeDeclaration.careerStateChangeDeclarationId,
    careerActionOccurrenceId: stateChangeDeclaration.careerActionOccurrenceId,
    careerExecutionContextRevisionId: stateChangeDeclaration.careerExecutionContextRevisionId,
    careerExecutionAuthorityGrantRevisionId: stateChangeDeclaration.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: stateChangeDeclaration.careerHumanCommitmentId,
    careerDecisionActionIntentId: stateChangeDeclaration.careerDecisionActionIntentId,
    humanDecisionRecordId: stateChangeDeclaration.humanDecisionRecordId,
    careerDecisionContextRevisionId: stateChangeDeclaration.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: stateChangeDeclaration.decisionAuthorityGrantRevisionId,
    recommendationProposalId: stateChangeDeclaration.recommendationProposalId,
    performedByActorId: stateChangeDeclaration.performedByActorId,
    observedByActorId: stateChangeDeclaration.observedByActorId,
    decisionSubjects: structuredClone(stateChangeDeclaration.decisionSubjects),
    sourceDeclarationClass: stateChangeDeclaration.sourceDeclarationClass,
    sourceActionIntentClass: stateChangeDeclaration.sourceActionIntentClass,
    operationDescription: stateChangeDeclaration.operationDescription,
    executionAuthorityScope: stateChangeDeclaration.executionAuthorityScope,
    executionTarget: structuredClone(stateChangeDeclaration.executionTarget),
    executionChannel: structuredClone(stateChangeDeclaration.executionChannel),
    actionOccurredAt: stateChangeDeclaration.actionOccurredAt,
    stateSubject: structuredClone(stateChangeDeclaration.stateSubject),
    stateDimension: stateChangeDeclaration.stateDimension,
    beforeObservation: structuredClone(stateChangeDeclaration.beforeObservation),
    afterObservation: structuredClone(stateChangeDeclaration.afterObservation),
    observedAt: stateChangeDeclaration.observedAt,
    declaredByActorId,
    declaredAt: captured.declaredAt,
    associationEvidenceRefs: inventory(captured.associationEvidenceRefs, true, false),
    schemaVersion: CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_SCHEMA_VERSION,
  }, true, true);
  const artifact: CareerActionStateChangeAssociationDeclaration = {
    careerActionStateChangeAssociationDeclarationId:
      deriveCareerActionStateChangeAssociationDeclarationId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerActionStateChangeAssociationDeclaration(artifact);
  return structuredClone(artifact);
}
