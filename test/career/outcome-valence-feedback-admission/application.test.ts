import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12JHistoricalFixture } from "../relation/outcome-valence-feedback-admission-declaration/t12j-historical-fixture";
import type { CareerOutcomeValenceDeclaration } from "../../../lib/career/relation/outcome-valence-declaration";

const modulePath = "../../../lib/career/outcome-valence-feedback-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-valence-feedback-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12JHistoricalFixture();
  return {
    careerOutcomeValenceDeclarationId: fixture.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId,
    admittedByActorId: " OUTCOME_VALENCE_ADMITTING_ACTOR_T41 ",
    admittedAt: "2027-02-08T01:00:00.000Z",
    admissionEvidenceRefs: [" evidence://outcome-valence-feedback-admission/t41/b ", "evidence://outcome-valence-feedback-admission/t41/a"],
    createdAt: "2027-02-08T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { outcomeValence?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12JHistoricalFixture();
  const outcomeValence = overrides.outcomeValence === undefined ? fixture.outcomeValenceDeclaration : overrides.outcomeValence;
  const outcomeValences = {
    getCareerOutcomeValenceDeclarationById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return outcomeValence && (outcomeValence as CareerOutcomeValenceDeclaration).careerOutcomeValenceDeclarationId === id
        ? structuredClone(outcomeValence as CareerOutcomeValenceDeclaration)
        : null;
    }),
  };
  const admissions = {
    persistCareerOutcomeValenceFeedbackAdmissionDeclaration: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, outcomeValences, admissions };
}

describe("T41 explicit CareerOutcomeValenceFeedbackAdmissionDeclaration application admission", () => {
  it("proves COVFAD is the exact post-COVD admission artifact and persists explicit admission rather than Feedback", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    const result = await api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(
      input,
      input.admittedByActorId.trim(),
      { outcomeValences: values.outcomeValences, admissions: values.admissions },
    );
    expect(values.outcomeValences.getCareerOutcomeValenceDeclarationById).toHaveBeenCalledTimes(1);
    expect(values.outcomeValences.getCareerOutcomeValenceDeclarationById).toHaveBeenCalledWith(input.careerOutcomeValenceDeclarationId);
    expect(values.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerOutcomeValenceDeclarationId: input.careerOutcomeValenceDeclarationId,
      careerOutcomeRoleDeclarationId: values.fixture.outcomeValenceDeclaration.careerOutcomeRoleDeclarationId,
      careerActionStateChangeAssociationDeclarationId: values.fixture.outcomeValenceDeclaration.careerActionStateChangeAssociationDeclarationId,
      admittedByActorId: "OUTCOME_VALENCE_ADMITTING_ACTOR_T41",
      admittedAt: input.admittedAt,
      admissionEvidenceRefs: ["evidence://outcome-valence-feedback-admission/t41/a", "evidence://outcome-valence-feedback-admission/t41/b"],
      createdAt: input.createdAt,
      valence: values.fixture.outcomeValenceDeclaration.valence,
      outcomeValenceDeclaredAt: values.fixture.outcomeValenceDeclaration.declaredAt,
    });
    expect(result).not.toHaveProperty("feedback");
    expect(result).not.toHaveProperty("learning");
    expect(result).not.toHaveProperty("target");
  });

  it("rejects an absent exact COVD without discovery, fallback, or persistence", async () => {
    const api = await load(); const values = dependencies({ outcomeValence: null }); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, input.admittedByActorId.trim(), { outcomeValences: values.outcomeValences, admissions: values.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_OUTCOME_VALENCE_NOT_FOUND");
    expect(values.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact COVD persistence without substituting another valence", async () => {
    const api = await load(); const baseline = dependencies();
    const values = dependencies({ outcomeValence: { ...baseline.fixture.outcomeValenceDeclaration, valence: "SUCCESS" } }); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, input.admittedByActorId.trim(), { outcomeValences: values.outcomeValences, admissions: values.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_OUTCOME_VALENCE_INVALID");
    expect(values.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration).not.toHaveBeenCalled();
  });

  it("requires established actor equality only with the independent explicit admitting actor", async () => {
    const api = await load(); const values = dependencies(); const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, "OTHER_ACTOR", { outcomeValences: values.outcomeValences, admissions: values.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMITTER_MISMATCH");
    expect(values.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration).not.toHaveBeenCalled();
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, input.admittedByActorId.trim(), { outcomeValences: values.outcomeValences, admissions: values.admissions }))
      .resolves.toMatchObject({
        admittedByActorId: input.admittedByActorId.trim(),
        outcomeValenceDeclaredByActorId: values.fixture.outcomeValenceDeclaration.declaredByActorId,
        outcomeRoleDeclaredByActorId: values.fixture.outcomeRoleDeclaration.declaredByActorId,
        associationDeclaredByActorId: values.fixture.associationDeclaration.declaredByActorId,
      });
  });

  it("preserves explicit admission chronology/evidence and copied valence without target, mutation, or feedback selection", async () => {
    const api = await load(); const values = dependencies();
    for (const input of [
      declaration({ admittedAt: "2027-02-07T00:59:59.999Z" }),
      declaration({ admissionEvidenceRefs: [] }),
      declaration({ admissionEvidenceRefs: ["evidence://outcome-valence-feedback-admission/t41/a", " evidence://outcome-valence-feedback-admission/t41/a "] }),
    ]) await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input as ReturnType<typeof declaration>, "OUTCOME_VALENCE_ADMITTING_ACTOR_T41", { outcomeValences: values.outcomeValences, admissions: values.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_INVALID");
    for (const forbidden of [
      "careerOutcomeRoleDeclarationId", "careerActionStateChangeAssociationDeclarationId", "valence", "target", "feedback", "learning", "causality",
    ]) await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(declaration({ [forbidden]: "caller-override" }) as ReturnType<typeof declaration>, "OUTCOME_VALENCE_ADMITTING_ACTOR_T41", { outcomeValences: values.outcomeValences, admissions: values.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMISSION_INVALID");
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted admission history", async () => {
    const api = await load(); const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, input.admittedByActorId.trim(), { outcomeValences: readFailure.outcomeValences, admissions: readFailure.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, input.admittedByActorId.trim(), { outcomeValences: conflict.outcomeValences, admissions: conflict.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_IMMUTABLE_CONFLICT");
    const base = dependencies(); const forged = dependencies({ persisted: { ...base.fixture.outcomeValenceFeedbackAdmissionDeclarationInput, admittedByActorId: "substituted" } });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(input, input.admittedByActorId.trim(), { outcomeValences: forged.outcomeValences, admissions: forged.admissions }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, target, mutation, learning, decision re-entry, or causality construction", async () => {
    await load(); const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|Target|Mutation|Learning|Recommendation|Decision|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|admittedByActorId\s*=/);
  });
});
