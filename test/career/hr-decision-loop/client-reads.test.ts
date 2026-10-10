import { describe, expect, it } from "vitest";
import {
  declareHumanDecision,
  fetchHrDecisionLoop,
  readDecisionContextLineage,
  readDecisionContextRevisionExact
} from "../../../lib/career/ui/useHrDecisionLoop";

/** Pure client reads over a scripted fetch: no network, no database, no DOM. */
const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const revision = (id: string, previous: string | null) => ({ artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", revisionId: id, previousRevisionId: previous, context: { artifactKind: "DECISION_CONTEXT_DRAFT", contextId: id, decisionQuestionId: "q", validationStatus: "NOT_RUN", sourceStateReferences: [], items: [] } });
const script = (routes: Record<string, () => Response | Promise<Response>>): typeof fetch => async (input) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const route = routes[url];
  if (!route) throw new Error(`unscripted ${url}`);
  return route();
};

describe("HR Decision Loop client reads", () => {
  it("surfaces the public reason of a rejected context read and keeps absence distinct", async () => {
    const fetcher = script({
      "/api/career/hr-decision-loop/contexts/DCTXREV_X": () => json(422, { success: false, error: { code: "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", message: "m", reason: "ERR_HR_DECISION_LOOP_WITNESS_NOT_FOUND" } }),
      "/api/career/hr-decision-loop/contexts/DCTXREV_Y": () => json(404, { success: false, error: { code: "ERR_HR_DECISION_LOOP_API_NOT_FOUND", message: "m" } }),
      "/api/career/hr-decision-loop/contexts/DCTXREV_Z": () => json(200, { success: true, hrDecisionLoop: { schemaVersion: "SOMETHING_ELSE" } })
    });
    expect(await fetchHrDecisionLoop("DCTXREV_X", fetcher)).toEqual({ state: "FAILED", code: "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", reason: "ERR_HR_DECISION_LOOP_WITNESS_NOT_FOUND" });
    expect(await fetchHrDecisionLoop("DCTXREV_Y", fetcher)).toEqual({ state: "NOT_FOUND" });
    expect(await fetchHrDecisionLoop("DCTXREV_Z", fetcher)).toEqual({ state: "FAILED", code: null, reason: null });
  });

  it("reads one exact DREV as present, absent or failed and never merges the three", async () => {
    const fetcher = script({
      "/api/decision-contexts/DREV_A": () => json(200, { success: true, revision: revision("DREV_A", null) }),
      "/api/decision-contexts/DREV_B": () => json(404, { success: false, error: { code: "ERR_DECISION_API_NOT_FOUND", message: "m" } }),
      "/api/decision-contexts/DREV_C": () => json(500, { success: false, error: { code: "ERR_DECISION_API_INTERNAL", message: "m" } }),
      "/api/decision-contexts/DREV_D": () => { throw new TypeError("network down"); }
    });
    expect(await readDecisionContextRevisionExact("DREV_A", fetcher)).toEqual({ kind: "REVISION", value: revision("DREV_A", null) });
    expect(await readDecisionContextRevisionExact("DREV_B", fetcher)).toEqual({ kind: "ABSENT" });
    expect(await readDecisionContextRevisionExact("DREV_C", fetcher)).toEqual({ kind: "FAILED", code: "ERR_DECISION_API_INTERNAL" });
    expect(await readDecisionContextRevisionExact("DREV_D", fetcher)).toEqual({ kind: "FAILED", code: null });
  });

  it("walks a lineage through the frozen GET, carrying the entry source and naming a mid-walk failure as a failure", async () => {
    const fetcher = script({
      "/api/decision-contexts/DREV_C": () => json(200, { success: true, revision: revision("DREV_C", "DREV_B") }),
      "/api/decision-contexts/DREV_B": () => json(200, { success: true, revision: revision("DREV_B", "DREV_A") }),
      "/api/decision-contexts/DREV_A": () => json(503, { success: false, error: { code: "ERR_DECISION_API_INTERNAL", message: "m" } }),
      "/api/decision-contexts/DREV_ABSENT": () => json(404, { success: false, error: { code: "ERR_DECISION_API_NOT_FOUND", message: "m" } }),
      "/api/decision-contexts/DREV_DOWN": () => json(500, { success: false, error: { code: "ERR_DECISION_API_INTERNAL", message: "m" } })
    });
    const entry = { kind: "BINDING" as const, careerDecisionContextDecisionRevisionBindingId: "DCDRB_1" };
    const walked = await readDecisionContextLineage("DREV_C", entry, fetcher);
    expect(walked.state).toBe("AVAILABLE");
    if (walked.state === "AVAILABLE") {
      expect(walked.entry).toEqual(entry);
      expect(walked.revisionId).toBe("DREV_C");
      expect(walked.lineage.revisions.map(candidate => candidate.revisionId)).toEqual(["DREV_C", "DREV_B"]);
      expect(walked.lineage.terminal).toBe("PREDECESSOR_READ_FAILED");
      expect(walked.lineage.failureCode).toBe("ERR_DECISION_API_INTERNAL");
    }
    expect(await readDecisionContextLineage("DREV_ABSENT", { kind: "URL" }, fetcher)).toEqual({ state: "NOT_FOUND", revisionId: "DREV_ABSENT", entry: { kind: "URL" } });
    expect(await readDecisionContextLineage("DREV_DOWN", { kind: "INPUT" }, fetcher)).toEqual({ state: "FAILED", revisionId: "DREV_DOWN", entry: { kind: "INPUT" }, code: "ERR_DECISION_API_INTERNAL" });
  });

  it("maps declaration responses onto declared, rejected and failed without inventing a reason", async () => {
    const record = { schemaVersion: "HUMAN_DECISION_RECORD_V1", humanDecisionRecordId: "DCR_" + "1".repeat(32), careerDecisionContextRevisionId: "DCTXREV_X", declarationClass: "DEFER_DECISION", declarantActorId: "a", declaredAt: "2026-10-10T00:00:00.000Z", declarationEvidenceRefs: ["e"] };
    let seen: Request | null = null;
    const fetcher: typeof fetch = async (input, init) => {
      seen = new Request(typeof input === "string" ? `http://local${input}` : input, init);
      const body = await seen.json() as { declarationClass: string };
      if (body.declarationClass === "DEFER_DECISION") return json(201, { success: true, humanDecisionRecord: record });
      if (body.declarationClass === "REJECT_RECOMMENDATION") return json(422, { success: false, error: { code: "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", message: "m", reason: "ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE" } });
      if (body.declarationClass === "ACCEPT_RECOMMENDATION") return json(409, { success: false, error: { code: "ERR_HR_DECISION_LOOP_API_CONFLICT", message: "m" } });
      return json(500, { success: false, error: { code: "ERR_HR_DECISION_LOOP_API_INTERNAL", message: "m" } });
    };
    const draft = (declarationClass: string) => ({ declarantActorId: "a", declarationClass, declaredAt: "2026-10-10T00:00:00.000Z", declarationEvidenceRefs: ["e"] });
    const declared = await declareHumanDecision("DCTXREV_X", draft("DEFER_DECISION"), fetcher);
    expect(declared.state).toBe("DECLARED");
    expect(seen!.headers.get("x-condyn-principal-issuer")).toBe("LOCAL_DEVELOPMENT_SELF_DECLARED");
    expect(seen!.headers.get("x-condyn-principal-subject")).toBe("a");
    expect(await declareHumanDecision("DCTXREV_X", draft("REJECT_RECOMMENDATION"), fetcher)).toEqual({ state: "REJECTED", code: "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", reason: "ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE" });
    expect(await declareHumanDecision("DCTXREV_X", draft("ACCEPT_RECOMMENDATION"), fetcher)).toEqual({ state: "REJECTED", code: "ERR_HR_DECISION_LOOP_API_CONFLICT", reason: null });
    expect(await declareHumanDecision("DCTXREV_X", draft("DEFER_X"), fetcher)).toEqual({ state: "FAILED", code: "ERR_HR_DECISION_LOOP_API_INTERNAL" });
  });
});
