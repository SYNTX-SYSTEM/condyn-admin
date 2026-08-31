import type { DecisionContextRevision } from "../../decision-core";

const INVALID_JSON = "ERR_DECISION_API_INVALID_JSON";
const REQUEST_REJECTED = "ERR_DECISION_API_REQUEST_REJECTED";
const CONFLICT = "ERR_DECISION_API_CONFLICT";
const NOT_FOUND = "ERR_DECISION_API_NOT_FOUND";
const INTERNAL = "ERR_DECISION_API_INTERNAL";

export interface DecisionContextHttpApplication {
  createRootDecisionContext(input: unknown): Promise<DecisionContextRevision>;
  readDecisionContextRevision(revisionId: string): Promise<DecisionContextRevision | null>;
}

export type DecisionContextHttpApplicationFactory = () => Promise<DecisionContextHttpApplication>;

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ success: false, error: { code, message } }, { status });
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

function isRequestRejection(code: string): boolean {
  return code === "ERR_DECISION_AUTHORITY_STATE_NOT_FOUND" || (
    code.startsWith("ERR_DECISION_CONTEXT_") && !code.startsWith("ERR_DECISION_CONTEXT_REVISION_")
  );
}

function createErrorResponse(error: unknown): Response {
  const code = errorCode(error);
  if (code === "ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT") {
    return errorResponse(409, CONFLICT, "Decision Context revision conflicts with an existing immutable record.");
  }
  if (isRequestRejection(code)) {
    return errorResponse(422, REQUEST_REJECTED, "Decision Context request was rejected.");
  }
  return errorResponse(500, INTERNAL, "Decision Context service failed.");
}

export async function handleCreateDecisionContextRequest(
  request: Request,
  createApplication: DecisionContextHttpApplicationFactory
): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse(400, INVALID_JSON, "Request body must be valid JSON.");
  }

  try {
    const application = await createApplication();
    const revision = await application.createRootDecisionContext(input);
    return Response.json({ success: true, revision }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function handleReadDecisionContextRequest(
  revisionId: string,
  createApplication: DecisionContextHttpApplicationFactory
): Promise<Response> {
  try {
    const application = await createApplication();
    const revision = await application.readDecisionContextRevision(revisionId);
    if (revision === null) {
      return errorResponse(404, NOT_FOUND, "Decision Context revision was not found.");
    }
    return Response.json({ success: true, revision });
  } catch (error) {
    return errorResponse(500, INTERNAL, "Decision Context service failed.");
  }
}
