import type { HumanDecisionRecord } from "../relation/decision-record";
import type { HrDecisionDeclarationApplication } from "./declaration-application";
import type { HrDecisionLoopReadModel } from "./read-model";
import type { HrDecisionLoopReadService } from "./server-read-service";

/**
 * Public HTTP contract of the local HR Decision Loop frontend integration.
 * Routes are transport only. Public codes are the frontend contract; sealed
 * G3 codes appear only inside the bounded `reason` allowlist of a 422.
 */
export const HR_DECISION_LOOP_API_INVALID_JSON = "ERR_HR_DECISION_LOOP_API_INVALID_JSON";
export const HR_DECISION_LOOP_API_REQUEST_REJECTED = "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED";
export const HR_DECISION_LOOP_API_UNAUTHENTICATED = "ERR_HR_DECISION_LOOP_API_UNAUTHENTICATED";
export const HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH = "ERR_HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH";
export const HR_DECISION_LOOP_API_CONFLICT = "ERR_HR_DECISION_LOOP_API_CONFLICT";
export const HR_DECISION_LOOP_API_NOT_FOUND = "ERR_HR_DECISION_LOOP_API_NOT_FOUND";
export const HR_DECISION_LOOP_API_INTERNAL = "ERR_HR_DECISION_LOOP_API_INTERNAL";

export const HR_DECISION_LOOP_PUBLIC_ERROR_CODES = [
  HR_DECISION_LOOP_API_INVALID_JSON,
  HR_DECISION_LOOP_API_REQUEST_REJECTED,
  HR_DECISION_LOOP_API_UNAUTHENTICATED,
  HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH,
  HR_DECISION_LOOP_API_CONFLICT,
  HR_DECISION_LOOP_API_NOT_FOUND,
  HR_DECISION_LOOP_API_INTERNAL
] as const;

/** Sealed T11C rejection reasons the human may see verbatim; anything else stays internal. */
export const HR_DECISION_LOOP_PUBLIC_REJECTION_REASONS = [
  "ERR_HR_DECISION_LOOP_DECLARATION_INVALID",
  "ERR_HUMAN_DECISION_INVALID",
  "ERR_HUMAN_DECISION_DECLARANT_MISMATCH",
  "ERR_HUMAN_DECISION_CLASS_NOT_PERMITTED",
  "ERR_HUMAN_DECISION_SUBJECT_KIND_NOT_PERMITTED",
  "ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE",
  "ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE",
  "ERR_HUMAN_DECISION_CONTEXT_INVALID",
  "ERR_HUMAN_DECISION_AUTHORITY_GRANT_INVALID",
  "ERR_HUMAN_DECISION_RECOMMENDATION_PROPOSAL_INVALID"
] as const;

const NOT_FOUND_CODES = new Set([
  "ERR_HUMAN_DECISION_CONTEXT_NOT_FOUND",
  "ERR_HUMAN_DECISION_AUTHORITY_GRANT_NOT_FOUND",
  "ERR_HUMAN_DECISION_RECOMMENDATION_PROPOSAL_NOT_FOUND",
  "ERR_HR_DECISION_LOOP_CONTEXT_NOT_FOUND"
]);

export interface HrDecisionLoopHttpApplication {
  readLoop: HrDecisionLoopReadService["read"];
  declare: HrDecisionDeclarationApplication["declare"];
  readHumanDecisionRecord(humanDecisionRecordId: string): Promise<HumanDecisionRecord | null>;
}

export type HrDecisionLoopHttpApplicationFactory = () => Promise<HrDecisionLoopHttpApplication>;

function errorResponse(status: number, code: string, message: string, reason?: string): Response {
  return Response.json({ success: false, error: reason === undefined ? { code, message } : { code, message, reason } }, { status });
}

const errorCode = (error: unknown): string => error instanceof Error ? error.message : "";

function declarationErrorResponse(error: unknown): Response {
  const code = errorCode(error);
  if (code === "ERR_HUMAN_DECISION_TRANSPORT_UNAUTHENTICATED" || code === "ERR_HUMAN_DECISION_TRANSPORT_PRINCIPAL_UNMAPPED") {
    return errorResponse(401, HR_DECISION_LOOP_API_UNAUTHENTICATED, "No admitted principal accompanies the declaration.");
  }
  if (code === "ERR_HUMAN_DECISION_TRANSPORT_DECLARANT_PRINCIPAL_MISMATCH") {
    return errorResponse(403, HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH, "The admitted principal is not the named declarant.");
  }
  if (code === "ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT") {
    return errorResponse(409, HR_DECISION_LOOP_API_CONFLICT, "An immutable human decision record with this identity already exists.");
  }
  if (NOT_FOUND_CODES.has(code)) {
    return errorResponse(404, HR_DECISION_LOOP_API_NOT_FOUND, "The exact decision context or one of its witnesses was not found.");
  }
  if ((HR_DECISION_LOOP_PUBLIC_REJECTION_REASONS as readonly string[]).includes(code)) {
    return errorResponse(422, HR_DECISION_LOOP_API_REQUEST_REJECTED, "The human decision declaration was rejected.", code);
  }
  return errorResponse(500, HR_DECISION_LOOP_API_INTERNAL, "HR Decision Loop service failed.");
}

export async function handleReadHrDecisionLoopRequest(
  careerDecisionContextRevisionId: string,
  createApplication: HrDecisionLoopHttpApplicationFactory
): Promise<Response> {
  let model: HrDecisionLoopReadModel;
  try {
    const application = await createApplication();
    model = await application.readLoop(careerDecisionContextRevisionId);
  } catch (error) {
    const code = errorCode(error);
    if (NOT_FOUND_CODES.has(code)) return errorResponse(404, HR_DECISION_LOOP_API_NOT_FOUND, "The exact decision context was not found.");
    if (code === "ERR_HR_DECISION_LOOP_CONTEXT_INVALID" || code === "ERR_HR_DECISION_LOOP_WITNESS_NOT_FOUND") {
      return errorResponse(422, HR_DECISION_LOOP_API_REQUEST_REJECTED, "The exact decision context could not be reconstructed.", code);
    }
    return errorResponse(500, HR_DECISION_LOOP_API_INTERNAL, "HR Decision Loop service failed.");
  }
  return Response.json({ success: true, hrDecisionLoop: model });
}

export async function handleDeclareHumanDecisionRequest(
  request: Request,
  createApplication: HrDecisionLoopHttpApplicationFactory
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, HR_DECISION_LOOP_API_INVALID_JSON, "Request body must be valid JSON.");
  }
  try {
    const application = await createApplication();
    const humanDecisionRecord = await application.declare(request, body);
    return Response.json({ success: true, humanDecisionRecord }, { status: 201 });
  } catch (error) {
    return declarationErrorResponse(error);
  }
}

export async function handleReadHumanDecisionRecordRequest(
  humanDecisionRecordId: string,
  createApplication: HrDecisionLoopHttpApplicationFactory
): Promise<Response> {
  try {
    const application = await createApplication();
    const humanDecisionRecord = await application.readHumanDecisionRecord(humanDecisionRecordId);
    if (humanDecisionRecord === null) return errorResponse(404, HR_DECISION_LOOP_API_NOT_FOUND, "The exact human decision record was not found.");
    return Response.json({ success: true, humanDecisionRecord });
  } catch {
    return errorResponse(500, HR_DECISION_LOOP_API_INTERNAL, "HR Decision Loop service failed.");
  }
}
