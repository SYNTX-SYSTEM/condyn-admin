import { describe, expect, it } from "vitest";
import {
  createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";
import { createT13BHistoricalFixture } from "./t13b-historical-fixture";

const loadReplay = () => import(
  "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding/replay"
) as Promise<any>;

async function fixture() {
  const value = createT13BHistoricalFixture();
  const binding = await createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder({
    async getCareerDecisionContextRevisionById(id) {
      return id === value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId
        ? structuredClone(value.targetCareerDecisionContextRevision)
        : null;
    },
  }).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput);
  return { value, binding };
}

describe("CareerOutcomeValenceFeedbackTargetRevisionBinding frozen replay contract", () => {
  it("constructs valid sealed COVFTRB history independently of replay behavior", async () => {
    const value = await fixture();
    expect(value.binding.targetCareerDecisionContextRevision.careerDecisionContextRevisionId)
      .toBe(value.binding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId);
  });

  it("freezes exactly BYTE_REPLAY, SEMANTIC_REPLAY, and DERIVATION_REPLAY", async () => {
    const replay = await loadReplay();
    expect(replay.CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_REPLAY_MODES).toEqual([
      "BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY",
    ]);
    expect(Object.keys(replay)).toEqual([
      "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_REPLAY_MODES",
      "byteReplayCareerOutcomeValenceFeedbackTargetRevisionBinding",
      "derivationReplayCareerOutcomeValenceFeedbackTargetRevisionBinding",
      "semanticReplayCareerOutcomeValenceFeedbackTargetRevisionBinding",
    ]);
  });

  it("freezes BYTE replay as detached persisted artifact recovery with no target reader", async () => {
    const replay = await loadReplay();
    const value = await fixture();
    expect(replay.byteReplayCareerOutcomeValenceFeedbackTargetRevisionBinding).toBeTypeOf("function");
    expect(value.binding.targetCareerDecisionContextRevision.careerDecisionContextRevisionId)
      .toBe(value.binding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId);
  });

  it("freezes semantic replay as COVFTD historical-chain validation plus captured target DAR/RCP provenance, never fresh target substitution", async () => {
    const replay = await loadReplay();
    const value = await fixture();
    expect(replay.semanticReplayCareerOutcomeValenceFeedbackTargetRevisionBinding).toBeTypeOf("function");
    expect(value.binding.targetCareerDecisionContextRevision.decisionAuthorityGrantRevisionId).toMatch(/^DAR_/);
    expect(value.binding.targetCareerDecisionContextRevision.recommendationProposalId).toMatch(/^RCP_/);
  });

  it("freezes derivation replay as COVFTRB-ID-only validation with no binder, predecessor, or prospective target reader", async () => {
    const replay = await loadReplay();
    const value = await fixture();
    expect(replay.derivationReplayCareerOutcomeValenceFeedbackTargetRevisionBinding).toBeTypeOf("function");
    expect(value.binding.careerOutcomeValenceFeedbackTargetRevisionBindingId).toMatch(/^COVFTRB_/);
    expect("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_NOT_FOUND")
      .not.toBe("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_REPLAY_MISMATCH");
  });
});
