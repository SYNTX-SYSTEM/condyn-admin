import { NextResponse } from "next/server";
import { JobPoolError } from "../../../../../../lib/career/job-pool/errors";
import { loadRoleDiscoveryOperand } from "../../../../../../lib/career/job-pool/role-discovery-operand";
import { planSemanticInvestigation } from "../../../../../../lib/career/job-pool/relation-cache";
import { openRelationCache } from "../../../../../../lib/career/job-pool/relation-cache-registration";
import { readSemanticConfig } from "../../../../../../lib/career/job-pool/semantic-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number, extra: Record<string, string> = {}) => NextResponse.json({ success: false, issues: [{ code, ...extra }] }, { status, headers: NO_STORE });

/**
 * POOL_ROLE_DISCOVERY_V1 (owner D-RD-1 = B, 2026-10-24): the PERSON capability proposals of one analysis related, LEXICALLY, to every
 * role of the job pool uploads named in `?jobPoolUploadId=` (one or more, explicit, at most 10, no duplicates). Never a stored pool
 * that was not named. The operand rules live in role-discovery-operand.ts (shared with the explicit start route). Read only: no
 * model, no write, no score, no ranking, no decision. The semantic plan reports what an explicit investigation would need.
 */
export async function GET(request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  try {
    const operand = await loadRoleDiscoveryOperand(analysisId, new URL(request.url).searchParams.getAll("jobPoolUploadId"));
    if (!operand.ok) return issue(operand.issue.code, operand.issue.status, operand.issue.extra);
    const { projection, pools, discovery } = operand;
    const config = readSemanticConfig();
    const requirements = new Map(pools.flatMap(p => p.pool.requirements.map(r => [`${p.jobPoolUploadId}\u0000${r.role_id}\u0000${r.id}`, r] as const)));
    const semanticPlan = await planSemanticInvestigation({
      discovery, proposals: projection.capabilities,
      requirementsByKey: key => requirements.get(`${key.jobPoolUploadId}\u0000${key.poolRoleId}\u0000${key.poolRequirementId}`) ?? null,
      engine: config.state === "READY" ? config.engine : null, cache: config.state === "READY" ? await openRelationCache() : null
    });
    return NextResponse.json({ success: true, discovery: { ...discovery, semanticPlan } }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobPoolError && error.status === 503) return issue(error.code, 503);
    console.error("[role-discovery] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_ROLE_DISCOVERY_FAILED", 500);
  }
}
