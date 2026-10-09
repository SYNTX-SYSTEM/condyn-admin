import { handleDeclareHumanDecisionRequest } from "../../../../../lib/career/hr-decision-loop/http";
import { createLocalHrDecisionLoopHttpApplication } from "../../../../../lib/career/hr-decision-loop/local-composition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Human decision ingress: the only HR decision carrier is the G3 DCR (decision D1). */
export async function POST(request: Request): Promise<Response> {
  return handleDeclareHumanDecisionRequest(request, createLocalHrDecisionLoopHttpApplication);
}
