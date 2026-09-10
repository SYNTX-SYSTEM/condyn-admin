import { createHash } from "node:crypto";
import {
  assertDecisionAuthorityGrantRevision,
  type DecisionAuthorityGrantRevision,
  type DecisionAuthorityScope,
  type PermittedDecisionClass,
  type PermittedSubjectKind
} from "../decision-authority";
import { assertRecommendationProposal, type RecommendationProposal } from "../recommendation-proposal";
import {
  CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION,
  type CareerDecisionContextRevision,
  type CareerDecisionContextRevisionInput,
  type DecisionSubjectReference
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const invalid = (): never => fail("ERR_CAREER_DECISION_CONTEXT_INVALID");
const revisionKeys = ["careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "contextEvidenceRefs", "authorityScope", "permittedDecisionClasses", "permittedSubjectKinds", "schemaVersion", "createdAt"] as const;
const inputKeys = ["decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "contextEvidenceRefs", "createdAt"] as const;
const semanticKeys = ["decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "contextEvidenceRefs", "authorityScope", "permittedDecisionClasses", "permittedSubjectKinds", "schemaVersion"] as const;
const subjectKeys = ["recommendationProposalId", "sourceEvolutionInputItemOrdinal"] as const;
const idPattern = /^DCTXREV_[0-9A-F]{32}$/;
const darPattern = /^DAR_[0-9A-F]{32}$/;
const rcpPattern = /^RCP_[0-9A-F]{32}$/;
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value === value.trim();
const timestamp = (value: unknown): value is string => {
  if (!text(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
};

function object(value: unknown, keys: readonly string[], code = "ERR_CAREER_DECISION_CONTEXT_INVALID"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  const captured = value as Record<string, unknown>;
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(captured, key))) fail(code);
  return captured;
}

function subjects(value: unknown, allowNormalize: boolean): DecisionSubjectReference[] {
  const source: unknown[] = Array.isArray(value) ? value : fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
  if (source.length === 0) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
  const captured = source.map(item => {
    const subject = object(item, subjectKeys, "ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
    if (!rcpPattern.test(subject.recommendationProposalId as string) || !Number.isSafeInteger(subject.sourceEvolutionInputItemOrdinal) || (subject.sourceEvolutionInputItemOrdinal as number) < 0) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
    return {
      recommendationProposalId: subject.recommendationProposalId as string,
      sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal as number
    };
  });
  const key = (subject: DecisionSubjectReference) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
  if (new Set(captured.map(key)).size !== captured.length) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
  const canonical = [...captured].sort((left, right) => compare(key(left), key(right)));
  if (!allowNormalize && JSON.stringify(captured) !== JSON.stringify(canonical)) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
  return canonical;
}

function evidence(value: unknown, allowNormalize: boolean): string[] {
  const source: unknown[] = Array.isArray(value) ? value : invalid();
  if (source.some(item => !text(item))) invalid();
  const captured = [...source] as string[];
  if (new Set(captured).size !== captured.length) invalid();
  const canonical = [...captured].sort(compare);
  if (!allowNormalize && JSON.stringify(captured) !== JSON.stringify(canonical)) invalid();
  return canonical;
}

function copiedInventory<T extends string>(value: unknown, allowed: readonly T[], allowNormalize: boolean): T[] {
  const source: unknown[] = Array.isArray(value) ? value : invalid();
  if (source.length === 0 || source.some(item => typeof item !== "string" || !allowed.includes(item as T))) invalid();
  const captured = [...source] as T[];
  if (new Set(captured).size !== captured.length) invalid();
  const canonical = [...captured].sort(compare);
  if (!allowNormalize && JSON.stringify(captured) !== JSON.stringify(canonical)) invalid();
  return canonical;
}

function semantic(value: Record<string, unknown>, allowNormalize: boolean) {
  if (!darPattern.test(value.decisionAuthorityGrantRevisionId as string) || !rcpPattern.test(value.recommendationProposalId as string) || value.authorityScope !== "CAREER_RECOMMENDATION_DECISION" || value.schemaVersion !== CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION) invalid();
  const decisionAuthorityGrantRevisionId = value.decisionAuthorityGrantRevisionId as string;
  const recommendationProposalId = value.recommendationProposalId as string;
  const decisionSubjects = subjects(value.decisionSubjects, allowNormalize);
  if (decisionSubjects.some(subject => subject.recommendationProposalId !== recommendationProposalId)) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
  return {
    decisionAuthorityGrantRevisionId,
    recommendationProposalId,
    decisionSubjects,
    contextEvidenceRefs: evidence(value.contextEvidenceRefs, allowNormalize),
    authorityScope: value.authorityScope as DecisionAuthorityScope,
    permittedDecisionClasses: copiedInventory(value.permittedDecisionClasses, ["ACCEPT_RECOMMENDATION", "REJECT_RECOMMENDATION", "DEFER_DECISION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"] as const, allowNormalize) as PermittedDecisionClass[],
    permittedSubjectKinds: copiedInventory(value.permittedSubjectKinds, ["RCP_ITEM"] as const, allowNormalize) as PermittedSubjectKind[],
    schemaVersion: CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION
  };
}

export function stableCareerDecisionContext(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
    : item);
}

export function deriveCareerDecisionContextRevisionId(value: Omit<CareerDecisionContextRevision, "careerDecisionContextRevisionId" | "createdAt">): string {
  const canonical = semantic(object(value, semanticKeys), false);
  const payload = [
    CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION,
    canonical.decisionAuthorityGrantRevisionId,
    canonical.recommendationProposalId,
    canonical.decisionSubjects,
    canonical.contextEvidenceRefs,
    canonical.authorityScope,
    canonical.permittedDecisionClasses,
    canonical.permittedSubjectKinds,
    canonical.schemaVersion
  ];
  return `DCTXREV_${createHash("sha256").update(stableCareerDecisionContext(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function assertCareerDecisionContextRevision(value: unknown): asserts value is CareerDecisionContextRevision {
  const captured = object(value, revisionKeys);
  if (!idPattern.test(captured.careerDecisionContextRevisionId as string) || !timestamp(captured.createdAt)) invalid();
  const canonical = semantic(captured, false);
  if (captured.careerDecisionContextRevisionId !== deriveCareerDecisionContextRevisionId(canonical)) invalid();
}

/** Validates the exact historical DAR/RCP witnesses; this does not evaluate DAR time applicability. */
export function assertCareerDecisionContextWitnesses(value: CareerDecisionContextRevision, authority: DecisionAuthorityGrantRevision, proposal: RecommendationProposal): void {
  assertCareerDecisionContextRevision(value);
  try { assertDecisionAuthorityGrantRevision(authority); } catch { fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_INVALID"); }
  try { assertRecommendationProposal(proposal); } catch { fail("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_INVALID"); }
  if (authority.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId || proposal.recommendationProposalId !== value.recommendationProposalId) invalid();
  if (authority.authorityScope !== "CAREER_RECOMMENDATION_DECISION" || value.authorityScope !== authority.authorityScope) fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_SCOPE_MISMATCH");
  if (!authority.permittedSubjectKinds.includes("RCP_ITEM") || JSON.stringify(value.permittedSubjectKinds) !== JSON.stringify(authority.permittedSubjectKinds) || JSON.stringify(value.permittedDecisionClasses) !== JSON.stringify(authority.permittedDecisionClasses)) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_KIND_MISMATCH");
  if (value.decisionSubjects.some(subject => subject.recommendationProposalId !== proposal.recommendationProposalId || !proposal.items.some(item => item.sourceEvolutionInputItemOrdinal === subject.sourceEvolutionInputItemOrdinal))) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
}

/** Pure construction copies exact DAR witness fields; it neither decides nor selects a recommendation. */
export function createCareerDecisionContextRevision(authority: DecisionAuthorityGrantRevision, proposal: RecommendationProposal, input: CareerDecisionContextRevisionInput): CareerDecisionContextRevision {
  try { assertDecisionAuthorityGrantRevision(authority); } catch { fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_INVALID"); }
  try { assertRecommendationProposal(proposal); } catch { fail("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_INVALID"); }
  const captured = object(input, inputKeys);
  if (!timestamp(captured.createdAt)) invalid();
  if (captured.decisionAuthorityGrantRevisionId !== authority.decisionAuthorityGrantRevisionId) fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_INVALID");
  if (captured.recommendationProposalId !== proposal.recommendationProposalId) fail("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_INVALID");
  if (authority.authorityScope !== "CAREER_RECOMMENDATION_DECISION") fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_SCOPE_MISMATCH");
  if (!authority.permittedSubjectKinds.includes("RCP_ITEM")) fail("ERR_CAREER_DECISION_CONTEXT_SUBJECT_KIND_MISMATCH");
  const canonical = semantic({
    ...captured,
    authorityScope: authority.authorityScope,
    permittedDecisionClasses: authority.permittedDecisionClasses,
    permittedSubjectKinds: authority.permittedSubjectKinds,
    schemaVersion: CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION
  }, true);
  const revision: CareerDecisionContextRevision = {
    careerDecisionContextRevisionId: deriveCareerDecisionContextRevisionId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string
  };
  assertCareerDecisionContextWitnesses(revision, authority, proposal);
  return structuredClone(revision);
}

export function sameCareerDecisionContext(left: unknown, right: unknown): boolean {
  try {
    assertCareerDecisionContextRevision(left);
    assertCareerDecisionContextRevision(right);
    return stableCareerDecisionContext(left) === stableCareerDecisionContext(right);
  } catch {
    return false;
  }
}
