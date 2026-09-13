import { createHash } from "node:crypto";
import type { CareerDecisionActionIntentClass } from "../action-intent";
import {
  assertCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclaration,
} from "../outcome-role-declaration";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";
import type {
  CareerStateObservation,
  CareerStateSubjectKind,
} from "../state-change-declaration";
import {
  CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION,
  type CareerOutcomeValence,
  type CareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclarationInput,
} from "./types";

const fail = (): never => { throw new Error("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_INVALID"); };
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();
const canonicalTimestamp = (value: unknown): value is string =>
  canonicalText(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;

const artifactKeys = [
  "careerOutcomeValenceDeclarationId", "careerOutcomeRoleDeclarationId",
  "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId",
  "careerActionOccurrenceId", "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId", "careerDecisionActionIntentId",
  "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
  "recommendationProposalId", "performedByActorId", "observedByActorId", "associationDeclaredByActorId",
  "outcomeRoleDeclaredByActorId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass",
  "operationDescription", "executionAuthorityScope", "executionTarget", "executionChannel", "actionOccurredAt",
  "stateSubject", "stateDimension", "beforeObservation", "afterObservation", "observedAt", "associationDeclaredAt",
  "outcomeRoleDeclaredAt", "declaredByActorId", "declaredAt", "valence", "valenceEvidenceRefs", "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = artifactKeys.filter(key =>
  key !== "careerOutcomeValenceDeclarationId" && key !== "createdAt",
);
const inputKeys = [
  "careerOutcomeRoleDeclarationId", "declaredByActorId", "declaredAt", "valence", "valenceEvidenceRefs", "createdAt",
] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const targetKeys = ["targetKind", "targetRef"] as const;
const channelKeys = ["channelKind", "channelRef"] as const;
const stateSubjectKeys = ["subjectKind", "subjectRef"] as const;
const observationKeys = ["observationState", "value"] as const;

const covd = /^COVD_[0-9A-F]{32}$/;
const cord = /^CORD_[0-9A-F]{32}$/;
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
const valences = ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const;

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

function semantic(value: Record<string, unknown>, canonicalRequired: boolean) {
  if (
    !cord.test(value.careerOutcomeRoleDeclarationId as string) ||
    !ascad.test(value.careerActionStateChangeAssociationDeclarationId as string) ||
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
    !canonicalText(value.associationDeclaredByActorId) || !canonicalText(value.outcomeRoleDeclaredByActorId) ||
    !canonicalText(value.operationDescription) || !canonicalText(value.stateDimension) ||
    !canonicalText(value.declaredByActorId) ||
    !declarationClasses.includes(value.sourceDeclarationClass as HumanDecisionDeclarationClass) ||
    !actionClasses.includes(value.sourceActionIntentClass as CareerDecisionActionIntentClass) ||
    !scopes.includes(value.executionAuthorityScope as CareerExecutionAuthorityScope) ||
    !canonicalTimestamp(value.actionOccurredAt) || !canonicalTimestamp(value.observedAt) ||
    !canonicalTimestamp(value.associationDeclaredAt) || !canonicalTimestamp(value.outcomeRoleDeclaredAt) ||
    !canonicalTimestamp(value.declaredAt) ||
    (value.declaredAt as string) < (value.outcomeRoleDeclaredAt as string) ||
    !valences.includes(value.valence as CareerOutcomeValence) ||
    value.schemaVersion !== CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION
  ) fail();
  const beforeObservation = observation(value.beforeObservation);
  const afterObservation = observation(value.afterObservation);
  if (beforeObservation.value === afterObservation.value) fail();
  return {
    careerOutcomeRoleDeclarationId: value.careerOutcomeRoleDeclarationId as string,
    careerActionStateChangeAssociationDeclarationId: value.careerActionStateChangeAssociationDeclarationId as string,
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
    associationDeclaredByActorId: value.associationDeclaredByActorId as string,
    outcomeRoleDeclaredByActorId: value.outcomeRoleDeclaredByActorId as string,
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
    associationDeclaredAt: value.associationDeclaredAt as string,
    outcomeRoleDeclaredAt: value.outcomeRoleDeclaredAt as string,
    declaredByActorId: value.declaredByActorId as string,
    declaredAt: value.declaredAt as string,
    valence: value.valence as CareerOutcomeValence,
    valenceEvidenceRefs: inventory(value.valenceEvidenceRefs, false, canonicalRequired),
    schemaVersion: CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION,
  };
}

export function stableCareerOutcomeValenceDeclaration(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
      : item,
  );
}

export function deriveCareerOutcomeValenceDeclarationId(
  value: Omit<CareerOutcomeValenceDeclaration, "careerOutcomeValenceDeclarationId" | "createdAt">,
): string {
  const canonical = semantic(exactObject(value, semanticKeys), false);
  const payload = [
    CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION,
    canonical.careerOutcomeRoleDeclarationId,
    canonical.careerActionStateChangeAssociationDeclarationId,
    canonical.careerStateChangeDeclarationId,
    canonical.careerActionOccurrenceId,
    canonical.careerExecutionContextRevisionId,
    canonical.careerExecutionAuthorityGrantRevisionId,
    canonical.careerHumanCommitmentId,
    canonical.careerDecisionActionIntentId,
    canonical.humanDecisionRecordId,
    canonical.careerDecisionContextRevisionId,
    canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId,
    canonical.performedByActorId,
    canonical.observedByActorId,
    canonical.associationDeclaredByActorId,
    canonical.outcomeRoleDeclaredByActorId,
    canonical.decisionSubjects,
    canonical.sourceDeclarationClass,
    canonical.sourceActionIntentClass,
    canonical.operationDescription,
    canonical.executionAuthorityScope,
    canonical.executionTarget,
    canonical.executionChannel,
    canonical.actionOccurredAt,
    canonical.stateSubject,
    canonical.stateDimension,
    canonical.beforeObservation,
    canonical.afterObservation,
    canonical.observedAt,
    canonical.associationDeclaredAt,
    canonical.outcomeRoleDeclaredAt,
    canonical.declaredByActorId,
    canonical.declaredAt,
    canonical.valence,
    canonical.valenceEvidenceRefs,
  ];
  return `COVD_${createHash("sha256").update(stableCareerOutcomeValenceDeclaration(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerOutcomeValenceDeclaration(
  value: unknown,
): asserts value is CareerOutcomeValenceDeclaration {
  const captured = exactObject(value, artifactKeys);
  if (!covd.test(captured.careerOutcomeValenceDeclarationId as string) || !canonicalTimestamp(captured.createdAt)) fail();
  const canonical = semantic(captured, true);
  if (captured.careerOutcomeValenceDeclarationId !== deriveCareerOutcomeValenceDeclarationId(canonical)) fail();
}

export function createCareerOutcomeValenceDeclaration(
  outcomeRoleDeclaration: CareerOutcomeRoleDeclaration,
  input: CareerOutcomeValenceDeclarationInput,
): CareerOutcomeValenceDeclaration {
  try { assertCareerOutcomeRoleDeclaration(outcomeRoleDeclaration); } catch { fail(); }
  const captured = exactObject(input, inputKeys);
  if (
    captured.careerOutcomeRoleDeclarationId !== outcomeRoleDeclaration.careerOutcomeRoleDeclarationId ||
    !canonicalTimestamp(captured.declaredAt) || !canonicalTimestamp(captured.createdAt) ||
    (captured.declaredAt as string) < outcomeRoleDeclaration.declaredAt
  ) fail();
  if (typeof captured.declaredByActorId !== "string") fail();
  const declaredByActorId = captured.declaredByActorId.trim();
  if (!canonicalText(declaredByActorId)) fail();
  const canonical = semantic({
    careerOutcomeRoleDeclarationId: outcomeRoleDeclaration.careerOutcomeRoleDeclarationId,
    careerActionStateChangeAssociationDeclarationId:
      outcomeRoleDeclaration.careerActionStateChangeAssociationDeclarationId,
    careerStateChangeDeclarationId: outcomeRoleDeclaration.careerStateChangeDeclarationId,
    careerActionOccurrenceId: outcomeRoleDeclaration.careerActionOccurrenceId,
    careerExecutionContextRevisionId: outcomeRoleDeclaration.careerExecutionContextRevisionId,
    careerExecutionAuthorityGrantRevisionId: outcomeRoleDeclaration.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: outcomeRoleDeclaration.careerHumanCommitmentId,
    careerDecisionActionIntentId: outcomeRoleDeclaration.careerDecisionActionIntentId,
    humanDecisionRecordId: outcomeRoleDeclaration.humanDecisionRecordId,
    careerDecisionContextRevisionId: outcomeRoleDeclaration.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: outcomeRoleDeclaration.decisionAuthorityGrantRevisionId,
    recommendationProposalId: outcomeRoleDeclaration.recommendationProposalId,
    performedByActorId: outcomeRoleDeclaration.performedByActorId,
    observedByActorId: outcomeRoleDeclaration.observedByActorId,
    associationDeclaredByActorId: outcomeRoleDeclaration.associationDeclaredByActorId,
    outcomeRoleDeclaredByActorId: outcomeRoleDeclaration.declaredByActorId,
    decisionSubjects: structuredClone(outcomeRoleDeclaration.decisionSubjects),
    sourceDeclarationClass: outcomeRoleDeclaration.sourceDeclarationClass,
    sourceActionIntentClass: outcomeRoleDeclaration.sourceActionIntentClass,
    operationDescription: outcomeRoleDeclaration.operationDescription,
    executionAuthorityScope: outcomeRoleDeclaration.executionAuthorityScope,
    executionTarget: structuredClone(outcomeRoleDeclaration.executionTarget),
    executionChannel: structuredClone(outcomeRoleDeclaration.executionChannel),
    actionOccurredAt: outcomeRoleDeclaration.actionOccurredAt,
    stateSubject: structuredClone(outcomeRoleDeclaration.stateSubject),
    stateDimension: outcomeRoleDeclaration.stateDimension,
    beforeObservation: structuredClone(outcomeRoleDeclaration.beforeObservation),
    afterObservation: structuredClone(outcomeRoleDeclaration.afterObservation),
    observedAt: outcomeRoleDeclaration.observedAt,
    associationDeclaredAt: outcomeRoleDeclaration.associationDeclaredAt,
    outcomeRoleDeclaredAt: outcomeRoleDeclaration.declaredAt,
    declaredByActorId,
    declaredAt: captured.declaredAt,
    valence: captured.valence,
    valenceEvidenceRefs: inventory(captured.valenceEvidenceRefs, true, false),
    schemaVersion: CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION,
  }, true);
  const artifact: CareerOutcomeValenceDeclaration = {
    careerOutcomeValenceDeclarationId: deriveCareerOutcomeValenceDeclarationId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerOutcomeValenceDeclaration(artifact);
  return structuredClone(artifact);
}
