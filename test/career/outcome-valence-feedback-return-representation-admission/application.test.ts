import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT13CHistoricalFixture } from "../relation/outcome-valence-feedback-return-representation/t13c-historical-fixture";
import type { CareerOutcomeValenceFeedbackTargetRevisionBinding } from "../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";

const modulePath = "../../../lib/career/outcome-valence-feedback-return-representation-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-valence-feedback-return-representation-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-return-representation-admission/application");
}

async function input(overrides: Record<string, unknown> = {}) {
  const fixture = await createT13CHistoricalFixture();
  return {
    careerOutcomeValenceFeedbackTargetRevisionBindingId:
      fixture.careerOutcomeValenceFeedbackTargetRevisionBinding
        .careerOutcomeValenceFeedbackTargetRevisionBindingId,
    createdAt: fixture.representationInput.createdAt,
    ...overrides,
  };
}

async function dependencies(overrides: { binding?: unknown; getError?: Error } = {}) {
  const fixture = await createT13CHistoricalFixture();
  const binding = overrides.binding === undefined
    ? fixture.careerOutcomeValenceFeedbackTargetRevisionBinding
    : overrides.binding;
  const bindings = {
    getCareerOutcomeValenceFeedbackTargetRevisionBindingById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return binding && (binding as CareerOutcomeValenceFeedbackTargetRevisionBinding)
        .careerOutcomeValenceFeedbackTargetRevisionBindingId === id
        ? structuredClone(binding as CareerOutcomeValenceFeedbackTargetRevisionBinding)
        : null;
    }),
  };
  return { fixture, bindings };
}

describe("T44 deterministic CareerOutcomeValenceFeedbackReturnRepresentation application boundary", () => {
  it("exact-reads COVFTRB and creates only its deterministic seven-field represented-feedback payload", async () => {
    const api = await load(); const values = await dependencies(); const request = await input();
    const result = await api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(
      request, { bindings: values.bindings },
    );
    const binding = values.fixture.careerOutcomeValenceFeedbackTargetRevisionBinding;
    expect(values.bindings.getCareerOutcomeValenceFeedbackTargetRevisionBindingById)
      .toHaveBeenCalledExactlyOnceWith(request.careerOutcomeValenceFeedbackTargetRevisionBindingId);
    expect(result).toMatchObject({
      careerOutcomeValenceFeedbackTargetRevisionBinding: binding,
      createdAt: request.createdAt,
      representedFeedback: {
        feedbackKind: "OUTCOME_VALENCE_FEEDBACK",
        stateSubject: binding.careerOutcomeValenceFeedbackTargetDeclaration.stateSubject,
        stateDimension: binding.careerOutcomeValenceFeedbackTargetDeclaration.stateDimension,
        beforeObservation: binding.careerOutcomeValenceFeedbackTargetDeclaration.beforeObservation,
        afterObservation: binding.careerOutcomeValenceFeedbackTargetDeclaration.afterObservation,
        observedAt: binding.careerOutcomeValenceFeedbackTargetDeclaration.observedAt,
        valence: binding.careerOutcomeValenceFeedbackTargetDeclaration.valence,
      },
    });
    expect(result).not.toHaveProperty("delivery");
    expect(result).not.toHaveProperty("learning");
    expect(result).not.toHaveProperty("returnItem");
    result.representedFeedback.stateDimension = "caller-mutated";
    expect(binding.careerOutcomeValenceFeedbackTargetDeclaration.stateDimension).not.toBe("caller-mutated");
  });

  it("rejects absent and corrupt exact COVFTRB without selecting another binding", async () => {
    const api = await load(); const request = await input();
    const absent = await dependencies({ binding: null });
    await expect(api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(request, { bindings: absent.bindings }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_TARGET_REVISION_BINDING_NOT_FOUND");

    const baseline = await dependencies();
    const corrupt = await dependencies({
      binding: {
        ...baseline.fixture.careerOutcomeValenceFeedbackTargetRevisionBinding,
        createdAt: "not-an-iso-time",
      },
    });
    await expect(api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(request, { bindings: corrupt.bindings }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_TARGET_REVISION_BINDING_INVALID");
  });

  it("accepts no independent historical selectors and preserves exact bound target and every valence", async () => {
    const api = await load(); const values = await dependencies();
    for (const invalid of [
      await input({ careerOutcomeValenceFeedbackTargetRevisionBindingId: "COVFTRB_not-canonical" }),
      await input({ createdAt: "not-an-iso-time" }),
      await input({ targetCareerDecisionContextRevisionId: "DCTXREV_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" }),
      await input({ careerOutcomeValenceFeedbackTargetDeclarationId: "COVFTD_00000000000000000000000000000000" }),
    ]) await expect(api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(invalid, { bindings: values.bindings }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ADMISSION_INVALID");

    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const historical = await createT13CHistoricalFixture(valence);
      const value = await api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding({
        careerOutcomeValenceFeedbackTargetRevisionBindingId:
          historical.careerOutcomeValenceFeedbackTargetRevisionBinding
            .careerOutcomeValenceFeedbackTargetRevisionBindingId,
        createdAt: historical.representationInput.createdAt,
      }, {
        bindings: {
          async getCareerOutcomeValenceFeedbackTargetRevisionBindingById(id: string) {
            return id === historical.careerOutcomeValenceFeedbackTargetRevisionBinding
              .careerOutcomeValenceFeedbackTargetRevisionBindingId
              ? structuredClone(historical.careerOutcomeValenceFeedbackTargetRevisionBinding)
              : null;
          },
        },
      });
      expect(value.representedFeedback.valence).toBe(valence);
      expect(value.careerOutcomeValenceFeedbackTargetRevisionBinding.targetCareerDecisionContextRevision
        .careerDecisionContextRevisionId)
        .toBe(historical.careerOutcomeValenceFeedbackTargetRevisionBinding.targetCareerDecisionContextRevision
          .careerDecisionContextRevisionId);
    }
  });

  it("preserves binding repository failures and deterministic identity without persistence", async () => {
    const api = await load(); const request = await input();
    const failure = await dependencies({ getError: new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED") });
    await expect(api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(request, { bindings: failure.bindings }))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED");
    const values = await dependencies();
    const first = await api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(request, { bindings: values.bindings });
    const second = await api.createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding({
      ...request,
      createdAt: "2027-02-11T02:00:00.000Z",
    }, { bindings: values.bindings });
    expect(second.careerOutcomeValenceFeedbackReturnRepresentationId)
      .toBe(first.careerOutcomeValenceFeedbackReturnRepresentationId);
  });

  it("remains pure local representation construction without auth, target replacement, persistence, delivery, mutation, learning, re-entry, or causality", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(source).toMatch(/export async function createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding/);
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|persist|delivery|mutation|learning|Recommendation|causality/i);
    expect(executable).not.toMatch(/\.toLowerCase\(|targetCareerDecisionContextRevisionId\s*=/);
  });
});
