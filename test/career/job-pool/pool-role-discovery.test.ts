import { describe, expect, it } from "vitest";
import { POOL_ROLE_DISCOVERY_AUTHORITY, ROLE_LEXICAL_STATUSES, buildPoolRoleDiscovery, quoteNamesRequirement, type DiscoveryPoolInput } from "../../../lib/career/job-pool/pool-role-discovery";

/** POOL_ROLE_DISCOVERY_V1 contract (owner D-RD-1 = B, D-RD-4 = A): lexical only, explicit pools, no score, no ranking, deterministic. */
const evidence = (id: string, quote: string) => ({ evidenceId: id, sourceDocumentId: "DOC_001", exactQuote: quote, verificationState: "SOURCE_MATCH_VERIFIED" as const });
const proposal = (id: string, name: string, quote: string, scope: "ATOMIC" | "COMPOSITE" = "ATOMIC") => ({
  id, name, domain: null, scope, structuralDefinition: "", evidenceState: "EVIDENCE_PASSED" as const, semanticDefinitionState: "NOT_RUN" as const, authorityState: "NONE" as const,
  sourceCandidateIds: [], sourceDocumentIds: ["DOC_001"], evidence: [evidence(`E_${id}`, quote)]
});
const PROJECTION = { capabilities: [
  proposal("P_TS_NODE", "TypeScript and Node.js Backend Development", "Built services in TypeScript and Node.js.", "COMPOSITE"),
  proposal("P_PY", "Python ETL Development", "Wrote ETL jobs."),
  proposal("P_K8S", "Kubernetes", "Ran Kubernetes clusters.")
] };
const org = (id: string, name: string) => ({ id, pool_id: "p", org_id: id, name, country_iso: "DE", region: "", industry: "", scale: "", description: "" });
const role = (id: string, organization: string, title: string) => ({ id, pool_id: "p", organization_id: organization, title, seniority: "", domain_focus: "", description: "" });
const req = (id: string, roleId: string, name: string, extra: Record<string, unknown> = {}) => ({ id, role_id: roleId, capability_name: name, domain: "", weight: 0.5, required_level: "L3", ...extra });
const mapping = (roles: Array<{ id: string; reqs: string[] }>) => ({ roles: roles.map(r => ({ poolRoleId: r.id, requirements: r.reqs.map(q => ({ poolRequirementId: q, capabilityName: q, targetRequirementEntityId: `E_${q}`, targetRequirementRevisionId: `TRREV_${r.id}_${q}`, targetRequirementReconstructionResultId: "", targetRequirementEntityAdmissionId: "", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY" as const, necessityState: "REQUIRED" as const })) })) }) as unknown as DiscoveryPoolInput["canonicalMapping"];
const upload = (jobPoolUploadId: string, poolName: string, organizations: ReturnType<typeof org>[], roles: ReturnType<typeof role>[], requirements: ReturnType<typeof req>[]): DiscoveryPoolInput => ({
  jobPoolUploadId, poolId: `pool_${jobPoolUploadId}`, poolVersion: 1, poolName, poolStatus: "ACTIVE", canonicalSha256: `sha_${jobPoolUploadId}`,
  pool: { pool: { id: "p", name: poolName, description: "", version: 1, status: "ACTIVE", created_at: "2026-10-24T00:00:00.000Z" }, organizations, roles, requirements, search_queries: [] } as unknown as DiscoveryPoolInput["pool"],
  canonicalMapping: mapping(roles.map(r => ({ id: r.id, reqs: requirements.filter(q => q.role_id === r.id).map(q => q.id) })))
});
// Pool B is listed first on purpose: the result orders by pool name, not by request order.
const POOL_B = upload("JPOOL_B", "Zeta Pool", [org("org_k", "Kestrel")], [role("role_fs", "org_k", "Full-Stack Engineer")], [req("req_01", "role_fs", "TypeScript")]);
const POOL_A = upload("JPOOL_A", "Alpha Pool", [org("org_k", "Kestrel"), org("org_b", "Brightwater")], [
  role("role_fs", "org_k", "Full-Stack Engineer"), role("role_data", "org_b", "Data Engineer"), role("role_empty", "org_b", "Empty Role"), role("role_ops", "org_k", "Operations")
], [
  req("req_01", "role_fs", "TypeScript"), req("req_02", "role_fs", "Node.js"), req("req_03", "role_fs", "Kubernetes"), req("req_04", "role_fs", "Geospatial Visualisation"),
  req("req_d1", "role_data", "Python", { aliases: ["PyTorch"] }),
  req("req_o1", "role_ops", "Kubernetes")
]);
const ANALYSIS = { analysisId: "ANL_1_1", jobId: "JOB_1_1", discoveryRunId: "RUN_X" };
const discover = (pools = [POOL_B, POOL_A]) => buildPoolRoleDiscovery({ analysis: ANALYSIS, projection: PROJECTION, pools });

describe("POOL_ROLE_DISCOVERY_V1 — pure contract", () => {
  it("fixed authority: lexical only, semantic NOT_EXECUTED, no score, no ranking, no decision", () => {
    const d = discover();
    expect(d.discoveryVersion).toBe("POOL_ROLE_DISCOVERY_V1");
    expect(d.authority).toEqual(POOL_ROLE_DISCOVERY_AUTHORITY);
    expect(d.authority).toMatchObject({ relationBasis: "LEXICAL_NAME_COVERAGE", semanticRelationState: "NOT_EXECUTED", scored: false, ranking: false, decision: false });
    expect(d.roles.every(r => r.semantic.state === "NOT_EXECUTED" && r.requirements.every(q => q.semantic.state === "NOT_EXECUTED"))).toBe(true);
    // No key anywhere carries a score, a rank, a confidence or a weight; `scored` and `ranking` exist only as the fixed false flags.
    const keys = new Set<string>(); const walk = (v: unknown): void => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { keys.add(k); walk(x); } };
    walk(d);
    expect([...keys].filter(k => /score|resonance|rank|confidence|weight/i.test(k)).sort()).toEqual(["ranking", "scored"]);
  });

  it("every role of every released upload, nothing else; keys (upload, role, requirement) keep repeated ids apart", () => {
    const d = discover();
    expect(d.roles.map(r => `${r.key.jobPoolUploadId}/${r.key.poolRoleId}`)).toEqual([
      "JPOOL_A/role_data", "JPOOL_A/role_empty", "JPOOL_A/role_fs", "JPOOL_A/role_ops", "JPOOL_B/role_fs"
    ]);
    const keys = d.roles.flatMap(r => r.requirements.map(q => `${q.key.jobPoolUploadId}/${q.key.poolRoleId}/${q.key.poolRequirementId}`));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("JPOOL_A/role_fs/req_01");
    expect(keys).toContain("JPOOL_B/role_fs/req_01");
    expect(d.counts).toEqual({ pools: 2, roles: 5, requirements: 7, proposals: 3 });
    expect(discover([POOL_A]).roles.some(r => r.key.jobPoolUploadId === "JPOOL_B")).toBe(false);
  });

  it("deterministic order (pool name, organisation, title) independent of request order; identical output for identical input", () => {
    expect(JSON.stringify(discover([POOL_B, POOL_A]))).toBe(JSON.stringify(discover([POOL_A, POOL_B])));
    expect(discover().pools.map(p => p.poolName)).toEqual(["Alpha Pool", "Zeta Pool"]);
  });

  it("lexical bases are named as such; the weak token hit is weak; the composite asymmetry stays visible", () => {
    const fs = discover().roles.find(r => r.key.jobPoolUploadId === "JPOOL_A" && r.key.poolRoleId === "role_fs")!;
    const basis = Object.fromEntries(fs.requirements.map(q => [q.requirementText, q.lexical.basis]));
    expect(basis).toEqual({ TypeScript: "NAME_COMPOSITE_CONSTITUENT", "Node.js": "WEAK_TOKEN_CONTAINMENT", Kubernetes: "NAME_EXACT", "Geospatial Visualisation": "NONE" });
    expect(fs.status).toBe("PARTIAL_NAME_RELATED");
    expect(fs.counts).toEqual({ requirements: 4, nameRelated: 2, weakLexicalOnly: 1, withoutLexicalRelation: 1, required: 4, requiredWithoutLexicalRelation: 1 });
  });

  it("role statuses: all, partial, weak only, none, no requirements; groups in the fixed order, empty groups listed", () => {
    const d = discover();
    const status = Object.fromEntries(d.roles.map(r => [`${r.key.jobPoolUploadId}/${r.key.poolRoleId}`, r.status]));
    expect(status).toEqual({
      "JPOOL_A/role_data": "WEAK_LEXICAL_ONLY", "JPOOL_A/role_empty": "NO_REQUIREMENTS", "JPOOL_A/role_fs": "PARTIAL_NAME_RELATED",
      "JPOOL_A/role_ops": "ALL_REQUIREMENTS_NAME_RELATED", "JPOOL_B/role_fs": "ALL_REQUIREMENTS_NAME_RELATED"
    });
    expect(d.groups.map(g => g.status)).toEqual([...ROLE_LEXICAL_STATUSES]);
    expect(d.groups.find(g => g.status === "NO_LEXICAL_RELATION")!.roles).toEqual([]);
    expect(d.groups.find(g => g.status === "ALL_REQUIREMENTS_NAME_RELATED")!.roles).toEqual([{ jobPoolUploadId: "JPOOL_A", poolRoleId: "role_ops" }, { jobPoolUploadId: "JPOOL_B", poolRoleId: "role_fs" }]);
  });

  it("inverse trace: every lexical relation names an existing proposal and carries that proposal's own quotes; the quote limitation is stated", () => {
    const d = discover();
    const proposals = new Map(d.proposals.map(p => [p.id, p]));
    for (const q of d.roles.flatMap(r => r.requirements).filter(q => q.lexical.basis !== "NONE")) {
      const p = proposals.get(q.lexical.proposalId!)!;
      expect(p).toBeDefined();
      for (const e of q.lexical.evidence) expect(p.evidence.some(pe => pe.exactQuote === e.exactQuote && pe.sourceDocumentId === e.sourceDocumentId)).toBe(true);
    }
    const data = d.roles.find(r => r.key.poolRoleId === "role_data")!.requirements[0];
    expect(data.lexical).toMatchObject({ basis: "WEAK_TOKEN_CONTAINMENT", proposalName: "Python ETL Development", quoteNamesRequirement: false });
    const ts = d.roles.find(r => r.key.jobPoolUploadId === "JPOOL_B")!.requirements[0];
    expect(ts.lexical).toMatchObject({ quoteNamesRequirement: true });
  });

  it("the operand is unchanged: proposals pass through with their names and evidence", () => {
    expect(discover().proposals).toEqual(PROJECTION.capabilities.map(c => ({ id: c.id, name: c.name, scope: c.scope, evidence: c.evidence.map(e => ({ evidenceId: e.evidenceId, sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote })) })));
  });

  it("no proposals: every role without lexical relation (none invented)", () => {
    const d = buildPoolRoleDiscovery({ analysis: ANALYSIS, projection: { capabilities: [] }, pools: [POOL_A] });
    expect(d.roles.filter(r => r.status !== "NO_REQUIREMENTS").every(r => r.status === "NO_LEXICAL_RELATION")).toBe(true);
  });

  it("quoteNamesRequirement: name, alias or all name tokens inside the quote", () => {
    expect(quoteNamesRequirement("Ran Kubernetes clusters.", { capability_name: "Kubernetes" })).toBe(true);
    expect(quoteNamesRequirement("Trained models in PyTorch.", { capability_name: "Python", aliases: ["PyTorch"] })).toBe(true);
    expect(quoteNamesRequirement("Wrote ETL jobs.", { capability_name: "Python" })).toBe(false);
  });
});
