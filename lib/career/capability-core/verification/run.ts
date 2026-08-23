import { isDeepStrictEqual } from "util";
import { sha256Utf8 } from "../hashing";
import type { CapabilityCoreRepository } from "../repository";
import { normalizeSourceText, type SourceDocument } from "../source";
import { CapabilityVerificationRunIdentitySchema } from "./schema";
import type { CapabilityVerificationRun, CapabilityVerificationRunIdentityInput } from "./types";

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const integrityError = (): never => { throw new Error("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID"); };
const levels = new Set(["L1", "L2", "L3", "L4", "L5", "L6"]);

export function stableVerificationJsonStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableVerificationJsonStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return `{${Object.keys(item).sort(compare).map((key) => `${JSON.stringify(key)}:${stableVerificationJsonStringify(item[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Source bundles preserve Phase 1-3 identity; this separate hash binds the source fields evidence resolution observes. */
export function computeSourceEvidenceRepresentationHash(documents: SourceDocument[]): string {
  const documentIds = new Set<string>();
  const canonical = [...documents].sort((left, right) => compare(left.docId, right.docId)).map((document) => {
    if (!document.docId.trim() || documentIds.has(document.docId) || sha256Utf8(document.normalizedText) !== document.normalizedTextHash) integrityError();
    documentIds.add(document.docId);
    const pageNumbers = new Set<number>();
    const pages = [...(document.pages ?? [])].sort((left, right) => left.pageNumber - right.pageNumber).map((page) => {
      if (pageNumbers.has(page.pageNumber) || page.normalizedText !== normalizeSourceText(page.text)) integrityError();
      pageNumbers.add(page.pageNumber);
      return [page.pageNumber, sha256Utf8(page.normalizedText)];
    });
    return {
      docId: document.docId,
      title: document.title,
      normalizedTextHash: document.normalizedTextHash,
      pagesPresent: document.pages !== undefined,
      pages
    };
  });
  return sha256Utf8(stableVerificationJsonStringify(canonical));
}

export function computeCapabilityVerificationRunKey(input: CapabilityVerificationRunIdentityInput): string {
  return sha256Utf8(stableVerificationJsonStringify([input.convergenceRunId, input.convergenceRawOutputHash, input.sourceEvidenceRepresentationHash, input.kernelVersion, input.promptChecksum, input.provider, input.model, input.schemaVersion, input.algorithmVersion, input.snapshotSchemaVersion]));
}

/** VFY identifies verification configuration and authenticated upstream identity, not timestamps or mutable output. */
export function buildCapabilityVerificationRunId(input: CapabilityVerificationRunIdentityInput): string {
  return `VFY_${computeCapabilityVerificationRunKey(input).slice(0, 24).toUpperCase()}`;
}

type VerificationPayload = CapabilityVerificationRun["payload"];

function stringId(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function hasExactKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  const actualKeys = value && typeof value === "object" && !Array.isArray(value) ? Reflect.ownKeys(value) : [];
  return actualKeys.length === keys.length && actualKeys.every((key) => typeof key === "string" && keys.includes(key));
}

/** Sorting arrays before hashing makes the payload hash independent of incidental construction order. */
export function canonicalizeCapabilityVerificationPayload(payload: VerificationPayload): VerificationPayload {
  if (!hasExactKeys(payload, ["semanticDefinitionOutcomes", "demonstratedLevelOutcomes", "relationDispositions", "publicationEligibility"]) || !Array.isArray(payload.semanticDefinitionOutcomes) || !Array.isArray(payload.demonstratedLevelOutcomes) || !Array.isArray(payload.relationDispositions) || (payload.publicationEligibility !== "ELIGIBLE" && payload.publicationEligibility !== "BLOCKED")) integrityError();
  const semanticDefinitionOutcomes = payload.semanticDefinitionOutcomes.map((outcome) => {
    if (!hasExactKeys(outcome, ["provisionalCapabilityId", "status"]) || !stringId(outcome.provisionalCapabilityId) || (outcome.status !== "PASSED" && outcome.status !== "FAILED")) integrityError();
    return { provisionalCapabilityId: outcome.provisionalCapabilityId, status: outcome.status };
  }).sort((left, right) => compare(left.provisionalCapabilityId, right.provisionalCapabilityId));
  const demonstratedLevelOutcomes = payload.demonstratedLevelOutcomes.map((outcome) => {
    if (!hasExactKeys(outcome, ["provisionalCapabilityId", "status", "demonstratedCapabilityLevel"]) || !stringId(outcome.provisionalCapabilityId) || (outcome.status !== "VERIFIED" && outcome.status !== "UNVERIFIED")) integrityError();
    const validLevel = typeof outcome.demonstratedCapabilityLevel === "string" && levels.has(outcome.demonstratedCapabilityLevel);
    if ((outcome.status === "VERIFIED" && !validLevel) || (outcome.status === "UNVERIFIED" && outcome.demonstratedCapabilityLevel !== null)) integrityError();
    return { provisionalCapabilityId: outcome.provisionalCapabilityId, status: outcome.status, demonstratedCapabilityLevel: outcome.demonstratedCapabilityLevel };
  }).sort((left, right) => compare(left.provisionalCapabilityId, right.provisionalCapabilityId));
  const relationDispositions = payload.relationDispositions.map((disposition) => {
    if (!hasExactKeys(disposition, ["relationId", "status"]) || !stringId(disposition.relationId) || (disposition.status !== "VERIFIED" && disposition.status !== "REJECTED" && disposition.status !== "UNRESOLVED")) integrityError();
    return { relationId: disposition.relationId, status: disposition.status };
  }).sort((left, right) => compare(left.relationId, right.relationId));
  return { semanticDefinitionOutcomes, demonstratedLevelOutcomes, relationDispositions, publicationEligibility: payload.publicationEligibility };
}

export function assertCanonicalCapabilityVerificationPayload(payload: VerificationPayload): void {
  const canonical = canonicalizeCapabilityVerificationPayload(payload);
  const ordered = (actual: Array<{ provisionalCapabilityId?: string; relationId?: string }>, expected: Array<{ provisionalCapabilityId?: string; relationId?: string }>) => actual.length === expected.length && actual.every((item, index) => item.provisionalCapabilityId === expected[index].provisionalCapabilityId && item.relationId === expected[index].relationId);
  if (!ordered(payload.semanticDefinitionOutcomes, canonical.semanticDefinitionOutcomes) || !ordered(payload.demonstratedLevelOutcomes, canonical.demonstratedLevelOutcomes) || !ordered(payload.relationDispositions, canonical.relationDispositions)) integrityError();
}

export function computeCapabilityVerificationRawOutputHash(payload: VerificationPayload): string {
  return sha256Utf8(stableVerificationJsonStringify(canonicalizeCapabilityVerificationPayload(payload)));
}

export function assertPersistableCapabilityVerificationRun(run: CapabilityVerificationRun): void {
  if (!hasExactKeys(run, ["runKind", "verificationRunId", "convergenceRunId", "convergenceRawOutputHash", "sourceEvidenceRepresentationHash", "sourceBundleHash", "kernelVersion", "promptChecksum", "inference", "schemaVersion", "algorithmVersion", "snapshotSchemaVersion", "rawOutputHash", "status", "payload", "createdAt", "completedAt"]) || !hasExactKeys(run.inference, ["provider", "model"]) || !stringId(run.inference.provider) || !stringId(run.inference.model) || run.runKind !== "CAPABILITY_VERIFICATION" || run.status !== "COMPLETED" || !stringId(run.sourceBundleHash) || !stringId(run.createdAt) || !stringId(run.completedAt) || !/^[0-9a-f]{64}$/.test(run.sourceEvidenceRepresentationHash) || !/^[0-9a-f]{64}$/.test(run.convergenceRawOutputHash) || !/^[0-9a-f]{64}$/.test(run.rawOutputHash) || !/^VFY_[0-9A-F]{24}$/.test(run.verificationRunId)) integrityError();
  const identity: CapabilityVerificationRunIdentityInput = { convergenceRunId: run.convergenceRunId, convergenceRawOutputHash: run.convergenceRawOutputHash, sourceEvidenceRepresentationHash: run.sourceEvidenceRepresentationHash, kernelVersion: run.kernelVersion, promptChecksum: run.promptChecksum, provider: run.inference?.provider, model: run.inference?.model, schemaVersion: run.schemaVersion, algorithmVersion: run.algorithmVersion, snapshotSchemaVersion: run.snapshotSchemaVersion };
  if (!CapabilityVerificationRunIdentitySchema.safeParse(identity).success || buildCapabilityVerificationRunId(identity) !== run.verificationRunId) integrityError();
  assertCanonicalCapabilityVerificationPayload(run.payload);
  if (computeCapabilityVerificationRawOutputHash(run.payload) !== run.rawOutputHash) integrityError();
}

/** Only the immutable repository artifact may authorize later publication. */
export async function requireAuthoritativePersistedCapabilityVerificationRun(
  suppliedRun: CapabilityVerificationRun,
  repository: Pick<CapabilityCoreRepository, "getVerificationRunById">
): Promise<CapabilityVerificationRun> {
  assertPersistableCapabilityVerificationRun(suppliedRun);
  const persistedRun = await repository.getVerificationRunById(suppliedRun.verificationRunId);
  if (!persistedRun) integrityError();
  assertPersistableCapabilityVerificationRun(persistedRun);
  if (!isDeepStrictEqual(suppliedRun, persistedRun)) integrityError();
  return structuredClone(persistedRun);
}
