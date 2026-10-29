import { NextResponse } from "next/server";
import { db } from "../../../../../../../lib/career/db/client";
import { JobPoolError } from "../../../../../../../lib/career/job-pool/errors";
import { loadRoleDiscoveryOperand } from "../../../../../../../lib/career/job-pool/role-discovery-operand";
import { engineVersionHash, planSemanticInvestigation } from "../../../../../../../lib/career/job-pool/relation-cache";
import { openRelationCache } from "../../../../../../../lib/career/job-pool/relation-cache-registration";
import { SEMANTIC_ROLES_HARD_CAP, readSemanticConfig } from "../../../../../../../lib/career/job-pool/semantic-config";
import { PostgresCallLedger, PostgresInvestigationStore, investigationIdentity } from "../../../../../../../lib/career/job-pool/semantic-investigation-store";
import { runInvestigation } from "../../../../../../../lib/career/job-pool/semantic-investigation-run";
import { StandInSemanticProvider, type EngineProposal, type EngineRequirement } from "../../../../../../../lib/career/job-pool/semantic-relation-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ success: false, issues: [{ code, ...extra }] }, { status, headers: NO_STORE });
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
/** The class is derived from the stored provider; only the labelled stand-in exists in this build. */
const evidenceClassOf = (provider: string) => (provider === "stand-in" ? "STAND_IN" : "UNKNOWN");
const str = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v === v.trim();

/**
 * EXPLICIT START of a semantic investigation (stage 3; owner D-RD-3 A). Only a POST by the caller starts it — never a page view, never
 * a GET. The body names the released uploads, the roles (at most the configured maximum, hard cap 25) and a client request id, and
 * CONFIRMS the call volume it was shown (`confirmedCalls` must equal the roles that need a call now). One call per role with pending
 * pairs, reserved against the call ledger first; one attempt, no silent retry. A repeated submit returns the stored investigation and
 * runs nothing. In this build only the labelled stand-in is executable; a real provider is refused (owner GO and budget pending).
 */
export async function POST(request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  try {
    // A start is a deliberate same-site JSON call (PINK O-START-1): a cross-site fetch or a form post cannot trigger it.
    if (request.headers.get("sec-fetch-site") === "cross-site") return issue("ERR_INVESTIGATION_CROSS_SITE", 403);
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return issue("ERR_INVESTIGATION_CONTENT_TYPE", 415);
    const config = readSemanticConfig();
    if (config.state === "NOT_CONFIGURED") return issue("ERR_SEMANTIC_ENGINE_NOT_CONFIGURED", 409);
    if (config.state === "PROVIDER_NOT_AUTHORIZED") return issue("ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED", 409, { provider: config.provider });
    let body: unknown;
    try { body = await request.json(); } catch { return issue("ERR_INVESTIGATION_BODY_INVALID", 400); }
    if (!isRecord(body) || !Array.isArray(body.jobPoolUploadIds) || !body.jobPoolUploadIds.every(str) || !Array.isArray(body.roles) || !str(body.clientRequestId) || !Number.isInteger(body.confirmedCalls)) return issue("ERR_INVESTIGATION_BODY_INVALID", 400);
    const roles = body.roles as unknown[];
    if (!roles.every(r => isRecord(r) && str(r.jobPoolUploadId) && str(r.poolRoleId))) return issue("ERR_INVESTIGATION_BODY_INVALID", 400);
    const roleKeys = (roles as Array<{ jobPoolUploadId: string; poolRoleId: string }>).map(r => ({ jobPoolUploadId: r.jobPoolUploadId, poolRoleId: r.poolRoleId }));
    if (roleKeys.length === 0 || new Set(roleKeys.map(k => `${k.jobPoolUploadId}\u0000${k.poolRoleId}`)).size !== roleKeys.length) return issue("ERR_INVESTIGATION_ROLES_INVALID", 400);
    if (roleKeys.length > Math.min(config.maxRoles, SEMANTIC_ROLES_HARD_CAP)) return issue("ERR_INVESTIGATION_TOO_MANY_ROLES", 400, { max: Math.min(config.maxRoles, SEMANTIC_ROLES_HARD_CAP) });

    const operand = await loadRoleDiscoveryOperand(analysisId, body.jobPoolUploadIds as string[]);
    if (!operand.ok) return issue(operand.issue.code, operand.issue.status, operand.issue.extra);
    const { projection, pools, discovery } = operand;
    const wanted = new Set(roleKeys.map(k => `${k.jobPoolUploadId}\u0000${k.poolRoleId}`));
    const selected = discovery.roles.filter(r => wanted.has(`${r.key.jobPoolUploadId}\u0000${r.key.poolRoleId}`));
    if (selected.length !== roleKeys.length) return issue("ERR_INVESTIGATION_ROLE_NOT_IN_DISCOVERY", 400);

    const cache = await openRelationCache();
    if (cache.state !== "AVAILABLE") return issue("ERR_RELATION_CACHE_UNAVAILABLE", 503, { cache: cache.state });
    const engineHash = engineVersionHash(config.engine);
    const identity = investigationIdentity({ analysisId, engineVersionHash: engineHash, uploads: pools.map(p => ({ jobPoolUploadId: p.jobPoolUploadId, canonicalSha256: p.canonicalSha256 })), roleKeys, clientRequestId: body.clientRequestId as string });
    const store = new PostgresInvestigationStore(db.$client);
    const now = () => new Date().toISOString();
    // Idempotency first (spec §4): the same submit returns the stored investigation and runs nothing, whatever the cache holds now.
    const existing = await store.investigation(identity.investigationId);
    if (existing) return NextResponse.json({ success: true, created: false, evidenceClass: evidenceClassOf(existing.provider), investigation: existing, tasks: await store.tasks(identity.investigationId) }, { headers: NO_STORE });
    const poolRequirements = new Map(pools.flatMap(p => p.pool.requirements.map(r => [`${p.jobPoolUploadId}\u0000${r.role_id}\u0000${r.id}`, r] as const)));
    const proposals: EngineProposal[] = projection.capabilities.map(c => ({ id: c.id, name: c.name, scope: c.scope, structuralDefinition: c.structuralDefinition, evidence: c.evidence.map(e => ({ evidenceId: e.evidenceId, sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote })) }));
    const plan = await planSemanticInvestigation({
      discovery: { roles: selected }, proposals: projection.capabilities,
      requirementsByKey: key => poolRequirements.get(`${key.jobPoolUploadId}\u0000${key.poolRoleId}\u0000${key.poolRequirementId}`) ?? null, engine: config.engine, cache
    });
    if (plan.state !== "PLANNED" || plan.callsNeeded === null) return issue("ERR_RELATION_CACHE_UNAVAILABLE", 503, { plan: plan.state });
    if (body.confirmedCalls !== plan.callsNeeded) return issue("ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", 409, { callsNeeded: plan.callsNeeded });

    const opened = await store.open({ ...identity, analysisId, engineVersionHash: engineHash, provider: config.engine.provider, request: { uploads: body.jobPoolUploadIds, roles: roleKeys, callsNeeded: plan.callsNeeded }, now: now(),
      tasks: plan.roles.map(r => ({ jobPoolUploadId: r.jobPoolUploadId, poolRoleId: r.poolRoleId, pairs: r.pairs })) });
    if (!opened.created) return NextResponse.json({ success: true, created: false, evidenceClass: evidenceClassOf(config.engine.provider), investigation: await store.investigation(opened.investigationId), tasks: await store.tasks(opened.investigationId) }, { headers: NO_STORE }); // a concurrent identical submit

    const ledger = new PostgresCallLedger(db.$client, { investigationId: opened.investigationId, provider: config.engine.provider, day: now().slice(0, 10), dayLimit: config.dayLimit, investigationLimit: plan.callsNeeded });
    const run = await runInvestigation({
      investigationId: opened.investigationId, store, engine: config.engine, provider: new StandInSemanticProvider(), ledger, cache: cache.reader, proposals, now,
      roles: selected.map(r => ({ key: r.key, requirements: r.requirements.map(q => ({ key: q.key, ...(poolRequirements.get(`${q.key.jobPoolUploadId}\u0000${q.key.poolRoleId}\u0000${q.key.poolRequirementId}`) as object) }) as EngineRequirement) }))
    });
    return NextResponse.json({ success: true, created: true, evidenceClass: "STAND_IN", investigation: await store.investigation(opened.investigationId), tasks: await store.tasks(opened.investigationId), run }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobPoolError && error.status === 503) return issue(error.code, 503);
    console.error("[role-discovery-investigation] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_INVESTIGATION_FAILED", 500);
  }
}
