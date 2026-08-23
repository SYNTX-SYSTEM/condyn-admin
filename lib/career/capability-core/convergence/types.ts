import type { CapabilityCandidate, CapabilityRelation, CapabilityScope } from "../schema";
import type { CapabilityConvergenceOutput } from "./schema";

export interface ResolvedCapabilityConvergenceKernel { kernelVersion: string; templateId: string; versionId: string; checksum: string; plainTextContent: string; }
export interface CapabilityConvergenceKernelResolver { resolve(): Promise<ResolvedCapabilityConvergenceKernel>; }
export interface CapabilityConvergenceConfiguration { kernelVersion: string; schemaVersion: string; algorithmVersion: string; }
export interface CapabilityConvergencePrompt { systemPrompt: string; userPrompt: string; }
export interface CapabilityConvergenceProviderRequest { systemPrompt: string; userPrompt: string; }
export interface CapabilityConvergenceProviderResult { convergenceOutput: CapabilityConvergenceOutput; }
export interface CapabilityConvergenceProvider { readonly providerName: string; readonly model: string; execute(request: CapabilityConvergenceProviderRequest): Promise<CapabilityConvergenceProviderResult>; }
export interface CanonicalCapabilityDraft { provisionalCapabilityId: string; canonicalName: string; scope: CapabilityScope; structuralDefinition: string; primaryDomain: string | null; evidenceIds: string[]; provenance: { sourceCandidateIds: string[]; sourceDocumentIds: string[] }; semanticDefinitionStatus: "NOT_RUN"; }
export interface CapabilityConvergenceRun { runKind: "CAPABILITY_CONVERGENCE"; convergenceRunId: string; discoveryRunId: string; discoveryRawOutputHash: string; sourceBundleHash: string; kernelVersion: string; prompt: { templateId?: string; versionId?: string; checksum: string }; inference: { provider: string; model: string }; schemaVersion: string; algorithmVersion: string; status: "COMPLETED"; rawOutputHash: string; payload: { convergenceOutput: CapabilityConvergenceOutput; canonicalDrafts: CanonicalCapabilityDraft[]; proposedRelations: CapabilityRelation[]; eligibleCandidateIds: string[]; excludedCandidateIds: string[]; reconciliation: { status: "PASSED" } }; createdAt: string; completedAt: string; }
export interface CapabilityConvergenceIdentityInput { discoveryRunId: string; discoveryRawOutputHash: string; kernelVersion: string; promptChecksum: string; provider: string; model: string; schemaVersion: string; algorithmVersion: string; }
export type CapabilityConvergenceRuntimeResult = { kind: "CONVERGENCE_RUN_REUSED"; run: CapabilityConvergenceRun } | { kind: "CONVERGENCE_COMPLETED"; run: CapabilityConvergenceRun };
export type EligibleCapabilityCandidate = CapabilityCandidate & { status: "EVIDENCE_PASSED" };
