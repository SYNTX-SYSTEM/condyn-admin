import { beforeAll, describe, expect, it } from "vitest";
import { createDecisionContextDraft } from "../../lib/decision-core";
import { CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, CAPABILITY_CORE_PRODUCER_ID } from "../../lib/decision-adapters/capability-core";
import { CAREER_CANONICAL_FAMILIES, CAREER_CANONICAL_PRODUCER_ID, careerCanonicalItemLocator } from "../../lib/decision-adapters/career-canonical";
import { buildHrDecisionContextDraftInput, type HrDecisionContextDraftRequest } from "../../lib/hr-decision-context";
import { computeSnapshotKey } from "../../lib/career/capability-core";
import { deriveRecommendationPolicyRevisionId, deriveRecommendationProposal } from "../../lib/career/relation/recommendation-proposal";
import { createTargetRoleProfileRevision } from "../../lib/career/target/role";
import { createCareerCanonicalLocalFixture, createPhase4SnapshotFixture, localFixtureStamp, type CareerCanonicalLocalFixture } from "./fixtures/career-canonical-local-fixture";

let fixture: CareerCanonicalLocalFixture;
const request = (): HrDecisionContextDraftRequest => ({
  question: { statement: "Which proposed option should be pursued for this role?", actorId: "hr-r2" },
  sourceState: {
    verifiedCapabilitySnapshot: fixture.snapshot,
    recommendationProposal: fixture.recommendationProposal,
    evolutionInputState: fixture.evolutionInputState,
    tensionState: fixture.tensionState,
    roleRelation: fixture.roleRelation,
    targetRoleProfileRevision: fixture.profile,
    targetRequirementRevisions: [fixture.requirementA, fixture.requirementB]
  }
});

beforeAll(async () => { fixture = await createCareerCanonicalLocalFixture("R2"); }, 30_000);

describe("R2 HR decision context application layer", () => {
  it("builds OPTION items only from PROPOSED items with exact RCP item provenance, CONSTRAINT items from TRQREV, and the question from HUMAN_INPUT", () => {
    const proposal = fixture.recommendationProposal;
    const proposed = proposal.items.filter((item) => item.recommendationDisposition === "PROPOSED");
    expect(proposed.length).toBeGreaterThan(0);
    expect(proposal.items.length).toBeGreaterThan(proposed.length === proposal.items.length ? 0 : proposed.length);
    const input = buildHrDecisionContextDraftInput(request());

    const rcp = CAREER_CANONICAL_FAMILIES.RCP.authorityContractId;
    const byContract = (contractId: string) => input.sourceStateReferences.filter((reference) => reference.authorityContractId === contractId);
    expect(byContract(CAPABILITY_CORE_AUTHORITY_CONTRACT_ID)).toEqual([{ producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: fixture.snapshot.snapshotId, locator: computeSnapshotKey(fixture.snapshot) }]);
    expect(byContract(rcp).map((reference) => reference.locator).sort()).toEqual([proposal.recommendationProposalId, ...proposed.map((item) => careerCanonicalItemLocator(proposal.recommendationProposalId, item.sourceEvolutionInputItemOrdinal))].sort());
    expect(byContract(CAREER_CANONICAL_FAMILIES.EIS.authorityContractId)).toEqual([{ producerId: CAREER_CANONICAL_PRODUCER_ID, authorityContractId: CAREER_CANONICAL_FAMILIES.EIS.authorityContractId, artifactId: fixture.evolutionInputState.evolutionInputStateId, locator: fixture.evolutionInputState.evolutionInputStateId }]);
    expect(byContract(CAREER_CANONICAL_FAMILIES.TSN.authorityContractId).map((reference) => reference.artifactId)).toEqual([fixture.tensionState.tensionStateId]);
    expect(byContract(CAREER_CANONICAL_FAMILIES.RRL.authorityContractId).map((reference) => reference.artifactId)).toEqual([fixture.roleRelation.roleRelationId]);
    expect(byContract(CAREER_CANONICAL_FAMILIES.TRPREV.authorityContractId).map((reference) => reference.artifactId)).toEqual([fixture.profile.targetRoleProfileRevisionId]);
    expect(byContract(CAREER_CANONICAL_FAMILIES.TRQREV.authorityContractId).map((reference) => reference.artifactId).sort()).toEqual([fixture.requirementA.targetRequirementRevisionId, fixture.requirementB.targetRequirementRevisionId].sort());
    expect(input.sourceStateReferences.every((reference) => reference.producerId === CAREER_CANONICAL_PRODUCER_ID || reference.producerId === CAPABILITY_CORE_PRODUCER_ID)).toBe(true);

    const questions = input.items.filter((item) => item.role === "DECISION_QUESTION");
    expect(questions).toEqual([{ role: "DECISION_QUESTION", statement: "Which proposed option should be pursued for this role?", provenance: { origin: "HUMAN_INPUT", actorId: "hr-r2" } }]);
    const options = input.items.filter((item) => item.role === "OPTION");
    expect(options).toHaveLength(proposed.length);
    for (const [index, option] of options.entries()) {
      expect(option.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: CAREER_CANONICAL_PRODUCER_ID, authorityContractId: rcp, artifactId: proposal.recommendationProposalId, locator: careerCanonicalItemLocator(proposal.recommendationProposalId, proposed[index].sourceEvolutionInputItemOrdinal) } });
      expect(option.statement).toContain(`RCP item ${proposed[index].sourceEvolutionInputItemOrdinal}`);
      expect(option.statement).not.toContain(proposed[index].targetRequirementEntityId ?? "<<none>>");
    }
    const constraints = input.items.filter((item) => item.role === "CONSTRAINT");
    expect(constraints.map((item) => item.statement).sort()).toEqual(["Target requirement [OPTIONAL]: PostgreSQL", "Target requirement [REQUIRED]: TypeScript"]);
    expect(constraints.every((item) => item.provenance.origin === "AUTHORITATIVE_STATE" && item.provenance.stateReference.authorityContractId === CAREER_CANONICAL_FAMILIES.TRQREV.authorityContractId)).toBe(true);
    expect(input.items.map((item) => item.role).filter((role) => !["DECISION_QUESTION", "OPTION", "CONSTRAINT"].includes(role))).toEqual([]);

    const draft = createDecisionContextDraft(input);
    expect(draft.items).toHaveLength(input.items.length);
    expect(JSON.stringify(draft)).not.toContain("recommendationDisposition");
    expect(JSON.stringify(draft)).not.toContain(fixture.requirementA.targetRequirementEntityId);
  });

  it("is deterministic and returns a detached input", () => {
    const first = buildHrDecisionContextDraftInput(request());
    const second = buildHrDecisionContextDraftInput(request());
    expect(first).toEqual(second);
    expect(createDecisionContextDraft(first).contextId).toBe(createDecisionContextDraft(second).contextId);
    first.items.pop();
    expect(buildHrDecisionContextDraftInput(request()).items).toHaveLength(second.items.length);
  });

  it("fails closed on lineage mismatch, foreign authority state, missing question, and an RCP without a PROPOSED item", () => {
    const base = request();
    const mismatched = { ...base, sourceState: { ...base.sourceState, targetRequirementRevisions: [{ ...fixture.requirementA, targetRoleProfileRevisionId: "TRPREV_" + "0".repeat(32) }] } };
    expect(() => buildHrDecisionContextDraftInput(mismatched)).toThrow("ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID");
    const foreignProfile = { ...fixture.profile, targetRoleProfileRevisionId: fixture.profile.targetRoleProfileRevisionId.replace(/.$/, (c) => c === "0" ? "1" : "0") };
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, targetRoleProfileRevision: foreignProfile } })).toThrow("ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID");
    const otherSnapshot = { ...fixture.snapshot, snapshotId: "SNAP_OTHER" };
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, verifiedCapabilitySnapshot: otherSnapshot } })).toThrow("ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID");
    const genericSnapshot: Partial<typeof fixture.snapshot> = { ...fixture.snapshot };
    delete genericSnapshot.publication;
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, verifiedCapabilitySnapshot: genericSnapshot as typeof fixture.snapshot } })).toThrow("ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID");
    const otherValidSnapshot = createPhase4SnapshotFixture(undefined, "VFY_89ABCDEF0123456789ABCDEF");
    expect(otherValidSnapshot.snapshotId).not.toBe(fixture.snapshot.snapshotId);
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, verifiedCapabilitySnapshot: otherValidSnapshot } })).toThrow("ERR_HR_DECISION_CONTEXT_LINEAGE_MISMATCH");
    const { targetRoleProfileRevisionId, ...profileInput } = fixture.profile;
    void targetRoleProfileRevisionId;
    const otherValidProfile = createTargetRoleProfileRevision({ ...profileInput, profile: { ...profileInput.profile, roleSemanticDefinition: "Another role" } });
    expect(otherValidProfile.targetRoleProfileRevisionId).not.toBe(fixture.profile.targetRoleProfileRevisionId);
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, targetRoleProfileRevision: otherValidProfile } })).toThrow("ERR_HR_DECISION_CONTEXT_LINEAGE_MISMATCH");
    expect(() => buildHrDecisionContextDraftInput({ ...base, question: { statement: "   ", actorId: "hr" } })).toThrow("ERR_HR_DECISION_CONTEXT_QUESTION_INVALID");
    expect(() => buildHrDecisionContextDraftInput({ ...base, question: { statement: "Q?" } as never })).toThrow("ERR_HR_DECISION_CONTEXT_QUESTION_INVALID");
    expect(() => buildHrDecisionContextDraftInput({ sourceState: base.sourceState } as never)).toThrow("ERR_HR_DECISION_CONTEXT_REQUEST_INVALID");
  });

  it("refuses an RCP whose items carry no PROPOSED disposition and a proposal detached from the supplied EIS", () => {
    const base = request();
    const proposal = fixture.recommendationProposal;
    const abstained = { ...proposal, items: proposal.items.map((item) => ({ ...item, recommendationDisposition: "ABSTAINED" as const, recommendationKind: null })) };
    // Identity no longer recomputes, so the assert rejects before any disposition is read.
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, recommendationProposal: abstained } })).toThrow("ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID");
    const detachedEvolution = { ...fixture.evolutionInputState, evolutionInputStateId: "EIS_" + "F".repeat(32) };
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, evolutionInputState: detachedEvolution } })).toThrow("ERR_HR_DECISION_CONTEXT_SOURCE_STATE_INVALID");
    const abstainSemantic = { ...fixture.policy, rules: fixture.policy.rules.map((rule) => ({ ...rule, action: "ABSTAIN" as const, recommendationKind: null })) };
    const { recommendationPolicyRevisionId, createdAt, ...abstainBody } = abstainSemantic;
    void recommendationPolicyRevisionId; void createdAt;
    const abstainPolicy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(abstainBody), ...abstainBody, createdAt: localFixtureStamp };
    const abstainedProposal = deriveRecommendationProposal(fixture.evolutionInputState, abstainPolicy, { version: "recommendation-v1" }, localFixtureStamp);
    expect(abstainedProposal.items.every((item) => item.recommendationDisposition !== "PROPOSED")).toBe(true);
    expect(() => buildHrDecisionContextDraftInput({ ...base, sourceState: { ...base.sourceState, recommendationProposal: abstainedProposal } })).toThrow("ERR_HR_DECISION_CONTEXT_NO_PROPOSED_ITEM");
  });
});
