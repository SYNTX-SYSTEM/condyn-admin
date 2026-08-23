import { describe, expect, it } from "vitest";
import { buildProvisionalCapabilityId, createCapabilityCandidate, createEvidenceClaim, type CapabilityCandidateInput } from "../../../lib/career/capability-core";

describe("Capability Core identity", () => {
  it("creates stable candidate and evidence IDs", () => {
    const input: CapabilityCandidateInput = { canonical_name: "Architecture Design", capability_scope: "COMPOSITE", structural_definition: "A definition.", primary_domain: null, demonstrated_capability_level: null, model_confidence: 1, evidence_mode: "EXPLICIT", evidence: [{ source_document: "D", location: "1", exact_quote: "quote" }] };
    expect(createCapabilityCandidate("RUN", input).candidateId).toBe(createCapabilityCandidate("RUN", input).candidateId);
    expect(createEvidenceClaim(input.evidence[0]).evidenceId).toBe(createEvidenceClaim(input.evidence[0]).evidenceId);
  });
  it("uses only normalized name and scope for a provisional identity", () => {
    expect(buildProvisionalCapabilityId("  Ａrchitecture\nDesign ", "ATOMIC")).toBe(buildProvisionalCapabilityId("architecture design", "ATOMIC"));
  });
});
