import { CapabilityKernelOutputSchema, createCapabilityCandidate, type CapabilityCandidate, type CapabilityDiscoveryRun, type EvidenceVerificationStatus } from "../schema";
import type { CapabilityCoreRepository } from "../repository";
import { sha256Utf8 } from "../hashing";
import { buildCapabilityConvergencePrompt } from "./prompt-builder";
import { canonicalizeCapabilityConvergence } from "./canonicalizer";
import { buildCapabilityConvergenceRunId, stableConvergenceJsonStringify } from "./run";
import { CapabilityConvergenceOutputSchema } from "./schema";
import type { CapabilityConvergenceConfiguration, CapabilityConvergenceRuntimeResult, CapabilityConvergenceKernelResolver, CapabilityConvergenceProvider, CapabilityConvergenceRun } from "./types";
import { validateCapabilityConvergenceOutput } from "./validator";
import { compareCapabilityConvergenceStrings } from "./ordering";
import { buildCapabilityDiscoveryRunId, stableJsonStringify } from "../discovery/run";

export interface CapabilityConvergenceRuntimeDependencies { kernelResolver: CapabilityConvergenceKernelResolver; provider: CapabilityConvergenceProvider; repository: CapabilityCoreRepository; now?: () => string; }
function discoveryCandidates(run: CapabilityDiscoveryRun): CapabilityCandidate[] {
  if (!run || typeof run !== "object" || !run.payload || typeof run.payload !== "object" || Array.isArray(run.payload)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  const payload = run.payload as { kernelOutput?: unknown; candidates?: unknown; coverageValidation?: unknown };
  if (!Array.isArray(payload.candidates) || !payload.coverageValidation || typeof payload.coverageValidation !== "object" || (payload.coverageValidation as { status?: unknown }).status !== "PASSED") throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  let kernelOutput; try { kernelOutput = CapabilityKernelOutputSchema.parse(payload.kernelOutput); } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID"); }
  if (kernelOutput.kernel_version !== run.kernelVersion || !run.rawOutputHash || sha256Utf8(stableJsonStringify(kernelOutput)) !== run.rawOutputHash) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  const expectedRunId = buildCapabilityDiscoveryRunId({ sourceBundleHash: run.sourceBundleHash, kernelVersion: run.kernelVersion, promptChecksum: run.prompt?.checksum, provider: run.inference?.provider, model: run.inference?.model, schemaVersion: run.schemaVersion });
  if (expectedRunId !== run.runId) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  const candidateIds = new Set<string>();
  const verificationStatuses = new Set<EvidenceVerificationStatus>(["UNVERIFIED", "VERIFIED", "REJECTED_UNKNOWN_SOURCE", "REJECTED_EMPTY_QUOTE", "REJECTED_QUOTE_NOT_FOUND", "REJECTED_LOCATION_MISMATCH"]);
  for (const value of payload.candidates) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
    const candidate = value as CapabilityCandidate;
    if (typeof candidate.candidateId !== "string" || !candidate.candidateId.trim() || candidate.runId !== run.runId || (candidate.status !== "EVIDENCE_PASSED" && candidate.status !== "EVIDENCE_REJECTED") || !Array.isArray(candidate.evidenceClaims) || candidateIds.has(candidate.candidateId)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
    candidateIds.add(candidate.candidateId);
    let verifiedEvidenceCount = 0;
    for (const evidence of candidate.evidenceClaims) {
      if (!evidence || typeof evidence !== "object" || typeof evidence.evidenceId !== "string" || !evidence.evidenceId.trim() || !evidence.verification || typeof evidence.verification !== "object") throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
      if (!verificationStatuses.has(evidence.verification.status)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
      if (evidence.verification.status === "VERIFIED") { if (typeof evidence.verification.matchedDocId !== "string" || !evidence.verification.matchedDocId.trim()) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID"); verifiedEvidenceCount++; }
    }
    if ((candidate.status === "EVIDENCE_PASSED" && verifiedEvidenceCount === 0) || (candidate.status === "EVIDENCE_REJECTED" && verifiedEvidenceCount !== 0)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  }
  const persisted = new Map((payload.candidates as CapabilityCandidate[]).map((candidate) => [candidate.candidateId, candidate]));
  if (persisted.size !== kernelOutput.capabilities.length) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  for (const input of kernelOutput.capabilities) {
    const expected = createCapabilityCandidate(run.runId, input); const actual = persisted.get(expected.candidateId);
    if (!actual || actual.candidateId !== expected.candidateId || actual.runId !== expected.runId || actual.proposedCanonicalName !== expected.proposedCanonicalName || actual.proposedScope !== expected.proposedScope || actual.structuralDefinition !== expected.structuralDefinition || actual.proposedPrimaryDomain !== expected.proposedPrimaryDomain || actual.proposedDemonstratedLevel !== expected.proposedDemonstratedLevel || actual.modelConfidence !== expected.modelConfidence || actual.evidenceMode !== expected.evidenceMode || actual.evidenceClaims.length !== expected.evidenceClaims.length) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
    for (let index = 0; index < expected.evidenceClaims.length; index++) { const expectedEvidence = expected.evidenceClaims[index]; const actualEvidence = actual.evidenceClaims[index]; if (!actualEvidence || actualEvidence.evidenceId !== expectedEvidence.evidenceId || actualEvidence.sourceDocumentRef !== expectedEvidence.sourceDocumentRef || actualEvidence.declaredLocation !== expectedEvidence.declaredLocation || actualEvidence.exactQuote !== expectedEvidence.exactQuote) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID"); }
  }
  return payload.candidates as CapabilityCandidate[];
}
export async function runCapabilityConvergence(discoveryRun: CapabilityDiscoveryRun, config: CapabilityConvergenceConfiguration, deps: CapabilityConvergenceRuntimeDependencies): Promise<CapabilityConvergenceRuntimeResult> {
  if (!discoveryRun || typeof discoveryRun !== "object") throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID"); if (discoveryRun.status !== "COMPLETED") throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_NOT_COMPLETED"); const candidates = discoveryCandidates(discoveryRun); if (!discoveryRun.rawOutputHash) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  const kernel = await deps.kernelResolver.resolve(); if (kernel.kernelVersion !== config.kernelVersion) throw new Error("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  const identity = { discoveryRunId: discoveryRun.runId, discoveryRawOutputHash: discoveryRun.rawOutputHash, kernelVersion: config.kernelVersion, promptChecksum: kernel.checksum, provider: deps.provider.providerName, model: deps.provider.model, schemaVersion: config.schemaVersion, algorithmVersion: config.algorithmVersion }; const convergenceRunId = buildCapabilityConvergenceRunId(identity); const existing = await deps.repository.getConvergenceRunById(convergenceRunId); if (existing?.status === "COMPLETED") return { kind: "CONVERGENCE_RUN_REUSED", run: existing };
  const eligible = candidates.filter((candidate) => candidate.status === "EVIDENCE_PASSED"); const excludedCandidateIds = candidates.filter((candidate) => candidate.status === "EVIDENCE_REJECTED").map((candidate) => candidate.candidateId).sort(compareCapabilityConvergenceStrings);
  const output = eligible.length === 0 ? { convergence_version: kernel.kernelVersion, groups: [], relations: [], reconciliation_audit: { input_candidate_count: 0, grouped_candidate_count: 0, group_count: 0, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } } : (await deps.provider.execute(buildCapabilityConvergencePrompt(eligible, kernel))).convergenceOutput;
  let parsed; try { parsed = CapabilityConvergenceOutputSchema.parse(output); } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_SCHEMA_INVALID"); } if (parsed.convergence_version !== kernel.kernelVersion) throw new Error("ERR_CAPABILITY_CONVERGENCE_SCHEMA_INVALID"); const validated = validateCapabilityConvergenceOutput(parsed, candidates); const timestamp = (deps.now ?? (() => new Date().toISOString()))(); const canonical = canonicalizeCapabilityConvergence(validated, candidates, timestamp);
  const run: CapabilityConvergenceRun = { runKind: "CAPABILITY_CONVERGENCE", convergenceRunId, discoveryRunId: discoveryRun.runId, discoveryRawOutputHash: discoveryRun.rawOutputHash, sourceBundleHash: discoveryRun.sourceBundleHash, kernelVersion: config.kernelVersion, prompt: { templateId: kernel.templateId, versionId: kernel.versionId, checksum: kernel.checksum }, inference: { provider: deps.provider.providerName, model: deps.provider.model }, schemaVersion: config.schemaVersion, algorithmVersion: config.algorithmVersion, status: "COMPLETED", rawOutputHash: sha256Utf8(stableConvergenceJsonStringify(validated)), payload: { convergenceOutput: validated, canonicalDrafts: canonical.canonicalDrafts, proposedRelations: canonical.proposedRelations, eligibleCandidateIds: eligible.map((candidate) => candidate.candidateId).sort(compareCapabilityConvergenceStrings), excludedCandidateIds, reconciliation: { status: "PASSED" } }, createdAt: timestamp, completedAt: timestamp };
  await deps.repository.saveConvergenceRun(run); return { kind: "CONVERGENCE_COMPLETED", run };
}
