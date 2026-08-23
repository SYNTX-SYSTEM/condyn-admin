import { describe, expect, it } from "vitest";
import { InMemoryCapabilityCoreRepository, runCapabilityConvergence, sha256Utf8, stableJsonStringify, validateCapabilityConvergenceOutput } from "../../../../lib/career/capability-core";
import { convergenceOutput, discoveryRun, verifiedCandidate } from "./fixtures";

const config = { kernelVersion: "convergence-v1", schemaVersion: "convergence-schema-v1", algorithmVersion: "algorithm-v1" };
const resolver = { resolve: async () => ({ kernelVersion: "convergence-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "ULTRA_SECRET_FAKE_CONVERGENCE_KERNEL_7C31" }) };
const provider = { providerName: "fake", model: "model", execute: async (request: unknown) => ({ convergenceOutput: convergenceOutput([(request as { candidateId?: string }).candidateId ?? "unused"]) }) };
const runtime = (run: any) => runCapabilityConvergence(run, config, { kernelResolver: resolver, provider: { ...provider, execute: async () => ({ convergenceOutput: convergenceOutput(run.payload.candidates.map((candidate: any) => candidate.candidateId)) }) }, repository: new InMemoryCapabilityCoreRepository() });
const tampered = (run: any) => structuredClone(run);

describe("Phase 3 hardening", () => {
  it.each([
    ["missing kernelOutput", (run: any) => { delete run.payload.kernelOutput; }],
    ["raw output hash mismatch", (run: any) => { run.rawOutputHash = "tampered"; }],
    ["discovery run ID mismatch", (run: any) => { run.runId = "RUN_TAMPERED"; run.payload.candidates[0].runId = "RUN_TAMPERED"; }],
    ["altered candidate canonical field", (run: any) => { run.payload.candidates[0].proposedCanonicalName = "tampered"; }],
    ["candidate absent from kernel output", (run: any) => { run.payload.candidates = []; }],
    ["kernel capability missing from candidates", (run: any) => { run.payload.kernelOutput.capabilities = []; run.rawOutputHash = sha256Utf8(stableJsonStringify(run.payload.kernelOutput)); }]
  ])("rejects discovery artifact with %s", async (_name, mutate) => { const run = tampered(discoveryRun([verifiedCandidate("A")])); mutate(run); await expect(runtime(run)).rejects.toThrow("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID"); });

  it.each([
    ["rejected candidate with verified evidence", (run: any) => { run.payload.candidates[0].status = "EVIDENCE_REJECTED"; }],
    ["verified evidence without matched document", (run: any) => { delete run.payload.candidates[0].evidenceClaims[0].verification.matchedDocId; }],
    ["unknown evidence verification status", (run: any) => { run.payload.candidates[0].evidenceClaims[0].verification.status = "UNKNOWN"; }]
  ])("rejects impossible Phase 2 evidence state: %s", async (_name, mutate) => { const run = tampered(discoveryRun([verifiedCandidate("A")])); mutate(run); await expect(runtime(run)).rejects.toThrow("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID"); });

  it.each([
    ["exact duplicate", ["RELATED_CAPABILITY", "RELATED_CAPABILITY"]],
    ["different types", ["RELATED_CAPABILITY", "DISTINCT_CAPABILITY"]],
    ["reverse conflict", ["UNRESOLVED", "RELATED_CAPABILITY"]],
    ["opposite parent-child", ["PARENT_CHILD", "PARENT_CHILD"]]
  ])("rejects relation conflict: %s", (_name, types) => {
    const a = verifiedCandidate("A"); const b = verifiedCandidate("B"); const output: any = { convergence_version: "convergence-v1", groups: [{ group_key: "a", member_candidate_ids: [a.candidateId], canonical_name: "A", capability_scope: "ATOMIC", structural_definition: "A", primary_domain: null }, { group_key: "b", member_candidate_ids: [b.candidateId], canonical_name: "B", capability_scope: "ATOMIC", structural_definition: "B", primary_domain: null }], relations: [{ source_group_key: "a", target_group_key: "b", relation_type: types[0], reason: "one" }, { source_group_key: _name === "reverse conflict" || _name === "opposite parent-child" ? "b" : "a", target_group_key: _name === "reverse conflict" || _name === "opposite parent-child" ? "a" : "b", relation_type: types[1], reason: "two" }], reconciliation_audit: { input_candidate_count: 2, grouped_candidate_count: 2, group_count: 2, same_capability_merge_count: 0, unresolved_relation_count: types.filter((type) => type === "UNRESOLVED").length, reconciliation_pass_completed: true } };
    expect(() => validateCapabilityConvergenceOutput(output, [a, b])).toThrow("ERR_CAPABILITY_CONVERGENCE_RELATION_CONFLICT");
  });
});
