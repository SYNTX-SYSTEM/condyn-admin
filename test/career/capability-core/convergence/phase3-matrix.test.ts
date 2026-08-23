import { describe, expect, it } from "vitest";
import { canonicalizeCapabilityConvergence, validateCapabilityConvergenceOutput } from "../../../../lib/career/capability-core/convergence";
import { convergenceOutput, rejectedCandidate, verifiedCandidate } from "./fixtures";

describe("Phase 3 semantic convergence matrix", () => {
  const first = verifiedCandidate("CAND_A");
  const second = verifiedCandidate("CAND_B", { evidenceClaims: [{ evidenceId: "EVD_B", sourceDocumentRef: "DOC_B", declaredLocation: "p2", exactQuote: "Proof B", verification: { status: "VERIFIED", matchedDocId: "DOC_B" } }, { evidenceId: "EVD_REJECTED", sourceDocumentRef: "DOC_X", declaredLocation: "p3", exactQuote: "No", verification: { status: "REJECTED_QUOTE_NOT_FOUND" } }] });
  const rejected = rejectedCandidate("CAND_REJECTED");

  it("accepts every eligible candidate exactly once and excludes rejected candidates", () => {
    const output = convergenceOutput([first.candidateId, second.candidateId]);
    expect(validateCapabilityConvergenceOutput(output, [first, second, rejected]).groups).toHaveLength(1);
  });
  it.each([
    ["unknown candidate", { ...convergenceOutput([first.candidateId]), groups: [{ ...convergenceOutput([first.candidateId]).groups[0], member_candidate_ids: ["UNKNOWN"] }] }, "UNKNOWN_CANDIDATE"],
    ["rejected candidate", convergenceOutput([rejected.candidateId]), "REJECTED_CANDIDATE"],
    ["missing candidate", convergenceOutput([first.candidateId]), "MISSING_CANDIDATE"],
    ["duplicate membership", { ...convergenceOutput([first.candidateId, second.candidateId]), groups: [{ ...convergenceOutput([first.candidateId, second.candidateId]).groups[0] }, { ...convergenceOutput([first.candidateId]).groups[0], group_key: "group-b" }], reconciliation_audit: { input_candidate_count: 2, grouped_candidate_count: 2, group_count: 2, same_capability_merge_count: 1, unresolved_relation_count: 0, reconciliation_pass_completed: true } }, "DUPLICATE_MEMBERSHIP"],
    ["duplicate group key", { ...convergenceOutput([first.candidateId, second.candidateId]), groups: [{ ...convergenceOutput([first.candidateId]).groups[0] }, { ...convergenceOutput([second.candidateId]).groups[0] }] }, "DUPLICATE_GROUP_KEY"],
    ["unknown relation endpoint", { ...convergenceOutput([first.candidateId, second.candidateId]), relations: [{ source_group_key: "group-a", target_group_key: "missing", relation_type: "RELATED_CAPABILITY", reason: "x" }], reconciliation_audit: { ...convergenceOutput([first.candidateId, second.candidateId]).reconciliation_audit, unresolved_relation_count: 0 } }, "RELATION_ENDPOINT"],
    ["self relation", { ...convergenceOutput([first.candidateId, second.candidateId]), relations: [{ source_group_key: "group-a", target_group_key: "group-a", relation_type: "RELATED_CAPABILITY", reason: "x" }], reconciliation_audit: { ...convergenceOutput([first.candidateId, second.candidateId]).reconciliation_audit, unresolved_relation_count: 0 } }, "SELF_RELATION"],
    ["same capability relation", { ...convergenceOutput([first.candidateId]), relations: [{ source_group_key: "group-a", target_group_key: "other", relation_type: "SAME_CAPABILITY", reason: "x" }] }, "SCHEMA_INVALID"],
    ["audit mismatch", { ...convergenceOutput([first.candidateId, second.candidateId]), reconciliation_audit: { ...convergenceOutput([first.candidateId, second.candidateId]).reconciliation_audit, group_count: 2 } }, "AUDIT_MISMATCH"]
  ])("rejects %s", (_name, output, code) => expect(() => validateCapabilityConvergenceOutput(output, [first, second, rejected])).toThrow(code));
  it("builds drafts from verified evidence only with deterministic provenance and PCAP identities", () => {
    const output = convergenceOutput([second.candidateId, first.candidateId]);
    const result = canonicalizeCapabilityConvergence(validateCapabilityConvergenceOutput(output, [first, second]), [first, second], "2026-01-01T00:00:00.000Z");
    expect(result.canonicalDrafts[0]).toMatchObject({ provisionalCapabilityId: "PCAP_3112279946DBF8871E284F36", evidenceIds: ["EVD_B", first.evidenceClaims[0].evidenceId].sort(), provenance: { sourceCandidateIds: [first.candidateId, second.candidateId].sort(), sourceDocumentIds: ["DOC_A", "DOC_B"] }, semanticDefinitionStatus: "NOT_RUN" });
    expect(JSON.stringify(result.canonicalDrafts)).not.toContain("EVD_REJECTED");
  });
  it("converts semantic relations to proposed PCAP relations and preserves UNRESOLVED", () => {
    const output = { ...convergenceOutput([first.candidateId]), groups: [convergenceOutput([first.candidateId]).groups[0], { ...convergenceOutput([second.candidateId]).groups[0], group_key: "group-b", canonical_name: "Other canonical capability" }], relations: [{ source_group_key: "group-a", target_group_key: "group-b", relation_type: "UNRESOLVED" as const, reason: "uncertain" }], reconciliation_audit: { input_candidate_count: 2, grouped_candidate_count: 2, group_count: 2, same_capability_merge_count: 0, unresolved_relation_count: 1, reconciliation_pass_completed: true } };
    const result = canonicalizeCapabilityConvergence(validateCapabilityConvergenceOutput(output, [first, second]), [first, second], "now");
    expect(result.proposedRelations[0]).toMatchObject({ relationType: "UNRESOLVED", status: "PROPOSED", createdBy: "SEMANTIC_RESOLVER", sourceCapabilityRef: expect.stringMatching(/^PCAP_/), targetCapabilityRef: expect.stringMatching(/^PCAP_/) });
  });
  it("fails closed when distinct groups collide on PCAP identity", () => {
    const output = { ...convergenceOutput([first.candidateId]), groups: [{ ...convergenceOutput([first.candidateId]).groups[0] }, { ...convergenceOutput([second.candidateId]).groups[0], group_key: "group-b" }], reconciliation_audit: { input_candidate_count: 2, grouped_candidate_count: 2, group_count: 2, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } };
    output.groups[1].canonical_name = output.groups[0].canonical_name;
    expect(() => canonicalizeCapabilityConvergence(validateCapabilityConvergenceOutput(output, [first, second]), [first, second], "now")).toThrow("ID_COLLISION");
  });
});
