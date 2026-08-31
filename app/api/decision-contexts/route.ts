import { handleCreateDecisionContextRequest } from "../../../lib/decision-runtime/http/decision-contexts";
import { createLocalDecisionContextHttpApplication } from "../../../lib/decision-runtime/local/decision-context-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleCreateDecisionContextRequest(request, createLocalDecisionContextHttpApplication);
}
