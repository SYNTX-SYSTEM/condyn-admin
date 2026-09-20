import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT13AHistoricalFixture } from "../relation/outcome-valence-feedback-target-declaration/t13a-historical-fixture";
import type { CareerOutcomeValenceFeedbackAdmissionDeclaration } from "../../../lib/career/relation/outcome-valence-feedback-admission-declaration";

const modulePath = "../../../lib/career/outcome-valence-feedback-target-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-valence-feedback-target-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-target-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT13AHistoricalFixture();
  return {
    careerOutcomeValenceFeedbackAdmissionDeclarationId:
      fixture.outcomeValenceFeedbackAdmissionDeclaration
        .careerOutcomeValenceFeedbackAdmissionDeclarationId,
    targetCareerDecisionContextRevisionId:
      "DCTXREV_0123456789ABCDEF0123456789ABCDEF",
    declaredByActorId: " OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T42 ",
    declaredAt: "2027-02-09T01:00:00.000Z",
    targetSelectionEvidenceRefs: [
      " evidence://outcome-valence-feedback-target/t42/b ",
      "evidence://outcome-valence-feedback-target/t42/a",
    ],
    createdAt: "2027-02-09T01:00:01.000Z",
    ...overrides,
  };
}

function dependencies(overrides: {
  admission?: unknown;
  getError?: Error;
  persistError?: Error;
  persisted?: unknown;
} = {}) {
  const fixture = createT13AHistoricalFixture();
  const admission = overrides.admission === undefined
    ? fixture.outcomeValenceFeedbackAdmissionDeclaration
    : overrides.admission;
  const admissions = {
    getCareerOutcomeValenceFeedbackAdmissionDeclarationById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return admission &&
        (admission as CareerOutcomeValenceFeedbackAdmissionDeclaration)
          .careerOutcomeValenceFeedbackAdmissionDeclarationId === id
        ? structuredClone(admission as CareerOutcomeValenceFeedbackAdmissionDeclaration)
        : null;
    }),
  };
  const targets = {
    persistCareerOutcomeValenceFeedbackTargetDeclaration: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, admissions, targets };
}

describe("T42 explicit CareerOutcomeValenceFeedbackTargetDeclaration application admission", () => {
  it("exact-reads COVFAD and persists an explicit decision-context target declaration only", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    const result = await api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input,
      input.declaredByActorId.trim(),
      { admissions: values.admissions, targets: values.targets },
    );
    expect(values.admissions.getCareerOutcomeValenceFeedbackAdmissionDeclarationById)
      .toHaveBeenCalledExactlyOnceWith(input.careerOutcomeValenceFeedbackAdmissionDeclarationId);
    expect(values.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerOutcomeValenceFeedbackAdmissionDeclarationId:
        input.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      targetCareerDecisionContextRevisionId: input.targetCareerDecisionContextRevisionId,
      declaredByActorId: input.declaredByActorId.trim(),
      declaredAt: input.declaredAt,
      targetSelectionEvidenceRefs: [
        "evidence://outcome-valence-feedback-target/t42/a",
        "evidence://outcome-valence-feedback-target/t42/b",
      ],
      valence: values.fixture.outcomeValenceDeclaration.valence,
      admittedByActorId: values.fixture.outcomeValenceFeedbackAdmissionDeclaration.admittedByActorId,
    });
    expect(result).not.toHaveProperty("feedback");
    expect(result).not.toHaveProperty("delivery");
    expect(result).not.toHaveProperty("learning");
    expect(result).not.toHaveProperty("targetCareerDecisionContextRevision");
  });

  it("rejects absent and corrupt exact COVFAD without discovery, target binding, or persistence", async () => {
    const api = await load();
    const input = declaration();
    const absent = dependencies({ admission: null });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, input.declaredByActorId.trim(), { admissions: absent.admissions, targets: absent.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_NOT_FOUND");
    expect(absent.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration).not.toHaveBeenCalled();

    const baseline = dependencies();
    const corrupt = dependencies({
      admission: { ...baseline.fixture.outcomeValenceFeedbackAdmissionDeclaration, valence: "SUCCESS" },
    });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, input.declaredByActorId.trim(), { admissions: corrupt.admissions, targets: corrupt.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
    expect(corrupt.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration).not.toHaveBeenCalled();
  });

  it("requires established actor equality only with the independently explicit target declarant", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, "OTHER_ACTOR", { admissions: values.admissions, targets: values.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_DECLARANT_MISMATCH");
    expect(values.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration).not.toHaveBeenCalled();
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, input.declaredByActorId.trim(), { admissions: values.admissions, targets: values.targets },
    )).resolves.toMatchObject({
      declaredByActorId: input.declaredByActorId.trim(),
      admittedByActorId: values.fixture.outcomeValenceFeedbackAdmissionDeclaration.admittedByActorId,
      outcomeValenceDeclaredByActorId: values.fixture.outcomeValenceDeclaration.declaredByActorId,
      outcomeRoleDeclaredByActorId: values.fixture.outcomeRoleDeclaration.declaredByActorId,
      associationDeclaredByActorId: values.fixture.associationDeclaration.declaredByActorId,
    });
  });

  it("preserves explicit target identity, chronology, evidence, valence, and sealed lineage", async () => {
    const api = await load();
    const values = dependencies();
    for (const invalid of [
      declaration({ targetCareerDecisionContextRevisionId: "DCTXREV_not-canonical" }),
      declaration({ declaredAt: "2027-02-08T00:59:59.999Z" }),
      declaration({ targetSelectionEvidenceRefs: [] }),
      declaration({ targetSelectionEvidenceRefs: ["evidence://outcome-valence-feedback-target/t42/a", " evidence://outcome-valence-feedback-target/t42/a "] }),
    ]) await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      invalid, "OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T42",
      { admissions: values.admissions, targets: values.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_INVALID");
    for (const forbidden of [
      "careerOutcomeValenceDeclarationId", "careerOutcomeRoleDeclarationId",
      "careerActionStateChangeAssociationDeclarationId", "valence", "feedback",
      "mutation", "learning", "targetCareerDecisionContextRevision",
    ]) await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      declaration({ [forbidden]: "caller-override" }),
      "OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T42",
      { admissions: values.admissions, targets: values.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
  });

  it("preserves repository and immutable-conflict failures and rejects malformed or non-identical persistence", async () => {
    const api = await load();
    const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, input.declaredByActorId.trim(), { admissions: readFailure.admissions, targets: readFailure.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, input.declaredByActorId.trim(), { admissions: conflict.admissions, targets: conflict.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_IMMUTABLE_CONFLICT");
    const forged = dependencies({ persisted: { ...input, declaredByActorId: "substituted" } });
    await expect(api.admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
      input, input.declaredByActorId.trim(), { admissions: forged.admissions, targets: forged.targets },
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED");
  });

  it("remains a target-declaration application boundary without auth, discovery, binding, delivery, mutation, learning, re-entry, or causality", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|bindCareer|delivery|mutation|learning|Recommendation|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|declaredByActorId\s*=/);
  });
});
