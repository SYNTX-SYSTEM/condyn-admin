// LIVE GEMINI VALIDATION (owner "SFE — GELB | LIVE GEMINI VALIDATION GO", 2026-10-19): after the walk and BEFORE the lab is stopped
// (stopping drops its database), read what the live run recorded through the existing read routes only — the analyses, their
// investigation boundary, the GEMINI OUTPUT inspection (original Discovery response, parser result, evidence verification,
// convergence, projection), B2 and every archived exchange of the analysis jobs, accepted or rejected.
//
//   node live-extract.mjs <lab state.json> <walk-results.json> <private out dir>
//
// Writes one JSON per read into the private out dir with mode 0600. The out dir must lie OUTSIDE the repository: it holds the raw
// model responses; what is published is the summary written from it (live-summarize.mjs). The inspector token is never written.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [STATE, WALK, OUT] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8"));
const walk = JSON.parse(readFileSync(WALK, "utf8"));
const POOL = "JPOOL_B94850C439974E27496FE3B1A9A076B5", ROLE = "role_kestrel_fullstack";
mkdirSync(OUT, { recursive: true, mode: 0o700 });
const reads = [];
const get = async (name, path, inspector = false) => {
  const response = await fetch(`${st.base}${path}`, { headers: inspector ? { "x-condyn-result-inspector-token": st.token } : {} });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = { nonJson: text.slice(0, 500) }; }
  const file = resolve(OUT, `${name}.json`);
  writeFileSync(file, JSON.stringify({ path, status: response.status, body }, null, 2), { mode: 0o600 }); chmodSync(file, 0o600);
  reads.push({ name, path, status: response.status });
  return body;
};
const jobs = new Set();
const collectJobs = value => { for (const m of JSON.stringify(value).matchAll(/"(JOB_[0-9]+_[0-9]+)"/g)) jobs.add(m[1]); };
for (const [label, id] of [["person", walk.personAnalysis], ["pxj", walk.pxjAnalysis]]) {
  if (!id) { reads.push({ name: label, missing: true }); continue; }
  collectJobs(await get(`${label}-analysis`, `/api/career/analyses/${id}`));
  collectJobs(await get(`${label}-investigation`, `/api/career/analyses/${id}/investigation`));
  collectJobs(await get(`${label}-gemini-result`, `/api/career/analyses/${id}/gemini-result`, true));
  await get(`${label}-b2`, `/api/career/analyses/${id}/job-comparison?jobPoolUploadId=${POOL}&poolRoleId=${ROLE}`);
}
for (const job of jobs) await get(`exchanges-${job}`, `/api/career/jobs/${job}/gemini-exchanges`, true);
writeFileSync(resolve(OUT, "reads.json"), JSON.stringify({ reads, jobs: [...jobs] }, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ reads, jobs: [...jobs] }));
