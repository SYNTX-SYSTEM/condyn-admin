import { describe, expect, it } from "vitest";
import { fetchJobPoolMatches, JOB_POOL_ACTOR_HEADER, listJobPools, readJobPoolUpload, uploadJobPool } from "../../../lib/career/ui/useJobPool";
import { matches, summary, UPLOAD_ID, view } from "./fixtures/match-bodies";

/** Pure client reads over a scripted fetch: no network, no database, no DOM. */
const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
type Route = (init?: RequestInit) => Response | Promise<Response>;
const script = (routes: Record<string, Route>): typeof fetch => async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const key = `${init?.method ?? "GET"} ${url}`;
  const route = routes[key];
  if (!route) throw new Error(`unscripted ${key}`);
  return route(init);
};
const notProvisioned = () => json(503, { error: { code: "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", message: "no verified disposable database" } });

describe("Job Pool client reads", () => {
  it("lists uploads as AVAILABLE, EMPTY, NOT_PROVISIONED or FAILED and never selects one", async () => {
    expect(await listJobPools(script({ "GET /api/career/job-pools": () => json(200, { jobPools: [summary] }) }))).toEqual({ state: "AVAILABLE", jobPools: [summary] });
    expect(await listJobPools(script({ "GET /api/career/job-pools": () => json(200, { jobPools: [] }) }))).toEqual({ state: "EMPTY" });
    expect(await listJobPools(script({ "GET /api/career/job-pools": notProvisioned }))).toEqual({ state: "NOT_PROVISIONED" });
    expect(await listJobPools(script({ "GET /api/career/job-pools": () => json(200, { jobPools: [{ ...summary, poolStatus: "LIVE" }] }) }))).toEqual({ state: "FAILED", code: null, message: null });
    expect(await listJobPools(script({ "GET /api/career/job-pools": () => json(500, { error: { code: "ERR_X", message: "boom" } }) }))).toEqual({ state: "FAILED", code: "ERR_X", message: "boom" });
    expect(await listJobPools(script({}))).toEqual({ state: "FAILED", code: null, message: null });
  });

  it("sends the file bytes unchanged with the self-declared actor header and distinguishes 201, 200, 4xx, 503", async () => {
    const seen: RequestInit[] = [];
    const created = script({ "POST /api/career/job-pools": init => { seen.push(init!); return json(201, view); } });
    expect(await uploadJobPool('{"pool": 1}', " TESTER ", created)).toEqual({ state: "CREATED", upload: view });
    expect(seen[0].body).toBe('{"pool": 1}');
    expect((seen[0].headers as Record<string, string>)[JOB_POOL_ACTOR_HEADER]).toBe("TESTER");
    expect((seen[0].headers as Record<string, string>)["content-type"]).toBe("application/json");
    expect(await uploadJobPool("{}", "", script({ "POST /api/career/job-pools": () => json(200, view) }))).toEqual({ state: "IDENTICAL_EXISTS", upload: view });
    expect(await uploadJobPool("{", "", script({ "POST /api/career/job-pools": () => json(400, { error: { code: "ERR_JOB_POOL_JSON_INVALID", message: "bad json" } }) }))).toEqual({ state: "REJECTED", status: 400, code: "ERR_JOB_POOL_JSON_INVALID", message: "bad json", issues: [] });
    expect(await uploadJobPool("{}", "", script({ "POST /api/career/job-pools": () => json(422, { error: { code: "ERR_JOB_POOL_SCHEMA_INVALID", message: "schema", issues: [{ path: "roles", message: "required" }] } }) }))).toEqual({ state: "REJECTED", status: 422, code: "ERR_JOB_POOL_SCHEMA_INVALID", message: "schema", issues: [{ path: "roles", message: "required" }] });
    expect(await uploadJobPool("{}", "", script({ "POST /api/career/job-pools": () => json(413, { error: { code: "ERR_JOB_POOL_TOO_LARGE", message: "big" } }) }))).toEqual({ state: "REJECTED", status: 413, code: "ERR_JOB_POOL_TOO_LARGE", message: "big", issues: [] });
    expect(await uploadJobPool("{}", "", script({ "POST /api/career/job-pools": notProvisioned }))).toEqual({ state: "NOT_PROVISIONED" });
    expect(await uploadJobPool("{}", "", script({ "POST /api/career/job-pools": () => json(201, { ...view, canonicalMapping: null }) }))).toEqual({ state: "FAILED", code: null });
  });

  it("reads one exact upload as AVAILABLE, NOT_FOUND, NOT_PROVISIONED or FAILED", async () => {
    expect(await readJobPoolUpload(UPLOAD_ID, script({ [`GET /api/career/job-pools/${UPLOAD_ID}`]: () => json(200, view) }))).toEqual({ state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, upload: view });
    expect(await readJobPoolUpload("JPOOL_absent", script({ "GET /api/career/job-pools/JPOOL_absent": () => json(404, { error: { code: "ERR_JOB_POOL_NOT_FOUND", message: "m" } }) }))).toEqual({ state: "NOT_FOUND", jobPoolUploadId: "JPOOL_absent" });
    expect(await readJobPoolUpload(UPLOAD_ID, script({ [`GET /api/career/job-pools/${UPLOAD_ID}`]: notProvisioned }))).toEqual({ state: "NOT_PROVISIONED", jobPoolUploadId: UPLOAD_ID });
    expect(await readJobPoolUpload(UPLOAD_ID, script({}))).toEqual({ state: "FAILED", jobPoolUploadId: UPLOAD_ID, code: null });
  });

  it("reads matches for one exact pool and one exact analysis, refusing a body for another pair", async () => {
    const url = `GET /api/career/job-pools/${UPLOAD_ID}/matches?analysisId=ANL_TEST`;
    expect(await fetchJobPoolMatches(UPLOAD_ID, "ANL_TEST", script({ [url]: () => json(200, matches) }))).toEqual({ state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", matches });
    expect(await fetchJobPoolMatches(UPLOAD_ID, "ANL_TEST", script({ [url]: () => json(200, { ...matches, analysisId: "ANL_OTHER" }) }))).toEqual({ state: "FAILED", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", code: null });
    expect(await fetchJobPoolMatches(UPLOAD_ID, "ANL_TEST", script({ [url]: () => json(404, { error: { code: "ERR_ANALYSIS_NOT_FOUND", message: "no analysis" } }) }))).toEqual({ state: "NOT_FOUND", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", code: "ERR_ANALYSIS_NOT_FOUND", message: "no analysis" });
    expect(await fetchJobPoolMatches(UPLOAD_ID, "ANL_TEST", script({ [url]: () => json(409, { error: { code: "ERR_INACTIVE_COMPANY_POOL", message: "DRAFT" } }) }))).toEqual({ state: "INACTIVE_POOL", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", message: "DRAFT" });
    expect(await fetchJobPoolMatches(UPLOAD_ID, "ANL_TEST", script({ [url]: notProvisioned }))).toEqual({ state: "NOT_PROVISIONED", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST" });
    expect(await fetchJobPoolMatches("JP OOL", "AN L", script({ "GET /api/career/job-pools/JP%20OOL/matches?analysisId=AN%20L": () => json(500, { error: { code: "ERR_I", message: "m" } }) }))).toEqual({ state: "FAILED", jobPoolUploadId: "JP OOL", analysisId: "AN L", code: "ERR_I" });
  });
});
