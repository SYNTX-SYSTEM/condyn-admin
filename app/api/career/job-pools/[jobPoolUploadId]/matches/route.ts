import { handleJobPoolMatchesRequest } from "../../../../../../lib/career/job-pool/http";
import { createLocalJobPoolApplication } from "../../../../../../lib/career/job-pool/local-composition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Presentation matching of one explicit analysis against one explicit pool upload (authority NONE). */
export async function GET(request: Request, context: { params: Promise<{ jobPoolUploadId: string }> }): Promise<Response> {
  const { jobPoolUploadId } = await context.params;
  return handleJobPoolMatchesRequest(jobPoolUploadId, request, createLocalJobPoolApplication);
}
