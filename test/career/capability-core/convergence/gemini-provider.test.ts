import { describe, expect, it } from "vitest";
import { GeminiCapabilityConvergenceProvider } from "../../../../lib/career/capability-core/convergence";
import { convergenceOutput } from "./fixtures";

describe("Gemini Capability Convergence provider", () => {
  it("requires an explicit model and never requires a key for an injected client", () => {
    expect(() => new GeminiCapabilityConvergenceProvider({ apiKey: "KEY", model: "" })).toThrow("MODEL_NOT_CONFIGURED");
  });
  it("uses the exact configured model and Gemini-compatible convergence schema", async () => {
    let request: any; let calls = 0;
    const emptyOutput = { convergence_version: "convergence-v1", groups: [], relations: [], reconciliation_audit: { input_candidate_count: 0, grouped_candidate_count: 0, group_count: 0, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } };
    const provider = new GeminiCapabilityConvergenceProvider({ apiKey: "KEY", model: "configured-model", client: { models: { generateContent: async (item) => { calls++; request = item; return { text: JSON.stringify(emptyOutput) }; } } } });
    await provider.execute({ systemPrompt: "ULTRA_SECRET_FAKE_CONVERGENCE_KERNEL_7C31", userPrompt: "TRANSPORT" });
    const schema = JSON.stringify(request.config.responseJsonSchema);
    expect(request.model).toBe("configured-model"); expect(request.config.responseMimeType).toBe("application/json");
    expect(schema).toContain("groups"); expect(schema).not.toContain('"definitions"'); expect(schema).not.toContain('"$schema"'); expect(schema).not.toContain('"minLength"'); expect(schema).not.toContain('"pattern"'); expect(schema).not.toContain('"default"');
    expect(request.config.responseJsonSchema.required).toEqual(["convergence_version", "groups", "relations", "reconciliation_audit"]);
    expect(request.config.responseJsonSchema.properties.groups.items.properties.capability_scope.enum).toEqual(["ATOMIC", "COMPOSITE"]); expect(request.config.responseJsonSchema.properties.reconciliation_audit.properties.input_candidate_count.minimum).toBe(0); expect(request.config.responseJsonSchema.properties.groups.items.additionalProperties).toBe(false); expect(calls).toBe(1);
  });
  it.each(["{", JSON.stringify({}), JSON.stringify(convergenceOutput(["CAND_A"]))])("rejects malformed, invalid, or truncated structured output without retry", async (text) => {
    let calls = 0; const provider = new GeminiCapabilityConvergenceProvider({ apiKey: "KEY", model: "m", client: { models: { generateContent: async () => { calls++; return { text, candidates: text === JSON.stringify(convergenceOutput(["CAND_A"])) ? [{ finishReason: "MAX_TOKENS" }] : undefined }; } } } });
    await expect(provider.execute({ systemPrompt: "K", userPrompt: "S" })).rejects.toThrow("ERR_CAPABILITY_CONVERGENCE_STRUCTURED_OUTPUT_INVALID"); expect(calls).toBe(1);
  });
  it("sanitizes provider failures without leaking a fake API key", async () => {
    const provider = new GeminiCapabilityConvergenceProvider({ apiKey: "ULTRA_FAKE_API_KEY_7C31", model: "m", client: { models: { generateContent: async () => { throw new Error("ULTRA_FAKE_API_KEY_7C31"); } } } });
    await expect(provider.execute({ systemPrompt: "K", userPrompt: "S" })).rejects.toThrow("ERR_CAPABILITY_CONVERGENCE_PROVIDER_FAILURE");
    await provider.execute({ systemPrompt: "K", userPrompt: "S" }).catch((error) => expect(String(error)).not.toContain("ULTRA_FAKE_API_KEY_7C31"));
  });
  it("normalizes a hostile external error with an internal-looking prefix", async () => {
    const provider = new GeminiCapabilityConvergenceProvider({ apiKey: "KEY", model: "m", client: { models: { generateContent: async () => { throw new Error("ERR_CAPABILITY_CONVERGENCE_PROVIDER_FAILURE ULTRA_FAKE_API_KEY_7C31"); } } } });
    await expect(provider.execute({ systemPrompt: "K", userPrompt: "S" })).rejects.toThrow(/^ERR_CAPABILITY_CONVERGENCE_PROVIDER_FAILURE$/);
  });
});
