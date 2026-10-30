import { sql } from "drizzle-orm";
import { verifyDisposableTestDatabase } from "../../database-isolation/verification";
import { db } from "../db/client";
import { createLocalJobPoolApplication } from "./local-composition";
import { POOL_ROLE_DISCOVERY_MAX_POOLS, ROLE_LEXICAL_STATUSES, buildPoolRoleDiscovery, type PoolRoleDiscovery } from "./pool-role-discovery";
import { loadPersonOperandBase, loadRoleDiscoveryOperand, type OperandIssue } from "./role-discovery-operand";
import { engineVersionHash, proposalContentHash, relationKey, requirementContentHash, type CachedRelation, type RelationEngineIdentity } from "./relation-cache";
import { PostgresRelationCacheRepository } from "./relation-cache-repository";
import { SEMANTIC_ROLES_HARD_CAP, evidenceClassOfProvider, readSemanticConfig, type SemanticConfig } from "./semantic-config";
import { startSemanticInvestigation } from "./semantic-investigation-start";
import { PostgresInvestigationStore, type AutomaticRunRow, type InvestigationStatus, type TaskStatus } from "./semantic-investigation-store";
import { PARTIAL_ADMISSION_CODE } from "./semantic-investigation-run";
import { TRANSIENT_PROVIDER_CODE } from "./semantic-relation-engine";
import { providerCallUsage, settleStaleProviderCalls } from "../provider-calls/register";
import { buildRoleRanking, pickBestFinding, type RoleRanking, type SemanticFinding } from "./role-ranking";
import type { JobPoolUploadSummary } from "./types";

/**
 * The automatic match of the product path (owner mandate AUTOMATED_CAPABILITY_TO_JOB_EXECUTE, 2026-10-30): after a PERSON analysis
 * succeeded, the capabilities are related to the existing ACTIVE job pools without any further input. No new table: the run IS the
 * semantic investigation of the existing engine (marked `auto`, idempotent by `auto:<analysisId>`), so budget, ledger, cache and
 * admission are the unchanged ones. The reads (`readAutoMatch`, `buildAnalysisRanking`) never write, never register a table and
 * never call a model.
 */
export const AUTO_MATCH_REQUEST_PREFIX = "auto:";
export type AutoMatchState = "NOT_STARTED" | "DISABLED" | "RUNNING" | "STALLED" | "COMPLETED" | "PARTIAL" | "FAILED" | "SKIPPED";
export interface AutoMatchView {
  state: AutoMatchState; reason: string | null; evidenceClass: "STAND_IN" | "REAL_GEMINI" | null;
  pools: Array<{ jobPoolUploadId: string; poolName: string }>;
  /** callsUsed: model calls the register holds for the job (null: no register); callsJobLimit: the job budget (null: none). */
  budget: { rolesPlanned: number; rolesEvaluated: number; callsLimit: number; callsUsed: number | null; callsJobLimit: number | null } | null;
  investigationId: string | null; startedAt: string | null; finishedAt: string | null;
  /** 0 = the first run; > 0 = an automatic continuation of an earlier run that stopped early. */
  revision: number; lastProgressAt: string | null; leaseExpiresAt: string | null;
  /** A continuation of this run is due and has not started yet (a partial run keeps being read until it has). */
  resumePending: boolean;
}
export type Outcome<T> = { ok: true; value: T } | { ok: false; issue: OperandIssue };

const text = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const evidenceClass = (provider: string): AutoMatchView["evidenceClass"] => { const c = evidenceClassOfProvider(provider); return c === "STAND_IN" || c === "REAL_GEMINI" ? c : null; };

/** The authorized pools of the mandate: every ACTIVE job pool, in a deterministic order, at most the discovery limit. */
export function activePoolSnapshot(summaries: JobPoolUploadSummary[]): JobPoolUploadSummary[] {
  return summaries.filter(p => p.poolStatus === "ACTIVE").sort((a, b) => text(a.poolName, b.poolName) || text(a.jobPoolUploadId, b.jobPoolUploadId)).slice(0, POOL_ROLE_DISCOVERY_MAX_POOLS);
}

/** The roles that get a semantic evaluation within the budget: most name-related first (the lexical groups in their fixed order), then the discovery order. */
export function selectAutomaticRoles(discovery: Pick<PoolRoleDiscovery, "roles">, max: number): Array<{ jobPoolUploadId: string; poolRoleId: string }> {
  const order = (status: string) => ROLE_LEXICAL_STATUSES.indexOf(status as never);
  return discovery.roles.map((role, index) => ({ role, index })).filter(({ role }) => role.counts.requirements > 0)
    .sort((a, b) => order(a.role.status) - order(b.role.status) || a.index - b.index).slice(0, Math.max(0, max)).map(({ role }) => ({ ...role.key }));
}

export function disabledReason(config: SemanticConfig): string | null {
  if (config.state === "NOT_CONFIGURED") return "SEMANTIC_NOT_CONFIGURED";
  if (config.state === "PROVIDER_NOT_AUTHORIZED") return "PROVIDER_NOT_AUTHORIZED";
  return config.dayLimit < 1 ? "DAY_LIMIT_ZERO" : null;
}

/** An analysis without any capability proposal has nothing to compare: no run, no claim that roles were checked. */
export const hasCapabilityProposals = (projection: { capabilities: unknown[] }): boolean => projection.capabilities.length > 0;

export type AutoMatchOutcome = { outcome: "DISABLED" | "SKIPPED" | "FAILED" | "STARTED"; reason: string | null; investigationId?: string };

/**
 * Runs the automatic match of ONE analysis (called by the worker after the analysis job succeeded; never fails that job). Without a
 * READY configuration and a budget nothing happens. One semantic investigation with at most the configured number of roles; the ledger
 * limits every call; a repeated call returns the stored investigation and runs nothing.
 */
export async function runAutoMatch(analysisId: string, now: () => string = () => new Date().toISOString(), runnerId?: string): Promise<AutoMatchOutcome> {
  const config = readSemanticConfig();
  const reason = disabledReason(config);
  if (config.state !== "READY" || reason !== null) return { outcome: "DISABLED", reason: reason ?? "SEMANTIC_NOT_CONFIGURED" };
  const pools = activePoolSnapshot(await (await createLocalJobPoolApplication()).list());
  if (pools.length === 0) return { outcome: "SKIPPED", reason: "NO_ACTIVE_POOLS" };
  const ids = pools.map(p => p.jobPoolUploadId);
  const operand = await loadRoleDiscoveryOperand(analysisId, ids);
  if (!operand.ok) return operand.issue.code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" ? { outcome: "SKIPPED", reason: "NOT_PERSON" } : { outcome: "FAILED", reason: operand.issue.code };
  if (!hasCapabilityProposals(operand.projection)) return { outcome: "SKIPPED", reason: "NO_PROPOSALS" };
  const roleKeys = selectAutomaticRoles(operand.discovery, Math.min(config.maxRoles, SEMANTIC_ROLES_HARD_CAP));
  if (roleKeys.length === 0) return { outcome: "SKIPPED", reason: "NO_ACTIVE_POOLS" };
  const started = await startSemanticInvestigation({
    analysisId, config, jobPoolUploadIds: ids, roleKeys, clientRequestId: `${AUTO_MATCH_REQUEST_PREFIX}${analysisId}`, confirmedCalls: "AS_PLANNED", now, ...(runnerId ? { runnerId } : {}),
    requestExtra: { auto: true, resumable: true, revision: 0, engine: config.engine, rolesTotal: operand.discovery.roles.filter(r => r.counts.requirements > 0).length }
  });
  if (started.kind === "ISSUE") {
    // A database that is not a verified disposable one gets no table: nothing is written and the state says why (DISABLED, never a silent FAILED).
    if (started.code === "ERR_RELATION_CACHE_UNAVAILABLE" && started.extra?.cache === "NOT_PROVISIONED") return { outcome: "DISABLED", reason: "NOT_PROVISIONED" };
    return { outcome: "FAILED", reason: started.code };
  }
  return { outcome: "STARTED", reason: null, investigationId: started.investigationId };
}

/** A continuation may follow a run that stopped early at most this many times (so a run is asked at most 3 times in all). */
export const AUTO_MATCH_MAX_REVISIONS = 2;
/** A partial run waits this long before it is continued; a continuation due for longer than the window is no longer announced. */
export const AUTO_MATCH_RESUME_DELAY_MS = 60_000;
export const AUTO_MATCH_RESUME_WINDOW_MS = 10 * 60_000;
/** A run without a lease (started before leases existed) counts as abandoned after this long without any movement. */
export const AUTO_MATCH_LEGACY_STALL_MS = 5 * 60_000;

const revisionOf = (request: Record<string, unknown>) => (typeof request.revision === "number" && Number.isInteger(request.revision) && request.revision >= 0 ? request.revision : 0);
/** Tasks a continuation can still do: a TRANSIENT provider failure, or work a lost worker left open. Never a refusal, a permanent failure or a spent budget. */
export function hasRetryableTasks(tasks: Array<{ status: TaskStatus; errorCode: string | null }>): boolean {
  if (tasks.some(t => t.status === "BUDGET_EXHAUSTED")) return false;
  return tasks.some(t => (t.status === "FAILED" && t.errorCode === TRANSIENT_PROVIDER_CODE) || t.status === "INTERRUPTED" || t.status === "CANCELLED");
}

/** The view of a stored automatic investigation (pure). `now` decides whether a run still has a live lease and whether a continuation is due. */
export function viewOfAutoInvestigation(input: {
  investigation: { investigationId: string; provider: string; status: InvestigationStatus; createdAt: string; updatedAt: string; request: Record<string, unknown>; leaseExpiresAt?: string | null };
  tasks: Array<{ status: TaskStatus; errorCode: string | null }>; poolNames: Map<string, string>;
  now?: string; lastProgressAt?: string | null; usage?: { used: number; limit: number | null } | null;
}): AutoMatchView {
  const { investigation, tasks } = input;
  const request = investigation.request;
  const now = input.now ?? new Date().toISOString();
  const uploads = Array.isArray(request.uploads) ? request.uploads.filter((u): u is string => typeof u === "string") : [];
  const planned = Array.isArray(request.roles) ? request.roles.length : tasks.length;
  const rolesTotal = typeof request.rolesTotal === "number" ? request.rolesTotal : planned;
  const evaluated = tasks.filter(t => t.status === "SUCCEEDED" || t.status === "CACHED").length;
  const open = investigation.status === "PLANNED" || investigation.status === "RUNNING";
  const revision = revisionOf(request);
  const resumable = request.resumable === true && revision < AUTO_MATCH_MAX_REVISIONS;
  const leaseExpiresAt = investigation.leaseExpiresAt ?? null;
  const lost = open && (leaseExpiresAt !== null ? leaseExpiresAt < now : Date.parse(investigation.updatedAt) + AUTO_MATCH_LEGACY_STALL_MS < Date.parse(now));
  const recentEnough = Date.parse(investigation.updatedAt) + AUTO_MATCH_RESUME_WINDOW_MS > Date.parse(now);
  let state: AutoMatchState; let reason: string | null = null;
  if (open) { state = lost ? "STALLED" : "RUNNING"; reason = lost ? "WORKER_LOST" : null; }
  else if (investigation.status === "INTERRUPTED" && resumable && recentEnough) { state = "STALLED"; reason = "WORKER_LOST"; }
  else if (investigation.status === "COMPLETED") {
    const beyond = rolesTotal > planned;
    state = beyond || tasks.some(t => t.errorCode === PARTIAL_ADMISSION_CODE) ? "PARTIAL" : "COMPLETED";
    reason = beyond ? "ROLES_BEYOND_BUDGET" : state === "PARTIAL" ? "PAIRS_REFUSED" : null;
  }
  else if (investigation.status === "PARTIAL") { state = "PARTIAL"; reason = tasks.some(t => t.status === "FAILED") ? "ROLE_FAILURES" : tasks.some(t => t.status === "BUDGET_EXHAUSTED") ? "DAY_BUDGET_EXHAUSTED" : tasks.some(t => t.errorCode === PARTIAL_ADMISSION_CODE) ? "PAIRS_REFUSED" : "ROLES_BEYOND_BUDGET"; }
  else { state = "FAILED"; reason = investigation.status === "INTERRUPTED" ? "ERR_INVESTIGATION_INTERRUPTED" : tasks.find(t => t.errorCode)?.errorCode ?? "ERR_AUTO_MATCH_FAILED"; }
  // Due: the run stopped early for a reason a continuation can do something about, it may still be continued, and the window has not passed.
  const resumePending = !open && resumable && recentEnough && hasRetryableTasks(tasks) && (investigation.status === "PARTIAL" || investigation.status === "FAILED" || investigation.status === "INTERRUPTED");
  return {
    state, reason, evidenceClass: evidenceClass(investigation.provider),
    pools: uploads.map(id => ({ jobPoolUploadId: id, poolName: input.poolNames.get(id) ?? id })),
    budget: { rolesPlanned: planned, rolesEvaluated: evaluated, callsLimit: typeof request.callsNeeded === "number" ? request.callsNeeded : 0, callsUsed: input.usage ? input.usage.used : null, callsJobLimit: input.usage ? input.usage.limit : null },
    investigationId: investigation.investigationId, startedAt: investigation.createdAt, finishedAt: open ? null : investigation.updatedAt,
    revision, lastProgressAt: input.lastProgressAt ?? investigation.updatedAt, leaseExpiresAt, resumePending
  };
}

/** The engine identity a run stored in its request; anything malformed counts as absent. */
export function engineOfRequest(request: Record<string, unknown>): RelationEngineIdentity | null {
  const e = request.engine as Record<string, unknown> | undefined;
  return e && typeof e.contractVersion === "string" && typeof e.promptChecksum === "string" && typeof e.provider === "string" && typeof e.model === "string"
    ? { contractVersion: e.contractVersion, promptChecksum: e.promptChecksum, provider: e.provider, model: e.model } : null;
}

const tableExists = async (table: string) => ((await db.execute(sql.raw(`SELECT to_regclass('${table}') IS NOT NULL AS e`))) as unknown as Array<{ e: boolean }>)[0].e;
const EMPTY: Omit<AutoMatchView, "state" | "reason"> = { evidenceClass: null, pools: [], budget: null, investigationId: null, startedAt: null, finishedAt: null, revision: 0, lastProgressAt: null, leaseExpiresAt: null, resumePending: false };

/** GET: derived from the stored investigation, else from the configuration and the analysis. Writes nothing, registers nothing, calls no model. */
export async function readAutoMatch(analysisId: string): Promise<Outcome<AutoMatchView>> {
  const base = await loadPersonOperandBase(analysisId);
  if (!base.ok && base.issue.status === 404) return base;
  const application = await createLocalJobPoolApplication();
  const summaries = await application.list();
  if (await tableExists("career_relation_investigations")) {
    const store = new PostgresInvestigationStore(db.$client);
    const run = await store.latestAutomatic(analysisId);
    if (run) {
      const jobId = base.ok ? base.investigation.jobId : null;
      const usage = jobId !== null && await tableExists("career_provider_calls") ? await providerCallUsage(db.$client, jobId) : null;
      return { ok: true, value: viewOfAutoInvestigation({
        investigation: run, tasks: await store.tasks(run.investigationId), poolNames: new Map(summaries.map(p => [p.jobPoolUploadId, p.poolName] as const)),
        lastProgressAt: await store.lastProgressAt(run.investigationId), usage: usage ? { used: usage.sent, limit: usage.limit } : null
      }) };
    }
  }
  const reason = disabledReason(readSemanticConfig());
  if (reason !== null) return { ok: true, value: { state: "DISABLED", reason, ...EMPTY } };
  // The run needs the investigation tables, which exist only on a verified disposable database (same gate as the relation cache).
  if (!(await tableExists("career_relation_investigations")) && (await verifyDisposableTestDatabase(process.env.DATABASE_URL).then(() => true, () => false)) === false) return { ok: true, value: { state: "DISABLED", reason: "NOT_PROVISIONED", ...EMPTY } };
  if (!base.ok) return { ok: true, value: { state: base.issue.code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" ? "SKIPPED" : "NOT_STARTED", reason: base.issue.code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" ? "NOT_PERSON" : null, ...EMPTY } };
  if (activePoolSnapshot(summaries).length === 0) return { ok: true, value: { state: "SKIPPED", reason: "NO_ACTIVE_POOLS", ...EMPTY } };
  if (!hasCapabilityProposals(base.projection)) return { ok: true, value: { state: "SKIPPED", reason: "NO_PROPOSALS", ...EMPTY } };
  return { ok: true, value: { state: "NOT_STARTED", reason: null, ...EMPTY } };
}

/**
 * Continues a run that stopped early (point 1 and 3): one successor run `auto:<analysisId>:r<n>` over the same pools and roles. Every
 * pair a predecessor stored is found in the relation cache, so only what is still missing is asked (and counted by the call
 * register against the same job budget). Idempotent: two workers that race for the same revision get one run.
 */
export async function continueAutoRun(run: AutomaticRunRow, now: () => string = () => new Date().toISOString(), runnerId?: string): Promise<AutoMatchOutcome> {
  const revision = revisionOf(run.request);
  if (run.request.resumable !== true || revision >= AUTO_MATCH_MAX_REVISIONS) return { outcome: "SKIPPED", reason: "NOT_RESUMABLE" };
  const config = readSemanticConfig();
  const reason = disabledReason(config);
  if (config.state !== "READY" || reason !== null) return { outcome: "DISABLED", reason: reason ?? "SEMANTIC_NOT_CONFIGURED" };
  const previousEngine = engineOfRequest(run.request);
  if (previousEngine === null || engineVersionHash(previousEngine) !== engineVersionHash(config.engine)) return { outcome: "SKIPPED", reason: "ENGINE_CHANGED" };
  const uploads = Array.isArray(run.request.uploads) ? run.request.uploads.filter((u): u is string => typeof u === "string") : [];
  const roles = Array.isArray(run.request.roles) ? run.request.roles.filter((r): r is { jobPoolUploadId: string; poolRoleId: string } => !!r && typeof (r as Record<string, unknown>).jobPoolUploadId === "string" && typeof (r as Record<string, unknown>).poolRoleId === "string") : [];
  if (uploads.length === 0 || roles.length === 0) return { outcome: "SKIPPED", reason: "NOT_RESUMABLE" };
  const started = await startSemanticInvestigation({
    analysisId: run.analysisId, config, jobPoolUploadIds: uploads, roleKeys: roles, clientRequestId: `${AUTO_MATCH_REQUEST_PREFIX}${run.analysisId}:r${revision + 1}`, confirmedCalls: "AS_PLANNED", now, ...(runnerId ? { runnerId } : {}),
    requestExtra: { auto: true, resumable: true, revision: revision + 1, previous: run.investigationId, engine: config.engine, rolesTotal: typeof run.request.rolesTotal === "number" ? run.request.rolesTotal : roles.length }
  });
  if (started.kind === "ISSUE") return { outcome: "FAILED", reason: started.code };
  return { outcome: "STARTED", reason: null, investigationId: started.investigationId };
}

/**
 * The sweep every worker runs now and then (point 3): closes call-register rows a crashed worker left behind, takes over runs whose
 * lease ran out (race-free: one conditional update wins) and continues runs that stopped early for a reason a continuation can do
 * something about. Only runs marked resumable are touched (runs from before this existed are left as they are). Never throws.
 */
export async function resumeAutoMatches(now: () => string = () => new Date().toISOString(), runnerId?: string): Promise<{ settled: number; interrupted: number; continued: number }> {
  const result = { settled: 0, interrupted: 0, continued: 0 };
  if (!(await tableExists("career_relation_investigations"))) return result;
  const at = now();
  if (await tableExists("career_provider_calls")) { const settled = await settleStaleProviderCalls(db.$client, at); result.settled = settled.unknown + settled.released; }
  const store = new PostgresInvestigationStore(db.$client);
  const legacyBefore = new Date(Date.parse(at) - AUTO_MATCH_LEGACY_STALL_MS).toISOString();
  for (const row of await store.abandonedAutomatic(at, legacyBefore)) {
    if (!(await store.interruptAbandoned(row.investigationId, at, legacyBefore))) continue;
    result.interrupted += 1;
    if (row.request.resumable === true && (await continueAutoRun(row, now, runnerId)).outcome === "STARTED") result.continued += 1;
  }
  const due = new Date(Date.parse(at) - AUTO_MATCH_RESUME_DELAY_MS).toISOString();
  for (const row of await store.resumableAutomatic(due)) {
    if (Date.parse(row.updatedAt) + AUTO_MATCH_RESUME_WINDOW_MS <= Date.parse(at)) continue;
    const latest = await store.latestAutomatic(row.analysisId);
    if (latest?.investigationId !== row.investigationId || !hasRetryableTasks(await store.tasks(row.investigationId))) continue;
    if ((await continueAutoRun(row, now, runnerId)).outcome === "STARTED") result.continued += 1;
  }
  return result;
}

/** GET: the explainable ranking over the pools of the run (or the current ACTIVE pools) and the stored relations of the configured engine. Read only. */
export async function buildAnalysisRanking(analysisId: string): Promise<Outcome<RoleRanking>> {
  const base = await loadPersonOperandBase(analysisId);
  if (!base.ok) return base;
  const summaries = await (await createLocalJobPoolApplication()).list();
  const active = new Set(summaries.filter(p => p.poolStatus === "ACTIVE").map(p => p.jobPoolUploadId));
  let snapshot = activePoolSnapshot(summaries).map(p => p.jobPoolUploadId);
  // The engine that produced the relations is the engine OF THE RUN (a later change of the configuration must not hide earlier results).
  let runEngine: RelationEngineIdentity | null = null;
  if (await tableExists("career_relation_investigations")) {
    const run = await new PostgresInvestigationStore(db.$client).latestAutomatic(analysisId);
    if (run && Array.isArray(run.request.uploads)) snapshot = run.request.uploads.filter((u): u is string => typeof u === "string");
    runEngine = run ? engineOfRequest(run.request) : null;
  }
  const keep = snapshot.filter(id => active.has(id));
  const poolsDropped = snapshot.filter(id => !active.has(id));
  let discovery: PoolRoleDiscovery; let pools: Array<{ pool: { requirements: Array<{ id: string; role_id: string } & Record<string, unknown>> }; jobPoolUploadId: string }> = [];
  if (keep.length === 0) discovery = buildPoolRoleDiscovery({ analysis: { analysisId, jobId: base.investigation.jobId, discoveryRunId: base.investigation.discoveryRunId }, projection: base.projection, pools: [] });
  else {
    const operand = await loadRoleDiscoveryOperand(analysisId, keep);
    if (!operand.ok) return operand;
    discovery = operand.discovery; pools = operand.pools as never;
  }
  const config = readSemanticConfig();
  const engine: RelationEngineIdentity | null = runEngine ?? (config.state === "READY" ? config.engine : null);
  const findings = new Map<string, SemanticFinding>();
  if (engine !== null && discovery.roles.length > 0 && await tableExists("career_proposal_requirement_relations")) {
    const engineHash = engineVersionHash(engine);
    const proposalHashes = base.projection.capabilities.map(c => ({ capability: c, hash: proposalContentHash(c) }));
    const content = new Map<string, unknown>(pools.flatMap(p => p.pool.requirements.map(r => [`${p.jobPoolUploadId}\u0000${r.role_id}\u0000${r.id}`, r] as [string, unknown])));
    const keyed: Array<{ requirementKey: string; relationKey: string }> = [];
    for (const role of discovery.roles) for (const requirement of role.requirements) {
      const requirementKey = `${requirement.key.jobPoolUploadId}\u0000${requirement.key.poolRoleId}\u0000${requirement.key.poolRequirementId}`;
      const pool = content.get(requirementKey);
      if (!pool) continue;
      const requirementHash = requirementContentHash(pool as never);
      for (const p of proposalHashes) keyed.push({ requirementKey, relationKey: relationKey(p.hash, requirementHash, engineHash) });
    }
    const stored = new Map((await new PostgresRelationCacheRepository(db.$client).getByKeys(keyed.map(k => k.relationKey))).map(r => [r.relationKey, r] as const));
    const candidates = new Map<string, SemanticFinding[]>();
    for (const k of keyed) {
      const relation: CachedRelation | undefined = stored.get(k.relationKey);
      if (!relation) continue;
      const list = candidates.get(k.requirementKey) ?? [];
      list.push({ state: relation.state, capabilityName: relation.capabilityName, explanation: relation.relationExplanation, evidenceLimitation: relation.evidenceLimitation, quotes: relation.sourceEvidence.map(q => ({ ...q })) });
      candidates.set(k.requirementKey, list);
    }
    for (const [requirementKey, list] of candidates) { const best = pickBestFinding(list); if (best) findings.set(requirementKey, best); }
  }
  const ranking = buildRoleRanking({
    analysisId, discovery, poolsDropped,
    findingFor: r => findings.get(`${r.key.jobPoolUploadId}\u0000${r.key.poolRoleId}\u0000${r.key.poolRequirementId}`) ?? null,
    evidenceClass: findings.size > 0 && engine !== null ? evidenceClassOfProvider(engine.provider) : null
  });
  return { ok: true, value: ranking };
}

