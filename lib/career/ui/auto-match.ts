"use client";

import { useEffect, useRef, useState } from "react";
import type { SemanticRelationState } from "../job-pool/relation-cache";
import type { LexicalBasis } from "../job-pool/pool-role-discovery";
import { INVESTIGATION_ID } from "./semantic-investigation";

/**
 * The automatic product path, the reads (owner "SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE" 2026-10-30; GELB §3.5, shapes confirmed
 * by GELB the same day). GET only, never a model call, never a write:
 *
 *   GET /api/career/analyses/{analysisId}/auto-match    → { success, autoMatch }          the run the worker starts by itself
 *   GET /api/career/analyses/{analysisId}/job-ranking   → { success, ranking }            ROLE_RANKING_V1, computed on read
 *
 * Both decoders are strict: a body that is not exactly the contract — a state with a reason of another state, an evidence class
 * where none may stand, a rank out of its tier or order, a fit that is not its own formula, a requirement whose value is not its
 * state's — is FAILED, never a partial success. Nothing here starts, confirms or chooses anything: the run is the worker's.
 */
type Fetcher = (input: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

export const AUTO_MATCH_STATES = ["NOT_STARTED", "DISABLED", "RUNNING", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED"] as const;
export type AutoMatchRunState = typeof AUTO_MATCH_STATES[number];
export type EvidenceClass = "STAND_IN" | "REAL_GEMINI";
/** The reason each state may carry (GELB): FAILED carries the run's own ERR_… code; COMPLETED, RUNNING and NOT_STARTED none. */
export const AUTO_MATCH_REASONS = {
  DISABLED: ["SEMANTIC_NOT_CONFIGURED", "PROVIDER_NOT_AUTHORIZED", "DAY_LIMIT_ZERO", "NOT_PROVISIONED"],
  SKIPPED: ["NOT_PERSON", "NO_ACTIVE_POOLS"],
  PARTIAL: ["ROLES_BEYOND_BUDGET", "ROLE_FAILURES"]
} as const;
/** A run settled: the ranking can be read for it. NOT_STARTED and RUNNING are not (yet). */
export const AUTO_MATCH_SETTLED: readonly AutoMatchRunState[] = ["DISABLED", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED"];

export interface AutoMatchPool { jobPoolUploadId: string; poolName: string }
export interface AutoMatch {
  state: AutoMatchRunState;
  reason: string | null;
  evidenceClass: EvidenceClass | null;
  pools: AutoMatchPool[];
  budget: { rolesPlanned: number; rolesEvaluated: number; callsLimit: number } | null;
  investigationId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export const NECESSITY_WEIGHT = { REQUIRED: 3, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 } as const;
export type Necessity = keyof typeof NECESSITY_WEIGHT;
const SEMANTIC_VALUE: Record<SemanticRelationState, number> = { EQUIVALENT: 1, COVERS: 1, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0 };
/** The relation cache's five states (relation-cache.ts SEMANTIC_RELATION_STATES, held equal by the contract test): that module hashes
 *  with node:crypto and stays on the server, so this client module takes its types only. */
export const RANKING_SEMANTIC_STATES = Object.keys(SEMANTIC_VALUE) as SemanticRelationState[];
const LEXICAL_VALUE: Record<LexicalBasis, number> = { NAME_EXACT: 0.5, NAME_ALIAS: 0.5, NAME_COMPOSITE_CONSTITUENT: 0, WEAK_TOKEN_CONTAINMENT: 0, NONE: 0 };

export interface RankedRequirement {
  poolRequirementId: string;
  requirementText: string;
  necessity: Necessity;
  weight: number;
  source: "SEMANTIC" | "LEXICAL" | "NONE";
  state: SemanticRelationState | LexicalBasis;
  value: number;
  contribution: number;
  /** The PERSON proposal the relation rests on (the best one when several relate); null without one. */
  capabilityName: string | null;
  /** The model's explanation and its evidence limitation — SEMANTIC only. */
  explanation: string | null;
  evidenceLimitation: string | null;
  quotes: Array<{ sourceDocumentId: string; exactQuote: string }>;
}
export interface RankedRole {
  rank: number;
  tier: "SEMANTIC" | "LEXICAL_ONLY";
  role: { jobPoolUploadId: string; poolRoleId: string; title: string; organizationName: string; poolName: string };
  /** Σ(weight × value) / Σ(weight); null for a role without requirements (LEXICAL_ONLY, at the tier's end). */
  fit: number | null;
  requiredGaps: number;
  semanticCoverage: { evaluated: number; total: number };
  requirements: RankedRequirement[];
}
export interface RoleRanking {
  rankingVersion: "ROLE_RANKING_V1";
  authority: { ranking: true; decision: false; authorityState: "NONE" };
  analysisId: string;
  evidenceClass: EvidenceClass | null;
  pools: AutoMatchPool[];
  poolsDropped: string[];
  formula: { semanticValue: Record<string, number>; lexicalValue: Record<string, number>; necessityWeight: Record<string, number>; requirement: string; fit: string; order: string };
  counts: { pools: number; roles: number; ranked: number };
  ranks: RankedRole[];
}

export type AutoMatchState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; autoMatch: AutoMatch }
  | { state: "ANALYSIS_NOT_FOUND" }
  | { state: "FAILED"; code: string | null };
export type JobRankingState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; ranking: RoleRanking }
  | { state: "ANALYSIS_NOT_FOUND" }
  | { state: "NOT_PERSON" }
  | { state: "PROJECTION_ABSENT" }
  | { state: "BOUNDARY_UNRESOLVED"; reason: string | null }
  | { state: "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const isTime = (value: unknown): value is string => isText(value) && !Number.isNaN(Date.parse(value));
const exactly = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every(key => key in value);
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-6;
const isPools = (value: unknown): value is AutoMatchPool[] => Array.isArray(value) && value.every(pool => isRecord(pool) && exactly(pool, ["jobPoolUploadId", "poolName"]) && isText(pool.jobPoolUploadId) && isText(pool.poolName))
  && new Set(value.map(pool => (pool as AutoMatchPool).jobPoolUploadId)).size === value.length;
const isEvidenceClass = (value: unknown): value is EvidenceClass => value === "STAND_IN" || value === "REAL_GEMINI";

const AUTO_MATCH_KEYS = ["state", "reason", "evidenceClass", "pools", "budget", "investigationId", "startedAt", "finishedAt"] as const;

/** Strict decoder of the auto-match run (GELB §3.5 A). */
export function decodeAutoMatch(value: unknown): AutoMatch | null {
  if (!isRecord(value) || !exactly(value, AUTO_MATCH_KEYS) || !AUTO_MATCH_STATES.includes(value.state as AutoMatchRunState)) return null;
  const state = value.state as AutoMatchRunState;
  // The reason belongs to its state.
  if (state === "DISABLED" || state === "SKIPPED" || state === "PARTIAL") { if (!(AUTO_MATCH_REASONS[state] as readonly string[]).includes(value.reason as string)) return null; }
  else if (state === "FAILED") { if (!isText(value.reason) || !value.reason.startsWith("ERR_")) return null; }
  else if (value.reason !== null) return null;
  // No evidence class where no evaluation can stand (no run, switched off, skipped); a run names its own.
  const classless = state === "NOT_STARTED" || state === "DISABLED" || state === "SKIPPED";
  if (classless ? value.evidenceClass !== null : !isEvidenceClass(value.evidenceClass)) return null;
  if (!isPools(value.pools) || ((state === "NOT_STARTED" || state === "DISABLED") && value.pools.length > 0)) return null;
  if (state === "SKIPPED" && value.reason === "NO_ACTIVE_POOLS" && value.pools.length > 0) return null;
  const budget = value.budget;
  if (budget !== null && !(isRecord(budget) && exactly(budget, ["rolesPlanned", "rolesEvaluated", "callsLimit"]) && isCount(budget.rolesPlanned) && isCount(budget.rolesEvaluated) && isCount(budget.callsLimit) && budget.rolesEvaluated <= budget.rolesPlanned)) return null;
  const run = state === "RUNNING" || state === "COMPLETED" || state === "PARTIAL";
  if (run ? budget === null : (state === "NOT_STARTED" || state === "DISABLED") && budget !== null) return null;
  if (!(value.investigationId === null || (isText(value.investigationId) && INVESTIGATION_ID.test(value.investigationId)))) return null;
  if (!(value.startedAt === null || isTime(value.startedAt)) || !(value.finishedAt === null || isTime(value.finishedAt))) return null;
  if (state === "NOT_STARTED" && (value.investigationId !== null || value.startedAt !== null || value.finishedAt !== null)) return null;
  if (state === "RUNNING" && (value.startedAt === null || value.finishedAt !== null)) return null;
  return value as unknown as AutoMatch;
}

const RANKING_KEYS = ["rankingVersion", "authority", "analysisId", "evidenceClass", "pools", "poolsDropped", "formula", "counts", "ranks"] as const;
/** The backend publishes its formula with every ranking (ROLE_RANKING_FORMULA); the panel states the same weights and values, so a
 *  ranking whose formula says otherwise is not shown under that statement. Its prose fields are the backend's own. */
const sameNumbers = (value: unknown, expected: Record<string, number>) => isRecord(value) && exactly(value, Object.keys(expected)) && Object.entries(expected).every(([key, n]) => value[key] === n);
function isFormula(value: unknown): boolean {
  if (!isRecord(value) || !exactly(value, ["semanticValue", "lexicalValue", "necessityWeight", "requirement", "fit", "order"])) return false;
  const { NONE: _none, ...lexical } = LEXICAL_VALUE;
  return sameNumbers(value.semanticValue, SEMANTIC_VALUE) && sameNumbers(value.lexicalValue, lexical) && sameNumbers(value.necessityWeight, NECESSITY_WEIGHT) && isText(value.requirement) && isText(value.fit) && isText(value.order);
}
const RANK_KEYS = ["rank", "tier", "role", "fit", "requiredGaps", "semanticCoverage", "requirements"] as const;
const ROLE_KEYS = ["jobPoolUploadId", "poolRoleId", "title", "organizationName", "poolName"] as const;
const REQUIREMENT_KEYS = ["poolRequirementId", "requirementText", "necessity", "weight", "source", "state", "value", "contribution", "capabilityName", "explanation", "evidenceLimitation", "quotes"] as const;
const LEXICAL_BASES = Object.keys(LEXICAL_VALUE) as LexicalBasis[];

function decodeRequirement(value: unknown): RankedRequirement | null {
  if (!isRecord(value) || !exactly(value, REQUIREMENT_KEYS) || !isText(value.poolRequirementId) || !isText(value.requirementText)) return null;
  if (typeof value.necessity !== "string" || !Object.hasOwn(NECESSITY_WEIGHT, value.necessity) || value.weight !== NECESSITY_WEIGHT[value.necessity as Necessity]) return null;
  if (!Array.isArray(value.quotes) || !value.quotes.every(q => isRecord(q) && exactly(q, ["sourceDocumentId", "exactQuote"]) && isText(q.sourceDocumentId) && isText(q.exactQuote))) return null;
  const quoted = value.quotes.length > 0;
  let expected: number;
  if (value.source === "SEMANTIC") {
    if (!RANKING_SEMANTIC_STATES.includes(value.state as SemanticRelationState)) return null;
    // The model's statement, its limitation and the PERSON proposal it rests on are part of every semantic relation (D-RD-2);
    // a relation that claims a meeting (EQUIVALENT / COVERS / PARTIAL) carries the quotes it rests on.
    if (!isText(value.capabilityName) || !isText(value.explanation) || !isText(value.evidenceLimitation)) return null;
    if (!quoted && value.state !== "DIFFERENT" && value.state !== "UNCLEAR") return null;
    expected = SEMANTIC_VALUE[value.state as SemanticRelationState];
  } else if (value.source === "LEXICAL" || value.source === "NONE") {
    if (!LEXICAL_BASES.includes(value.state as LexicalBasis) || value.explanation !== null || value.evidenceLimitation !== null) return null;
    if (value.source === "NONE" && value.state !== "NONE") return null;
    // A name relation names the proposal it rests on; without one there is no proposal and no quote.
    if (value.state === "NONE" ? value.capabilityName !== null || quoted : !isText(value.capabilityName)) return null;
    expected = LEXICAL_VALUE[value.state as LexicalBasis];
  } else return null;
  if (value.value !== expected || typeof value.contribution !== "number" || !near(value.contribution, (value.weight as number) * expected)) return null;
  return value as unknown as RankedRequirement;
}

/** Strict decoder of ROLE_RANKING_V1 for exactly this analysis (GELB §3.4 / §3.5 B). */
export function decodeRoleRanking(value: unknown, analysisId: string): RoleRanking | null {
  if (!isRecord(value) || !exactly(value, RANKING_KEYS) || value.rankingVersion !== "ROLE_RANKING_V1" || value.analysisId !== analysisId) return null;
  const authority = value.authority;
  if (!isRecord(authority) || !exactly(authority, ["ranking", "decision", "authorityState"]) || authority.ranking !== true || authority.decision !== false || authority.authorityState !== "NONE") return null;
  if (!(value.evidenceClass === null || isEvidenceClass(value.evidenceClass)) || !isPools(value.pools)) return null;
  if (!Array.isArray(value.poolsDropped) || !value.poolsDropped.every(isText)) return null;
  if (!isFormula(value.formula)) return null;
  const counts = value.counts;
  if (!isRecord(counts) || !exactly(counts, ["pools", "roles", "ranked"]) || !isCount(counts.pools) || !isCount(counts.roles) || !isCount(counts.ranked)) return null;
  if (!Array.isArray(value.ranks) || counts.pools !== value.pools.length || counts.ranked !== value.ranks.length || counts.roles < counts.ranked) return null;
  const poolName = new Map(value.pools.map(pool => [pool.jobPoolUploadId, pool.poolName] as const));
  const seen = new Set<string>();
  let previous: RankedRole | null = null;
  for (let at = 0; at < value.ranks.length; at += 1) {
    const rank = value.ranks[at];
    if (!isRecord(rank) || !exactly(rank, RANK_KEYS) || rank.rank !== at + 1 || (rank.tier !== "SEMANTIC" && rank.tier !== "LEXICAL_ONLY")) return null;
    const role = rank.role;
    if (!isRecord(role) || !exactly(role, ROLE_KEYS) || !ROLE_KEYS.every(key => isText(role[key])) || poolName.get(role.jobPoolUploadId as string) !== role.poolName) return null;
    const key = `${role.jobPoolUploadId}\u0000${role.poolRoleId}`;
    if (seen.has(key)) return null;
    seen.add(key);
    if (!Array.isArray(rank.requirements)) return null;
    const requirements: RankedRequirement[] = [];
    for (const entry of rank.requirements) { const requirement = decodeRequirement(entry); if (requirement === null) return null; requirements.push(requirement); }
    const evaluated = requirements.filter(r => r.source === "SEMANTIC").length;
    const coverage = rank.semanticCoverage;
    if (!isRecord(coverage) || !exactly(coverage, ["evaluated", "total"]) || coverage.evaluated !== evaluated || coverage.total !== requirements.length) return null;
    // Tier SEMANTIC exactly when at least one requirement is semantically evaluated.
    if ((rank.tier === "SEMANTIC") !== (evaluated > 0)) return null;
    const weights = requirements.reduce((sum, r) => sum + r.weight, 0);
    if (requirements.length === 0 ? rank.fit !== null : typeof rank.fit !== "number" || !near(rank.fit, requirements.reduce((sum, r) => sum + r.contribution, 0) / weights)) return null;
    const required = requirements.filter(r => r.necessity === "REQUIRED").length;
    if (!isCount(rank.requiredGaps) || rank.requiredGaps > required) return null;
    const current = rank as unknown as RankedRole;
    // Order: SEMANTIC before LEXICAL_ONLY; inside a tier fit descending, a role without requirements (fit null) at the tier's end.
    if (previous !== null) {
      if (previous.tier === "LEXICAL_ONLY" && current.tier === "SEMANTIC") return null;
      if (previous.tier === current.tier) {
        if (previous.fit === null && current.fit !== null) return null;
        if (previous.fit !== null && current.fit !== null && current.fit > previous.fit + 1e-9) return null;
      }
    }
    previous = current;
  }
  // The evidence class is null exactly when no semantic relation stands in the ranking.
  const semantic = (value.ranks as RankedRole[]).some(rank => rank.tier === "SEMANTIC");
  if ((value.evidenceClass === null) === semantic) return null;
  return value as unknown as RoleRanking;
}

export const autoMatchUrl = (analysisId: string) => `/api/career/analyses/${encodeURIComponent(analysisId)}/auto-match`;
export const jobRankingUrl = (analysisId: string) => `/api/career/analyses/${encodeURIComponent(analysisId)}/job-ranking`;

async function read(url: string, fetcher: Fetcher, signal?: AbortSignal): Promise<{ status: number; body: unknown } | null> {
  let response;
  try { response = await fetcher(url, { method: "GET", cache: "no-store", signal }); } catch { return null; }
  let body: unknown = null;
  try { body = await response.json(); } catch { /* an undecodable body is FAILED below */ }
  return { status: response.status, body };
}
const firstIssue = (body: unknown) => isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) ? body.issues[0] : null;

export async function readAutoMatch(analysisId: string, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<AutoMatchState> {
  const answer = await read(autoMatchUrl(analysisId), fetcher, signal);
  if (answer === null) return { state: "FAILED", code: null };
  if (answer.status === 200) {
    const autoMatch = isRecord(answer.body) && answer.body.success === true ? decodeAutoMatch(answer.body.autoMatch) : null;
    return autoMatch === null ? { state: "FAILED", code: null } : { state: "AVAILABLE", autoMatch };
  }
  const code = firstIssue(answer.body)?.code;
  if (answer.status === 404 && code === "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND") return { state: "ANALYSIS_NOT_FOUND" };
  return { state: "FAILED", code: isText(code) ? code : null };
}

export async function readJobRanking(analysisId: string, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<JobRankingState> {
  const answer = await read(jobRankingUrl(analysisId), fetcher, signal);
  if (answer === null) return { state: "FAILED", code: null };
  if (answer.status === 200) {
    const ranking = isRecord(answer.body) && answer.body.success === true ? decodeRoleRanking(answer.body.ranking, analysisId) : null;
    return ranking === null ? { state: "FAILED", code: null } : { state: "AVAILABLE", ranking };
  }
  const issue = firstIssue(answer.body);
  const code = isText(issue?.code) ? issue.code : null;
  if (answer.status === 404 && code === "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND") return { state: "ANALYSIS_NOT_FOUND" };
  if (code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON") return { state: "NOT_PERSON" };
  if (code === "ERR_ROLE_DISCOVERY_PROJECTION_ABSENT") return { state: "PROJECTION_ABSENT" };
  if (code === "ERR_ROLE_DISCOVERY_BOUNDARY_UNRESOLVED") return { state: "BOUNDARY_UNRESOLVED", reason: isText(issue?.reason) ? issue.reason : null };
  if (answer.status === 503 && code === "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED") return { state: "NOT_PROVISIONED" };
  return { state: "FAILED", code };
}

/** Bounded wait for a run that has not settled (GELB: NOT_STARTED is also every older analysis's lasting state). */
export const AUTO_MATCH_POLL = { intervalMs: 2000, maxMs: 180_000 } as const;
export interface AutoMatchWatch { read: AutoMatchState; /** The bounded wait ended with the run still NOT_STARTED or RUNNING. */ waitedOut: boolean }

/**
 * The run of the analysis on view: one GET at once, then one every 2 s while it is NOT_STARTED or RUNNING, for at most 3 min
 * (GET only; the worker starts and runs it, nothing here does). A settled state, a read failure or the end of the wait stops it;
 * a new analysis (or none) aborts the open read and drops a late answer.
 */
export function useAutoMatch(analysisId: string | null, fetcher?: Fetcher, poll: { intervalMs: number; maxMs: number } = AUTO_MATCH_POLL): AutoMatchWatch {
  const [entry, setEntry] = useState<{ key: string | null; value: AutoMatchWatch }>({ key: null, value: { read: { state: "IDLE" }, waitedOut: false } });
  const generation = useRef(0);
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (analysisId === null) { setEntry({ key: null, value: { read: { state: "IDLE" }, waitedOut: false } }); return; }
    const controller = new AbortController();
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const live = () => generation.current === current && !controller.signal.aborted;
    const once = () => {
      void readAutoMatch(analysisId, fetcher, controller.signal)
        .catch((): AutoMatchState => ({ state: "FAILED", code: null }))
        .then(read => {
          if (!live()) return;
          const open = read.state === "AVAILABLE" && (read.autoMatch.state === "NOT_STARTED" || read.autoMatch.state === "RUNNING");
          const waitedOut = open && Date.now() - started + poll.intervalMs > poll.maxMs;
          setEntry({ key: analysisId, value: { read, waitedOut } });
          if (open && !waitedOut) timer = setTimeout(once, poll.intervalMs);
        });
    };
    setEntry({ key: analysisId, value: { read: { state: "LOADING" }, waitedOut: false } });
    once();
    return () => { controller.abort(); if (timer !== null) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one watch per analysis; the fetcher and the schedule are fixed per mount.
  }, [analysisId]);
  return entry.key === analysisId && analysisId !== null ? entry.value : { read: analysisId === null ? { state: "IDLE" } : { state: "LOADING" }, waitedOut: false };
}

/**
 * The ranking, read once per settled run: `settledKey` names the run's settled state (state + finish time), or the end of the
 * bounded wait; null while the run is open — nothing is read then. A new key reads again (GET), a late answer is dropped.
 */
export function useJobRanking(analysisId: string | null, settledKey: string | null, fetcher?: Fetcher): JobRankingState {
  const key = analysisId === null || settledKey === null ? null : JSON.stringify([analysisId, settledKey]);
  const [entry, setEntry] = useState<{ key: string | null; value: JobRankingState }>({ key: null, value: { state: "IDLE" } });
  const generation = useRef(0);
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (key === null) { setEntry({ key: null, value: { state: "IDLE" } }); return; }
    const controller = new AbortController();
    setEntry({ key, value: { state: "LOADING" } });
    void readJobRanking(analysisId!, fetcher, controller.signal)
      .catch((): JobRankingState => ({ state: "FAILED", code: null }))
      .then(value => { if (generation.current === current && !controller.signal.aborted) setEntry({ key, value }); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key carries the analysis and the settled run.
  }, [key]);
  return entry.key === key ? entry.value : key === null ? { state: "IDLE" } : { state: "LOADING" };
}

/** When the ranking may be read: a settled run (its state and finish time), or the bounded wait's end; otherwise null. */
export function rankingKey(watch: AutoMatchWatch): string | null {
  const read = watch.read;
  if (read.state !== "AVAILABLE") return null;
  if (AUTO_MATCH_SETTLED.includes(read.autoMatch.state)) return `${read.autoMatch.state}:${read.autoMatch.finishedAt ?? ""}`;
  return watch.waitedOut ? `WAITED_OUT:${read.autoMatch.state}` : null;
}
