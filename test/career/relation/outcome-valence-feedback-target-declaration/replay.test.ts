import { describe, expect, it } from "vitest";
import { createCareerOutcomeValenceFeedbackTargetDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import { exactRepository } from "../state-change-declaration/t12f-historical-fixture";
import { createT13AHistoricalFixture } from "./t13a-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-target-declaration/replay") as Promise<any>;
const missing = "COVFTD_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const base = createT13AHistoricalFixture();
  const declaration = createCareerOutcomeValenceFeedbackTargetDeclaration(
    base.outcomeValenceFeedbackAdmissionDeclaration,
    base.outcomeValenceFeedbackTargetDeclarationInput,
  );
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const target = item("declaration", declaration);
  const physicalDeclarationId = item(
    "physicalDeclarationId",
    target === null ? null : target.careerOutcomeValenceFeedbackTargetDeclarationId,
  );
  const targetCalls: string[] = [];
  return {
    base,
    declaration: target,
    targets: {
      calls: targetCalls,
      async getCareerOutcomeValenceFeedbackTargetDeclarationById(id: string) {
        targetCalls.push(id);
        return target !== null && physicalDeclarationId === id ? structuredClone(target) : null;
      },
    },
    admissions: exactRepository(
      item("admission", base.outcomeValenceFeedbackAdmissionDeclaration),
      "careerOutcomeValenceFeedbackAdmissionDeclarationId",
      "getCareerOutcomeValenceFeedbackAdmissionDeclarationById",
    ),
    outcomeValences: exactRepository(item("outcomeValence", base.outcomeValenceDeclaration), "careerOutcomeValenceDeclarationId", "getCareerOutcomeValenceDeclarationById"),
    outcomeRoles: exactRepository(item("outcomeRole", base.outcomeRoleDeclaration), "careerOutcomeRoleDeclarationId", "getCareerOutcomeRoleDeclarationById"),
    associations: exactRepository(item("association", base.associationDeclaration), "careerActionStateChangeAssociationDeclarationId", "getCareerActionStateChangeAssociationDeclarationById"),
    stateChanges: exactRepository(item("stateChange", base.stateChangeDeclaration), "careerStateChangeDeclarationId", "getCareerStateChangeDeclarationById"),
    occurrences: exactRepository(item("occurrence", base.occurrence), "careerActionOccurrenceId", "getCareerActionOccurrenceById"),
    contexts: exactRepository(item("executionContext", base.executionContext), "careerExecutionContextRevisionId", "getCareerExecutionContextRevisionById"),
    grants: exactRepository(item("grant", base.grant), "careerExecutionAuthorityGrantRevisionId", "getCareerExecutionAuthorityGrantRevisionById"),
    commitments: exactRepository(item("commitment", base.commitment), "careerHumanCommitmentId", "getCareerHumanCommitmentById"),
    intents: exactRepository(item("intent", base.actionIntent), "careerDecisionActionIntentId", "getCareerDecisionActionIntentById"),
    records: exactRepository(item("record", base.decisionRecord), "humanDecisionRecordId", "getHumanDecisionRecordById"),
    decisionContexts: exactRepository(item("decisionContext", base.context), "careerDecisionContextRevisionId", "getCareerDecisionContextRevisionById"),
    authorities: exactRepository(item("authority", base.authority), "decisionAuthorityGrantRevisionId", "getDecisionAuthorityGrantRevisionById"),
    proposals: exactRepository(item("proposal", base.proposal), "recommendationProposalId", "getRecommendationProposalById"),
  };
}

describe("T13A CareerOutcomeValenceFeedbackTargetDeclaration replay RED contract", () => {
  it("constructs canonical RCP through COVFTD history before the replay boundary", () => {
    const value = graph();
    expect(value.base.occurrence.occurredAt < value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.outcomeValenceFeedbackAdmissionDeclaration.admittedAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.declaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
  });

  it("freezes exactly BYTE_REPLAY, SEMANTIC_REPLAY, and DERIVATION_REPLAY with detached stored reads and no target traversal", async () => {
    const api = await loadReplay();
    const value = graph();
    const id = value.declaration.careerOutcomeValenceFeedbackTargetDeclarationId;
    const stored = await api.byteReplayCareerOutcomeValenceFeedbackTargetDeclaration(id, value);
    expect(stored.careerOutcomeValenceFeedbackTargetDeclarationId).toBe(id);
    stored.stateSubject.subjectRef = "local";
    expect(value.admissions.calls).toEqual([]);
    expect(value.outcomeValences.calls).toEqual([]);
    await expect(api.byteReplayCareerOutcomeValenceFeedbackTargetDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_NOT_FOUND");
  });

  it("freezes SEMANTIC_REPLAY COVFTD -> COVFAD -> COVD -> CORD -> ASCAD -> SCD -> AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP without prospective target traversal", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = value.declaration;
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration(
      declaration.careerOutcomeValenceFeedbackTargetDeclarationId,
      value,
    )).resolves.toEqual(declaration);
    expect(value.targets.calls).toEqual([declaration.careerOutcomeValenceFeedbackTargetDeclarationId]);
    expect(value.admissions.calls).toEqual([declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId]);
    expect(value.outcomeValences.calls).toEqual([value.base.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId]);
    expect(value.outcomeRoles.calls).toEqual([value.base.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId]);
    expect(value.associations.calls).toEqual([value.base.associationDeclaration.careerActionStateChangeAssociationDeclarationId]);
    expect(value.stateChanges.calls).toEqual([value.base.stateChangeDeclaration.careerStateChangeDeclarationId]);
    expect(value.occurrences.calls).toEqual([value.base.occurrence.careerActionOccurrenceId]);
    expect(value.contexts.calls).toEqual([value.base.executionContext.careerExecutionContextRevisionId]);
    expect(value.grants.calls).toEqual([value.base.grant.careerExecutionAuthorityGrantRevisionId]);
    expect(value.decisionContexts.calls).toEqual([value.base.context.careerDecisionContextRevisionId]);
  });

  it("maps found corruption and missing historical predecessors to replay mismatch while derivation replays only deterministic COVFTD identity", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = value.declaration;
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration(
      declaration.careerOutcomeValenceFeedbackTargetDeclarationId,
      graph({ declaration: { ...declaration, targetCareerDecisionContextRevisionId: "DCTXREV_not-canonical" } }),
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_REPLAY_MISMATCH");
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration(
      declaration.careerOutcomeValenceFeedbackTargetDeclarationId,
      graph({ admission: null }),
    )).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_REPLAY_MISMATCH");
    await expect(api.derivationReplayCareerOutcomeValenceFeedbackTargetDeclaration(
      declaration.careerOutcomeValenceFeedbackTargetDeclarationId,
      value,
    )).resolves.toEqual(declaration);
    expect(value.admissions.calls).toEqual([]);
    expect(value.outcomeValences.calls).toEqual([]);
    expect(value.outcomeRoles.calls).toEqual([]);
    await expect(api.derivationReplayCareerOutcomeValenceFeedbackTargetDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_NOT_FOUND");
  });

  it("preserves historical expiry without target binding, receiver, delivery, learning, evaluation, satisfaction, truth, effect, success, attribution, causal, provider, or regeneration authority", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = value.declaration;
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration(
      declaration.careerOutcomeValenceFeedbackTargetDeclarationId,
      value,
    )).resolves.toEqual(declaration);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "feedbackReplayCareerOutcomeValenceFeedbackTargetDeclaration",
      "getCurrentCareerOutcomeValenceFeedbackTargetDeclaration",
      "getLatestCareerOutcomeValenceFeedbackTargetDeclaration",
      "regenerateCareerOutcomeValenceFeedbackTargetDeclaration",
      "lookupCareerDecisionContextRevision", "bindCareerOutcomeValenceFeedbackTarget",
      "deliverCareerOutcomeValenceFeedbackTarget", "receiveCareerOutcomeValenceFeedbackTarget",
      "createContextMembership", "createContextRevision", "createLearning",
      "evaluateCareerOutcomeValenceFeedbackTarget", "satisfyCareerOutcomeValenceFeedbackTarget",
      "attributeCareerOutcomeValenceFeedbackTarget",
    ]));
    if ("CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_REPLAY_MODES" in api) {
      expect(api.CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
