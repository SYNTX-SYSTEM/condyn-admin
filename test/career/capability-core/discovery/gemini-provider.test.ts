import { describe, expect, it } from "vitest";
import { GeminiCapabilityDiscoveryProvider } from "../../../../lib/career/capability-core";
const valid = JSON.stringify({ kernel_version: "v", capabilities: [], coverage_audit: { source_documents_examined: 1, capability_count: 0, atomic_capability_count: 0, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 } });
describe("Gemini Capability Discovery provider", () => { it("uses one exact model and strict JSON schema", async () => { let request: any; const provider = new GeminiCapabilityDiscoveryProvider({ apiKey: "KEY", model: "configured-model", client: { models: { generateContent: async (item) => { request = item; return { text: valid }; } } } }); await expect(provider.execute({ systemPrompt: "KERNEL", userPrompt: "SOURCE" })).resolves.toMatchObject({ kernelOutput: { kernel_version: "v" } }); expect(request.model).toBe("configured-model"); expect(request.config.responseMimeType).toBe("application/json"); expect(JSON.stringify(request.config.responseJsonSchema)).toContain("capabilities"); expect(request.contents.match(/KERNEL/g)).toHaveLength(1); expect(request.contents.match(/SOURCE/g)).toHaveLength(1); }); it("rejects absent, malformed, or schema-invalid output without retries", async () => { for (const text of ["", "{", "{}"] as const) { let calls = 0; const provider = new GeminiCapabilityDiscoveryProvider({ apiKey: "KEY", model: "m", client: { models: { generateContent: async () => { calls++; return { text }; } } } }); await expect(provider.execute({ systemPrompt: "K", userPrompt: "S" })).rejects.toThrow(/STRUCTURED_OUTPUT_INVALID/); expect(calls).toBe(1); } }); });

it("sends a Gemini-compatible projection of the Capability Kernel schema", async () => {
  let request: any;
  const provider = new GeminiCapabilityDiscoveryProvider({
    apiKey: "KEY",
    model: "m",
    client: { models: { generateContent: async (item) => { request = item; return { text: valid }; } } }
  });

  await provider.execute({ systemPrompt: "K", userPrompt: "S" });

  const schema = request.config.responseJsonSchema;
  const serialized = JSON.stringify(schema);
  expect(serialized).toContain("capabilities");
  expect(serialized).not.toContain('"definitions"');
  expect(serialized).not.toContain('"$schema"');
  expect(serialized).not.toContain('"minLength"');
  expect(serialized).not.toContain('"pattern"');
  expect(serialized).not.toContain('"default"');
  expect(schema.required).toEqual(["kernel_version", "capabilities", "coverage_audit"]);
  expect(schema.properties.capabilities.items.properties.capability_scope.enum).toEqual(["ATOMIC", "COMPOSITE"]);
  expect(schema.properties.capabilities.items.properties.model_confidence).toMatchObject({ minimum: 0, maximum: 1 });
  expect(schema.properties.capabilities.items.required).toContain("model_confidence");
  expect(schema.properties.capabilities.items.additionalProperties).toBe(false);
});

it("rejects schema-valid Gemini output truncated with MAX_TOKENS without retrying", async () => {
  let calls = 0;
  const provider = new GeminiCapabilityDiscoveryProvider({
    apiKey: "KEY",
    model: "m",
    client: { models: { generateContent: async () => {
      calls++;
      return { text: valid, candidates: [{ finishReason: "MAX_TOKENS" }] };
    } } }
  });

  await expect(provider.execute({ systemPrompt: "K", userPrompt: "S" }))
    .rejects.toThrow(/ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID/);
  expect(calls).toBe(1);
});
