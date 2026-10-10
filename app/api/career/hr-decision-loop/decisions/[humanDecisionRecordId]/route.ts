import { handleReadHumanDecisionRecordRequest } from "../../../../../../lib/career/hr-decision-loop/http";
import { createLocalHrDecisionLoopHttpApplication } from "../../../../../../lib/career/hr-decision-loop/local-composition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Exact DCR read for inverse walks; never a selection among records. */
export async function GET(
  request: Request,
  context: { params: Promise<{ humanDecisionRecordId: string }> }
): Promise<Response> {
  const { humanDecisionRecordId } = await context.params;
  return handleReadHumanDecisionRecordRequest(humanDecisionRecordId, createLocalHrDecisionLoopHttpApplication);
}
