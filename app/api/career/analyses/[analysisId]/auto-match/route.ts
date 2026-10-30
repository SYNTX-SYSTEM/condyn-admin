import { NextResponse } from "next/server";
import { JobPoolError } from "../../../../../../lib/career/job-pool/errors";
import { readAutoMatch } from "../../../../../../lib/career/job-pool/auto-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number, extra: Record<string, string> = {}) => NextResponse.json({ success: false, issues: [{ code, ...extra }] }, { status, headers: NO_STORE });

/**
 * State of the automatic match of one analysis (owner mandate AUTOMATED_CAPABILITY_TO_JOB_EXECUTE): derived from the stored semantic
 * investigation the worker started, else from the configuration and the analysis. Read only: no write, no table registered, no model.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  try {
    const result = await readAutoMatch(analysisId);
    if (!result.ok) return issue(result.issue.code, result.issue.status, result.issue.extra);
    return NextResponse.json({ success: true, autoMatch: result.value }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobPoolError && error.status === 503) return issue(error.code, 503);
    console.error("[auto-match] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_AUTO_MATCH_FAILED", 500);
  }
}
