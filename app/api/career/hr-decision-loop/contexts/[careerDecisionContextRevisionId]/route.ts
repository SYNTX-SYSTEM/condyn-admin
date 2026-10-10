import { handleReadHrDecisionLoopRequest } from "../../../../../../lib/career/hr-decision-loop/http";
import { createLocalHrDecisionLoopHttpApplication } from "../../../../../../lib/career/hr-decision-loop/local-composition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Exact DCTXREV read; this route performs no selection among revisions. */
export async function GET(
  request: Request,
  context: { params: Promise<{ careerDecisionContextRevisionId: string }> }
): Promise<Response> {
  const { careerDecisionContextRevisionId } = await context.params;
  return handleReadHrDecisionLoopRequest(careerDecisionContextRevisionId, createLocalHrDecisionLoopHttpApplication);
}
