import { buildPoolRoleDiscovery, type DiscoveryPoolInput } from "../../../lib/career/job-pool/pool-role-discovery";

/**
 * A synthetic POOL_ROLE_DISCOVERY_V1 body for the frontend (no real CV text, no real pool): built with GELB's own builder
 * (lib/career/job-pool/pool-role-discovery.ts) from two small uploads, plus a semanticPlan in the route's shape (ENGINE_NOT_SPECIFIED).
 * Pool ALPHA: Kestrel (Full-Stack Engineer: 2 name-related, 1 weak, 1 open; Operations: Kubernetes exact), Brightwater (Data
 * Engineer: Python alias; Empty Role: no requirements). Pool ZETA: Kestrel Full-Stack (TypeScript composite constituent) and
 * Analyst (nothing related).
 */
export const UPLOAD_ALPHA = "JPOOL_A0000000000000000000000000000001";
export const UPLOAD_ZETA = "JPOOL_B0000000000000000000000000000002";
export const PERSON_ANALYSIS = "ANL_1792000000101_101";
const evidence = (id: string, quote: string) => ({ evidenceId: id, sourceDocumentId: "DOC_001", exactQuote: quote, verificationState: "SOURCE_MATCH_VERIFIED" as const });
const proposal = (id: string, name: string, quote: string, scope: "ATOMIC" | "COMPOSITE" = "ATOMIC") => ({
  id, name, domain: null, scope, structuralDefinition: "", evidenceState: "EVIDENCE_PASSED" as const, semanticDefinitionState: "NOT_RUN" as const, authorityState: "NONE" as const,
  sourceCandidateIds: [], sourceDocumentIds: ["DOC_001"], evidence: [evidence(`E_${id}`, quote)]
});
export const PROJECTION = { capabilities: [
  proposal("P_TS_NODE", "TypeScript and Node.js Backend Development", "Built services in TypeScript and Node.js.", "COMPOSITE"),
  proposal("P_PY", "Python ETL Development", "Wrote ETL jobs in Python."),
  proposal("P_K8S", "Kubernetes", "Ran Kubernetes clusters."),
  proposal("P_SQL", "PostgreSQL Database Design", "Designed relational schemas.")
] };
const org = (id: string, name: string) => ({ id, pool_id: "p", org_id: id, name, country_iso: "DE", region: "", industry: "", scale: "", description: "" });
const role = (id: string, organization: string, title: string) => ({ id, pool_id: "p", organization_id: organization, title, seniority: "", domain_focus: "", description: "" });
const req = (id: string, roleId: string, name: string, extra: Record<string, unknown> = {}) => ({ id, role_id: roleId, capability_name: name, domain: "", weight: 0.5, required_level: "L3", ...extra });
const mapping = (roles: Array<{ id: string; reqs: string[] }>) => ({ roles: roles.map(r => ({ poolRoleId: r.id, requirements: r.reqs.map(q => ({ poolRequirementId: q, capabilityName: q, targetRequirementEntityId: `E_${q}`, targetRequirementRevisionId: `TRQREV_${q}`, necessityState: "REQUIRED", requirementType: "CAPABILITY", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY" })) })) });
const upload = (jobPoolUploadId: string, poolName: string, organizations: ReturnType<typeof org>[], roles: ReturnType<typeof role>[], requirements: ReturnType<typeof req>[]): DiscoveryPoolInput => ({
  jobPoolUploadId, poolId: `pool_${jobPoolUploadId}`, poolVersion: 1, poolName, poolStatus: "ACTIVE", canonicalSha256: `sha_${jobPoolUploadId}`,
  pool: { pool: { id: "p", name: poolName, description: "", version: 1, status: "ACTIVE", created_at: "2026-10-24T00:00:00.000Z" }, organizations, roles, requirements, search_queries: [] } as unknown as DiscoveryPoolInput["pool"],
  canonicalMapping: mapping(roles.map(r => ({ id: r.id, reqs: requirements.filter(q => q.role_id === r.id).map(q => q.id) }))) as unknown as DiscoveryPoolInput["canonicalMapping"]
});
const ALPHA = upload(UPLOAD_ALPHA, "Alpha Pool", [org("org_k", "Kestrel"), org("org_b", "Brightwater")], [
  role("role_fs", "org_k", "Full-Stack Engineer"), role("role_data", "org_b", "Data Engineer"), role("role_empty", "org_b", "Empty Role"), role("role_ops", "org_k", "Operations")
], [
  req("req_01", "role_fs", "TypeScript"), req("req_02", "role_fs", "Node.js"), req("req_03", "role_fs", "Backend"), req("req_04", "role_fs", "Geospatial Visualisation"),
  req("req_d1", "role_data", "Python", { aliases: ["PyTorch"] }),
  req("req_o1", "role_ops", "Kubernetes")
]);
const ZETA = upload(UPLOAD_ZETA, "Zeta Pool", [org("org_k", "Kestrel")], [role("role_fs", "org_k", "Full-Stack Engineer"), role("role_an", "org_k", "Analyst")], [req("req_01", "role_fs", "TypeScript"), req("req_a1", "role_an", "Market Research")]);

/** The route's body for the pools in this order (the route orders roles by pool name itself). */
export function discoveryBody(pools: string[] = [UPLOAD_ALPHA, UPLOAD_ZETA]) {
  const inputs = pools.map(id => (id === UPLOAD_ALPHA ? ALPHA : ZETA));
  const discovery = buildPoolRoleDiscovery({ analysis: { analysisId: PERSON_ANALYSIS, jobId: "JOB_1792000000101_101", discoveryRunId: "RUN_PERSON" }, projection: PROJECTION as never, pools: inputs });
  const pairs = discovery.roles.reduce((n, r) => n + r.requirements.length * PROJECTION.capabilities.length, 0);
  const semanticPlan = { cacheVersion: "PROPOSAL_REQUIREMENT_RELATION_CACHE_V1", engineVersionHash: null, state: "ENGINE_NOT_SPECIFIED", pairs, cachedPairs: 0, pendingPairs: pairs, callsNeeded: discovery.roles.filter(r => r.requirements.length > 0).length, roles: [] };
  return { success: true, discovery: { ...discovery, semanticPlan } };
}
