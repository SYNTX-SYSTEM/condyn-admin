import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12IHistoricalFixture } from "../relation/outcome-valence-declaration/t12i-historical-fixture";
import type { CareerOutcomeRoleDeclaration } from "../../../lib/career/relation/outcome-role-declaration";

const modulePath = "../../../lib/career/outcome-valence-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-valence-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12IHistoricalFixture();
  return {
    careerOutcomeRoleDeclarationId: fixture.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId,
    declaredByActorId: " OUTCOME_VALENCE_DECLARANT_T40 ",
    declaredAt: "2027-02-07T01:00:00.000Z",
    valence: "DESIRABLE" as const,
    valenceEvidenceRefs: [" evidence://outcome-valence/t40/b ", "evidence://outcome-valence/t40/a"],
    createdAt: "2027-02-07T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { outcomeRole?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12IHistoricalFixture();
  const outcomeRole = overrides.outcomeRole === undefined ? fixture.outcomeRoleDeclaration : overrides.outcomeRole;
  const outcomeRoles = {
    getCareerOutcomeRoleDeclarationById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return outcomeRole && (outcomeRole as CareerOutcomeRoleDeclaration).careerOutcomeRoleDeclarationId === id
        ? structuredClone(outcomeRole as CareerOutcomeRoleDeclaration)
        : null;
    }),
  };
  const outcomeValences = {
    persistCareerOutcomeValenceDeclaration: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, outcomeRoles, outcomeValences };
}

describe("T40 explicit CareerOutcomeValenceDeclaration application admission", () => {
  it("proves COVD is the exact post-CORD artifact, reads one CORD, and persists explicit valence without feedback", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    const result = await api.admitAndPersistCareerOutcomeValenceDeclaration(
      input,
      input.declaredByActorId.trim(),
      { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences },
    );
    expect(values.outcomeRoles.getCareerOutcomeRoleDeclarationById).toHaveBeenCalledTimes(1);
    expect(values.outcomeRoles.getCareerOutcomeRoleDeclarationById).toHaveBeenCalledWith(input.careerOutcomeRoleDeclarationId);
    expect(values.outcomeValences.persistCareerOutcomeValenceDeclaration).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerOutcomeRoleDeclarationId: input.careerOutcomeRoleDeclarationId,
      careerActionStateChangeAssociationDeclarationId: values.fixture.outcomeRoleDeclaration.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: values.fixture.outcomeRoleDeclaration.careerStateChangeDeclarationId,
      careerActionOccurrenceId: values.fixture.outcomeRoleDeclaration.careerActionOccurrenceId,
      declaredByActorId: "OUTCOME_VALENCE_DECLARANT_T40",
      declaredAt: input.declaredAt,
      valence: "DESIRABLE",
      valenceEvidenceRefs: ["evidence://outcome-valence/t40/a", "evidence://outcome-valence/t40/b"],
      createdAt: input.createdAt,
      associationDeclaredAt: values.fixture.outcomeRoleDeclaration.associationDeclaredAt,
      outcomeRoleDeclaredAt: values.fixture.outcomeRoleDeclaration.declaredAt,
    });
    expect(result).not.toHaveProperty("feedback");
    expect(result).not.toHaveProperty("causality");
    expect(result).not.toHaveProperty("effectiveness");
  });

  it("rejects an absent exact CORD without discovery, fallback, or persistence", async () => {
    const api = await load(); const values = dependencies({ outcomeRole: null }); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, input.declaredByActorId.trim(), { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_OUTCOME_ROLE_NOT_FOUND");
    expect(values.outcomeValences.persistCareerOutcomeValenceDeclaration).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact CORD persistence without substituting another outcome role", async () => {
    const api = await load(); const baseline = dependencies();
    const values = dependencies({ outcomeRole: { ...baseline.fixture.outcomeRoleDeclaration, stateDimension: "tampered" } }); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, input.declaredByActorId.trim(), { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_OUTCOME_ROLE_INVALID");
    expect(values.outcomeValences.persistCareerOutcomeValenceDeclaration).not.toHaveBeenCalled();
  });

  it("requires established actor equality only with the independent explicit valence declarant", async () => {
    const api = await load(); const values = dependencies(); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, "OTHER_ACTOR", { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_DECLARANT_MISMATCH");
    expect(values.outcomeValences.persistCareerOutcomeValenceDeclaration).not.toHaveBeenCalled();
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, input.declaredByActorId.trim(), { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
      .resolves.toMatchObject({
        declaredByActorId: input.declaredByActorId.trim(),
        outcomeRoleDeclaredByActorId: values.fixture.outcomeRoleDeclaration.declaredByActorId,
        associationDeclaredByActorId: values.fixture.associationDeclaration.declaredByActorId,
        observedByActorId: values.fixture.stateChangeDeclaration.observedByActorId,
        performedByActorId: values.fixture.occurrence.performedByActorId,
      });
  });

  it("preserves exactly DESIRABLE, UNDESIRABLE, NEUTRAL, and UNRESOLVED as explicit valence history", async () => {
    const api = await load(); const values = dependencies();
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(declaration({ valence }), "OUTCOME_VALENCE_DECLARANT_T40", { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
        .resolves.toMatchObject({ valence });
    }
    for (const input of [
      declaration({ valence: "SUCCESS" }),
      declaration({ valence: "UNKNOWN" }),
      declaration({ declaredAt: "2027-02-06T00:59:59.999Z" }),
      declaration({ valenceEvidenceRefs: [] }),
    ]) await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input as ReturnType<typeof declaration>, "OUTCOME_VALENCE_DECLARANT_T40", { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_INVALID");
    for (const forbidden of [
      "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId", "careerActionOccurrenceId", "success", "failure", "causality", "feedback",
    ]) await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(declaration({ [forbidden]: "caller-override" }) as ReturnType<typeof declaration>, "OUTCOME_VALENCE_DECLARANT_T40", { outcomeRoles: values.outcomeRoles, outcomeValences: values.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_ADMISSION_INVALID");
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted valence history", async () => {
    const api = await load(); const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, input.declaredByActorId.trim(), { outcomeRoles: readFailure.outcomeRoles, outcomeValences: readFailure.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, input.declaredByActorId.trim(), { outcomeRoles: conflict.outcomeRoles, outcomeValences: conflict.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_IMMUTABLE_CONFLICT");
    const base = dependencies(); const forged = dependencies({ persisted: { ...base.fixture.outcomeValenceDeclarationInput, valence: "UNDESIRABLE" } });
    await expect(api.admitAndPersistCareerOutcomeValenceDeclaration(input, input.declaredByActorId.trim(), { outcomeRoles: forged.outcomeRoles, outcomeValences: forged.outcomeValences }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, feedback, causality, effectiveness, or downstream construction", async () => {
    await load(); const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function admitAndPersistCareerOutcomeValenceDeclaration/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|Feedback|causality|effectiveness/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|declaredByActorId\s*=/);
  });
});
