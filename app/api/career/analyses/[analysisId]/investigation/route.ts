import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/career/db/client";
import { PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository } from "../../../../../../lib/career/capability-core";
import { AnalysisInvestigationError, createPostgresAnalysisInvestigationSources, readPersistedAnalysisInvestigation } from "../../../../../../lib/career/investigation/persisted";
import { JobRepository } from "../../../../../../lib/career/orchestration/job-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

/**
 * The persisted investigation boundary of one analysis (ANALYSIS_INVESTIGATION_V1, URL BOUNDARY CLOSURE 2026-10-15).
 * Identities and the declared mode only: no document content, no capability, no comparison, no Gemini. The frontend
 * shows a job comparison for an analysis only after this read resolved it to PERSON_X_JOB with the selected job.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  try {
    const investigation = await readPersistedAnalysisInvestigation({
      ...createPostgresAnalysisInvestigationSources(db),
      references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
      runs: new PostgresCapabilityCoreRepository(db),
      jobs: new JobRepository(db)
    }, analysisId);
    return NextResponse.json({ success: true, investigation }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof AnalysisInvestigationError) {
      return NextResponse.json({ success: false, issues: [{ code: error.code, ...(error.reason ? { reason: error.reason } : {}) }] }, { status: error.status, headers: NO_STORE });
    }
    console.error("[analysis-investigation] failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_FAILED" }] }, { status: 500, headers: NO_STORE });
  }
}
