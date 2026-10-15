import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import {
  PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository
} from "../../../lib/career/capability-core";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { RESULT_INSPECTOR_HEADER } from "../../../lib/career/result-inspector";
import { GET } from "../../../app/api/career/analyses/[analysisId]/gemini-result/route";
import { resolveTestJobScope } from "../../support/job-scope";
import { PDF_MARKER, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "./fixture";

/** Result Inspector on PostgreSQL: the route is closed by default and reads only persisted phases. */
const TOKEN = "inspector-test-token-0123456789abcdef";
const get = (analysisId: string, header?: string) =>
  GET(new Request(`http://local/api/career/analyses/${analysisId}/gemini-result`, { headers: header === undefined ? {} : { [RESULT_INSPECTOR_HEADER]: header } }), { params: Promise.resolve({ analysisId }) });

describe("Gemini Result Inspector (PostgreSQL, no Gemini)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: {} }); }
  };
  let analysisId = "";
  let text = "";
  let client: ReturnType<typeof fakeGeminiClient>;

  beforeAll(async () => {
    await initDbSchema();
    text = geminiText(`pg-${Date.now()}`);
    client = fakeGeminiClient([text]);
    analysisId = (await produceAnalysis(world, geminiProvider(client), resolveTestJobScope(), "pg")).analysisId;
  });
  // The fixture jobs are PENDING rows of the shared test queue: remove exactly them so no later suite claims one.
  afterAll(async () => {
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
  });
  afterEach(() => { delete process.env.CONDYN_RESULT_INSPECTOR; delete process.env.CONDYN_RESULT_INSPECTOR_TOKEN; });

  it("is a 404 while switched off, misconfigured or without the right token", async () => {
    for (const [flag, token, header] of [[undefined, undefined, TOKEN], ["1", undefined, TOKEN], ["1", TOKEN, undefined], ["1", TOKEN, "wrong"]] as const) {
      if (flag) process.env.CONDYN_RESULT_INSPECTOR = flag; else delete process.env.CONDYN_RESULT_INSPECTOR;
      if (token) process.env.CONDYN_RESULT_INSPECTOR_TOKEN = token; else delete process.env.CONDYN_RESULT_INSPECTOR_TOKEN;
      const response = await get(analysisId, header);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ success: false, issues: [{ code: "ERR_NOT_FOUND" }] });
    }
  });

  it("returns the persisted phases, no-store, without calling Gemini; the run row never holds the received text", async () => {
    process.env.CONDYN_RESULT_INSPECTOR = "1";
    process.env.CONDYN_RESULT_INSPECTOR_TOKEN = TOKEN;
    const response = await get(analysisId, TOKEN);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const raw = await response.text();
    const { inspection } = JSON.parse(raw);
    expect(Object.keys(inspection)).toEqual(["inspectionVersion", "analysisId", "jobId", "investigationInput", "originalGeminiResponse", "parserResult", "evidenceVerification", "convergence", "projection"]);
    // No exchange archive is wired in the route (its table awaits owner approval): nothing is retained, nothing reconstructed.
    expect(inspection.originalGeminiResponse).toEqual({ state: "NOT_RETAINED" });
    expect(inspection.investigationInput.investigationScope.state).toBe("NOT_RETAINED");
    expect(inspection.parserResult.kernelOutput).toEqual(JSON.parse(text));
    expect(raw).not.toContain(PDF_MARKER);
    expect(raw).not.toContain(text);
    expect(client.requests).toHaveLength(1);
    const rows = await db.execute(sql`SELECT payload::text AS payload FROM career_capability_runs WHERE run_id = ${inspection.investigationInput.discoveryRunId}`) as unknown as Array<{ payload: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].payload).not.toContain("resp-1");
    expect(rows[0].payload).not.toContain("providerResponse");
    expect((await get("ANL_does_not_exist", TOKEN)).status).toBe(404);
  });
});
