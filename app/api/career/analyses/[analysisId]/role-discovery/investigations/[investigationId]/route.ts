import { NextResponse } from "next/server";
import { db } from "../../../../../../../../lib/career/db/client";
import { ensureRelationCacheRegistration } from "../../../../../../../../lib/career/job-pool/relation-cache-registration";
import { PostgresInvestigationStore } from "../../../../../../../../lib/career/job-pool/semantic-investigation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "cache-control": "no-store" };

/** Read only: the stored state of one investigation (status and role tasks). */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string; investigationId: string }> }) {
  const { analysisId, investigationId } = await params;
  try {
    if (await ensureRelationCacheRegistration() !== "REGISTERED") return NextResponse.json({ success: false, issues: [{ code: "ERR_RELATION_CACHE_UNAVAILABLE" }] }, { status: 503, headers: NO_STORE });
    const store = new PostgresInvestigationStore(db.$client);
    const investigation = await store.investigation(investigationId);
    if (!investigation || investigation.analysisId !== analysisId) return NextResponse.json({ success: false, issues: [{ code: "ERR_INVESTIGATION_NOT_FOUND" }] }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ success: true, evidenceClass: investigation.provider === "stand-in" ? "STAND_IN" : "UNKNOWN", investigation, tasks: await store.tasks(investigationId) }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ success: false, issues: [{ code: "ERR_INVESTIGATION_FAILED" }] }, { status: 500, headers: NO_STORE });
  }
}
