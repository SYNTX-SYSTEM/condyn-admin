import { CapabilityKernelOutputSchema, createCapabilityCandidate, type CapabilityDiscoveryRun } from "../schema";
import { verifyCandidateEvidence } from "../evidence-validator";
import { computeSourceBundleHash, sha256Utf8 } from "../hashing";
import { computeSnapshotKey } from "../snapshot";
import type { SourceDocument } from "../source";
import type { CapabilityCoreRepository } from "../repository";
import { assertCapabilityCoverageAudit } from "./coverage-validator";
import { buildCapabilityDiscoveryPrompt } from "./prompt-builder";
import { buildCapabilityDiscoveryRunId, stableJsonStringify } from "./run";
import type { CapabilityDiscoveryConfiguration, CapabilityDiscoveryProvider, CapabilityDiscoveryRuntimeResult, CapabilityInvestigationScope, CapabilityKernelResolver, CapabilityProviderExchangeArchive, CapabilityProviderExchangeRecord, CapabilityProviderResponseRecord } from "./types";

/** At most this long does Discovery wait for the archive (PINK O-ARCHIVE-AWAIT); a slower write finishes on its own. */
export const EXCHANGE_ARCHIVE_WAIT_MS = 1000;
function boundedWait(pending: Promise<unknown>, milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, milliseconds);
    void pending.then(() => { clearTimeout(timer); resolve(); });
  });
}
/** The stable code of a failure (message up to the first colon); anything else is ERR_UNCLASSIFIED, never free text. */
function exchangeErrorCode(error: unknown): string {
  const code = error instanceof Error ? error.message.split(":")[0].trim() : "";
  return /^ERR_[A-Z0-9_]+$/.test(code) ? code : "ERR_UNCLASSIFIED";
}
/** The response a provider received and refused (CapabilityProviderResponseError), if any. */
function refusedResponse(error: unknown): CapabilityProviderResponseRecord | undefined {
  const response = error instanceof Error ? (error as { providerResponse?: unknown }).providerResponse : undefined;
  return response && typeof response === "object" ? response as CapabilityProviderResponseRecord : undefined;
}

export interface CapabilityDiscoveryRuntimeDependencies { kernelResolver: CapabilityKernelResolver; provider: CapabilityDiscoveryProvider; repository: CapabilityCoreRepository; investigationScope?: CapabilityInvestigationScope; providerExchangeArchive?: CapabilityProviderExchangeArchive; now?: () => string; }
export async function runCapabilityDiscovery(documents: SourceDocument[], config: CapabilityDiscoveryConfiguration, deps: CapabilityDiscoveryRuntimeDependencies): Promise<CapabilityDiscoveryRuntimeResult> {
  if (!documents.length) throw new Error("ERR_CAPABILITY_DISCOVERY_NO_SOURCES");
  if (new Set(documents.map(({ docId }) => docId)).size !== documents.length) throw new Error("ERR_CAPABILITY_DISCOVERY_DUPLICATE_DOC_ID");
  const sourceBundleHash = computeSourceBundleHash(documents); const kernel = await deps.kernelResolver.resolve();
  if (kernel.kernelVersion !== config.kernelVersion) throw new Error("ERR_CAPABILITY_KERNEL_VERSION_MISMATCH");
  if (deps.investigationScope !== undefined && !deps.investigationScope.text.trim()) throw new Error("ERR_CAPABILITY_DISCOVERY_SCOPE_INVALID");
  const investigationScopeHash = deps.investigationScope === undefined ? undefined : sha256Utf8(deps.investigationScope.text);
  const identity = { sourceBundleHash, kernelVersion: config.kernelVersion, promptChecksum: kernel.checksum, provider: deps.provider.providerName, model: deps.provider.model, schemaVersion: config.schemaVersion, ...(investigationScopeHash === undefined ? {} : { investigationScopeHash }) };
  // Only an unscoped Discovery short-circuits on a verified snapshot, and only under the scope-free key: a scoped
  // snapshot's key carries its scope hash (snapshot.ts), so confirmed state never crosses job scopes.
  if (investigationScopeHash === undefined) {
    const snapshot = await deps.repository.getSnapshotByKey(computeSnapshotKey({ sourceBundleHash, kernelVersion: config.kernelVersion, prompt: { checksum: kernel.checksum }, inference: { provider: deps.provider.providerName, model: deps.provider.model }, schemaVersion: config.schemaVersion }));
    if (snapshot?.status === "VERIFIED") return { kind: "VERIFIED_SNAPSHOT_REUSED", snapshot };
  }
  const runId = buildCapabilityDiscoveryRunId(identity); const existing = await deps.repository.getRunById(runId);
  if (existing?.status === "COMPLETED") return { kind: "DISCOVERY_RUN_REUSED", run: existing };
  const prompt = buildCapabilityDiscoveryPrompt(documents, kernel, deps.investigationScope);
  // Result Inspector: every received response, accepted or refused, goes to its own bounded archive with the RUN_,
  // scope and request identity it was produced under; never into the immutable run. Observation only: retention
  // neither fails nor changes the analysis, and every error is rethrown unchanged.
  const retain = async (outcome: CapabilityProviderExchangeRecord["outcome"], error: unknown, response: CapabilityProviderResponseRecord | undefined) => {
    if (!deps.providerExchangeArchive || response === undefined) return;
    const investigationScope = investigationScopeHash === undefined || deps.investigationScope === undefined ? null : { scopeHash: investigationScopeHash, text: deps.investigationScope.text };
    const request = { requestSha256: sha256Utf8(stableJsonStringify({ systemPrompt: prompt.systemPrompt, userPrompt: prompt.userPrompt })), sourceBundleHash, promptChecksum: kernel.checksum, provider: deps.provider.providerName, model: deps.provider.model, schemaVersion: config.schemaVersion };
    const archive = deps.providerExchangeArchive;
    const pending = Promise.resolve().then(() => archive.retain({ runId, outcome, errorCode: outcome === "FAILED" ? exchangeErrorCode(error) : null, request, investigationScope, response })).catch(() => undefined);
    await boundedWait(pending, EXCHANGE_ARCHIVE_WAIT_MS);
  };
  let providerResult;
  try { providerResult = await deps.provider.execute(prompt); } catch (error) { await retain("FAILED", error, refusedResponse(error)); throw error; }
  let run: CapabilityDiscoveryRun;
  try {
    let output; try { output = CapabilityKernelOutputSchema.parse(providerResult.kernelOutput); } catch { throw new Error("ERR_CAPABILITY_DISCOVERY_SCHEMA_INVALID"); }
    if (output.kernel_version !== kernel.kernelVersion) throw new Error("ERR_CAPABILITY_KERNEL_VERSION_MISMATCH");
    assertCapabilityCoverageAudit(output, documents.length);
    const candidates = output.capabilities.map((candidate) => verifyCandidateEvidence(createCapabilityCandidate(runId, candidate), documents));
    const timestamp = (deps.now ?? (() => new Date().toISOString()))();
    run = { runId, sourceBundleHash, kernelVersion: config.kernelVersion, prompt: { templateId: kernel.templateId, versionId: kernel.versionId, checksum: kernel.checksum }, inference: { provider: deps.provider.providerName, model: deps.provider.model }, schemaVersion: config.schemaVersion, status: "COMPLETED", rawOutputHash: sha256Utf8(stableJsonStringify(output)), ...(investigationScopeHash === undefined ? {} : { investigationScope: { scopeHash: investigationScopeHash } }), payload: { kernelOutput: output, candidates, coverageValidation: { status: "PASSED" } }, createdAt: timestamp, completedAt: timestamp };
    await deps.repository.saveRun(run);
  } catch (error) { await retain("FAILED", error, providerResult.providerResponse); throw error; }
  await retain("COMPLETED", null, providerResult.providerResponse);
  return { kind: "DISCOVERY_COMPLETED", run };
}
