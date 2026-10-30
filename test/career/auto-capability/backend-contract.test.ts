import { describe, expect, it } from "vitest";
import { buildRoleRanking, type SemanticFinding } from "../../../lib/career/job-pool/role-ranking";
import { viewOfAutoInvestigation } from "../../../lib/career/job-pool/auto-match";
import type { DiscoveryRequirement, DiscoveryRole, PoolRoleDiscovery } from "../../../lib/career/job-pool/pool-role-discovery";
import type { InvestigationStatus, TaskStatus } from "../../../lib/career/job-pool/semantic-investigation-store";
import { decodeAutoMatch, decodeRoleRanking } from "../../../lib/career/ui/auto-match";

/**
 * AUTO_CAPABILITY, the two sides held together (recursive integration): what GELB's backend builds — the pure ranking
 * (buildRoleRanking, ROLE_RANKING_V1) and the run's view of a stored automatic investigation (viewOfAutoInvestigation), plus the
 * route's configuration-derived states — is exactly what the client's strict decoders accept. A seeded generator walks many
 * discoveries and findings; an inverse breaks each generated body once and must be refused. No database, no network, no model.
 */
let seed = 0x5eed;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rnd() * items.length)];
const BASES = ["NONE", "NAME_EXACT", "NAME_ALIAS", "NAME_COMPOSITE_CONSTITUENT", "WEAK_TOKEN_CONTAINMENT"] as const;
const NECESSITIES = ["REQUIRED", "PREFERRED", "OPTIONAL", "UNKNOWN", "NICE_TO_HAVE"] as const;
const STATES = ["EQUIVALENT", "COVERS", "PARTIAL", "DIFFERENT", "UNCLEAR"] as const;
const UPLOADS = ["JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "JPOOL_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"];

function generated() {
  const roles: DiscoveryRole[] = [];
  const findings = new Map<string, SemanticFinding>();
  const count = 1 + Math.floor(rnd() * 7);
  for (let r = 0; r < count; r += 1) {
    const upload = pick(UPLOADS), roleId = `role_${r}`;
    const requirements: DiscoveryRequirement[] = [];
    const n = Math.floor(rnd() * 5);
    for (let q = 0; q < n; q += 1) {
      const basis = pick(BASES);
      const requirement = {
        key: { jobPoolUploadId: upload, poolRoleId: roleId, poolRequirementId: `req_${q}` }, requirementText: `Requirement ${r}.${q}`, aliases: [], requiredLevel: "L3",
        necessity: pick(NECESSITIES), requirementType: "CAPABILITY", matchingEligibility: null, targetRequirementRevisionId: null,
        lexical: basis === "NONE" ? { basis, proposalId: null, proposalName: null, matchedConstituent: null, evidence: [], quoteNamesRequirement: null }
          : { basis, proposalId: "P1", proposalName: `Capability ${q}`, matchedConstituent: null, evidence: rnd() < 0.3 ? [] : [{ sourceDocumentId: "DOC_1", exactQuote: "placeholder" }], quoteNamesRequirement: rnd() < 0.5 },
        semantic: { state: "NOT_EXECUTED" }
      } as unknown as DiscoveryRequirement;
      requirements.push(requirement);
      if (rnd() < 0.45) {
        const state = pick(STATES);
        findings.set(`${upload}\u0000${roleId}\u0000req_${q}`, { state, capabilityName: `Capability ${q}`, explanation: `Statement ${q}.`, evidenceLimitation: `Limitation ${q}.`,
          quotes: state === "DIFFERENT" || state === "UNCLEAR" ? (rnd() < 0.5 ? [] : [{ sourceDocumentId: "DOC_1", exactQuote: "placeholder" }]) : [{ sourceDocumentId: "DOC_1", exactQuote: "placeholder" }] });
      }
    }
    roles.push({ key: { jobPoolUploadId: upload, poolRoleId: roleId }, title: pick(["Alpha", "Beta", "Gamma"]), poolOrganizationId: "org", organizationName: "Org", status: "NO_LEXICAL_RELATION",
      semantic: { state: "NOT_EXECUTED" }, counts: { requirements: n, nameRelated: 0, weakLexicalOnly: 0, withoutLexicalRelation: 0, required: 0, requiredWithoutLexicalRelation: 0 }, requirements } as DiscoveryRole);
  }
  const discovery = { discoveryVersion: "POOL_ROLE_DISCOVERY_V1", authority: {} as never, analysis: { analysisId: "ANL_1", jobId: "JOB_1", mode: "PERSON", discoveryRunId: "RUN_1" },
    pools: UPLOADS.map((id, at) => ({ jobPoolUploadId: id, poolId: `p${at}`, poolVersion: 1, poolName: `Pool ${at}`, canonicalSha256: "x", roleCount: 0 })), proposals: [], roles, groups: [],
    counts: { pools: 2, roles: roles.length, requirements: 0, proposals: 0 } } as unknown as PoolRoleDiscovery;
  const ranking = buildRoleRanking({ analysisId: "ANL_1", discovery, findingFor: r => findings.get(`${r.key.jobPoolUploadId}\u0000${r.key.poolRoleId}\u0000${r.key.poolRequirementId}`) ?? null,
    evidenceClass: findings.size > 0 ? pick(["STAND_IN", "REAL_GEMINI"]) : null, poolsDropped: rnd() < 0.2 ? ["JPOOL_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"] : [] });
  return JSON.parse(JSON.stringify(ranking)) as Record<string, unknown>;
}

describe("AC-BACKEND · the backend's ranking is the client's contract", () => {
  it("REPRODUCE: 400 generated rankings (mixed tiers, null fits, ties, lexical bases, findings of every state) all decode", () => {
    for (let i = 0; i < 400; i += 1) {
      const body = generated();
      expect(decodeRoleRanking(body, "ANL_1"), JSON.stringify(body).slice(0, 400)).not.toBeNull();
    }
  });

  it("inverse: each generated ranking, broken once (a value, a rank, the authority, the evidence class), is refused", () => {
    let broken = 0;
    for (let i = 0; i < 200; i += 1) {
      const body = generated();
      const ranks = body.ranks as Array<Record<string, unknown>>;
      const which = i % 4;
      if (which === 0) { const withReq = ranks.find(r => (r.requirements as unknown[]).length > 0); if (!withReq) continue; ((withReq.requirements as Array<Record<string, unknown>>)[0]).value = 0.75; }
      if (which === 1) ranks[0].rank = 2;
      if (which === 2) (body.authority as Record<string, unknown>).decision = true;
      if (which === 3) body.evidenceClass = body.evidenceClass === null ? "STAND_IN" : null;
      expect(decodeRoleRanking(body, "ANL_1"), `break ${which}`).toBeNull();
      broken += 1;
    }
    expect(broken).toBeGreaterThan(150);
  });
});

describe("AC-BACKEND · the backend's run view is the client's contract", () => {
  const RINV = "RINV_0123456789ABCDEF0123456789ABCDEF";
  const view = (status: InvestigationStatus, provider: string, tasks: TaskStatus[], rolesTotal: number, errorCode: string | null = null) => viewOfAutoInvestigation({
    investigation: { investigationId: RINV, provider, status, createdAt: "2026-10-30T10:00:00.000Z", updatedAt: "2026-10-30T10:01:00.000Z",
      request: { uploads: UPLOADS, roles: tasks.map((_, at) => ({ jobPoolUploadId: UPLOADS[0], poolRoleId: `r${at}` })), rolesTotal, callsNeeded: tasks.length } },
    tasks: tasks.map(s => ({ status: s, errorCode: s === "FAILED" ? errorCode : null })), poolNames: new Map(UPLOADS.map((id, at) => [id, `Pool ${at}`] as const))
  });

  it("REPRODUCE: every stored investigation status, provider and task mix gives a view the client decodes", () => {
    const statuses: InvestigationStatus[] = ["PLANNED", "RUNNING", "COMPLETED", "PARTIAL", "INTERRUPTED", "FAILED"];
    const mixes: TaskStatus[][] = [["SUCCEEDED"], ["CACHED", "SUCCEEDED"], ["SUCCEEDED", "FAILED"], ["BUDGET_EXHAUSTED"], ["PENDING", "RUNNING"], ["FAILED"]];
    let seen = 0;
    for (const status of statuses) for (const provider of ["stand-in", "gemini"]) for (const tasks of mixes) for (const extra of [0, 3]) {
      const v = view(status, provider, tasks, tasks.length + extra, "ERR_SEMANTIC_OUTPUT_REFUSED");
      expect(decodeAutoMatch(JSON.parse(JSON.stringify(v))), JSON.stringify(v)).not.toBeNull();
      seen += 1;
    }
    expect(seen).toBe(144);
  });

  it("REPRODUCE: the route's states without a stored run (configuration, analysis, pools) decode", () => {
    const empty = { evidenceClass: null, pools: [], budget: null, investigationId: null, startedAt: null, finishedAt: null };
    for (const reason of ["SEMANTIC_NOT_CONFIGURED", "PROVIDER_NOT_AUTHORIZED", "DAY_LIMIT_ZERO"]) expect(decodeAutoMatch({ state: "DISABLED", reason, ...empty }), reason).not.toBeNull();
    expect(decodeAutoMatch({ state: "SKIPPED", reason: "NOT_PERSON", ...empty })).not.toBeNull();
    expect(decodeAutoMatch({ state: "SKIPPED", reason: "NO_ACTIVE_POOLS", ...empty })).not.toBeNull();
    expect(decodeAutoMatch({ state: "NOT_STARTED", reason: null, ...empty })).not.toBeNull();
  });

  it("inverse: a provider the client does not know, or a run view without its budget, is refused", () => {
    expect(decodeAutoMatch(JSON.parse(JSON.stringify(view("COMPLETED", "other-model", ["SUCCEEDED"], 1))))).toBeNull();
    expect(decodeAutoMatch({ ...JSON.parse(JSON.stringify(view("RUNNING", "stand-in", ["RUNNING"], 1))), budget: null })).toBeNull();
  });
});
