import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12EHistoricalFixture } from "../relation/action-occurrence/t12e-historical-fixture";
import type { CareerExecutionContextRevision } from "../../../lib/career/relation/execution-context-revision";

const modulePath = "../../../lib/career/action-occurrence-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/action-occurrence-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/action-occurrence-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12EHistoricalFixture();
  return {
    careerExecutionContextRevisionId: fixture.executionContext.careerExecutionContextRevisionId,
    performedByActorId: fixture.executionContext.declaredByActorId,
    occurredAt: "2027-02-03T01:00:00.000Z",
    occurrenceEvidenceRefs: [" evidence://occurrence/t36/b ", "evidence://occurrence/t36/a"],
    externalOccurrenceRef: " external://occurrence/t36/1 ",
    createdAt: "2027-02-03T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { context?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12EHistoricalFixture();
  const context = overrides.context === undefined ? fixture.executionContext : overrides.context;
  const contexts = {
    getCareerExecutionContextRevisionById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return context && (context as CareerExecutionContextRevision).careerExecutionContextRevisionId === id
        ? structuredClone(context as CareerExecutionContextRevision)
        : null;
    }),
  };
  const occurrences = {
    persistCareerActionOccurrence: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, contexts, occurrences };
}

describe("T36 explicit CareerActionOccurrence application admission", () => {
  it("proves AOC is the exact post-context artifact, exact-reads one ECTXREV, preserves explicit occurrence content, and persists one AOC", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();

    const result = await api.admitAndPersistCareerActionOccurrence(
      input,
      input.performedByActorId,
      { contexts: values.contexts, occurrences: values.occurrences },
    );

    expect(values.contexts.getCareerExecutionContextRevisionById).toHaveBeenCalledTimes(1);
    expect(values.contexts.getCareerExecutionContextRevisionById).toHaveBeenCalledWith(input.careerExecutionContextRevisionId);
    expect(values.occurrences.persistCareerActionOccurrence).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerExecutionContextRevisionId: input.careerExecutionContextRevisionId,
      performedByActorId: input.performedByActorId,
      occurredAt: input.occurredAt,
      occurrenceEvidenceRefs: ["evidence://occurrence/t36/a", "evidence://occurrence/t36/b"],
      externalOccurrenceRef: "external://occurrence/t36/1",
      createdAt: input.createdAt,
      careerExecutionAuthorityGrantRevisionId: values.fixture.executionContext.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: values.fixture.executionContext.careerHumanCommitmentId,
      careerDecisionActionIntentId: values.fixture.executionContext.careerDecisionActionIntentId,
      humanDecisionRecordId: values.fixture.executionContext.humanDecisionRecordId,
      careerDecisionContextRevisionId: values.fixture.executionContext.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.executionContext.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.executionContext.recommendationProposalId,
      decisionSubjects: values.fixture.executionContext.decisionSubjects,
      sourceDeclarationClass: values.fixture.executionContext.sourceDeclarationClass,
      sourceActionIntentClass: values.fixture.executionContext.sourceActionIntentClass,
      operationDescription: values.fixture.executionContext.operationDescription,
      executionAuthorityScope: values.fixture.executionContext.executionAuthorityScope,
      executionTarget: values.fixture.executionContext.executionTarget,
      executionChannel: values.fixture.executionContext.executionChannel,
    });
    expect(result).not.toHaveProperty("stateChange");
    expect(result).not.toHaveProperty("outcome");
  });

  it("rejects an absent exact ECTXREV without discovery, fallback, or persistence", async () => {
    const api = await load();
    const values = dependencies({ context: null });
    const input = declaration();
    await expect(api.admitAndPersistCareerActionOccurrence(input, input.performedByActorId, { contexts: values.contexts, occurrences: values.occurrences }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_CONTEXT_NOT_FOUND");
    expect(values.contexts.getCareerExecutionContextRevisionById).toHaveBeenCalledWith(input.careerExecutionContextRevisionId);
    expect(values.occurrences.persistCareerActionOccurrence).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact ECTXREV persistence without substituting another context", async () => {
    const api = await load();
    const baseline = dependencies();
    const values = dependencies({ context: { ...baseline.fixture.executionContext, operationDescription: "tampered" } });
    const input = declaration();
    await expect(api.admitAndPersistCareerActionOccurrence(input, input.performedByActorId, { contexts: values.contexts, occurrences: values.occurrences }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_CONTEXT_INVALID");
    expect(values.occurrences.persistCareerActionOccurrence).not.toHaveBeenCalled();
  });

  it("requires exact equality among established actor, explicit performer, and ECTXREV declarant", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    await expect(api.admitAndPersistCareerActionOccurrence(input, "OTHER_ACTOR", { contexts: values.contexts, occurrences: values.occurrences }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERFORMER_MISMATCH");
    expect(values.occurrences.persistCareerActionOccurrence).not.toHaveBeenCalled();
    const foreign = declaration({ performedByActorId: "OTHER_ACTOR" });
    await expect(api.admitAndPersistCareerActionOccurrence(foreign, "OTHER_ACTOR", { contexts: values.contexts, occurrences: values.occurrences }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERFORMER_MISMATCH");
    expect(values.occurrences.persistCareerActionOccurrence).not.toHaveBeenCalled();
  });

  it("leaves sealed explicit occurrence, time, evidence, and caller-lineage validation intact", async () => {
    const api = await load();
    const values = dependencies();
    for (const input of [
      declaration({ occurredAt: "2027-02-02T23:59:59.999Z" }),
      declaration({ occurredAt: "not-an-instant" }),
      declaration({ occurrenceEvidenceRefs: [] }),
      declaration({ externalOccurrenceRef: " " }),
    ]) {
      await expect(api.admitAndPersistCareerActionOccurrence(input as ReturnType<typeof declaration>, values.fixture.executionContext.declaredByActorId, { contexts: values.contexts, occurrences: values.occurrences }))
        .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_INVALID");
    }
    await expect(api.admitAndPersistCareerActionOccurrence(
      declaration({ inheritedLineage: "caller-override" }) as ReturnType<typeof declaration>,
      values.fixture.executionContext.declaredByActorId,
      { contexts: values.contexts, occurrences: values.occurrences },
    )).rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_ADMISSION_INVALID");
    expect(values.occurrences.persistCareerActionOccurrence).not.toHaveBeenCalled();
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted occurrence history", async () => {
    const api = await load();
    const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerActionOccurrence(input, input.performedByActorId, { contexts: readFailure.contexts, occurrences: readFailure.occurrences }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_ACTION_OCCURRENCE_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerActionOccurrence(input, input.performedByActorId, { contexts: conflict.contexts, occurrences: conflict.occurrences }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_IMMUTABLE_CONFLICT");
    const base = dependencies();
    const forged = dependencies({ persisted: { ...base.fixture.actionOccurrence, occurrenceEvidenceRefs: ["evidence://substituted"] } });
    await expect(api.admitAndPersistCareerActionOccurrence(input, input.performedByActorId, { contexts: forged.contexts, occurrences: forged.occurrences }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, or state-change construction", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    expect(source).toMatch(/export async function admitAndPersistCareerActionOccurrence/);
    expect(source).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|subject|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|StateChange|Association|Outcome|Feedback/i);
    expect(source).not.toMatch(/\.toLowerCase\(|performedByActorId\s*=/);
  });
});
