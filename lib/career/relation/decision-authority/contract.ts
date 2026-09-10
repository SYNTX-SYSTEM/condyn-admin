import { createHash } from "node:crypto";
import {
  DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION,
  type DecisionAuthorityGrantRevision,
  type DecisionAuthorityGrantRevisionInput,
  type DecisionAuthorityScope,
  type PermittedDecisionClass,
  type PermittedSubjectKind
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const invalid = (): never => fail("ERR_DECISION_AUTHORITY_GRANT_INVALID");
const scope: readonly DecisionAuthorityScope[] = ["CAREER_RECOMMENDATION_DECISION"];
const classes: readonly PermittedDecisionClass[] = ["ACCEPT_RECOMMENDATION", "REJECT_RECOMMENDATION", "DEFER_DECISION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"];
const subjects: readonly PermittedSubjectKind[] = ["RCP_ITEM"];
const revisionKeys = ["decisionAuthorityGrantRevisionId", "grantorActorId", "authorizedActorId", "authorityScope", "permittedDecisionClasses", "permittedSubjectKinds", "authorityEvidenceRefs", "declaredAt", "effectiveFrom", "effectiveUntil", "schemaVersion", "createdAt"] as const;
const inputKeys = ["grantorActorId", "authorizedActorId", "authorityScope", "permittedDecisionClasses", "permittedSubjectKinds", "authorityEvidenceRefs", "declaredAt", "effectiveFrom", "effectiveUntil", "createdAt"] as const;
const semanticKeys = ["grantorActorId", "authorizedActorId", "authorityScope", "permittedDecisionClasses", "permittedSubjectKinds", "authorityEvidenceRefs", "declaredAt", "effectiveFrom", "effectiveUntil", "schemaVersion"] as const;
const idPattern = /^DAR_[0-9A-F]{32}$/;

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value === value.trim();
const timestamp = (value: unknown): value is string => {
  if (!text(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
};

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid();
  const captured = value as Record<string, unknown>;
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(captured, key))) invalid();
  return captured;
}

function inventory<T extends string>(value: unknown, allowed: readonly T[], allowNormalize: boolean): T[] {
  const source: unknown[] = Array.isArray(value) ? value : invalid();
  if (source.length === 0 || source.some(item => typeof item !== "string" || !allowed.includes(item as T))) invalid();
  const result = [...source] as T[];
  if (new Set(result).size !== result.length) invalid();
  const ordered = [...result].sort(compare);
  if (!allowNormalize && JSON.stringify(result) !== JSON.stringify(ordered)) invalid();
  return ordered;
}

function evidence(value: unknown, allowNormalize: boolean): string[] {
  const source: unknown[] = Array.isArray(value) ? value : invalid();
  if (source.length === 0 || source.some(item => !text(item))) invalid();
  const result = [...source] as string[];
  if (new Set(result).size !== result.length) invalid();
  const ordered = [...result].sort(compare);
  if (!allowNormalize && JSON.stringify(result) !== JSON.stringify(ordered)) invalid();
  return ordered;
}

function semantic(value: Record<string, unknown>, allowNormalize: boolean) {
  const grantorActorId = value.grantorActorId;
  const authorizedActorId = value.authorizedActorId;
  const authorityScope = value.authorityScope;
  const declaredAt = value.declaredAt;
  const effectiveFrom = value.effectiveFrom;
  const effectiveUntil = value.effectiveUntil;
  const schemaVersion = value.schemaVersion;
  if (!text(grantorActorId) || !text(authorizedActorId) || grantorActorId === authorizedActorId || !scope.includes(authorityScope as DecisionAuthorityScope) || !timestamp(declaredAt) || !timestamp(effectiveFrom) || (effectiveUntil !== null && !timestamp(effectiveUntil)) || schemaVersion !== DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION) invalid();
  const grantor = grantorActorId as string;
  const authorized = authorizedActorId as string;
  const declared = declaredAt as string;
  const from = effectiveFrom as string;
  const until = effectiveUntil as string | null;
  if (until !== null && new Date(until).getTime() <= new Date(from).getTime()) invalid();
  return {
    grantorActorId: grantor,
    authorizedActorId: authorized,
    authorityScope: authorityScope as DecisionAuthorityScope,
    permittedDecisionClasses: inventory(value.permittedDecisionClasses, classes, allowNormalize),
    permittedSubjectKinds: inventory(value.permittedSubjectKinds, subjects, allowNormalize),
    authorityEvidenceRefs: evidence(value.authorityEvidenceRefs, allowNormalize),
    declaredAt: declared,
    effectiveFrom: from,
    effectiveUntil: until,
    schemaVersion: DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION
  };
}

export function stableDecisionAuthorityGrant(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item as Record<string, unknown>).sort(compare).map(key => [key, (item as Record<string, unknown>)[key]]))
    : item);
}

export function deriveDecisionAuthorityGrantRevisionId(value: Omit<DecisionAuthorityGrantRevision, "decisionAuthorityGrantRevisionId" | "createdAt">): string {
  const canonical = semantic(object(value, semanticKeys), false);
  const payload = [
    DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION,
    canonical.grantorActorId,
    canonical.authorizedActorId,
    canonical.authorityScope,
    canonical.permittedDecisionClasses,
    canonical.permittedSubjectKinds,
    canonical.authorityEvidenceRefs,
    canonical.declaredAt,
    canonical.effectiveFrom,
    canonical.effectiveUntil,
    canonical.schemaVersion
  ];
  return `DAR_${createHash("sha256").update(stableDecisionAuthorityGrant(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

/** Creates a detached canonical declaration; no organizational truth is inferred. */
export function createDecisionAuthorityGrantRevision(input: DecisionAuthorityGrantRevisionInput): DecisionAuthorityGrantRevision {
  const captured = object(input, inputKeys);
  if (!timestamp(captured.createdAt)) invalid();
  const canonical = semantic({ ...captured, schemaVersion: DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION }, true);
  const revision: DecisionAuthorityGrantRevision = {
    decisionAuthorityGrantRevisionId: deriveDecisionAuthorityGrantRevisionId(canonical),
    ...canonical,
    createdAt: captured.createdAt as string
  };
  assertDecisionAuthorityGrantRevision(revision);
  return structuredClone(revision);
}

export function assertDecisionAuthorityGrantRevision(value: unknown): asserts value is DecisionAuthorityGrantRevision {
  const captured = object(value, revisionKeys);
  if (!idPattern.test(captured.decisionAuthorityGrantRevisionId as string) || !timestamp(captured.createdAt)) invalid();
  const canonical = semantic(captured, false);
  const expected = deriveDecisionAuthorityGrantRevisionId(canonical);
  if (captured.decisionAuthorityGrantRevisionId !== expected) invalid();
}

export function sameDecisionAuthorityGrant(left: unknown, right: unknown): boolean {
  try {
    assertDecisionAuthorityGrantRevision(left);
    assertDecisionAuthorityGrantRevision(right);
    return stableDecisionAuthorityGrant(left) === stableDecisionAuthorityGrant(right);
  } catch {
    return false;
  }
}
