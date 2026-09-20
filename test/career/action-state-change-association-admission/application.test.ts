import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12GHistoricalFixture } from "../relation/action-state-change-association-declaration/t12g-historical-fixture";
import type { CareerStateChangeDeclaration } from "../../../lib/career/relation/state-change-declaration";

const modulePath = "../../../lib/career/action-state-change-association-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/action-state-change-association-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/action-state-change-association-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12GHistoricalFixture();
  return {
    careerStateChangeDeclarationId: fixture.stateChangeDeclaration.careerStateChangeDeclarationId,
    declaredByActorId: " ASSOCIATION_DECLARANT_T38 ",
    declaredAt: "2027-02-05T01:00:00.000Z",
    associationEvidenceRefs: [" evidence://association/t38/b ", "evidence://association/t38/a"],
    createdAt: "2027-02-05T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { stateChange?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12GHistoricalFixture();
  const stateChange = overrides.stateChange === undefined ? fixture.stateChangeDeclaration : overrides.stateChange;
  const stateChanges = {
    getCareerStateChangeDeclarationById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return stateChange && (stateChange as CareerStateChangeDeclaration).careerStateChangeDeclarationId === id
        ? structuredClone(stateChange as CareerStateChangeDeclaration)
        : null;
    }),
  };
  const associations = {
    persistCareerActionStateChangeAssociationDeclaration: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, stateChanges, associations };
}

describe("T38 explicit CareerActionStateChangeAssociationDeclaration application admission", () => {
  it("proves ASCAD is the exact post-SCD artifact, reads one SCD, and persists an explicit non-causal association", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    const result = await api.admitAndPersistCareerActionStateChangeAssociationDeclaration(
      input,
      input.declaredByActorId.trim(),
      { stateChanges: values.stateChanges, associations: values.associations },
    );
    expect(values.stateChanges.getCareerStateChangeDeclarationById).toHaveBeenCalledTimes(1);
    expect(values.stateChanges.getCareerStateChangeDeclarationById).toHaveBeenCalledWith(input.careerStateChangeDeclarationId);
    expect(values.associations.persistCareerActionStateChangeAssociationDeclaration).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerStateChangeDeclarationId: input.careerStateChangeDeclarationId,
      careerActionOccurrenceId: values.fixture.stateChangeDeclaration.careerActionOccurrenceId,
      declaredByActorId: "ASSOCIATION_DECLARANT_T38",
      declaredAt: input.declaredAt,
      associationEvidenceRefs: ["evidence://association/t38/a", "evidence://association/t38/b"],
      createdAt: input.createdAt,
      careerExecutionContextRevisionId: values.fixture.stateChangeDeclaration.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: values.fixture.stateChangeDeclaration.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: values.fixture.stateChangeDeclaration.careerHumanCommitmentId,
      careerDecisionActionIntentId: values.fixture.stateChangeDeclaration.careerDecisionActionIntentId,
      humanDecisionRecordId: values.fixture.stateChangeDeclaration.humanDecisionRecordId,
      careerDecisionContextRevisionId: values.fixture.stateChangeDeclaration.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.stateChangeDeclaration.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.stateChangeDeclaration.recommendationProposalId,
      actionOccurredAt: values.fixture.stateChangeDeclaration.actionOccurredAt,
      observedAt: values.fixture.stateChangeDeclaration.observedAt,
    });
    expect(result).not.toHaveProperty("outcome");
    expect(result).not.toHaveProperty("causality");
  });

  it("rejects an absent exact SCD without AOC discovery, fallback, or persistence", async () => {
    const api = await load(); const values = dependencies({ stateChange: null }); const input = declaration();
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, input.declaredByActorId.trim(), { stateChanges: values.stateChanges, associations: values.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_STATE_CHANGE_NOT_FOUND");
    expect(values.associations.persistCareerActionStateChangeAssociationDeclaration).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact SCD persistence without substituting another SCD or occurrence", async () => {
    const api = await load(); const baseline = dependencies();
    const values = dependencies({ stateChange: { ...baseline.fixture.stateChangeDeclaration, stateDimension: "tampered" } }); const input = declaration();
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, input.declaredByActorId.trim(), { stateChanges: values.stateChanges, associations: values.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_STATE_CHANGE_INVALID");
    expect(values.associations.persistCareerActionStateChangeAssociationDeclaration).not.toHaveBeenCalled();
  });

  it("requires established actor equality only with the independent explicit association declarant", async () => {
    const api = await load(); const values = dependencies(); const input = declaration();
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, "OTHER_ACTOR", { stateChanges: values.stateChanges, associations: values.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_DECLARANT_MISMATCH");
    expect(values.associations.persistCareerActionStateChangeAssociationDeclaration).not.toHaveBeenCalled();
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, input.declaredByActorId.trim(), { stateChanges: values.stateChanges, associations: values.associations }))
      .resolves.toMatchObject({
        declaredByActorId: input.declaredByActorId.trim(),
        performedByActorId: values.fixture.occurrence.performedByActorId,
        observedByActorId: values.fixture.stateChangeDeclaration.observedByActorId,
      });
  });

  it("leaves the sealed explicit declaration, chronology, and parent-lineage validation intact", async () => {
    const api = await load(); const values = dependencies();
    for (const input of [
      declaration({ declaredAt: "2027-02-04T00:59:59.999Z" }),
      declaration({ associationEvidenceRefs: [] }),
      declaration({ associationEvidenceRefs: ["evidence://association/t38/a", " evidence://association/t38/a "] }),
    ]) await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input as ReturnType<typeof declaration>, "ASSOCIATION_DECLARANT_T38", { stateChanges: values.stateChanges, associations: values.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_INVALID");
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(declaration({ careerActionOccurrenceId: "AOC_00000000000000000000000000000000" }) as ReturnType<typeof declaration>, "ASSOCIATION_DECLARANT_T38", { stateChanges: values.stateChanges, associations: values.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_ADMISSION_INVALID");
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted association history", async () => {
    const api = await load(); const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, input.declaredByActorId.trim(), { stateChanges: readFailure.stateChanges, associations: readFailure.associations }))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, input.declaredByActorId.trim(), { stateChanges: conflict.stateChanges, associations: conflict.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_IMMUTABLE_CONFLICT");
    const base = dependencies(); const forged = dependencies({ persisted: { ...base.fixture.associationDeclaration, declaredByActorId: "substituted" } });
    await expect(api.admitAndPersistCareerActionStateChangeAssociationDeclaration(input, input.declaredByActorId.trim(), { stateChanges: forged.stateChanges, associations: forged.associations }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, outcome, feedback, or causality construction", async () => {
    await load(); const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function admitAndPersistCareerActionStateChangeAssociationDeclaration/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|Outcome|Feedback|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|declaredByActorId\s*=/);
  });
});
