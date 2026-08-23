import { describe, expect, it } from "vitest";
import * as core from "../../../../lib/career/capability-core";
import * as verification from "../../../../lib/career/capability-core/verification";
import * as repositoryModule from "../../../../lib/career/capability-core/repository";
import type { CapabilityVerificationIntegrityInput, CapabilityVerificationRun } from "../../../../lib/career/capability-core/verification";
import type { VerifiedCapabilitySnapshot } from "../../../../lib/career/capability-core";

type Publisher = { publish(input: CapabilityVerificationIntegrityInput): Promise<VerifiedCapabilitySnapshot> };
type PublicRepositoryExcludesPhase4Writer = "savePhase4VerifiedSnapshot" extends keyof core.CapabilityCoreRepository ? false : true;
const publicRepositoryExcludesPhase4Writer: PublicRepositoryExcludesPhase4Writer = true;
const isPublisher = (value: unknown): value is Publisher => !!value && typeof value === "object" && typeof Reflect.get(value, "publish") === "function";
const publisher = (repository: core.CapabilityCoreRepository): Publisher => {
  const result: unknown = repository.createVerifiedCapabilitySnapshotPublisher();
  if (!isPublisher(result)) throw new Error("ERR_PHASE4_PUBLISHER_NOT_IMPLEMENTED");
  return result;
};

const source = (id: string, quote: string) => core.createSourceDocument({ docId: id, title: id, rawContent: quote });

function fixture(options: { relation?: "VERIFIED" | "REJECTED" | "UNRESOLVED"; level?: "VERIFIED" | "UNVERIFIED"; zero?: boolean; emptySources?: boolean; blocked?: boolean } = {}): CapabilityVerificationIntegrityInput {
  const sourceDocuments = options.emptySources ? [] : options.zero ? [source("DOC_ZERO", "No capabilities discovered")] : [source("DOC_A", "Proof A"), source("DOC_B", "Proof B")];
  const capabilities = options.zero ? [] : [
    { canonical_name: "Capability A", capability_scope: "ATOMIC" as const, structural_definition: "Definition A", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT" as const, evidence: [{ source_document: "DOC_A", location: "source", exact_quote: "Proof A" }] },
    ...(options.relation ? [{ canonical_name: "Capability B", capability_scope: "ATOMIC" as const, structural_definition: "Definition B", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT" as const, evidence: [{ source_document: "DOC_B", location: "source", exact_quote: "Proof B" }] }] : [])
  ];
  const kernelOutput: core.CapabilityKernelOutput = { kernel_version: "discovery-v1", capabilities, coverage_audit: { source_documents_examined: sourceDocuments.length, capability_count: capabilities.length, atomic_capability_count: capabilities.length, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 } };
  const sourceBundleHash = core.computeSourceBundleHash(sourceDocuments);
  const runId = core.buildCapabilityDiscoveryRunId({ sourceBundleHash, kernelVersion: "discovery-v1", promptChecksum: "discovery-prompt", provider: "gemini", model: "discovery-model", schemaVersion: "discovery-schema" });
  const candidates = kernelOutput.capabilities.map((item) => core.verifyCandidateEvidence(core.createCapabilityCandidate(runId, item), sourceDocuments));
  const createdAt = "2026-01-01T00:00:00.000Z";
  const discoveryRun: core.CapabilityDiscoveryRun = { runId, sourceBundleHash, kernelVersion: "discovery-v1", prompt: { checksum: "discovery-prompt" }, inference: { provider: "gemini", model: "discovery-model" }, schemaVersion: "discovery-schema", status: "COMPLETED", rawOutputHash: core.sha256Utf8(core.stableJsonStringify(kernelOutput)), payload: { kernelOutput, candidates, coverageValidation: { status: "PASSED" } }, createdAt, completedAt: createdAt };
  const discoveryRawOutputHash = discoveryRun.rawOutputHash;
  if (discoveryRawOutputHash === undefined) throw new Error("test fixture requires a Discovery raw output hash");
  const groups = candidates.map((candidate, index) => ({ group_key: `group-${index}`, member_candidate_ids: [candidate.candidateId], canonical_name: kernelOutput.capabilities[index].canonical_name, capability_scope: "ATOMIC" as const, structural_definition: kernelOutput.capabilities[index].structural_definition, primary_domain: null }));
  const relations = options.relation && candidates.length === 2 ? [{ source_group_key: "group-0", target_group_key: "group-1", relation_type: "RELATED_CAPABILITY" as const, reason: "verified relation" }] : [];
  const convergenceOutput = core.validateCapabilityConvergenceOutput({ convergence_version: "convergence-v1", groups, relations, reconciliation_audit: { input_candidate_count: candidates.length, grouped_candidate_count: candidates.length, group_count: groups.length, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } }, candidates);
  const convergenceRawOutputHash = core.sha256Utf8(core.stableConvergenceJsonStringify(convergenceOutput));
  const convergenceRunId = core.buildCapabilityConvergenceRunId({ discoveryRunId: runId, discoveryRawOutputHash: discoveryRawOutputHash, kernelVersion: "convergence-v1", promptChecksum: "convergence-prompt", provider: "gemini", model: "convergence-model", schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm" });
  const canonical = core.canonicalizeCapabilityConvergence(convergenceOutput, candidates, createdAt);
  const convergenceRun: core.CapabilityConvergenceRun = { runKind: "CAPABILITY_CONVERGENCE", convergenceRunId, discoveryRunId: runId, discoveryRawOutputHash: discoveryRawOutputHash, sourceBundleHash, kernelVersion: "convergence-v1", prompt: { checksum: "convergence-prompt" }, inference: { provider: "gemini", model: "convergence-model" }, schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm", status: "COMPLETED", rawOutputHash: convergenceRawOutputHash, payload: { convergenceOutput, canonicalDrafts: canonical.canonicalDrafts, proposedRelations: canonical.proposedRelations, eligibleCandidateIds: candidates.map((candidate) => candidate.candidateId).sort((left, right) => left < right ? -1 : left > right ? 1 : 0), excludedCandidateIds: [], reconciliation: { status: "PASSED" } }, createdAt, completedAt: createdAt };
  const levelStatus = options.level ?? "UNVERIFIED";
  const payload: CapabilityVerificationRun["payload"] = { semanticDefinitionOutcomes: canonical.canonicalDrafts.map((draft) => ({ provisionalCapabilityId: draft.provisionalCapabilityId, status: options.blocked ? "FAILED" as const : "PASSED" as const })), demonstratedLevelOutcomes: canonical.canonicalDrafts.map((draft) => ({ provisionalCapabilityId: draft.provisionalCapabilityId, status: levelStatus, demonstratedCapabilityLevel: levelStatus === "VERIFIED" ? "L3" : null })), relationDispositions: canonical.proposedRelations.map((relation) => ({ relationId: relation.relationId, status: options.relation ?? "VERIFIED" })), publicationEligibility: options.blocked || options.relation === "UNRESOLVED" ? "BLOCKED" : "ELIGIBLE" };
  const verificationRun: CapabilityVerificationRun = { runKind: "CAPABILITY_VERIFICATION", verificationRunId: "", convergenceRunId, convergenceRawOutputHash, sourceEvidenceRepresentationHash: verification.computeSourceEvidenceRepresentationHash(sourceDocuments), sourceBundleHash, kernelVersion: "verification-v1", promptChecksum: "verification-prompt", inference: { provider: "gemini", model: "verification-model" }, schemaVersion: "verification-schema", algorithmVersion: "verification-algorithm", snapshotSchemaVersion: "snapshot-schema", rawOutputHash: verification.computeCapabilityVerificationRawOutputHash(payload), status: "COMPLETED", payload, createdAt, completedAt: "2026-02-02T00:00:00.000Z" };
  verificationRun.verificationRunId = verification.buildCapabilityVerificationRunId({ convergenceRunId, convergenceRawOutputHash, sourceEvidenceRepresentationHash: verificationRun.sourceEvidenceRepresentationHash, kernelVersion: verificationRun.kernelVersion, promptChecksum: verificationRun.promptChecksum, provider: verificationRun.inference.provider, model: verificationRun.inference.model, schemaVersion: verificationRun.schemaVersion, algorithmVersion: verificationRun.algorithmVersion, snapshotSchemaVersion: verificationRun.snapshotSchemaVersion });
  return { sourceDocuments, discoveryRun, convergenceRun, verificationRun };
}

async function persist(repository: core.CapabilityCoreRepository, input: CapabilityVerificationIntegrityInput): Promise<void> {
  await repository.saveRun(input.discoveryRun); await repository.saveConvergenceRun(input.convergenceRun); await repository.saveVerificationRun(input.verificationRun);
}

describe("Phase 4 authoritative final truth publication", () => {
  it("keeps the Phase-4 write capability out of the public repository contract", () => {
    const repository = new core.InMemoryCapabilityCoreRepository();
    expect(publicRepositoryExcludesPhase4Writer).toBe(true);
    expect("savePhase4VerifiedSnapshot" in repository).toBe(false);
    expect("createInternalPhase4SnapshotStore" in core).toBe(false);
    expect("InternalPhase4SnapshotStore" in core).toBe(false);
    expect("createInternalPhase4SnapshotStore" in repositoryModule).toBe(false);
    expect("InternalPhase4SnapshotStore" in repositoryModule).toBe(false);
    expect("createVerifiedCapabilitySnapshotPublisher" in verification).toBe(false);
  });
  it("constructs a dependency-injected publisher and accepts only raw integrity input", async () => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture(); await persist(repository, input);
    expect(Object.hasOwn(input, "repository")).toBe(false);
    await expect(publisher(repository).publish(input)).resolves.toMatchObject({ status: "VERIFIED", publication: { mode: "PHASE4_VERIFIED" } });
  });

  it.each(["discoveryRun", "convergenceRun", "verificationRun"] as const)("requires persisted %s before writing a snapshot", async (missing) => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture();
    if (missing !== "discoveryRun") await repository.saveRun(input.discoveryRun);
    if (missing !== "convergenceRun") await repository.saveConvergenceRun(input.convergenceRun);
    if (missing !== "verificationRun") await repository.saveVerificationRun(input.verificationRun);
    await expect(publisher(repository).publish(input)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
    await expect(repository.getSnapshotByKey("missing")).resolves.toBeNull();
  });

  it("blocks a valid BLOCKED VFY without writing a snapshot", async () => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture({ blocked: true }); await persist(repository, input);
    await expect(publisher(repository).publish(input)).rejects.toThrow("ERR_PHASE4_PUBLICATION_BLOCKED");
    await expect(repository.getSnapshotByKey("missing")).resolves.toBeNull();
  });

  it("derives CAPs, L3 truth, exact evidence, audit metadata, publication metadata, and SNAP identity", async () => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture({ level: "VERIFIED" });
    Reflect.set(input, "capabilities", [{ capabilityId: "CAP_INJECTED" }]); Reflect.set(input, "evidence", []); Reflect.set(input, "relations", []); Reflect.set(input, "publication", { mode: "PHASE4_VERIFIED" });
    await persist(repository, input); const snapshot = await publisher(repository).publish(input);
    const draft = input.convergenceRun.payload.canonicalDrafts[0];
    expect(snapshot.capabilities[0]).toMatchObject({ capabilityId: draft.provisionalCapabilityId.replace("PCAP_", "CAP_"), canonicalName: draft.canonicalName, demonstratedCapabilityLevel: "L3", levelVerificationStatus: "VERIFIED", validation: { evidenceStatus: "PASSED", semanticDefinitionStatus: "PASSED", convergenceStatus: "VERIFIED" } });
    expect(snapshot.evidence).toEqual((await verification.authenticatePersistedCapabilityVerificationRun(input, repository)).verifiedEvidence);
    expect(snapshot).toMatchObject({ sourceBundleHash: input.discoveryRun.sourceBundleHash, kernelVersion: input.verificationRun.kernelVersion, prompt: { checksum: input.verificationRun.promptChecksum }, inference: input.verificationRun.inference, schemaVersion: input.verificationRun.snapshotSchemaVersion, createdAt: input.verificationRun.completedAt, publication: { mode: "PHASE4_VERIFIED", verificationRunId: input.verificationRun.verificationRunId, verificationRawOutputHash: input.verificationRun.rawOutputHash } });
    expect(snapshot.snapshotId).toBe(`SNAP_${core.sha256Utf8(JSON.stringify(["CAPABILITY_VERIFIED_SNAPSHOT_V1", input.verificationRun.verificationRunId, input.verificationRun.rawOutputHash])).slice(0, 24).toUpperCase()}`);
  });

  it("promotes only VERIFIED relations with VFY completion time and omits REJECTED proposals", async () => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture({ relation: "VERIFIED" }); await persist(repository, input);
    const snapshot = await publisher(repository).publish(input); const proposal = input.convergenceRun.payload.proposedRelations[0];
    expect(snapshot.relations[0]).toMatchObject({ sourceCapabilityRef: proposal.sourceCapabilityRef.replace("PCAP_", "CAP_"), targetCapabilityRef: proposal.targetCapabilityRef.replace("PCAP_", "CAP_"), status: "VERIFIED", createdAt: input.verificationRun.completedAt });
    expect(snapshot.relations[0].relationId).not.toBe(proposal.relationId);
    const rejectedInput = fixture({ relation: "REJECTED" }); const rejectedRepository = new core.InMemoryCapabilityCoreRepository(); await persist(rejectedRepository, rejectedInput);
    await expect(publisher(rejectedRepository).publish(rejectedInput)).resolves.toMatchObject({ relations: [] });
  });

  it("rejects unresolved proposals and publishes a valid persisted zero graph", async () => {
    const unresolved = fixture({ relation: "UNRESOLVED" }); const unresolvedRepository = new core.InMemoryCapabilityCoreRepository(); await persist(unresolvedRepository, unresolved);
    await expect(publisher(unresolvedRepository).publish(unresolved)).rejects.toThrow("ERR_PHASE4_PUBLICATION_BLOCKED");
    const zero = fixture({ zero: true }); const zeroRepository = new core.InMemoryCapabilityCoreRepository(); await persist(zeroRepository, zero);
    await expect(publisher(zeroRepository).publish(zero)).resolves.toMatchObject({ capabilities: [], evidence: [], relations: [], status: "VERIFIED" });
  });

  it("rejects an unreachable empty source set before publication", async () => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture({ zero: true, emptySources: true });
    await persist(repository, input);
    await expect(verification.authenticateCapabilityVerificationRun(input)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
    await expect(publisher(repository).publish(input)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("persists, rereads, replays idempotently, and returns a clone without exposing a write route", async () => {
    const repository = new core.InMemoryCapabilityCoreRepository(); const input = fixture(); await persist(repository, input); const result = await publisher(repository).publish(input);
    const key = core.computeSnapshotKey(result); const reread = await repository.getSnapshotByKey(key);
    expect(reread).toEqual(result); await expect(publisher(repository).publish(input)).resolves.toEqual(result);
    result.createdAt = "local mutation"; expect(await repository.getSnapshotByKey(key)).toEqual(reread);
    if (reread === null) throw new Error("test fixture requires persisted snapshot");
    await expect(repository.saveSnapshot({ ...reread, createdAt: "divergent" })).rejects.toThrow("ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY");
  });
});
