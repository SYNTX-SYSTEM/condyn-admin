import { describe, expect, it } from "vitest";
import { ROLE_MAX_ATTEMPTS, PARTIAL_ADMISSION_CODE, runInvestigation, type InvestigationStoreLike } from "../../../lib/career/job-pool/semantic-investigation-run";
import { SemanticProviderError, TRANSIENT_PROVIDER_CODE, type CallLedger, type EngineProposal, type EngineRequirement, type EvaluationContext, type RelationWriter } from "../../../lib/career/job-pool/semantic-relation-engine";
import type { CachedRelation, RelationEngineIdentity } from "../../../lib/career/job-pool/relation-cache";
import type { InvestigationStatus, TaskStatus } from "../../../lib/career/job-pool/semantic-investigation-store";

/** The run loop with retries (point 1), DETERMINISTIC_FIXTURE: in-memory store, ledger and cache, scripted provider; no database, no network, no model. */
const ENGINE: RelationEngineIdentity = { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: "PX", provider: "stand-in", model: "stand-in" };
const NOW = "2026-10-29T00:00:00.000Z";
const P: EngineProposal[] = [{ id: "P1", name: "Kubernetes Deployment", scope: "ATOMIC", structuralDefinition: "d", evidence: [{ evidenceId: "E1", sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes clusters." }] }];
const req = (name: string, id: string, role: string): EngineRequirement => ({ key: { jobPoolUploadId: "U1", poolRoleId: role, poolRequirementId: id }, capability_name: name, required_level: "L3", domain: "", necessity: "REQUIRED" } as unknown as EngineRequirement);
const ROLES = [
  { key: { jobPoolUploadId: "U1", poolRoleId: "role_a" }, requirements: [req("Kubernetes", "a1", "role_a")] },
  { key: { jobPoolUploadId: "U1", poolRoleId: "role_b" }, requirements: [req("Geospatial Visualisation", "b1", "role_b"), req("Terraform", "b2", "role_b")] }
];

function world(options: { units?: number } = {}) {
  const tasks = new Map<string, { status: TaskStatus; code?: string | null; refusals?: unknown; stored?: number }>();
  const statuses: InvestigationStatus[] = [];
  const store: InvestigationStoreLike = {
    moveTask: async i => { tasks.set(i.poolRoleId, { status: i.to, code: i.errorCode, refusals: i.refusals, stored: i.stored }); },
    setStatus: async (_id, status) => { statuses.push(status); }
  };
  let left = options.units ?? 100; const log: string[] = [];
  const ledger: CallLedger = { reserve: async () => { if (left <= 0) return false; left -= 1; log.push("reserve"); return true; }, consume: async () => { log.push("consume"); }, release: async () => { left += 1; log.push("release"); } };
  const rows = new Map<string, CachedRelation>();
  const cache = { getByKeys: async (keys: string[]) => keys.flatMap(k => rows.has(k) ? [rows.get(k)!] : []), saveIfAbsent: async (rs: CachedRelation[]) => { for (const r of rs) rows.set(r.relationKey, r); return { inserted: rs.length, duplicates: 0, divergent: [] }; } } satisfies { getByKeys: unknown } & RelationWriter;
  return { tasks, statuses, store, ledger, log, cache, rows };
}
/** A provider answering with a valid output for exactly the pairs it was asked, optionally with some pairs poisoned by a claim. */
const answer = (request: { proposals: Array<{ id: string }>; requirements: Array<{ requirementId: string }> }, poison: (index: number) => boolean = () => false) => ({
  rawText: JSON.stringify({ relations: request.proposals.flatMap(p => request.requirements.map((r, i) => ({ proposalId: p.id, requirementId: r.requirementId, state: "UNCLEAR", citedEvidenceIds: [], relationExplanation: poison(i) ? "Clearly qualified." : "Names differ; nothing shown.", evidenceLimitation: "Only a short quote." }))) })
});
const run = (w: ReturnType<typeof world>, evaluate: (request: never, context?: EvaluationContext) => Promise<{ rawText: string }>, extra: { maxAttempts?: number; touch?: () => Promise<void> } = {}) =>
  runInvestigation({ investigationId: "RINV_T", store: w.store, engine: ENGINE, provider: { identity: { provider: "stand-in", model: "stand-in" }, evaluate: evaluate as never }, ledger: w.ledger, cache: w.cache, proposals: P, roles: ROLES, now: () => NOW, retryDelayMs: 0, sleep: async () => undefined, ...extra });
const transient = () => new SemanticProviderError("ERR_SEMANTIC_PROVIDER_FAILED", "TRANSIENT", 503);

describe("run loop: classified failures and one more attempt", () => {
  it("a TRANSIENT failure is asked again once: its own reservation, its own context (attempt 2), the role then succeeds", async () => {
    const w = world(); const seen: Array<EvaluationContext | undefined> = []; let calls = 0;
    const result = await run(w, async (request, context) => { seen.push(context); calls += 1; if (calls === 1) throw transient(); return answer(request); });
    expect(result.status).toBe("COMPLETED");
    expect(w.tasks.get("role_a")?.status).toBe("SUCCEEDED");
    expect(seen.map(c => [c?.poolRoleId, c?.attempt])).toEqual([["role_a", 1], ["role_a", 2], ["role_b", 1]]);
    expect(w.log).toEqual(["reserve", "consume", "reserve", "consume", "reserve", "consume"]); // the failed attempt stays consumed, the retry reserves anew
  });

  it("a second TRANSIENT failure ends the role as FAILED with the transient code; the other roles still run; the run is PARTIAL", async () => {
    const w = world(); let calls = 0;
    const result = await run(w, async (request, context) => { calls += 1; if (context?.poolRoleId === "role_a") throw transient(); return answer(request); });
    expect(result.status).toBe("PARTIAL");
    expect(w.tasks.get("role_a")).toMatchObject({ status: "FAILED", code: TRANSIENT_PROVIDER_CODE });
    expect(w.tasks.get("role_b")?.status).toBe("SUCCEEDED");
    expect(calls).toBe(ROLE_MAX_ATTEMPTS + 1);
  });

  it("only TRANSIENT is asked again: permanent, unclassified, incomplete and empty failures get exactly one attempt", async () => {
    for (const error of [new SemanticProviderError("ERR_SEMANTIC_PROVIDER_FAILED", "PERMANENT", 400), new SemanticProviderError("ERR_SEMANTIC_PROVIDER_FAILED", "UNKNOWN"), new SemanticProviderError("ERR_SEMANTIC_PROVIDER_INCOMPLETE", "INCOMPLETE"), new SemanticProviderError("ERR_SEMANTIC_PROVIDER_EMPTY", "EMPTY"), new Error("ERR_PROVIDER_DOWN")]) {
      const w = world(); let calls = 0;
      await run(w, async (request, context) => { if (context?.poolRoleId === "role_a") { calls += 1; throw error; } return answer(request); });
      expect(calls, error.message).toBe(1);
      expect(w.tasks.get("role_a")?.status).toBe("FAILED");
      expect(w.tasks.get("role_a")?.code).not.toBe(TRANSIENT_PROVIDER_CODE);
    }
  });

  it("the confirmed path keeps exactly one call per role (maxAttempts 1): a TRANSIENT failure is not asked again", async () => {
    const w = world(); let calls = 0;
    await run(w, async (request, context) => { if (context?.poolRoleId === "role_a") { calls += 1; throw transient(); } return answer(request); }, { maxAttempts: 1 });
    expect(calls).toBe(1);
    expect(w.tasks.get("role_a")).toMatchObject({ status: "FAILED", code: TRANSIENT_PROVIDER_CODE });
  });

  it("a spent budget during the second attempt stops the run: the role is BUDGET_EXHAUSTED, the rest CANCELLED, no call beyond", async () => {
    const w = world({ units: 1 }); let calls = 0;
    const result = await run(w, async () => { calls += 1; throw transient(); });
    expect(calls).toBe(1);
    expect(w.tasks.get("role_a")?.status).toBe("BUDGET_EXHAUSTED");
    expect(w.tasks.get("role_b")?.status).toBe("CANCELLED");
    expect(result.status).toBe("FAILED");
  });

  it("some pairs refused: the role is SUCCEEDED with ERR_SEMANTIC_OUTPUT_PARTIAL, the refusals are kept, the admitted pairs are in the cache — and a repeat asks only for the refused ones", async () => {
    const w = world(); const asked: number[] = [];
    await run(w, async request => { asked.push((request as { requirements: unknown[] }).requirements.length); return answer(request as never, index => index === 0 && (request as { requirements: unknown[] }).requirements.length === 2); });
    const b = w.tasks.get("role_b");
    expect(b).toMatchObject({ status: "SUCCEEDED", code: PARTIAL_ADMISSION_CODE, stored: 1 });
    expect(JSON.stringify(b?.refusals)).toContain("CLAIM_IN_TEXT");
    const again: number[] = [];
    const w2 = { ...w, tasks: new Map() } as ReturnType<typeof world>;
    await run(w2, async request => { again.push((request as { requirements: unknown[] }).requirements.length); return answer(request as never); });
    expect(asked).toEqual([1, 2]); // role_a: 1 requirement, role_b: 2
    expect(again).toEqual([1]);     // role_a and the admitted pair of role_b are cached; only the refused pair is asked
  });

  it("every pair refused still stores nothing and fails the role", async () => {
    const w = world();
    await run(w, async request => answer(request as never, () => true));
    expect(w.tasks.get("role_a")).toMatchObject({ status: "FAILED", code: "ERR_SEMANTIC_OUTPUT_REFUSED" });
    expect(w.rows.size).toBe(0);
  });

  it("the lease is renewed before every attempt", async () => {
    const w = world(); let touched = 0; let calls = 0;
    await run(w, async (request, context) => { calls += 1; if (calls === 1) throw transient(); return answer(request); }, { touch: async () => { touched += 1; } });
    expect(touched).toBe(calls);
  });
});
