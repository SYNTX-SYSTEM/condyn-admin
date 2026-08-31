import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as decisionContexts from "../../../lib/decision-runtime/http/decision-contexts";
import type { DecisionContextRevision } from "../../../lib/decision-core";

const r4HttpProductionFiles = [
  "lib/decision-runtime/http/decision-contexts.ts",
  "lib/decision-runtime/local/decision-context-api.ts"
];

const revision = (suffix = "ONE"): DecisionContextRevision => ({
  artifactKind: "DECISION_CONTEXT_REVISION",
  schemaVersion: "DECISION_CONTEXT_REVISION_V1",
  revisionId: `DREV_${suffix}`,
  previousRevisionId: null,
  context: { contextId: `DCONTEXT_${suffix}`, validationStatus: "NOT_RUN", sourceStateReferences: [], items: [] },
  validationInput: { expectationValidations: [], consequenceValidations: [] },
  validationAssembly: { assemblyId: `DVA_${suffix}`, artifactKind: "DECISION_CONTEXT_VALIDATION_ASSEMBLY", schemaVersion: "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1", contextId: `DCONTEXT_${suffix}`, validationInput: { expectationValidations: [], consequenceValidations: [] }, expectationResults: [], consequenceResults: [] }
} as unknown as DecisionContextRevision);

type Application = {
  createRootDecisionContext: (input: unknown) => Promise<DecisionContextRevision>;
  readDecisionContextRevision: (revisionId: string) => Promise<DecisionContextRevision | null>;
};

function applicationFactory(overrides: Partial<Application> = {}) {
  const application: Application = {
    createRootDecisionContext: vi.fn(async () => revision()),
    readDecisionContextRevision: vi.fn(async () => revision()),
    ...overrides
  };
  return { application, factory: vi.fn(async () => application) };
}

const errorBody = async (response: Response) => response.json() as Promise<{ success: false; error: { code: string; message: string } }>;

describe("Decision Context HTTP transport", () => {
  it("passes valid JSON unchanged to one fresh application operation and returns the exact created revision in the 201 envelope", async () => {
    const persisted = revision("OPAQUE");
    const { application, factory } = applicationFactory({ createRootDecisionContext: vi.fn(async () => persisted) });
    const body = {
      sourceStateReferences: [{ producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " }],
      items: [{ role: "DECISION_QUESTION", statement: "  preserve this statement  ", provenance: { origin: "HUMAN_INPUT", actorId: " actor " } }],
      opaqueTransportValue: "  do not normalize  "
    };

    const response = await decisionContexts.handleCreateDecisionContextRequest(
      new Request("http://local/api/decision-contexts", { method: "POST", body: JSON.stringify(body) }),
      factory
    );

    expect(factory).toHaveBeenCalledTimes(1);
    expect(application.createRootDecisionContext).toHaveBeenCalledTimes(1);
    expect(application.createRootDecisionContext).toHaveBeenCalledWith(body);
    expect(response.status).toBe(201);
    const payload = await response.json() as Record<string, unknown>;
    expect(Object.keys(payload)).toEqual(["success", "revision"]);
    expect(payload).toEqual({ success: true, revision: persisted });
    expect(Object.keys(payload)).not.toEqual(expect.arrayContaining(["status", "verified", "current", "head", "latest", "active", "authoritative", "complete", "decisionReady", "loopClosed"]));
  });

  it("rejects malformed JSON before application composition", async () => {
    const { factory } = applicationFactory();
    const response = await decisionContexts.handleCreateDecisionContextRequest(
      new Request("http://local/api/decision-contexts", { method: "POST", body: "{not-json" }),
      factory
    );
    expect(factory).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await errorBody(response)).toEqual({ success: false, error: { code: "ERR_DECISION_API_INVALID_JSON", message: "Request body must be valid JSON." } });
  });

  it("maps only caller-originating Context and authority rejections to 422 without leaking sealed errors", async () => {
    for (const internal of [
      new Error("ERR_DECISION_CONTEXT_DUPLICATE_SOURCE_STATE_REFERENCE"),
      new Error("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND")
    ]) {
      const { factory } = applicationFactory({ createRootDecisionContext: vi.fn(async () => { throw internal; }) });
      const response = await decisionContexts.handleCreateDecisionContextRequest(
        new Request("http://local/api/decision-contexts", { method: "POST", body: "{}" }),
        factory
      );
      expect(response.status).toBe(422);
      const payload = await errorBody(response);
      expect(payload).toEqual({ success: false, error: { code: "ERR_DECISION_API_REQUEST_REJECTED", message: "Decision Context request was rejected." } });
      expect(JSON.stringify(payload)).not.toContain(internal.message);
    }
  });

  it("maps immutable conflict narrowly and leaves revision, runtime, persistence, and database failures internal", async () => {
    const cases = [
      [new Error("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT"), 409, "ERR_DECISION_API_CONFLICT", "Decision Context revision conflicts with an existing immutable record."],
      [new Error("ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND"), 500, "ERR_DECISION_API_INTERNAL", "Decision Context service failed."],
      [new Error("ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID"), 500, "ERR_DECISION_API_INTERNAL", "Decision Context service failed."],
      [new Error("database password leaked"), 500, "ERR_DECISION_API_INTERNAL", "Decision Context service failed."]
    ] as const;
    for (const [internal, status, code, message] of cases) {
      const { factory } = applicationFactory({ createRootDecisionContext: vi.fn(async () => { throw internal; }) });
      const response = await decisionContexts.handleCreateDecisionContextRequest(new Request("http://local/api/decision-contexts", { method: "POST", body: "{}" }), factory);
      expect(response.status).toBe(status);
      const payload = await errorBody(response);
      expect(payload).toEqual({ success: false, error: { code, message } });
      expect(JSON.stringify(payload)).not.toContain(internal.message);
    }
  });

  it("passes the supplied revisionId unchanged, returns exact stored data, and maps null and thrown reads without any current/head/latest fallback", async () => {
    const stored = revision("READ");
    const opaqueId = "  not-a-normalized-DREV  ";
    const success = applicationFactory({ readDecisionContextRevision: vi.fn(async () => stored) });
    const response = await decisionContexts.handleReadDecisionContextRequest(opaqueId, success.factory);
    expect(success.factory).toHaveBeenCalledTimes(1);
    expect(success.application.readDecisionContextRevision).toHaveBeenCalledTimes(1);
    expect(success.application.readDecisionContextRevision).toHaveBeenCalledWith(opaqueId);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, revision: stored });

    const absent = applicationFactory({ readDecisionContextRevision: vi.fn(async () => null) });
    const absentResponse = await decisionContexts.handleReadDecisionContextRequest(opaqueId, absent.factory);
    expect(absentResponse.status).toBe(404);
    expect(await errorBody(absentResponse)).toEqual({ success: false, error: { code: "ERR_DECISION_API_NOT_FOUND", message: "Decision Context revision was not found." } });

    const internal = new Error("database read exploded");
    const failed = applicationFactory({ readDecisionContextRevision: vi.fn(async () => { throw internal; }) });
    const failedResponse = await decisionContexts.handleReadDecisionContextRequest(opaqueId, failed.factory);
    expect(failedResponse.status).toBe(500);
    const failedPayload = await errorBody(failedResponse);
    expect(failedPayload).toEqual({ success: false, error: { code: "ERR_DECISION_API_INTERNAL", message: "Decision Context service failed." } });
    expect(JSON.stringify(failedPayload)).not.toContain(internal.message);
  });

  it("exports exactly the two transport values and contains exactly the five public API codes without semantic, current-state, or infrastructure behavior", () => {
    expect(Object.keys(decisionContexts).sort()).toEqual(["handleCreateDecisionContextRequest", "handleReadDecisionContextRequest"]);
    const source = r4HttpProductionFiles.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect([...new Set(source.match(/ERR_DECISION_API_[A-Z_]+/g) ?? [])].sort()).toEqual([
      "ERR_DECISION_API_CONFLICT",
      "ERR_DECISION_API_INTERNAL",
      "ERR_DECISION_API_INVALID_JSON",
      "ERR_DECISION_API_NOT_FOUND",
      "ERR_DECISION_API_REQUEST_REJECTED"
    ]);
    const local = readFileSync(resolve(process.cwd(), "lib/decision-runtime/local/decision-context-api.ts"), "utf8");
    expect(local).toMatch(/PostgresCapabilityCoreRepository/);
    expect(local).toMatch(/from "\.\.\/\.\.\/career\/db\/client"/);
    expect(local).toMatch(/ensureDecisionRuntimePostgresSchema/);
    expect(local).toMatch(/createPostgresCapabilityDecisionApplicationRuntime/);
    expect(local).toMatch(/createPersistRootDecisionContextRevisionUseCase/);
    expect(local).not.toMatch(/career\/decisions|career\/orchestration|career\/repositories\/lifecycle|initDbSchema|career_decisions|career_commitments|career_actions|career_outcomes|career_feedback|career_learning_proposals|JobRepository|worker|queue|provider|model|OpenAI|Anthropic|Gemini|current|head|latest/i);
  });
});
