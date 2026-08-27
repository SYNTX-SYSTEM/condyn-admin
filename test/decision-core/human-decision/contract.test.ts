import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as humanDecision from "../../../lib/decision-core/human-decision";
import type {
  HumanDecisionActor,
  HumanDecisionDeclaration,
  HumanDecisionDeclarationInput
} from "../../../lib/decision-core/human-decision";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertHumanDecisionDeclaration,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createBoundDecisionRecommendationProposer,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createHumanDecisionDeclaration,
  validateDecisionProposalCoherence,
  type DecisionAssessmentEvaluation,
  type DecisionContextRevision,
  type DecisionProposalCoherenceValidation
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "Option A", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "Option B", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "Option C", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "CONSTRAINT", statement: "Constraint", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OBSERVATION", statement: "Observation", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } }
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

async function coherence(build?: (value: DecisionContextRevision) => readonly DecisionAssessmentEvaluation[], recommendationRationale = "recommendation", proposalRef = "proposal"): Promise<DecisionProposalCoherenceValidation> {
  const value = revision();
  const request = createDecisionAssessmentRequest({
    revisionId: value.revisionId,
    requestedBy: { origin: "HUMAN_INPUT", actorId: "requester" },
    decisionQuestionItemId: first(value, "DECISION_QUESTION"),
    selectedOptionItemIds: ids(value, "OPTION").slice(0, 2),
    selectedObjectiveItemIds: ids(value, "OBJECTIVE"),
    selectedConstraintItemIds: ids(value, "CONSTRAINT")
  });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
  const assessments = build?.(value) ?? [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "ALIGNED", rationale: "assessment" }];
  const assessment = await createBoundDecisionAssessmentProposer({ evaluate: async () => assessments }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef });
  const recommendation = await createBoundDecisionRecommendationProposer({ recommend: async () => [{ optionItemId: ids(value, "OPTION")[0], rationale: recommendationRationale }] }).propose(assessment, { origin: "MODEL_PROPOSAL", proposalRef });
  return validateDecisionProposalCoherence(recommendation);
}

const input = (chosenOptionItemIds: readonly string[], overrides: Partial<HumanDecisionDeclarationInput> = {}): HumanDecisionDeclarationInput => ({ decidedBy: { origin: "HUMAN_INPUT", actorId: " decider " }, chosenOptionItemIds, rationale: " rationale ", ...overrides });
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

describe("Human Decision Declaration", () => {
  it("admits actual revision options independently of the Phase 6 assessment, recommendation, and trace inventories", async () => {
    const predecessor = await coherence();
    const options = ids(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION");
    const chosenC: HumanDecisionDeclaration = createHumanDecisionDeclaration(predecessor, input([options[2]]));
    expect(chosenC).toMatchObject({ artifactKind: "HUMAN_DECISION_DECLARATION", schemaVersion: "HUMAN_DECISION_DECLARATION_V1", decidedBy: { origin: "HUMAN_INPUT", actorId: "decider" }, chosenOptionItemIds: [options[2]], rationale: "rationale" });
    expect(Object.keys(chosenC).sort()).toEqual(["artifactKind", "chosenOptionItemIds", "decidedBy", "humanDecisionId", "proposalCoherenceValidation", "rationale", "schemaVersion"]);
    expect(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.selectedOptionItemIds).not.toContain(options[2]);
    expect(predecessor.recommendationProposal.assessmentProposal.assessments.map((item) => item.optionItemId)).not.toContain(options[2]);
    expect(predecessor.recommendationProposal.recommendations.map((item) => item.optionItemId)).not.toContain(options[2]);
    expect(predecessor.traces.map((item) => item.optionItemId)).not.toContain(options[2]);
  });

  it("canonicalizes multiple positive choices without ranking and rejects duplicate or zero choice", async () => {
    const predecessor = await coherence();
    const options = ids(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION");
    const left = createHumanDecisionDeclaration(predecessor, input([options[2], options[0]]));
    const right = createHumanDecisionDeclaration(predecessor, input([options[0], options[2]]));
    expect(left.chosenOptionItemIds).toEqual([options[0], options[2]].sort());
    expect(right.chosenOptionItemIds).toEqual(left.chosenOptionItemIds);
    expect(right.humanDecisionId).toBe(left.humanDecisionId);
    expect(() => createHumanDecisionDeclaration(predecessor, input([]))).toThrow("ERR_DECISION_HUMAN_DECISION_INPUT_INVALID");
    expect(() => createHumanDecisionDeclaration(predecessor, input([options[0], options[0]]))).toThrow("ERR_DECISION_HUMAN_DECISION_DUPLICATE_OPTION");
  });

  it("admits only actual revision OPTION items and validates actor and rationale input", async () => {
    const predecessor = await coherence();
    const revisionValue = predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision;
    const option = first(revisionValue, "OPTION");
    expect(() => createHumanDecisionDeclaration(predecessor, input(["not-an-id"]))).toThrow("ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID");
    expect(() => createHumanDecisionDeclaration(predecessor, input(["DCI_FFFFFFFFFFFFFFFFFFFFFFFF"]))).toThrow("ERR_DECISION_HUMAN_DECISION_OPTION_NOT_FOUND");
    for (const role of ["OBJECTIVE", "CONSTRAINT", "OBSERVATION"]) expect(() => createHumanDecisionDeclaration(predecessor, input([first(revisionValue, role)]))).toThrow("ERR_DECISION_HUMAN_DECISION_OPTION_ROLE_MISMATCH");
    expect(() => createHumanDecisionDeclaration(predecessor, input([option], { decidedBy: { origin: "HUMAN_INPUT", actorId: " " } }))).toThrow("ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID");
    expect(() => createHumanDecisionDeclaration(predecessor, input([option], { decidedBy: { origin: "MODEL_PROPOSAL", actorId: "actor" } as never }))).toThrow("ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID");
    expect(() => createHumanDecisionDeclaration(predecessor, input([option], { rationale: " " }))).toThrow("ERR_DECISION_HUMAN_DECISION_RATIONALE_INVALID");
    expect(createHumanDecisionDeclaration(predecessor, input([option], { rationale: null })).rationale).toBeNull();
  });

  it("captures predecessor and input state defensively and commits complete human and predecessor identity axes", async () => {
    const predecessor = await coherence();
    const options = ids(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION");
    const supplied = input([options[2]]); const result = createHumanDecisionDeclaration(predecessor, supplied); const original = structuredClone(result);
    predecessor.recommendationProposal.recommendations[0].rationale = "changed"; supplied.decidedBy.actorId = "changed"; (supplied.chosenOptionItemIds as string[])[0] = options[0]; supplied.rationale = "changed";
    expect(result).toEqual(original);
    const reordered = reorder(original.proposalCoherenceValidation) as DecisionProposalCoherenceValidation;
    expect(createHumanDecisionDeclaration(reordered, input([options[2]])).humanDecisionId).toBe(original.humanDecisionId);
    const actorChanged = createHumanDecisionDeclaration(original.proposalCoherenceValidation, input([options[2]], { decidedBy: { origin: "HUMAN_INPUT", actorId: "other" } }));
    const choiceChanged = createHumanDecisionDeclaration(original.proposalCoherenceValidation, input([options[0]]));
    const rationaleChanged = createHumanDecisionDeclaration(original.proposalCoherenceValidation, input([options[2]], { rationale: "other" }));
    const assessmentChanged = await coherence((value) => [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "OBJECTIVE"), disposition: "MISALIGNED", rationale: "assessment" }]);
    const recommendationChanged = await coherence(undefined, "other recommendation");
    const traceChanged = await coherence((value) => [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: first(value, "CONSTRAINT"), disposition: "ALIGNED", rationale: "assessment" }]);
    for (const variant of [actorChanged, choiceChanged, rationaleChanged, createHumanDecisionDeclaration(assessmentChanged, input([options[2]])), createHumanDecisionDeclaration(recommendationChanged, input([options[2]])), createHumanDecisionDeclaration(traceChanged, input([options[2]]))]) expect(variant.humanDecisionId).not.toBe(original.humanDecisionId);
  });

  it("asserts exact stored declarations without repairing canonical body state", async () => {
    const predecessor = await coherence(); const options = ids(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION");
    const result = createHumanDecisionDeclaration(predecessor, input([options[0], options[2]])); assertHumanDecisionDeclaration(result);
    const stale = structuredClone(result); stale.humanDecisionId = "DHDEC_000000000000000000000000";
    expect(() => assertHumanDecisionDeclaration(stale)).toThrow("ERR_DECISION_HUMAN_DECISION_ID_MISMATCH");
    const unsorted = structuredClone(result); unsorted.chosenOptionItemIds = [...unsorted.chosenOptionItemIds].reverse(); const duplicate = structuredClone(result); (duplicate.chosenOptionItemIds as string[]).push(duplicate.chosenOptionItemIds[0]); const missing = structuredClone(result); missing.chosenOptionItemIds = ["DCI_FFFFFFFFFFFFFFFFFFFFFFFF"]; const wrongRole = structuredClone(result); wrongRole.chosenOptionItemIds = [first(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OBJECTIVE")]; const untrimmedActor = structuredClone(result); untrimmedActor.decidedBy.actorId = " decider "; const untrimmedRationale = structuredClone(result); untrimmedRationale.rationale = " rationale ";
    const hostileActor = structuredClone(result); const hostileOption = structuredClone(result); const hostilePredecessor = structuredClone(result); let getterCalls = 0;
    Object.defineProperty(hostileActor.decidedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "decider"; } }); Object.defineProperty(hostileOption.chosenOptionItemIds, "0", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return options[0]; } }); Object.defineProperty(hostilePredecessor.proposalCoherenceValidation.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "requester"; } });
    for (const value of [{ ...result, extra: true }, unsorted, duplicate, missing, wrongRole, untrimmedActor, untrimmedRationale, hostileActor, hostileOption, hostilePredecessor]) expect(() => assertHumanDecisionDeclaration(value)).toThrow("ERR_DECISION_HUMAN_DECISION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("rejects hostile constructor input without executing getters", async () => {
    const predecessor = await coherence(); const option = first(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION"); let getterCalls = 0;
    const hostileActor = input([option]) as unknown as Record<string, unknown>; Object.defineProperty(hostileActor.decidedBy as object, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "decider"; } });
    const hostileChoice = input([option]) as unknown as Record<string, unknown>; Object.defineProperty(hostileChoice.chosenOptionItemIds as object, "0", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return option; } });
    const hostileRationale = input([option]) as unknown as Record<string, unknown>; Object.defineProperty(hostileRationale, "rationale", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "rationale"; } });
    for (const value of [hostileActor, hostileChoice, hostileRationale, { ...input([option]), extra: true }]) expect(() => createHumanDecisionDeclaration(predecessor, value as never)).toThrow("ERR_DECISION_HUMAN_DECISION_INPUT_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("rejects descriptor-hostile and cyclic constructor and stored representations", async () => {
    const predecessor = await coherence();
    const option = first(predecessor.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION");
    const symbolInput = input([option]) as unknown as Record<PropertyKey, unknown>;
    Object.defineProperty(symbolInput, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenInput = input([option]) as unknown as Record<string, unknown>;
    Object.defineProperty(hiddenInput, "hidden", { enumerable: false, value: true });
    const sparseInput = input([option]); sparseInput.chosenOptionItemIds = new Array<string>(1);
    const customInput = input([option]); const customChoices = [option]; Object.defineProperty(customChoices, "custom", { enumerable: true, value: true }); customInput.chosenOptionItemIds = customChoices;
    const cyclicInput = input([option]) as unknown as Record<string, unknown>; cyclicInput.self = cyclicInput;
    for (const value of [symbolInput, hiddenInput, sparseInput, customInput, cyclicInput]) expect(() => createHumanDecisionDeclaration(predecessor, value as never)).toThrow("ERR_DECISION_HUMAN_DECISION_INPUT_INVALID");

    const result = createHumanDecisionDeclaration(predecessor, input([option]));
    const symbolStored = structuredClone(result) as unknown as Record<PropertyKey, unknown>;
    Object.defineProperty(symbolStored, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenStored = structuredClone(result) as unknown as Record<string, unknown>;
    Object.defineProperty(hiddenStored, "hidden", { enumerable: false, value: true });
    const sparseStored = structuredClone(result); sparseStored.chosenOptionItemIds = new Array<string>(1);
    const customStored = structuredClone(result); const storedChoices = [...customStored.chosenOptionItemIds]; Object.defineProperty(storedChoices, "custom", { enumerable: true, value: true }); customStored.chosenOptionItemIds = storedChoices;
    const cyclicStored = structuredClone(result) as unknown as Record<string, unknown>; cyclicStored.self = cyclicStored;
    for (const value of [symbolStored, hiddenStored, sparseStored, customStored, cyclicStored]) expect(() => assertHumanDecisionDeclaration(value)).toThrow("ERR_DECISION_HUMAN_DECISION_INVALID");
  });

  it("exports only the narrow generic 7A contract", () => {
    expect(Object.keys(humanDecision).sort()).toEqual(["HUMAN_DECISION_DECLARATION_SCHEMA_VERSION", "assertHumanDecisionDeclaration", "createHumanDecisionDeclaration"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(humanDecision).includes(name)).sort()).toEqual(Object.keys(humanDecision).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/human-decision")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/from\s+["'][^"']*(recommendation-proposal|assessment-proposal|assessment-basis|assessment-request|revisions|context|revision-persistence|revision-lineage|validation-assembly|validation|career|recruit|capability-core|matching|legacy|frontend|postgres|drizzle|provider|model|evaluator|generator)/i);
    expect(source).not.toMatch(/\b(accept|reject|defer|abstain|winner|best|optimal|score|rank|priority|confidence|probability|recommendation correctness|assessment disposition|decision readiness|decision need|action|outcome|feedback|learning|persistence|current|latest|head)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_HUMAN_DECISION_[A-Z_]+/g) ?? [])].sort()).toEqual([
      "ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID", "ERR_DECISION_HUMAN_DECISION_DUPLICATE_OPTION", "ERR_DECISION_HUMAN_DECISION_ID_MISMATCH", "ERR_DECISION_HUMAN_DECISION_INPUT_INVALID", "ERR_DECISION_HUMAN_DECISION_INVALID", "ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID", "ERR_DECISION_HUMAN_DECISION_OPTION_NOT_FOUND", "ERR_DECISION_HUMAN_DECISION_OPTION_ROLE_MISMATCH", "ERR_DECISION_HUMAN_DECISION_PROPOSAL_COHERENCE_INVALID", "ERR_DECISION_HUMAN_DECISION_RATIONALE_INVALID"
    ]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["HumanDecisionActor", "HumanDecisionDeclaration", "HumanDecisionDeclarationInput"]);
    const actor: HumanDecisionActor = { origin: "HUMAN_INPUT", actorId: "actor" };
    const declarationInput: HumanDecisionDeclarationInput = { decidedBy: actor, chosenOptionItemIds: ["DCI_000000000000000000000000"], rationale: null };
    const declaration: HumanDecisionDeclaration | null = null;
    expect([actor.origin, declarationInput.rationale, declaration]).toEqual(["HUMAN_INPUT", null, null]);
  });
});
