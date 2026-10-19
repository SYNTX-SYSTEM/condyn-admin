// LIVE GEMINI VALIDATION: the publishable summary of what live-extract.mjs read (owner "SFE — GELB | LIVE GEMINI VALIDATION GO").
//   node live-summarize.mjs <private out dir> <summary.json>
// Keeps per analysis: boundary, the received Discovery envelope (model version, response id, finish reason, token usage, text
// length and SHA-256 — not the raw text), every capability the model proposed with its quotes, the validator's verdict per claim,
// convergence, the projection, the legacy analysis' capability names, B2 per requirement and every archived exchange's outcome.
// The quotes come from the synthetic CV (docs/examples/cv.synthetic.pdf). No token, no key, no prompt.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [DIR, OUT] = process.argv.slice(2);
const read = name => { try { return JSON.parse(readFileSync(resolve(DIR, `${name}.json`), "utf8")); } catch { return null; } };
const analysis = label => {
  const inspection = read(`${label}-gemini-result`), record = read(`${label}-analysis`), b2 = read(`${label}-b2`), boundary = read(`${label}-investigation`);
  const i = inspection?.body?.inspection, original = i?.originalGeminiResponse;
  const legacy = record?.body?.analysis?.structured_data?.analysis;
  return {
    analysisId: i?.analysisId ?? record?.body?.analysisId ?? null, jobId: i?.jobId ?? null,
    httpStatus: { analysis: record?.status, investigation: boundary?.status, geminiResult: inspection?.status, b2: b2?.status },
    analysisStatus: record?.body?.status ?? null,
    investigation: boundary?.body ?? null,
    input: i ? { mode: i.investigationInput.investigationMode, jobScopeSelection: i.investigationInput.jobScopeSelection ?? null, scopeState: i.investigationInput.investigationScope?.state, scopeTextMatchesHash: i.investigationInput.investigationScope?.textMatchesScopeHash ?? null, scopeTextLength: i.investigationInput.investigationScope?.text?.length ?? null, inference: i.investigationInput.inference, kernel: i.investigationInput.kernel?.kernelVersion, discoveryRunId: i.investigationInput.discoveryRunId, reused: i.investigationInput.discoveryRunCreatedAt < i.investigationInput.jobCreatedAt } : null,
    discoveryResponse: original ? { state: original.state, modelVersion: original.modelVersion, responseId: original.responseId, finishReason: original.finishReason, usageMetadata: original.usageMetadata, textLength: original.text?.length ?? null, textSha256: original.textSha256, textMatchesSha256: original.textMatchesSha256, parserResultMatchesText: original.parserResultMatchesText } : null,
    proposedByModel: (i?.parserResult?.kernelOutput?.capabilities ?? []).map(c => ({ name: c.canonical_name, scope: c.capability_scope, domain: c.primary_domain, level: c.demonstrated_capability_level, confidence: c.model_confidence, evidenceMode: c.evidence_mode, quotes: (c.evidence ?? []).map(e => e.exact_quote) })),
    coverageAudit: i?.parserResult?.kernelOutput?.coverage_audit ?? null,
    verification: (i?.evidenceVerification?.candidates ?? []).map(c => ({ name: c.proposedCanonicalName, status: c.status, claims: (c.evidenceClaims ?? []).map(e => ({ quote: e.exactQuote, verdict: e.verification?.status, matchedDocId: e.verification?.matchedDocId ?? null })) })),
    convergence: i?.convergence ? { runId: i.convergence.convergenceRunId, reconciliation: i.convergence.payload?.reconciliation?.status ?? null, drafts: (i.convergence.payload?.canonicalDrafts ?? []).map(d => ({ name: d.canonicalName, scope: d.scope, members: d.provenance?.sourceCandidateIds?.length ?? 0 })), relations: (i.convergence.payload?.relations ?? []).length, excluded: i.convergence.payload?.excludedCandidates ?? i.convergence.payload?.excluded ?? null } : null,
    projection: (record?.body?.capabilityProposalProjection?.capabilities ?? []).map(c => ({ name: c.name, scope: c.scope, domain: c.domain, evidenceState: c.evidenceState, quotes: (c.evidence ?? []).map(e => e.exactQuote) })),
    legacyAnalysis: legacy ? { capabilities: (legacy.capabilities ?? []).map(c => ({ name: c.identity?.name ?? c.name ?? c.entity_id ?? null, confidence: c.confidence ?? null, validation: c.validation?.status ?? null, quotes: (c.evidence ?? []).map(e => e.context_quote) })), counts: Object.fromEntries(Object.entries(legacy).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length])) } : null,
    b2: b2?.body?.comparison ? { counts: b2.body.comparison.counts, authority: b2.body.comparison.authority, requirements: b2.body.comparison.requirements.map(r => ({ id: r.poolRequirementId, capability: r.capabilityName, coverage: r.coverage?.state, matchBasis: r.coverage?.proposal?.matchBasis ?? null, proposal: r.coverage?.proposal?.name ?? null, quotes: (r.coverage?.proposal?.evidence ?? []).map(e => e.quote) })) } : (b2?.body ?? null)
  };
};
const exchanges = readdirSync(DIR).filter(f => f.startsWith("exchanges-")).map(f => JSON.parse(readFileSync(resolve(DIR, f), "utf8"))).map(x => ({ jobId: x.body?.inspection?.jobId, archive: x.body?.archive, exchanges: (x.body?.inspection?.exchanges ?? []).map(e => ({ runId: e.runId, outcome: e.outcome, errorCode: e.errorCode, attempt: e.attempt, model: e.request?.model, scopeBlock: e.investigationScope?.text ? true : false, responseId: e.response?.responseId ?? null, finishReason: e.response?.finishReason ?? null, textLength: e.response?.text?.length ?? null, textSha256: e.response?.textSha256 ?? null, textMatchesSha256: e.textMatchesSha256 })) }));
const summary = { summaryVersion: "LIVE_GEMINI_VALIDATION_SUMMARY_V1", person: analysis("person"), personXJob: analysis("pxj"), exchanges };
writeFileSync(OUT, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ person: { proposed: summary.person.proposedByModel.length, verification: summary.person.verification.map(v => v.status), projection: summary.person.projection.length }, pxj: { proposed: summary.personXJob.proposedByModel.length, projection: summary.personXJob.projection.length, b2: summary.personXJob.b2?.counts }, exchanges: exchanges.map(x => x.exchanges.map(e => e.outcome)) }));
