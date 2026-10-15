import { NextResponse } from "next/server";
import { db } from "../../../../lib/career/db/client";
import { JobRepository } from "../../../../lib/career/orchestration/job-repository";
import { createJob } from "../../../../lib/career/orchestration/job";
import { JOB_SCOPE_REQUIRED_MESSAGE, JobScopeRequiredError } from "../../../../lib/career/job-scope";
import { INVESTIGATION_INVALID_MESSAGE, InvestigationBoundaryError, parseDeclaredInvestigation } from "../../../../lib/career/investigation";
import { createLocalJobScopeResolver } from "../../../../lib/career/job-scope/local-resolver";

export const maxDuration = 10; // Fast HTTP acceptance
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get("idempotency-key");
    const body = await req.json().catch(() => ({}));
    const documents = body.documents || [];

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: "FAILED",
          issues: [{ code: "ERR_NO_DOCUMENTS", message: "No documents provided for analysis." }]
        },
        { status: 400 }
      );
    }

    // 2. PRESERVE NEGATIVE REQUEST TESTS: Validate payload structure synchronously
    for (const doc of documents) {
      if (doc.type === "website") {
        if (!doc.url || !String(doc.url).trim()) {
          return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_MISSING_SOURCE_URL", message: "Missing URL for website document." }] }, { status: 400 });
        }
        try {
          const urlObj = new URL(doc.url);
          if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
            return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_INVALID_WEBSITE_URL", message: "Invalid website URL protocol." }] }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_INVALID_WEBSITE_URL", message: "Invalid website URL." }] }, { status: 400 });
        }
      } else if (doc.type === "github") {
        if (!doc.url || !String(doc.url).trim()) {
          return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_MISSING_SOURCE_URL", message: "Missing URL for github document." }] }, { status: 400 });
        }
        try {
          const urlObj = new URL(doc.url);
          if (urlObj.hostname !== "github.com") {
            return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_INVALID_GITHUB_URL", message: "Invalid Github URL." }] }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_INVALID_GITHUB_URL", message: "Invalid Github URL." }] }, { status: 400 });
        }
      } else if (!doc.type || doc.type === "text" || doc.type === "markdown") {
        if (!doc.content || !String(doc.content).trim()) {
           return NextResponse.json({ success: false, status: "FAILED", issues: [{ code: "ERR_NO_DOCUMENTS", message: "Document content cannot be empty." }] }, { status: 400 });
        }
      }
    }

    // SFE: no analysis without an explicit investigation boundary (owner GO 2026-10-15). investigation { mode: "PERSON" }
    // analyzes the person without any job scope; without a declaration (or PERSON_X_JOB) JOB POOL FIRST applies
    // unchanged: missing or malformed scope 400 ERR_JOB_SCOPE_REQUIRED; unknown, inactive or unmapped pool, or a role
    // outside it 422 ERR_JOB_SCOPE_INVALID. An invalid or contradictory declaration, or JOB (not a document analysis):
    // 400 ERR_INVESTIGATION_INVALID / ERR_INVESTIGATION_MODE_NOT_ANALYZABLE. Nothing is enqueued on any refusal.
    try {
      const declared = parseDeclaredInvestigation(body);
      if (declared.mode === "PERSON_X_JOB") await createLocalJobScopeResolver().resolve(declared.selection);
    } catch (scopeErr) {
      if (scopeErr instanceof JobScopeRequiredError) {
        return NextResponse.json(
          { success: false, status: "FAILED", issues: [{ code: scopeErr.code, message: JOB_SCOPE_REQUIRED_MESSAGE }] },
          { status: scopeErr.code === "ERR_JOB_SCOPE_REQUIRED" ? 400 : 422 }
        );
      }
      if (scopeErr instanceof InvestigationBoundaryError) {
        return NextResponse.json(
          { success: false, status: "FAILED", issues: [{ code: scopeErr.code, message: INVESTIGATION_INVALID_MESSAGE }] },
          { status: 400 }
        );
      }
      throw scopeErr;
    }

    // Input Snapshot Contract: Durable input
    const inputRef = {
      sourceType: "BATCH", // or whatever represents the composite payload
      sourceData: body
    } as any; // Cast as any or JobInputRef

    const job = createJob("CAREER_ANALYSIS", inputRef, idempotencyKey || undefined);
    
    const repo = new JobRepository(db);

    try {
      const enqueuedJob = await repo.enqueueJob(job);
      
      return NextResponse.json(
        {
          jobId: enqueuedJob.jobId,
          status: enqueuedJob.status,
          statusUrl: `/api/career/jobs/${enqueuedJob.jobId}`
        },
        { status: 202 } // HTTP 202 Accepted
      );
    } catch (dbErr: any) {
      if (dbErr.message === "ERR_JOB_IDEMPOTENCY_CONFLICT") {
        return NextResponse.json(
          {
            success: false,
            status: "FAILED",
            issues: [{ code: "ERR_JOB_IDEMPOTENCY_CONFLICT", message: "Conflicting request for idempotency key." }]
          },
          { status: 409 } // Conflict
        );
      }
      throw dbErr;
    }

  } catch (err: any) {
    console.error("Fatal error in /api/career/analyze:", err);
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        issues: [{ code: "ERR_SERVER_FATAL", message: err.message || "Internal server error during analysis enqueue." }]
      },
      { status: 500 }
    );
  }
}
