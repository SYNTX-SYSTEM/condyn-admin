import { NextResponse } from "next/server";
import { JobPoolError } from "../../../../../../lib/career/job-pool/errors";
import { buildAnalysisRanking } from "../../../../../../lib/career/job-pool/auto-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number, extra: Record<string, string> = {}) => NextResponse.json({ success: false, issues: [{ code, ...extra }] }, { status, headers: NO_STORE });

/**
 * ROLE_RANKING_V1 of one PERSON analysis (owner mandate AUTOMATED_CAPABILITY_TO_JOB_EXECUTE): the explainable ranking of the roles of
 * the pools of the automatic run (or the current ACTIVE pools), from the lexical discovery and the stored semantic relations of the
 * configured engine. Read only: no write, no table registered, no model, no score beyond the published formula, no decision.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  try {
    const result = await buildAnalysisRanking(analysisId);
    if (!result.ok) return issue(result.issue.code, result.issue.status, result.issue.extra);
    return NextResponse.json({ success: true, ranking: result.value }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobPoolError && error.status === 503) return issue(error.code, 503);
    console.error("[job-ranking] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_JOB_RANKING_FAILED", 500);
  }
}
