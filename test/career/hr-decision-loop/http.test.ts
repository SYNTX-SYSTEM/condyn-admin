import { describe, expect, it } from "vitest";
import {
  handleDeclareHumanDecisionRequest,
  handleReadHrDecisionLoopRequest,
  handleReadHumanDecisionRecordRequest,
  HR_DECISION_LOOP_PUBLIC_ERROR_CODES,
  type HrDecisionLoopHttpApplication
} from "../../../lib/career/hr-decision-loop/http";

const application = (overrides: Partial<HrDecisionLoopHttpApplication>): (() => Promise<HrDecisionLoopHttpApplication>) => async () => ({
  readLoop: async () => { throw new Error("ERR_HR_DECISION_LOOP_CONTEXT_NOT_FOUND"); },
  declare: async () => { throw new Error("unexpected"); },
  readHumanDecisionRecord: async () => null,
  ...overrides
});

const post = (body: string, headers: Record<string, string> = {}) => new Request("http://local/api/career/hr-decision-loop/decisions", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

describe("HR Decision Loop HTTP transport", () => {
  it("returns the exact read model envelope and maps absence and reconstruction failure", async () => {
    const model = { schemaVersion: "HR_DECISION_LOOP_READ_MODEL_V1", marker: true };
    const ok = await handleReadHrDecisionLoopRequest("DCTXREV_1", application({ readLoop: async () => model as never }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ success: true, hrDecisionLoop: model });
    const missing = await handleReadHrDecisionLoopRequest("DCTXREV_2", application({}));
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ success: false, error: { code: "ERR_HR_DECISION_LOOP_API_NOT_FOUND", message: "The exact decision context was not found." } });
    const invalid = await handleReadHrDecisionLoopRequest("x", application({ readLoop: async () => { throw new Error("ERR_HR_DECISION_LOOP_WITNESS_NOT_FOUND"); } }));
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).error).toEqual({ code: "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", message: "The exact decision context could not be reconstructed.", reason: "ERR_HR_DECISION_LOOP_WITNESS_NOT_FOUND" });
    const internal = await handleReadHrDecisionLoopRequest("x", application({ readLoop: async () => { throw new Error("ECONNREFUSED 5432"); } }));
    expect(internal.status).toBe(500);
    expect(await internal.json()).toEqual({ success: false, error: { code: "ERR_HR_DECISION_LOOP_API_INTERNAL", message: "HR Decision Loop service failed." } });
  });

  it("maps the declaration outcomes onto the public codes and hides internal detail", async () => {
    const record = { schemaVersion: "HUMAN_DECISION_RECORD_V1", humanDecisionRecordId: "DCR_1" };
    const created = await handleDeclareHumanDecisionRequest(post("{}"), application({ declare: async () => record as never }));
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ success: true, humanDecisionRecord: record });
    const malformed = await handleDeclareHumanDecisionRequest(post("{"), application({}));
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).error.code).toBe("ERR_HR_DECISION_LOOP_API_INVALID_JSON");
    const cases: Array<[string, number, string, string | undefined]> = [
      ["ERR_HUMAN_DECISION_TRANSPORT_UNAUTHENTICATED", 401, "ERR_HR_DECISION_LOOP_API_UNAUTHENTICATED", undefined],
      ["ERR_HUMAN_DECISION_TRANSPORT_PRINCIPAL_UNMAPPED", 401, "ERR_HR_DECISION_LOOP_API_UNAUTHENTICATED", undefined],
      ["ERR_HUMAN_DECISION_TRANSPORT_DECLARANT_PRINCIPAL_MISMATCH", 403, "ERR_HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH", undefined],
      ["ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT", 409, "ERR_HR_DECISION_LOOP_API_CONFLICT", undefined],
      ["ERR_HUMAN_DECISION_CONTEXT_NOT_FOUND", 404, "ERR_HR_DECISION_LOOP_API_NOT_FOUND", undefined],
      ["ERR_HUMAN_DECISION_DECLARANT_MISMATCH", 422, "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", "ERR_HUMAN_DECISION_DECLARANT_MISMATCH"],
      ["ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE", 422, "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", "ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE"],
      ["ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE", 422, "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", "ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE"],
      ["ERR_HR_DECISION_LOOP_DECLARATION_INVALID", 422, "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", "ERR_HR_DECISION_LOOP_DECLARATION_INVALID"],
      ["ERR_HUMAN_DECISION_PERSISTENCE_FAILED", 500, "ERR_HR_DECISION_LOOP_API_INTERNAL", undefined],
      ["connection reset by peer", 500, "ERR_HR_DECISION_LOOP_API_INTERNAL", undefined]
    ];
    for (const [internalCode, status, publicCode, reason] of cases) {
      const response = await handleDeclareHumanDecisionRequest(post("{}"), application({ declare: async () => { throw new Error(internalCode); } }));
      expect(response.status).toBe(status);
      const payload = await response.json();
      expect(payload.success).toBe(false);
      expect(payload.error.code).toBe(publicCode);
      expect(payload.error.reason).toBe(reason);
      if (reason === undefined) expect(JSON.stringify(payload)).not.toContain(internalCode === "ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT" ? "IMMUTABLE_CONFLICT_INTERNAL" : internalCode);
      expect(HR_DECISION_LOOP_PUBLIC_ERROR_CODES).toContain(publicCode);
    }
  });

  it("reads one exact human decision record and never selects among records", async () => {
    const record = { schemaVersion: "HUMAN_DECISION_RECORD_V1", humanDecisionRecordId: "DCR_1" };
    const found = await handleReadHumanDecisionRecordRequest("DCR_1", application({ readHumanDecisionRecord: async id => id === "DCR_1" ? record as never : null }));
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual({ success: true, humanDecisionRecord: record });
    const missing = await handleReadHumanDecisionRecordRequest("DCR_2", application({}));
    expect(missing.status).toBe(404);
    const failed = await handleReadHumanDecisionRecordRequest("DCR_2", application({ readHumanDecisionRecord: async () => { throw new Error("ERR_HUMAN_DECISION_PERSISTENCE_FAILED"); } }));
    expect(failed.status).toBe(500);
    expect(JSON.stringify(await failed.json())).not.toContain("ERR_HUMAN_DECISION_PERSISTENCE_FAILED");
  });
});
