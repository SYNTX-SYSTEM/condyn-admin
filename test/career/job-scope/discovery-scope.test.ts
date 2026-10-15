import { describe, expect, it } from "vitest";
import {
  InMemoryCapabilityCoreRepository, buildCapabilityDiscoveryPrompt, buildCapabilityDiscoveryRunId, createCapabilityProposalRuntime, createSourceDocument,
  runCapabilityConvergence, runCapabilityDiscovery, type CapabilityDiscoveryProvider, type CapabilityDiscoveryProviderRequest, type CapabilityDiscoveryRun
} from "../../../lib/career/capability-core";
import { createCareerCapabilityProposalExecutor } from "../../../lib/career/orchestration/capability-proposal-executor";
import { JOB_SCOPE_REQUIRED_MESSAGE, renderInvestigationScope } from "../../../lib/career/job-scope";
import { TEST_JOB_SCOPE_B, resolveTestJobScope } from "../../support/job-scope";

const SOURCE = "Led the migration of the dispatch platform to event-driven services.";
const cv = createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: SOURCE });
const discoveryKernel = { kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" };
const convergenceKernel = { kernelVersion: "convergence-v1", templateId: "T", versionId: "V", checksum: "CC", plainTextContent: "FAKE_CONVERGENCE_KERNEL" };
const config = { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" };
const convergenceConfig = { kernelVersion: "convergence-v1", schemaVersion: "convergence-schema-v1", algorithmVersion: "algorithm-v1" };
const audit = (count: number) => ({ source_documents_examined: 1, capability_count: count, atomic_capability_count: count, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 });
const capability = (name: string, sourceDocument: string, quote: string) => ({ canonical_name: name, capability_scope: "ATOMIC" as const, structural_definition: name, primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT" as const, evidence: [{ source_document: sourceDocument, location: "body", exact_quote: quote }] });

/** Recording provider: a claim from the sources, a scope line cited as if from the CV, and the scope cited as a source. */
function recordingProvider(scopeQuote: string) {
  const requests: CapabilityDiscoveryProviderRequest[] = [];
  const provider: CapabilityDiscoveryProvider = {
    providerName: "fake", model: "m",
    execute: async (request) => {
      requests.push(request);
      const capabilities = [capability("Event-driven migration", "CV", SOURCE), capability("Scope echo", "CV", scopeQuote), capability("Scope as source", "INVESTIGATION_SCOPE", scopeQuote)];
      return { kernelOutput: { kernel_version: "discovery-v1", capabilities, coverage_audit: audit(capabilities.length) } };
    }
  };
  return { provider, requests };
}

const scopeA = resolveTestJobScope();
const scopeB = resolveTestJobScope(TEST_JOB_SCOPE_B);
const descriptionLine = scopeA.scopeLines.find(line => line.includes(" DESCRIPTION: "))!;
const descriptionText = descriptionLine.slice(descriptionLine.indexOf(": ") + 2);

describe("job scope in Capability Discovery", () => {
  it("renders role, description, requirements and mapping; only issued scopes", () => {
    const { text } = renderInvestigationScope(scopeA);
    expect(text).toContain(`SELECTED_ROLE_ID: "${scopeA.selection.poolRoleId}"`);
    expect(text).toContain(descriptionLine);
    for (const { poolRequirement, mapping } of scopeA.requirements) {
      expect(text).toContain(`REQUIREMENT ${poolRequirement.id}: `);
      expect(text).toContain(`TARGET_REQUIREMENT_REVISION_ID "${mapping.targetRequirementRevisionId}"`);
    }
    expect(renderInvestigationScope(scopeA)).toEqual(renderInvestigationScope(resolveTestJobScope()));
    expect(() => renderInvestigationScope(structuredClone(scopeA))).toThrow(JOB_SCOPE_REQUIRED_MESSAGE);
  });

  it("puts the scope into the system prompt only; the source corpus and unscoped prompts are unchanged", () => {
    const unscoped = buildCapabilityDiscoveryPrompt([cv], discoveryKernel);
    const scoped = buildCapabilityDiscoveryPrompt([cv], discoveryKernel, renderInvestigationScope(scopeA));
    expect(scoped.userPrompt).toBe(unscoped.userPrompt);
    expect(scoped.userPrompt).not.toContain(descriptionText);
    expect(scoped.systemPrompt.startsWith(unscoped.systemPrompt)).toBe(true);
    expect(scoped.systemPrompt).toContain(`<INVESTIGATION_SCOPE>\n${renderInvestigationScope(scopeA).text}\n</INVESTIGATION_SCOPE>`);
  });

  it("keeps unscoped RUN_ identities and binds scoped ones to the scope", () => {
    const identity = { sourceBundleHash: "s", kernelVersion: "k", promptChecksum: "p", provider: "gemini", model: "m", schemaVersion: "1" };
    expect(buildCapabilityDiscoveryRunId(identity)).toBe("RUN_" + buildCapabilityDiscoveryRunId(identity).slice(4));
    expect(buildCapabilityDiscoveryRunId({ ...identity, investigationScopeHash: "a" })).not.toBe(buildCapabilityDiscoveryRunId(identity));
    expect(buildCapabilityDiscoveryRunId({ ...identity, investigationScopeHash: "a" })).not.toBe(buildCapabilityDiscoveryRunId({ ...identity, investigationScopeHash: "b" }));
  });

  it("never verifies evidence from the scope: only the PDF text is evidence", async () => {
    const { provider } = recordingProvider(descriptionText);
    const result = await runCapabilityDiscovery([cv], config, { kernelResolver: { resolve: async () => discoveryKernel }, provider, repository: new InMemoryCapabilityCoreRepository(), investigationScope: renderInvestigationScope(scopeA) });
    const candidates = (result as { run: CapabilityDiscoveryRun }).run.payload as { candidates: Array<{ proposedCanonicalName: string; status: string; evidenceClaims: Array<{ verification: { status: string } }> }> };
    const status = Object.fromEntries(candidates.candidates.map(item => [item.proposedCanonicalName, [item.status, item.evidenceClaims[0].verification.status]]));
    expect(status).toEqual({
      "Event-driven migration": ["EVIDENCE_PASSED", "VERIFIED"],
      "Scope echo": ["EVIDENCE_REJECTED", "REJECTED_QUOTE_NOT_FOUND"],
      "Scope as source": ["EVIDENCE_REJECTED", "REJECTED_UNKNOWN_SOURCE"]
    });
  });

  it("reuses Discovery and Convergence only for the same sources and the same scope", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const { provider, requests } = recordingProvider(descriptionText);
    const run = (scope?: typeof scopeA) => runCapabilityDiscovery([cv], config, { kernelResolver: { resolve: async () => discoveryKernel }, provider, repository, ...(scope ? { investigationScope: renderInvestigationScope(scope) } : {}) });
    const unscoped = await run();
    const a = await run(scopeA);
    const b = await run(scopeB);
    const aAgain = await run(scopeA);
    expect([unscoped.kind, a.kind, b.kind, aAgain.kind]).toEqual(["DISCOVERY_COMPLETED", "DISCOVERY_COMPLETED", "DISCOVERY_COMPLETED", "DISCOVERY_RUN_REUSED"]);
    expect(requests).toHaveLength(3);
    const runs = [unscoped, a, b].map(item => (item as { run: CapabilityDiscoveryRun }).run);
    expect(new Set(runs.map(item => item.runId)).size).toBe(3);
    expect("investigationScope" in runs[0]).toBe(false);
    expect(runs[1].investigationScope?.scopeHash).not.toBe(runs[2].investigationScope?.scopeHash);

    // Convergence re-derives the scoped RUN_ id from the persisted run, and its own identity follows the scope.
    const convergenceProvider = { providerName: "fake", model: "m", execute: async (request: { userPrompt: string }) => {
      const ids = (JSON.parse(request.userPrompt.slice(request.userPrompt.indexOf("["))) as Array<{ candidate_id: string }>).map(item => item.candidate_id);
      return { convergenceOutput: { convergence_version: "convergence-v1", groups: [{ group_key: "g", member_candidate_ids: ids, canonical_name: "Event-driven migration", capability_scope: "ATOMIC" as const, structural_definition: "d", primary_domain: null }], relations: [], reconciliation_audit: { input_candidate_count: ids.length, grouped_candidate_count: ids.length, group_count: 1, same_capability_merge_count: ids.length - 1, unresolved_relation_count: 0, reconciliation_pass_completed: true } } };
    } };
    const converge = async (discoveryRun: CapabilityDiscoveryRun) => runCapabilityConvergence((await repository.getRunById(discoveryRun.runId))!, convergenceConfig, { kernelResolver: { resolve: async () => convergenceKernel }, provider: convergenceProvider, repository });
    const convA = await converge(runs[1]);
    const convB = await converge(runs[2]);
    expect(convA.run.discoveryRunId).toBe(runs[1].runId);
    expect(convA.run.convergenceRunId).not.toBe(convB.run.convergenceRunId);
    expect((await converge(runs[1])).kind).toBe("CONVERGENCE_RUN_REUSED");
  });

  it("does not short-circuit a scoped Discovery on a scope-free verified snapshot", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    let snapshotLookups = 0;
    const spied = Object.assign(Object.create(Object.getPrototypeOf(repository)), repository, { getSnapshotByKey: async () => { snapshotLookups++; return { status: "VERIFIED" } as never; } });
    const { provider, requests } = recordingProvider(descriptionText);
    const scoped = await runCapabilityDiscovery([cv], config, { kernelResolver: { resolve: async () => discoveryKernel }, provider, repository: spied, investigationScope: renderInvestigationScope(scopeA) });
    expect([scoped.kind, snapshotLookups, requests.length]).toEqual(["DISCOVERY_COMPLETED", 0, 1]);
    const unscoped = await runCapabilityDiscovery([cv], config, { kernelResolver: { resolve: async () => discoveryKernel }, provider, repository: spied });
    expect([unscoped.kind, snapshotLookups]).toEqual(["VERIFIED_SNAPSHOT_REUSED", 1]);
  });

  it("carries the issued scope from capabilityProposalExecutor.execute to the provider request", async () => {
    const { provider, requests } = recordingProvider(descriptionText);
    const convergenceRequests: unknown[] = [];
    const executor = await createCareerCapabilityProposalExecutor({
      environment: { GEMINI_MODEL: "m", PROMPT_ENCRYPTION_KEY: "unused" }, defaultGeminiModel: "m",
      promptRepository: {} as never, capabilityRepository: new InMemoryCapabilityCoreRepository(),
      bootstrapCapabilityProposalKernels: async () => undefined,
      createActivePromptResolver: () => ({}) as never,
      createDiscoveryKernelResolver: () => ({ resolve: async () => discoveryKernel }),
      createConvergenceKernelResolver: () => ({ resolve: async () => convergenceKernel }),
      createDiscoveryProvider: () => provider,
      createConvergenceProvider: () => ({ providerName: "fake", model: "m", execute: async (request) => { convergenceRequests.push(request); throw new Error("STOP_AFTER_DISCOVERY"); } }),
      runDiscovery: runCapabilityDiscovery, runConvergence: runCapabilityConvergence, createProposalRuntime: createCapabilityProposalRuntime
    });
    const documents = [{ docId: "CV", title: "cv.synthetic.pdf", content: SOURCE }];
    for (const forged of [undefined, null, structuredClone(scopeA), { ...scopeA }]) {
      await expect(executor.execute(documents, async () => undefined, forged as never)).rejects.toThrow();
    }
    expect(requests).toHaveLength(0);
    await expect(executor.execute(documents, async () => undefined, scopeA)).rejects.toThrow("STOP_AFTER_DISCOVERY");
    expect(requests).toHaveLength(1);
    expect(requests[0].systemPrompt).toContain(`<INVESTIGATION_SCOPE>\n${renderInvestigationScope(scopeA).text}\n</INVESTIGATION_SCOPE>`);
    expect(requests[0].userPrompt).not.toContain(descriptionText);
    expect(JSON.stringify(convergenceRequests)).not.toContain(descriptionText);
  });
});
