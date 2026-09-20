import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12FHistoricalFixture } from "../relation/state-change-declaration/t12f-historical-fixture";
import type { CareerActionOccurrence } from "../../../lib/career/relation/action-occurrence";

const modulePath = "../../../lib/career/state-change-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/state-change-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/state-change-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12FHistoricalFixture();
  return {
    careerActionOccurrenceId: fixture.occurrence.careerActionOccurrenceId,
    observedByActorId: "OBSERVER_T37",
    stateSubject: { subjectKind: "EXTERNAL_RESOURCE" as const, subjectRef: " state://application/t37/1 " },
    stateDimension: " application-status ",
    beforeObservation: { observationState: "OBSERVED" as const, value: " applied " },
    afterObservation: { observationState: "OBSERVED" as const, value: " interview-invited " },
    observedAt: "2027-02-04T01:00:00.000Z",
    stateChangeEvidenceRefs: [" evidence://state-change/t37/b ", "evidence://state-change/t37/a"],
    externalStateRef: { producerId: " producer-t37 ", authorityContractId: " contract-t37 ", artifactId: " artifact-t37 ", locator: " locator-t37 " },
    createdAt: "2027-02-04T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { occurrence?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12FHistoricalFixture();
  const occurrence = overrides.occurrence === undefined ? fixture.occurrence : overrides.occurrence;
  const occurrences = {
    getCareerActionOccurrenceById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return occurrence && (occurrence as CareerActionOccurrence).careerActionOccurrenceId === id
        ? structuredClone(occurrence as CareerActionOccurrence)
        : null;
    }),
  };
  const stateChanges = {
    persistCareerStateChangeDeclaration: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, occurrences, stateChanges };
}

describe("T37 explicit CareerStateChangeDeclaration application admission", () => {
  it("proves SCD is the exact post-AOC artifact, reads one AOC, preserves explicit observation content, and persists one SCD", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    const result = await api.admitAndPersistCareerStateChangeDeclaration(
      input,
      input.observedByActorId,
      { occurrences: values.occurrences, stateChanges: values.stateChanges },
    );
    expect(values.occurrences.getCareerActionOccurrenceById).toHaveBeenCalledTimes(1);
    expect(values.occurrences.getCareerActionOccurrenceById).toHaveBeenCalledWith(input.careerActionOccurrenceId);
    expect(values.stateChanges.persistCareerStateChangeDeclaration).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerActionOccurrenceId: input.careerActionOccurrenceId,
      observedByActorId: input.observedByActorId,
      stateSubject: { subjectKind: "EXTERNAL_RESOURCE", subjectRef: "state://application/t37/1" },
      stateDimension: "application-status",
      beforeObservation: { observationState: "OBSERVED", value: "applied" },
      afterObservation: { observationState: "OBSERVED", value: "interview-invited" },
      observedAt: input.observedAt,
      stateChangeEvidenceRefs: ["evidence://state-change/t37/a", "evidence://state-change/t37/b"],
      externalStateRef: { producerId: "producer-t37", authorityContractId: "contract-t37", artifactId: "artifact-t37", locator: "locator-t37" },
      createdAt: input.createdAt,
      careerExecutionContextRevisionId: values.fixture.occurrence.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: values.fixture.occurrence.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: values.fixture.occurrence.careerHumanCommitmentId,
      careerDecisionActionIntentId: values.fixture.occurrence.careerDecisionActionIntentId,
      humanDecisionRecordId: values.fixture.occurrence.humanDecisionRecordId,
      careerDecisionContextRevisionId: values.fixture.occurrence.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.occurrence.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.occurrence.recommendationProposalId,
      performedByActorId: values.fixture.occurrence.performedByActorId,
      actionOccurredAt: values.fixture.occurrence.occurredAt,
    });
    expect(result).not.toHaveProperty("association");
    expect(result).not.toHaveProperty("outcome");
  });

  it("rejects an absent exact AOC without discovery, fallback, or persistence", async () => {
    const api = await load(); const values = dependencies({ occurrence: null }); const input = declaration();
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, input.observedByActorId, { occurrences: values.occurrences, stateChanges: values.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_OCCURRENCE_NOT_FOUND");
    expect(values.stateChanges.persistCareerStateChangeDeclaration).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact AOC persistence without substituting another occurrence", async () => {
    const api = await load(); const baseline = dependencies();
    const values = dependencies({ occurrence: { ...baseline.fixture.occurrence, operationDescription: "tampered" } }); const input = declaration();
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, input.observedByActorId, { occurrences: values.occurrences, stateChanges: values.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_OCCURRENCE_INVALID");
    expect(values.stateChanges.persistCareerStateChangeDeclaration).not.toHaveBeenCalled();
  });

  it("requires established actor equality only with explicit observer, not the distinct action performer", async () => {
    const api = await load(); const values = dependencies(); const input = declaration();
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, "OTHER_ACTOR", { occurrences: values.occurrences, stateChanges: values.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_OBSERVER_MISMATCH");
    expect(values.stateChanges.persistCareerStateChangeDeclaration).not.toHaveBeenCalled();
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, input.observedByActorId, { occurrences: values.occurrences, stateChanges: values.stateChanges }))
      .resolves.toMatchObject({ observedByActorId: input.observedByActorId, performedByActorId: values.fixture.occurrence.performedByActorId });
  });

  it("leaves sealed explicit state-difference, temporal, and caller-lineage validation intact", async () => {
    const api = await load(); const values = dependencies();
    for (const input of [
      declaration({ beforeObservation: { observationState: "UNKNOWN", value: null } }),
      declaration({ afterObservation: { observationState: "OBSERVED", value: "applied" } }),
      declaration({ observedAt: "2027-02-03T00:00:00.000Z" }),
      declaration({ stateChangeEvidenceRefs: [] }),
    ]) await expect(api.admitAndPersistCareerStateChangeDeclaration(input as ReturnType<typeof declaration>, "OBSERVER_T37", { occurrences: values.occurrences, stateChanges: values.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_INVALID");
    await expect(api.admitAndPersistCareerStateChangeDeclaration(declaration({ inheritedLineage: "caller-override" }) as ReturnType<typeof declaration>, "OBSERVER_T37", { occurrences: values.occurrences, stateChanges: values.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_ADMISSION_INVALID");
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted state-change history", async () => {
    const api = await load(); const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, input.observedByActorId, { occurrences: readFailure.occurrences, stateChanges: readFailure.stateChanges }))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_STATE_CHANGE_DECLARATION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, input.observedByActorId, { occurrences: conflict.occurrences, stateChanges: conflict.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_IMMUTABLE_CONFLICT");
    const base = dependencies(); const forged = dependencies({ persisted: { ...base.fixture.stateChangeDeclaration, stateDimension: "substituted" } });
    await expect(api.admitAndPersistCareerStateChangeDeclaration(input, input.observedByActorId, { occurrences: forged.occurrences, stateChanges: forged.stateChanges }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, association, outcome, feedback, or causality construction", async () => {
    await load(); const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function admitAndPersistCareerStateChangeDeclaration/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|Association|Outcome|Feedback|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|observedByActorId\s*=/);
  });
});
