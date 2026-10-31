import { describe, expect, it } from "vitest";
import { buildRoleRanking, type SemanticFinding } from "../../../lib/career/job-pool/role-ranking";
import { decodeRoleRanking } from "../../../lib/career/ui/auto-match";
import { findingsOf, relationKeysOf } from "../../../lib/career/job-pool/auto-match";
import type { CachedRelation } from "../../../lib/career/job-pool/relation-cache";
import type { DiscoveryRequirement, DiscoveryRole, PoolRoleDiscovery } from "../../../lib/career/job-pool/pool-role-discovery";

/**
 * PERSON × JOB mapping, phase A: the stable `capabilityKey` of a coupling is the id of the PERSON proposal. Additive to ROLE_RANKING_V1:
 * an older payload without the field stays readable (key null), a key is never made up from a name. DETERMINISTIC_FIXTURE, no database.
 */
const UPLOAD = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const requirement = (id: string, lexical: DiscoveryRequirement["lexical"] = { basis: "NONE", proposalId: null, proposalName: null, matchedConstituent: null, evidence: [], quoteNamesRequirement: null }): DiscoveryRequirement => ({
  key: { jobPoolUploadId: UPLOAD, poolRoleId: "role_1", poolRequirementId: id }, requirementText: `Requirement ${id}`, aliases: [], requiredLevel: "L3", necessity: "REQUIRED",
  requirementType: "CAPABILITY", matchingEligibility: null, targetRequirementRevisionId: null, lexical, semantic: { state: "NOT_EXECUTED" }
} as unknown as DiscoveryRequirement);
const exact = (id: string, name: string): DiscoveryRequirement["lexical"] => ({ basis: "NAME_EXACT", proposalId: id, proposalName: name, matchedConstituent: null, evidence: [{ sourceDocumentId: "DOC_1", exactQuote: "quote" }], quoteNamesRequirement: true } as never);
const discovery = (requirements: DiscoveryRequirement[]) => ({
  discoveryVersion: "POOL_ROLE_DISCOVERY_V1", authority: {} as never, analysis: { analysisId: "ANL_1", jobId: "JOB_1", mode: "PERSON", discoveryRunId: "RUN_1" },
  pools: [{ jobPoolUploadId: UPLOAD, poolId: "p0", poolVersion: 1, poolName: "Pool", canonicalSha256: "x", roleCount: 1 }], proposals: [],
  roles: [{ key: { jobPoolUploadId: UPLOAD, poolRoleId: "role_1" }, title: "Role", poolOrganizationId: "org", organizationName: "Org", status: "NO_LEXICAL_RELATION", semantic: { state: "NOT_EXECUTED" },
    counts: { requirements: requirements.length, nameRelated: 0, weakLexicalOnly: 0, withoutLexicalRelation: 0, required: 0, requiredWithoutLexicalRelation: 0 }, requirements } as unknown as DiscoveryRole],
  groups: [], counts: { pools: 1, roles: 1, requirements: requirements.length, proposals: 0 }
} as unknown as PoolRoleDiscovery);
const finding = (name: string, capabilityKey?: string | null): SemanticFinding => ({ state: "COVERS", capabilityName: name, explanation: "e", evidenceLimitation: "l", quotes: [{ sourceDocumentId: "DOC_1", exactQuote: "q" }], ...(capabilityKey === undefined ? {} : { capabilityKey }) });
const rank = (reqs: DiscoveryRequirement[], by: Record<string, SemanticFinding>) => buildRoleRanking({ analysisId: "ANL_1", discovery: discovery(reqs), findingFor: r => by[r.key.poolRequirementId] ?? null, evidenceClass: "STAND_IN", poolsDropped: [] });
const wire = (value: unknown) => JSON.parse(JSON.stringify(value)) as Record<string, any>;

describe("CK · the key of a coupling", () => {
  it("a semantic relation carries the proposal id of its finding, a name relation the id it names, no relation none", () => {
    const out = rank([requirement("r1"), requirement("r2", exact("PCAP_LEX", "Kubernetes")), requirement("r3")], { r1: finding("Kubernetes", "PCAP_SEM") });
    expect(out.ranks[0].requirements.map(q => [q.poolRequirementId, q.source, q.capabilityName, q.capabilityKey])).toEqual([
      ["r1", "SEMANTIC", "Kubernetes", "PCAP_SEM"], ["r2", "LEXICAL", "Kubernetes", "PCAP_LEX"], ["r3", "NONE", null, null]]);
  });

  it("two proposals of the same name stay two keys (a name is not a key; in a real analysis the same name needs a different scope — the proposal id is a hash of name and scope)", () => {
    const out = rank([requirement("r1"), requirement("r2")], { r1: finding("Python", "PCAP_A"), r2: finding("Python", "PCAP_B") });
    expect(out.ranks[0].requirements.map(q => q.capabilityKey)).toEqual(["PCAP_A", "PCAP_B"]);
  });

  it("an older finding without a key (or an empty one) is a null key — never derived from the capability name", () => {
    const out = rank([requirement("r1"), requirement("r2"), requirement("r3")], { r1: finding("Kubernetes"), r2: finding("Kubernetes", null), r3: finding("Kubernetes", "") });
    expect(out.ranks[0].requirements.map(q => [q.capabilityName, q.capabilityKey])).toEqual([["Kubernetes", null], ["Kubernetes", null], ["Kubernetes", null]]);
  });

  it("the key changes no number of the ranking (fit, order, coverage, gaps)", () => {
    const reqs = [requirement("r1"), requirement("r2"), requirement("r3")];
    const withKey = rank(reqs, { r1: finding("A", "PCAP_1"), r2: finding("B", "PCAP_2") });
    const without = rank(reqs, { r1: finding("A"), r2: finding("B") });
    const strip = (r: typeof withKey) => wire({ ...r, ranks: r.ranks.map(x => ({ ...x, requirements: x.requirements.map(({ capabilityKey, ...q }) => q) })) });
    expect(strip(withKey)).toEqual(strip(without));
  });
});

describe("CK · the strict client decoder", () => {
  const body = () => wire(rank([requirement("r1"), requirement("r2", exact("PCAP_LEX", "Kubernetes")), requirement("r3")], { r1: finding("Kubernetes", "PCAP_SEM") }));

  it("decodes the new shape and keeps the key", () => {
    const decoded = decodeRoleRanking(body(), "ANL_1");
    expect(decoded?.ranks[0].requirements.map(q => q.capabilityKey ?? null)).toEqual(["PCAP_SEM", "PCAP_LEX", null]);
  });

  it("an older payload without the field (the persisted shape) still decodes unchanged — the key reads null, nothing is invented", () => {
    const old = body(); for (const r of old.ranks) for (const q of r.requirements) delete q.capabilityKey;
    const decoded = decodeRoleRanking(old, "ANL_1");
    expect(decoded).not.toBeNull();
    expect(decoded).toBe(old);
    expect(decoded!.ranks[0].requirements.map(q => [q.capabilityName, q.capabilityKey ?? null])).toEqual([["Kubernetes", null], ["Kubernetes", null], [null, null]]);
  });

  it.each([
    ["an empty key", (q: any) => { q.capabilityKey = ""; }],
    ["a non-text key", (q: any) => { q.capabilityKey = 7; }],
    ["a key without a named capability", (q: any) => { q.capabilityName = null; q.capabilityKey = "PCAP_X"; q.source = "NONE"; q.state = "NONE"; q.value = 0; q.contribution = 0; q.quotes = []; q.explanation = null; q.evidenceLimitation = null; }],
    ["an unknown extra field", (q: any) => { q.surprise = 1; }],
    ["an unknown field in place of a known one (old field count)", (q: any) => { delete q.capabilityKey; delete q.quotes; q.surprise = []; }],
    ["an unknown field in place of a known one (new field count)", (q: any) => { delete q.explanation; q.surprise = null; }]
  ])("INVERSE: %s is refused", (_label, mutate) => {
    const b = body(); mutate(b.ranks[0].requirements[0]);
    expect(decodeRoleRanking(b, "ANL_1")).toBeNull();
  });

  it("INVERSE: a key on a requirement with no capability is refused", () => {
    const b = body(); b.ranks[0].requirements[2].capabilityKey = "PCAP_MADE_UP";
    expect(decodeRoleRanking(b, "ANL_1")).toBeNull();
  });
});

describe("CK · which proposal a requirement is coupled to (several proposals, mixed verdicts)", () => {
  // Three PERSON proposals in projection order: the FIRST is Zeta, the best one is not always the first.
  const proposals = [{ id: "PCAP_1", hash: "h1", name: "Zeta" }, { id: "PCAP_2", hash: "h2", name: "Mid" }, { id: "PCAP_3", hash: "h3", name: "Alpha" }];
  const rel = (relationKey: string, state: CachedRelation["state"], capabilityName: string) => [relationKey, { relationKey, state, capabilityName, relationExplanation: "e", evidenceLimitation: "l", sourceEvidence: [{ sourceDocumentId: "DOC_1", exactQuote: "q" }] } as unknown as CachedRelation] as const;
  const requirements = ["r1", "r2", "r3"].map(id => ({ requirementKey: id, requirementHash: `req-${id}` }));
  const keyed = relationKeysOf(proposals.map(p => ({ id: p.id, hash: p.hash })), requirements, "engine");
  const keyOf = (requirementKey: string, proposalId: string) => keyed.find(k => k.requirementKey === requirementKey && k.proposalId === proposalId)!.relationKey;
  const stored = new Map<string, CachedRelation>([
    rel(keyOf("r1", "PCAP_1"), "PARTIAL", "Zeta"), rel(keyOf("r1", "PCAP_2"), "COVERS", "Mid"), rel(keyOf("r1", "PCAP_3"), "PARTIAL", "Alpha"),
    rel(keyOf("r2", "PCAP_1"), "PARTIAL", "Zeta"), rel(keyOf("r2", "PCAP_2"), "PARTIAL", "Mid"), rel(keyOf("r2", "PCAP_3"), "PARTIAL", "Alpha"),
    rel(keyOf("r3", "PCAP_1"), "UNCLEAR", "Zeta")
  ]);

  it("one cache key per requirement and proposal, each remembering ITS proposal id", () => {
    expect(keyed).toHaveLength(9);
    expect(keyed.filter(k => k.requirementKey === "r1").map(k => k.proposalId)).toEqual(["PCAP_1", "PCAP_2", "PCAP_3"]);
    expect(new Set(keyed.map(k => k.relationKey)).size).toBe(9);
  });

  it("the key is the id of the BEST proposal — not the first, not the last; a tie follows the published order (name)", () => {
    const found = findingsOf(keyed, stored);
    expect([...found.entries()].map(([k, f]) => [k, f.state, f.capabilityName, f.capabilityKey])).toEqual([
      ["r1", "COVERS", "Mid", "PCAP_2"], ["r2", "PARTIAL", "Alpha", "PCAP_3"], ["r3", "UNCLEAR", "Zeta", "PCAP_1"]]);
  });

  it("through the ranking the keys and the numbers stay what the formula says (COVERS 1, PARTIAL 0.5, UNCLEAR 0)", () => {
    const found = findingsOf(keyed, stored);
    const out = rank(["r1", "r2", "r3"].map(id => requirement(id)), Object.fromEntries([...found.entries()]));
    expect(out.ranks[0].requirements.map(q => [q.state, q.value, q.contribution, q.capabilityKey])).toEqual([["COVERS", 1, 3, "PCAP_2"], ["PARTIAL", 0.5, 1.5, "PCAP_3"], ["UNCLEAR", 0, 0, "PCAP_1"]]);
    expect(out.ranks[0].fit).toBeCloseTo(4.5 / 9, 6);
    expect(out.ranks[0].requiredGaps).toBe(1);
  });

  it("a relation that is not stored is no coupling: no key, no invented one", () => {
    const found = findingsOf(keyed, new Map());
    expect(found.size).toBe(0);
  });
});
