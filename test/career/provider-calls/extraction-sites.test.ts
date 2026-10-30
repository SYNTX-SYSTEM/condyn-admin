import { beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiCapabilityDiscoveryProvider } from "../../../lib/career/capability-core";
import { GeminiCapabilityConvergenceProvider } from "../../../lib/career/capability-core/convergence";
import { GeminiProvider } from "../../../lib/career/providers/gemini";
import { ProviderCallBlocked, runWithProviderCallRecorder, type ProviderCallRecorder, type ProviderCallStage } from "../../../lib/career/provider-calls/guard";

/** Every model call of the extraction passes the register seam (point 2), DETERMINISTIC_FIXTURE: mocked SDK, a recording fake register; no network, no model. */
const sdk = vi.hoisted(() => ({ responses: [] as Array<Record<string, unknown>>, calls: 0 }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(_options: unknown) { void _options; }
    models = { generateContent: async () => { sdk.calls += 1; const next = sdk.responses.shift(); if (!next) throw Object.assign(new Error("no scripted response"), { status: 500 }); return next; } };
  }
}));

function register(limit = 100) {
  const stages: ProviderCallStage[] = []; const ends: string[] = [];
  const recorder: ProviderCallRecorder = {
    begin: async input => { if (stages.length >= limit) throw new ProviderCallBlocked("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED"); stages.push(input.stage); return `C${stages.length}`; },
    markSent: async () => undefined,
    complete: async () => { ends.push("COMPLETED"); }, failAfterSend: async () => { ends.push("FAILED_AFTER_SEND"); }, failBeforeSend: async () => { ends.push("FAILED_BEFORE_SEND"); }
  };
  return { recorder, stages, ends };
}
const okDiscovery = JSON.stringify({ kernel_version: "v", capabilities: [], coverage_audit: { source_documents_examined: 1, capability_count: 0, atomic_capability_count: 0, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, unresolved_items: [] } });

beforeEach(() => { sdk.responses.length = 0; sdk.calls = 0; });

describe("Discovery and Convergence", () => {
  it("each request is written down with its stage before it is sent; without a register they run unchanged", async () => {
    const discovery = new GeminiCapabilityDiscoveryProvider({ apiKey: "KEY", model: "m", client: { models: { generateContent: async () => ({ text: okDiscovery, candidates: [{ finishReason: "STOP" }] }) } } });
    await discovery.execute({ systemPrompt: "K", userPrompt: "S" }).catch(() => undefined); // schema details are not the point here
    const f = register();
    await runWithProviderCallRecorder(f.recorder, () => discovery.execute({ systemPrompt: "K", userPrompt: "S" })).catch(() => undefined);
    expect(f.stages).toEqual(["EXTRACTION_DISCOVERY"]); expect(f.ends).toEqual(["COMPLETED"]);
    const convergence = new GeminiCapabilityConvergenceProvider({ apiKey: "KEY", model: "m", client: { models: { generateContent: async () => ({ text: "{}", candidates: [{ finishReason: "STOP" }] }) } } });
    const g = register();
    await runWithProviderCallRecorder(g.recorder, () => convergence.execute({ systemPrompt: "K", userPrompt: "S" })).catch(() => undefined);
    expect(g.stages).toEqual(["EXTRACTION_CONVERGENCE"]);
  });

  it("a spent budget is not a provider failure: nothing is sent and the blocking error keeps its identity (it is not turned into ERR_..._PROVIDER_FAILURE)", async () => {
    let sent = 0;
    const client = { models: { generateContent: async () => { sent += 1; return { text: "{}" }; } } };
    const spent = register(0);
    const discoveryError = await runWithProviderCallRecorder(spent.recorder, () => new GeminiCapabilityDiscoveryProvider({ apiKey: "KEY", model: "m", client }).execute({ systemPrompt: "K", userPrompt: "S" })).catch(e => e);
    const convergenceError = await runWithProviderCallRecorder(spent.recorder, () => new GeminiCapabilityConvergenceProvider({ apiKey: "KEY", model: "m", client }).execute({ systemPrompt: "K", userPrompt: "S" })).catch(e => e);
    expect(sent).toBe(0);
    expect(discoveryError).toBeInstanceOf(ProviderCallBlocked); expect(convergenceError).toBeInstanceOf(ProviderCallBlocked);
    expect((discoveryError as ProviderCallBlocked).code).toBe("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED");
  });
});

describe("the legacy analysis with its regenerations and model cascade", () => {
  const prompt = { systemPrompt: "S", userPrompt: "U", allowedDocIds: ["DOC_001"] } as never;
  it("every generateContent of the structured loop is a call of its own: a truncated answer that is regenerated is two calls", async () => {
    sdk.responses.push({ text: "{\"x\":1}", candidates: [{ finishReason: "MAX_TOKENS" }] }, { text: "{\"structured_data\":{}}", candidates: [{ finishReason: "STOP" }] });
    const f = register();
    const out = await runWithProviderCallRecorder(f.recorder, () => new GeminiProvider({ apiKey: "KEY", modelCascade: ["m1"] }).execute(prompt));
    expect(out).toContain("structured_data");
    expect(f.stages).toEqual(["EXTRACTION_LEGACY", "EXTRACTION_LEGACY"]); expect(sdk.calls).toBe(2);
  });
  it("a failing model moves the cascade on — and every model tried is a counted call", async () => {
    sdk.responses.push({ text: "", candidates: [] });
    const f = register(); const provider = new GeminiProvider({ apiKey: "KEY", modelCascade: ["m1", "m2"] });
    sdk.calls = 0;
    await runWithProviderCallRecorder(f.recorder, () => provider.execute(prompt)).catch(() => undefined);
    expect(f.stages.length).toBeGreaterThanOrEqual(1);
    expect(f.stages.length).toBe(sdk.calls); // no request without a register row
  });
  it("the budget ends the whole analysis: the call beyond it is not sent, no further model of the cascade is tried, the blocking error propagates", async () => {
    sdk.responses.push({ text: "{\"x\":1}", candidates: [{ finishReason: "MAX_TOKENS" }] }, { text: "{\"x\":1}", candidates: [{ finishReason: "MAX_TOKENS" }] }, { text: "{\"structured_data\":{}}", candidates: [{ finishReason: "STOP" }] });
    const f = register(1);
    const error = await runWithProviderCallRecorder(f.recorder, () => new GeminiProvider({ apiKey: "KEY", modelCascade: ["m1", "m2", "m3"] }).execute(prompt)).catch(e => e);
    expect(error).toBeInstanceOf(ProviderCallBlocked);
    expect(sdk.calls).toBe(1); expect(f.stages).toHaveLength(1);
  });
  it("without a register the analysis runs exactly as before", async () => {
    sdk.responses.push({ text: "{\"structured_data\":{}}", candidates: [{ finishReason: "STOP" }] });
    expect(await new GeminiProvider({ apiKey: "KEY", modelCascade: ["m1"] }).execute(prompt)).toContain("structured_data");
    expect(sdk.calls).toBe(1);
  });
});
