import { describe, expect, it } from "vitest";
import { InMemoryCapabilityCoreRepository, buildCapabilityConvergenceRunId, runCapabilityConvergence, type CapabilityConvergenceProvider } from "../../../../lib/career/capability-core";
import { convergenceOutput, discoveryRun, rejectedCandidate, verifiedCandidate } from "./fixtures";

const secret = "ULTRA_SECRET_FAKE_CONVERGENCE_KERNEL_7C31";
const resolver = { resolve: async () => ({ kernelVersion: "convergence-v1", templateId: "T", versionId: "V", checksum: "CONVERGENCE_PROMPT", plainTextContent: secret }) };
const config = { kernelVersion: "convergence-v1", schemaVersion: "convergence-schema-v1", algorithmVersion: "algorithm-v1" };
const provider = (output = convergenceOutput([])): CapabilityConvergenceProvider => ({ providerName: "fake", model: "one-model", execute: async () => ({ convergenceOutput: output }) });

describe("Capability Convergence runtime", () => {
  it("accepts a completed discovery run, persists no prompt plaintext, and reuses before inference", async () => {
    const repository = new InMemoryCapabilityCoreRepository(); const input = discoveryRun([verifiedCandidate("CAND_A"), rejectedCandidate("CAND_R")]);
    const first = await runCapabilityConvergence(input, config, { kernelResolver: resolver, provider: provider(convergenceOutput(input.payload.candidates[0].candidateId ? [input.payload.candidates[0].candidateId] : [])), repository, now: () => "now" });
    expect(first.kind).toBe("CONVERGENCE_COMPLETED"); expect(JSON.stringify(first)).not.toContain(secret); expect(JSON.stringify(first)).not.toContain("KEY");
    const reused = await runCapabilityConvergence(input, config, { kernelResolver: resolver, provider: { ...provider(), execute: async () => { throw new Error("called") } }, repository });
    expect(reused.kind).toBe("CONVERGENCE_RUN_REUSED"); expect(JSON.stringify(reused)).not.toContain(secret);
  });
  it("rejects invalid and non-completed discovery runs", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    await expect(runCapabilityConvergence({ ...discoveryRun([]), status: "STARTED" }, config, { kernelResolver: resolver, provider: provider(), repository })).rejects.toThrow("DISCOVERY_NOT_COMPLETED");
    await expect(runCapabilityConvergence({ ...discoveryRun([]), payload: {} }, config, { kernelResolver: resolver, provider: provider(), repository })).rejects.toThrow("DISCOVERY_RUN_INVALID");
  });
  it.each([
    ["unknown candidate status", discoveryRun([verifiedCandidate("CAND_A", { status: "UNVERIFIED" })])],
    ["candidate run ID mismatch", discoveryRun([verifiedCandidate("CAND_A", { runId: "RUN_OTHER" })])],
    ["duplicate candidate ID", discoveryRun([verifiedCandidate("CAND_A"), verifiedCandidate("CAND_A")])],
    ["passed candidate without verified evidence", discoveryRun([verifiedCandidate("CAND_A", { evidenceClaims: [{ evidenceId: "EVD_A", sourceDocumentRef: "DOC", declaredLocation: "x", exactQuote: "x", verification: { status: "REJECTED_QUOTE_NOT_FOUND" } }] })])],
    ["missing coverage validation", { ...discoveryRun([]), payload: { candidates: [] } }],
    ["malformed evidence claims", discoveryRun([verifiedCandidate("CAND_A")])]
  ])("fails closed for %s", async (_name, input) => {
    if (_name === "malformed evidence claims") (input as any).payload.candidates[0].evidenceClaims = {};
    await expect(runCapabilityConvergence(input as never, config, { kernelResolver: resolver, provider: provider(), repository: new InMemoryCapabilityCoreRepository() })).rejects.toThrow("ERR_CAPABILITY_CONVERGENCE_DISCOVERY_RUN_INVALID");
  });
  it("does not call Gemini for zero eligible candidates and persists a deterministic empty result", async () => {
    const repository = new InMemoryCapabilityCoreRepository(); let calls = 0;
    const rejected = rejectedCandidate("CAND_R"); const result = await runCapabilityConvergence(discoveryRun([rejected]), config, { kernelResolver: resolver, provider: { providerName: "fake", model: "one-model", execute: async () => { calls++; throw new Error("called"); } }, repository, now: () => "now" });
    expect(calls).toBe(0); expect(result.run.payload).toMatchObject({ eligibleCandidateIds: [], excludedCandidateIds: [rejected.candidateId], convergenceOutput: { groups: [], relations: [] }, canonicalDrafts: [], proposedRelations: [] });
  });
  it("uses all specified identity dimensions deterministically", () => {
    const base = { discoveryRunId: "RUN", discoveryRawOutputHash: "RAW", kernelVersion: "kernel", promptChecksum: "prompt", provider: "gemini", model: "m", schemaVersion: "schema", algorithmVersion: "algorithm" };
    expect(buildCapabilityConvergenceRunId(base)).toBe(buildCapabilityConvergenceRunId({ ...base }));
    for (const key of ["discoveryRunId", "discoveryRawOutputHash", "promptChecksum", "model", "algorithmVersion"] as const) expect(buildCapabilityConvergenceRunId({ ...base, [key]: `${base[key]}-changed` })).not.toBe(buildCapabilityConvergenceRunId(base));
  });
});
