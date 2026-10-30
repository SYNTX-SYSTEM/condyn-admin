import { describe, expect, it } from "vitest";
import { readSemanticConfig, evidenceClassOfProvider } from "../../../lib/career/job-pool/semantic-config";
import { GeminiSemanticProvider, GEMINI_SEMANTIC_PROMPT, createSemanticProvider } from "../../../lib/career/job-pool/gemini-semantic-provider";
import { StandInSemanticProvider, admitProviderOutput, buildProviderRequest, evaluateRole, type CallLedger, type EngineProposal, type EngineRequirement, type RelationWriter } from "../../../lib/career/job-pool/semantic-relation-engine";
import type { CachedRelation } from "../../../lib/career/job-pool/relation-cache";

/** DETERMINISTIC_FIXTURE: a fake Gemini client; no network, no model, no key of the owner. */
const KEY = "AIza-test-key-0123456789";
const P: EngineProposal[] = [{ id: "P1", name: "Kubernetes Deployment", scope: "ATOMIC", structuralDefinition: "d", evidence: [{ evidenceId: "E1", sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes clusters." }] }];
const R: EngineRequirement[] = [{ key: { jobPoolUploadId: "U1", poolRoleId: "role_a", poolRequirementId: "r1" }, capability_name: "Kubernetes", required_level: "L3", domain: "", necessity: "REQUIRED" } as EngineRequirement];
const answer = JSON.stringify({ relations: [{ proposalId: "P1", requirementId: "R1", state: "COVERS", citedEvidenceIds: ["E1"], relationExplanation: "The quote names the same technology.", evidenceLimitation: "One sentence only." }] });
const client = (respond: (request: any) => unknown) => { const calls: any[] = []; return { calls, models: { generateContent: async (request: any) => { calls.push(request); return respond(request); } } }; };
const ok = (text: string) => ({ text, candidates: [{ finishReason: "STOP" }] });

describe("the semantic configuration: one source, fails closed", () => {
  const env = (o: Record<string, string | undefined>) => ({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "gemini", GEMINI_API_KEY: KEY, ROLE_DISCOVERY_DAY_LIMIT: "20", ...o });
  it("gemini is READY only with a key AND a budget of plain digits >= 1", () => {
    const ready = readSemanticConfig(env({}));
    expect(ready.state).toBe("READY");
    if (ready.state === "READY") { expect(ready.engine.provider).toBe("gemini"); expect(ready.dayLimit).toBe(20); expect(ready.engine.promptChecksum).toMatch(/^[0-9a-f]{64}$/); }
    for (const limit of ["", " ", "0", "-1", "1e3", "0x10", "1.0", "٣", "abc", undefined]) expect(readSemanticConfig(env({ ROLE_DISCOVERY_DAY_LIMIT: limit })).state, String(limit)).toBe("PROVIDER_NOT_AUTHORIZED");
    for (const key of ["", "   ", undefined]) expect(readSemanticConfig(env({ GEMINI_API_KEY: key })).state, String(key)).toBe("PROVIDER_NOT_AUTHORIZED");
  });
  it("unknown providers stay refused, stand-in stays executable, nothing configured stays NOT_CONFIGURED", () => {
    for (const provider of ["openai", "Gemini", "stand-in2", "anthropic"]) expect(readSemanticConfig(env({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: provider })).state, provider).toBe("PROVIDER_NOT_AUTHORIZED");
    expect(readSemanticConfig({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "stand-in", ROLE_DISCOVERY_DAY_LIMIT: "5" }).state).toBe("READY");
    expect(readSemanticConfig({}).state).toBe("NOT_CONFIGURED");
  });
  it("the model comes from ROLE_DISCOVERY_GEMINI_MODEL, then GEMINI_MODEL; the model is part of the engine identity", () => {
    const model = (o: Record<string, string | undefined>) => { const c = readSemanticConfig(env(o)); return c.state === "READY" ? c.engine.model : null; };
    expect(model({ ROLE_DISCOVERY_GEMINI_MODEL: "m-role", GEMINI_MODEL: "m-env" })).toBe("m-role");
    expect(model({ GEMINI_MODEL: "m-env" })).toBe("m-env");
    expect(typeof model({})).toBe("string");
  });
  it("evidence class follows the provider", () => {
    expect(evidenceClassOfProvider("stand-in")).toBe("STAND_IN");
    expect(evidenceClassOfProvider("gemini")).toBe("REAL_GEMINI");
    expect(evidenceClassOfProvider("other")).toBe("UNKNOWN");
  });
});

describe("GeminiSemanticProvider", () => {
  const engine = (model = "m1") => ({ contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: "x", provider: "gemini", model });
  it("sends the fixed instruction plus the request as JSON, asks for JSON, and returns the received text unchanged", async () => {
    const c = client(() => ok(answer));
    const provider = new GeminiSemanticProvider({ model: "m1", apiKey: KEY, client: c });
    const { request } = buildProviderRequest(engine(), P, R);
    expect(provider.identity).toEqual({ provider: "gemini", model: "m1" });
    expect((await provider.evaluate(request)).rawText).toBe(answer);
    expect(c.calls).toHaveLength(1);
    expect(c.calls[0].model).toBe("m1");
    expect(c.calls[0].config.responseMimeType).toBe("application/json");
    expect(String(c.calls[0].contents)).toContain(GEMINI_SEMANTIC_PROMPT);
    expect(String(c.calls[0].contents)).toContain("Kubernetes Deployment");
    expect(JSON.stringify(c.calls[0])).not.toContain(KEY);
  });
  it("the instruction forbids scores, ranking and suitability claims and requires cited evidence ids", () => {
    for (const word of ["score", "rank", "suitab", "evidenceId", "UNCLEAR", "JSON"]) expect(GEMINI_SEMANTIC_PROMPT.toLowerCase()).toContain(word.toLowerCase());
  });
  it("a missing key, a non-STOP finish and an empty text are failures with a code and never leak the key", async () => {
    const { request } = buildProviderRequest(engine(), P, R);
    await expect(new GeminiSemanticProvider({ model: "m1", apiKey: "" }).evaluate(request)).rejects.toThrow(/ERR_SEMANTIC_PROVIDER_KEY_MISSING/);
    for (const response of [{ text: answer, candidates: [{ finishReason: "MAX_TOKENS" }] }, { text: "", candidates: [{ finishReason: "STOP" }] }, {}]) {
      const error = await new GeminiSemanticProvider({ model: "m1", apiKey: KEY, client: client(() => response) }).evaluate(request).catch(e => e as Error);
      expect(error).toBeInstanceOf(Error);
      expect(String((error as Error).message)).toMatch(/^ERR_SEMANTIC_PROVIDER_/);
      expect(String((error as Error).message)).not.toContain(KEY);
    }
    const thrown = await new GeminiSemanticProvider({ model: "m1", apiKey: KEY, client: client(() => { throw new Error(`boom ${KEY}`); }) }).evaluate(request).catch(e => e as Error);
    expect(String((thrown as Error).message)).toBe("ERR_SEMANTIC_PROVIDER_FAILED");
  });
  it("its output goes through the unchanged strict admission: one call per role, a claim in the text is refused", async () => {
    const ledgerOf = (n: number) => { let left = n; const l: CallLedger = { reserve: async () => left-- > 0, consume: async () => undefined, release: async () => undefined }; return l; };
    const rows: CachedRelation[] = []; const writer: RelationWriter = { saveIfAbsent: async rs => { rows.push(...rs); return { inserted: rs.length, duplicates: 0, divergent: [] }; } };
    const run = (text: string) => evaluateRole({ engine: engine(), provider: new GeminiSemanticProvider({ model: "m1", apiKey: KEY, client: client(() => ok(text)) }), ledger: ledgerOf(1), writer, proposals: P, pendingRequirements: R, now: () => "2026-10-30T00:00:00.000Z" });
    expect((await run(answer)).status).toBe("SUCCEEDED");
    expect(rows).toHaveLength(1);
    expect(rows[0].authorityState).toBe("NONE");
    const claim = JSON.stringify({ relations: [{ proposalId: "P1", requirementId: "R1", state: "COVERS", citedEvidenceIds: ["E1"], relationExplanation: "Strong fit, score 9/10.", evidenceLimitation: "None." }] });
    expect((await run(claim)).status).toBe("FAILED");
    expect(rows).toHaveLength(1);
  });
  it("the identity the engine declares must be the provider's: a different model is refused before any reservation", async () => {
    const c = client(() => ok(answer)); let reserved = 0;
    const l: CallLedger = { reserve: async () => { reserved += 1; return true; }, consume: async () => undefined, release: async () => undefined };
    const out = await evaluateRole({ engine: engine("other-model"), provider: new GeminiSemanticProvider({ model: "m1", apiKey: KEY, client: c }), ledger: l, writer: { saveIfAbsent: async () => ({ inserted: 0, duplicates: 0, divergent: [] }) }, proposals: P, pendingRequirements: R, now: () => "t" });
    expect(out).toMatchObject({ status: "FAILED", code: "ERR_ENGINE_IDENTITY_MISMATCH" });
    expect([reserved, c.calls.length]).toEqual([0, 0]);
  });
});

describe("the provider factory: one place for the route and the automatic run", () => {
  it("returns the labelled stand-in or the Gemini provider matching the configured engine, nothing else", () => {
    const standIn = readSemanticConfig({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "stand-in", ROLE_DISCOVERY_DAY_LIMIT: "5" });
    const gemini = readSemanticConfig({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "gemini", GEMINI_API_KEY: KEY, ROLE_DISCOVERY_DAY_LIMIT: "5", GEMINI_MODEL: "m9" });
    if (standIn.state !== "READY" || gemini.state !== "READY") throw new Error("fixture");
    expect(createSemanticProvider(standIn.engine, { GEMINI_API_KEY: KEY })).toBeInstanceOf(StandInSemanticProvider);
    const g = createSemanticProvider(gemini.engine, { GEMINI_API_KEY: KEY });
    expect(g).toBeInstanceOf(GeminiSemanticProvider);
    expect(g.identity).toEqual({ provider: "gemini", model: "m9" });
    expect(() => createSemanticProvider({ ...gemini.engine, provider: "openai" }, { GEMINI_API_KEY: KEY })).toThrow(/ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED/);
    expect(() => createSemanticProvider(gemini.engine, {})).toThrow(/ERR_SEMANTIC_PROVIDER_KEY_MISSING/);
  });
});
