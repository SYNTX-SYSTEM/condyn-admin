import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/career/db/client";
import { JobRepository } from "../../../../../../lib/career/orchestration/job-repository";
import { ResultInspectionError, createGeminiExchangeInspector, resultInspectorAccess } from "../../../../../../lib/career/result-inspector";
import { providerExchangeArchiveFromEnvironment } from "../../../../../../lib/career/result-inspector/postgres-exchange-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const notFound = () => NextResponse.json({ success: false, issues: [{ code: "ERR_NOT_FOUND" }] }, { status: 404, headers: NO_STORE });

/**
 * Gemini exchanges of one job, successful and failed (internal validation, same read boundary as the analysis
 * inspector — closed by default, see lib/career/result-inspector/access.ts). Read only; never calls Gemini.
 */
export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  if (resultInspectorAccess(request) !== "ALLOWED") return notFound();
  const { jobId } = await params;
  try {
    const exchanges = await providerExchangeArchiveFromEnvironment();
    const inspection = await createGeminiExchangeInspector({ jobs: new JobRepository(db), ...(exchanges ? { exchanges } : {}) }).read(jobId);
    return NextResponse.json({ success: true, archive: exchanges ? "AVAILABLE" : "NOT_AVAILABLE", inspection }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ResultInspectionError) return NextResponse.json({ success: false, issues: [{ code: error.code }] }, { status: error.status, headers: NO_STORE });
    console.error("[gemini-exchanges] inspection failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, issues: [{ code: "ERR_RESULT_INSPECTION_FAILED" }] }, { status: 500, headers: NO_STORE });
  }
}
