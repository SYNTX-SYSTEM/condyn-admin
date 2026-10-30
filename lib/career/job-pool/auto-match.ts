import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { createLocalJobPoolApplication } from "./local-composition";
import { POOL_ROLE_DISCOVERY_MAX_POOLS, ROLE_LEXICAL_STATUSES, buildPoolRoleDiscovery, type PoolRoleDiscovery } from "./pool-role-discovery";
import { loadPersonOperandBase, loadRoleDiscoveryOperand, type OperandIssue } from "./role-discovery-operand";
import { engineVersionHash, proposalContentHash, relationKey, requirementContentHash, type CachedRelation } from "./relation-cache";
import { PostgresRelationCacheRepository } from "./relation-cache-repository";
import { SEMANTIC_ROLES_HARD_CAP, evidenceClassOfProvider, readSemanticConfig, type SemanticConfig } from "./semantic-config";
import { startSemanticInvestigation } from "./semantic-investigation-start";
import { PostgresInvestigationStore, type InvestigationStatus, type TaskStatus } from "./semantic-investigation-store";
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
export type AutoMatchState = "NOT_STARTED" | "DISABLED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "SKIPPED";
export interface AutoMatchView {
  state: AutoMatchState; reason: string | null; evidenceClass: "STAND_IN" | "REAL_GEMINI" | null;
  pools: Array<{ jobPoolUploadId: string; poolName: string }>;
  budget: { rolesPlanned: number; rolesEvaluated: number; callsLimit: number } | null;
  investigationId: string | null; startedAt: string | null; finishedAt: string | null;
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

export type AutoMatchOutcome = { outcome: "DISABLED" | "SKIPPED" | "FAILED" | "STARTED"; reason: string | null; investigationId?: string };

/**
 * Runs the automatic match of ONE analysis (called by the worker after the analysis job succeeded; never fails that job). Without a
 * READY configuration and a budget nothing happens. One semantic investigation with at most the configured number of roles; the ledger
 * limits every call; a repeated call returns the stored investigation and runs nothing.
 */
export async function runAutoMatch(analysisId: string, now: () => string = () => new Date().toISOString()): Promise<AutoMatchOutcome> {
  const config = readSemanticConfig();
  const reason = disabledReason(config);
  if (config.state !== "READY" || reason !== null) return { outcome: "DISABLED", reason: reason ?? "SEMANTIC_NOT_CONFIGURED" };
  const pools = activePoolSnapshot(await (await createLocalJobPoolApplication()).list());
  if (pools.length === 0) return { outcome: "SKIPPED", reason: "NO_ACTIVE_POOLS" };
  const ids = pools.map(p => p.jobPoolUploadId);
  const operand = await loadRoleDiscoveryOperand(analysisId, ids);
  if (!operand.ok) return operand.issue.code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" ? { outcome: "SKIPPED", reason: "NOT_PERSON" } : { outcome: "FAILED", reason: operand.issue.code };
  const roleKeys = selectAutomaticRoles(operand.discovery, Math.min(config.maxRoles, SEMANTIC_ROLES_HARD_CAP));
  if (roleKeys.length === 0) return { outcome: "SKIPPED", reason: "NO_ACTIVE_POOLS" };
  const started = await startSemanticInvestigation({
    analysisId, config, jobPoolUploadIds: ids, roleKeys, clientRequestId: `${AUTO_MATCH_REQUEST_PREFIX}${analysisId}`, confirmedCalls: "AS_PLANNED", now,
    requestExtra: { auto: true, rolesTotal: operand.discovery.roles.filter(r => r.counts.requirements > 0).length }
  });
  if (started.kind === "ISSUE") return { outcome: "FAILED", reason: started.code };
  return { outcome: "STARTED", reason: null, investigationId: started.investigationId };
}

/** The view of a stored automatic investigation (pure). */
export function viewOfAutoInvestigation(input: {
  investigation: { investigationId: string; provider: string; status: InvestigationStatus; createdAt: string; updatedAt: string; request: Record<string, unknown> };
  tasks: Array<{ status: TaskStatus; errorCode: string | null }>; poolNames: Map<string, string>;
}): AutoMatchView {
  const { investigation, tasks } = input;
  const request = investigation.request;
  const uploads = Array.isArray(request.uploads) ? request.uploads.filter((u): u is string => typeof u === "string") : [];
  const planned = Array.isArray(request.roles) ? request.roles.length : tasks.length;
  const rolesTotal = typeof request.rolesTotal === "number" ? request.rolesTotal : planned;
  const evaluated = tasks.filter(t => t.status === "SUCCEEDED" || t.status === "CACHED").length;
  const terminal = !(investigation.status === "PLANNED" || investigation.status === "RUNNING");
  let state: AutoMatchState; let reason: string | null = null;
  if (!terminal) state = "RUNNING";
  else if (investigation.status === "COMPLETED") { state = rolesTotal > planned ? "PARTIAL" : "COMPLETED"; reason = state === "PARTIAL" ? "ROLES_BEYOND_BUDGET" : null; }
  else if (investigation.status === "PARTIAL") { state = "PARTIAL"; reason = tasks.some(t => t.status === "FAILED") ? "ROLE_FAILURES" : "ROLES_BEYOND_BUDGET"; }
  else { state = "FAILED"; reason = investigation.status === "INTERRUPTED" ? "ERR_INVESTIGATION_INTERRUPTED" : tasks.find(t => t.errorCode)?.errorCode ?? "ERR_AUTO_MATCH_FAILED"; }
  return {
    state, reason, evidenceClass: evidenceClass(investigation.provider),
    pools: uploads.map(id => ({ jobPoolUploadId: id, poolName: input.poolNames.get(id) ?? id })),
    budget: { rolesPlanned: planned, rolesEvaluated: evaluated, callsLimit: typeof request.callsNeeded === "number" ? request.callsNeeded : 0 },
    investigationId: investigation.investigationId, startedAt: investigation.createdAt, finishedAt: terminal ? investigation.updatedAt : null
  };
}

const tableExists = async (table: string) => ((await db.execute(sql.raw(`SELECT to_regclass('${table}') IS NOT NULL AS e`))) as unknown as Array<{ e: boolean }>)[0].e;
const EMPTY: Omit<AutoMatchView, "state" | "reason"> = { evidenceClass: null, pools: [], budget: null, investigationId: null, startedAt: null, finishedAt: null };

/** GET: derived from the stored investigation, else from the configuration and the analysis. Writes nothing, registers nothing, calls no model. */
export async function readAutoMatch(analysisId: string): Promise<Outcome<AutoMatchView>> {
  const base = await loadPersonOperandBase(analysisId);
  if (!base.ok && base.issue.status === 404) return base;
  const application = await createLocalJobPoolApplication();
  const summaries = await application.list();
  if (await tableExists("career_relation_investigations")) {
    const store = new PostgresInvestigationStore(db.$client);
    const run = await store.latestAutomatic(analysisId);
    if (run) return { ok: true, value: viewOfAutoInvestigation({ investigation: run, tasks: await store.tasks(run.investigationId), poolNames: new Map(summaries.map(p => [p.jobPoolUploadId, p.poolName] as const)) }) };
  }
  const reason = disabledReason(readSemanticConfig());
  if (reason !== null) return { ok: true, value: { state: "DISABLED", reason, ...EMPTY } };
  if (!base.ok) return { ok: true, value: { state: base.issue.code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" ? "SKIPPED" : "NOT_STARTED", reason: base.issue.code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" ? "NOT_PERSON" : null, ...EMPTY } };
  if (activePoolSnapshot(summaries).length === 0) return { ok: true, value: { state: "SKIPPED", reason: "NO_ACTIVE_POOLS", ...EMPTY } };
  return { ok: true, value: { state: "NOT_STARTED", reason: null, ...EMPTY } };
}

/** GET: the explainable ranking over the pools of the run (or the current ACTIVE pools) and the stored relations of the configured engine. Read only. */
export async function buildAnalysisRanking(analysisId: string): Promise<Outcome<RoleRanking>> {
  const base = await loadPersonOperandBase(analysisId);
  if (!base.ok) return base;
  const summaries = await (await createLocalJobPoolApplication()).list();
  const active = new Set(summaries.filter(p => p.poolStatus === "ACTIVE").map(p => p.jobPoolUploadId));
  let snapshot = activePoolSnapshot(summaries).map(p => p.jobPoolUploadId);
  if (await tableExists("career_relation_investigations")) {
    const run = await new PostgresInvestigationStore(db.$client).latestAutomatic(analysisId);
    if (run && Array.isArray(run.request.uploads)) snapshot = run.request.uploads.filter((u): u is string => typeof u === "string");
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
  const findings = new Map<string, SemanticFinding>();
  if (config.state === "READY" && discovery.roles.length > 0 && await tableExists("career_proposal_requirement_relations")) {
    const engineHash = engineVersionHash(config.engine);
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
    evidenceClass: findings.size > 0 && config.state === "READY" ? evidenceClassOfProvider(config.engine.provider) : null
  });
  return { ok: true, value: ranking };
}

