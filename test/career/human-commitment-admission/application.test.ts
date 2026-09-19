import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12BHistoricalFixture } from "../relation/human-commitment/t12b-historical-fixture";
import type { CareerDecisionActionIntent } from "../../../lib/career/relation/action-intent";

const modulePath = "../../../lib/career/human-commitment-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/human-commitment-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/human-commitment-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12BHistoricalFixture();
  return {
    careerDecisionActionIntentId: fixture.actionIntent.careerDecisionActionIntentId,
    committedByActorId: fixture.actionIntent.declaredByActorId,
    committedAt: "2027-02-03T00:00:00.000Z",
    commitmentEvidenceRefs: ["evidence://commitment/t33/b", "evidence://commitment/t33/a"],
    createdAt: "2027-02-03T00:00:00.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { intent?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12BHistoricalFixture();
  const intent = overrides.intent === undefined ? fixture.actionIntent : overrides.intent;
  const intents = {
    getCareerDecisionActionIntentById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return intent && (intent as CareerDecisionActionIntent).careerDecisionActionIntentId === id
        ? structuredClone(intent as CareerDecisionActionIntent)
        : null;
    }),
  };
  const commitments = {
    persistCareerHumanCommitment: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, intents, commitments };
}

describe("T33 explicit CareerHumanCommitment application admission", () => {
  it("exact-reads one DAINT, requires the established actor, preserves explicit commitment content, and persists one HCOM", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();

    const result = await api.admitAndPersistCareerHumanCommitment(
      input,
      values.fixture.actionIntent.declaredByActorId,
      { intents: values.intents, commitments: values.commitments },
    );

    expect(values.intents.getCareerDecisionActionIntentById).toHaveBeenCalledTimes(1);
    expect(values.intents.getCareerDecisionActionIntentById).toHaveBeenCalledWith(input.careerDecisionActionIntentId);
    expect(values.commitments.persistCareerHumanCommitment).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerDecisionActionIntentId: input.careerDecisionActionIntentId,
      committedByActorId: input.committedByActorId,
      committedAt: input.committedAt,
      commitmentEvidenceRefs: ["evidence://commitment/t33/a", "evidence://commitment/t33/b"],
      createdAt: input.createdAt,
      humanDecisionRecordId: values.fixture.actionIntent.humanDecisionRecordId,
      careerDecisionContextRevisionId: values.fixture.actionIntent.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.actionIntent.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.actionIntent.recommendationProposalId,
      decisionSubjects: values.fixture.actionIntent.decisionSubjects,
      sourceDeclarationClass: values.fixture.actionIntent.sourceDeclarationClass,
      sourceActionIntentClass: values.fixture.actionIntent.actionIntentClass,
      operationDescription: values.fixture.actionIntent.operationDescription,
    });
    expect(result).not.toHaveProperty("executionAuthority");
    expect(result).not.toHaveProperty("executionContext");
    expect(result).not.toHaveProperty("actionOccurrence");
  });

  it("rejects an absent exact DAINT without discovery, fallback, or persistence", async () => {
    const api = await load();
    const values = dependencies({ intent: null });
    const input = declaration();

    await expect(api.admitAndPersistCareerHumanCommitment(input, input.committedByActorId, { intents: values.intents, commitments: values.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_ACTION_INTENT_NOT_FOUND");
    expect(values.intents.getCareerDecisionActionIntentById).toHaveBeenCalledWith(input.careerDecisionActionIntentId);
    expect(values.commitments.persistCareerHumanCommitment).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact DAINT persistence without substituting another parent", async () => {
    const api = await load();
    const baseline = dependencies();
    const values = dependencies({
      intent: { ...baseline.fixture.actionIntent, operationDescription: "tampered" },
    });
    const input = declaration();

    await expect(api.admitAndPersistCareerHumanCommitment(input, input.committedByActorId, { intents: values.intents, commitments: values.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_ACTION_INTENT_INVALID");
    expect(values.commitments.persistCareerHumanCommitment).not.toHaveBeenCalled();
  });

  it("requires exact equality among the established actor, explicit committer, and exact DAINT declarant without correction", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    await expect(api.admitAndPersistCareerHumanCommitment(input, "OTHER_ACTOR", { intents: values.intents, commitments: values.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_ACTOR_MISMATCH");
    expect(values.commitments.persistCareerHumanCommitment).not.toHaveBeenCalled();

    const foreign = declaration({ committedByActorId: "OTHER_ACTOR" });
    await expect(api.admitAndPersistCareerHumanCommitment(foreign, "OTHER_ACTOR", { intents: values.intents, commitments: values.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_ACTOR_MISMATCH");
    expect(values.commitments.persistCareerHumanCommitment).not.toHaveBeenCalled();
  });

  it("leaves sealed HCOM validation and its explicit human-history requirements intact", async () => {
    const api = await load();
    const values = dependencies();
    for (const input of [
      declaration({ commitmentEvidenceRefs: [] }),
      declaration({ commitmentEvidenceRefs: [" "] }),
      declaration({ committedAt: "not-an-instant" }),
      declaration({ committedAt: "2027-02-01T00:00:00.000Z" }),
    ]) {
      await expect(api.admitAndPersistCareerHumanCommitment(input as ReturnType<typeof declaration>, values.fixture.actionIntent.declaredByActorId, { intents: values.intents, commitments: values.commitments }))
        .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
    }
    await expect(api.admitAndPersistCareerHumanCommitment(
      declaration({ unrelatedLineage: "caller-override" }) as ReturnType<typeof declaration>,
      values.fixture.actionIntent.declaredByActorId,
      { intents: values.intents, commitments: values.commitments },
    )).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_ADMISSION_INVALID");
    expect(values.commitments.persistCareerHumanCommitment).not.toHaveBeenCalled();
  });

  it("rejects malformed established actor input before reading and preserves repository and immutable-conflict failures", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    await expect(api.admitAndPersistCareerHumanCommitment(input, " actor ", { intents: values.intents, commitments: values.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_ADMISSION_INVALID");
    expect(values.intents.getCareerDecisionActionIntentById).not.toHaveBeenCalled();

    const readFailure = dependencies({ getError: new Error("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerHumanCommitment(input, input.committedByActorId, { intents: readFailure.intents, commitments: readFailure.commitments }))
      .rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_HUMAN_COMMITMENT_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerHumanCommitment(input, input.committedByActorId, { intents: conflict.intents, commitments: conflict.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_IMMUTABLE_CONFLICT");
  });

  it("rejects a persistence response that is not the exact immutable HCOM and never fabricates missing history", async () => {
    const api = await load();
    const base = dependencies();
    const forged = dependencies({ persisted: { ...base.fixture.commitment, operationDescription: "substituted" } });
    const input = declaration();
    await expect(api.admitAndPersistCareerHumanCommitment(input, input.committedByActorId, { intents: forged.intents, commitments: forged.commitments }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
  });

  it("remains a transport-independent application boundary with no authentication, provider, currentness, or downstream construction", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    expect(source).toMatch(/export async function admitAndPersistCareerHumanCommitment/);
    expect(source).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|subject|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|ExecutionAuthority|ExecutionContext|ActionOccurrence|StateChange|Association|Outcome|Feedback/i);
    expect(source).not.toMatch(/\.toLowerCase\(|committedByActorId\s*=/);
  });
});
