import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as actionIntent from "../../../lib/decision-core/action-intent";
import type { ActionIntentActor, DecisionActionIntent, DecisionActionIntentInput } from "../../../lib/decision-core/action-intent";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionActionIntent,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createBoundDecisionRecommendationProposer,
  createDecisionActionIntent,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createHumanDecisionDeclaration,
  validateDecisionProposalCoherence,
  type DecisionContextRevision,
  type DecisionProposalCoherenceValidation,
  type HumanDecisionDeclaration
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "A", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "B", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "C", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "CONSTRAINT", statement: "Constraint", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } }
  ] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

const ids = (value: DecisionContextRevision, role: string): string[] => value.context.items.filter((item) => item.role === role).map((item) => item.itemId);
const one = (value: DecisionContextRevision, role: string): string => {
  const id = ids(value, role)[0];
  if (id === undefined) throw new Error(`missing ${role}`);
  return id;
};

async function decision(chosen?: readonly string[]): Promise<HumanDecisionDeclaration> {
  const value = revision();
  const request = createDecisionAssessmentRequest({ revisionId: value.revisionId, requestedBy: { origin: "HUMAN_INPUT", actorId: "requester" }, decisionQuestionItemId: one(value, "DECISION_QUESTION"), selectedOptionItemIds: ids(value, "OPTION").slice(0, 2), selectedObjectiveItemIds: ids(value, "OBJECTIVE"), selectedConstraintItemIds: ids(value, "CONSTRAINT") });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
  const assessment = await createBoundDecisionAssessmentProposer({ evaluate: async () => [{ optionItemId: ids(value, "OPTION")[0], criterionItemId: one(value, "OBJECTIVE"), disposition: "ALIGNED" as const, rationale: "assessment" }] }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" });
  const recommendation = await createBoundDecisionRecommendationProposer({ recommend: async () => [{ optionItemId: ids(value, "OPTION")[0], rationale: "recommendation" }] }).propose(assessment, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" });
  const validation = validateDecisionProposalCoherence(recommendation);
  return createHumanDecisionDeclaration(validation, { decidedBy: { origin: "HUMAN_INPUT", actorId: "decider" }, chosenOptionItemIds: chosen ?? ids(value, "OPTION"), rationale: null });
}

const input = (operationalizedOptionItemIds: readonly string[], overrides: Partial<DecisionActionIntentInput> = {}): DecisionActionIntentInput => ({ declaredBy: { origin: "HUMAN_INPUT", actorId: " declarer " }, operationalizedOptionItemIds, operationDescription: " operate ", rationale: " rationale ", ...overrides });
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

describe("Decision Action Intent", () => {
  it("creates an intent for one, all, or an explicit subset of human-chosen options", async () => {
    const predecessor = await decision();
    const [a, b, c] = predecessor.chosenOptionItemIds;
    const single = createDecisionActionIntent(predecessor, input([a]));
    const all = createDecisionActionIntent(predecessor, input([a, b, c]));
    const subset: DecisionActionIntent = createDecisionActionIntent(predecessor, input([c, a]));
    expect(single.operationalizedOptionItemIds).toEqual([a]);
    expect(all.operationalizedOptionItemIds).toEqual([a, b, c].sort());
    expect(subset.operationalizedOptionItemIds).toEqual([a, c].sort());
    expect(Object.keys(subset).sort()).toEqual(["actionIntentId", "artifactKind", "declaredBy", "humanDecisionDeclaration", "operationDescription", "operationalizedOptionItemIds", "rationale", "schemaVersion"]);
    expect(subset).toMatchObject({ artifactKind: "DECISION_ACTION_INTENT", schemaVersion: "DECISION_ACTION_INTENT_V1", declaredBy: { origin: "HUMAN_INPUT", actorId: "declarer" }, operationDescription: "operate", rationale: "rationale" });
  });

  it("admits only the decision choice set and canonicalizes its non-semantic input order", async () => {
    const predecessor = await decision(); const [a, b, c] = predecessor.chosenOptionItemIds;
    const left = createDecisionActionIntent(predecessor, input([c, a]));
    const right = createDecisionActionIntent(predecessor, input([a, c]));
    expect(left.operationalizedOptionItemIds).toEqual([a, c].sort());
    expect(left.actionIntentId).toBe(right.actionIntentId);
    expect(() => createDecisionActionIntent(predecessor, input([]))).toThrow("ERR_DECISION_ACTION_INTENT_INPUT_INVALID");
    expect(() => createDecisionActionIntent(predecessor, input(["not-an-id"]))).toThrow("ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID");
    expect(() => createDecisionActionIntent(predecessor, input(["DCI_FFFFFFFFFFFFFFFFFFFFFFFF"]))).toThrow("ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN");
    expect(() => createDecisionActionIntent(predecessor, input([a, a]))).toThrow("ERR_DECISION_ACTION_INTENT_DUPLICATE_OPTION");
    expect(b).toBeDefined();
  });

  it("rejects an actual revision OPTION omitted from the human choice set", async () => {
    const complete = await decision();
    const [a, b, c] = complete.chosenOptionItemIds;
    const narrowed = createHumanDecisionDeclaration(complete.proposalCoherenceValidation, { decidedBy: complete.decidedBy, chosenOptionItemIds: [a, b], rationale: complete.rationale });
    const revisionOptions = ids(narrowed.proposalCoherenceValidation.recommendationProposal.assessmentProposal.assessmentBasis.revision, "OPTION");
    expect(revisionOptions).toContain(c);
    expect(narrowed.chosenOptionItemIds).not.toContain(c);
    expect(() => createDecisionActionIntent(narrowed, input([c]))).toThrow("ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN");
  });

  it("keeps the intent declarer independent of the decision actor and validates actor, operation, and rationale", async () => {
    const predecessor = await decision(); const option = predecessor.chosenOptionItemIds[0];
    const result = createDecisionActionIntent(predecessor, input([option], { declaredBy: { origin: "HUMAN_INPUT", actorId: "other" }, rationale: null }));
    expect(result.declaredBy.actorId).toBe("other");
    expect(result.declaredBy.actorId).not.toBe(predecessor.decidedBy.actorId);
    expect(result.rationale).toBeNull();
    expect(() => createDecisionActionIntent(predecessor, input([option], { declaredBy: { origin: "MODEL_PROPOSAL", actorId: "actor" } as never }))).toThrow("ERR_DECISION_ACTION_INTENT_ACTOR_INVALID");
    expect(() => createDecisionActionIntent(predecessor, input([option], { declaredBy: { origin: "HUMAN_INPUT", actorId: " " } }))).toThrow("ERR_DECISION_ACTION_INTENT_ACTOR_INVALID");
    expect(() => createDecisionActionIntent(predecessor, input([option], { operationDescription: " " }))).toThrow("ERR_DECISION_ACTION_INTENT_OPERATION_INVALID");
    expect(() => createDecisionActionIntent(predecessor, input([option], { rationale: " " }))).toThrow("ERR_DECISION_ACTION_INTENT_RATIONALE_INVALID");
  });

  it("captures predecessor and input defensively and commits all required DAINT identity axes", async () => {
    const predecessor = await decision(); const [a, , c] = predecessor.chosenOptionItemIds;
    const supplied = input([c, a]); const result = createDecisionActionIntent(predecessor, supplied); const original = structuredClone(result);
    predecessor.decidedBy.actorId = "changed"; supplied.declaredBy.actorId = "changed"; (supplied.operationalizedOptionItemIds as string[])[0] = a; supplied.operationDescription = "changed"; supplied.rationale = "changed";
    expect(result).toEqual(original);
    const reordered = reorder(original.humanDecisionDeclaration) as HumanDecisionDeclaration;
    expect(createDecisionActionIntent(reordered, input([a, c])).actionIntentId).toBe(original.actionIntentId);
    for (const variant of [
      createDecisionActionIntent(original.humanDecisionDeclaration, input([a, c], { declaredBy: { origin: "HUMAN_INPUT", actorId: "other" } })),
      createDecisionActionIntent(original.humanDecisionDeclaration, input([a], {})),
      createDecisionActionIntent(original.humanDecisionDeclaration, input([a, c], { operationDescription: "other" })),
      createDecisionActionIntent(original.humanDecisionDeclaration, input([a, c], { rationale: "other" })),
      createDecisionActionIntent(await decision([a, c]), input([a, c]))
    ]) expect(variant.actionIntentId).not.toBe(original.actionIntentId);
  });

  it("asserts exact canonical stored state, distinguishes a stale ID, and performs no repair", async () => {
    const predecessor = await decision(); const [a, , c] = predecessor.chosenOptionItemIds;
    const result = createDecisionActionIntent(predecessor, input([a, c])); assertDecisionActionIntent(result);
    const stale = structuredClone(result); stale.actionIntentId = "DAINT_000000000000000000000000";
    expect(() => assertDecisionActionIntent(stale)).toThrow("ERR_DECISION_ACTION_INTENT_ID_MISMATCH");
    const unsorted = structuredClone(result); unsorted.operationalizedOptionItemIds = [...unsorted.operationalizedOptionItemIds].reverse();
    const duplicate = structuredClone(result); (duplicate.operationalizedOptionItemIds as string[]).push(a);
    const unchosen = structuredClone(result); unchosen.operationalizedOptionItemIds = ["DCI_FFFFFFFFFFFFFFFFFFFFFFFF"];
    const actor = structuredClone(result); actor.declaredBy.actorId = " declarer ";
    const operation = structuredClone(result); operation.operationDescription = " operate ";
    const rationale = structuredClone(result); rationale.rationale = " rationale ";
    for (const value of [unsorted, duplicate, unchosen, actor, operation, rationale]) expect(() => assertDecisionActionIntent(value)).toThrow("ERR_DECISION_ACTION_INTENT_INVALID");
  });

  it("rejects hostile constructor and stored representations without executing getters", async () => {
    const predecessor = await decision(); const option = predecessor.chosenOptionItemIds[0]; let getterCalls = 0;
    const accessorInput = input([option]) as unknown as Record<string, unknown>; Object.defineProperty(accessorInput, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operate"; } });
    const symbolInput = input([option]) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolInput, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenInput = input([option]) as unknown as Record<string, unknown>; Object.defineProperty(hiddenInput, "hidden", { enumerable: false, value: true });
    const extraInput = { ...input([option]), extra: true };
    const sparseInput = input([option]); sparseInput.operationalizedOptionItemIds = new Array<string>(1);
    const customInput = input([option]); const custom = [option]; Object.defineProperty(custom, "custom", { enumerable: true, value: true }); customInput.operationalizedOptionItemIds = custom;
    const cyclicInput = input([option]) as unknown as Record<string, unknown>; cyclicInput.self = cyclicInput;
    for (const value of [accessorInput, symbolInput, hiddenInput, extraInput, sparseInput, customInput, cyclicInput]) expect(() => createDecisionActionIntent(predecessor, value as never)).toThrow("ERR_DECISION_ACTION_INTENT_INPUT_INVALID");
    const result = createDecisionActionIntent(predecessor, input([option]));
    const accessorStored = structuredClone(result); Object.defineProperty(accessorStored.declaredBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "declarer"; } });
    const symbolStored = structuredClone(result) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolStored, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenStored = structuredClone(result) as unknown as Record<string, unknown>; Object.defineProperty(hiddenStored, "hidden", { enumerable: false, value: true });
    const extraStored = { ...structuredClone(result), extra: true };
    const sparseStored = structuredClone(result); sparseStored.operationalizedOptionItemIds = new Array<string>(1);
    const customStored = structuredClone(result); const storedCustom = [option]; Object.defineProperty(storedCustom, "custom", { enumerable: true, value: true }); customStored.operationalizedOptionItemIds = storedCustom;
    const cyclicStored = structuredClone(result) as unknown as Record<string, unknown>; cyclicStored.self = cyclicStored;
    for (const value of [accessorStored, symbolStored, hiddenStored, extraStored, sparseStored, customStored, cyclicStored]) expect(() => assertDecisionActionIntent(value)).toThrow("ERR_DECISION_ACTION_INTENT_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("rejects hostile nested HumanDecisionDeclaration state without executing its getter", async () => {
    const predecessor = await decision(); const option = predecessor.chosenOptionItemIds[0]; let getterCalls = 0;
    const hostileConstructor = structuredClone(predecessor);
    Object.defineProperty(hostileConstructor.proposalCoherenceValidation.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "requester"; } });
    expect(() => createDecisionActionIntent(hostileConstructor, input([option]))).toThrow("ERR_DECISION_ACTION_INTENT_HUMAN_DECISION_INVALID");
    const valid = createDecisionActionIntent(predecessor, input([option]));
    const hostileStored = structuredClone(valid);
    Object.defineProperty(hostileStored.humanDecisionDeclaration.proposalCoherenceValidation.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "requester"; } });
    expect(() => assertDecisionActionIntent(hostileStored)).toThrow("ERR_DECISION_ACTION_INTENT_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the narrow generic 8A1 contract", () => {
    expect(Object.keys(actionIntent).sort()).toEqual(["DECISION_ACTION_INTENT_SCHEMA_VERSION", "assertDecisionActionIntent", "createDecisionActionIntent"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(actionIntent).includes(name)).sort()).toEqual(Object.keys(actionIntent).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/action-intent")).map((file) => readFileSync(file, "utf8")).join("\n");
    const identity = source.match(/function intentId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    expect(identity).toContain("canonical(declaration as unknown as Captured)");
    expect(identity).not.toContain("declaration.humanDecisionId");
    expect(source).not.toMatch(/from\s+["'][^"']*(proposal-coherence|recommendation-proposal|assessment-proposal|assessment-basis|assessment-request|revisions|context|persistence|lineage|career|matching)/i);
    expect(source).not.toMatch(/\b(commitment|committed|executed|execution status|completed|done|success|failure|outcome|feedback|learning|due date|schedule|assignee|authorization|authenticated|recommendation acceptance|accept|reject|defer|abstain|career|recruit|matching)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_ACTION_INTENT_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_ACTION_INTENT_ACTOR_INVALID", "ERR_DECISION_ACTION_INTENT_DUPLICATE_OPTION", "ERR_DECISION_ACTION_INTENT_HUMAN_DECISION_INVALID", "ERR_DECISION_ACTION_INTENT_ID_MISMATCH", "ERR_DECISION_ACTION_INTENT_INPUT_INVALID", "ERR_DECISION_ACTION_INTENT_INVALID", "ERR_DECISION_ACTION_INTENT_OPERATION_INVALID", "ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID", "ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN", "ERR_DECISION_ACTION_INTENT_RATIONALE_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["ActionIntentActor", "DecisionActionIntent", "DecisionActionIntentInput"]);
    const actor: ActionIntentActor = { origin: "HUMAN_INPUT", actorId: "actor" }; const declarationInput: DecisionActionIntentInput = { declaredBy: actor, operationalizedOptionItemIds: ["DCI_000000000000000000000000"], operationDescription: "operation", rationale: null }; const declaration: DecisionActionIntent | null = null;
    expect([actor.origin, declarationInput.rationale, declaration]).toEqual(["HUMAN_INPUT", null, null]);
  });
});
