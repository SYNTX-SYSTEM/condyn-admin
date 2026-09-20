import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12HHistoricalFixture } from "../relation/outcome-role-declaration/t12h-historical-fixture";
import type { CareerActionStateChangeAssociationDeclaration } from "../../../lib/career/relation/action-state-change-association-declaration";

const modulePath = "../../../lib/career/outcome-role-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-role-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-role-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12HHistoricalFixture();
  return {
    careerActionStateChangeAssociationDeclarationId:
      fixture.associationDeclaration.careerActionStateChangeAssociationDeclarationId,
    declaredByActorId: " OUTCOME_ROLE_DECLARANT_T39 ",
    declaredAt: "2027-02-06T01:00:00.000Z",
    outcomeRoleEvidenceRefs: [" evidence://outcome-role/t39/b ", "evidence://outcome-role/t39/a"],
    createdAt: "2027-02-06T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { association?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12HHistoricalFixture();
  const association = overrides.association === undefined ? fixture.associationDeclaration : overrides.association;
  const associations = {
    getCareerActionStateChangeAssociationDeclarationById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return association && (association as CareerActionStateChangeAssociationDeclaration).careerActionStateChangeAssociationDeclarationId === id
        ? structuredClone(association as CareerActionStateChangeAssociationDeclaration)
        : null;
    }),
  };
  const outcomeRoles = {
    persistCareerOutcomeRoleDeclaration: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, associations, outcomeRoles };
}

describe("T39 explicit CareerOutcomeRoleDeclaration application admission", () => {
  it("proves CORD is the exact post-ASCAD artifact, reads one ASCAD, and persists explicit outcome-role history without valence", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    const result = await api.admitAndPersistCareerOutcomeRoleDeclaration(
      input,
      input.declaredByActorId.trim(),
      { associations: values.associations, outcomeRoles: values.outcomeRoles },
    );
    expect(values.associations.getCareerActionStateChangeAssociationDeclarationById).toHaveBeenCalledTimes(1);
    expect(values.associations.getCareerActionStateChangeAssociationDeclarationById)
      .toHaveBeenCalledWith(input.careerActionStateChangeAssociationDeclarationId);
    expect(values.outcomeRoles.persistCareerOutcomeRoleDeclaration).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerActionStateChangeAssociationDeclarationId: input.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: values.fixture.associationDeclaration.careerStateChangeDeclarationId,
      careerActionOccurrenceId: values.fixture.associationDeclaration.careerActionOccurrenceId,
      declaredByActorId: "OUTCOME_ROLE_DECLARANT_T39",
      declaredAt: input.declaredAt,
      outcomeRoleEvidenceRefs: ["evidence://outcome-role/t39/a", "evidence://outcome-role/t39/b"],
      createdAt: input.createdAt,
      careerExecutionContextRevisionId: values.fixture.associationDeclaration.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: values.fixture.associationDeclaration.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: values.fixture.associationDeclaration.careerHumanCommitmentId,
      careerDecisionActionIntentId: values.fixture.associationDeclaration.careerDecisionActionIntentId,
      humanDecisionRecordId: values.fixture.associationDeclaration.humanDecisionRecordId,
      associationDeclaredAt: values.fixture.associationDeclaration.declaredAt,
    });
    expect(result).not.toHaveProperty("valence");
    expect(result).not.toHaveProperty("feedback");
    expect(result).not.toHaveProperty("causality");
  });

  it("rejects an absent exact ASCAD without discovery, fallback, or persistence", async () => {
    const api = await load(); const values = dependencies({ association: null }); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, input.declaredByActorId.trim(), { associations: values.associations, outcomeRoles: values.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ASSOCIATION_NOT_FOUND");
    expect(values.outcomeRoles.persistCareerOutcomeRoleDeclaration).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact ASCAD persistence without substituting another association", async () => {
    const api = await load(); const baseline = dependencies();
    const values = dependencies({ association: { ...baseline.fixture.associationDeclaration, stateDimension: "tampered" } }); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, input.declaredByActorId.trim(), { associations: values.associations, outcomeRoles: values.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ASSOCIATION_INVALID");
    expect(values.outcomeRoles.persistCareerOutcomeRoleDeclaration).not.toHaveBeenCalled();
  });

  it("requires established actor equality only with the independent explicit outcome-role declarant", async () => {
    const api = await load(); const values = dependencies(); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, "OTHER_ACTOR", { associations: values.associations, outcomeRoles: values.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_DECLARANT_MISMATCH");
    expect(values.outcomeRoles.persistCareerOutcomeRoleDeclaration).not.toHaveBeenCalled();
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, input.declaredByActorId.trim(), { associations: values.associations, outcomeRoles: values.outcomeRoles }))
      .resolves.toMatchObject({
        declaredByActorId: input.declaredByActorId.trim(),
        performedByActorId: values.fixture.occurrence.performedByActorId,
        observedByActorId: values.fixture.stateChangeDeclaration.observedByActorId,
        associationDeclaredByActorId: values.fixture.associationDeclaration.declaredByActorId,
      });
  });

  it("leaves sealed explicit role chronology, evidence, and caller-lineage validation intact without introducing valence", async () => {
    const api = await load(); const values = dependencies();
    for (const input of [
      declaration({ declaredAt: "2027-02-05T00:59:59.999Z" }),
      declaration({ outcomeRoleEvidenceRefs: [] }),
      declaration({ outcomeRoleEvidenceRefs: ["evidence://outcome-role/t39/a", " evidence://outcome-role/t39/a "] }),
    ]) await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input as ReturnType<typeof declaration>, "OUTCOME_ROLE_DECLARANT_T39", { associations: values.associations, outcomeRoles: values.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_INVALID");
    for (const forbidden of [
      "careerStateChangeDeclarationId", "careerActionOccurrenceId", "valence", "outcome", "causality", "feedback",
    ]) await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(declaration({ [forbidden]: "caller-override" }) as ReturnType<typeof declaration>, "OUTCOME_ROLE_DECLARANT_T39", { associations: values.associations, outcomeRoles: values.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ADMISSION_INVALID");
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted outcome-role history", async () => {
    const api = await load(); const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, input.declaredByActorId.trim(), { associations: readFailure.associations, outcomeRoles: readFailure.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_OUTCOME_ROLE_DECLARATION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, input.declaredByActorId.trim(), { associations: conflict.associations, outcomeRoles: conflict.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_IMMUTABLE_CONFLICT");
    const base = dependencies(); const forged = dependencies({ persisted: { ...base.fixture.outcomeRoleDeclarationInput, declaredByActorId: "substituted" } });
    await expect(api.admitAndPersistCareerOutcomeRoleDeclaration(input, input.declaredByActorId.trim(), { associations: forged.associations, outcomeRoles: forged.outcomeRoles }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, valence, feedback, or causality construction", async () => {
    await load(); const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function admitAndPersistCareerOutcomeRoleDeclaration/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|Valence|Feedback|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|declaredByActorId\s*=/);
  });
});
