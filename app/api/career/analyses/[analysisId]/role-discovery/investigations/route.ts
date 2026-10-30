import { NextResponse } from "next/server";
import { JobPoolError } from "../../../../../../../lib/career/job-pool/errors";
import { SEMANTIC_ROLES_HARD_CAP, readSemanticConfig } from "../../../../../../../lib/career/job-pool/semantic-config";
import { startSemanticInvestigation } from "../../../../../../../lib/career/job-pool/semantic-investigation-start";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ success: false, issues: [{ code, ...extra }] }, { status, headers: NO_STORE });
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
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
    if ((request.headers.get("sec-fetch-site") ?? "").trim().toLowerCase() === "cross-site") return issue("ERR_INVESTIGATION_CROSS_SITE", 403);
    if ((request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase() !== "application/json") return issue("ERR_INVESTIGATION_CONTENT_TYPE", 415);
    const config = readSemanticConfig();
    if (config.state === "NOT_CONFIGURED") return issue("ERR_SEMANTIC_ENGINE_NOT_CONFIGURED", 409);
    if (config.state === "PROVIDER_NOT_AUTHORIZED") return issue("ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED", 409, { provider: config.provider });
    let body: unknown;
    try { body = await request.json(); } catch { return issue("ERR_INVESTIGATION_BODY_INVALID", 400); }
    if (isRecord(body) && typeof body.clientRequestId === "string" && body.clientRequestId.startsWith("auto:")) return issue("ERR_INVESTIGATION_BODY_INVALID", 400); // the identity of the automatic run is reserved
    if (!isRecord(body) || !Array.isArray(body.jobPoolUploadIds) || !body.jobPoolUploadIds.every(str) || !Array.isArray(body.roles) || !str(body.clientRequestId) || !Number.isInteger(body.confirmedCalls)) return issue("ERR_INVESTIGATION_BODY_INVALID", 400);
    const roles = body.roles as unknown[];
    if (!roles.every(r => isRecord(r) && str(r.jobPoolUploadId) && str(r.poolRoleId))) return issue("ERR_INVESTIGATION_BODY_INVALID", 400);
    const roleKeys = (roles as Array<{ jobPoolUploadId: string; poolRoleId: string }>).map(r => ({ jobPoolUploadId: r.jobPoolUploadId, poolRoleId: r.poolRoleId }));
    if (roleKeys.length === 0 || new Set(roleKeys.map(k => `${k.jobPoolUploadId}\u0000${k.poolRoleId}`)).size !== roleKeys.length) return issue("ERR_INVESTIGATION_ROLES_INVALID", 400);
    if (roleKeys.length > Math.min(config.maxRoles, SEMANTIC_ROLES_HARD_CAP)) return issue("ERR_INVESTIGATION_TOO_MANY_ROLES", 400, { max: Math.min(config.maxRoles, SEMANTIC_ROLES_HARD_CAP) });

    const result = await startSemanticInvestigation({ analysisId, config, jobPoolUploadIds: body.jobPoolUploadIds as string[], roleKeys, clientRequestId: body.clientRequestId as string, confirmedCalls: body.confirmedCalls as number });
    if (result.kind === "ISSUE") return issue(result.code, result.status, result.extra);
    if (result.kind === "EXISTING") return NextResponse.json({ success: true, created: false, evidenceClass: result.evidenceClass, investigation: result.investigation, tasks: result.tasks }, { headers: NO_STORE });
    return NextResponse.json({ success: true, created: true, evidenceClass: result.evidenceClass, investigation: result.investigation, tasks: result.tasks, run: result.run }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobPoolError && error.status === 503) return issue(error.code, 503);
    console.error("[role-discovery-investigation] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_INVESTIGATION_FAILED", 500);
  }
}
