import { handleReadJobPoolRequest } from "../../../../../lib/career/job-pool/http";
import { createLocalJobPoolApplication } from "../../../../../lib/career/job-pool/local-composition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ jobPoolUploadId: string }> }): Promise<Response> {
  const { jobPoolUploadId } = await context.params;
  return handleReadJobPoolRequest(jobPoolUploadId, createLocalJobPoolApplication);
}
