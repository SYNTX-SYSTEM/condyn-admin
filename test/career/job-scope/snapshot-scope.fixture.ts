import * as core from "../../../lib/career/capability-core";
import * as verification from "../../../lib/career/capability-core/verification";
import type { CapabilityVerificationIntegrityInput, CapabilityVerificationRun } from "../../../lib/career/capability-core/verification";

/**
 * One persisted Discovery → Convergence → Verification chain over the same two source documents, optionally bound to
 * an investigation scope (SFE job scope). Same shape as the sealed Phase-4 contract fixture, plus the scope identity
 * exactly as the Discovery runtime writes it (`investigationScope.scopeHash`, RUN_ id with investigationScopeHash).
 */
export const SCOPE_X = core.sha256Utf8("SCOPE X — Backend Engineer");
export const SCOPE_Y = core.sha256Utf8("SCOPE Y — Data Engineer");

const source = (id: string, quote: string) => core.createSourceDocument({ docId: id, title: id, rawContent: quote });
const createdAt = "2026-01-01T00:00:00.000Z";

export function scopedChain(scopeHash?: string, options: { runIdScopeHash?: string | null } = {}): CapabilityVerificationIntegrityInput {
  const sourceDocuments = [source("DOC_A", "Proof A"), source("DOC_B", "Proof B")];
  const capabilities = [
    { canonical_name: "Capability A", capability_scope: "ATOMIC" as const, structural_definition: "Definition A", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT" as const, evidence: [{ source_document: "DOC_A", location: "source", exact_quote: "Proof A" }] },
    { canonical_name: "Capability B", capability_scope: "ATOMIC" as const, structural_definition: "Definition B", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT" as const, evidence: [{ source_document: "DOC_B", location: "source", exact_quote: "Proof B" }] }
  ];
  const kernelOutput: core.CapabilityKernelOutput = { kernel_version: "discovery-v1", capabilities, coverage_audit: { source_documents_examined: 2, capability_count: 2, atomic_capability_count: 2, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 } };
  const sourceBundleHash = core.computeSourceBundleHash(sourceDocuments);
  // runIdScopeHash lets a test forge a run whose RUN_ id was derived from another scope (or none: null).
  const idScope = options.runIdScopeHash === undefined ? scopeHash : options.runIdScopeHash ?? undefined;
  const runId = core.buildCapabilityDiscoveryRunId({ sourceBundleHash, kernelVersion: "discovery-v1", promptChecksum: "discovery-prompt", provider: "gemini", model: "discovery-model", schemaVersion: "discovery-schema", ...(idScope === undefined ? {} : { investigationScopeHash: idScope }) });
  const candidates = kernelOutput.capabilities.map((item) => core.verifyCandidateEvidence(core.createCapabilityCandidate(runId, item), sourceDocuments));
  const rawOutputHash = core.sha256Utf8(core.stableJsonStringify(kernelOutput));
  const discoveryRun: core.CapabilityDiscoveryRun = { runId, sourceBundleHash, kernelVersion: "discovery-v1", prompt: { checksum: "discovery-prompt" }, inference: { provider: "gemini", model: "discovery-model" }, schemaVersion: "discovery-schema", status: "COMPLETED", rawOutputHash, ...(scopeHash === undefined ? {} : { investigationScope: { scopeHash } as core.CapabilityDiscoveryRun["investigationScope"] & object }), payload: { kernelOutput, candidates, coverageValidation: { status: "PASSED" } }, createdAt, completedAt: createdAt };
  const groups = candidates.map((candidate, index) => ({ group_key: `group-${index}`, member_candidate_ids: [candidate.candidateId], canonical_name: capabilities[index].canonical_name, capability_scope: "ATOMIC" as const, structural_definition: capabilities[index].structural_definition, primary_domain: null }));
  const convergenceOutput = core.validateCapabilityConvergenceOutput({ convergence_version: "convergence-v1", groups, relations: [], reconciliation_audit: { input_candidate_count: 2, grouped_candidate_count: 2, group_count: 2, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } }, candidates);
  const convergenceRawOutputHash = core.sha256Utf8(core.stableConvergenceJsonStringify(convergenceOutput));
  const convergenceRunId = core.buildCapabilityConvergenceRunId({ discoveryRunId: runId, discoveryRawOutputHash: rawOutputHash, kernelVersion: "convergence-v1", promptChecksum: "convergence-prompt", provider: "gemini", model: "convergence-model", schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm" });
  const canonical = core.canonicalizeCapabilityConvergence(convergenceOutput, candidates, createdAt);
  const convergenceRun: core.CapabilityConvergenceRun = { runKind: "CAPABILITY_CONVERGENCE", convergenceRunId, discoveryRunId: runId, discoveryRawOutputHash: rawOutputHash, sourceBundleHash, kernelVersion: "convergence-v1", prompt: { checksum: "convergence-prompt" }, inference: { provider: "gemini", model: "convergence-model" }, schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm", status: "COMPLETED", rawOutputHash: convergenceRawOutputHash, payload: { convergenceOutput, canonicalDrafts: canonical.canonicalDrafts, proposedRelations: canonical.proposedRelations, eligibleCandidateIds: candidates.map((candidate) => candidate.candidateId).sort((left, right) => left < right ? -1 : left > right ? 1 : 0), excludedCandidateIds: [], reconciliation: { status: "PASSED" } }, createdAt, completedAt: createdAt };
  const payload: CapabilityVerificationRun["payload"] = { semanticDefinitionOutcomes: canonical.canonicalDrafts.map((draft) => ({ provisionalCapabilityId: draft.provisionalCapabilityId, status: "PASSED" as const })), demonstratedLevelOutcomes: canonical.canonicalDrafts.map((draft) => ({ provisionalCapabilityId: draft.provisionalCapabilityId, status: "UNVERIFIED" as const, demonstratedCapabilityLevel: null })), relationDispositions: [], publicationEligibility: "ELIGIBLE" };
  const verificationRun: CapabilityVerificationRun = { runKind: "CAPABILITY_VERIFICATION", verificationRunId: "", convergenceRunId, convergenceRawOutputHash, sourceEvidenceRepresentationHash: verification.computeSourceEvidenceRepresentationHash(sourceDocuments), sourceBundleHash, kernelVersion: "verification-v1", promptChecksum: "verification-prompt", inference: { provider: "gemini", model: "verification-model" }, schemaVersion: "verification-schema", algorithmVersion: "verification-algorithm", snapshotSchemaVersion: "snapshot-schema", rawOutputHash: verification.computeCapabilityVerificationRawOutputHash(payload), status: "COMPLETED", payload, createdAt, completedAt: "2026-02-02T00:00:00.000Z" };
  verificationRun.verificationRunId = verification.buildCapabilityVerificationRunId({ convergenceRunId, convergenceRawOutputHash, sourceEvidenceRepresentationHash: verificationRun.sourceEvidenceRepresentationHash, kernelVersion: verificationRun.kernelVersion, promptChecksum: verificationRun.promptChecksum, provider: verificationRun.inference.provider, model: verificationRun.inference.model, schemaVersion: verificationRun.schemaVersion, algorithmVersion: verificationRun.algorithmVersion, snapshotSchemaVersion: verificationRun.snapshotSchemaVersion });
  return { sourceDocuments, discoveryRun, convergenceRun, verificationRun };
}

export async function persistChain(repository: core.CapabilityCoreRepository, input: CapabilityVerificationIntegrityInput): Promise<void> {
  await repository.saveRun(input.discoveryRun); await repository.saveConvergenceRun(input.convergenceRun); await repository.saveVerificationRun(input.verificationRun);
}
