import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../../../../../../lib/career/db/client";
import {
  PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createCapabilityProposalProjectionReader
} from "../../../../../../lib/career/capability-core";
import { ensureJobPoolPersistenceRegistration } from "../../../../../../lib/career/job-pool/local-composition";
import { PostgresJobPoolRepository } from "../../../../../../lib/career/job-pool/repository";
import { buildSelectedRoleCoverage } from "../../../../../../lib/career/job-pool/selected-role-coverage";
import { JobComparisonError, parseRequestedSelection, resolveAnalysisJobScope } from "../../../../../../lib/career/job-scope/analysis-scope";
import { createJobScopeResolver } from "../../../../../../lib/career/job-scope/scope";
import { JobRepository } from "../../../../../../lib/career/orchestration/job-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number) => NextResponse.json({ success: false, issues: [{ code }] }, { status, headers: NO_STORE });

/**
 * B2 selected-role coverage of one PERSON_X_JOB analysis (SELECTED_ROLE_COVERAGE_V1, owner decision 2026-10-15).
 * The caller names the selection it shows (?jobPoolUploadId=&poolRoleId=); it must be the analysis's own, proven
 * against the Discovery run's scope hash. Read only: no Gemini, no legacy analysis, no pool-wide comparison.
 */
export async function GET(request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  const query = new URL(request.url).searchParams;
  try {
    const requested = parseRequestedSelection(query.get("jobPoolUploadId"), query.get("poolRoleId"));
    if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") return issue("ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", 503);
    const capabilityRepository = new PostgresCapabilityCoreRepository(db);
    const references = new PostgresCapabilityProposalProjectionReferenceRepository(db);
    const { binding, scope } = await resolveAnalysisJobScope({
      references, runs: capabilityRepository, jobs: new JobRepository(db),
      resolver: createJobScopeResolver(new PostgresJobPoolRepository(drizzle(db.$client)))
    }, analysisId, requested);
    const projection = await createCapabilityProposalProjectionReader({ references, capabilityRepository }).read(analysisId).catch(() => null);
    if (projection === null) return issue("ERR_JOB_COMPARISON_LINEAGE_INVALID", 409);
    return NextResponse.json({ success: true, comparison: buildSelectedRoleCoverage(binding, scope, projection) }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobComparisonError) return issue(error.code, error.status);
    console.error("[job-comparison] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_JOB_COMPARISON_FAILED", 500);
  }
}
