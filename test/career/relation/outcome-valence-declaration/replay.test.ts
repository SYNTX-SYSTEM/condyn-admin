import { describe, expect, it } from "vitest";
import { createCareerOutcomeValenceDeclaration } from "../../../../lib/career/relation/outcome-valence-declaration";
import { exactRepository } from "../state-change-declaration/t12f-historical-fixture";
import { createT12IHistoricalFixture } from "./t12i-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/outcome-valence-declaration/replay") as Promise<any>;
const missing = "COVD_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const base = createT12IHistoricalFixture();
  const outcomeValenceDeclaration = createCareerOutcomeValenceDeclaration(
    base.outcomeRoleDeclaration,
    base.outcomeValenceDeclarationInput,
  );
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const declaration = item("declaration", outcomeValenceDeclaration);
  const physicalDeclarationId = item(
    "physicalDeclarationId",
    declaration === null ? null : declaration.careerOutcomeValenceDeclarationId,
  );
  const declarationCalls: string[] = [];
  return {
    base,
    declaration,
    declarations: {
      calls: declarationCalls,
      async getCareerOutcomeValenceDeclarationById(id: string) {
        declarationCalls.push(id);
        return declaration !== null && physicalDeclarationId === id ? structuredClone(declaration) : null;
      },
    },
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

describe("T12I CareerOutcomeValenceDeclaration replay RED contract", () => {
  it("constructs canonical RCP through COVD history before the replay boundary", () => {
    const value = graph();
    expect(value.base.occurrence.occurredAt < value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.stateChangeDeclaration.observedAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.associationDeclaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.outcomeRoleDeclaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.declaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
  });

  it("freezes exactly BYTE_REPLAY, SEMANTIC_REPLAY, and DERIVATION_REPLAY with detached stored reads", async () => {
    const api = await loadReplay();
    const value = graph();
    const id = value.declaration.careerOutcomeValenceDeclarationId;
    const stored = await api.byteReplayCareerOutcomeValenceDeclaration(id, value);
    expect(stored.careerOutcomeValenceDeclarationId).toBe(id);
    stored.stateSubject.subjectRef = "local";
    expect(value.outcomeRoles.calls).toEqual([]);
    expect(value.associations.calls).toEqual([]);
    expect(value.stateChanges.calls).toEqual([]);
    await expect(api.byteReplayCareerOutcomeValenceDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND");
  });

  it("freezes SEMANTIC_REPLAY COVD -> CORD -> ASCAD -> SCD -> AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = createCareerOutcomeValenceDeclaration(
      value.base.outcomeRoleDeclaration,
      value.base.outcomeValenceDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeValenceDeclaration(declaration.careerOutcomeValenceDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(value.declarations.calls).toEqual([declaration.careerOutcomeValenceDeclarationId]);
    expect(value.outcomeRoles.calls).toEqual([value.base.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId]);
    expect(value.associations.calls).toEqual([value.base.associationDeclaration.careerActionStateChangeAssociationDeclarationId]);
    expect(value.stateChanges.calls).toEqual([value.base.stateChangeDeclaration.careerStateChangeDeclarationId]);
    expect(value.occurrences.calls).toEqual([value.base.occurrence.careerActionOccurrenceId]);
    expect(value.contexts.calls).toEqual([value.base.executionContext.careerExecutionContextRevisionId]);
    expect(value.grants.calls).toEqual([value.base.grant.careerExecutionAuthorityGrantRevisionId]);
  });

  it("maps found corruption and missing predecessors to replay mismatch while derivation replays only deterministic COVD identity", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = createCareerOutcomeValenceDeclaration(
      value.base.outcomeRoleDeclaration,
      value.base.outcomeValenceDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeValenceDeclaration(declaration.careerOutcomeValenceDeclarationId, graph({
      declaration: { ...declaration, outcomeRoleDeclaredAt: "2027-02-06T02:00:00.000Z" },
    }))).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_REPLAY_MISMATCH");
    await expect(api.semanticReplayCareerOutcomeValenceDeclaration(declaration.careerOutcomeValenceDeclarationId, graph({ outcomeRole: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_REPLAY_MISMATCH");
    await expect(api.derivationReplayCareerOutcomeValenceDeclaration(declaration.careerOutcomeValenceDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(value.outcomeRoles.calls).toEqual([]);
    expect(value.associations.calls).toEqual([]);
    expect(value.stateChanges.calls).toEqual([]);
    await expect(api.derivationReplayCareerOutcomeValenceDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND");
  });

  it("preserves historical expiry without inferring valence, truth, effect, success, satisfaction, feedback, attribution, causal, provider, evaluation, or regeneration authority", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = createCareerOutcomeValenceDeclaration(
      value.base.outcomeRoleDeclaration,
      value.base.outcomeValenceDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeValenceDeclaration(declaration.careerOutcomeValenceDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "providerReplayCareerOutcomeValenceDeclaration", "currentReplayCareerOutcomeValenceDeclaration",
      "getCurrentCareerOutcomeValenceDeclaration", "getLatestCareerOutcomeValenceDeclaration",
      "regenerateCareerOutcomeValenceDeclaration", "evaluateCareerOutcomeValence", "createCareerOutcome",
      "createFeedback", "createAttribution", "createLearning",
    ]));
    if ("CAREER_OUTCOME_VALENCE_DECLARATION_REPLAY_MODES" in api) {
      expect(api.CAREER_OUTCOME_VALENCE_DECLARATION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
