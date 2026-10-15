/* Phase B (DERIVED from the REAL runs): file ⇄ API ⇄ analysis ⇄ PDF text, inverse. Per pool × analysis. */
import { readFileSync, writeFileSync } from "node:fs";
import { DIR, rec, getJson } from "./common.mjs";
const A = JSON.parse(readFileSync(`${DIR}/state-A.json`, "utf8"));
const norm = s => s.replace(/[‐-―]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
const TEXT = { ENG: norm(readFileSync(`${DIR}/cv-eng.txt`, "utf8")), AI: norm(readFileSync(`${DIR}/cv-ai.txt`, "utf8")) };
const summary = [];
for (const [poolName, uploadId] of Object.entries(A.uploads)) {
  const file = JSON.parse(readFileSync(`/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/job-pool-tests/${poolName}.json`, "utf8"));
  const pool = await getJson(`/api/career/job-pools/${uploadId}`);
  const p = pool.body;
  rec(4, `B4.${poolName} counts file = API (orgs/roles/requirements)`, p.organizationCount === file.organizations.length && p.roleCount === file.roles.length && p.requirementCount === file.requirements.length, `${p.organizationCount}/${p.roleCount}/${p.requirementCount} vs ${file.organizations.length}/${file.roles.length}/${file.requirements.length}`, "DERIVED");
  const sameIds = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  rec(4, `B4.${poolName} ids and relations file = API (role→org, requirement→role)`, sameIds(p.pool.roles.map(r => `${r.id}>${r.organization_id}`), file.roles.map(r => `${r.id}>${r.organization_id}`)) && sameIds(p.pool.requirements.map(r => `${r.id}>${r.role_id}`), file.requirements.map(r => `${r.id}>${r.role_id}`)) && sameIds(p.pool.organizations.map(o => o.id), file.organizations.map(o => o.id)), "", "DERIVED");
  for (const [key, a] of Object.entries(A.analyses)) {
    const m = (await getJson(`/api/career/job-pools/${uploadId}/matches?analysisId=${a.analysisId}`));
    const b = m.body; const tag = `${poolName}×${key}`;
    if (m.status !== 200) { rec(5, `B5.${tag} matches readable`, false, { status: m.status, body: JSON.stringify(b).slice(0, 200) }, "DERIVED"); continue; }
    const reqOf = new Map(); for (const r of file.requirements) { if (!reqOf.has(r.role_id)) reqOf.set(r.role_id, []); reqOf.get(r.role_id).push(r.id); }
    const partitionBad = b.roleMatches.filter(r => !sameIds([...r.matched, ...r.weakEvidence, ...r.missing].map(x => x.poolRequirementId), reqOf.get(r.poolRoleId) ?? []));
    rec(5, `B5.${tag} every role partitions exactly into matched / weak / missing`, b.roleMatches.length === file.roles.length && partitionBad.length === 0, { roles: b.roleMatches.length, bad: partitionBad.map(r => r.poolRoleId) }, "DERIVED");
    const roleOrgBad = b.roleMatches.filter(r => file.roles.find(x => x.id === r.poolRoleId)?.organization_id !== r.poolOrganizationId);
    rec(4, `B4.${tag} role→organization in matches = file`, roleOrgBad.length === 0, roleOrgBad.map(r => r.poolRoleId), "DERIVED");
    const ev = b.roleMatches.flatMap(r => [...r.matched, ...r.weakEvidence].flatMap(x => [...x.evidence.map(e => ({ ...e, req: x.poolRequirementId, scored: true })), ...(x.sweepProposal?.evidence ?? []).map(e => ({ ...e, req: x.poolRequirementId, scored: false }))]));
    const sweepOnMissing = b.roleMatches.flatMap(r => r.missing.filter(x => x.sweepProposal).flatMap(x => x.sweepProposal.evidence.map(e => ({ ...e, req: x.poolRequirementId, scored: false }))));
    const allEv = [...ev, ...sweepOnMissing];
    const notVerbatim = allEv.filter(e => !TEXT[key].includes(norm(e.quote)));
    rec(5, `B5.${tag} every evidence quote is verbatim in the analysed PDF (inverse to the document)`, notVerbatim.length === 0, { quotes: allEv.length, notVerbatim: notVerbatim.slice(0, 3).map(e => `${e.req}: ${e.quote.slice(0, 70)}`) }, "DERIVED");
    const weakBad = b.roleMatches.flatMap(r => r.weakEvidence).filter(x => !(x.reason && (x.matchBasis === "TOKEN_CONTAINMENT" || x.confidence < b.presentation.weakEvidenceThreshold)));
    rec(5, `B5.${tag} weak evidence is below threshold or token containment, with reason`, weakBad.length === 0, { weak: b.roleMatches.reduce((s, r) => s + r.weakEvidence.length, 0), bad: weakBad.length }, "DERIVED");
    const scores = b.roleMatches.map(r => r.resonanceScore);
    rec(5, `B5.${tag} resonanceScore in [0,1], roles ordered as delivered (descending)`, scores.every(s => s >= 0 && s <= 1) && scores.every((s, i) => i === 0 || scores[i - 1] >= s), scores.slice(0, 6), "DERIVED");
    const missingWithScore = b.roleMatches.flatMap(r => r.missing).filter(x => "contribution" in x || "confidence" in x);
    rec(5, `B5.${tag} missing requirements carry no score or contribution (neutral)`, missingWithScore.length === 0, missingWithScore.length, "DERIVED");
    const sweepScored = JSON.stringify(b).includes('"scored":true');
    rec(7, `B7.${tag} governance: authority NONE, no canonical evaluation, no decision, sweep never scored`, b.presentation.authorityState === "NONE" && b.presentation.canonicalEvaluation === false && b.presentation.decision === false && !sweepScored && b.roleMatches.every(r => r.canonical.capabilityRequirementRelationState === "NOT_EVALUATED"), { sweepState: b.capabilitySweep.state, proposals: b.capabilitySweep.proposalCount }, "DERIVED");
    const projection = (await getJson(`/api/career/analyses/${a.analysisId}`)).body.capabilityProposalProjection;
    rec(7, `B7.${tag} sweep proposal count = analysis projection capabilities`, b.capabilitySweep.proposalCount === projection.capabilities.length, `${b.capabilitySweep.proposalCount} vs ${projection.capabilities.length}`, "DERIVED");
    // plausibility: missing requirements whose name (or an alias) appears literally in the CV text
    const fileReq = new Map(file.requirements.map(r => [r.id, r]));
    const literal = b.roleMatches.flatMap(r => r.missing.map(x => fileReq.get(x.poolRequirementId))).filter(r => r && ["CAPABILITY", "TOOL_TECHNOLOGY", "KNOWLEDGE"].includes(r.requirement_type) && [r.capability_name, ...(r.aliases ?? [])].some(n => n.length > 2 && new RegExp(`(^|[^a-z0-9])${norm(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(TEXT[key])));
    const sweepCovered = literal.filter(r => b.roleMatches.flatMap(x => x.missing).find(x => x.poolRequirementId === r.id)?.sweepProposal);
    const totals = { matched: b.roleMatches.reduce((s, r) => s + r.matched.length, 0), weak: b.roleMatches.reduce((s, r) => s + r.weakEvidence.length, 0), missing: b.roleMatches.reduce((s, r) => s + r.missing.length, 0), candidateCapabilityCount: b.candidateCapabilityCount, sweepProposals: b.capabilitySweep.proposalCount, sweepOnlyCoverage: b.roleMatches.reduce((s, r) => s + r.sweepOnlyCoverageCount, 0) };
    summary.push({ tag, ...totals, missingButLiteralInCv: literal.length, ofThoseSweepCovered: sweepCovered.length, examples: [...new Set(literal.map(r => r.capability_name))].slice(0, 12) });
    rec(5, `B5.${tag} plausibility: missing requirements whose name/alias appears literally in the CV`, literal.length === 0 ? true : "FINDING", { ...totals, missingButLiteralInCv: literal.length, ofThoseSweepCovered: sweepCovered.length, examples: [...new Set(literal.map(r => r.capability_name))].slice(0, 10) }, "DERIVED");
  }
}
writeFileSync(`${DIR}/phaseB-summary.json`, JSON.stringify(summary, null, 2));
