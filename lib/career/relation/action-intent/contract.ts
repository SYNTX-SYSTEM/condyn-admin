import { createHash } from "node:crypto";
import type { DecisionSubjectReference } from "../decision-context";
import { assertHumanDecisionRecord, type HumanDecisionDeclarationClass, type HumanDecisionRecord } from "../decision-record";
import { CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION, type CareerDecisionActionIntent, type CareerDecisionActionIntentClass, type CareerDecisionActionIntentInput } from "./types";

const error = (): never => { throw new Error("ERR_CAREER_DECISION_ACTION_INTENT_INVALID"); };
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const nonEmptyText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value === value.trim();
// Parsing validates an explicit declaration timestamp; it never supplies an identity-bearing time.
const canonicalTimestamp = (value: unknown): value is string => nonEmptyText(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;
const artifactKeys = ["careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "declaredByActorId", "decisionSubjects", "sourceDeclarationClass", "actionIntentClass", "operationDescription", "declaredAt", "actionIntentEvidenceRefs", "schemaVersion", "createdAt"] as const;
const semanticKeys = artifactKeys.filter(key => key !== "careerDecisionActionIntentId" && key !== "createdAt");
const inputKeys = ["humanDecisionRecordId", "declaredByActorId", "actionIntentClass", "operationDescription", "declaredAt", "actionIntentEvidenceRefs", "createdAt"] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const declarationClasses = ["ACCEPT_RECOMMENDATION", "REJECT_RECOMMENDATION", "DEFER_DECISION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"] as const;
const actionIntentClasses = ["RECOMMENDATION_OPERATIONALIZATION", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION", "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION"] as const;
const rcp = /^RCP_[0-9A-F]{32}$/;
const dcr = /^DCR_[0-9A-F]{32}$/;
const dctx = /^DCTXREV_[0-9A-F]{32}$/;
const dar = /^DAR_[0-9A-F]{32}$/;
const daint = /^DAINT_[0-9A-F]{32}$/;

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) error();
  const actual = Object.keys(value as Record<string, unknown>);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(value, key))) error();
  return value as Record<string, unknown>;
}

function subjectKey(subject: DecisionSubjectReference): string {
  return `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
}

function subjects(value: unknown, normalize: boolean): DecisionSubjectReference[] {
  if (!Array.isArray(value) || value.length === 0) error();
  const captured = value.map(item => {
    const subject = exactObject(item, subjectKeys);
    if (!rcp.test(subject.recommendationProposalId as string) || !Number.isSafeInteger(subject.sourceEvolutionInputItemOrdinal) || (subject.sourceEvolutionInputItemOrdinal as number) < 0) error();
    return { recommendationProposalId: subject.recommendationProposalId as string, sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal as number };
  });
  if (new Set(captured.map(subjectKey)).size !== captured.length) error();
  const canonical = [...captured].sort((left, right) => compare(subjectKey(left), subjectKey(right)));
  if (!normalize && JSON.stringify(captured) !== JSON.stringify(canonical)) error();
  return canonical;
}

function evidence(value: unknown, normalize: boolean): string[] {
  if (!Array.isArray(value) || value.length === 0) error();
  const captured = value.map(item => {
    if (typeof item !== "string" || item.trim().length === 0) error();
    return normalize ? item.trim() : item;
  });
  if (captured.some(item => !nonEmptyText(item)) || new Set(captured).size !== captured.length) error();
  const canonical = [...captured].sort(compare);
  if (!normalize && JSON.stringify(captured) !== JSON.stringify(canonical)) error();
  return canonical;
}

function classMapping(source: unknown, intent: unknown): { sourceDeclarationClass: HumanDecisionDeclarationClass; actionIntentClass: CareerDecisionActionIntentClass } {
  if (!declarationClasses.includes(source as HumanDecisionDeclarationClass) || !actionIntentClasses.includes(intent as CareerDecisionActionIntentClass)) error();
  const allowed: Record<string, CareerDecisionActionIntentClass> = {
    ACCEPT_RECOMMENDATION: "RECOMMENDATION_OPERATIONALIZATION",
    REQUEST_FURTHER_EVIDENCE: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION",
    REQUEST_TARGET_CLARIFICATION: "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION",
  };
  if (allowed[source as string] !== intent) error();
  return { sourceDeclarationClass: source as HumanDecisionDeclarationClass, actionIntentClass: intent as CareerDecisionActionIntentClass };
}

function semantic(value: Record<string, unknown>, normalize: boolean) {
  if (!dcr.test(value.humanDecisionRecordId as string) || !dctx.test(value.careerDecisionContextRevisionId as string) || !dar.test(value.decisionAuthorityGrantRevisionId as string) || !rcp.test(value.recommendationProposalId as string) || !nonEmptyText(value.declaredByActorId) || typeof value.operationDescription !== "string" || value.operationDescription.trim().length === 0 || (!normalize && !nonEmptyText(value.operationDescription)) || !canonicalTimestamp(value.declaredAt) || value.schemaVersion !== CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION) error();
  const mapping = classMapping(value.sourceDeclarationClass, value.actionIntentClass);
  return {
    humanDecisionRecordId: value.humanDecisionRecordId as string,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId as string,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId as string,
    recommendationProposalId: value.recommendationProposalId as string,
    declaredByActorId: value.declaredByActorId as string,
    decisionSubjects: subjects(value.decisionSubjects, normalize),
    sourceDeclarationClass: mapping.sourceDeclarationClass,
    actionIntentClass: mapping.actionIntentClass,
    operationDescription: normalize ? (value.operationDescription as string).trim() : value.operationDescription as string,
    declaredAt: value.declaredAt as string,
    actionIntentEvidenceRefs: evidence(value.actionIntentEvidenceRefs, normalize),
    schemaVersion: CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION,
  };
}

export function stableCareerDecisionActionIntent(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
    : item);
}

export function deriveCareerDecisionActionIntentId(value: Omit<CareerDecisionActionIntent, "careerDecisionActionIntentId" | "createdAt">): string {
  const canonical = semantic(exactObject(value, semanticKeys), false);
  const payload = [CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION, canonical.humanDecisionRecordId, canonical.careerDecisionContextRevisionId, canonical.decisionAuthorityGrantRevisionId, canonical.recommendationProposalId, canonical.declaredByActorId, canonical.decisionSubjects, canonical.sourceDeclarationClass, canonical.actionIntentClass, canonical.operationDescription, canonical.declaredAt, canonical.actionIntentEvidenceRefs, canonical.schemaVersion];
  return `DAINT_${createHash("sha256").update(stableCareerDecisionActionIntent(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerDecisionActionIntent(value: unknown): asserts value is CareerDecisionActionIntent {
  const captured = exactObject(value, artifactKeys);
  if (!daint.test(captured.careerDecisionActionIntentId as string) || !canonicalTimestamp(captured.createdAt)) error();
  const canonical = semantic(captured, false);
  if (captured.careerDecisionActionIntentId !== deriveCareerDecisionActionIntentId(canonical)) error();
}

export function createCareerDecisionActionIntent(record: HumanDecisionRecord, input: CareerDecisionActionIntentInput): CareerDecisionActionIntent {
  try { assertHumanDecisionRecord(record); } catch { error(); }
  const captured = exactObject(input, inputKeys);
  if (captured.humanDecisionRecordId !== record.humanDecisionRecordId || captured.declaredByActorId !== record.declarantActorId || !canonicalTimestamp(captured.declaredAt) || !canonicalTimestamp(captured.createdAt) || (captured.declaredAt as string) < record.declaredAt) error();
  const canonical = semantic({
    humanDecisionRecordId: record.humanDecisionRecordId,
    careerDecisionContextRevisionId: record.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: record.decisionAuthorityGrantRevisionId,
    recommendationProposalId: record.recommendationProposalId,
    declaredByActorId: captured.declaredByActorId,
    decisionSubjects: record.decisionSubjects,
    sourceDeclarationClass: record.declarationClass,
    actionIntentClass: captured.actionIntentClass,
    operationDescription: captured.operationDescription,
    declaredAt: captured.declaredAt,
    actionIntentEvidenceRefs: captured.actionIntentEvidenceRefs,
    schemaVersion: CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION,
  }, true);
  const artifact: CareerDecisionActionIntent = { careerDecisionActionIntentId: deriveCareerDecisionActionIntentId(canonical), ...canonical, createdAt: captured.createdAt as string };
  assertCareerDecisionActionIntent(artifact);
  return structuredClone(artifact);
}
