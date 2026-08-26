import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as assessmentProposal from "../../../lib/decision-core/assessment-proposal";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionAssessmentProposal,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  type DecisionAssessmentBasis,
  type DecisionAssessmentEvaluation,
  type DecisionContextRevision
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option A", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option B", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective A", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective B", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Constraint A", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Constraint B", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBSERVATION", statement: "Observation", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "ASSUMPTION", statement: "Assumption", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "UNCERTAINTY", statement: "Uncertainty", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

const roleIds = (value: DecisionContextRevision, role: string): string[] => value.context.items.filter((item) => item.role === role).map((item) => item.itemId);
const itemId = (value: DecisionContextRevision, role: string): string => {
  const found = roleIds(value, role)[0]; if (found === undefined) throw new Error(`missing ${role}`); return found;
};
const basisFor = async (value = revision(), actorId = "human"): Promise<DecisionAssessmentBasis> => {
  const request = createDecisionAssessmentRequest({
    revisionId: value.revisionId,
    requestedBy: { origin: "HUMAN_INPUT", actorId },
    decisionQuestionItemId: itemId(value, "DECISION_QUESTION"),
    selectedOptionItemIds: roleIds(value, "OPTION"),
    selectedObjectiveItemIds: roleIds(value, "OBJECTIVE"),
    selectedConstraintItemIds: roleIds(value, "CONSTRAINT")
  });
  return createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
};
const limitedBasisFor = async (value = revision()): Promise<DecisionAssessmentBasis> => createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(createDecisionAssessmentRequest({
  revisionId: value.revisionId,
  requestedBy: { origin: "HUMAN_INPUT", actorId: "human" },
  decisionQuestionItemId: itemId(value, "DECISION_QUESTION"),
  selectedOptionItemIds: [itemId(value, "OPTION")],
  selectedObjectiveItemIds: [itemId(value, "OBJECTIVE")],
  selectedConstraintItemIds: [itemId(value, "CONSTRAINT")]
}));
const evaluation = (value: DecisionAssessmentBasis, overrides: Partial<DecisionAssessmentEvaluation> = {}): DecisionAssessmentEvaluation => ({
  optionItemId: value.assessmentRequest.selectedOptionItemIds[0],
  criterionItemId: value.assessmentRequest.selectedObjectiveItemIds[0],
  disposition: "ALIGNED",
  rationale: " rationale ",
  ...overrides
});
const proposerFor = (output: readonly DecisionAssessmentEvaluation[]) => createBoundDecisionAssessmentProposer({ evaluate: async () => output });
const reorder = (value: unknown): unknown => Array.isArray(value)
  ? value.map(reorder)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])]))
    : value;

describe("Decision Assessment Proposal", () => {
  it("creates selected option x objective/constraint semantic proposals for every closed disposition", async () => {
    const basis = await basisFor();
    const output = [
      evaluation(basis, { disposition: "ALIGNED" }),
      evaluation(basis, { optionItemId: basis.assessmentRequest.selectedOptionItemIds[1], criterionItemId: basis.assessmentRequest.selectedObjectiveItemIds[1], disposition: "PARTIALLY_ALIGNED" }),
      evaluation(basis, { criterionItemId: basis.assessmentRequest.selectedConstraintItemIds[0], disposition: "MISALIGNED" }),
      evaluation(basis, { optionItemId: basis.assessmentRequest.selectedOptionItemIds[1], criterionItemId: basis.assessmentRequest.selectedConstraintItemIds[0], disposition: "UNDETERMINED" })
    ];
    const result = await proposerFor(output).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: " model-run " });
    expect(result).toMatchObject({ artifactKind: "DECISION_ASSESSMENT_PROPOSAL", schemaVersion: "DECISION_ASSESSMENT_PROPOSAL_V1", proposedBy: { origin: "MODEL_PROPOSAL", proposalRef: "model-run" } });
    expect(result.assessments.map((item) => item.disposition).sort()).toEqual(["ALIGNED", "MISALIGNED", "PARTIALLY_ALIGNED", "UNDETERMINED"]);
    expect(result.assessments.every((item) => item.rationale === "rationale")).toBe(true);
    assertDecisionAssessmentProposal(result);
  });

  it("permits zero and partial output without synthesizing UNDETERMINED or readiness", async () => {
    const basis = await basisFor();
    const empty = await proposerFor([]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "empty" });
    expect(empty.assessments).toEqual([]);
    const partial = await proposerFor([evaluation(basis)]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "partial" });
    expect(partial.assessments).toHaveLength(1);
  });

  it("hardens evaluator composition and captures the evaluator method at construction", async () => {
    const basis = await basisFor();
    const valid = { evaluate: async () => [] as DecisionAssessmentEvaluation[] };
    const invalid = [
      { ...valid, extra: true }, {}, null, [], 1, "evaluator",
      (() => { const value = { ...valid }; Object.defineProperty(value, Symbol("hostile"), { enumerable: true, value: true }); return value; })(),
      (() => { const value = { ...valid }; Object.defineProperty(value, "evaluate", { enumerable: false, value: valid.evaluate }); return value; })()
    ];
    for (const value of invalid) expect(() => createBoundDecisionAssessmentProposer(value as never)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID");
    let getterCalls = 0; const accessor = {};
    Object.defineProperty(accessor, "evaluate", { enumerable: true, get: () => { getterCalls += 1; return valid.evaluate; } });
    expect(() => createBoundDecisionAssessmentProposer(accessor as never)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID"); expect(getterCalls).toBe(0);
    let receiver: unknown; const evaluator = { evaluate: async function () { receiver = this; return []; } };
    const bound = createBoundDecisionAssessmentProposer(evaluator); evaluator.evaluate = async () => { throw new Error("redirected"); };
    await expect(bound.propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "bound" })).resolves.toBeDefined(); expect(receiver).toBe(evaluator);
  });

  it("captures basis and provenance before evaluator await and returns detached state", async () => {
    const basis = await basisFor(); const original = structuredClone(basis); const provenance = { origin: "MODEL_PROPOSAL" as const, proposalRef: "original" };
    let input: { assessmentBasis: DecisionAssessmentBasis } | undefined; let release: (() => void) | undefined;
    const bound = createBoundDecisionAssessmentProposer({ evaluate: async (received) => { input = received; return new Promise<DecisionAssessmentEvaluation[]>((resolve) => { release = () => resolve([evaluation(received.assessmentBasis)]); }); } });
    const pending = bound.propose(basis, provenance);
    (basis.assessmentRequest.selectedOptionItemIds as string[])[0] = itemId(basis.revision, "OBSERVATION"); provenance.proposalRef = "redirected";
    release?.(); const result = await pending;
    expect(input?.assessmentBasis).toEqual(original); expect(result.assessmentBasis).toEqual(original); expect(result.proposedBy.proposalRef).toBe("original");
    (input?.assessmentBasis.assessmentRequest.selectedOptionItemIds as string[] | undefined)?.splice(0, 1); basis.revision.context.items[0].statement = "changed";
    expect(result.assessmentBasis).toEqual(original);
  });

  it("rejects hostile provenance before evaluator invocation without executing accessors", async () => {
    const basis = await basisFor(); let calls = 0; let getterCalls = 0;
    const accessor = { origin: "MODEL_PROPOSAL" } as Record<string, unknown>;
    Object.defineProperty(accessor, "proposalRef", { enumerable: true, get: () => { getterCalls += 1; return "ref"; } });
    const cases: unknown[] = [
      accessor,
      (() => { const value = { origin: "MODEL_PROPOSAL", proposalRef: "ref" }; Object.defineProperty(value, Symbol("hostile"), { enumerable: true, value: true }); return value; })(),
      (() => { const value = { origin: "MODEL_PROPOSAL", proposalRef: "ref" }; Object.defineProperty(value, "hidden", { enumerable: false, value: true }); return value; })(),
      { origin: "MODEL_PROPOSAL", proposalRef: "ref", extra: true },
      { origin: "MODEL_PROPOSAL" }, { origin: "HUMAN_INPUT", proposalRef: "ref" },
      { origin: "MODEL_PROPOSAL", proposalRef: "" }, { origin: "MODEL_PROPOSAL", proposalRef: "   " }
    ];
    for (const provenance of cases) await expect(createBoundDecisionAssessmentProposer({ evaluate: async () => { calls += 1; return []; } }).propose(basis, provenance as never)).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_PROVENANCE_INVALID");
    expect(getterCalls).toBe(0); expect(calls).toBe(0);
  });

  it("rejects hostile basis state before evaluator invocation without executing nested accessors", async () => {
    const basis = await basisFor(); let calls = 0; let getterCalls = 0;
    const hostile = structuredClone(basis); Object.defineProperty(hostile.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "human"; } });
    const symbol = structuredClone(basis); Object.defineProperty(symbol.revision.context, Symbol("hostile"), { enumerable: true, value: true });
    const hidden = structuredClone(basis); Object.defineProperty(hidden.assessmentRequest.requestedBy, "hidden", { enumerable: false, value: true });
    const malformedArray = structuredClone(basis); delete (malformedArray.assessmentRequest.selectedOptionItemIds as string[])[0];
    for (const value of [hostile, symbol, hidden, malformedArray]) await expect(createBoundDecisionAssessmentProposer({ evaluate: async () => { calls += 1; return []; } }).propose(value, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_BASIS_INVALID");
    expect(getterCalls).toBe(0); expect(calls).toBe(0);
  });

  it("rejects hostile or malformed evaluator output without executing accessors", async () => {
    const basis = await basisFor(); let getterCalls = 0;
    const accessorArray: unknown[] = [evaluation(basis)]; Object.defineProperty(accessorArray, "0", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return evaluation(basis); } });
    const accessorField = evaluation(basis) as unknown as Record<string, unknown>; Object.defineProperty(accessorField, "rationale", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "x"; } });
    const symbol = evaluation(basis); Object.defineProperty(symbol, Symbol("hostile"), { enumerable: true, value: true });
    const hidden = evaluation(basis); Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    const extra = { ...evaluation(basis), extra: true }; const missing = { ...evaluation(basis) }; delete (missing as Partial<DecisionAssessmentEvaluation>).rationale;
    for (const output of [accessorArray, [accessorField], [symbol], [hidden], [extra], [missing]]) await expect(proposerFor(output as never).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("admits only human-selected targets and rejects duplicates or invalid evaluation content", async () => {
    const basis = await limitedBasisFor(); const unknown = "DCI_999999999999999999999999";
    const invalid = [
      [evaluation(basis, { optionItemId: unknown })],
      [evaluation(basis, { criterionItemId: unknown })],
      [evaluation(basis, { criterionItemId: itemId(basis.revision, "DECISION_QUESTION") })],
      [evaluation(basis, { criterionItemId: itemId(basis.revision, "OBSERVATION") })],
      [evaluation(basis, { criterionItemId: itemId(basis.revision, "ASSUMPTION") })],
      [evaluation(basis, { criterionItemId: itemId(basis.revision, "UNCERTAINTY") })]
    ];
    await expect(proposerFor(invalid[0]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_OPTION_NOT_SELECTED");
    for (const output of invalid.slice(1)) await expect(proposerFor(output).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED");
    await expect(proposerFor([evaluation(basis, { optionItemId: roleIds(basis.revision, "OPTION")[1] })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_OPTION_NOT_SELECTED");
    await expect(proposerFor([evaluation(basis, { criterionItemId: roleIds(basis.revision, "OBJECTIVE")[1] })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED");
    await expect(proposerFor([evaluation(basis, { criterionItemId: roleIds(basis.revision, "CONSTRAINT")[1] })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED");
    for (const output of [[evaluation(basis), evaluation(basis)], [evaluation(basis), evaluation(basis, { disposition: "MISALIGNED" })]]) await expect(proposerFor(output).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE");
    for (const output of [[evaluation(basis, { disposition: "INVALID" as never })], [evaluation(basis, { rationale: " " })]]) await expect(proposerFor(output).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID");
    await expect(proposerFor([evaluation(basis, { optionItemId: "not-an-id" })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID");
    await expect(proposerFor([evaluation(basis, { criterionItemId: "not-an-id" })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "p" })).rejects.toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID");
  });

  it("canonicalizes valid output order and commits every required identity axis including rationale", async () => {
    const basis = await basisFor(); const first = evaluation(basis); const second = evaluation(basis, { optionItemId: basis.assessmentRequest.selectedOptionItemIds[1], criterionItemId: basis.assessmentRequest.selectedConstraintItemIds[0] });
    const left = await proposerFor([first, second]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    const right = await proposerFor([second, first]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    expect(right.assessments).toEqual(left.assessments); expect(right.assessmentProposalId).toBe(left.assessmentProposalId);
    const changedBasis = await basisFor(revision(), "other");
    const variants = [
      await proposerFor([first]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "other" }),
      await proposerFor([evaluation(basis, { optionItemId: basis.assessmentRequest.selectedOptionItemIds[1] })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }),
      await proposerFor([evaluation(basis, { criterionItemId: basis.assessmentRequest.selectedConstraintItemIds[0] })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }),
      await proposerFor([evaluation(basis, { disposition: "MISALIGNED" })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }),
      await proposerFor([evaluation(basis, { rationale: "different" })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }),
      await proposerFor([evaluation(changedBasis)]).propose(changedBasis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" })
    ];
    for (const variant of variants) expect(variant.assessmentProposalId).not.toBe((await proposerFor([first]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" })).assessmentProposalId);
  });

  it("treats complete-basis object insertion order as non-semantic for DASPR", async () => {
    const basis = await basisFor(); const reordered = reorder(basis) as DecisionAssessmentBasis;
    const output = [evaluation(basis)];
    const left = await proposerFor(output).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    const right = await proposerFor(output).propose(reordered, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    expect(right.assessmentProposalId).toBe(left.assessmentProposalId);
  });

  it("captures evaluator-owned output independently of evaluator input", async () => {
    const basis = await basisFor(); const output = [evaluation(basis)];
    const result = await proposerFor(output).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" }); const originalId = result.assessmentProposalId;
    output.push(evaluation(basis, { optionItemId: basis.assessmentRequest.selectedOptionItemIds[1] })); output[0].rationale = "mutated"; output[0].optionItemId = basis.assessmentRequest.selectedOptionItemIds[1];
    expect(result.assessments).toEqual([evaluation(basis, { rationale: "rationale" })]); expect(result.assessmentProposalId).toBe(originalId);
  });

  it("asserts only exact canonical stored proposals without dependencies or repair", async () => {
    const basis = await basisFor(); const result = await proposerFor([evaluation(basis), evaluation(basis, { optionItemId: basis.assessmentRequest.selectedOptionItemIds[1] })]).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "ref" });
    assertDecisionAssessmentProposal(result);
    const wrong = structuredClone(result); wrong.assessmentProposalId = "DASPR_000000000000000000000000";
    expect(() => assertDecisionAssessmentProposal(wrong)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH");
    const cases: unknown[] = [{ ...result, extra: true }, (() => { const value = structuredClone(result); delete (value as Partial<typeof value>).assessments; return value; })()];
    const reordered = structuredClone(result); reordered.assessments = [...reordered.assessments].reverse(); cases.push(reordered);
    const untrimmed = structuredClone(result); untrimmed.assessments[0].rationale = " rationale "; cases.push(untrimmed);
    const untrimmedRef = structuredClone(result); untrimmedRef.proposedBy.proposalRef = " ref "; cases.push(untrimmedRef);
    const duplicate = structuredClone(result); (duplicate.assessments as DecisionAssessmentEvaluation[]).push(structuredClone(duplicate.assessments[0])); cases.push(duplicate);
    const accessor = structuredClone(result); let getterCalls = 0; Object.defineProperty(accessor.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "human"; } }); cases.push(accessor);
    const symbol = structuredClone(result); Object.defineProperty(symbol.assessments[0], Symbol("hostile"), { enumerable: true, value: true }); cases.push(symbol);
    const hidden = structuredClone(result); Object.defineProperty(hidden.assessments[0], "hidden", { enumerable: false, value: true }); cases.push(hidden);
    const provenanceAccessor = structuredClone(result); Object.defineProperty(provenanceAccessor.proposedBy, "proposalRef", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "ref"; } }); cases.push(provenanceAccessor);
    const provenanceSymbol = structuredClone(result); Object.defineProperty(provenanceSymbol.proposedBy, Symbol("hostile"), { enumerable: true, value: true }); cases.push(provenanceSymbol);
    const provenanceHidden = structuredClone(result); Object.defineProperty(provenanceHidden.proposedBy, "hidden", { enumerable: false, value: true }); cases.push(provenanceHidden);
    cases.push({ ...structuredClone(result), proposedBy: { ...result.proposedBy, extra: true } });
    for (const value of cases) expect(() => assertDecisionAssessmentProposal(value)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID");
    expect(getterCalls).toBe(0);
    const staleRationale = structuredClone(result); staleRationale.assessments[0].rationale = "different but valid";
    expect(() => assertDecisionAssessmentProposal(staleRationale)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH");
    const staleProvenance = structuredClone(result); staleProvenance.proposedBy.proposalRef = "other-valid-ref";
    expect(() => assertDecisionAssessmentProposal(staleProvenance)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH");
    const limited = await limitedBasisFor(); const stored = await proposerFor([evaluation(limited)]).propose(limited, { origin: "MODEL_PROPOSAL", proposalRef: "limited" });
    const unselectedOption = structuredClone(stored); unselectedOption.assessments[0].optionItemId = roleIds(limited.revision, "OPTION")[1];
    const unselectedCriterion = structuredClone(stored); unselectedCriterion.assessments[0].criterionItemId = roleIds(limited.revision, "CONSTRAINT")[1];
    expect(() => assertDecisionAssessmentProposal(unselectedOption)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID");
    expect(() => assertDecisionAssessmentProposal(unselectedCriterion)).toThrow("ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID");
  });

  it("exports only the narrow generic 6C runtime surface", () => {
    expect(Object.keys(assessmentProposal).sort()).toEqual(["DECISION_ASSESSMENT_DISPOSITIONS", "DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION", "assertDecisionAssessmentProposal", "createBoundDecisionAssessmentProposer"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(assessmentProposal).includes(name)).sort()).toEqual(Object.keys(assessmentProposal).sort());
    const directory = resolve(process.cwd(), "lib/decision-core/assessment-proposal"); const source = sourceFiles(directory).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/from\s+["'][^"']*(career|recruit|capability-core|matching|recommend|legacy|frontend|postgres|drizzle|decision-adapters|revision-persistence|revision-lineage)/i);
    expect(Object.keys(assessmentProposal).filter((name) => /score|weight|priority|rank|winner|preference|recommend|decisionneed|human.*decision|persist|lineage/i.test(name))).toEqual([]);
  });
});
