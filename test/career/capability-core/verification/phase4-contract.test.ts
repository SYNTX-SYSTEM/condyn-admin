import { describe, expect, it } from "vitest";
import { buildProvisionalCapabilityId, createCapabilityRelation, createVerifiedCapabilitySnapshot, sha256Utf8, type CapabilityRelation, type CapabilityScope, type EvidenceClaim, type VerifiedCapability } from "../../../../lib/career/capability-core";
import type { CanonicalCapabilityDraft } from "../../../../lib/career/capability-core/convergence";
import { publishVerifiedCapabilitySnapshot, type CapabilityVerificationRun } from "../../../../lib/career/capability-core/verification";
import type { VerifiedSnapshotInput } from "../../../../lib/career/capability-core/snapshot";

type GenericConstructorExcludesPublication = "publication" extends keyof VerifiedSnapshotInput ? false : true;
const genericConstructorExcludesPublication: GenericConstructorExcludesPublication = true;

const configuration = { sourceBundleHash: "source", kernelVersion: "kernel", prompt: { checksum: "prompt" }, inference: { provider: "gemini", model: "model" }, schemaVersion: "phase4", candidateCount: 1, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" as const };
const evidence: EvidenceClaim[] = [{ evidenceId: "EVD_1", sourceDocumentRef: "DOC_1", declaredLocation: "Page 1", exactQuote: "literal evidence", verification: { status: "VERIFIED", matchedDocId: "DOC_1" } }];

const finalId = (draft: CanonicalCapabilityDraft) => draft.provisionalCapabilityId.replace("PCAP_", "CAP_");
const draft = (canonicalName = "Capability", scope: CapabilityScope = "ATOMIC"): CanonicalCapabilityDraft => ({
  provisionalCapabilityId: buildProvisionalCapabilityId(canonicalName, scope),
  canonicalName,
  scope,
  structuralDefinition: `${canonicalName} definition`,
  primaryDomain: null,
  evidenceIds: ["EVD_1"],
  provenance: { sourceCandidateIds: [`CAND_${canonicalName}`], sourceDocumentIds: ["DOC_1"] },
  semanticDefinitionStatus: "NOT_RUN"
});
const capability = (item: CanonicalCapabilityDraft, overrides: Partial<VerifiedCapability> = {}): VerifiedCapability => ({
  capabilityId: finalId(item),
  canonicalName: item.canonicalName,
  scope: item.scope,
  structuralDefinition: item.structuralDefinition,
  primaryDomain: item.primaryDomain,
  demonstratedCapabilityLevel: null,
  levelVerificationStatus: "UNVERIFIED",
  evidenceIds: item.evidenceIds,
  relationIds: [],
  provenance: item.provenance,
  validation: { evidenceStatus: "PASSED", semanticDefinitionStatus: "PASSED", convergenceStatus: "VERIFIED" },
  ...overrides
});
const sourceSnapshot = (capabilities: VerifiedCapability[], relations: CapabilityRelation[] = [], status: "DRAFT" | "VERIFIED" | "SUPERSEDED" = configuration.status) => createVerifiedCapabilitySnapshot({ ...configuration, status, candidateCount: capabilities.length }, capabilities, evidence, relations);
const verificationRun = (drafts: CanonicalCapabilityDraft[], overrides: Partial<CapabilityVerificationRun> = {}): CapabilityVerificationRun => ({
  runKind: "CAPABILITY_VERIFICATION",
  verificationRunId: "VFY_0123456789ABCDEF01234567",
  convergenceRunId: "CONV_0123456789ABCDEF01234567",
  convergenceRawOutputHash: "a".repeat(64),
  sourceEvidenceRepresentationHash: "c".repeat(64),
  kernelVersion: "verification-v1",
  promptChecksum: "checksum",
  inference: { provider: "gemini", model: "model" },
  schemaVersion: "verification-schema",
  algorithmVersion: "verification-algorithm",
  snapshotSchemaVersion: "phase4",
  rawOutputHash: "b".repeat(64),
  status: "COMPLETED",
  payload: {
    semanticDefinitionOutcomes: drafts.map(({ provisionalCapabilityId }) => ({ provisionalCapabilityId, status: "PASSED" as const })),
    demonstratedLevelOutcomes: drafts.map(({ provisionalCapabilityId }) => ({ provisionalCapabilityId, status: "UNVERIFIED" as const, demonstratedCapabilityLevel: null })),
    relationDispositions: [],
    publicationEligibility: "ELIGIBLE"
  },
  createdAt: configuration.createdAt,
  completedAt: configuration.createdAt,
  ...overrides
});
const publish = ({
  drafts = [draft()],
  capabilities = drafts.map((item) => capability(item)),
  run = verificationRun(drafts),
  proposedRelations = [],
  publicationContext = { sourceBundleHash: configuration.sourceBundleHash, schemaVersion: configuration.schemaVersion, candidateCount: drafts.length, rejectedCandidateCount: 0 },
  evidenceInventory = evidence
}: Partial<{ drafts: CanonicalCapabilityDraft[]; capabilities: VerifiedCapability[]; run: CapabilityVerificationRun; proposedRelations: CapabilityRelation[]; publicationContext: { sourceBundleHash: string; schemaVersion: string; candidateCount: number; rejectedCandidateCount: number }; evidenceInventory: EvidenceClaim[] }> = {}) => publishVerifiedCapabilitySnapshot({ canonicalDrafts: drafts, capabilities, evidence: evidenceInventory, proposedRelations, publicationContext, verificationRun: run });

describe("Phase 4 verified-truth publication contract", () => {
  it("keeps the generic Phase-1 DRAFT constructor outside the Phase-4 publication API", () => {
    const item = draft();
    const generic = sourceSnapshot([capability(item)], [], "DRAFT");
    expect(genericConstructorExcludesPublication).toBe(true);
    expect(generic.publication).toBeUndefined();
  });

  it.each([
    ["failed", (run: CapabilityVerificationRun, item: CanonicalCapabilityDraft) => ({ ...run, payload: { ...run.payload, semanticDefinitionOutcomes: [{ provisionalCapabilityId: item.provisionalCapabilityId, status: "FAILED" as const }] } })],
    ["missing", (run: CapabilityVerificationRun) => ({ ...run, payload: { ...run.payload, semanticDefinitionOutcomes: [] } })],
    ["duplicate", (run: CapabilityVerificationRun, item: CanonicalCapabilityDraft) => ({ ...run, payload: { ...run.payload, semanticDefinitionOutcomes: [...run.payload.semanticDefinitionOutcomes, { provisionalCapabilityId: item.provisionalCapabilityId, status: "PASSED" as const }] } })]
  ])("rejects a %s semantic-definition outcome", (_name, mutate) => {
    const item = draft();
    expect(() => publish({ drafts: [item], run: mutate(verificationRun([item]), item) })).toThrow("ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED");
  });

  it.each([
    ["canonical name", (value: VerifiedCapability) => ({ ...value, canonicalName: "rewritten" })],
    ["scope", (value: VerifiedCapability) => ({ ...value, scope: "COMPOSITE" as const })],
    ["structural definition", (value: VerifiedCapability) => ({ ...value, structuralDefinition: "rewritten" })],
    ["primary domain", (value: VerifiedCapability) => ({ ...value, primaryDomain: "Other" })],
    ["replaced evidence", (value: VerifiedCapability) => ({ ...value, evidenceIds: ["EVD_OTHER"] })],
    ["added evidence", (value: VerifiedCapability) => ({ ...value, evidenceIds: ["EVD_1", "EVD_1"] })],
    ["removed evidence", (value: VerifiedCapability) => ({ ...value, evidenceIds: [] })],
    ["candidate provenance", (value: VerifiedCapability) => ({ ...value, provenance: { ...value.provenance, sourceCandidateIds: ["CAND_OTHER"] } })],
    ["document provenance", (value: VerifiedCapability) => ({ ...value, provenance: { ...value.provenance, sourceDocumentIds: ["DOC_OTHER"] } })]
  ])("rejects caller mutation of draft %s", (_name, mutate) => {
    const item = draft();
    const original = capability(item);
    expect(() => publish({ drafts: [item], capabilities: [mutate(original)] })).toThrow("ERR_PHASE4_DRAFT_CONTENT_MISMATCH");
  });

  it.each([
    ["different verified level", (item: CanonicalCapabilityDraft, run: CapabilityVerificationRun) => ({ capability: capability(item, { demonstratedCapabilityLevel: "L2", levelVerificationStatus: "VERIFIED" }), run: { ...run, payload: { ...run.payload, demonstratedLevelOutcomes: [{ provisionalCapabilityId: item.provisionalCapabilityId, status: "VERIFIED" as const, demonstratedCapabilityLevel: "L3" as const }] } } })],
    ["unverified/null claim against verified outcome", (item: CanonicalCapabilityDraft, run: CapabilityVerificationRun) => ({ capability: capability(item), run: { ...run, payload: { ...run.payload, demonstratedLevelOutcomes: [{ provisionalCapabilityId: item.provisionalCapabilityId, status: "VERIFIED" as const, demonstratedCapabilityLevel: "L3" as const }] } } })],
    ["missing outcome", (item: CanonicalCapabilityDraft, run: CapabilityVerificationRun) => ({ capability: capability(item), run: { ...run, payload: { ...run.payload, demonstratedLevelOutcomes: [] } } })],
    ["duplicate outcome", (item: CanonicalCapabilityDraft, run: CapabilityVerificationRun) => ({ capability: capability(item), run: { ...run, payload: { ...run.payload, demonstratedLevelOutcomes: [...run.payload.demonstratedLevelOutcomes, { provisionalCapabilityId: item.provisionalCapabilityId, status: "UNVERIFIED" as const, demonstratedCapabilityLevel: null }] } } })]
  ])("binds final level truth to the %s verification outcome", (_name, mutate) => {
    const item = draft(); const result = mutate(item, verificationRun([item]));
    expect(() => publish({ drafts: [item], capabilities: [result.capability], run: result.run })).toThrow("ERR_PHASE4_LEVEL_TRUTH_INVARIANT");
  });

  it("rejects MANUAL_GOLD convergence claims", () => {
    const item = draft();
    expect(() => publish({ drafts: [item], capabilities: [capability(item, { validation: { ...capability(item).validation, convergenceStatus: "MANUAL_GOLD" } })] })).toThrow("ERR_PHASE4_CONVERGENCE_NOT_VERIFIED");
  });

  it("derives CAP identity from every canonical draft and rejects tampering or injection", () => {
    const item = draft();
    expect(publish({ drafts: [item] }).capabilities[0].capabilityId).toBe(finalId(item));
    expect(() => publish({ drafts: [{ ...item, provisionalCapabilityId: "PCAP_0123456789ABCDEF01234567" }] })).toThrow("ERR_PHASE4_PROVISIONAL_ID_MISMATCH");
    expect(() => publish({ drafts: [item], capabilities: [capability(item, { capabilityId: "CAP_MODEL_INJECTED" })] })).toThrow("ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID");
  });

  it("changes the published CAP when the canonical name or scope changes", () => {
    const atomic = draft("Capability", "ATOMIC");
    const changedName = draft("Other", "ATOMIC");
    const changedScope = draft("Capability", "COMPOSITE");
    expect(publish({ drafts: [atomic] }).capabilities[0].capabilityId).not.toBe(publish({ drafts: [changedName] }).capabilities[0].capabilityId);
    expect(publish({ drafts: [atomic] }).capabilities[0].capabilityId).not.toBe(publish({ drafts: [changedScope] }).capabilities[0].capabilityId);
  });

  it("promotes verified Phase-3 relations into a new CAP graph relation identity", () => {
    const source = draft("Source"); const target = draft("Target");
    const proposal = createCapabilityRelation({ sourceCapabilityRef: source.provisionalCapabilityId, targetCapabilityRef: target.provisionalCapabilityId, relationType: "RELATED_CAPABILITY", status: "PROPOSED", reason: "semantic proposal", createdBy: "SEMANTIC_RESOLVER", createdAt: configuration.createdAt });
    const run = verificationRun([source, target], { payload: { ...verificationRun([source, target]).payload, relationDispositions: [{ relationId: proposal.relationId, status: "VERIFIED" }] } });
    const snapshot = publish({ drafts: [source, target], run, proposedRelations: [proposal] });
    const expected = createCapabilityRelation({ sourceCapabilityRef: finalId(source), targetCapabilityRef: finalId(target), relationType: proposal.relationType, status: "VERIFIED", reason: proposal.reason, createdBy: proposal.createdBy, createdAt: proposal.createdAt });
    expect(snapshot.relations).toEqual([expected]);
    expect(expected.relationId).not.toBe(proposal.relationId);
    expect(snapshot.capabilities.every((item) => item.relationIds.includes(expected.relationId))).toBe(true);
  });

  it("rejects injected final relations and requires one known disposition per proposal", () => {
    const source = draft("Source"); const target = draft("Target");
    const proposal = createCapabilityRelation({ sourceCapabilityRef: source.provisionalCapabilityId, targetCapabilityRef: target.provisionalCapabilityId, relationType: "RELATED_CAPABILITY", status: "PROPOSED", reason: "semantic proposal", createdBy: "SEMANTIC_RESOLVER", createdAt: configuration.createdAt });
    const injected = createCapabilityRelation({ sourceCapabilityRef: finalId(source), targetCapabilityRef: finalId(target), relationType: "RELATED_CAPABILITY", status: "PROPOSED", reason: "injected", createdBy: "SEMANTIC_RESOLVER", createdAt: configuration.createdAt });
    const finalCapabilities = [capability(source, { relationIds: [injected.relationId] }), capability(target, { relationIds: [injected.relationId] })];
    expect(() => publish({ drafts: [source, target], capabilities: finalCapabilities, proposedRelations: [proposal] })).toThrow("ERR_PHASE4_RELATION_NOT_VERIFIED");
    expect(() => publish({ drafts: [source, target], proposedRelations: [proposal] })).toThrow("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    const duplicate = verificationRun([source, target], { payload: { ...verificationRun([source, target]).payload, relationDispositions: [{ relationId: proposal.relationId, status: "REJECTED" }, { relationId: proposal.relationId, status: "REJECTED" }] } });
    expect(() => publish({ drafts: [source, target], run: duplicate, proposedRelations: [proposal] })).toThrow("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    const unknown = verificationRun([source, target], { payload: { ...verificationRun([source, target]).payload, relationDispositions: [{ relationId: "REL_UNKNOWN", status: "REJECTED" }] } });
    expect(() => publish({ drafts: [source, target], run: unknown, proposedRelations: [proposal] })).toThrow("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    const unresolved = verificationRun([source, target], { payload: { ...verificationRun([source, target]).payload, relationDispositions: [{ relationId: proposal.relationId, status: "UNRESOLVED" }], publicationEligibility: "BLOCKED" } });
    expect(() => publish({ drafts: [source, target], run: unresolved, proposedRelations: [proposal] })).toThrow("ERR_PHASE4_PUBLICATION_BLOCKED");
  });

  it("omits rejected proposals from the final graph", () => {
    const source = draft("Source"); const target = draft("Target");
    const proposal = createCapabilityRelation({ sourceCapabilityRef: source.provisionalCapabilityId, targetCapabilityRef: target.provisionalCapabilityId, relationType: "DISTINCT_CAPABILITY", status: "PROPOSED", reason: "semantic proposal", createdBy: "SEMANTIC_RESOLVER", createdAt: configuration.createdAt });
    const run = verificationRun([source, target], { payload: { ...verificationRun([source, target]).payload, relationDispositions: [{ relationId: proposal.relationId, status: "REJECTED" }] } });
    expect(publish({ drafts: [source, target], run, proposedRelations: [proposal] }).relations).toEqual([]);
  });

  it("derives publication metadata and the Phase-4 snapshot identity from the verification run", () => {
    const item = draft(); const firstRun = verificationRun([item]);
    const first = publish({ drafts: [item], run: firstRun });
    const expectedId = `SNAP_${sha256Utf8(JSON.stringify(["CAPABILITY_VERIFIED_SNAPSHOT_V1", firstRun.verificationRunId, firstRun.rawOutputHash])).slice(0, 24).toUpperCase()}`;
    expect(first.publication).toEqual({ mode: "PHASE4_VERIFIED", verificationRunId: firstRun.verificationRunId, verificationRawOutputHash: firstRun.rawOutputHash });
    expect(first.snapshotId).toBe(expectedId);
    const secondRun = { ...firstRun, verificationRunId: "VFY_FEDCBA9876543210FEDCBA98", rawOutputHash: "c".repeat(64) };
    expect(first.snapshotId).not.toBe(publish({ drafts: [item], run: secondRun }).snapshotId);
  });

  it("derives final snapshot audit metadata from the verification run, not publication context", () => {
    const item = draft();
    const run = verificationRun([item], { kernelVersion: "run-kernel", promptChecksum: "run-prompt", inference: { provider: "run-provider", model: "run-model" } });
    const snapshot = publish({ drafts: [item], run, publicationContext: { sourceBundleHash: "source", schemaVersion: "snapshot-schema", candidateCount: 1, rejectedCandidateCount: 0, kernelVersion: "caller-kernel", prompt: { checksum: "caller-prompt" }, inference: { provider: "caller-provider", model: "caller-model" } } as never });
    expect(snapshot.kernelVersion).toBe("run-kernel");
    expect(snapshot.prompt).toEqual({ checksum: "run-prompt" });
    expect(snapshot.inference).toEqual({ provider: "run-provider", model: "run-model" });
    expect(snapshot.schemaVersion).toBe("snapshot-schema");
  });

  it.each([
    ["extra verified evidence", [...evidence, { ...evidence[0], evidenceId: "EVD_EXTRA", verification: { status: "VERIFIED" as const, matchedDocId: "DOC_1" } }]],
    ["extra rejected evidence", [...evidence, { ...evidence[0], evidenceId: "EVD_EXTRA", verification: { status: "REJECTED_QUOTE_NOT_FOUND" as const } }]],
    ["missing required evidence", []],
    ["duplicate evidence ID", [evidence[0], { ...evidence[0] }]]
  ])("rejects a %s inventory", (_name, evidenceInventory) => {
    expect(() => publish({ evidenceInventory })).toThrow("ERR_PHASE4_EVIDENCE_INVENTORY_INVALID");
  });

  it("deduplicates shared draft evidence and preserves deterministic first-occurrence ordering", () => {
    const first = draft("First"); const second = draft("Second");
    expect(publish({ drafts: [first, second] }).evidenceIds).toEqual(["EVD_1"]);
    const distinctSecond = { ...second, evidenceIds: ["EVD_2"] };
    const evidenceTwo = { ...evidence[0], evidenceId: "EVD_2", exactQuote: "second evidence" };
    const snapshot = publish({ drafts: [first, distinctSecond], evidenceInventory: [evidenceTwo, evidence[0]] });
    expect(snapshot.evidenceIds).toEqual(["EVD_1", "EVD_2"]);
    expect(snapshot.evidence).toEqual([evidence[0], evidenceTwo]);
  });

  it("derives final createdAt from verification-run completion, not caller context", () => {
    const item = draft();
    const run = verificationRun([item], { completedAt: "2026-02-02T00:00:00.000Z" });
    const snapshot = publish({ drafts: [item], run, publicationContext: { sourceBundleHash: "source", schemaVersion: "snapshot-schema", candidateCount: 1, rejectedCandidateCount: 0, createdAt: "caller-controlled" } as never });
    expect(snapshot.createdAt).toBe(run.completedAt);
  });
});
