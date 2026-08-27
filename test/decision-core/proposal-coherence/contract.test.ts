import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as proposalCoherence from "../../../lib/decision-core/proposal-coherence";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionProposalCoherenceValidation,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createBoundDecisionRecommendationProposer,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  validateDecisionProposalCoherence,
  type DecisionAssessmentEvaluation,
  type DecisionAssessmentProposal,
  type DecisionContextRevision,
  type DecisionRecommendation,
  type DecisionRecommendationProposal,
  type DecisionProposalCoherenceValidation,
  type DecisionRecommendationCoherenceTrace
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option A", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option B", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective One", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective Two", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Constraint One", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

const ids = (value: DecisionContextRevision, role: string): string[] => value.context.items.filter((item) => item.role === role).map((item) => item.itemId);
const first = (value: DecisionContextRevision, role: string): string => {
  const id = ids(value, role)[0];
  if (id === undefined) throw new Error(`missing ${role}`);
  return id;
};

async function assessment(build?: (value: DecisionContextRevision) => readonly DecisionAssessmentEvaluation[], actorId = "human"): Promise<DecisionAssessmentProposal> {
  const value = revision();
  const request = createDecisionAssessmentRequest({
    revisionId: value.revisionId,
    requestedBy: { origin: "HUMAN_INPUT", actorId },
    decisionQuestionItemId: first(value, "DECISION_QUESTION"),
    selectedOptionItemIds: ids(value, "OPTION"),
    selectedObjectiveItemIds: ids(value, "OBJECTIVE"),
    selectedConstraintItemIds: ids(value, "CONSTRAINT")
  });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
  const output = build?.(value) ?? [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "assessment" }];
  return createBoundDecisionAssessmentProposer({ evaluate: async () => output }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "assessment" });
}

const recommendation = (proposal: DecisionAssessmentProposal, optionItemId: string, rationale = "recommendation"): DecisionRecommendation => ({ optionItemId, rationale });
async function recommendationProposal(build?: (value: DecisionContextRevision) => readonly DecisionAssessmentEvaluation[], selected: "A" | "B" | "BOTH" = "A", proposalRef = "recommendation", actorId = "human"): Promise<DecisionRecommendationProposal> {
  const proposal = await assessment(build, actorId);
  const options = proposal.assessmentBasis.assessmentRequest.selectedOptionItemIds;
  const output = selected === "A" ? [recommendation(proposal, options[0])] : selected === "B" ? [recommendation(proposal, options[1])] : [recommendation(proposal, options[1], "second"), recommendation(proposal, options[0], "first")];
  return createBoundDecisionRecommendationProposer({ recommend: async () => output }).propose(proposal, { origin: "MODEL_PROPOSAL", proposalRef });
}

const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

describe("Decision Proposal Coherence Validation", () => {
  it("reconstructs zero, one, and multiple recommendation traces without completeness claims", async () => {
    const zeroAssessment = await assessment(() => []);
    const zeroProposal = await createBoundDecisionRecommendationProposer({ recommend: async () => [] }).propose(zeroAssessment, { origin: "MODEL_PROPOSAL", proposalRef: "zero" });
    const zeroValidation = validateDecisionProposalCoherence(zeroProposal);
    expect(zeroValidation.traces).toEqual([]);

    const multiple = await recommendationProposal((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[1], disposition: "MISALIGNED", rationale: "a objective two" },
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "a constraint" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "b objective" }
    ], "BOTH");
    const result: DecisionProposalCoherenceValidation = validateDecisionProposalCoherence(multiple);
    const options = multiple.recommendations.map((item) => item.optionItemId).sort();
    expect(result).toMatchObject({ artifactKind: "DECISION_PROPOSAL_COHERENCE_VALIDATION", schemaVersion: "DECISION_PROPOSAL_COHERENCE_VALIDATION_V1", recommendationProposal: multiple });
    expect(result.traces.map((trace) => trace.optionItemId)).toEqual(options);
    expect(Object.keys(result).sort()).toEqual(["artifactKind", "proposalCoherenceValidationId", "recommendationProposal", "schemaVersion", "traces"]);
    expect(result.traces.every((trace: DecisionRecommendationCoherenceTrace) => Object.keys(trace).sort().join(",") === "optionItemId,representedCriterionItemIds")).toBe(true);
    for (const trace of result.traces) expect(trace.representedCriterionItemIds).toEqual([...trace.representedCriterionItemIds].sort());
  });

  it("traces every disposition for recommended options and excludes assessed but unrecommended options", async () => {
    for (const disposition of ["ALIGNED", "PARTIALLY_ALIGNED", "MISALIGNED", "UNDETERMINED"] as const) {
      const proposal = await recommendationProposal((value) => [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[0], disposition, rationale: disposition }], "A");
      const trace = validateDecisionProposalCoherence(proposal).traces;
      expect(trace).toEqual([{ optionItemId: proposal.recommendations[0].optionItemId, representedCriterionItemIds: [proposal.assessmentProposal.assessments[0].criterionItemId] }]);
    }

    const exclusion = await recommendationProposal((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[0], disposition: "ALIGNED", rationale: "recommended" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: ids(value, "OBJECTIVE")[1], disposition: "MISALIGNED", rationale: "unrecommended" }
    ], "A");
    const traces = validateDecisionProposalCoherence(exclusion).traces;
    const recommendedAssessment = exclusion.assessmentProposal.assessments.find((item) => item.optionItemId === exclusion.recommendations[0].optionItemId);
    if (recommendedAssessment === undefined) throw new Error("missing recommended assessment");
    expect(traces).toEqual([{ optionItemId: exclusion.recommendations[0].optionItemId, representedCriterionItemIds: [recommendedAssessment.criterionItemId] }]);
    expect(traces.some((item) => item.optionItemId === exclusion.assessmentProposal.assessmentBasis.assessmentRequest.selectedOptionItemIds[1])).toBe(false);
  });

  it("captures valid predecessors defensively and returns detached validation state", async () => {
    const proposal = await recommendationProposal();
    const original = structuredClone(proposal);
    const result = validateDecisionProposalCoherence(proposal);
    proposal.recommendations[0].rationale = "changed";
    proposal.assessmentProposal.assessments[0].rationale = "changed";
    expect(result.recommendationProposal).toEqual(original);
    const id = result.proposalCoherenceValidationId;
    expect(result.proposalCoherenceValidationId).toBe(id);

    const hostile = structuredClone(original); let getterCalls = 0;
    Object.defineProperty(hostile.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "human"; } });
    expect(() => validateDecisionProposalCoherence(hostile)).toThrow("ERR_DECISION_PROPOSAL_COHERENCE_RECOMMENDATION_PROPOSAL_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("canonicalizes traces and commits complete predecessor state rather than only the trace summary", async () => {
    const build = (value: DecisionContextRevision): readonly DecisionAssessmentEvaluation[] => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[0], disposition: "ALIGNED", rationale: "assessment rationale" },
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "constraint rationale" }
    ];
    const base = await recommendationProposal(build, "A", "ref");
    const reordered = reorder(base) as DecisionRecommendationProposal;
    const left = validateDecisionProposalCoherence(base);
    const right = validateDecisionProposalCoherence(reordered);
    expect(right.proposalCoherenceValidationId).toBe(left.proposalCoherenceValidationId);

    const dispositionChanged = await recommendationProposal((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[0], disposition: "MISALIGNED", rationale: "assessment rationale" },
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "constraint rationale" }
    ], "A", "ref");
    const assessmentRationaleChanged = await recommendationProposal((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[0], disposition: "ALIGNED", rationale: "different assessment rationale" },
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "constraint rationale" }
    ], "A", "ref");
    const recommendationRationaleChanged = await createBoundDecisionRecommendationProposer({ recommend: async () => [recommendation(base.assessmentProposal, base.recommendations[0].optionItemId, "different recommendation rationale")] }).propose(base.assessmentProposal, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    const proposalRefChanged = await recommendationProposal(build, "A", "other");
    const humanFrameChanged = await recommendationProposal(build, "A", "ref", "other-human");
    const inventoryChanged = await recommendationProposal((value) => [
      ...build(value),
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: ids(value, "OBJECTIVE")[0], disposition: "ALIGNED", rationale: "other option" }
    ], "BOTH", "ref");
    for (const variant of [dispositionChanged, assessmentRationaleChanged, recommendationRationaleChanged, proposalRefChanged, humanFrameChanged, inventoryChanged]) expect(validateDecisionProposalCoherence(variant).proposalCoherenceValidationId).not.toBe(left.proposalCoherenceValidationId);
    expect(validateDecisionProposalCoherence(dispositionChanged).traces).toEqual(left.traces);
    expect(validateDecisionProposalCoherence(assessmentRationaleChanged).traces).toEqual(left.traces);
  });

  it("asserts exact stored traces without repairing them and distinguishes stale identity", async () => {
    const proposal = await recommendationProposal((value) => [
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: ids(value, "OBJECTIVE")[0], disposition: "ALIGNED", rationale: "one" },
      { optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "CONSTRAINT"), disposition: "UNDETERMINED", rationale: "two" },
      { optionItemId: ids(value, "OPTION")[1], criterionItemId: ids(value, "OBJECTIVE")[1], disposition: "PARTIALLY_ALIGNED", rationale: "three" }
    ], "BOTH");
    const result = validateDecisionProposalCoherence(proposal);
    assertDecisionProposalCoherenceValidation(result);
    const stale = structuredClone(result); stale.proposalCoherenceValidationId = "DPCV_000000000000000000000000";
    expect(() => assertDecisionProposalCoherenceValidation(stale)).toThrow("ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH");
    const missing = structuredClone(result); missing.traces = missing.traces.slice(1); const extra = structuredClone(result); (extra.traces as unknown[]).push(structuredClone(extra.traces[0])); const wrongCriteria = structuredClone(result); wrongCriteria.traces[0].representedCriterionItemIds = []; const reorderedTraces = structuredClone(result); reorderedTraces.traces = [...reorderedTraces.traces].reverse(); const reorderedCriteria = structuredClone(result); reorderedCriteria.traces[0].representedCriterionItemIds = [...reorderedCriteria.traces[0].representedCriterionItemIds].reverse();
    const hidden = structuredClone(result); Object.defineProperty(hidden.traces[0], "hidden", { enumerable: false, value: true }); const symbol = structuredClone(result); Object.defineProperty(symbol.traces[0], Symbol("x"), { enumerable: true, value: true }); const traceExtra = structuredClone(result); Object.assign(traceExtra.traces[0] as object, { extra: true }); const accessor = structuredClone(result); let getterCalls = 0; Object.defineProperty(accessor.traces[0], "optionItemId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return result.traces[0].optionItemId; } }); const hostilePredecessor = structuredClone(result); Object.defineProperty(hostilePredecessor.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "human"; } });
    for (const value of [{ ...result, extra: true }, missing, extra, wrongCriteria, reorderedTraces, reorderedCriteria, hidden, symbol, traceExtra, accessor, hostilePredecessor]) expect(() => assertDecisionProposalCoherenceValidation(value)).toThrow("ERR_DECISION_PROPOSAL_COHERENCE_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports only the narrow generic 6E runtime and type contract", () => {
    expect(Object.keys(proposalCoherence).sort()).toEqual(["DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION", "assertDecisionProposalCoherenceValidation", "validateDecisionProposalCoherence"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(proposalCoherence).includes(name)).sort()).toEqual(Object.keys(proposalCoherence).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/proposal-coherence")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/from\s+["'][^"']*(assessment-proposal|assessment-basis|assessment-request|revision-lineage|revision-persistence|validation-assembly|validation|career|recruit|capability-core|matching|legacy|frontend|postgres|drizzle|decision-adapters)/i);
    expect(source).not.toMatch(/\b(score|weight|confidence|probability|priority|rank|winner|best|optimal|preference|support-for-recommendation|human decision|decision need|action|outcome|feedback|lineage|model|provider|evaluator|generator)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_PROPOSAL_COHERENCE_[A-Z_]+/g) ?? [])].sort()).toEqual([
      "ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH",
      "ERR_DECISION_PROPOSAL_COHERENCE_INVALID",
      "ERR_DECISION_PROPOSAL_COHERENCE_RECOMMENDATION_PROPOSAL_INVALID"
    ]);
  });
});
