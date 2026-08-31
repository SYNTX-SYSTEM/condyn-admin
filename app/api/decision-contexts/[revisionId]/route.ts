import { handleReadDecisionContextRequest } from "../../../../lib/decision-runtime/http/decision-contexts";
import { createLocalDecisionContextHttpApplication } from "../../../../lib/decision-runtime/local/decision-context-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ revisionId: string }> }
): Promise<Response> {
  const { revisionId } = await context.params;
  return handleReadDecisionContextRequest(revisionId, createLocalDecisionContextHttpApplication);
}
