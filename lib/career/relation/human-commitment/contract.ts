import { createHash } from "node:crypto";
import type { CareerDecisionActionIntent, CareerDecisionActionIntentClass } from "../action-intent";
import { assertCareerDecisionActionIntent } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import {
  CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION,
  type CareerHumanCommitment,
  type CareerHumanCommitmentInput,
} from "./types";

const fail = (): never => { throw new Error("ERR_CAREER_HUMAN_COMMITMENT_INVALID"); };
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const nonEmptyText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value === value.trim();
// Parsing validates an explicit human declaration timestamp; it never generates identity time.
const canonicalTimestamp = (value: unknown): value is string => nonEmptyText(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;
const artifactKeys = ["careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "committedByActorId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "committedAt", "commitmentEvidenceRefs", "schemaVersion", "createdAt"] as const;
const semanticKeys = artifactKeys.filter(key => key !== "careerHumanCommitmentId" && key !== "createdAt");
const inputKeys = ["careerDecisionActionIntentId", "committedByActorId", "committedAt", "commitmentEvidenceRefs", "createdAt"] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const daint = /^DAINT_[0-9A-F]{32}$/;
const dcr = /^DCR_[0-9A-F]{32}$/;
const dctx = /^DCTXREV_[0-9A-F]{32}$/;
const dar = /^DAR_[0-9A-F]{32}$/;
const rcp = /^RCP_[0-9A-F]{32}$/;
const hcom = /^HCOM_[0-9A-F]{32}$/;
const declarationClasses = ["ACCEPT_RECOMMENDATION", "REJECT_RECOMMENDATION", "DEFER_DECISION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"] as const;
const actionClasses = ["RECOMMENDATION_OPERATIONALIZATION", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION", "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION"] as const;

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
    if (!rcp.test(subject.recommendationProposalId as string) || !Number.isSafeInteger(subject.sourceEvolutionInputItemOrdinal) || (subject.sourceEvolutionInputItemOrdinal as number) < 0) fail();
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

function sourceClasses(declaration: unknown, action: unknown): {
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
} {
  if (!declarationClasses.includes(declaration as HumanDecisionDeclarationClass) || !actionClasses.includes(action as CareerDecisionActionIntentClass)) fail();
  const allowed: Record<string, CareerDecisionActionIntentClass> = {
    ACCEPT_RECOMMENDATION: "RECOMMENDATION_OPERATIONALIZATION",
    REQUEST_FURTHER_EVIDENCE: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION",
    REQUEST_TARGET_CLARIFICATION: "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION",
  };
  if (allowed[declaration as string] !== action) fail();
  return {
    sourceDeclarationClass: declaration as HumanDecisionDeclarationClass,
    sourceActionIntentClass: action as CareerDecisionActionIntentClass,
  };
}

function semantic(value: Record<string, unknown>, normalize: boolean) {
  if (
    !daint.test(value.careerDecisionActionIntentId as string) ||
    !dcr.test(value.humanDecisionRecordId as string) ||
    !dctx.test(value.careerDecisionContextRevisionId as string) ||
    !dar.test(value.decisionAuthorityGrantRevisionId as string) ||
    !rcp.test(value.recommendationProposalId as string) ||
    !nonEmptyText(value.committedByActorId) ||
    typeof value.operationDescription !== "string" ||
    value.operationDescription.trim().length === 0 ||
    (!normalize && !nonEmptyText(value.operationDescription)) ||
    !canonicalTimestamp(value.committedAt) ||
    value.schemaVersion !== CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION
  ) fail();
  const classes = sourceClasses(value.sourceDeclarationClass, value.sourceActionIntentClass);
  return {
    careerDecisionActionIntentId: value.careerDecisionActionIntentId as string,
    humanDecisionRecordId: value.humanDecisionRecordId as string,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId as string,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId as string,
    recommendationProposalId: value.recommendationProposalId as string,
    committedByActorId: value.committedByActorId as string,
    decisionSubjects: subjects(value.decisionSubjects, normalize),
    sourceDeclarationClass: classes.sourceDeclarationClass,
    sourceActionIntentClass: classes.sourceActionIntentClass,
    operationDescription: normalize ? (value.operationDescription as string).trim() : value.operationDescription as string,
    committedAt: value.committedAt as string,
    commitmentEvidenceRefs: evidence(value.commitmentEvidenceRefs, normalize),
    schemaVersion: CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION,
  };
}

export function stableCareerHumanCommitment(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
    : item);
}

export function deriveCareerHumanCommitmentId(value: Omit<CareerHumanCommitment, "careerHumanCommitmentId" | "createdAt">): string {
  const canonical = semantic(exactObject(value, semanticKeys), false);
  const payload = [
    CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION,
    canonical.careerDecisionActionIntentId,
    canonical.humanDecisionRecordId,
    canonical.careerDecisionContextRevisionId,
    canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId,
    canonical.committedByActorId,
    canonical.decisionSubjects,
    canonical.sourceDeclarationClass,
    canonical.sourceActionIntentClass,
    canonical.operationDescription,
    canonical.committedAt,
    canonical.commitmentEvidenceRefs,
    canonical.schemaVersion,
  ];
  return `HCOM_${createHash("sha256").update(stableCareerHumanCommitment(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerHumanCommitment(value: unknown): asserts value is CareerHumanCommitment {
  const captured = exactObject(value, artifactKeys);
  if (!hcom.test(captured.careerHumanCommitmentId as string) || !canonicalTimestamp(captured.createdAt)) fail();
  const canonical = semantic(captured, false);
  if (captured.careerHumanCommitmentId !== deriveCareerHumanCommitmentId(canonical)) fail();
}

/** A commitment is explicit human history; it is not execution authority. */
export function createCareerHumanCommitment(actionIntent: CareerDecisionActionIntent, input: CareerHumanCommitmentInput): CareerHumanCommitment {
  try { assertCareerDecisionActionIntent(actionIntent); } catch { fail(); }
  const captured = exactObject(input, inputKeys);
  if (
    captured.careerDecisionActionIntentId !== actionIntent.careerDecisionActionIntentId ||
    captured.committedByActorId !== actionIntent.declaredByActorId ||
    !canonicalTimestamp(captured.committedAt) ||
    !canonicalTimestamp(captured.createdAt) ||
    (captured.committedAt as string) < actionIntent.declaredAt
  ) fail();
  // DAR applicability was consumed at the DCR declaration; T12B does not re-evaluate it.
  const canonical = semantic({
    careerDecisionActionIntentId: actionIntent.careerDecisionActionIntentId,
    humanDecisionRecordId: actionIntent.humanDecisionRecordId,
    careerDecisionContextRevisionId: actionIntent.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: actionIntent.decisionAuthorityGrantRevisionId,
    recommendationProposalId: actionIntent.recommendationProposalId,
    committedByActorId: captured.committedByActorId,
    decisionSubjects: actionIntent.decisionSubjects,
    sourceDeclarationClass: actionIntent.sourceDeclarationClass,
    sourceActionIntentClass: actionIntent.actionIntentClass,
    operationDescription: actionIntent.operationDescription,
    committedAt: captured.committedAt,
    commitmentEvidenceRefs: captured.commitmentEvidenceRefs,
    schemaVersion: CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION,
  }, true);
  const artifact: CareerHumanCommitment = {
    careerHumanCommitmentId: deriveCareerHumanCommitmentId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string,
  };
  assertCareerHumanCommitment(artifact);
  return structuredClone(artifact);
}
