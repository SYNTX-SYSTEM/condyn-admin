import { CapabilityKernelOutputSchema, createCapabilityCandidate, type CapabilityDiscoveryRun } from "../schema";
import { verifyCandidateEvidence } from "../evidence-validator";
import { computeSourceBundleHash, sha256Utf8 } from "../hashing";
import { computeSnapshotKey } from "../snapshot";
import type { SourceDocument } from "../source";
import type { CapabilityCoreRepository } from "../repository";
import { assertCapabilityCoverageAudit } from "./coverage-validator";
import { buildCapabilityDiscoveryPrompt } from "./prompt-builder";
import { buildCapabilityDiscoveryRunId, stableJsonStringify } from "./run";
import type { CapabilityDiscoveryConfiguration, CapabilityDiscoveryProvider, CapabilityDiscoveryRuntimeResult, CapabilityKernelResolver } from "./types";

export interface CapabilityDiscoveryRuntimeDependencies { kernelResolver: CapabilityKernelResolver; provider: CapabilityDiscoveryProvider; repository: CapabilityCoreRepository; now?: () => string; }
export async function runCapabilityDiscovery(documents: SourceDocument[], config: CapabilityDiscoveryConfiguration, deps: CapabilityDiscoveryRuntimeDependencies): Promise<CapabilityDiscoveryRuntimeResult> {
  if (!documents.length) throw new Error("ERR_CAPABILITY_DISCOVERY_NO_SOURCES");
  if (new Set(documents.map(({ docId }) => docId)).size !== documents.length) throw new Error("ERR_CAPABILITY_DISCOVERY_DUPLICATE_DOC_ID");
  const sourceBundleHash = computeSourceBundleHash(documents); const kernel = await deps.kernelResolver.resolve();
  if (kernel.kernelVersion !== config.kernelVersion) throw new Error("ERR_CAPABILITY_KERNEL_VERSION_MISMATCH");
  const identity = { sourceBundleHash, kernelVersion: config.kernelVersion, promptChecksum: kernel.checksum, provider: deps.provider.providerName, model: deps.provider.model, schemaVersion: config.schemaVersion };
  const snapshot = await deps.repository.getSnapshotByKey(computeSnapshotKey({ sourceBundleHash, kernelVersion: config.kernelVersion, prompt: { checksum: kernel.checksum }, inference: { provider: deps.provider.providerName, model: deps.provider.model }, schemaVersion: config.schemaVersion }));
  if (snapshot?.status === "VERIFIED") return { kind: "VERIFIED_SNAPSHOT_REUSED", snapshot };
  const runId = buildCapabilityDiscoveryRunId(identity); const existing = await deps.repository.getRunById(runId);
  if (existing?.status === "COMPLETED") return { kind: "DISCOVERY_RUN_REUSED", run: existing };
  const prompt = buildCapabilityDiscoveryPrompt(documents, kernel); const providerResult = await deps.provider.execute(prompt);
  let output; try { output = CapabilityKernelOutputSchema.parse(providerResult.kernelOutput); } catch { throw new Error("ERR_CAPABILITY_DISCOVERY_SCHEMA_INVALID"); }
  if (output.kernel_version !== kernel.kernelVersion) throw new Error("ERR_CAPABILITY_KERNEL_VERSION_MISMATCH");
  assertCapabilityCoverageAudit(output, documents.length);
  const candidates = output.capabilities.map((candidate) => verifyCandidateEvidence(createCapabilityCandidate(runId, candidate), documents));
  const timestamp = (deps.now ?? (() => new Date().toISOString()))();
  const run: CapabilityDiscoveryRun = { runId, sourceBundleHash, kernelVersion: config.kernelVersion, prompt: { templateId: kernel.templateId, versionId: kernel.versionId, checksum: kernel.checksum }, inference: { provider: deps.provider.providerName, model: deps.provider.model }, schemaVersion: config.schemaVersion, status: "COMPLETED", rawOutputHash: sha256Utf8(stableJsonStringify(output)), payload: { kernelOutput: output, candidates, coverageValidation: { status: "PASSED" } }, createdAt: timestamp, completedAt: timestamp };
  await deps.repository.saveRun(run); return { kind: "DISCOVERY_COMPLETED", run };
}
