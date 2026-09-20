import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT13BHistoricalFixture } from "../relation/outcome-valence-feedback-target-revision-binding/t13b-historical-fixture";
import type { CareerDecisionContextRevision } from "../../../lib/career/relation/decision-context";
import type { CareerOutcomeValenceFeedbackTargetDeclaration } from "../../../lib/career/relation/outcome-valence-feedback-target-declaration";

const modulePath = "../../../lib/career/outcome-valence-feedback-target-revision-binding-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-valence-feedback-target-revision-binding-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-target-revision-binding-admission/application");
}

function input(overrides: Record<string, unknown> = {}) {
  const fixture = createT13BHistoricalFixture();
  return {
    careerOutcomeValenceFeedbackTargetDeclarationId:
      fixture.outcomeValenceFeedbackTargetDeclaration
        .careerOutcomeValenceFeedbackTargetDeclarationId,
    createdAt: fixture.bindingInput.createdAt,
    ...overrides,
  };
}

function dependencies(overrides: {
  declaration?: unknown;
  target?: unknown;
  declarationError?: Error;
  targetError?: Error;
  persistError?: Error;
  persisted?: unknown;
} = {}) {
  const fixture = createT13BHistoricalFixture();
  const declaration = overrides.declaration === undefined
    ? fixture.outcomeValenceFeedbackTargetDeclaration
    : overrides.declaration;
  const target = overrides.target === undefined ? fixture.targetCareerDecisionContextRevision : overrides.target;
  const declarations = {
    getCareerOutcomeValenceFeedbackTargetDeclarationById: vi.fn(async (id: string) => {
      if (overrides.declarationError) throw overrides.declarationError;
      return declaration &&
        (declaration as CareerOutcomeValenceFeedbackTargetDeclaration)
          .careerOutcomeValenceFeedbackTargetDeclarationId === id
        ? structuredClone(declaration as CareerOutcomeValenceFeedbackTargetDeclaration)
        : null;
    }),
  };
  const decisionContexts = {
    getCareerDecisionContextRevisionById: vi.fn(async (id: string) => {
      if (overrides.targetError) throw overrides.targetError;
      return target && (target as CareerDecisionContextRevision).careerDecisionContextRevisionId === id
        ? structuredClone(target as CareerDecisionContextRevision)
        : null;
    }),
  };
  const bindings = {
    persistCareerOutcomeValenceFeedbackTargetRevisionBinding: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, declarations, decisionContexts, bindings };
}

describe("T43 deterministic CareerOutcomeValenceFeedbackTargetRevisionBinding application boundary", () => {
  it("exact-reads COVFTD and only its declared DCTXREV, then persists a detached deterministic binding", async () => {
    const api = await load();
    const values = dependencies();
    const request = input();
    const result = await api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(
      request,
      {
        declarations: values.declarations,
        decisionContexts: values.decisionContexts,
        bindings: values.bindings,
      },
    );
    const declaration = values.fixture.outcomeValenceFeedbackTargetDeclaration;
    const target = values.fixture.targetCareerDecisionContextRevision;
    expect(values.declarations.getCareerOutcomeValenceFeedbackTargetDeclarationById)
      .toHaveBeenCalledExactlyOnceWith(request.careerOutcomeValenceFeedbackTargetDeclarationId);
    expect(values.decisionContexts.getCareerDecisionContextRevisionById)
      .toHaveBeenCalledExactlyOnceWith(declaration.targetCareerDecisionContextRevisionId);
    expect(values.bindings.persistCareerOutcomeValenceFeedbackTargetRevisionBinding).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerOutcomeValenceFeedbackTargetDeclaration: declaration,
      targetCareerDecisionContextRevision: target,
      createdAt: request.createdAt,
    });
    result.targetCareerDecisionContextRevision.createdAt = "2027-02-10T09:00:00.000Z";
    expect(values.fixture.targetCareerDecisionContextRevision.createdAt).not.toBe(result.targetCareerDecisionContextRevision.createdAt);
  });

  it("rejects absent and corrupt COVFTD before target resolution or persistence", async () => {
    const api = await load(); const request = input();
    const absent = dependencies({ declaration: null });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, absent))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_DECLARATION_NOT_FOUND");
    expect(absent.decisionContexts.getCareerDecisionContextRevisionById).not.toHaveBeenCalled();
    expect(absent.bindings.persistCareerOutcomeValenceFeedbackTargetRevisionBinding).not.toHaveBeenCalled();

    const baseline = dependencies();
    const corrupt = dependencies({
      declaration: { ...baseline.fixture.outcomeValenceFeedbackTargetDeclaration, valence: "SUCCESS" },
    });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, corrupt))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_DECLARATION_INVALID");
    expect(corrupt.decisionContexts.getCareerDecisionContextRevisionById).not.toHaveBeenCalled();
  });

  it("rejects absent, corrupt, and mismatched exact target revisions without substitution", async () => {
    const api = await load(); const request = input();
    const absent = dependencies({ target: null });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, absent))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_NOT_FOUND");
    expect(absent.bindings.persistCareerOutcomeValenceFeedbackTargetRevisionBinding).not.toHaveBeenCalled();

    const baseline = dependencies();
    const corrupt = dependencies({
      target: { ...baseline.fixture.targetCareerDecisionContextRevision, decisionSubjects: [] },
    });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, corrupt))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_INVALID");

    const mismatch = dependencies();
    mismatch.decisionContexts.getCareerDecisionContextRevisionById.mockResolvedValue({
      ...mismatch.fixture.targetCareerDecisionContextRevision,
      careerDecisionContextRevisionId: "DCTXREV_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, mismatch))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_INVALID");
  });

  it("accepts no caller-selected historical operands beyond exact COVFTD and audit input", async () => {
    const api = await load(); const values = dependencies();
    for (const invalid of [
      input({ careerOutcomeValenceFeedbackTargetDeclarationId: "COVFTD_not-canonical" }),
      input({ createdAt: "not-an-iso-time" }),
      input({ targetCareerDecisionContextRevisionId: "DCTXREV_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" }),
      input({ admission: "caller-selected" }),
    ]) await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(invalid, values))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ADMISSION_INVALID");
  });

  it("preserves repository and immutable conflict failures and rejects non-identical persisted bindings", async () => {
    const api = await load(); const request = input();
    const readFailure = dependencies({ declarationError: new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED") });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, readFailure))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED");
    const targetFailure = dependencies({ targetError: new Error("ERR_CAREER_DECISION_CONTEXT_REVISION_PERSISTENCE_FAILED") });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, targetFailure))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_IMMUTABLE_CONFLICT") });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, conflict))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_IMMUTABLE_CONFLICT");
    const forged = dependencies({ persisted: { ...request, createdAt: request.createdAt } });
    await expect(api.bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(request, forged))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED");
  });

  it("is deterministic local composition without transport auth, mutation, feedback, delivery, learning, re-entry, or causality", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function bindAndPersistCareerOutcomeValenceFeedbackTargetRevision/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|delivery|mutation|learning|Recommendation|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|targetCareerDecisionContextRevisionId\s*=/);
  });
});
