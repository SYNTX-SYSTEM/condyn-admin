import { createHash } from "node:crypto";
import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import {
  assertCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../human-commitment";
import {
  CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION,
  type CareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevisionInput,
  type CareerExecutionAuthorityScope,
  type CareerExecutionChannelKind,
  type CareerExecutionTargetKind,
} from "./types";

const fail = (): never => {
  throw new Error("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_INVALID");
};
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const nonEmptyText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value === value.trim();
// This parses explicitly supplied declaration time; it never supplies identity time.
const canonicalTimestamp = (value: unknown): value is string =>
  nonEmptyText(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;

const artifactKeys = [
  "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
  "humanDecisionRecordId", "careerDecisionActionIntentId",
  "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
  "recommendationProposalId", "grantorActorId", "authorizedExecutionActorId",
  "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass",
  "operationDescription", "executionAuthorityScope", "permittedTargetKinds",
  "permittedChannelKinds", "authorityEvidenceRefs", "declaredAt", "effectiveFrom",
  "effectiveUntil", "schemaVersion", "createdAt",
] as const;
const semanticKeys = artifactKeys.filter(key =>
  key !== "careerExecutionAuthorityGrantRevisionId" && key !== "createdAt",
);
const inputKeys = [
  "careerHumanCommitmentId", "grantorActorId", "authorizedExecutionActorId",
  "executionAuthorityScope", "permittedTargetKinds", "permittedChannelKinds",
  "authorityEvidenceRefs", "declaredAt", "effectiveFrom", "effectiveUntil", "createdAt",
] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;

const hcom = /^HCOM_[0-9A-F]{32}$/;
const dcr = /^DCR_[0-9A-F]{32}$/;
const daint = /^DAINT_[0-9A-F]{32}$/;
const dctx = /^DCTXREV_[0-9A-F]{32}$/;
const dar = /^DAR_[0-9A-F]{32}$/;
const rcp = /^RCP_[0-9A-F]{32}$/;
const eagr = /^EAGR_[0-9A-F]{32}$/;
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

function subjects(value: unknown, normalize: boolean): DecisionSubjectReference[] {
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
  if (!normalize && JSON.stringify(captured) !== JSON.stringify(canonical)) fail();
  return canonical;
}

function closedInventory<T extends string>(
  value: unknown,
  allowed: readonly T[],
  normalize: boolean,
): T[] {
  if (!Array.isArray(value) || value.length === 0) fail();
  const captured = value.map(item => {
    if (typeof item !== "string") fail();
    const canonical = normalize ? item.trim() : item;
    if (!allowed.includes(canonical as T)) fail();
    return canonical as T;
  });
  if (new Set(captured).size !== captured.length) fail();
  const canonical = [...captured].sort(compare);
  if (!normalize && JSON.stringify(captured) !== JSON.stringify(canonical)) fail();
  return canonical;
}

function evidence(value: unknown, normalize: boolean): string[] {
  if (!Array.isArray(value) || value.length === 0) fail();
  const captured = value.map(item => {
    if (typeof item !== "string" || item.trim().length === 0) fail();
    return normalize ? item.trim() : item;
  });
  if (captured.some(item => !nonEmptyText(item)) || new Set(captured).size !== captured.length) fail();
  const canonical = [...captured].sort(compare);
  if (!normalize && JSON.stringify(captured) !== JSON.stringify(canonical)) fail();
  return canonical;
}

function classes(
  declaration: unknown,
  action: unknown,
): { sourceDeclarationClass: HumanDecisionDeclarationClass; sourceActionIntentClass: CareerDecisionActionIntentClass } {
  if (
    !declarationClasses.includes(declaration as HumanDecisionDeclarationClass) ||
    !actionClasses.includes(action as CareerDecisionActionIntentClass)
  ) fail();
  return {
    sourceDeclarationClass: declaration as HumanDecisionDeclarationClass,
    sourceActionIntentClass: action as CareerDecisionActionIntentClass,
  };
}

function semantic(value: Record<string, unknown>, normalize: boolean) {
  if (
    !hcom.test(value.careerHumanCommitmentId as string) ||
    !dcr.test(value.humanDecisionRecordId as string) ||
    !daint.test(value.careerDecisionActionIntentId as string) ||
    !dctx.test(value.careerDecisionContextRevisionId as string) ||
    !dar.test(value.decisionAuthorityGrantRevisionId as string) ||
    !rcp.test(value.recommendationProposalId as string) ||
    typeof value.grantorActorId !== "string" ||
    typeof value.authorizedExecutionActorId !== "string" ||
    (normalize ? value.grantorActorId.trim().length === 0 : !nonEmptyText(value.grantorActorId)) ||
    (normalize ? value.authorizedExecutionActorId.trim().length === 0 : !nonEmptyText(value.authorizedExecutionActorId)) ||
    typeof value.operationDescription !== "string" ||
    value.operationDescription.trim().length === 0 ||
    (!normalize && !nonEmptyText(value.operationDescription)) ||
    !scopes.includes(value.executionAuthorityScope as CareerExecutionAuthorityScope) ||
    !canonicalTimestamp(value.declaredAt) ||
    !canonicalTimestamp(value.effectiveFrom) ||
    !(value.effectiveUntil === null || canonicalTimestamp(value.effectiveUntil)) ||
    value.schemaVersion !== CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION
  ) fail();
  const source = classes(value.sourceDeclarationClass, value.sourceActionIntentClass);
  return {
    careerHumanCommitmentId: value.careerHumanCommitmentId as string,
    humanDecisionRecordId: value.humanDecisionRecordId as string,
    careerDecisionActionIntentId: value.careerDecisionActionIntentId as string,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId as string,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId as string,
    recommendationProposalId: value.recommendationProposalId as string,
    grantorActorId: normalize ? (value.grantorActorId as string).trim() : value.grantorActorId as string,
    authorizedExecutionActorId: normalize ? (value.authorizedExecutionActorId as string).trim() : value.authorizedExecutionActorId as string,
    decisionSubjects: subjects(value.decisionSubjects, normalize),
    sourceDeclarationClass: source.sourceDeclarationClass,
    sourceActionIntentClass: source.sourceActionIntentClass,
    operationDescription: normalize ? (value.operationDescription as string).trim() : value.operationDescription as string,
    executionAuthorityScope: value.executionAuthorityScope as CareerExecutionAuthorityScope,
    permittedTargetKinds: closedInventory(value.permittedTargetKinds, targetKinds, normalize),
    permittedChannelKinds: closedInventory(value.permittedChannelKinds, channelKinds, normalize),
    authorityEvidenceRefs: evidence(value.authorityEvidenceRefs, normalize),
    declaredAt: value.declaredAt as string,
    effectiveFrom: value.effectiveFrom as string,
    effectiveUntil: value.effectiveUntil as string | null,
    schemaVersion: CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION,
  };
}

export function stableCareerExecutionAuthorityGrantRevision(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare)
        .map(key => [key, (item as Record<string, unknown>)[key]]))
      : item,
  );
}

export function deriveCareerExecutionAuthorityGrantRevisionId(
  value: Omit<CareerExecutionAuthorityGrantRevision, "careerExecutionAuthorityGrantRevisionId" | "createdAt">,
): string {
  const canonical = semantic(exactObject(value, semanticKeys), false);
  const payload = [
    CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION,
    canonical.careerHumanCommitmentId,
    canonical.humanDecisionRecordId,
    canonical.careerDecisionActionIntentId,
    canonical.careerDecisionContextRevisionId,
    canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId,
    canonical.grantorActorId,
    canonical.authorizedExecutionActorId,
    canonical.decisionSubjects,
    canonical.sourceDeclarationClass,
    canonical.sourceActionIntentClass,
    canonical.operationDescription,
    canonical.executionAuthorityScope,
    canonical.permittedTargetKinds,
    canonical.permittedChannelKinds,
    canonical.authorityEvidenceRefs,
    canonical.declaredAt,
    canonical.effectiveFrom,
    canonical.effectiveUntil,
    canonical.schemaVersion,
  ];
  return `EAGR_${createHash("sha256")
    .update(stableCareerExecutionAuthorityGrantRevision(payload), "utf8")
    .digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerExecutionAuthorityGrantRevision(
  value: unknown,
): asserts value is CareerExecutionAuthorityGrantRevision {
  const captured = exactObject(value, artifactKeys);
  if (
    !eagr.test(captured.careerExecutionAuthorityGrantRevisionId as string) ||
    !canonicalTimestamp(captured.createdAt)
  ) fail();
  const canonical = semantic(captured, false);
  if (
    captured.careerExecutionAuthorityGrantRevisionId !==
    deriveCareerExecutionAuthorityGrantRevisionId(canonical)
  ) fail();
}

/**
 * EAGR is explicit, non-regenerable authority history. Self-grant is deliberate
 * V1 behavior; neither HCOM actor implicitly becomes an execution actor.
 */
export function createCareerExecutionAuthorityGrantRevision(
  commitment: CareerHumanCommitment,
  input: CareerExecutionAuthorityGrantRevisionInput,
): CareerExecutionAuthorityGrantRevision {
  try {
    assertCareerHumanCommitment(commitment);
  } catch {
    fail();
  }
  const captured = exactObject(input, inputKeys);
  const expectedScope: Record<CareerDecisionActionIntentClass, CareerExecutionAuthorityScope> = {
    RECOMMENDATION_OPERATIONALIZATION: "RECOMMENDATION_OPERATION_EXECUTION",
    FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION: "FURTHER_EVIDENCE_REQUEST_EXECUTION",
    TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION: "TARGET_CLARIFICATION_REQUEST_EXECUTION",
  };
  if (
    captured.careerHumanCommitmentId !== commitment.careerHumanCommitmentId ||
    captured.executionAuthorityScope !== expectedScope[commitment.sourceActionIntentClass] ||
    !canonicalTimestamp(captured.declaredAt) ||
    !canonicalTimestamp(captured.effectiveFrom) ||
    !(captured.effectiveUntil === null || canonicalTimestamp(captured.effectiveUntil)) ||
    !canonicalTimestamp(captured.createdAt) ||
    (captured.declaredAt as string) < commitment.committedAt ||
    (captured.effectiveFrom as string) < (captured.declaredAt as string) ||
    (captured.effectiveUntil !== null &&
      (captured.effectiveUntil as string) <= (captured.effectiveFrom as string))
  ) fail();
  // Target/channel inventories bound permission space; they do not select execution targets.
  const canonical = semantic({
    careerHumanCommitmentId: commitment.careerHumanCommitmentId,
    humanDecisionRecordId: commitment.humanDecisionRecordId,
    careerDecisionActionIntentId: commitment.careerDecisionActionIntentId,
    careerDecisionContextRevisionId: commitment.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: commitment.decisionAuthorityGrantRevisionId,
    recommendationProposalId: commitment.recommendationProposalId,
    grantorActorId: captured.grantorActorId,
    authorizedExecutionActorId: captured.authorizedExecutionActorId,
    decisionSubjects: commitment.decisionSubjects,
    sourceDeclarationClass: commitment.sourceDeclarationClass,
    sourceActionIntentClass: commitment.sourceActionIntentClass,
    operationDescription: commitment.operationDescription,
    executionAuthorityScope: captured.executionAuthorityScope,
    permittedTargetKinds: captured.permittedTargetKinds,
    permittedChannelKinds: captured.permittedChannelKinds,
    authorityEvidenceRefs: captured.authorityEvidenceRefs,
    declaredAt: captured.declaredAt,
    effectiveFrom: captured.effectiveFrom,
    effectiveUntil: captured.effectiveUntil,
    schemaVersion: CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION,
  }, true);
  const artifact: CareerExecutionAuthorityGrantRevision = {
    careerExecutionAuthorityGrantRevisionId:
      deriveCareerExecutionAuthorityGrantRevisionId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerExecutionAuthorityGrantRevision(artifact);
  return structuredClone(artifact);
}
