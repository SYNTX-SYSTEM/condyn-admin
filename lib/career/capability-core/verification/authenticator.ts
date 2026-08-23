import { isDeepStrictEqual } from "util";
import { canonicalizeCapabilityConvergence } from "../convergence/canonicalizer";
import { compareCapabilityConvergenceStrings } from "../convergence/ordering";
import { buildCapabilityConvergenceRunId, stableConvergenceJsonStringify } from "../convergence/run";
import { CapabilityConvergenceOutputSchema } from "../convergence/schema";
import type { CapabilityConvergenceRun } from "../convergence/types";
import { validateCapabilityConvergenceOutput } from "../convergence/validator";
import { assertCapabilityCoverageAudit } from "../discovery/coverage-validator";
import { buildCapabilityDiscoveryRunId, stableJsonStringify } from "../discovery/run";
import { computeSourceBundleHash, sha256Utf8 } from "../hashing";
import { CapabilityKernelOutputSchema, createCapabilityCandidate, type CapabilityCandidate, type CapabilityDiscoveryRun, type EvidenceClaim } from "../schema";
import { type SourceDocument } from "../source";
import { verifyCandidateEvidence } from "../evidence-validator";
import { assertPersistableCapabilityVerificationRun, assertCanonicalCapabilityVerificationPayload, computeSourceEvidenceRepresentationHash, requireAuthoritativePersistedCapabilityVerificationRun } from "./run";
import type { AuthenticatedCapabilityVerificationChain, AuthoritativeCapabilityVerificationChain, CapabilityVerificationAuthorityDependencies, CapabilityVerificationIntegrityInput, CapabilityVerificationRun } from "./types";

const compare = compareCapabilityConvergenceStrings;
const integrityError = (): never => { throw new Error("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID"); };
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const hasOnlyKeys = (value: unknown, allowed: readonly string[], required: readonly string[] = allowed): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const keys = Reflect.ownKeys(value);
  return keys.every((key) => typeof key === "string" && allowed.includes(key))
    && required.every((key) => Object.prototype.hasOwnProperty.call(value, key));
};

function assertPromptAndInference(prompt: unknown, inference: unknown): void {
  if (!hasOnlyKeys(prompt, ["templateId", "versionId", "checksum"], ["checksum"])
    || !isNonEmptyString(prompt.checksum)
    || (prompt.templateId !== undefined && typeof prompt.templateId !== "string")
    || (prompt.versionId !== undefined && typeof prompt.versionId !== "string")
    || !hasOnlyKeys(inference, ["provider", "model"])
    || !isNonEmptyString(inference.provider)
    || !isNonEmptyString(inference.model)) integrityError();
}

function authenticateSources(documents: SourceDocument[]): { sourceBundleHash: string; sourceEvidenceRepresentationHash: string } {
  if (!Array.isArray(documents)) integrityError();
  const docIds = new Set<string>();
  for (const document of documents) {
    if (!isRecord(document) || typeof document.docId !== "string" || !document.docId.trim() || docIds.has(document.docId) || typeof document.title !== "string" || !document.title.trim() || typeof document.normalizedText !== "string" || typeof document.normalizedTextHash !== "string" || sha256Utf8(document.normalizedText) !== document.normalizedTextHash || (document.pages !== undefined && !Array.isArray(document.pages))) integrityError();
    docIds.add(document.docId);
    for (const page of document.pages ?? []) if (!isRecord(page) || !Number.isInteger(page.pageNumber) || typeof page.text !== "string" || typeof page.normalizedText !== "string") integrityError();
  }
  try {
    return { sourceBundleHash: computeSourceBundleHash(documents), sourceEvidenceRepresentationHash: computeSourceEvidenceRepresentationHash(documents) };
  } catch {
    return integrityError();
  }
}

function authenticateDiscovery(run: CapabilityDiscoveryRun, sourceDocuments: SourceDocument[], sourceBundleHash: string): CapabilityCandidate[] {
  if (!hasOnlyKeys(run, ["runId", "sourceBundleHash", "kernelVersion", "prompt", "inference", "schemaVersion", "status", "rawOutputHash", "payload", "createdAt", "completedAt"])
    || run.status !== "COMPLETED" || run.sourceBundleHash !== sourceBundleHash
    || !isNonEmptyString(run.sourceBundleHash) || !isNonEmptyString(run.kernelVersion)
    || !isNonEmptyString(run.schemaVersion) || !isNonEmptyString(run.createdAt) || !isNonEmptyString(run.completedAt)
    || !hasOnlyKeys(run.payload, ["kernelOutput", "candidates", "coverageValidation"])) integrityError();
  assertPromptAndInference(run.prompt, run.inference);
  const payload = run.payload as { kernelOutput?: unknown; candidates?: unknown; coverageValidation?: unknown };
  if (!Array.isArray(payload.candidates) || !isDeepStrictEqual(payload.coverageValidation, { status: "PASSED" })) integrityError();
  let kernelOutput;
  try { kernelOutput = CapabilityKernelOutputSchema.parse(payload.kernelOutput); } catch { return integrityError(); }
  assertCapabilityCoverageAudit(kernelOutput, sourceDocuments.length);
  if (kernelOutput.kernel_version !== run.kernelVersion || typeof run.rawOutputHash !== "string" || sha256Utf8(stableJsonStringify(kernelOutput)) !== run.rawOutputHash) integrityError();
  const expectedRunId = buildCapabilityDiscoveryRunId({ sourceBundleHash, kernelVersion: run.kernelVersion, promptChecksum: run.prompt?.checksum, provider: run.inference?.provider, model: run.inference?.model, schemaVersion: run.schemaVersion });
  if (expectedRunId !== run.runId) integrityError();
  const candidates = kernelOutput.capabilities.map((capability) => verifyCandidateEvidence(createCapabilityCandidate(run.runId, capability), sourceDocuments));
  if (!isDeepStrictEqual(payload.candidates, candidates)) integrityError();
  return candidates;
}

function authenticateConvergence(run: CapabilityConvergenceRun, discoveryRun: CapabilityDiscoveryRun, candidates: CapabilityCandidate[], sourceBundleHash: string): { canonicalDrafts: AuthenticatedCapabilityVerificationChain["canonicalDrafts"]; proposedRelations: AuthenticatedCapabilityVerificationChain["proposedRelations"] } {
  if (!hasOnlyKeys(run, ["runKind", "convergenceRunId", "discoveryRunId", "discoveryRawOutputHash", "sourceBundleHash", "kernelVersion", "prompt", "inference", "schemaVersion", "algorithmVersion", "status", "rawOutputHash", "payload", "createdAt", "completedAt"])
    || run.runKind !== "CAPABILITY_CONVERGENCE" || run.status !== "COMPLETED"
    || run.discoveryRunId !== discoveryRun.runId || run.discoveryRawOutputHash !== discoveryRun.rawOutputHash
    || run.sourceBundleHash !== sourceBundleHash
    || !isNonEmptyString(run.sourceBundleHash) || !isNonEmptyString(run.kernelVersion)
    || !isNonEmptyString(run.schemaVersion) || !isNonEmptyString(run.algorithmVersion)
    || !isNonEmptyString(run.createdAt) || !isNonEmptyString(run.completedAt)
    || !hasOnlyKeys(run.payload, ["convergenceOutput", "canonicalDrafts", "proposedRelations", "eligibleCandidateIds", "excludedCandidateIds", "reconciliation"])) integrityError();
  assertPromptAndInference(run.prompt, run.inference);
  const expectedRunId = buildCapabilityConvergenceRunId({ discoveryRunId: discoveryRun.runId, discoveryRawOutputHash: discoveryRun.rawOutputHash!, kernelVersion: run.kernelVersion, promptChecksum: run.prompt?.checksum, provider: run.inference?.provider, model: run.inference?.model, schemaVersion: run.schemaVersion, algorithmVersion: run.algorithmVersion });
  if (expectedRunId !== run.convergenceRunId) integrityError();
  let output;
  try { output = CapabilityConvergenceOutputSchema.parse(run.payload.convergenceOutput); } catch { return integrityError(); }
  if (output.convergence_version !== run.kernelVersion || sha256Utf8(stableConvergenceJsonStringify(output)) !== run.rawOutputHash) integrityError();
  let validated; let canonical;
  try {
    validated = validateCapabilityConvergenceOutput(output, candidates);
    canonical = canonicalizeCapabilityConvergence(validated, candidates, run.createdAt);
  } catch {
    return integrityError();
  }
  const eligibleCandidateIds = candidates.filter((candidate) => candidate.status === "EVIDENCE_PASSED").map((candidate) => candidate.candidateId).sort(compare);
  const excludedCandidateIds = candidates.filter((candidate) => candidate.status === "EVIDENCE_REJECTED").map((candidate) => candidate.candidateId).sort(compare);
  if (!isDeepStrictEqual(run.payload.canonicalDrafts, canonical.canonicalDrafts) || !isDeepStrictEqual(run.payload.proposedRelations, canonical.proposedRelations) || !isDeepStrictEqual(run.payload.eligibleCandidateIds, eligibleCandidateIds) || !isDeepStrictEqual(run.payload.excludedCandidateIds, excludedCandidateIds) || !isDeepStrictEqual(run.payload.reconciliation, { status: "PASSED" })) integrityError();
  return canonical;
}

function assertVerificationCoverage(run: CapabilityVerificationRun, canonicalDrafts: AuthenticatedCapabilityVerificationChain["canonicalDrafts"], proposedRelations: AuthenticatedCapabilityVerificationChain["proposedRelations"]): void {
  assertCanonicalCapabilityVerificationPayload(run.payload);
  const exactCoverage = (actual: Array<{ provisionalCapabilityId?: string; relationId?: string }>, expectedIds: string[], field: "provisionalCapabilityId" | "relationId") => {
    const ids = actual.map((item) => item[field]);
    if (ids.length !== expectedIds.length || new Set(ids).size !== ids.length || ids.some((id) => typeof id !== "string" || !expectedIds.includes(id))) integrityError();
  };
  const draftIds = canonicalDrafts.map((draft) => draft.provisionalCapabilityId);
  exactCoverage(run.payload.semanticDefinitionOutcomes, draftIds, "provisionalCapabilityId");
  exactCoverage(run.payload.demonstratedLevelOutcomes, draftIds, "provisionalCapabilityId");
  exactCoverage(run.payload.relationDispositions, proposedRelations.map((relation) => relation.relationId), "relationId");
}

/** Call only after coverage validation; eligibility is deterministic rather than provider-authored. */
export function deriveCapabilityVerificationPublicationEligibility(payload: CapabilityVerificationRun["payload"]): "ELIGIBLE" | "BLOCKED" {
  assertCanonicalCapabilityVerificationPayload(payload);
  return payload.semanticDefinitionOutcomes.every((outcome) => outcome.status === "PASSED") && payload.relationDispositions.every((disposition) => disposition.status !== "UNRESOLVED") ? "ELIGIBLE" : "BLOCKED";
}

function reconstructVerifiedEvidence(canonicalDrafts: AuthenticatedCapabilityVerificationChain["canonicalDrafts"], candidates: CapabilityCandidate[]): EvidenceClaim[] {
  const verifiedById = new Map<string, EvidenceClaim>();
  for (const claim of candidates.flatMap((candidate) => candidate.evidenceClaims).filter((claim) => claim.verification.status === "VERIFIED")) {
    const existing = verifiedById.get(claim.evidenceId);
    if (existing !== undefined && !isDeepStrictEqual(existing, claim)) integrityError();
    verifiedById.set(claim.evidenceId, claim);
  }
  const evidence: EvidenceClaim[] = []; const included = new Set<string>();
  for (const draft of canonicalDrafts) for (const evidenceId of draft.evidenceIds) {
    const claim = verifiedById.get(evidenceId);
    if (claim === undefined) return integrityError();
    if (!included.has(evidenceId)) { evidence.push(structuredClone(claim)); included.add(evidenceId); }
  }
  return evidence;
}

export async function authenticateCapabilityVerificationRun(input: CapabilityVerificationIntegrityInput): Promise<AuthenticatedCapabilityVerificationChain> {
  try {
    const source = authenticateSources(input.sourceDocuments);
    if (input.discoveryRun.sourceBundleHash !== source.sourceBundleHash || input.convergenceRun.sourceBundleHash !== source.sourceBundleHash || input.verificationRun.sourceBundleHash !== source.sourceBundleHash || input.verificationRun.sourceEvidenceRepresentationHash !== source.sourceEvidenceRepresentationHash) integrityError();
    const candidates = authenticateDiscovery(input.discoveryRun, input.sourceDocuments, source.sourceBundleHash);
    const canonical = authenticateConvergence(input.convergenceRun, input.discoveryRun, candidates, source.sourceBundleHash);
    assertPersistableCapabilityVerificationRun(input.verificationRun);
    if (input.verificationRun.convergenceRunId !== input.convergenceRun.convergenceRunId || input.verificationRun.convergenceRawOutputHash !== input.convergenceRun.rawOutputHash) integrityError();
    assertVerificationCoverage(input.verificationRun, canonical.canonicalDrafts, canonical.proposedRelations);
    if (input.verificationRun.payload.publicationEligibility !== deriveCapabilityVerificationPublicationEligibility(input.verificationRun.payload)) integrityError();
    return {
      sourceBundleHash: source.sourceBundleHash,
      sourceEvidenceRepresentationHash: source.sourceEvidenceRepresentationHash,
      discoveryRun: structuredClone(input.discoveryRun),
      discoveryCandidates: structuredClone(candidates),
      convergenceRun: structuredClone(input.convergenceRun),
      canonicalDrafts: structuredClone(canonical.canonicalDrafts),
      proposedRelations: structuredClone(canonical.proposedRelations),
      verificationRun: structuredClone(input.verificationRun),
      verifiedEvidence: reconstructVerifiedEvidence(canonical.canonicalDrafts, candidates),
      candidateCount: candidates.length,
      rejectedCandidateCount: candidates.filter((candidate) => candidate.status === "EVIDENCE_REJECTED").length,
      snapshotSchemaVersion: input.verificationRun.snapshotSchemaVersion
    };
  } catch {
    return integrityError();
  }
}

export async function authenticatePersistedCapabilityVerificationRun(
  input: CapabilityVerificationIntegrityInput,
  repository: CapabilityVerificationAuthorityDependencies["repository"]
): Promise<AuthoritativeCapabilityVerificationChain> {
  const authenticated = await authenticateCapabilityVerificationRun(input);
  const persistedDiscoveryRun = await repository.getRunById(authenticated.discoveryRun.runId);
  const persistedConvergenceRun = await repository.getConvergenceRunById(authenticated.convergenceRun.convergenceRunId);
  if (persistedDiscoveryRun === null) return integrityError();
  if (persistedConvergenceRun === null) return integrityError();
  if (!isDeepStrictEqual(persistedDiscoveryRun, authenticated.discoveryRun)
    || !isDeepStrictEqual(persistedConvergenceRun, authenticated.convergenceRun)) integrityError();
  const persistedVerificationRun = await requireAuthoritativePersistedCapabilityVerificationRun(authenticated.verificationRun, repository);
  if (!isDeepStrictEqual(persistedVerificationRun, authenticated.verificationRun)) integrityError();
  // RUN_/CONV_ identities omit timestamps; reconstruction proves consistency while immutable
  // persistence selects the one authoritative state, including convergence-created artifacts.
  return {
    ...authenticated,
    discoveryRun: structuredClone(persistedDiscoveryRun),
    convergenceRun: structuredClone(persistedConvergenceRun),
    verificationRun: structuredClone(persistedVerificationRun)
  };
}
