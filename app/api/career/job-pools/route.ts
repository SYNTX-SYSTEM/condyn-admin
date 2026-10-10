import { handleListJobPoolsRequest, handleUploadJobPoolRequest } from "../../../../lib/career/job-pool/http";
import { createLocalJobPoolApplication } from "../../../../lib/career/job-pool/local-composition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** JSON Job Pool upload: validation, persistence of the canonical bytes, canonical target mapping. */
export async function POST(request: Request): Promise<Response> {
  return handleUploadJobPoolRequest(request, createLocalJobPoolApplication);
}

/** Explicit listing for user selection; no current or latest pool is ever chosen here. */
export async function GET(): Promise<Response> {
  return handleListJobPoolsRequest(createLocalJobPoolApplication);
}
