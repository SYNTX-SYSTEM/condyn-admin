import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import { PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument } from "../../../lib/career/capability-core";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET as GET_AUTO_MATCH } from "../../../app/api/career/analyses/[analysisId]/auto-match/route";
import { GET as GET_RANKING } from "../../../app/api/career/analyses/[analysisId]/job-ranking/route";
import { runAutoMatch } from "../../../lib/career/job-pool/auto-match";
import { GEMINI_SEMANTIC_PROMPT, GEMINI_SEMANTIC_TIMEOUT_MS } from "../../../lib/career/job-pool/gemini-semantic-provider";
import { uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** The Gemini semantic path through the REAL shared start, with a mocked SDK: no network, no key of the owner, no model. */
const seen = vi.hoisted(() => ({ options: [] as unknown[], requests: [] as Array<{ model: string; contents: string }> }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(options: unknown) { seen.options.push(options); }
    models = {
      generateContent: async (request: { model: string; contents: string }) => {
        seen.requests.push(request);
        const payload = JSON.parse(request.contents.slice(request.contents.indexOf("\n\n") + 2 + request.contents.slice(request.contents.indexOf("\n\n") + 2).indexOf("{")).replace(/^\s+/, "")) as { proposals: Array<{ id: string; evidence: Array<{ evidenceId: string }> }>; requirements: Array<{ requirementId: string }> };
        const relations = payload.proposals.flatMap(p => payload.requirements.map(r => ({ proposalId: p.id, requirementId: r.requirementId, state: "COVERS", citedEvidenceIds: p.evidence.slice(0, 1).map(e => e.evidenceId), relationExplanation: "The quote names the same technology.", evidenceLimitation: "One sentence only." })));
        return { text: JSON.stringify({ relations }), candidates: [{ finishReason: "STOP" }] };
      }
    };
  }
}));

const KEY = "AIza-owner-like-secret-9876543210";
const DAY = "2099-02-02T00:00:00.000Z";
const params = (analysisId: string) => ({ params: Promise.resolve({ analysisId }) });
const get = async (handler: typeof GET_AUTO_MATCH, analysisId: string) => (await handler(new Request("http://local/x"), params(analysisId))).json();
const setEnv = (o: Record<string, string | undefined>) => { for (const [k, v] of Object.entries(o)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } };

describe("automatic match with the Gemini provider (mocked SDK, PostgreSQL)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: { structured_data: {} } }); }
  };
  const saved = { ...process.env };
  let person: Awaited<ReturnType<typeof produceAnalysis>>;
  beforeAll(async () => {
    await initDbSchema(); await uploadEngineeringJobScope();
    person = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("amg")])), null, "amg", createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (amg-${Date.now()})` }), "Gemini Path Group");
  });
  beforeEach(() => { seen.options.length = 0; seen.requests.length = 0; });
  afterAll(async () => {
    for (const k of ["ROLE_DISCOVERY_SEMANTIC_PROVIDER", "ROLE_DISCOVERY_DAY_LIMIT", "ROLE_DISCOVERY_MAX_ROLES", "ROLE_DISCOVERY_GEMINI_MODEL", "GEMINI_API_KEY"]) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    for (const jobId of created) { await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`); await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`); }
  });

  it("the shared start uses the configured provider: Gemini calls, one per role, labelled REAL_GEMINI; the key stays out of every stored row", async () => {
    setEnv({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "gemini", ROLE_DISCOVERY_DAY_LIMIT: "50", ROLE_DISCOVERY_MAX_ROLES: "3", ROLE_DISCOVERY_GEMINI_MODEL: "gemini-mock-model", GEMINI_API_KEY: KEY });
    const out = await runAutoMatch(person.analysisId, () => DAY);
    expect(out.outcome).toBe("STARTED");
    const view = (await get(GET_AUTO_MATCH, person.analysisId)).autoMatch;
    expect(view).toMatchObject({ state: "PARTIAL", reason: "ROLES_BEYOND_BUDGET", evidenceClass: "REAL_GEMINI" });
    expect(view.budget).toMatchObject({ rolesPlanned: 3, rolesEvaluated: 3 });
    expect(seen.requests).toHaveLength(3);
    expect(seen.requests.every(r => r.model === "gemini-mock-model" && r.contents.startsWith(GEMINI_SEMANTIC_PROMPT))).toBe(true);
    expect(seen.options.every(o => (o as { httpOptions?: { timeout?: number } }).httpOptions?.timeout === GEMINI_SEMANTIC_TIMEOUT_MS)).toBe(true);
    // no role, organisation or pool text reaches the provider (spec C-1)
    expect(seen.requests.some(r => /pool_|org_|role_|JPOOL_/.test(r.contents.slice(GEMINI_SEMANTIC_PROMPT.length)))).toBe(false);
    const rank = (await get(GET_RANKING, person.analysisId)).ranking;
    expect(rank.evidenceClass).toBe("REAL_GEMINI");
    expect(rank.ranks.filter((r: { tier: string }) => r.tier === "SEMANTIC")).toHaveLength(3);
    expect(rank.ranks[0].requirements.every((q: { state: string }) => q.state === "COVERS")).toBe(true);
    for (const table of ["career_proposal_requirement_relations", "career_relation_investigations", "career_relation_role_tasks", "career_relation_call_ledger"]) {
      const text = JSON.stringify(await db.execute(sql.raw(`SELECT * FROM ${table}`)));
      expect(text.includes(KEY), table).toBe(false);
    }
  });

  it("the ranking keeps reading the Gemini run after the provider is switched away", async () => {
    setEnv({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: undefined, GEMINI_API_KEY: undefined });
    const rank = (await get(GET_RANKING, person.analysisId)).ranking;
    expect([rank.evidenceClass, rank.ranks.filter((r: { tier: string }) => r.tier === "SEMANTIC").length]).toEqual(["REAL_GEMINI", 3]);
  });

  it("a repeat makes no further Gemini call", async () => {
    setEnv({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "gemini", ROLE_DISCOVERY_DAY_LIMIT: "50", ROLE_DISCOVERY_MAX_ROLES: "3", GEMINI_API_KEY: KEY, ROLE_DISCOVERY_GEMINI_MODEL: "gemini-mock-model" });
    await runAutoMatch(person.analysisId, () => DAY);
    expect(seen.requests).toHaveLength(0);
  });
});
