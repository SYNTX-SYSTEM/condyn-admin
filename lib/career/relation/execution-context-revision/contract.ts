import { createHash } from "node:crypto";
import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import {
  assertCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityScope,
  type CareerExecutionChannelKind,
  type CareerExecutionTargetKind,
} from "../execution-authority-grant";
import {
  CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION,
  type CareerExecutionChannel,
  type CareerExecutionContextRevision,
  type CareerExecutionContextRevisionInput,
  type CareerExecutionTarget,
} from "./types";

const fail = (): never => {
  throw new Error("ERR_CAREER_EXECUTION_CONTEXT_REVISION_INVALID");
};
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();
const canonicalTimestamp = (value: unknown): value is string =>
  canonicalText(value) && Number.isFinite(new Date(value).getTime()) &&
  new Date(value).toISOString() === value;

const artifactKeys = [
  "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId",
  "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId",
  "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId",
  "declaredByActorId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass",
  "operationDescription", "executionAuthorityScope", "executionTarget", "executionChannel",
  "declaredAt", "contextEvidenceRefs", "schemaVersion", "createdAt",
] as const;
const semanticKeys = artifactKeys.filter(key =>
  key !== "careerExecutionContextRevisionId" && key !== "createdAt",
);
const inputKeys = [
  "careerExecutionAuthorityGrantRevisionId", "declaredByActorId", "executionTarget",
  "executionChannel", "declaredAt", "contextEvidenceRefs", "createdAt",
] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const targetKeys = ["targetKind", "targetRef"] as const;
const channelKeys = ["channelKind", "channelRef"] as const;

const eagr = /^EAGR_[0-9A-F]{32}$/;
const hcom = /^HCOM_[0-9A-F]{32}$/;
const daint = /^DAINT_[0-9A-F]{32}$/;
const dcr = /^DCR_[0-9A-F]{32}$/;
const dctx = /^DCTXREV_[0-9A-F]{32}$/;
const dar = /^DAR_[0-9A-F]{32}$/;
const rcp = /^RCP_[0-9A-F]{32}$/;
const ectx = /^ECTXREV_[0-9A-F]{32}$/;
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

function subjects(value: unknown, normalize: boolean, canonicalRequired: boolean): DecisionSubjectReference[] {
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
  return normalize ? canonical : captured;
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

function target(value: unknown, normalize: boolean): CareerExecutionTarget {
  const captured = exactObject(value, targetKeys);
  if (typeof captured.targetKind !== "string" || typeof captured.targetRef !== "string") fail();
  const targetRef = normalize ? captured.targetRef.trim() : captured.targetRef;
  if (!targetKinds.includes(captured.targetKind as CareerExecutionTargetKind) || !canonicalText(targetRef)) fail();
  return { targetKind: captured.targetKind as CareerExecutionTargetKind, targetRef };
}

function channel(value: unknown, normalize: boolean): CareerExecutionChannel {
  const captured = exactObject(value, channelKeys);
  if (typeof captured.channelKind !== "string" || typeof captured.channelRef !== "string") fail();
  const channelRef = normalize ? captured.channelRef.trim() : captured.channelRef;
  if (!channelKinds.includes(captured.channelKind as CareerExecutionChannelKind) || !canonicalText(channelRef)) fail();
  return { channelKind: captured.channelKind as CareerExecutionChannelKind, channelRef };
}

function semantic(
  value: Record<string, unknown>,
  normalize: boolean,
  canonicalInventories: boolean,
) {
  const declaredByActorId = normalize
    ? typeof value.declaredByActorId === "string" ? value.declaredByActorId.trim() : fail()
    : value.declaredByActorId;
  const operationDescription = normalize
    ? typeof value.operationDescription === "string" ? value.operationDescription.trim() : fail()
    : value.operationDescription;
  if (
    !eagr.test(value.careerExecutionAuthorityGrantRevisionId as string) ||
    !hcom.test(value.careerHumanCommitmentId as string) ||
    !daint.test(value.careerDecisionActionIntentId as string) ||
    !dcr.test(value.humanDecisionRecordId as string) ||
    !dctx.test(value.careerDecisionContextRevisionId as string) ||
    !dar.test(value.decisionAuthorityGrantRevisionId as string) ||
    !rcp.test(value.recommendationProposalId as string) ||
    !canonicalText(declaredByActorId) ||
    !canonicalText(operationDescription) ||
    !declarationClasses.includes(value.sourceDeclarationClass as HumanDecisionDeclarationClass) ||
    !actionClasses.includes(value.sourceActionIntentClass as CareerDecisionActionIntentClass) ||
    !scopes.includes(value.executionAuthorityScope as CareerExecutionAuthorityScope) ||
    !canonicalTimestamp(value.declaredAt) ||
    value.schemaVersion !== CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION
  ) fail();
  return {
    careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId as string,
    careerHumanCommitmentId: value.careerHumanCommitmentId as string,
    careerDecisionActionIntentId: value.careerDecisionActionIntentId as string,
    humanDecisionRecordId: value.humanDecisionRecordId as string,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId as string,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId as string,
    recommendationProposalId: value.recommendationProposalId as string,
    declaredByActorId,
    decisionSubjects: subjects(value.decisionSubjects, normalize, canonicalInventories),
    sourceDeclarationClass: value.sourceDeclarationClass as HumanDecisionDeclarationClass,
    sourceActionIntentClass: value.sourceActionIntentClass as CareerDecisionActionIntentClass,
    operationDescription,
    executionAuthorityScope: value.executionAuthorityScope as CareerExecutionAuthorityScope,
    executionTarget: target(value.executionTarget, normalize),
    executionChannel: channel(value.executionChannel, normalize),
    declaredAt: value.declaredAt as string,
    contextEvidenceRefs: evidence(value.contextEvidenceRefs, normalize, canonicalInventories),
    schemaVersion: CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION,
  };
}

export function stableCareerExecutionContextRevision(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare)
        .map(key => [key, (item as Record<string, unknown>)[key]]))
      : item,
  );
}

export function deriveCareerExecutionContextRevisionId(
  value: Omit<CareerExecutionContextRevision, "careerExecutionContextRevisionId" | "createdAt">,
): string {
  // Derivation is pure: external EAGR permission and actor relations are constructor facts.
  const canonical = semantic(exactObject(value, semanticKeys), false, false);
  const payload = [
    CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION,
    canonical.careerExecutionAuthorityGrantRevisionId,
    canonical.careerHumanCommitmentId,
    canonical.careerDecisionActionIntentId,
    canonical.humanDecisionRecordId,
    canonical.careerDecisionContextRevisionId,
    canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId,
    canonical.declaredByActorId,
    canonical.decisionSubjects,
    canonical.sourceDeclarationClass,
    canonical.sourceActionIntentClass,
    canonical.operationDescription,
    canonical.executionAuthorityScope,
    canonical.executionTarget,
    canonical.executionChannel,
    canonical.declaredAt,
    canonical.contextEvidenceRefs,
    canonical.schemaVersion,
  ];
  return `ECTXREV_${createHash("sha256")
    .update(stableCareerExecutionContextRevision(payload), "utf8")
    .digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerExecutionContextRevision(
  value: unknown,
): asserts value is CareerExecutionContextRevision {
  const captured = exactObject(value, artifactKeys);
  if (!ectx.test(captured.careerExecutionContextRevisionId as string) || !canonicalTimestamp(captured.createdAt)) fail();
  const canonical = semantic(captured, false, true);
  if (
    captured.careerExecutionContextRevisionId !==
    deriveCareerExecutionContextRevisionId(canonical)
  ) fail();
}

/**
 * ECTXREV is immutable historical context declaration: EAGR remains the sole
 * execution authority, while this declaration is never an action occurrence.
 * Its declaredAt is the context event; createdAt is audit-only identity-wise.
 */
export function createCareerExecutionContextRevision(
  authority: CareerExecutionAuthorityGrantRevision,
  input: CareerExecutionContextRevisionInput,
): CareerExecutionContextRevision {
  try {
    assertCareerExecutionAuthorityGrantRevision(authority);
  } catch {
    fail();
  }
  const captured = exactObject(input, inputKeys);
  if (
    captured.careerExecutionAuthorityGrantRevisionId !== authority.careerExecutionAuthorityGrantRevisionId ||
    !canonicalTimestamp(captured.declaredAt) ||
    !canonicalTimestamp(captured.createdAt)
  ) fail();
  const declaredByActorId = typeof captured.declaredByActorId === "string"
    ? captured.declaredByActorId.trim()
    : fail();
  const executionTarget = target(captured.executionTarget, true);
  const executionChannel = channel(captured.executionChannel, true);
  const contextEvidenceRefs = evidence(captured.contextEvidenceRefs, true, false);
  // This checks EAGR's declared interval only; DAR was consumed at the DCR boundary.
  if (
    !canonicalText(declaredByActorId) ||
    declaredByActorId !== authority.authorizedExecutionActorId ||
    !authority.permittedTargetKinds.includes(executionTarget.targetKind) ||
    !authority.permittedChannelKinds.includes(executionChannel.channelKind) ||
    (captured.declaredAt as string) < authority.declaredAt ||
    (captured.declaredAt as string) < authority.effectiveFrom ||
    (authority.effectiveUntil !== null &&
      (captured.declaredAt as string) >= authority.effectiveUntil)
  ) fail();
  const canonical = semantic({
    // Opaque selected refs are context facts; EAGR permission inventories stay on EAGR.
    careerExecutionAuthorityGrantRevisionId: authority.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: authority.careerHumanCommitmentId,
    careerDecisionActionIntentId: authority.careerDecisionActionIntentId,
    humanDecisionRecordId: authority.humanDecisionRecordId,
    careerDecisionContextRevisionId: authority.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId,
    recommendationProposalId: authority.recommendationProposalId,
    declaredByActorId,
    decisionSubjects: authority.decisionSubjects,
    sourceDeclarationClass: authority.sourceDeclarationClass,
    sourceActionIntentClass: authority.sourceActionIntentClass,
    operationDescription: authority.operationDescription,
    executionAuthorityScope: authority.executionAuthorityScope,
    executionTarget,
    executionChannel,
    declaredAt: captured.declaredAt,
    contextEvidenceRefs,
    schemaVersion: CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION,
  }, false, true);
  const artifact: CareerExecutionContextRevision = {
    careerExecutionContextRevisionId: deriveCareerExecutionContextRevisionId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerExecutionContextRevision(artifact);
  return structuredClone(artifact);
}
