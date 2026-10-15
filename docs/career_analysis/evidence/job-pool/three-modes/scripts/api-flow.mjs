import { readFileSync } from "node:fs";
const [STATE] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8"));
const cv = readFileSync("/home/codi/Entwicklung/condyn-admin-job-field/test/gold/case_001_minimal_valid/input/doc1.md", "utf8");
const docs = [{ type: "text", title: "elena-rostova.md", content: cv, docId: "doc_cv" }];
const post = async body => { const r = await fetch(`${st.base}/api/career/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; };
const wait = async jobId => { for (let i = 0; i < 120; i++) { const j = await (await fetch(`${st.base}/api/career/jobs/${jobId}`)).json(); if (j.status === "SUCCEEDED" || j.status === "FAILED") return j; await new Promise(r => setTimeout(r, 1000)); } return null; };
const scope = { jobPoolUploadId: st.validationUploadId, poolRoleId: "role_pink_alpha_architect" };
const person = await post({ documents: docs, investigation: { mode: "PERSON" } });
console.log("PERSON", person.status, person.body.jobId);
const pj = await post({ documents: docs, investigation: { mode: "PERSON_X_JOB" }, jobScope: scope });
console.log("PXJ", pj.status, pj.body.jobId);
for (const [label, r] of [["PERSON", person], ["PXJ", pj]]) {
  const j = await wait(r.body.jobId);
  console.log(label, j?.status, j?.resultAnalysisId, j?.errorCode, (j?.errorSummary ?? "").slice(0, 200));
  if (j?.status !== "SUCCEEDED") continue;
  const b2 = await fetch(`${st.base}/api/career/analyses/${j.resultAnalysisId}/job-comparison?jobPoolUploadId=${scope.jobPoolUploadId}&poolRoleId=${scope.poolRoleId}`);
  const b2b = await b2.json();
  console.log(label, "B2", b2.status, b2b.issues?.[0]?.code ?? JSON.stringify(b2b.comparison?.counts), (b2b.comparison?.requirements ?? []).map(x => `${x.capabilityName}:${x.coverage.state}${x.coverage.proposal ? "/" + x.coverage.proposal.matchBasis : ""}`).join(", "));
  const ins = await fetch(`${st.base}/api/career/analyses/${j.resultAnalysisId}/gemini-result`, { headers: { "x-condyn-result-inspector-token": st.token } });
  const insb = await ins.json();
  console.log(label, "INSPECTOR", ins.status, insb.inspection?.investigationInput?.investigationMode, insb.inspection?.investigationInput?.investigationScope?.state, insb.inspection?.originalGeminiResponse?.state, insb.inspection?.originalGeminiResponse?.textMatchesSha256, insb.inspection?.originalGeminiResponse?.parserResultMatchesText, (insb.inspection?.evidenceVerification?.candidates ?? []).length);
}
const nokey = await fetch(`${st.base}/api/career/analyses/x/gemini-result`); console.log("inspector without token", nokey.status);
const struct = await fetch(`${st.base}/api/career/job-pools/${st.engineeringUploadId}/roles/role_kestrel_frontend_architect/structure`); const sb = await struct.json();
console.log("STRUCTURE", struct.status, sb.structure?.role?.title, JSON.stringify(sb.structure?.counts), sb.issues?.[0]?.code);
