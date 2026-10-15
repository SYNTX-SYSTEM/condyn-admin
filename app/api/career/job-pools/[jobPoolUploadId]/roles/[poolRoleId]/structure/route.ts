import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../../../../../../../../lib/career/db/client";
import { createTargetRepositories } from "../../../../../../../../lib/career/job-pool/canonical-mapping";
import { JobStructureError, parseJobStructureSelection, readJobStructure } from "../../../../../../../../lib/career/job-pool/job-structure";
import { ensureJobPoolPersistenceRegistration } from "../../../../../../../../lib/career/job-pool/local-composition";
import { PostgresJobPoolRepository } from "../../../../../../../../lib/career/job-pool/repository";
import { createJobScopeResolver } from "../../../../../../../../lib/career/job-scope/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const issue = (code: string, status: number) => NextResponse.json({ success: false, issues: [{ code }] }, { status, headers: NO_STORE });

/**
 * JOB ONLY (JOB_STRUCTURE_V1): the selected job itself, independent of any person. Deterministic and read only — it
 * reads the stored pool and the target revisions persisted at upload; no analysis, no candidate data, no Gemini.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ jobPoolUploadId: string; poolRoleId: string }> }) {
  const { jobPoolUploadId, poolRoleId } = await params;
  try {
    const selection = parseJobStructureSelection(jobPoolUploadId, poolRoleId);
    if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") return issue("ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", 503);
    const database = drizzle(db.$client);
    const targets = createTargetRepositories(database);
    const structure = await readJobStructure({ resolver: createJobScopeResolver(new PostgresJobPoolRepository(database)), profiles: targets.profile, requirements: targets.requirement }, selection);
    return NextResponse.json({ success: true, structure }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobStructureError) return issue(error.code, error.status);
    console.error("[job-structure] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_JOB_STRUCTURE_FAILED", 500);
  }
}
