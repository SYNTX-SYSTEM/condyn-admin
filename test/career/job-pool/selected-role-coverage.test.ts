import { describe, expect, it, vi } from "vitest";
import { InMemoryCandidateSourceBundleRepository, InMemoryCapabilityCoreRepository, InMemoryCapabilityProposalProjectionReferenceRepository, type CapabilityProposalProjection } from "../../../lib/career/capability-core";
import { SELECTED_ROLE_COVERAGE_AUTHORITY, buildSelectedRoleCoverage } from "../../../lib/career/job-pool/selected-role-coverage";
import { JobComparisonError, parseRequestedSelection, resolveAnalysisJobScope, type AnalysisScopeBinding } from "../../../lib/career/job-scope/analysis-scope";
import { JobScopeRequiredError } from "../../../lib/career/job-scope";
import type { JobRecord } from "../../../lib/career/orchestration/job";
import { TEST_JOB_SCOPE, TEST_JOB_SCOPE_B, resolveTestJobScope } from "../../support/job-scope";
import { fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** B2 (owner decision 2026-10-15): unconfirmed name coverage for exactly the selected role. */
const capability = (id: string, name: string, scope: "ATOMIC" | "COMPOSITE" = "ATOMIC") => ({
  id, name, domain: null, scope, structuralDefinition: name, evidenceState: "EVIDENCE_PASSED" as const, semanticDefinitionState: "NOT_RUN" as const, authorityState: "NONE" as const,
  sourceCandidateIds: [`CAND_${id}`], sourceDocumentIds: ["CV"], evidence: [{ evidenceId: `EVD_${id}`, sourceDocumentId: "CV", exactQuote: `quote for ${name}`, verificationState: "SOURCE_MATCH_VERIFIED" as const }]
});
const projectionOf = (capabilities: ReturnType<typeof capability>[]): CapabilityProposalProjection => ({ projectionKind: "CAPABILITY_PROPOSAL", projectionState: "PROPOSED", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE", capabilities, relations: [] });
const binding: AnalysisScopeBinding = { analysisId: "ANL_X", jobId: "JOB_X", jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId: TEST_JOB_SCOPE.poolRoleId, investigationScopeHash: "h", discoveryRunId: "RUN_X", convergenceRunId: "CONV_X", poolCanonicalSha256: "c", poolVersion: 1, targetRoleProfileRevisionId: "TRPREV_X" };

describe("B2 selected-role coverage — pure", () => {
  const scope = resolveTestJobScope();
  const projection = projectionOf([
    capability("PCAP_A", "TypeScript"), capability("PCAP_B", "React.js"), capability("PCAP_C", "Design Systems and Mentoring", "COMPOSITE"),
    capability("PCAP_D", "Domain-Driven Design"), capability("PCAP_E", "Frontend Engineering Leadership")
  ]);
  const coverage = buildSelectedRoleCoverage(binding, scope, projection);

  it("lists exactly the selected role's requirements in pool order, never another role's", () => {
    expect(coverage.requirements.map(item => item.poolRequirementId)).toEqual(scope.requirements.map(item => item.poolRequirement.id));
    expect(coverage.requirements.every(item => item.poolRequirementId.startsWith("req_kestrel_frontend_architect_"))).toBe(true);
    expect(coverage.role).toEqual({ poolRoleId: TEST_JOB_SCOPE.poolRoleId, title: scope.role.title, poolOrganizationId: scope.organization.id, organizationName: scope.organization.name });
    expect(coverage.requirements.map(item => item.targetRequirementRevisionId)).toEqual(scope.requirements.map(item => item.mapping.targetRequirementRevisionId));
  });

  it("covers by the deterministic bases only, with source-verified evidence, unscored", () => {
    const basis = Object.fromEntries(coverage.requirements.map(item => [item.poolRequirementId.slice(-2), item.coverage.state === "COVERED" ? `${item.coverage.proposal.capabilityProposalId}:${item.coverage.proposal.matchBasis}` : "NOT_COVERED"]));
    expect(basis).toMatchObject({ "02": "PCAP_A:EXACT", "03": "PCAP_B:ALIAS", "04": "PCAP_C:COMPOSITE_CONSTITUENT", "09": "PCAP_C:COMPOSITE_CONSTITUENT", "10": "PCAP_E:TOKEN_CONTAINMENT", "01": "NOT_COVERED", "08": "NOT_COVERED" });
    for (const item of coverage.requirements) if (item.coverage.state === "COVERED") expect(item.coverage.proposal).toMatchObject({ evidenceState: "SOURCE_MATCH_VERIFIED", authorityState: "NONE", scored: false });
  });

  it("keeps every proposal, also those that cover nothing; fixed authority; counts are no score", () => {
    expect(coverage.proposals.map(item => [item.id, item.coversPoolRequirementIds.length])).toEqual([["PCAP_A", 1], ["PCAP_B", 1], ["PCAP_C", 2], ["PCAP_D", 0], ["PCAP_E", 1]]);
    expect(coverage.authority).toEqual({ comparisonBasis: "CAPABILITY_PROPOSAL_NAME_COVERAGE", operand: "CAPABILITY_PROPOSAL_PROJECTION", scored: false, authorityState: "NONE", capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" });
    expect(Object.isFrozen(SELECTED_ROLE_COVERAGE_AUTHORITY)).toBe(true);
    expect(coverage.counts).toEqual({ requirements: 10, covered: 5, notCovered: 5, proposals: 5 });
    expect(JSON.stringify(coverage)).not.toMatch(/resonance|"score"|VERIFIED_CAPABILITY"|"rank/i);
  });

  it("an empty projection covers nothing and still lists every requirement", () => {
    const empty = buildSelectedRoleCoverage(binding, scope, projectionOf([]));
    expect([empty.counts, empty.requirements.every(item => item.coverage.state === "NOT_COVERED")]).toEqual([{ requirements: 10, covered: 0, notCovered: 10, proposals: 0 }, true]);
  });
});

describe("B2 analysis scope binding — no fallback", () => {
  function world() {
    const jobs = new Map<string, JobRecord>();
    const state: InspectorWorld = {
      capabilityRepository: new InMemoryCapabilityCoreRepository(),
      references: new InMemoryCapabilityProposalProjectionReferenceRepository(),
      sourceBundles: new InMemoryCandidateSourceBundleRepository(),
      saveJob: async job => { jobs.set(job.jobId, structuredClone(job)); }
    };
    const resolver = { resolve: vi.fn(async (selection: typeof TEST_JOB_SCOPE) => resolveTestJobScope(selection)) };
    const deps = { references: state.references, runs: state.capabilityRepository, jobs: { getJob: async (jobId: string) => jobs.get(jobId) ?? null }, resolver };
    return { state, deps, resolver };
  }
  const refusal = async (run: () => Promise<unknown>) => { try { await run(); } catch (error) { if (error instanceof JobComparisonError) return [error.code, error.status]; throw error; } throw new Error("expected a refusal"); };

  it("binds analysis, job, upload, role, scope hash, runs and pool identity — each one checked", async () => {
    const { state, deps } = world();
    const produced = await produceAnalysis(state, geminiProvider(fakeGeminiClient([geminiText("A")])), resolveTestJobScope(), "A");
    const { binding: bound } = await resolveAnalysisJobScope(deps, produced.analysisId, TEST_JOB_SCOPE);
    expect(bound).toEqual({ analysisId: produced.analysisId, jobId: produced.job.jobId, jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId: TEST_JOB_SCOPE.poolRoleId, investigationScopeHash: produced.run.investigationScope!.scopeHash, discoveryRunId: produced.run.runId, convergenceRunId: produced.convergenceRun.convergenceRunId, poolCanonicalSha256: resolveTestJobScope().poolCanonicalSha256, poolVersion: resolveTestJobScope().poolVersion, targetRoleProfileRevisionId: resolveTestJobScope().roleMapping.targetRoleProfileRevisionId });
  });

  it("refuses: missing selection 400, unknown analysis 404, scope change 409, PERSON 409, drift 409, unavailable pool 409, broken lineage 409", async () => {
    const { state, deps, resolver } = world();
    const scoped = await produceAnalysis(state, geminiProvider(fakeGeminiClient([geminiText("A"), geminiText("B")])), resolveTestJobScope(), "A");
    const person = await produceAnalysis(state, geminiProvider(fakeGeminiClient([geminiText("P")])), null, "P");
    for (const [upload, role] of [[undefined, TEST_JOB_SCOPE.poolRoleId], [TEST_JOB_SCOPE.jobPoolUploadId, ""], [null, null]]) {
      expect(await refusal(async () => parseRequestedSelection(upload, role))).toEqual(["ERR_JOB_COMPARISON_SELECTION_REQUIRED", 400]);
    }
    expect(await refusal(() => resolveAnalysisJobScope(deps, "ANL_unknown", TEST_JOB_SCOPE))).toEqual(["ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND", 404]);
    expect(await refusal(() => resolveAnalysisJobScope(deps, scoped.analysisId, TEST_JOB_SCOPE_B))).toEqual(["ERR_JOB_COMPARISON_SCOPE_MISMATCH", 409]);
    expect(await refusal(() => resolveAnalysisJobScope(deps, scoped.analysisId, { ...TEST_JOB_SCOPE, poolRoleId: ` ${TEST_JOB_SCOPE.poolRoleId}` }))).toEqual(["ERR_JOB_COMPARISON_SCOPE_MISMATCH", 409]);
    expect(await refusal(() => resolveAnalysisJobScope(deps, person.analysisId, TEST_JOB_SCOPE))).toEqual(["ERR_JOB_COMPARISON_NOT_SCOPED", 409]);
    resolver.resolve.mockImplementationOnce(async () => resolveTestJobScope(TEST_JOB_SCOPE_B));
    expect(await refusal(() => resolveAnalysisJobScope(deps, scoped.analysisId, TEST_JOB_SCOPE))).toEqual(["ERR_JOB_COMPARISON_SCOPE_DRIFT", 409]);
    resolver.resolve.mockImplementationOnce(async () => { throw new JobScopeRequiredError("ERR_JOB_SCOPE_INVALID", "archived"); });
    expect(await refusal(() => resolveAnalysisJobScope(deps, scoped.analysisId, TEST_JOB_SCOPE))).toEqual(["ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE", 409]);
    // A reference pairing A's Discovery with another analysis's Convergence: refused, never repaired.
    await state.saveJob({ ...scoped.job, jobId: "JOB_crossed" });
    await state.references.save({ analysisId: "ANL_crossed", jobId: "JOB_crossed", discoveryRunId: scoped.run.runId, convergenceRunId: person.convergenceRun.convergenceRunId, sourceBundleHash: scoped.run.sourceBundleHash, createdAt: scoped.convergenceRun.completedAt });
    expect(await refusal(() => resolveAnalysisJobScope(deps, "ANL_crossed", TEST_JOB_SCOPE))).toEqual(["ERR_JOB_COMPARISON_LINEAGE_INVALID", 409]);
  });
});
