import type { CapabilityCandidate, CapabilityDiscoveryRun, CapabilityKernelOutput, VerifiedCapabilitySnapshot } from "../schema";

export interface ResolvedCapabilityKernel { kernelVersion: string; templateId: string; versionId: string; checksum: string; plainTextContent: string; }
export interface CapabilityKernelResolver { resolve(): Promise<ResolvedCapabilityKernel>; }
export interface CapabilityDiscoveryConfiguration { kernelVersion: string; schemaVersion: string; }
export interface CapabilityDiscoveryIdentityInput { sourceBundleHash: string; kernelVersion: string; promptChecksum: string; provider: string; model: string; schemaVersion: string; investigationScopeHash?: string; }
/**
 * Instruction-only investigation scope of one Discovery run (the selected job). It is rendered into the system
 * prompt, never into the source corpus: it is not a SourceDocument and can never verify evidence. Its hash is part
 * of the run identity, so a run is reused only for the same sources AND the same scope.
 */
export interface CapabilityInvestigationScope { text: string; }
export interface CapabilityDiscoveryPrompt { systemPrompt: string; userPrompt: string; }
export interface CapabilityDiscoveryProviderRequest { systemPrompt: string; userPrompt: string; }
/**
 * The provider return content exactly as received, before JSON parsing, schema validation, evidence verification,
 * Convergence or projection (Result Inspector). `text` is the model output string unchanged; the envelope fields are
 * copied as delivered. Providers that do not keep it (test fakes) omit it.
 */
export interface CapabilityProviderResponseRecord { text: string; textSha256: string; finishReason: string | null; modelVersion: string | null; responseId: string | null; usageMetadata: Record<string, unknown> | null; receivedAt: string; }
export interface CapabilityDiscoveryProviderResult { kernelOutput: CapabilityKernelOutput; providerResponse?: CapabilityProviderResponseRecord; }
export interface CapabilityDiscoveryProvider { readonly providerName: string; readonly model: string; execute(request: CapabilityDiscoveryProviderRequest): Promise<CapabilityDiscoveryProviderResult>; }
/**
 * One Discovery provider exchange (Result Inspector): the scope text sent with the request and the response as
 * received, bound to the RUN_ id. It never enters the immutable run; an archive keeps it for a bounded time only.
 */
export interface CapabilityProviderExchangeRecord { runId: string; investigationScope: { scopeHash: string; text: string } | null; response: CapabilityProviderResponseRecord; }
export interface CapabilityProviderExchangeArchive { retain(record: CapabilityProviderExchangeRecord): Promise<void>; }
export interface CapabilityDiscoveryRunPayload { kernelOutput: CapabilityKernelOutput; candidates: CapabilityCandidate[]; coverageValidation: { status: "PASSED" }; }
export type CapabilityDiscoveryRuntimeResult = { kind: "VERIFIED_SNAPSHOT_REUSED"; snapshot: VerifiedCapabilitySnapshot } | { kind: "DISCOVERY_RUN_REUSED"; run: CapabilityDiscoveryRun } | { kind: "DISCOVERY_COMPLETED"; run: CapabilityDiscoveryRun };
