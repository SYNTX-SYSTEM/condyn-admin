import { describe, expect, it } from "vitest";
import { CapabilityKernelOutputSchema, createCapabilityCandidate } from "../../../lib/career/capability-core";

const valid = {
  kernel_version: "1", capabilities: [{ canonical_name: "Control design", capability_scope: "ATOMIC", structural_definition: "Designs controls.", primary_domain: null, demonstrated_capability_level: "L3", model_confidence: 0.8, evidence_mode: "EXPLICIT", evidence: [{ source_document: "DOC_1", location: "Page 1", exact_quote: "Designs controls." }] }], coverage_audit: { source_documents_examined: 1, capability_count: 1, atomic_capability_count: 1, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 1, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 }
};

describe("Capability Core kernel schema", () => {
  it("parses a valid candidate and creates a distinct internal contract", () => {
    const parsed = CapabilityKernelOutputSchema.parse(valid);
    expect(createCapabilityCandidate("RUN_1", parsed.capabilities[0]).proposedCanonicalName).toBe("Control design");
  });
  it("rejects invalid scope, confidence, missing evidence, and level", () => {
    expect(() => CapabilityKernelOutputSchema.parse({ ...valid, capabilities: [{ ...valid.capabilities[0], capability_scope: "ROLE" }] })).toThrow();
    expect(() => CapabilityKernelOutputSchema.parse({ ...valid, capabilities: [{ ...valid.capabilities[0], model_confidence: 1.1 }] })).toThrow();
    expect(() => CapabilityKernelOutputSchema.parse({ ...valid, capabilities: [{ ...valid.capabilities[0], evidence: [] }] })).toThrow();
    expect(() => CapabilityKernelOutputSchema.parse({ ...valid, capabilities: [{ ...valid.capabilities[0], demonstrated_capability_level: "L7" }] })).toThrow();
  });
  it("rejects unexpected model fields and incomplete coverage audits", () => {
    expect(() => CapabilityKernelOutputSchema.parse({ ...valid, unexpected: true })).toThrow();
    expect(() => CapabilityKernelOutputSchema.parse({ ...valid, coverage_audit: {} })).toThrow();
  });
});
