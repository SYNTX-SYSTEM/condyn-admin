import { describe, expect, it } from "vitest";
import { createCareerOutcomeRoleDeclaration } from "../../../../lib/career/relation/outcome-role-declaration";
import { exactRepository } from "../state-change-declaration/t12f-historical-fixture";
import { createT12HHistoricalFixture } from "./t12h-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/outcome-role-declaration/replay") as Promise<any>;
const missing = "CORD_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const base = createT12HHistoricalFixture();
  const outcomeRoleDeclaration = createCareerOutcomeRoleDeclaration(
    base.associationDeclaration,
    base.outcomeRoleDeclarationInput,
  );
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const declaration = item("declaration", outcomeRoleDeclaration);
  const physicalDeclarationId = item(
    "physicalDeclarationId",
    declaration === null ? null : declaration.careerOutcomeRoleDeclarationId,
  );
  const declarationCalls: string[] = [];
  return {
    base,
    declaration,
    declarations: {
      calls: declarationCalls,
      async getCareerOutcomeRoleDeclarationById(id: string) {
        declarationCalls.push(id);
        return declaration !== null && physicalDeclarationId === id ? structuredClone(declaration) : null;
      },
    },
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

describe("T12H CareerOutcomeRoleDeclaration replay RED contract", () => {
  it("constructs canonical RCP through CORD history before the replay boundary", () => {
    const value = graph();
    expect(value.base.outcomeRoleDeclarationInput.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.associationDeclaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.stateChangeDeclaration.observedAt > value.base.grant.effectiveUntil!).toBe(true);
  });

  it("freezes exactly BYTE_REPLAY, SEMANTIC_REPLAY, and DERIVATION_REPLAY with detached byte durable reads", async () => {
    const api = await loadReplay(); const value = graph(); const id = value.declaration.careerOutcomeRoleDeclarationId;
    const stored = await api.byteReplayCareerOutcomeRoleDeclaration(
      id, value,
    );
    expect(stored.careerOutcomeRoleDeclarationId).toBe(id);
    stored.stateSubject.subjectRef = "local";
    expect(value.associations.calls).toEqual([]);
    expect(value.stateChanges.calls).toEqual([]);
    await expect(api.byteReplayCareerOutcomeRoleDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND");
  });

  it("freezes SEMANTIC_REPLAY CORD -> ASCAD -> SCD -> AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay(); const value = graph(); const declaration = createCareerOutcomeRoleDeclaration(
      value.base.associationDeclaration, value.base.outcomeRoleDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeRoleDeclaration(declaration.careerOutcomeRoleDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(value.declarations.calls).toEqual([declaration.careerOutcomeRoleDeclarationId]);
    expect(value.associations.calls).toEqual([value.base.associationDeclaration.careerActionStateChangeAssociationDeclarationId]);
    expect(value.stateChanges.calls).toEqual([value.base.stateChangeDeclaration.careerStateChangeDeclarationId]);
    expect(value.occurrences.calls).toEqual([value.base.occurrence.careerActionOccurrenceId]);
    expect(value.contexts.calls).toEqual([value.base.executionContext.careerExecutionContextRevisionId]);
    expect(value.grants.calls).toEqual([value.base.grant.careerExecutionAuthorityGrantRevisionId]);
  });

  it("maps found corruption and missing predecessors to replay mismatch while derivation replays only deterministic CORD identity", async () => {
    const api = await loadReplay(); const value = graph(); const declaration = createCareerOutcomeRoleDeclaration(
      value.base.associationDeclaration, value.base.outcomeRoleDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeRoleDeclaration(declaration.careerOutcomeRoleDeclarationId, graph({
      declaration: { ...declaration, associationDeclaredAt: "2027-02-05T02:00:00.000Z" },
    }))).rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_REPLAY_MISMATCH");
    await expect(api.semanticReplayCareerOutcomeRoleDeclaration(declaration.careerOutcomeRoleDeclarationId, graph({ association: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_REPLAY_MISMATCH");
    await expect(api.derivationReplayCareerOutcomeRoleDeclaration(declaration.careerOutcomeRoleDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(value.associations.calls).toEqual([]);
    expect(value.stateChanges.calls).toEqual([]);
    await expect(api.derivationReplayCareerOutcomeRoleDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND");
  });

  it("preserves historical expiry without truth, effect, satisfaction, attribution, causal, provider, or regeneration authority", async () => {
    const api = await loadReplay(); const value = graph(); const declaration = createCareerOutcomeRoleDeclaration(
      value.base.associationDeclaration, value.base.outcomeRoleDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeRoleDeclaration(declaration.careerOutcomeRoleDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "providerReplayCareerOutcomeRoleDeclaration", "currentReplayCareerOutcomeRoleDeclaration",
      "getCurrentCareerOutcomeRoleDeclaration", "getLatestCareerOutcomeRoleDeclaration",
      "regenerateCareerOutcomeRoleDeclaration", "createCareerOutcome", "createOutcomeAttributionProposal",
    ]));
    if ("CAREER_OUTCOME_ROLE_DECLARATION_REPLAY_MODES" in api) {
      expect(api.CAREER_OUTCOME_ROLE_DECLARATION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
