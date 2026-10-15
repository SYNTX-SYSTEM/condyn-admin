import { describe, expect, it } from "vitest";
import {
  InMemoryCapabilityCoreRepository, computeSnapshotKey, computeSourceBundleHash, createSourceDocument, createVerifiedCapabilitySnapshot, runCapabilityDiscovery, sha256Utf8,
  type CapabilityDiscoveryProvider
} from "../../../lib/career/capability-core";
import { renderInvestigationScope } from "../../../lib/career/job-scope";
import { resolveTestJobScope } from "../../support/job-scope";
import { SCOPE_X, SCOPE_Y, persistChain, scopedChain } from "./snapshot-scope.fixture";

/** SFE 2026-10-15 (PINK O-SNAPSHOT-SCOPE): confirmed capability state is never shared across job scopes. */
const config = { sourceBundleHash: "s".repeat(64), kernelVersion: "discovery-v1", prompt: { checksum: "C" }, inference: { provider: "fake", model: "m" }, schemaVersion: "discovery-schema-v1" };

describe("scope identity in the confirmed capability state", () => {
  it("keeps unscoped snapshot keys byte-identical (generic and Phase 4)", () => {
    expect(computeSnapshotKey(config)).toBe(sha256Utf8(JSON.stringify([config.sourceBundleHash, "discovery-v1", "C", "fake", "m", "discovery-schema-v1"])));
    const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: "VFY_X", verificationRawOutputHash: "h" };
    expect(computeSnapshotKey({ ...config, publication })).toBe(sha256Utf8(JSON.stringify(["CAPABILITY_VERIFIED_SNAPSHOT_V1", "VFY_X", "h"])));
  });

  it("separates the keys of different scopes and of scoped versus unscoped state", () => {
    const keys = [computeSnapshotKey(config), computeSnapshotKey({ ...config, investigationScope: { scopeHash: SCOPE_X } }), computeSnapshotKey({ ...config, investigationScope: { scopeHash: SCOPE_Y } })];
    expect(new Set(keys).size).toBe(3);
    const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: "VFY_X", verificationRawOutputHash: "h" };
    expect(computeSnapshotKey({ ...config, publication, investigationScope: { scopeHash: SCOPE_X } })).not.toBe(computeSnapshotKey({ ...config, publication, investigationScope: { scopeHash: SCOPE_Y } }));
  });

  it("publishes one Phase-4 state per scope over the same sources; each carries its own scope", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const chains = [scopedChain(SCOPE_X), scopedChain(SCOPE_Y), scopedChain()];
    for (const chain of chains) await persistChain(repository, chain);
    const publisher = repository.createVerifiedCapabilitySnapshotPublisher();
    const [x, y, none] = await Promise.all(chains.map(chain => publisher.publish(chain)));
    expect(new Set([x.snapshotId, y.snapshotId, none.snapshotId]).size).toBe(3);
    expect([x.investigationScope, y.investigationScope, "investigationScope" in none]).toEqual([{ scopeHash: SCOPE_X }, { scopeHash: SCOPE_Y }, false]);
    expect(await repository.getSnapshotByKey(computeSnapshotKey(x))).toEqual(x);
    expect(await repository.getSnapshotByKey(computeSnapshotKey(y))).toEqual(y);
    expect(computeSnapshotKey(x)).not.toBe(computeSnapshotKey(y));
  });

  it("refuses a scoped chain whose RUN_ id does not carry exactly its scope", async () => {
    for (const forged of [scopedChain(SCOPE_X, { runIdScopeHash: SCOPE_Y }), scopedChain(SCOPE_X, { runIdScopeHash: null }), scopedChain(undefined, { runIdScopeHash: SCOPE_X })]) {
      const repository = new InMemoryCapabilityCoreRepository();
      await persistChain(repository, forged);
      await expect(repository.createVerifiedCapabilitySnapshotPublisher().publish(forged)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
    }
    const malformed = scopedChain(SCOPE_X);
    (malformed.discoveryRun.investigationScope as Record<string, unknown>).extra = "x";
    await expect(new InMemoryCapabilityCoreRepository().createVerifiedCapabilitySnapshotPublisher().publish(malformed)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("never hands a scoped confirmed state to an unscoped or differently scoped Discovery", async () => {
    const cv = createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: "Led the migration of the dispatch platform." });
    const kernel = { kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" };
    const audit = { source_documents_examined: 1, capability_count: 0, atomic_capability_count: 0, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 };
    let calls = 0;
    const provider: CapabilityDiscoveryProvider = { providerName: "fake", model: "m", execute: async () => { calls++; return { kernelOutput: { kernel_version: "discovery-v1", capabilities: [], coverage_audit: audit } }; } };
    const repository = new InMemoryCapabilityCoreRepository();
    const scope = renderInvestigationScope(resolveTestJobScope());
    // A VERIFIED state of exactly these sources, kernel and model, but bound to the selected scope.
    await repository.saveSnapshot(createVerifiedCapabilitySnapshot({ sourceBundleHash: computeSourceBundleHash([cv]), kernelVersion: "discovery-v1", prompt: { checksum: "C" }, inference: { provider: "fake", model: "m" }, schemaVersion: "discovery-schema-v1", investigationScope: { scopeHash: sha256Utf8(scope.text) }, candidateCount: 0, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" }, [], []));
    const unscoped = await runCapabilityDiscovery([cv], { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" }, { kernelResolver: { resolve: async () => kernel }, provider, repository });
    expect([unscoped.kind, calls]).toEqual(["DISCOVERY_COMPLETED", 1]);
    const scoped = await runCapabilityDiscovery([cv], { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" }, { kernelResolver: { resolve: async () => kernel }, provider, repository, investigationScope: scope });
    expect([scoped.kind, calls]).toEqual(["DISCOVERY_COMPLETED", 2]);
  });
});
