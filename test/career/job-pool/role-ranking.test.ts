import { describe, expect, it } from "vitest";
import { ROLE_RANKING_VERSION, buildRoleRanking, pickBestFinding, type SemanticFinding } from "../../../lib/career/job-pool/role-ranking";
import type { DiscoveryRequirement, DiscoveryRole, PoolRoleDiscovery } from "../../../lib/career/job-pool/pool-role-discovery";

/** DETERMINISTIC_FIXTURE: a hand-built discovery and hand-built findings; no database, no network, no model. */
const lex = (basis: "NONE" | "NAME_EXACT" | "NAME_ALIAS" | "NAME_COMPOSITE_CONSTITUENT" | "WEAK_TOKEN_CONTAINMENT"): DiscoveryRequirement["lexical"] => basis === "NONE"
  ? { basis: "NONE", proposalId: null, proposalName: null, matchedConstituent: null, evidence: [], quoteNamesRequirement: null } as never
  : { basis, proposalId: "P1", proposalName: "Kubernetes Deployment", matchedConstituent: null, evidence: [{ sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes." }], quoteNamesRequirement: true } as never;
const req = (role: string, id: string, necessity: DiscoveryRequirement["necessity"], basis: Parameters<typeof lex>[0] = "NONE"): DiscoveryRequirement => ({
  key: { jobPoolUploadId: "U1", poolRoleId: role, poolRequirementId: id }, requirementText: `Req ${id}`, aliases: [], requiredLevel: "L3", necessity, requirementType: "CAPABILITY",
  matchingEligibility: null, targetRequirementRevisionId: null, lexical: lex(basis), semantic: { state: "NOT_EXECUTED" } });
const role = (id: string, title: string, requirements: DiscoveryRequirement[], upload = "U1"): DiscoveryRole => ({
  key: { jobPoolUploadId: upload, poolRoleId: id }, title, poolOrganizationId: "org", organizationName: "Org", status: "NO_LEXICAL_RELATION", semantic: { state: "NOT_EXECUTED" },
  counts: { requirements: requirements.length, nameRelated: 0, weakLexicalOnly: 0, withoutLexicalRelation: 0, required: 0, requiredWithoutLexicalRelation: 0 }, requirements });
const discovery = (roles: DiscoveryRole[]): PoolRoleDiscovery => ({ discoveryVersion: "POOL_ROLE_DISCOVERY_V1", authority: {} as never, analysis: { analysisId: "ANL_1", jobId: "JOB_1", mode: "PERSON", discoveryRunId: "RUN_1" },
  pools: [{ jobPoolUploadId: "U1", poolId: "p1", poolVersion: 1, poolName: "Pool One", canonicalSha256: "x", roleCount: roles.length }], proposals: [], roles, groups: [], counts: { pools: 1, roles: roles.length, requirements: 0, proposals: 0 } });
const finding = (state: SemanticFinding["state"], capabilityName = "Kubernetes Deployment"): SemanticFinding => ({ state, capabilityName, explanation: `explains ${state}`, evidenceLimitation: "limits", quotes: [{ sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes." }] });
const key = (r: DiscoveryRequirement) => `${r.key.jobPoolUploadId}\u0000${r.key.poolRoleId}\u0000${r.key.poolRequirementId}`;
const rank = (roles: DiscoveryRole[], findings: Record<string, SemanticFinding> = {}, extra: { evidenceClass?: string | null; poolsDropped?: string[] } = {}) =>
  buildRoleRanking({ analysisId: "ANL_1", discovery: discovery(roles), findingFor: r => findings[key(r)] ?? null, evidenceClass: "evidenceClass" in extra ? extra.evidenceClass! : "STAND_IN", poolsDropped: extra.poolsDropped ?? [] });

describe("ROLE_RANKING_V1: the oracle table", () => {
  it("requirement value x necessity weight, fit = sum(weight x value) / sum(weight)", () => {
    const a = role("a", "Alpha", [req("a", "1", "REQUIRED"), req("a", "2", "PREFERRED"), req("a", "3", "OPTIONAL"), req("a", "4", "UNKNOWN")]);
    const f = { [key(a.requirements[0])]: finding("COVERS"), [key(a.requirements[1])]: finding("PARTIAL"), [key(a.requirements[2])]: finding("DIFFERENT"), [key(a.requirements[3])]: finding("UNCLEAR") };
    const out = rank([a], f).ranks[0];
    expect(out.requirements.map(r => [r.weight, r.value, r.contribution])).toEqual([[3, 1, 3], [2, 0.5, 1], [1, 0, 0], [1, 0, 0]]);
    expect(out.fit).toBeCloseTo((3 + 1) / 7, 6);
    expect(out.requiredGaps).toBe(0);
    expect(out.requirements.reduce((n, r) => n + r.contribution, 0) / out.requirements.reduce((n, r) => n + r.weight, 0)).toBeCloseTo(out.fit as number, 6);
  });
  it("EQUIVALENT and COVERS are 1, PARTIAL 0.5, DIFFERENT and UNCLEAR 0; a required requirement at 0 is a required gap", () => {
    const a = role("a", "Alpha", [req("a", "1", "REQUIRED"), req("a", "2", "REQUIRED"), req("a", "3", "REQUIRED"), req("a", "4", "REQUIRED")]);
    const states = ["EQUIVALENT", "PARTIAL", "DIFFERENT", "UNCLEAR"] as const;
    const out = rank([a], Object.fromEntries(a.requirements.map((r, i) => [key(r), finding(states[i])]))).ranks[0];
    expect(out.requirements.map(r => r.value)).toEqual([1, 0.5, 0, 0]);
    expect(out.requiredGaps).toBe(2);
  });
  it("without a semantic relation the lexical basis counts at most 0.5 and is marked LEXICAL; no relation is NONE", () => {
    const a = role("a", "Alpha", [req("a", "1", "REQUIRED", "NAME_EXACT"), req("a", "2", "REQUIRED", "NAME_ALIAS"), req("a", "3", "REQUIRED", "NAME_COMPOSITE_CONSTITUENT"), req("a", "4", "REQUIRED", "WEAK_TOKEN_CONTAINMENT"), req("a", "5", "REQUIRED")]);
    const out = rank([a]).ranks[0];
    expect(out.requirements.map(r => [r.source, r.state, r.value])).toEqual([["LEXICAL", "NAME_EXACT", 0.5], ["LEXICAL", "NAME_ALIAS", 0.5], ["LEXICAL", "NAME_COMPOSITE_CONSTITUENT", 0], ["LEXICAL", "WEAK_TOKEN_CONTAINMENT", 0], ["NONE", "NONE", 0]]);
    expect(out.tier).toBe("LEXICAL_ONLY");
    expect(out.semanticCoverage).toEqual({ evaluated: 0, total: 5 });
    expect(out.requirements[0].capabilityName).toBe("Kubernetes Deployment");
  });
  it("a semantic relation replaces the lexical basis for that requirement; a mixed role is SEMANTIC and reports its coverage", () => {
    const a = role("a", "Alpha", [req("a", "1", "REQUIRED", "NAME_EXACT"), req("a", "2", "REQUIRED", "NAME_EXACT")]);
    const out = rank([a], { [key(a.requirements[0])]: finding("DIFFERENT") }).ranks[0];
    expect(out.requirements.map(r => [r.source, r.value])).toEqual([["SEMANTIC", 0], ["LEXICAL", 0.5]]);
    expect(out.tier).toBe("SEMANTIC");
    expect(out.semanticCoverage).toEqual({ evaluated: 1, total: 2 });
  });
  it("a semantic requirement carries explanation, limitation and quotes; a lexical one carries none of the model fields", () => {
    const a = role("a", "Alpha", [req("a", "1", "REQUIRED"), req("a", "2", "REQUIRED", "NAME_EXACT")]);
    const out = rank([a], { [key(a.requirements[0])]: finding("COVERS") }).ranks[0];
    expect(out.requirements[0]).toMatchObject({ explanation: "explains COVERS", evidenceLimitation: "limits", quotes: [{ sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes." }] });
    expect(out.requirements[1]).toMatchObject({ explanation: null, evidenceLimitation: null });
    expect(out.requirements[1].quotes).toEqual([{ sourceDocumentId: "DOC_001", exactQuote: "Ran Kubernetes." }]);
  });
  it("a role without requirements has fit null, is LEXICAL_ONLY and comes last in its tier", () => {
    const empty = role("e", "Aardvark", []);
    const full = role("f", "Zebra", [req("f", "1", "REQUIRED")]);
    const out = rank([empty, full]);
    expect(out.ranks.map(r => r.role.title)).toEqual(["Zebra", "Aardvark"]);
    expect(out.ranks[1].fit).toBeNull();
    expect(out.ranks[1].requirements).toEqual([]);
  });
});

describe("ROLE_RANKING_V1: order, tiers, determinism", () => {
  const roles = () => {
    const a = role("a", "Alpha", [req("a", "1", "REQUIRED")]), b = role("b", "Beta", [req("b", "1", "REQUIRED")]), c = role("c", "Gamma", [req("c", "1", "REQUIRED"), req("c", "2", "REQUIRED")]), d = role("d", "Delta", [req("d", "1", "REQUIRED", "NAME_EXACT")]);
    const f = { [key(a.requirements[0])]: finding("PARTIAL"), [key(b.requirements[0])]: finding("COVERS"), [key(c.requirements[0])]: finding("COVERS"), [key(c.requirements[1])]: finding("UNCLEAR") };
    return { list: [a, b, c, d], f };
  };
  it("semantic roles first by fit, then the lexical-only tier; ranks are 1..n without gaps", () => {
    const { list, f } = roles();
    const out = rank(list, f);
    expect(out.ranks.map(r => [r.rank, r.tier, r.role.title, r.fit])).toEqual([[1, "SEMANTIC", "Beta", 1], [2, "SEMANTIC", "Alpha", 0.5], [3, "SEMANTIC", "Gamma", 0.5], [4, "LEXICAL_ONLY", "Delta", 0.5]]);
  });
  it("ties on fit: fewer required gaps first, then title, then the role key", () => {
    const { list, f } = roles();
    const out = rank([list[2], list[0]], f);
    // Alpha (0 required gaps) before Gamma (1 required gap), although both have fit 0.5
    expect(out.ranks.map(r => [r.role.title, r.requiredGaps])).toEqual([["Alpha", 0], ["Gamma", 1]]);
    const x = role("x", "Same", [req("x", "1", "REQUIRED")]), y = role("y", "Same", [req("y", "1", "REQUIRED")]);
    expect(rank([y, x]).ranks.map(r => r.role.poolRoleId)).toEqual(["x", "y"]);
  });
  it("the result does not depend on the input order of the roles (permutation invariance)", () => {
    const { list, f } = roles();
    const base = JSON.stringify(rank(list, f));
    for (const permutation of [[3, 2, 1, 0], [1, 3, 0, 2], [2, 0, 3, 1]]) expect(JSON.stringify(rank(permutation.map(i => list[i]), f))).toBe(base);
  });
  it("authority: a ranking, never a decision; the pool names and dropped pools are reported; the class is passed through", () => {
    const out = rank([role("a", "Alpha", [req("a", "1", "REQUIRED")])], {}, { evidenceClass: null, poolsDropped: ["U9"] });
    expect(out.rankingVersion).toBe(ROLE_RANKING_VERSION);
    expect(out.authority).toEqual({ ranking: true, decision: false, authorityState: "NONE" });
    expect(out.evidenceClass).toBeNull();
    expect(out.poolsDropped).toEqual(["U9"]);
    expect(out.pools).toEqual([{ jobPoolUploadId: "U1", poolName: "Pool One" }]);
    expect(out.ranks[0].role).toEqual({ jobPoolUploadId: "U1", poolRoleId: "a", title: "Alpha", organizationName: "Org", poolName: "Pool One" });
    expect(out.counts).toEqual({ pools: 1, roles: 1, ranked: 1 });
    expect(out.formula.fit).toContain("weight");
  });
});

describe("the best relation of several proposals carries the requirement", () => {
  it("highest value; a tie: EQUIVALENT before COVERS before PARTIAL, then capability name", () => {
    const pick = (...c: SemanticFinding[]) => pickBestFinding(c);
    expect(pick(finding("PARTIAL", "A"), finding("COVERS", "B"))?.capabilityName).toBe("B");
    expect(pick(finding("COVERS", "B"), finding("EQUIVALENT", "C"))?.state).toBe("EQUIVALENT");
    expect(pick(finding("COVERS", "Z"), finding("COVERS", "M"))?.capabilityName).toBe("M");
    expect(pick(finding("UNCLEAR", "Z"), finding("DIFFERENT", "M"))?.capabilityName).toBe("M");
    expect(pick()).toBeNull();
  });
});
