import { NextResponse } from "next/server";
import { db } from "../../../../../lib/career/db/client";
import { JobRepository } from "../../../../../lib/career/orchestration/job-repository";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const repo = new JobRepository(db);
    const job = await repo.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Not Found", message: `Job ${jobId} does not exist.` },
        { status: 404 }
      );
    }

    // Return bounded operational state
    if (job.status === "PENDING" || job.status === "RUNNING") {
      return NextResponse.json({
        jobId: job.jobId,
        status: job.status,
        attemptCount: job.attemptCount
      });
    } else if (job.status === "SUCCEEDED") {
      return NextResponse.json({
        jobId: job.jobId,
        status: "SUCCEEDED",
        resultAnalysisId: job.resultAnalysisId
      });
    } else if (job.status === "FAILED") {
      return NextResponse.json({
        jobId: job.jobId,
        status: "FAILED",
        errorCode: job.errorCode,
        errorSummary: job.errorSummary
      });
    }

    // Fallback
    return NextResponse.json({
      jobId: job.jobId,
      status: job.status
    });

  } catch (err: any) {
    console.error(`Fatal error in GET /api/career/jobs/:jobId:`, err);
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        issues: [{ code: "ERR_SERVER_FATAL", message: "Internal server error while fetching job status." }]
      },
      { status: 500 }
    );
  }
}
