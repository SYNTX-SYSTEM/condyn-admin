import type { CapabilityCandidate, CapabilityDiscoveryRun, CapabilityKernelOutput, VerifiedCapabilitySnapshot } from "../schema";

export interface ResolvedCapabilityKernel { kernelVersion: string; templateId: string; versionId: string; checksum: string; plainTextContent: string; }
export interface CapabilityKernelResolver { resolve(): Promise<ResolvedCapabilityKernel>; }
export interface CapabilityDiscoveryConfiguration { kernelVersion: string; schemaVersion: string; }
export interface CapabilityDiscoveryIdentityInput { sourceBundleHash: string; kernelVersion: string; promptChecksum: string; provider: string; model: string; schemaVersion: string; }
export interface CapabilityDiscoveryPrompt { systemPrompt: string; userPrompt: string; }
export interface CapabilityDiscoveryProviderRequest { systemPrompt: string; userPrompt: string; }
export interface CapabilityDiscoveryProviderResult { kernelOutput: CapabilityKernelOutput; }
export interface CapabilityDiscoveryProvider { readonly providerName: string; readonly model: string; execute(request: CapabilityDiscoveryProviderRequest): Promise<CapabilityDiscoveryProviderResult>; }
export interface CapabilityDiscoveryRunPayload { kernelOutput: CapabilityKernelOutput; candidates: CapabilityCandidate[]; coverageValidation: { status: "PASSED" }; }
export type CapabilityDiscoveryRuntimeResult = { kind: "VERIFIED_SNAPSHOT_REUSED"; snapshot: VerifiedCapabilitySnapshot } | { kind: "DISCOVERY_RUN_REUSED"; run: CapabilityDiscoveryRun } | { kind: "DISCOVERY_COMPLETED"; run: CapabilityDiscoveryRun };
