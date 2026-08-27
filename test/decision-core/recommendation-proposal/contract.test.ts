import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as recommendationProposal from "../../../lib/decision-core/recommendation-proposal";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionRecommendationProposal,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createBoundDecisionRecommendationProposer,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  type DecisionAssessmentProposal,
  type DecisionAssessmentEvaluation,
  type DecisionContextRevision,
  type DecisionRecommendation
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option A", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option B", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Constraint", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}
const ids = (value: DecisionContextRevision, role: string): string[] => value.context.items.filter((item) => item.role === role).map((item) => item.itemId);
const first = (value: DecisionContextRevision, role: string): string => { const id = ids(value, role)[0]; if (id === undefined) throw new Error(`missing ${role}`); return id; };
async function assessment(build?: (value: DecisionContextRevision) => readonly DecisionAssessmentEvaluation[]): Promise<DecisionAssessmentProposal> {
  const value = revision(); const request = createDecisionAssessmentRequest({ revisionId: value.revisionId, requestedBy: { origin: "HUMAN_INPUT", actorId: "human" }, decisionQuestionItemId: first(value, "DECISION_QUESTION"), selectedOptionItemIds: ids(value, "OPTION"), selectedObjectiveItemIds: ids(value, "OBJECTIVE"), selectedConstraintItemIds: ids(value, "CONSTRAINT") });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
  const output = build?.(value) ?? [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "assessment" }];
  return createBoundDecisionAssessmentProposer({ evaluate: async () => output }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "assessment" });
}
const recommendation = (proposal: DecisionAssessmentProposal, overrides: Partial<DecisionRecommendation> = {}): DecisionRecommendation => ({ optionItemId: proposal.assessments[0]?.optionItemId ?? proposal.assessmentBasis.assessmentRequest.selectedOptionItemIds[0], rationale: " rationale ", ...overrides });
const proposerFor = (output: readonly DecisionRecommendation[]) => createBoundDecisionRecommendationProposer({ recommend: async () => output });
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

describe("Decision Recommendation Proposal", () => {
  it("creates zero, single, and multiple canonical recommendations without ranking", async () => {
    const proposal = await assessment();
    await expect(proposerFor([]).propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef: "zero" })).resolves.toMatchObject({ recommendations: [] });
    const noAssessments = await assessment(() => []);
    await expect(proposerFor([]).propose(noAssessments, { origin: "MODEL_PROPOSAL", proposalRef: "zero-empty-assessment" })).resolves.toMatchObject({ recommendations: [] });
    const multipleAssessment = await assessment((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "A" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: first(value, "OBJECTIVE"), disposition: "MISALIGNED", rationale: "B" }
    ]);
    const result = await proposerFor([recommendation(multipleAssessment, { optionItemId: multipleAssessment.assessmentBasis.assessmentRequest.selectedOptionItemIds[1] }), recommendation(multipleAssessment)]).propose(multipleAssessment, { origin: "MODEL_PROPOSAL", proposalRef: " multiple " });
    expect(result).toMatchObject({ artifactKind: "DECISION_RECOMMENDATION_PROPOSAL", schemaVersion: "DECISION_RECOMMENDATION_PROPOSAL_V1", proposedBy: { origin: "MODEL_PROPOSAL", proposalRef: "multiple" } });
    expect(result.recommendations).toHaveLength(2); expect(result.recommendations.every((item) => item.rationale === "rationale")).toBe(true);
  });

  it("permits selected assessed options regardless of disposition but rejects unassessed and unselected targets", async () => {
    for (const disposition of ["ALIGNED", "PARTIALLY_ALIGNED", "MISALIGNED", "UNDETERMINED"] as const) {
      const rebuilt = await assessment((value) => [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition, rationale: "assessment" }]);
      await expect(proposerFor([recommendation(rebuilt)]).propose(rebuilt, { origin: "MODEL_PROPOSAL", proposalRef: disposition })).resolves.toBeDefined();
    }
    const oneAssessed = await assessment(); const selectedUnassessed = oneAssessed.assessmentBasis.assessmentRequest.selectedOptionItemIds[1];
    await expect(proposerFor([recommendation(oneAssessed, { optionItemId: selectedUnassessed })]).propose(oneAssessed, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_ASSESSED");
    await expect(proposerFor([recommendation(oneAssessed, { optionItemId: "DCI_999999999999999999999999" })]).propose(oneAssessed, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_SELECTED");
    await expect(proposerFor([recommendation(oneAssessed, { optionItemId: "not-an-id" })]).propose(oneAssessed, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID");
  });

  it("hardens generator composition and captures the generator method", async () => {
    const proposal = await assessment(); const valid = { recommend: async () => [] as DecisionRecommendation[] };
    const invalid = [{ ...valid, extra: true }, {}, null, [], 1, "generator", (() => { const value = { ...valid }; Object.defineProperty(value, Symbol("x"), { enumerable: true, value: true }); return value; })(), (() => { const value = { ...valid }; Object.defineProperty(value, "recommend", { enumerable: false, value: valid.recommend }); return value; })()];
    for (const value of invalid) expect(() => createBoundDecisionRecommendationProposer(value as never)).toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID");
    let getterCalls = 0; const accessor = {}; Object.defineProperty(accessor, "recommend", { enumerable: true, get: () => { getterCalls += 1; return valid.recommend; } });
    expect(() => createBoundDecisionRecommendationProposer(accessor as never)).toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID"); expect(getterCalls).toBe(0);
    let receiver: unknown; const generator = { recommend: async function () { receiver = this; return []; } }; const bound = createBoundDecisionRecommendationProposer(generator); generator.recommend = async () => { throw new Error("redirected"); };
    await expect(bound.propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).resolves.toBeDefined(); expect(receiver).toBe(generator);
  });

  it("captures proposal and provenance before generator await and isolates generator-owned output", async () => {
    const proposal = await assessment(); const original = structuredClone(proposal); const provenance = { origin: "MODEL_PROPOSAL" as const, proposalRef: "original" }; const output = [recommendation(proposal)];
    let received: DecisionAssessmentProposal | undefined; let release: (() => void) | undefined;
    const bound = createBoundDecisionRecommendationProposer({ recommend: async (input) => { received = input.assessmentProposal; return new Promise<DecisionRecommendation[]>((resolve) => { release = () => resolve(output); }); } });
    const pending = bound.propose(proposal, provenance); proposal.assessments[0].rationale = "changed"; provenance.proposalRef = "changed"; release?.(); const result = await pending;
    expect(received).toEqual(original); expect(result.assessmentProposal).toEqual(original); expect(result.proposedBy.proposalRef).toBe("original"); const resultId = result.recommendationProposalId;
    output[0].rationale = "changed"; output.push(recommendation(original)); expect(result.recommendations).toEqual([recommendation(original, { rationale: "rationale" })]); expect(result.recommendationProposalId).toBe(resultId);
  });

  it("rejects hostile provenance, proposal, and generator output before unsafe use", async () => {
    const proposal = await assessment(); let calls = 0; let getterCalls = 0;
    const provenance = { origin: "MODEL_PROPOSAL" } as Record<string, unknown>; Object.defineProperty(provenance, "proposalRef", { enumerable: true, get: () => { getterCalls += 1; return "p"; } });
    for (const value of [provenance, { origin: "MODEL_PROPOSAL" }, { origin: "HUMAN_INPUT", proposalRef: "p" }, { origin: "MODEL_PROPOSAL", proposalRef: " " }, { origin: "MODEL_PROPOSAL", proposalRef: "p", extra: true }, (() => { const value = { origin: "MODEL_PROPOSAL", proposalRef: "p" }; Object.defineProperty(value, Symbol("x"), { enumerable: true, value: true }); return value; })()]) await expect(createBoundDecisionRecommendationProposer({ recommend: async () => { calls += 1; return []; } }).propose(proposal, value as never)).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_PROVENANCE_INVALID");
    const hostileProposal = structuredClone(proposal); Object.defineProperty(hostileProposal.assessments[0], "rationale", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "x"; } });
    await expect(createBoundDecisionRecommendationProposer({ recommend: async () => { calls += 1; return []; } }).propose(hostileProposal, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_ASSESSMENT_PROPOSAL_INVALID");
    const hostileOutput = [recommendation(proposal)]; Object.defineProperty(hostileOutput, "0", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return recommendation(proposal); } });
    const hostileField = recommendation(proposal) as unknown as Record<string, unknown>; Object.defineProperty(hostileField, "rationale", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "x"; } });
    await expect(proposerFor(hostileOutput).propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID");
    await expect(proposerFor([hostileField] as never).propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID");
    expect(getterCalls).toBe(0); expect(calls).toBe(0);
  });

  it("validates duplicate and rationale output errors, and canonicalizes order and identity", async () => {
    const base = await assessment();
    await expect(proposerFor([recommendation(base), recommendation(base, { rationale: "other" })]).propose(base, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_DUPLICATE");
    for (const output of [[recommendation(base, { rationale: " " })], [{ optionItemId: base.assessments[0].optionItemId }]]) await expect(proposerFor(output as never).propose(base, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID");
  });

  it("canonicalizes recommendation order and commits complete proposal, provenance, option, and rationale identity axes", async () => {
    const multi = await assessment((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "A" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "B" }
    ]);
    const one = recommendation(multi); const two = recommendation(multi, { optionItemId: multi.assessmentBasis.assessmentRequest.selectedOptionItemIds[1], rationale: "two" });
    const left = await proposerFor([one, two]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }); const right = await proposerFor([two, one]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    expect(right.recommendations).toEqual(left.recommendations); expect(right.recommendationProposalId).toBe(left.recommendationProposalId);
    const reordered = reorder(multi) as DecisionAssessmentProposal; const same = await proposerFor([one, two]).propose(reordered, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }); expect(same.recommendationProposalId).toBe(left.recommendationProposalId);
    const variants = [
      await proposerFor([one, two]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "other" }),
      await proposerFor([recommendation(multi, { rationale: "other rationale" }), two]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }),
      await proposerFor([one]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "ref" })
    ];
    for (const variant of variants) expect(variant.recommendationProposalId).not.toBe(left.recommendationProposalId);
    const optionA = await proposerFor([one]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }); const optionB = await proposerFor([two]).propose(multi, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    expect(optionB.recommendationProposalId).not.toBe(optionA.recommendationProposalId);
    const changedAssessment = await assessment((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "changed assessment state" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "B" }
    ]);
    const changed = await proposerFor([recommendation(changedAssessment), recommendation(changedAssessment, { optionItemId: changedAssessment.assessmentBasis.assessmentRequest.selectedOptionItemIds[1], rationale: "two" })]).propose(changedAssessment, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    expect(changed.recommendationProposalId).not.toBe(left.recommendationProposalId);
  });

  it("asserts exact canonical stored recommendation proposals and distinguishes stale IDs", async () => {
    const proposal = await assessment(); const result = await proposerFor([recommendation(proposal)]).propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }); assertDecisionRecommendationProposal(result);
    const stale = structuredClone(result); stale.recommendations[0].rationale = "other valid"; expect(() => assertDecisionRecommendationProposal(stale)).toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH");
    const cases: unknown[] = [{ ...result, extra: true }]; const untrimmed = structuredClone(result); untrimmed.recommendations[0].rationale = " rationale "; cases.push(untrimmed); const untrimmedProvenance = structuredClone(result); untrimmedProvenance.proposedBy.proposalRef = " ref "; cases.push(untrimmedProvenance); const duplicate = structuredClone(result); (duplicate.recommendations as DecisionRecommendation[]).push(structuredClone(duplicate.recommendations[0])); cases.push(duplicate); const selectedUnassessed = structuredClone(result); selectedUnassessed.recommendations[0].optionItemId = result.assessmentProposal.assessmentBasis.assessmentRequest.selectedOptionItemIds[1]; cases.push(selectedUnassessed); const unselected = structuredClone(result); unselected.recommendations[0].optionItemId = result.assessmentProposal.assessments[0].criterionItemId; cases.push(unselected);
    for (const value of cases) expect(() => assertDecisionRecommendationProposal(value)).toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID");
  });

  it("rejects only noncanonical stored recommendation order after valid selected and assessed admission", async () => {
    const assessed = await assessment((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "A" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "B" }
    ]);
    const valid = await proposerFor([
      recommendation(assessed),
      recommendation(assessed, { optionItemId: assessed.assessmentBasis.assessmentRequest.selectedOptionItemIds[1], rationale: "two" })
    ]).propose(assessed, { origin: "MODEL_PROPOSAL", proposalRef: "order" });
    assertDecisionRecommendationProposal(valid);
    const selected = new Set(valid.assessmentProposal.assessmentBasis.assessmentRequest.selectedOptionItemIds);
    const represented = new Set(valid.assessmentProposal.assessments.map((item) => item.optionItemId));
    expect(valid.recommendations.every((item) => selected.has(item.optionItemId))).toBe(true);
    expect(valid.recommendations.every((item) => represented.has(item.optionItemId))).toBe(true);
    const reversed = structuredClone(valid); reversed.recommendations = [...reversed.recommendations].reverse();
    expect(() => assertDecisionRecommendationProposal(reversed)).toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID");
  });

  it("collapses hostile nested stored assessment proposal state without executing getters", async () => {
    const proposal = await assessment(); const stored = await proposerFor([recommendation(proposal)]).propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef: "hostile" }); let getterCalls = 0;
    Object.defineProperty(stored.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "human"; } });
    expect(() => assertDecisionRecommendationProposal(stored)).toThrow("ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports only the narrow generic 6D runtime surface", () => {
    expect(Object.keys(recommendationProposal).sort()).toEqual(["DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION", "assertDecisionRecommendationProposal", "createBoundDecisionRecommendationProposer"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(recommendationProposal).includes(name)).sort()).toEqual(Object.keys(recommendationProposal).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/recommendation-proposal")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/from\s+["'][^"']*(career|recruit|capability-core|matching|legacy|frontend|postgres|drizzle|decision-adapters|revision-persistence|revision-lineage|assessment-basis|assessment-request)/i);
    expect(Object.keys(recommendationProposal).filter((name) => /score|weight|confidence|probability|priority|rank|winner|best|optimal|preference|decisionneed|humandecision|action|outcome|feedback|persist|lineage/i.test(name))).toEqual([]);
  });
});
