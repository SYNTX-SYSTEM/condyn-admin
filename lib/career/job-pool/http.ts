import { isJobPoolError } from "./errors";
import type { JobPoolApplication } from "./application";
import { JOB_POOL_MAX_UPLOAD_BYTES } from "./upload";

export type JobPoolApplicationFactory = () => Promise<JobPoolApplication>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function errorResponse(error: unknown): Response {
  if (isJobPoolError(error)) {
    return json(error.status, { error: { code: error.code, message: error.message, ...(error.issues.length ? { issues: error.issues } : {}) } });
  }
  const message = error instanceof Error ? error.message : String(error);
  return json(500, { error: { code: "ERR_JOB_POOL_INTERNAL", message } });
}

export async function handleUploadJobPoolRequest(request: Request, factory: JobPoolApplicationFactory): Promise<Response> {
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > JOB_POOL_MAX_UPLOAD_BYTES) {
      return json(413, { error: { code: "ERR_JOB_POOL_TOO_LARGE", message: `The job pool exceeds ${JOB_POOL_MAX_UPLOAD_BYTES} bytes.` } });
    }
    const body = await request.text();
    const application = await factory();
    const { status, view } = await application.upload(body, request.headers.get("x-condyn-principal-actor-id"));
    return json(status, view);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleListJobPoolsRequest(factory: JobPoolApplicationFactory): Promise<Response> {
  try {
    return json(200, { jobPools: await (await factory()).list() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleReadJobPoolRequest(jobPoolUploadId: string, factory: JobPoolApplicationFactory): Promise<Response> {
  try {
    return json(200, await (await factory()).get(jobPoolUploadId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleJobPoolMatchesRequest(jobPoolUploadId: string, request: Request, factory: JobPoolApplicationFactory): Promise<Response> {
  try {
    const analysisId = new URL(request.url).searchParams.get("analysisId");
    return json(200, await (await factory()).matches(jobPoolUploadId, analysisId));
  } catch (error) {
    return errorResponse(error);
  }
}
