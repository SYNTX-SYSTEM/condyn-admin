import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/career/db/client";
import {
  PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository,
  createCapabilityProposalProjectionReader
} from "../../../../../../lib/career/capability-core";
import { JobRepository } from "../../../../../../lib/career/orchestration/job-repository";
import { ResultInspectionError, createGeminiResultInspector, resultInspectorAccess } from "../../../../../../lib/career/result-inspector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const notFound = () => NextResponse.json({ success: false, issues: [{ code: "ERR_NOT_FOUND" }] }, { status: 404, headers: NO_STORE });

/**
 * Gemini Result Inspector (internal validation, closed by default — see lib/career/result-inspector/access.ts).
 * Read only: the persisted artifacts of one analysis, phase by phase. It never calls Gemini and never starts an analysis.
 */
export async function GET(request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  if (resultInspectorAccess(request) !== "ALLOWED") return notFound();
  const { analysisId } = await params;
  const capabilityRepository = new PostgresCapabilityCoreRepository(db);
  const references = new PostgresCapabilityProposalProjectionReferenceRepository(db);
  try {
    const inspection = await createGeminiResultInspector({
      references,
      capabilityRepository,
      sourceBundles: new PostgresCandidateSourceBundleRepository(db),
      jobs: new JobRepository(db),
      projection: createCapabilityProposalProjectionReader({ references, capabilityRepository })
      // No exchange archive is wired: the received Gemini exchange needs its own bounded store (retention.ts), whose
      // table awaits owner approval. Until then originalGeminiResponse and the scope text are NOT_RETAINED.
    }).read(analysisId);
    return NextResponse.json({ success: true, inspection }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ResultInspectionError) return NextResponse.json({ success: false, issues: [{ code: error.code }] }, { status: error.status, headers: NO_STORE });
    // No error text: it could carry database detail.
    console.error("[gemini-result] inspection failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, issues: [{ code: "ERR_RESULT_INSPECTION_FAILED" }] }, { status: 500, headers: NO_STORE });
  }
}
