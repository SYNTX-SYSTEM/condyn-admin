import { describe, expect, it } from "vitest";
import { admitProviderOutput, containsClaim, buildProviderRequest, evaluateRole, StandInSemanticProvider, type CallLedger, type EngineProposal, type EngineRequirement, type RelationWriter } from "../../../lib/career/job-pool/semantic-relation-engine";
import type { CachedRelation, RelationEngineIdentity } from "../../../lib/career/job-pool/relation-cache";

/** Stage-3 engine core, DETERMINISTIC_FIXTURE: injected stand-in provider, in-memory ledger and writer; no database, no network, no model. */
const ENGINE: RelationEngineIdentity = { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: "PX", provider: "stand-in", model: "stand-in" };
const P: EngineProposal[] = [
  { id: "P1", name: "Kubernetes Deployment", scope: "ATOMIC", structuralDefinition: "d", evidence: [{ evidenceId: "E1", sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes clusters." }, { evidenceId: "E1b", sourceDocumentId: "DOC_001", exactQuote: "Rolled out services." }] },
  { id: "P2", name: "Python ETL Development", scope: "ATOMIC", structuralDefinition: "d", evidence: [{ evidenceId: "E2", sourceDocumentId: "DOC_001", exactQuote: "Wrote ETL jobs." }] }
];
const req = (n: string, id: string): EngineRequirement => ({ key: { jobPoolUploadId: "U1", poolRoleId: "role_a", poolRequirementId: id }, capability_name: n, required_level: "L3", domain: "", necessity: "REQUIRED" });
const R = [req("Kubernetes", "r1"), req("Geospatial Visualisation", "r2")];
const ENGINE_ID = { provider: "stand-in", model: "stand-in" };
const NOW = "2026-10-29T00:00:00.000Z";
const ledger = (units: number) => { let left = units; const log: string[] = []; const l: CallLedger = { reserve: async () => { if (left <= 0) return false; left -= 1; log.push("reserve"); return true; }, consume: async () => { log.push("consume"); }, release: async () => { left += 1; log.push("release"); } }; return { l, log }; };
const writer = () => { const rows: CachedRelation[] = []; const w: RelationWriter = { saveIfAbsent: async rs => { rows.push(...rs); return { inserted: rs.length, duplicates: 0, divergent: [] }; } }; return { w, rows }; };
const admit = (rawText: string) => { const { idOf } = buildProviderRequest(ENGINE, P, R); return admitProviderOutput({ rawText, engine: ENGINE, proposals: P, requirements: R, idOf, now: NOW }); };
const valid = (patch: (r: Record<string, unknown>) => Record<string, unknown> = r => r) => JSON.stringify({ relations: P.flatMap(p => ["R1", "R2"].map(requirementId => patch({ proposalId: p.id, requirementId, state: "UNCLEAR", citedEvidenceIds: [], relationExplanation: "Names differ; nothing shown.", evidenceLimitation: "Only a short quote." }))) });

describe("the provider sees no role, organisation or pool text (C-1)", () => {
  it("request carries proposals with evidence ids and requirements by opaque id only", () => {
    const { request } = buildProviderRequest(ENGINE, P, R);
    const text = JSON.stringify(request);
    for (const secret of ["role_a", "U1", "pool", "rganization", "rganisation", "\"r1\"", "\"r2\""]) expect(text, secret).not.toContain(secret);
    expect(request.requirements.map(r => r.requirementId)).toEqual(["R1", "R2"]);
  });
});

describe("strict admission", () => {
  it("admits a complete, well-formed output: one record per pair, authority NONE", () => {
    const { records, refusals } = admit(valid());
    expect(refusals).toEqual([]);
    expect(records).toHaveLength(4);
    expect(records.every(r => r.authorityState === "NONE" && r.engine.provider === "stand-in")).toBe(true);
    expect(records[0].sourceEvidence).toEqual([]); // UNCLEAR cites nothing, so nothing is stored (never a quote the model did not name)
  });
  it("the model's own quote text is ignored: only cited evidence ids resolve to stored quotes", () => {
    const { records } = admit(valid(r => r.proposalId === "P1" && r.requirementId === "R1" ? { ...r, state: "COVERS", citedEvidenceIds: ["E1b"], exactQuote: "INVENTED QUOTE" } : r));
    const hit = records.find(x => x.capabilityName === "Kubernetes Deployment" && x.requirementText === "Kubernetes")!;
    expect(hit.sourceEvidence).toEqual([{ sourceDocumentId: "DOC_001", exactQuote: "Rolled out services." }]);
    expect(JSON.stringify(records)).not.toContain("INVENTED");
  });
  it.each([
    ["not JSON", "nope", "OUTPUT_NOT_JSON"],
    ["wrong shape", JSON.stringify({ x: 1 }), "OUTPUT_SHAPE_INVALID"],
    ["unknown proposal", valid(r => r.requirementId === "R1" ? { ...r, proposalId: "PX" } : r), "UNKNOWN_ID"],
    ["unknown state", valid(r => ({ ...r, state: "SUPPORTS" })), "STATE_UNKNOWN"],
    ["positive state without evidence", valid(r => ({ ...r, state: "COVERS", citedEvidenceIds: [] })), "POSITIVE_STATE_WITHOUT_EVIDENCE"],
    ["evidence of another proposal", valid(r => r.proposalId === "P1" ? { ...r, state: "PARTIAL", citedEvidenceIds: ["E2"] } : r), "CITED_EVIDENCE_NOT_OF_PROPOSAL"],
    ["empty explanation", valid(r => ({ ...r, relationExplanation: " " })), "EXPLANATION_OR_LIMITATION_MISSING"],
    ["suitability claim", valid(r => ({ ...r, relationExplanation: "Candidate is qualified and suitable." })), "CLAIM_IN_TEXT"],
    ["score in text", valid(r => ({ ...r, evidenceLimitation: "Match 87% of the role." })), "CLAIM_IN_TEXT"],
    ["text too long", valid(r => ({ ...r, relationExplanation: "x".repeat(1001) })), "TEXT_TOO_LONG"]
  ])("refuses: %s", (_label, raw, reason) => { const { refusals } = admit(raw); expect(refusals.some(x => x.reason === reason), JSON.stringify(refusals)).toBe(true); });
  it("a missing pair and a duplicate pair are refused, never filled in", () => {
    const parsed = JSON.parse(valid()); const dup = { relations: [...parsed.relations.slice(1), parsed.relations[1]] };
    const reasons = admit(JSON.stringify(dup)).refusals.map(x => x.reason);
    expect(reasons).toContain("PAIR_MISSING"); expect(reasons).toContain("DUPLICATE_PAIR");
  });
});

describe("role execution: ledger, one attempt, no silent retry", () => {
  const run = (over: Partial<Parameters<typeof evaluateRole>[0]> & { provider: Parameters<typeof evaluateRole>[0]["provider"] }) => {
    const { l, log } = ledger(1); const { w, rows } = writer();
    return { log, rows, go: () => evaluateRole({ engine: ENGINE, ledger: l, writer: w, proposals: P, pendingRequirements: R, now: () => NOW, ...over }) };
  };
  it("stand-in success: reserve before the call, consume after, records stored once", async () => {
    const provider = new StandInSemanticProvider(); const t = run({ provider });
    expect(await t.go()).toMatchObject({ status: "SUCCEEDED", stored: 4 });
    expect(t.log).toEqual(["reserve", "consume"]); expect(provider.calls).toBe(1); expect(t.rows).toHaveLength(4);
    const states = Object.fromEntries(t.rows.map(r => [`${r.capabilityName}|${r.requirementText}`, r.state]));
    expect(states["Kubernetes Deployment|Kubernetes"]).toBe("COVERS");
    expect(states["Kubernetes Deployment|Geospatial Visualisation"]).toBe("UNCLEAR");
  });
  it("no budget: no call at all", async () => {
    const provider = new StandInSemanticProvider(); const { l } = ledger(0); const { w } = writer();
    expect(await evaluateRole({ engine: ENGINE, provider, ledger: l, writer: w, proposals: P, pendingRequirements: R, now: () => NOW })).toEqual({ status: "BUDGET_EXHAUSTED" });
    expect(provider.calls).toBe(0);
  });
  it("a provider error releases the reservation, stores nothing and is NOT retried", async () => {
    let calls = 0; const provider = { identity: ENGINE_ID, evaluate: async () => { calls += 1; throw new Error("ERR_PROVIDER_DOWN: x"); } };
    const t = run({ provider });
    expect(await t.go()).toMatchObject({ status: "FAILED", code: "ERR_PROVIDER_DOWN" });
    expect(calls).toBe(1); expect(t.log).toEqual(["reserve", "release"]); expect(t.rows).toHaveLength(0);
  });
  it("a refused output stores nothing for the role, reports the refusals, consumes the call (it happened) and is not retried", async () => {
    let calls = 0; const provider = { identity: ENGINE_ID, evaluate: async () => { calls += 1; return { rawText: valid(r => ({ ...r, relationExplanation: "Clearly qualified." })) }; } };
    const t = run({ provider }); const out = await t.go();
    expect(out).toMatchObject({ status: "FAILED", code: "ERR_SEMANTIC_OUTPUT_REFUSED" });
    expect(t.rows).toHaveLength(0); expect(calls).toBe(1); expect(t.log).toEqual(["reserve", "consume"]);
  });
  it("nothing pending: no reservation, no call", async () => {
    const provider = new StandInSemanticProvider(); const t = run({ provider, pendingRequirements: [] });
    expect(await t.go()).toMatchObject({ status: "SUCCEEDED", stored: 0 }); expect(t.log).toEqual([]); expect(provider.calls).toBe(0);
  });
});

describe("claim guard bypasses found by PINK (D-ENG-1)", () => {
  const claims = ["87％", "eighty-seven percent", "87 percent", "87 Prozent", "0.87", "9/10", "8 out of 10", "scored", "Scores", "ranks", "recommends", "Hired", "qualifies", "Qualification", "Verification", "Proof",
    "competent", "a good fit", "geeignet", "Eignung nachgewiesen", "wir empfehlen die Einstellung", "Kompetenz verifiziert", "Qualifiziert", "s c o r e", "sc\u043ere", "sc\u200bore", "SCORE", "r a n k i n g", "twenty out of thirty"];
  it.each(claims)("refuses: %s", claim => expect(containsClaim(`The proposal ${claim} here.`)).toBe(true));
  const innocent = ["Names differ; nothing shown.", "one quote mentions it", "approved by a review board", "improve later", "provenance of the data", "based in Frankfurt and Yorkshire", "underscore naming", "a competition entry", "K8s and S3 and OAuth 2.0 at Level L3", "ISO 26262 and ROS 2", "Neo4j graph", "The quote mentions Kubernetes but not the requirement's tooling.", "Partly overlapping scope: operation versus design.", "Keine gemeinsamen Begriffe im Zitat."];
  it.each(innocent)("allows an innocent statement: %s", text => expect(containsClaim(text)).toBe(false));
  it("the operands' own names are data, not claims (D-ENG-3): Security Certification, Actuarial Qualification, Data Provenance, Architecture Communication", () => {
    for (const name of ["Security Certification", "Actuarial Qualification", "Data Provenance", "HL7 FHIR", "Architecture Communication", "B2B Industrial Products"]) {
      expect(containsClaim(`The requirement ${name} is not named in the quote.`, [name])).toBe(false);
      expect(containsClaim(`The requirement ${name} is qualified.`, [name])).toBe(true);
    }
  });
  it("nothing is matched across word boundaries (re|comm), single-letter runs are still joined (s c o r e)", () => {
    expect(containsClaim("Architecture Communication in the team")).toBe(false);
    expect(containsClaim("s c o r e")).toBe(true);
  });
});

describe("honest evidence, identity and defined failure outcomes (PINK D-ENG-2, O-ENG-1, O-ENG-3)", () => {
  it("DIFFERENT / UNCLEAR without a citation is stored with NO evidence — no quote the model did not name", () => {
    const { records, refusals } = admit(valid());
    expect(refusals).toEqual([]);
    expect(records.every(r => r.sourceEvidence.length === 0 && (r.state === "UNCLEAR"))).toBe(true);
  });
  it("a stand-in never serves another engine identity: refused before any reservation", async () => {
    const provider = new StandInSemanticProvider(); const { l, log } = ledger(1); const { w, rows } = writer();
    const gemini: RelationEngineIdentity = { ...ENGINE, provider: "gemini", model: "gemini-3.1-pro-preview" };
    expect(await evaluateRole({ engine: gemini, provider, ledger: l, writer: w, proposals: P, pendingRequirements: R, now: () => NOW })).toMatchObject({ status: "FAILED", code: "ERR_ENGINE_IDENTITY_MISMATCH" });
    expect(provider.calls).toBe(0); expect(log).toEqual([]); expect(rows).toHaveLength(0);
  });
  it("a failing ledger or store yields a defined outcome and never throws", async () => {
    const provider = new StandInSemanticProvider(); const { w } = writer();
    const consumeFails: CallLedger = { reserve: async () => true, consume: async () => { throw new Error("db down"); }, release: async () => {} };
    expect(await evaluateRole({ engine: ENGINE, provider, ledger: consumeFails, writer: w, proposals: P, pendingRequirements: R, now: () => NOW })).toMatchObject({ status: "FAILED", code: "ERR_LEDGER_CONSUME_FAILED" });
    const reserveFails: CallLedger = { reserve: async () => { throw new Error("db down"); }, consume: async () => {}, release: async () => {} };
    expect(await evaluateRole({ engine: ENGINE, provider, ledger: reserveFails, writer: w, proposals: P, pendingRequirements: R, now: () => NOW })).toMatchObject({ status: "FAILED", code: "ERR_LEDGER_RESERVE_FAILED" });
    const { l } = ledger(1);
    const brokenWriter: RelationWriter = { saveIfAbsent: async () => { throw new Error("ERR_RELATION_CACHE_RECORD_CORRUPT:PRREL_X"); } };
    expect(await evaluateRole({ engine: ENGINE, provider, ledger: l, writer: brokenWriter, proposals: P, pendingRequirements: R, now: () => NOW })).toMatchObject({ status: "FAILED", code: "ERR_RELATION_CACHE_RECORD_CORRUPT" });
  });
});
