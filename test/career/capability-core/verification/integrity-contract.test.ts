import { describe, expect, it } from "vitest";
import * as verification from "../../../../lib/career/capability-core/verification";
import { buildCapabilityConvergenceRunId, buildCapabilityDiscoveryRunId, canonicalizeCapabilityConvergence, computeSourceBundleHash, createCapabilityCandidate, createSourceDocument, normalizeSourceText, sha256Utf8, stableConvergenceJsonStringify, stableJsonStringify, validateCapabilityConvergenceOutput, verifyCandidateEvidence, type CapabilityConvergenceRun, type CapabilityDiscoveryRun, type CapabilityKernelOutput, type SourceDocument } from "../../../../lib/career/capability-core";
import type { AuthenticatedCapabilityVerificationChain, CapabilityVerificationAuthorityDependencies, CapabilityVerificationIntegrityInput, CapabilityVerificationRun, VerifiedCapabilitySnapshotPublisher } from "../../../../lib/career/capability-core/verification";

type IntegrityInputHasNoRepository = "repository" extends keyof CapabilityVerificationIntegrityInput ? false : true;
type FinalPublisherIsAsync = ReturnType<VerifiedCapabilitySnapshotPublisher["publish"]> extends Promise<unknown> ? true : false;
const integrityInputHasNoRepository: IntegrityInputHasNoRepository = true;
const finalPublisherIsAsync: FinalPublisherIsAsync = true;

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const stableVerificationJsonStringify = (value: unknown): string => Array.isArray(value) ? `[${value.map(stableVerificationJsonStringify).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value as Record<string, unknown>).sort(compare).map((key) => `${JSON.stringify(key)}:${stableVerificationJsonStringify((value as Record<string, unknown>)[key])}`).join(",")}}` : JSON.stringify(value);
const canonicalPayload = (payload: CapabilityVerificationRun["payload"]) => ({
  semanticDefinitionOutcomes: [...payload.semanticDefinitionOutcomes].sort((left, right) => compare(left.provisionalCapabilityId, right.provisionalCapabilityId)),
  demonstratedLevelOutcomes: [...payload.demonstratedLevelOutcomes].sort((left, right) => compare(left.provisionalCapabilityId, right.provisionalCapabilityId)),
  relationDispositions: [...payload.relationDispositions].sort((left, right) => compare(left.relationId, right.relationId)),
  publicationEligibility: payload.publicationEligibility
});
const expectedSourceEvidenceRepresentationHash = (documents: SourceDocument[]) => {
  const documentIds = new Set<string>();
  const canonical = [...documents].sort((left, right) => compare(left.docId, right.docId)).map((document) => {
    if (documentIds.has(document.docId) || sha256Utf8(document.normalizedText) !== document.normalizedTextHash) throw new Error("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
    documentIds.add(document.docId);
    const pageNumbers = new Set<number>();
    const pages = [...(document.pages ?? [])].sort((left, right) => left.pageNumber - right.pageNumber).map((page) => {
      if (pageNumbers.has(page.pageNumber) || page.normalizedText !== normalizeSourceText(page.text)) throw new Error("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
      pageNumbers.add(page.pageNumber); return [page.pageNumber, sha256Utf8(page.normalizedText)];
    });
    return { docId: document.docId, title: document.title, normalizedTextHash: document.normalizedTextHash, pagesPresent: document.pages !== undefined, pages };
  });
  return sha256Utf8(stableVerificationJsonStringify(canonical));
};
const verificationIdentity = (run: CapabilityVerificationRun) => ({ convergenceRunId: run.convergenceRunId, convergenceRawOutputHash: run.convergenceRawOutputHash, sourceEvidenceRepresentationHash: run.sourceEvidenceRepresentationHash, kernelVersion: run.kernelVersion, promptChecksum: run.promptChecksum, provider: run.inference.provider, model: run.inference.model, schemaVersion: run.schemaVersion, algorithmVersion: run.algorithmVersion, snapshotSchemaVersion: run.snapshotSchemaVersion });
const verificationIdentityValues = (run: CapabilityVerificationRun) => [run.convergenceRunId, run.convergenceRawOutputHash, run.sourceEvidenceRepresentationHash, run.kernelVersion, run.promptChecksum, run.inference.provider, run.inference.model, run.schemaVersion, run.algorithmVersion, run.snapshotSchemaVersion];
const expectedVerificationRunId = (run: CapabilityVerificationRun) => `VFY_${sha256Utf8(stableVerificationJsonStringify(verificationIdentityValues(run))).slice(0, 24).toUpperCase()}`;

function authenticatedFixture(): CapabilityVerificationIntegrityInput {
  const sourceDocuments = [createSourceDocument({ docId: "DOC_A", title: "Source", rawContent: "Proof" })];
  const sourceBundleHash = computeSourceBundleHash(sourceDocuments);
  const sourceEvidenceRepresentationHash = expectedSourceEvidenceRepresentationHash(sourceDocuments);
  const kernelOutput: CapabilityKernelOutput = { kernel_version: "discovery-v1", capabilities: [{ canonical_name: "Capability", capability_scope: "ATOMIC", structural_definition: "Definition", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT", evidence: [{ source_document: "DOC_A", location: "source", exact_quote: "Proof" }] }], coverage_audit: { source_documents_examined: 1, capability_count: 1, atomic_capability_count: 1, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 } };
  const discoveryIdentity = { sourceBundleHash, kernelVersion: "discovery-v1", promptChecksum: "discovery-prompt", provider: "gemini", model: "discovery-model", schemaVersion: "discovery-schema" };
  const runId = buildCapabilityDiscoveryRunId(discoveryIdentity);
  const candidate = verifyCandidateEvidence(createCapabilityCandidate(runId, kernelOutput.capabilities[0]), sourceDocuments);
  const discoveryRun: CapabilityDiscoveryRun = { runId, sourceBundleHash, kernelVersion: discoveryIdentity.kernelVersion, prompt: { checksum: discoveryIdentity.promptChecksum }, inference: { provider: discoveryIdentity.provider, model: discoveryIdentity.model }, schemaVersion: discoveryIdentity.schemaVersion, status: "COMPLETED", rawOutputHash: sha256Utf8(stableJsonStringify(kernelOutput)), payload: { kernelOutput, candidates: [candidate], coverageValidation: { status: "PASSED" } }, createdAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:00.000Z" };
  const convergenceOutput = validateCapabilityConvergenceOutput({ convergence_version: "convergence-v1", groups: [{ group_key: "group", member_candidate_ids: [candidate.candidateId], canonical_name: "Capability", capability_scope: "ATOMIC", structural_definition: "Definition", primary_domain: null }], relations: [], reconciliation_audit: { input_candidate_count: 1, grouped_candidate_count: 1, group_count: 1, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } }, [candidate]);
  const convergenceIdentity = { discoveryRunId: runId, discoveryRawOutputHash: discoveryRun.rawOutputHash!, kernelVersion: "convergence-v1", promptChecksum: "convergence-prompt", provider: "gemini", model: "convergence-model", schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm" };
  const canonical = canonicalizeCapabilityConvergence(convergenceOutput, [candidate], "2026-01-01T00:00:00.000Z");
  const convergenceRun: CapabilityConvergenceRun = { runKind: "CAPABILITY_CONVERGENCE", convergenceRunId: buildCapabilityConvergenceRunId(convergenceIdentity), discoveryRunId: runId, discoveryRawOutputHash: discoveryRun.rawOutputHash!, sourceBundleHash, kernelVersion: convergenceIdentity.kernelVersion, prompt: { checksum: convergenceIdentity.promptChecksum }, inference: { provider: convergenceIdentity.provider, model: convergenceIdentity.model }, schemaVersion: convergenceIdentity.schemaVersion, algorithmVersion: convergenceIdentity.algorithmVersion, status: "COMPLETED", rawOutputHash: sha256Utf8(stableConvergenceJsonStringify(convergenceOutput)), payload: { convergenceOutput, canonicalDrafts: canonical.canonicalDrafts, proposedRelations: canonical.proposedRelations, eligibleCandidateIds: [candidate.candidateId], excludedCandidateIds: [], reconciliation: { status: "PASSED" } }, createdAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:00.000Z" };
  const payload: CapabilityVerificationRun["payload"] = { semanticDefinitionOutcomes: [{ provisionalCapabilityId: canonical.canonicalDrafts[0].provisionalCapabilityId, status: "PASSED" }], demonstratedLevelOutcomes: [{ provisionalCapabilityId: canonical.canonicalDrafts[0].provisionalCapabilityId, status: "UNVERIFIED", demonstratedCapabilityLevel: null }], relationDispositions: [], publicationEligibility: "ELIGIBLE" };
  const verificationRun: CapabilityVerificationRun = { runKind: "CAPABILITY_VERIFICATION", verificationRunId: "", convergenceRunId: convergenceRun.convergenceRunId, convergenceRawOutputHash: convergenceRun.rawOutputHash, sourceEvidenceRepresentationHash, sourceBundleHash, kernelVersion: "verification-v1", promptChecksum: "verification-prompt", inference: { provider: "gemini", model: "verification-model" }, schemaVersion: "verification-schema", algorithmVersion: "verification-algorithm", snapshotSchemaVersion: "snapshot-schema", rawOutputHash: sha256Utf8(stableVerificationJsonStringify(canonicalPayload(payload))), status: "COMPLETED", payload, createdAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:00.000Z" };
  verificationRun.verificationRunId = expectedVerificationRunId(verificationRun);
  return { sourceDocuments, discoveryRun, convergenceRun, verificationRun };
}

type PersistedArtifacts = { discovery?: CapabilityDiscoveryRun | null; convergence?: CapabilityConvergenceRun | null; verification?: CapabilityVerificationRun | null };
type IntegrityApi = { authenticateCapabilityVerificationRun(input: CapabilityVerificationIntegrityInput): Promise<AuthenticatedCapabilityVerificationChain>; authenticatePersistedCapabilityVerificationRun(input: CapabilityVerificationIntegrityInput, repository: CapabilityVerificationAuthorityDependencies["repository"]): Promise<AuthenticatedCapabilityVerificationChain>; computeSourceEvidenceRepresentationHash(documents: SourceDocument[]): string; buildCapabilityVerificationRunId(input: ReturnType<typeof verificationIdentity>): string; canonicalizeCapabilityVerificationPayload(payload: CapabilityVerificationRun["payload"]): CapabilityVerificationRun["payload"]; computeCapabilityVerificationRawOutputHash(payload: CapabilityVerificationRun["payload"]): string; assertCanonicalCapabilityVerificationPayload(payload: CapabilityVerificationRun["payload"]): void; deriveCapabilityVerificationPublicationEligibility(payload: CapabilityVerificationRun["payload"]): "ELIGIBLE" | "BLOCKED" };
const api = verification as unknown as Partial<IntegrityApi>;
const authenticate = (input: CapabilityVerificationIntegrityInput) => api.authenticateCapabilityVerificationRun ? api.authenticateCapabilityVerificationRun(input) : Promise.reject(new Error("ERR_PHASE4_VERIFICATION_INTEGRITY_NOT_IMPLEMENTED"));
const authenticatePersisted = (input: CapabilityVerificationIntegrityInput, persisted: PersistedArtifacts = {}) => api.authenticatePersistedCapabilityVerificationRun ? api.authenticatePersistedCapabilityVerificationRun(input, { getRunById: async () => persisted.discovery === undefined ? structuredClone(input.discoveryRun) : persisted.discovery, getConvergenceRunById: async () => persisted.convergence === undefined ? structuredClone(input.convergenceRun) : persisted.convergence, getVerificationRunById: async () => persisted.verification === undefined ? structuredClone(input.verificationRun) : persisted.verification }) : Promise.reject(new Error("ERR_PHASE4_VERIFICATION_INTEGRITY_NOT_IMPLEMENTED"));
const withCoverageAudit = (input: CapabilityVerificationIntegrityInput, field: "source_documents_examined" | "capability_count" | "atomic_capability_count" | "composite_capability_count") => {
  const payload = input.discoveryRun.payload as { kernelOutput: CapabilityKernelOutput; candidates: unknown[]; coverageValidation: { status: "PASSED" } };
  const kernelOutput = { ...payload.kernelOutput, coverage_audit: { ...payload.kernelOutput.coverage_audit, [field]: payload.kernelOutput.coverage_audit[field] + 1 } };
  const discoveryRun = { ...input.discoveryRun, rawOutputHash: sha256Utf8(stableJsonStringify(kernelOutput)), payload: { ...payload, kernelOutput } };
  const convergenceRun = { ...input.convergenceRun, discoveryRawOutputHash: discoveryRun.rawOutputHash!, convergenceRunId: buildCapabilityConvergenceRunId({ discoveryRunId: discoveryRun.runId, discoveryRawOutputHash: discoveryRun.rawOutputHash!, kernelVersion: input.convergenceRun.kernelVersion, promptChecksum: input.convergenceRun.prompt.checksum, provider: input.convergenceRun.inference.provider, model: input.convergenceRun.inference.model, schemaVersion: input.convergenceRun.schemaVersion, algorithmVersion: input.convergenceRun.algorithmVersion }) };
  const verificationRun = { ...input.verificationRun, convergenceRunId: convergenceRun.convergenceRunId };
  verificationRun.verificationRunId = expectedVerificationRunId(verificationRun);
  return { ...input, discoveryRun, convergenceRun, verificationRun };
};

const rebindDiscovery = (input: CapabilityVerificationIntegrityInput, patch: Record<string, unknown>) => {
  const discoveryRun = { ...input.discoveryRun, ...patch, prompt: { ...input.discoveryRun.prompt, ...(patch.prompt as Record<string, unknown> | undefined) }, inference: { ...input.discoveryRun.inference, ...(patch.inference as Record<string, unknown> | undefined) } } as CapabilityDiscoveryRun;
  discoveryRun.runId = buildCapabilityDiscoveryRunId({ sourceBundleHash: discoveryRun.sourceBundleHash, kernelVersion: discoveryRun.kernelVersion, promptChecksum: discoveryRun.prompt.checksum, provider: discoveryRun.inference.provider, model: discoveryRun.inference.model, schemaVersion: discoveryRun.schemaVersion });
  const kernelOutput = (discoveryRun.payload as { kernelOutput: CapabilityKernelOutput }).kernelOutput;
  const candidates = kernelOutput.capabilities.map((capability) => verifyCandidateEvidence(createCapabilityCandidate(discoveryRun.runId, capability), input.sourceDocuments));
  discoveryRun.payload = { ...(discoveryRun.payload as object), candidates } as CapabilityDiscoveryRun["payload"];
  const candidateIds = new Map((input.discoveryRun.payload as { candidates: Array<{ candidateId: string }> }).candidates.map((candidate, index) => [candidate.candidateId, candidates[index].candidateId]));
  const convergenceOutput = { ...input.convergenceRun.payload.convergenceOutput, groups: input.convergenceRun.payload.convergenceOutput.groups.map((group) => ({ ...group, member_candidate_ids: group.member_candidate_ids.map((candidateId) => candidateIds.get(candidateId)!) })) };
  return rebindConvergence({ ...input, discoveryRun }, {}, convergenceOutput);
};

const rebindConvergence = (input: CapabilityVerificationIntegrityInput, patch: Record<string, unknown>, convergenceOutput = input.convergenceRun.payload.convergenceOutput) => {
  const convergenceRun = { ...input.convergenceRun, ...patch, prompt: { ...input.convergenceRun.prompt, ...(patch.prompt as Record<string, unknown> | undefined) }, inference: { ...input.convergenceRun.inference, ...(patch.inference as Record<string, unknown> | undefined) }, discoveryRunId: input.discoveryRun.runId, discoveryRawOutputHash: input.discoveryRun.rawOutputHash } as CapabilityConvergenceRun;
  const candidates = (input.discoveryRun.payload as { candidates: ReturnType<typeof createCapabilityCandidate>[] }).candidates;
  const validated = validateCapabilityConvergenceOutput(convergenceOutput, candidates);
  const canonical = canonicalizeCapabilityConvergence(validated, candidates, convergenceRun.createdAt);
  convergenceRun.payload = { ...convergenceRun.payload, convergenceOutput, canonicalDrafts: canonical.canonicalDrafts, proposedRelations: canonical.proposedRelations, eligibleCandidateIds: candidates.filter((candidate) => candidate.status === "EVIDENCE_PASSED").map((candidate) => candidate.candidateId).sort(compare), excludedCandidateIds: candidates.filter((candidate) => candidate.status === "EVIDENCE_REJECTED").map((candidate) => candidate.candidateId).sort(compare), reconciliation: { status: "PASSED" } };
  convergenceRun.rawOutputHash = sha256Utf8(stableConvergenceJsonStringify(validated));
  convergenceRun.convergenceRunId = buildCapabilityConvergenceRunId({ discoveryRunId: convergenceRun.discoveryRunId, discoveryRawOutputHash: convergenceRun.discoveryRawOutputHash, kernelVersion: convergenceRun.kernelVersion, promptChecksum: convergenceRun.prompt.checksum, provider: convergenceRun.inference.provider, model: convergenceRun.inference.model, schemaVersion: convergenceRun.schemaVersion, algorithmVersion: convergenceRun.algorithmVersion });
  const verificationRun = { ...input.verificationRun, convergenceRunId: convergenceRun.convergenceRunId, convergenceRawOutputHash: convergenceRun.rawOutputHash };
  verificationRun.verificationRunId = expectedVerificationRunId(verificationRun);
  return { ...input, convergenceRun, verificationRun };
};

type IntegrityMutation = (input: CapabilityVerificationIntegrityInput) => CapabilityVerificationIntegrityInput;
type PersistedMutation = (input: CapabilityVerificationIntegrityInput) => PersistedArtifacts;

const withInvalidVerifiedLevel = (input: CapabilityVerificationIntegrityInput): CapabilityVerificationIntegrityInput => {
  const result = structuredClone(input);
  const outcome = result.verificationRun.payload.demonstratedLevelOutcomes[0];
  if (outcome === undefined) throw new Error("test fixture requires a demonstrated-level outcome");
  Reflect.set(outcome, "status", "VERIFIED");
  Reflect.set(outcome, "demonstratedCapabilityLevel", null);
  return result;
};

const withMalformedPersistedProposal = (input: CapabilityVerificationIntegrityInput): PersistedArtifacts => {
  const convergence = structuredClone(input.convergenceRun);
  Reflect.set(convergence.payload, "proposedRelations", [{ relationId: "REL_FORGED", sourceCapabilityRef: "PCAP_A", targetCapabilityRef: "PCAP_B", relationType: "RELATED_CAPABILITY", status: "PROPOSED", reason: "forged", createdBy: "SEMANTIC_RESOLVER", createdAt: "changed" }]);
  return { convergence };
};

describe("Phase 4 Slice 2 verification-run integrity contract", () => {
  it("authenticates the complete Source -> Discovery -> Convergence -> Verification chain", async () => {
    await expect(authenticate(authenticatedFixture())).resolves.toBeDefined();
  });

  it.each([
    ["changed page text", (documents: SourceDocument[]) => [{ ...documents[0], pages: [{ pageNumber: 1, text: "Changed", normalizedText: "Changed" }] }]],
    ["changed page boundary", (documents: SourceDocument[]) => [{ ...documents[0], pages: [{ pageNumber: 1, text: "Pro", normalizedText: "Pro" }, { pageNumber: 2, text: "of", normalizedText: "of" }] }]],
    ["changed page number", (documents: SourceDocument[]) => [{ ...documents[0], pages: [{ pageNumber: 2, text: "Proof", normalizedText: "Proof" }] }]]
  ])("binds source evidence representation to %s", (_name, mutate) => {
    const document = createSourceDocument({ docId: "DOC_A", title: "Source", rawContent: "Proof", pages: [{ pageNumber: 1, text: "Proof" }] });
    const changed = mutate([document]);
    expect(api.computeSourceEvidenceRepresentationHash?.([document])).toBe(expectedSourceEvidenceRepresentationHash([document]));
    expect(api.computeSourceEvidenceRepresentationHash?.(changed)).not.toBe(expectedSourceEvidenceRepresentationHash([document]));
  });

  it.each([
    ["duplicate page number", [{ pageNumber: 1, text: "Proof", normalizedText: "Proof" }, { pageNumber: 1, text: "Proof", normalizedText: "Proof" }]],
    ["tampered page normalizedText", [{ pageNumber: 1, text: "Proof", normalizedText: "tampered" }]]
  ])("rejects %s in source evidence representation", (_name, pages) => {
    const document = { ...createSourceDocument({ docId: "DOC_A", title: "Source", rawContent: "Proof" }), pages };
    expect(() => api.computeSourceEvidenceRepresentationHash?.([document])).toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("canonicalizes document and page input order but preserves page-boundary identity", () => {
    const first = createSourceDocument({ docId: "DOC_A", title: "A", rawContent: "Proof", pages: [{ pageNumber: 1, text: "Pro" }, { pageNumber: 2, text: "of" }] });
    const second = createSourceDocument({ docId: "DOC_B", title: "B", rawContent: "Other", pages: [{ pageNumber: 1, text: "Other" }] });
    const reorderedFirst = { ...first, pages: [...first.pages!].reverse() };
    expect(api.computeSourceEvidenceRepresentationHash?.([first, second])).toBe(expectedSourceEvidenceRepresentationHash([second, reorderedFirst]));
    const sameTextDifferentBoundaries = { ...first, pages: [{ pageNumber: 1, text: "Proof", normalizedText: "Proof" }] };
    expect(api.computeSourceEvidenceRepresentationHash?.([first])).not.toBe(expectedSourceEvidenceRepresentationHash([sameTextDifferentBoundaries]));
  });

  it("binds title and pages presence while preserving canonical document and page ordering", () => {
    const withoutPages = createSourceDocument({ docId: "DOC_A", title: "A", rawContent: "Proof" });
    const emptyPages = { ...withoutPages, pages: [] };
    const renamed = { ...withoutPages, title: "Renamed" };
    const second = createSourceDocument({ docId: "DOC_B", title: "B", rawContent: "Other", pages: [{ pageNumber: 2, text: "ther" }, { pageNumber: 1, text: "O" }] });
    const reorderedSecond = { ...second, pages: [...second.pages!].reverse() };

    expect(api.computeSourceEvidenceRepresentationHash?.([withoutPages])).not.toBe(api.computeSourceEvidenceRepresentationHash?.([emptyPages]));
    expect(api.computeSourceEvidenceRepresentationHash?.([withoutPages])).not.toBe(api.computeSourceEvidenceRepresentationHash?.([renamed]));
    expect(api.computeSourceEvidenceRepresentationHash?.([withoutPages, second])).toBe(api.computeSourceEvidenceRepresentationHash?.([reorderedSecond, withoutPages]));
  });

  it.each([
    ["source text/hash tampering", (input: CapabilityVerificationIntegrityInput) => ({ ...input, sourceDocuments: [{ ...input.sourceDocuments[0], normalizedText: "tampered" }] })],
    ["duplicate source docId", (input: CapabilityVerificationIntegrityInput) => ({ ...input, sourceDocuments: [input.sourceDocuments[0], { ...input.sourceDocuments[0] }] })],
    ["discovery source-bundle mismatch", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, sourceBundleHash: "wrong" } })],
    ["convergence source-bundle mismatch", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, sourceBundleHash: "wrong" } })],
    ["verification source-bundle mismatch", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, sourceBundleHash: "wrong" } })],
    ["verification source-representation mismatch", (input: CapabilityVerificationIntegrityInput) => ({ ...input, sourceDocuments: [{ ...input.sourceDocuments[0], title: "Renamed" }] })]
  ])("rejects %s", async (_name, mutate) => {
    await expect(authenticate(mutate(authenticatedFixture()))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each(["source_documents_examined", "capability_count", "atomic_capability_count", "composite_capability_count"] as const)("replays Discovery coverage validation for %s", async (field) => {
    await expect(authenticate(withCoverageAudit(authenticatedFixture(), field))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    ["non-string templateId", { prompt: { templateId: 1 } }],
    ["non-string versionId", { prompt: { versionId: 1 } }],
    ["whitespace checksum", { prompt: { checksum: "   " } }],
    ["whitespace provider", { inference: { provider: "   " } }],
    ["whitespace model", { inference: { model: "   " } }],
    ["empty createdAt", { createdAt: "" }],
    ["empty completedAt", { completedAt: "" }],
    ["whitespace schemaVersion", { schemaVersion: "   " }]
  ])("rejects invalid Discovery scalar state: %s", async (_name, patch) => {
    await expect(authenticate(rebindDiscovery(authenticatedFixture(), patch))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    ["non-string templateId", { prompt: { templateId: 1 } }],
    ["non-string versionId", { prompt: { versionId: 1 } }],
    ["whitespace checksum", { prompt: { checksum: "   " } }],
    ["whitespace provider", { inference: { provider: "   " } }],
    ["whitespace model", { inference: { model: "   " } }],
    ["empty createdAt", { createdAt: "" }],
    ["empty completedAt", { completedAt: "" }],
    ["whitespace schemaVersion", { schemaVersion: "   " }],
    ["whitespace algorithmVersion", { algorithmVersion: "   " }]
  ])("rejects invalid Convergence scalar state: %s", async (_name, patch) => {
    await expect(authenticate(rebindConvergence(authenticatedFixture(), patch))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("keeps raw integrity input separate from trusted repository dependencies", () => {
    expect(integrityInputHasNoRepository).toBe(true);
    expect(Object.hasOwn(authenticatedFixture(), "repository")).toBe(false);
    expect(finalPublisherIsAsync).toBe(true);
  });

  it.each([
    ["Discovery", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, hidden: "forged" } })],
    ["Convergence", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, hidden: "forged" } })]
  ])("does not carry unknown %s artifact state into an authenticated chain", async (_name, mutate) => {
    await expect(authenticate(mutate(authenticatedFixture()) as CapabilityVerificationIntegrityInput)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    ["RUN identity", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, runId: "RUN_TAMPERED" } })],
    ["discovery rawOutputHash", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, rawOutputHash: "0".repeat(64) } })],
    ["candidate identity/content", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [{ ...(input.discoveryRun.payload as any).candidates[0], structuralDefinition: "tampered" }] } } })],
    ["forged EVIDENCE_PASSED", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [{ ...(input.discoveryRun.payload as any).candidates[0], status: "EVIDENCE_PASSED", evidenceClaims: [{ ...(input.discoveryRun.payload as any).candidates[0].evidenceClaims[0], verification: { status: "REJECTED_QUOTE_NOT_FOUND" } }] }] } } })],
    ["forged VERIFIED evidence", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [{ ...(input.discoveryRun.payload as any).candidates[0], evidenceClaims: [{ ...(input.discoveryRun.payload as any).candidates[0].evidenceClaims[0], verification: { ...(input.discoveryRun.payload as any).candidates[0].evidenceClaims[0].verification, matchedDocId: "DOC_FORGED" } }] }] } } })],
    ["verified evidence match metadata", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [{ ...(input.discoveryRun.payload as any).candidates[0], evidenceClaims: [{ ...(input.discoveryRun.payload as any).candidates[0].evidenceClaims[0], verification: { ...(input.discoveryRun.payload as any).candidates[0].evidenceClaims[0].verification, matchedPageNumber: 99, matchedNormalizedQuote: "forged", sourceSpanStart: 99, sourceSpanEnd: 100 } }] }] } } })],
    ["missing deterministic candidate", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [] } } })],
    ["invented candidate", (input: CapabilityVerificationIntegrityInput) => ({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [...(input.discoveryRun.payload as any).candidates, { ...(input.discoveryRun.payload as any).candidates[0], candidateId: "CAND_INVENTED" }] } } })]
  ])("reconstructs and rejects tampered discovery %s", async (_name, mutate) => {
    await expect(authenticate(mutate(authenticatedFixture()))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    ["CONV identity", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, convergenceRunId: "CONV_TAMPERED" } })],
    ["upstream RUN reference", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, discoveryRunId: "RUN_TAMPERED" } })],
    ["upstream raw hash", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, discoveryRawOutputHash: "0".repeat(64) } })],
    ["convergence rawOutputHash", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, rawOutputHash: "0".repeat(64) } })],
    ["convergence output", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, payload: { ...input.convergenceRun.payload, convergenceOutput: { ...input.convergenceRun.payload.convergenceOutput, convergence_version: "tampered" } } } })],
    ["canonical draft", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, payload: { ...input.convergenceRun.payload, canonicalDrafts: [{ ...input.convergenceRun.payload.canonicalDrafts[0], structuralDefinition: "tampered" }] } } })],
    ["proposed relation/inventory", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, payload: { ...input.convergenceRun.payload, eligibleCandidateIds: [] } } })],
    ["canonical evidence/provenance", (input: CapabilityVerificationIntegrityInput) => ({ ...input, convergenceRun: { ...input.convergenceRun, payload: { ...input.convergenceRun.payload, canonicalDrafts: [{ ...input.convergenceRun.payload.canonicalDrafts[0], evidenceIds: ["EVD_FORGED"], provenance: { sourceCandidateIds: ["CAND_FORGED"], sourceDocumentIds: ["DOC_FORGED"] } }] } } })]
  ])("reconstructs and rejects tampered convergence %s", async (_name, mutate) => {
    await expect(authenticate(mutate(authenticatedFixture()))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("rejects verification rawOutputHash tampering", async () => {
    const input = authenticatedFixture();
    await expect(authenticate({ ...input, verificationRun: { ...input.verificationRun, rawOutputHash: "0".repeat(64) } })).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("rejects a verification payload eligibility value that CONDYN does not derive", async () => {
    const input = authenticatedFixture();
    await expect(authenticate({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, publicationEligibility: "BLOCKED" } } })).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("rejects an evidence-ID collision with divergent reconstructed claim content", async () => {
    const input = authenticatedFixture(); const candidate = (input.discoveryRun.payload as any).candidates[0];
    await expect(authenticate({ ...input, discoveryRun: { ...input.discoveryRun, payload: { ...(input.discoveryRun.payload as any), candidates: [{ ...candidate, evidenceClaims: [...candidate.evidenceClaims, { ...candidate.evidenceClaims[0], exactQuote: "forged" }] }] } } })).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each(["convergenceRunId", "convergenceRawOutputHash", "sourceEvidenceRepresentationHash", "kernelVersion", "promptChecksum", "provider", "model", "schemaVersion", "algorithmVersion", "snapshotSchemaVersion"] as const)("binds VFY identity to %s", (field) => {
    const run = authenticatedFixture().verificationRun; const changed = structuredClone(run);
    if (field === "provider" || field === "model") changed.inference[field] = "changed"; else (changed as any)[field] = "changed";
    expect(api.buildCapabilityVerificationRunId?.(verificationIdentity(run))).toBe(expectedVerificationRunId(run));
    expect(api.buildCapabilityVerificationRunId?.(verificationIdentity(run))).not.toBe(expectedVerificationRunId(changed));
  });

  it.each([
    ["semantic outcome mutation", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, semanticDefinitionOutcomes: [{ ...payload.semanticDefinitionOutcomes[0], status: "FAILED" as const }] })],
    ["level outcome mutation", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, demonstratedLevelOutcomes: [{ ...payload.demonstratedLevelOutcomes[0], status: "VERIFIED" as const, demonstratedCapabilityLevel: "L3" as const }] })],
    ["relation disposition mutation", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, relationDispositions: [{ relationId: "REL_1", status: "REJECTED" as const }] })],
    ["eligibility mutation", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, publicationEligibility: "BLOCKED" as const })],
    ["array order tampering", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, semanticDefinitionOutcomes: [{ provisionalCapabilityId: "PCAP_Z", status: "PASSED" as const }, ...payload.semanticDefinitionOutcomes] })]
  ])("hashes canonical verification payload and detects %s", (_name, mutate) => {
    const payload = authenticatedFixture().verificationRun.payload;
    expect(api.computeCapabilityVerificationRawOutputHash?.(payload)).toBe(sha256Utf8(stableVerificationJsonStringify(canonicalPayload(payload))));
    expect(api.computeCapabilityVerificationRawOutputHash?.(mutate(payload))).not.toBe(sha256Utf8(stableVerificationJsonStringify(canonicalPayload(payload))));
  });

  it("rejects persisted verification payload arrays that are not already in canonical order", () => {
    const payload = authenticatedFixture().verificationRun.payload;
    const reordered = { ...payload, semanticDefinitionOutcomes: [{ provisionalCapabilityId: "PCAP_Z", status: "PASSED" as const }, ...payload.semanticDefinitionOutcomes] };
    expect(() => api.assertCanonicalCapabilityVerificationPayload?.(reordered)).toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    { status: "VERIFIED" as const, demonstratedCapabilityLevel: null },
    { status: "UNVERIFIED" as const, demonstratedCapabilityLevel: "L3" as const }
  ])("rejects invalid structural level truth: %o", (level) => {
    const payload = authenticatedFixture().verificationRun.payload;
    expect(() => api.canonicalizeCapabilityVerificationPayload?.({ ...payload, demonstratedLevelOutcomes: [{ ...payload.demonstratedLevelOutcomes[0], ...level }] })).toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    ["semantic outcome", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, semanticDefinitionOutcomes: [{ ...payload.semanticDefinitionOutcomes[0], unexpected: true }] })],
    ["level outcome", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, demonstratedLevelOutcomes: [{ ...payload.demonstratedLevelOutcomes[0], unexpected: true }] })],
    ["relation disposition", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, relationDispositions: [{ relationId: "REL_A", status: "REJECTED" as const, unexpected: true }] })],
    ["top-level payload", (payload: CapabilityVerificationRun["payload"]) => ({ ...payload, unexpected: true })]
  ])("rejects an unknown property on %s canonical payload state", (_name, mutate) => {
    expect(() => api.canonicalizeCapabilityVerificationPayload?.(mutate(authenticatedFixture().verificationRun.payload) as CapabilityVerificationRun["payload"])).toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("requires exact verification payload coverage and derives publication eligibility", () => {
    const payload = authenticatedFixture().verificationRun.payload;
    expect(api.deriveCapabilityVerificationPublicationEligibility?.(payload)).toBe("ELIGIBLE");
    expect(api.deriveCapabilityVerificationPublicationEligibility?.({ ...payload, semanticDefinitionOutcomes: [{ ...payload.semanticDefinitionOutcomes[0], status: "FAILED" }] })).toBe("BLOCKED");
    expect(api.deriveCapabilityVerificationPublicationEligibility?.({ ...payload, relationDispositions: [{ relationId: "REL_1", status: "UNRESOLVED" }] })).toBe("BLOCKED");
  });

  const coverageViolations: ReadonlyArray<readonly [string, IntegrityMutation]> = [
    ["missing semantic outcome", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, semanticDefinitionOutcomes: [] } } })],
    ["duplicate semantic outcome", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, semanticDefinitionOutcomes: [...input.verificationRun.payload.semanticDefinitionOutcomes, input.verificationRun.payload.semanticDefinitionOutcomes[0]] } } })],
    ["unknown semantic outcome", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, semanticDefinitionOutcomes: [{ provisionalCapabilityId: "PCAP_UNKNOWN", status: "PASSED" }] } } })],
    ["missing level outcome", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, demonstratedLevelOutcomes: [] } } })],
    ["duplicate level outcome", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, demonstratedLevelOutcomes: [...input.verificationRun.payload.demonstratedLevelOutcomes, input.verificationRun.payload.demonstratedLevelOutcomes[0]] } } })],
    ["unknown relation disposition", (input: CapabilityVerificationIntegrityInput) => ({ ...input, verificationRun: { ...input.verificationRun, payload: { ...input.verificationRun.payload, relationDispositions: [{ relationId: "REL_UNKNOWN", status: "REJECTED" }] } } })],
    ["invalid verified-level shape", withInvalidVerifiedLevel]
  ];

  it.each(coverageViolations)("rejects verification payload coverage violation: %s", async (_name, mutate) => {
    await expect(authenticate(mutate(authenticatedFixture()))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it.each([
    ["zero draft graph", { semanticDefinitionOutcomes: [], demonstratedLevelOutcomes: [], relationDispositions: [], publicationEligibility: "ELIGIBLE" }],
    ["failed semantic definition", { semanticDefinitionOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "FAILED" }], demonstratedLevelOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "UNVERIFIED", demonstratedCapabilityLevel: null }], relationDispositions: [], publicationEligibility: "BLOCKED" }],
    ["unresolved relation", { semanticDefinitionOutcomes: [], demonstratedLevelOutcomes: [], relationDispositions: [{ relationId: "REL_A", status: "UNRESOLVED" }], publicationEligibility: "BLOCKED" }],
    ["rejected relation and unverified level", { semanticDefinitionOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "PASSED" }], demonstratedLevelOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "UNVERIFIED", demonstratedCapabilityLevel: null }], relationDispositions: [{ relationId: "REL_A", status: "REJECTED" }], publicationEligibility: "ELIGIBLE" }]
  ])("derives %s publication eligibility deterministically", (_name, payload) => {
    expect(api.deriveCapabilityVerificationPublicationEligibility?.(payload as CapabilityVerificationRun["payload"])).toBe(payload.publicationEligibility);
  });

  it("freezes the next publisher to establish authority from raw integrity input", () => {
    expect(typeof (verification as Record<string, unknown>).publishVerifiedCapabilitySnapshotFromIntegrityInput).toBe("function");
  });

  it("distinguishes authenticated chain integrity from persisted publication authority", async () => {
    const input = authenticatedFixture();
    const authenticated = await authenticate(input);
    expect(authenticated).not.toHaveProperty("authoritativeVerificationRun");
    await expect(authenticatePersisted(input)).resolves.toMatchObject({ verificationRun: input.verificationRun });
    await expect(authenticatePersisted(input, { verification: null })).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  const persistedMutations: ReadonlyArray<readonly [string, PersistedMutation]> = [
    ["unpersisted Discovery", (_input: CapabilityVerificationIntegrityInput) => ({ discovery: null })],
    ["unpersisted Convergence", (_input: CapabilityVerificationIntegrityInput) => ({ convergence: null })],
    ["unpersisted VFY", (_input: CapabilityVerificationIntegrityInput) => ({ verification: null })],
    ["Discovery createdAt-only divergence", (input: CapabilityVerificationIntegrityInput) => ({ discovery: { ...input.discoveryRun, createdAt: "changed" } })],
    ["Discovery completedAt-only divergence", (input: CapabilityVerificationIntegrityInput) => ({ discovery: { ...input.discoveryRun, completedAt: "changed" } })],
    ["Convergence createdAt-only divergence", (input: CapabilityVerificationIntegrityInput) => ({ convergence: { ...input.convergenceRun, createdAt: "changed" } })],
    ["Convergence completedAt-only divergence", (input: CapabilityVerificationIntegrityInput) => ({ convergence: { ...input.convergenceRun, completedAt: "changed" } })],
    ["Convergence proposed-relation timestamp divergence", withMalformedPersistedProposal],
    ["VFY createdAt-only divergence", (input: CapabilityVerificationIntegrityInput) => ({ verification: { ...input.verificationRun, createdAt: "changed" } })],
    ["VFY completedAt-only divergence", (input: CapabilityVerificationIntegrityInput) => ({ verification: { ...input.verificationRun, completedAt: "changed" } })],
    ["VFY payload divergence", (input: CapabilityVerificationIntegrityInput) => ({ verification: { ...input.verificationRun, payload: { ...input.verificationRun.payload, publicationEligibility: "BLOCKED" as const } } })]
  ];

  it.each(persistedMutations)("rejects non-authoritative persisted artifact: %s", async (_name, persisted) => {
    const input = authenticatedFixture();
    await expect(authenticatePersisted(input, persisted(input))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("returns only exact immutable persisted RUN, CONV, and VFY artifacts", async () => {
    const input = authenticatedFixture();
    const authoritative = await authenticatePersisted(input, { discovery: structuredClone(input.discoveryRun), convergence: structuredClone(input.convergenceRun), verification: structuredClone(input.verificationRun) });
    expect(authoritative.discoveryRun).toEqual(input.discoveryRun);
    expect(authoritative.convergenceRun).toEqual(input.convergenceRun);
    expect(authoritative.verificationRun).toEqual(input.verificationRun);
    expect(authoritative).not.toHaveProperty("authoritativeVerificationRun");
  });
});
