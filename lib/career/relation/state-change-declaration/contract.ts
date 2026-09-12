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
  assertCareerActionOccurrence,
  type CareerActionOccurrence,
} from "../action-occurrence";
import {
  CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION,
  type AuthoritativeStateReference,
  type CareerStateChangeDeclaration,
  type CareerStateChangeDeclarationInput,
  type CareerStateObservation,
  type CareerStateSubjectKind,
} from "./types";

const fail = (): never => { throw new Error("ERR_CAREER_STATE_CHANGE_DECLARATION_INVALID"); };
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();
const canonicalTimestamp = (value: unknown): value is string =>
  canonicalText(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;

const artifactKeys = [
  "careerStateChangeDeclarationId", "careerActionOccurrenceId", "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId", "careerDecisionActionIntentId",
  "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
  "recommendationProposalId", "performedByActorId", "observedByActorId", "decisionSubjects",
  "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "executionAuthorityScope",
  "executionTarget", "executionChannel", "actionOccurredAt", "stateSubject", "stateDimension",
  "beforeObservation", "afterObservation", "observedAt", "stateChangeEvidenceRefs", "externalStateRef",
  "schemaVersion", "createdAt",
] as const;
const semanticKeys = artifactKeys.filter(key =>
  key !== "careerStateChangeDeclarationId" && key !== "createdAt",
);
const inputKeys = [
  "careerActionOccurrenceId", "observedByActorId", "stateSubject", "stateDimension", "beforeObservation",
  "afterObservation", "observedAt", "stateChangeEvidenceRefs", "externalStateRef", "createdAt",
] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const targetKeys = ["targetKind", "targetRef"] as const;
const channelKeys = ["channelKind", "channelRef"] as const;
const stateSubjectKeys = ["subjectKind", "subjectRef"] as const;
const observationKeys = ["observationState", "value"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;

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
    return { recommendationProposalId: subject.recommendationProposalId as string, sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal as number };
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

function stateSubject(value: unknown, normalize: boolean) {
  const captured = exactObject(value, stateSubjectKeys);
  if (!stateSubjectKinds.includes(captured.subjectKind as CareerStateSubjectKind) || typeof captured.subjectRef !== "string") fail();
  const subjectRef = normalize ? captured.subjectRef.trim() : captured.subjectRef;
  if (!canonicalText(subjectRef)) fail();
  return { subjectKind: captured.subjectKind as CareerStateSubjectKind, subjectRef };
}

function observation(value: unknown, normalize: boolean): CareerStateObservation {
  const captured = exactObject(value, observationKeys);
  if (captured.observationState === "OBSERVED") {
    if (typeof captured.value !== "string") fail();
    const stateValue = normalize ? captured.value.trim() : captured.value;
    if (!canonicalText(stateValue)) fail();
    return { observationState: "OBSERVED", value: stateValue };
  }
  if (["UNKNOWN", "NOT_OBSERVED", "OBSERVATION_FAILED"].includes(captured.observationState as string)) {
    if (captured.value !== null) fail();
    return { observationState: captured.observationState as "UNKNOWN" | "NOT_OBSERVED" | "OBSERVATION_FAILED", value: null };
  }
  return fail();
}

function externalReference(value: unknown, normalize: boolean): AuthoritativeStateReference | null {
  if (value === null) return null;
  const captured = exactObject(value, referenceKeys);
  const values = Object.fromEntries(referenceKeys.map(key => {
    if (typeof captured[key] !== "string") fail();
    const result = normalize ? (captured[key] as string).trim() : captured[key] as string;
    if (!canonicalText(result)) fail();
    return [key, result];
  }));
  return values as AuthoritativeStateReference;
}

function semantic(value: Record<string, unknown>, normalize: boolean, canonicalRequired: boolean) {
  if (
    !aoc.test(value.careerActionOccurrenceId as string) ||
    !ectx.test(value.careerExecutionContextRevisionId as string) ||
    !eagr.test(value.careerExecutionAuthorityGrantRevisionId as string) ||
    !hcom.test(value.careerHumanCommitmentId as string) ||
    !daint.test(value.careerDecisionActionIntentId as string) ||
    !dcr.test(value.humanDecisionRecordId as string) ||
    !dctx.test(value.careerDecisionContextRevisionId as string) ||
    !dar.test(value.decisionAuthorityGrantRevisionId as string) ||
    !rcp.test(value.recommendationProposalId as string) ||
    typeof value.performedByActorId !== "string" || !canonicalText(value.performedByActorId) ||
    typeof value.observedByActorId !== "string" || !canonicalText(value.observedByActorId) ||
    typeof value.operationDescription !== "string" || !canonicalText(value.operationDescription) ||
    typeof value.stateDimension !== "string" || !canonicalText(value.stateDimension) ||
    !declarationClasses.includes(value.sourceDeclarationClass as HumanDecisionDeclarationClass) ||
    !actionClasses.includes(value.sourceActionIntentClass as CareerDecisionActionIntentClass) ||
    !scopes.includes(value.executionAuthorityScope as CareerExecutionAuthorityScope) ||
    !canonicalTimestamp(value.actionOccurredAt) || !canonicalTimestamp(value.observedAt) ||
    value.schemaVersion !== CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION
  ) fail();
  const beforeObservation = observation(value.beforeObservation, normalize);
  const afterObservation = observation(value.afterObservation, normalize);
  if (beforeObservation.observationState !== "OBSERVED" || afterObservation.observationState !== "OBSERVED" || beforeObservation.value === afterObservation.value) fail();
  return {
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
    stateSubject: stateSubject(value.stateSubject, normalize),
    stateDimension: normalize ? (value.stateDimension as string).trim() : value.stateDimension as string,
    beforeObservation,
    afterObservation,
    observedAt: value.observedAt as string,
    stateChangeEvidenceRefs: inventory(value.stateChangeEvidenceRefs, normalize, canonicalRequired),
    externalStateRef: externalReference(value.externalStateRef, normalize),
    schemaVersion: CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION,
  };
}

export function stableCareerStateChangeDeclaration(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
      : item,
  );
}

export function deriveCareerStateChangeDeclarationId(
  value: Omit<CareerStateChangeDeclaration, "careerStateChangeDeclarationId" | "createdAt">,
): string {
  const canonical = semantic(exactObject(value, semanticKeys), false, false);
  const payload = [
    CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION,
    canonical.careerActionOccurrenceId, canonical.careerExecutionContextRevisionId,
    canonical.careerExecutionAuthorityGrantRevisionId, canonical.careerHumanCommitmentId,
    canonical.careerDecisionActionIntentId, canonical.humanDecisionRecordId,
    canonical.careerDecisionContextRevisionId, canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId, canonical.performedByActorId, canonical.observedByActorId,
    canonical.decisionSubjects, canonical.sourceDeclarationClass, canonical.sourceActionIntentClass,
    canonical.operationDescription, canonical.executionAuthorityScope, canonical.executionTarget,
    canonical.executionChannel, canonical.actionOccurredAt, canonical.stateSubject, canonical.stateDimension,
    canonical.beforeObservation, canonical.afterObservation, canonical.observedAt,
    canonical.stateChangeEvidenceRefs, canonical.externalStateRef, canonical.schemaVersion,
  ];
  return `SCD_${createHash("sha256").update(stableCareerStateChangeDeclaration(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerStateChangeDeclaration(value: unknown): asserts value is CareerStateChangeDeclaration {
  const captured = exactObject(value, artifactKeys);
  if (!scd.test(captured.careerStateChangeDeclarationId as string) || !canonicalTimestamp(captured.createdAt)) fail();
  const canonical = semantic(captured, false, true);
  if (captured.careerStateChangeDeclarationId !== deriveCareerStateChangeDeclarationId(canonical)) fail();
}

/** SCD is an immutable state-difference declaration, not external proof or causal authority. */
export function createCareerStateChangeDeclaration(
  occurrence: CareerActionOccurrence,
  input: CareerStateChangeDeclarationInput,
): CareerStateChangeDeclaration {
  try { assertCareerActionOccurrence(occurrence); } catch { fail(); }
  const captured = exactObject(input, inputKeys);
  if (
    captured.careerActionOccurrenceId !== occurrence.careerActionOccurrenceId ||
    !canonicalTimestamp(captured.observedAt) || !canonicalTimestamp(captured.createdAt)
  ) fail();
  const observedByActorId = typeof captured.observedByActorId === "string" ? captured.observedByActorId.trim() : fail();
  const stateDimension = typeof captured.stateDimension === "string" ? captured.stateDimension.trim() : fail();
  if (!canonicalText(observedByActorId) || !canonicalText(stateDimension) || (captured.observedAt as string) < occurrence.occurredAt) fail();
  const canonical = semantic({
    careerActionOccurrenceId: occurrence.careerActionOccurrenceId,
    careerExecutionContextRevisionId: occurrence.careerExecutionContextRevisionId,
    careerExecutionAuthorityGrantRevisionId: occurrence.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: occurrence.careerHumanCommitmentId,
    careerDecisionActionIntentId: occurrence.careerDecisionActionIntentId,
    humanDecisionRecordId: occurrence.humanDecisionRecordId,
    careerDecisionContextRevisionId: occurrence.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: occurrence.decisionAuthorityGrantRevisionId,
    recommendationProposalId: occurrence.recommendationProposalId,
    performedByActorId: occurrence.performedByActorId,
    observedByActorId,
    decisionSubjects: occurrence.decisionSubjects,
    sourceDeclarationClass: occurrence.sourceDeclarationClass,
    sourceActionIntentClass: occurrence.sourceActionIntentClass,
    operationDescription: occurrence.operationDescription,
    executionAuthorityScope: occurrence.executionAuthorityScope,
    executionTarget: structuredClone(occurrence.executionTarget),
    executionChannel: structuredClone(occurrence.executionChannel),
    actionOccurredAt: occurrence.occurredAt,
    stateSubject: stateSubject(captured.stateSubject, true),
    stateDimension,
    beforeObservation: observation(captured.beforeObservation, true),
    afterObservation: observation(captured.afterObservation, true),
    observedAt: captured.observedAt,
    stateChangeEvidenceRefs: inventory(captured.stateChangeEvidenceRefs, true, false),
    externalStateRef: externalReference(captured.externalStateRef, true),
    schemaVersion: CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION,
  }, false, true);
  const artifact: CareerStateChangeDeclaration = {
    careerStateChangeDeclarationId: deriveCareerStateChangeDeclarationId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerStateChangeDeclaration(artifact);
  return structuredClone(artifact);
}
