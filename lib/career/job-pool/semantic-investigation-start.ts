import { db } from "../db/client";
import { loadRoleDiscoveryOperand } from "./role-discovery-operand";
import { engineVersionHash, planSemanticInvestigation } from "./relation-cache";
import { openRelationCache } from "./relation-cache-registration";
import { evidenceClassOfProvider, type SemanticConfig } from "./semantic-config";
import { createSemanticProvider } from "./gemini-semantic-provider";
import { PostgresCallLedger, PostgresInvestigationStore, RUN_HEARTBEAT_MS, RUN_LEASE_MS, investigationIdentity } from "./semantic-investigation-store";
import { ROLE_MAX_ATTEMPTS, runInvestigation } from "./semantic-investigation-run";
import { PostgresProviderCallRegister, readJobCallLimit } from "../provider-calls/register";
import { providerCallRecorderActive, runWithProviderCallRecorder } from "../provider-calls/guard";
import type { EngineProposal, EngineRequirement } from "./semantic-relation-engine";

/**
 * The ONE start of a semantic investigation (spec stage 3): the explicit start route and the automatic run after an analysis both
 * go through it — no second implementation. Everything the route did after parsing its body lives here unchanged: operand, role
 * selection, cache, idempotency BEFORE the call confirmation, plan, confirmation, open, ledger-reserved run.
 * `confirmedCalls` is the number the caller was shown (explicit route), or "AS_PLANNED" for the automatic run, whose release is the
 * started analysis plus the configured budget (the ledger still limits every call).
 */
export type ReadyConfig = Extract<SemanticConfig, { state: "READY" }>;
export type StartResult =
  | { kind: "ISSUE"; code: string; status: number; extra?: Record<string, unknown> }
  | { kind: "EXISTING"; evidenceClass: string; investigationId: string; investigation: unknown; tasks: unknown }
  | { kind: "CREATED"; evidenceClass: string; investigationId: string; investigation: unknown; tasks: unknown; run: unknown };

export async function startSemanticInvestigation(input: {
  analysisId: string; config: ReadyConfig; jobPoolUploadIds: string[]; roleKeys: Array<{ jobPoolUploadId: string; poolRoleId: string }>;
  clientRequestId: string; confirmedCalls: number | "AS_PLANNED"; now?: () => string;
  /** Stored beside the request (not part of the identity): the automatic run marks itself and records what its budget left out. */
  requestExtra?: Record<string, unknown>;
  /** The worker (or process) that runs the investigation: holds its lease. */
  runnerId?: string;
}): Promise<StartResult> {
  const { analysisId, config, roleKeys } = input;
  const issue = (code: string, status: number, extra?: Record<string, unknown>): StartResult => ({ kind: "ISSUE", code, status, ...(extra ? { extra } : {}) });
  const operand = await loadRoleDiscoveryOperand(analysisId, input.jobPoolUploadIds);
  if (!operand.ok) return issue(operand.issue.code, operand.issue.status, operand.issue.extra);
  const { projection, pools, discovery } = operand;
  const wanted = new Set(roleKeys.map(k => `${k.jobPoolUploadId}\u0000${k.poolRoleId}`));
  const selected = discovery.roles.filter(r => wanted.has(`${r.key.jobPoolUploadId}\u0000${r.key.poolRoleId}`));
  if (selected.length !== roleKeys.length) return issue("ERR_INVESTIGATION_ROLE_NOT_IN_DISCOVERY", 400);

  const cache = await openRelationCache();
  if (cache.state !== "AVAILABLE") return issue("ERR_RELATION_CACHE_UNAVAILABLE", 503, { cache: cache.state });
  const engineHash = engineVersionHash(config.engine);
  const identity = investigationIdentity({ analysisId, engineVersionHash: engineHash, uploads: pools.map(p => ({ jobPoolUploadId: p.jobPoolUploadId, canonicalSha256: p.canonicalSha256 })), roleKeys, clientRequestId: input.clientRequestId });
  const store = new PostgresInvestigationStore(db.$client);
  const now = input.now ?? (() => new Date().toISOString());
  // Idempotency first (spec §4): the same submit returns the stored investigation and runs nothing, whatever the cache holds now.
  const existing = await store.investigation(identity.investigationId);
  if (existing) return { kind: "EXISTING", evidenceClass: evidenceClassOfProvider(existing.provider), investigationId: identity.investigationId, investigation: existing, tasks: await store.tasks(identity.investigationId) };
  const poolRequirements = new Map(pools.flatMap(p => p.pool.requirements.map(r => [`${p.jobPoolUploadId}\u0000${r.role_id}\u0000${r.id}`, r] as const)));
  const proposals: EngineProposal[] = projection.capabilities.map(c => ({ id: c.id, name: c.name, scope: c.scope, structuralDefinition: c.structuralDefinition, evidence: c.evidence.map(e => ({ evidenceId: e.evidenceId, sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote })) }));
  const plan = await planSemanticInvestigation({
    discovery: { roles: selected }, proposals: projection.capabilities,
    requirementsByKey: key => poolRequirements.get(`${key.jobPoolUploadId}\u0000${key.poolRoleId}\u0000${key.poolRequirementId}`) ?? null, engine: config.engine, cache
  });
  if (plan.state !== "PLANNED" || plan.callsNeeded === null) return issue("ERR_RELATION_CACHE_UNAVAILABLE", 503, { plan: plan.state });
  if (input.confirmedCalls !== "AS_PLANNED" && input.confirmedCalls !== plan.callsNeeded) return issue("ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", 409, { callsNeeded: plan.callsNeeded });

  const opened = await store.open({ ...identity, analysisId, engineVersionHash: engineHash, provider: config.engine.provider, request: { uploads: input.jobPoolUploadIds, roles: roleKeys, callsNeeded: plan.callsNeeded, ...(input.requestExtra ?? {}) }, now: now(),
    tasks: plan.roles.map(r => ({ jobPoolUploadId: r.jobPoolUploadId, poolRoleId: r.poolRoleId, pairs: r.pairs })) });
  if (!opened.created) return { kind: "EXISTING", evidenceClass: evidenceClassOfProvider(config.engine.provider), investigationId: opened.investigationId, investigation: await store.investigation(opened.investigationId), tasks: await store.tasks(opened.investigationId) }; // a concurrent identical submit

  // An automatic run may ask a role a second time after a TRANSIENT provider failure; the confirmed (explicit) path keeps exactly one call per role.
  const maxAttempts = input.confirmedCalls === "AS_PLANNED" ? ROLE_MAX_ATTEMPTS : 1;
  const ledger = new PostgresCallLedger(db.$client, { investigationId: opened.investigationId, provider: config.engine.provider, day: now().slice(0, 10), dayLimit: config.dayLimit, investigationLimit: plan.callsNeeded * maxAttempts });
  // The lease of the run (point 3): renewed by heartbeat while this process runs it; a dead process loses it and the run is taken up again.
  const owner = input.runnerId ?? `runner-${process.pid}`;
  const leaseUntil = () => new Date(Date.parse(now()) + RUN_LEASE_MS).toISOString();
  const renew = () => store.takeLease(opened.investigationId, owner, leaseUntil(), now()).catch(() => false);
  await renew();
  const heartbeat = setInterval(() => { void renew(); }, RUN_HEARTBEAT_MS);
  heartbeat.unref?.();
  const execute = () => runInvestigation({
    investigationId: opened.investigationId, store, engine: config.engine, provider: createSemanticProvider(config.engine), ledger, cache: cache.reader, proposals, now, maxAttempts,
    touch: async () => { await renew(); },
    roles: selected.map(r => ({ key: r.key, requirements: r.requirements.map(q => ({ key: q.key, ...(poolRequirements.get(`${q.key.jobPoolUploadId}\u0000${q.key.poolRoleId}\u0000${q.key.poolRequirementId}`) as object) }) as EngineRequirement) }))
  });
  // Real model calls go through the call register of the job (budget, write-ahead); the explicit route and the automatic run share this one place.
  const withRegister = config.engine.provider === "gemini" && !providerCallRecorderActive()
    ? () => runWithProviderCallRecorder(new PostgresProviderCallRegister(db.$client, { jobId: operand.investigation.jobId, limit: readJobCallLimit(), now }), execute)
    : execute;
  let run;
  try { run = await withRegister(); } finally { clearInterval(heartbeat); }
  return { kind: "CREATED", evidenceClass: evidenceClassOfProvider(config.engine.provider), investigationId: opened.investigationId, investigation: await store.investigation(opened.investigationId), tasks: await store.tasks(opened.investigationId), run };
}
