import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12AHistoricalFixture, t12aLater } from "../relation/action-intent/t12a-historical-fixture";
import type { HumanDecisionRecord } from "../../../lib/career/relation/decision-record";

const modulePath = "../../../lib/career/action-intent-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/action-intent-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/action-intent-admission/application");
}

function input(overrides: Record<string, unknown> = {}) {
  const fixture = createT12AHistoricalFixture();
  return {
    humanDecisionRecordId: fixture.decisionRecord.humanDecisionRecordId,
    declaredByActorId: fixture.decisionRecord.declarantActorId,
    actionIntentClass: "RECOMMENDATION_OPERATIONALIZATION" as const,
    operationDescription: "Explicit operationalization declared by the human",
    declaredAt: t12aLater,
    actionIntentEvidenceRefs: ["evidence://intent/t32/b", "evidence://intent/t32/a"],
    createdAt: t12aLater,
    ...overrides,
  };
}

function dependencies(overrides: { record?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12AHistoricalFixture();
  const record = overrides.record === undefined ? fixture.decisionRecord : overrides.record;
  const records = {
    getHumanDecisionRecordById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return record && (record as typeof fixture.decisionRecord).humanDecisionRecordId === id
        ? structuredClone(record as HumanDecisionRecord)
        : null;
    }),
  };
  const intents = {
    persistCareerDecisionActionIntent: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, records, intents };
}

describe("T32 explicit CareerDecisionActionIntent application admission", () => {
  it("exact-reads one DCR, requires the established actor, preserves explicit human declaration content, and persists one DAINT", async () => {
    const api = await load();
    const values = dependencies();
    const declaration = input();

    const result = await api.admitAndPersistCareerDecisionActionIntent(
      declaration,
      values.fixture.decisionRecord.declarantActorId,
      { records: values.records, intents: values.intents },
    );

    expect(values.records.getHumanDecisionRecordById).toHaveBeenCalledTimes(1);
    expect(values.records.getHumanDecisionRecordById).toHaveBeenCalledWith(declaration.humanDecisionRecordId);
    expect(values.intents.persistCareerDecisionActionIntent).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      humanDecisionRecordId: declaration.humanDecisionRecordId,
      declaredByActorId: declaration.declaredByActorId,
      actionIntentClass: declaration.actionIntentClass,
      operationDescription: declaration.operationDescription,
      declaredAt: declaration.declaredAt,
      actionIntentEvidenceRefs: ["evidence://intent/t32/a", "evidence://intent/t32/b"],
      createdAt: declaration.createdAt,
      careerDecisionContextRevisionId: values.fixture.decisionRecord.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.decisionRecord.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.decisionRecord.recommendationProposalId,
      decisionSubjects: values.fixture.decisionRecord.decisionSubjects,
      sourceDeclarationClass: values.fixture.decisionRecord.declarationClass,
    });
    expect(result).not.toHaveProperty("commitment");
    expect(result).not.toHaveProperty("executionAuthority");
    expect(result).not.toHaveProperty("actionOccurrence");
  });

  it("rejects an absent exact DCR without discovery, fallback, or persistence", async () => {
    const api = await load();
    const values = dependencies({ record: null });
    const declaration = input();

    await expect(api.admitAndPersistCareerDecisionActionIntent(declaration, declaration.declaredByActorId, { records: values.records, intents: values.intents }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_HUMAN_DECISION_RECORD_NOT_FOUND");
    expect(values.records.getHumanDecisionRecordById).toHaveBeenCalledWith(declaration.humanDecisionRecordId);
    expect(values.intents.persistCareerDecisionActionIntent).not.toHaveBeenCalled();
  });

  it("requires exact equality among the established actor, explicit declarant, and exact DCR declarant without correction", async () => {
    const api = await load();
    const values = dependencies();
    const declaration = input();
    await expect(api.admitAndPersistCareerDecisionActionIntent(declaration, "OTHER_ACTOR", { records: values.records, intents: values.intents }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_DECLARANT_MISMATCH");
    expect(values.intents.persistCareerDecisionActionIntent).not.toHaveBeenCalled();

    const foreign = input({ declaredByActorId: "OTHER_ACTOR" });
    await expect(api.admitAndPersistCareerDecisionActionIntent(foreign, "OTHER_ACTOR", { records: values.records, intents: values.intents }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_DECLARANT_MISMATCH");
    expect(values.intents.persistCareerDecisionActionIntent).not.toHaveBeenCalled();
  });

  it("leaves sealed DAINT declaration validation and source-class mapping intact", async () => {
    const api = await load();
    const values = dependencies();
    for (const declaration of [
      input({ actionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" }),
      input({ operationDescription: "   " }),
      input({ actionIntentEvidenceRefs: [] }),
      input({ declaredAt: "not-an-instant" }),
    ]) {
      await expect(api.admitAndPersistCareerDecisionActionIntent(declaration as ReturnType<typeof input>, values.fixture.decisionRecord.declarantActorId, { records: values.records, intents: values.intents }))
        .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    }
    expect(values.intents.persistCareerDecisionActionIntent).not.toHaveBeenCalled();
  });

  it("rejects malformed established actor input before reading and preserves repository and immutable-conflict failures", async () => {
    const api = await load();
    const values = dependencies();
    const declaration = input();
    await expect(api.admitAndPersistCareerDecisionActionIntent(declaration, " actor ", { records: values.records, intents: values.intents }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_ADMISSION_INVALID");
    expect(values.records.getHumanDecisionRecordById).not.toHaveBeenCalled();

    const readFailure = dependencies({ getError: new Error("ERR_HUMAN_DECISION_RECORD_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerDecisionActionIntent(declaration, declaration.declaredByActorId, { records: readFailure.records, intents: readFailure.intents }))
      .rejects.toThrow("ERR_HUMAN_DECISION_RECORD_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_DECISION_ACTION_INTENT_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerDecisionActionIntent(declaration, declaration.declaredByActorId, { records: conflict.records, intents: conflict.intents }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_IMMUTABLE_CONFLICT");
  });

  it("rejects a persistence response that is not the exact immutable DAINT and never fabricates missing history", async () => {
    const api = await load();
    const base = dependencies();
    const forged = dependencies({ persisted: { ...base.fixture.actionIntent, operationDescription: "substituted" } });
    const declaration = input();
    await expect(api.admitAndPersistCareerDecisionActionIntent(declaration, declaration.declaredByActorId, { records: forged.records, intents: forged.intents }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
  });

  it("remains a transport-independent application boundary with no JWT/header/provider/currentness or downstream construction", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    expect(source).toMatch(/export async function admitAndPersistCareerDecisionActionIntent/);
    expect(source).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|subject|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|HumanCommitment|ExecutionAuthority|ActionOccurrence|StateChange|Association|Outcome|Feedback/i);
    expect(source).not.toMatch(/\.toLowerCase\(|declaredByActorId\s*=/);
  });
});
