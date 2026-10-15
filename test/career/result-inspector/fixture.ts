import {
  GeminiCapabilityDiscoveryProvider, computeSourceBundleHash, createSourceDocument, runCapabilityConvergence, runCapabilityDiscovery,
  type CandidateSourceBundleRepository, type CapabilityCoreRepository, type CapabilityDiscoveryProvider, type CapabilityDiscoveryRun,
  type CapabilityProposalProjectionReferenceRepository
} from "../../../lib/career/capability-core";
import { renderInvestigationScope, type ResolvedJobScope } from "../../../lib/career/job-scope";
import { createJob, type JobRecord } from "../../../lib/career/orchestration/job";
import type { ProviderExchangeStore } from "../../../lib/career/result-inspector";

/** Shared, network-free world of the Result Inspector tests: a fake Gemini client behind the real Gemini provider. */
export const SOURCE = "Led the migration of the dispatch platform to event-driven services.";
export const cv = createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: SOURCE });
export const PDF_MARKER = "JVBERi0xLjQKJcfsj6IKUERGX01BUktFUg==";
const discoveryKernel = { kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" };
const convergenceKernel = { kernelVersion: "convergence-v1", templateId: "T", versionId: "V", checksum: "CC", plainTextContent: "FAKE_CONVERGENCE_KERNEL" };
const config = { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" };
const convergenceConfig = { kernelVersion: "convergence-v1", schemaVersion: "convergence-schema-v1", algorithmVersion: "algorithm-v1" };
const audit = (count: number) => ({ source_documents_examined: 1, capability_count: count, atomic_capability_count: count, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 });
const capability = (name: string, quote: string) => ({ evidence: [{ exact_quote: quote, location: "body", source_document: "CV" }], model_confidence: 0.9, evidence_mode: "EXPLICIT", structural_definition: name, primary_domain: null, demonstrated_capability_level: null, capability_scope: "ATOMIC", canonical_name: name });

/**
 * The text a Gemini response carries: deliberately NOT the canonical form of the parsed object (other key order,
 * indentation, trailing newline), so a stored parse result can never pass for the original text.
 */
export function geminiText(label: string): string {
  const capabilities = [capability(`Event-driven migration ${label}`, SOURCE), capability(`Invented ${label}`, "never written in the CV")];
  return `${JSON.stringify({ coverage_audit: audit(capabilities.length), capabilities, kernel_version: "discovery-v1" }, null, 3)}\n`;
}

/** A response as Gemini would deliver it: plain text with STOP, or an explicit text/finishReason (refusal cases). */
export type FakeGeminiResponse = string | { text?: unknown; finishReason?: string };

export function fakeGeminiClient(responses: FakeGeminiResponse[]) {
  const requests: unknown[] = [];
  return {
    requests,
    models: {
      async generateContent(request: unknown) {
        requests.push(request);
        const index = requests.length - 1;
        const spec = typeof responses[index] === "string" ? { text: responses[index], finishReason: "STOP" } : responses[index] as { text?: unknown; finishReason?: string };
        return { text: spec.text, candidates: [{ finishReason: spec.finishReason ?? "STOP" }], modelVersion: "gemini-fake-001", responseId: `resp-${index + 1}`, usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 22 } };
      }
    }
  };
}

/** Kernel output of geminiText with a coverage audit that does not match the sources (runtime-level refusal). */
export function geminiTextWithBrokenAudit(label: string): string {
  const parsed = JSON.parse(geminiText(label)) as { coverage_audit: { source_documents_examined: number } };
  parsed.coverage_audit.source_documents_examined = 99;
  return JSON.stringify(parsed);
}

export const geminiProvider = (client: ReturnType<typeof fakeGeminiClient>) =>
  new GeminiCapabilityDiscoveryProvider({ model: "gemini-fake", client, now: () => "2026-10-15T10:00:00.000Z" });

const convergenceProvider = {
  providerName: "fake", model: "m",
  execute: async (request: { userPrompt: string }) => {
    const ids = (JSON.parse(request.userPrompt.slice(request.userPrompt.indexOf("["))) as Array<{ candidate_id: string }>).map(item => item.candidate_id);
    return { convergenceOutput: { convergence_version: "convergence-v1", groups: [{ group_key: "g", member_candidate_ids: ids, canonical_name: "Event-driven migration", capability_scope: "ATOMIC" as const, structural_definition: "d", primary_domain: null }], relations: [], reconciliation_audit: { input_candidate_count: ids.length, grouped_candidate_count: ids.length, group_count: 1, same_capability_merge_count: ids.length - 1, unresolved_relation_count: 0, reconciliation_pass_completed: true } } };
  }
};

export interface InspectorWorld {
  capabilityRepository: CapabilityCoreRepository;
  references: CapabilityProposalProjectionReferenceRepository;
  sourceBundles: CandidateSourceBundleRepository;
  saveJob(job: JobRecord): Promise<void>;
  /** PostgreSQL only: the reference row requires an existing analysis row (foreign key). */
  saveAnalysis?(analysisId: string, createdAt: string): Promise<void>;
  /** The bounded exchange archive the worker would hand to Discovery; absent means nothing is retained. */
  exchanges?: ProviderExchangeStore;
}

/** One analysis the way the worker produces it: Discovery → Convergence → source bundle → projection reference. */
export async function produceAnalysis(world: InspectorWorld, provider: CapabilityDiscoveryProvider, scope: ResolvedJobScope | null, suffix: string, source = cv) {
  const discovery = await runCapabilityDiscovery([source], config, { kernelResolver: { resolve: async () => discoveryKernel }, provider, repository: world.capabilityRepository, ...(scope ? { investigationScope: renderInvestigationScope(scope) } : {}), ...(world.exchanges ? { providerExchangeArchive: world.exchanges } : {}) });
  const run = (discovery as { run: CapabilityDiscoveryRun }).run;
  if (!run) throw new Error(`fixture expects a Discovery run, got ${discovery.kind}`);
  const convergence = await runCapabilityConvergence((await world.capabilityRepository.getRunById(run.runId))!, convergenceConfig, { kernelResolver: { resolve: async () => convergenceKernel }, provider: convergenceProvider, repository: world.capabilityRepository });
  const job = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { documents: [{ type: "pdf", name: "cv.synthetic.pdf", content: PDF_MARKER }], ...(scope ? { jobScope: scope.selection } : { investigation: { mode: "PERSON" } }) } });
  await world.saveJob(job);
  const analysisId = job.jobId.replace("JOB_", "ANL_");
  const candidateSourceBundleId = `CSB_${job.jobId}`;
  await world.sourceBundles.persistCandidateSourceBundle({ candidateSourceBundleId, sourceBundleHash: computeSourceBundleHash([source]), documents: [source], schemaVersion: "CANDIDATE_SOURCE_BUNDLE_V1", createdAt: "2026-10-15T10:00:00.000Z" });
  await world.saveAnalysis?.(analysisId, convergence.run.completedAt);
  await world.references.save({ analysisId, jobId: job.jobId, discoveryRunId: run.runId, convergenceRunId: convergence.run.convergenceRunId, candidateSourceBundleId, sourceBundleHash: run.sourceBundleHash, createdAt: convergence.run.completedAt });
  return { analysisId, job, run, convergenceRun: convergence.run, suffix };
}
