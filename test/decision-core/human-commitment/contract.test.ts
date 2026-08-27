import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as humanCommitment from "../../../lib/decision-core/human-commitment";
import type { HumanCommitment, HumanCommitmentActor, HumanCommitmentInput } from "../../../lib/decision-core/human-commitment";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertHumanCommitment,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createBoundDecisionRecommendationProposer,
  createDecisionActionIntent,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createHumanCommitment,
  createHumanDecisionDeclaration,
  validateDecisionProposalCoherence,
  type DecisionActionIntent,
  type DecisionContextRevision
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "A", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "B", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } }
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

async function actionIntent(operationDescription = "operate"): Promise<DecisionActionIntent> {
  const value = revision();
  const optionIds = ids(value, "OPTION");
  const request = createDecisionAssessmentRequest({ revisionId: value.revisionId, requestedBy: { origin: "HUMAN_INPUT", actorId: "requester" }, decisionQuestionItemId: one(value, "DECISION_QUESTION"), selectedOptionItemIds: optionIds, selectedObjectiveItemIds: ids(value, "OBJECTIVE"), selectedConstraintItemIds: [] });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
  const assessment = await createBoundDecisionAssessmentProposer({ evaluate: async () => [{ optionItemId: optionIds[0], criterionItemId: one(value, "OBJECTIVE"), disposition: "ALIGNED" as const, rationale: "assessment" }] }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" });
  const recommendation = await createBoundDecisionRecommendationProposer({ recommend: async () => [{ optionItemId: optionIds[0], rationale: "recommendation" }] }).propose(assessment, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" });
  const declaration = createHumanDecisionDeclaration(validateDecisionProposalCoherence(recommendation), { decidedBy: { origin: "HUMAN_INPUT", actorId: "decider" }, chosenOptionItemIds: optionIds, rationale: null });
  return createDecisionActionIntent(declaration, { declaredBy: { origin: "HUMAN_INPUT", actorId: "intent-declarer" }, operationalizedOptionItemIds: optionIds, operationDescription, rationale: "intent rationale" });
}

const input = (overrides: Partial<HumanCommitmentInput> = {}): HumanCommitmentInput => ({ committedBy: { origin: "HUMAN_INPUT", actorId: " committer " }, rationale: " commitment rationale ", ...overrides });
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

function stringifyArrayPayload(source: string): string {
  const marker = "JSON.stringify([";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("missing identity payload");
  let depth = 0;
  for (let index = start + marker.length - 1; index < source.length; index += 1) {
    if (source[index] === "[") depth += 1;
    if (source[index] === "]") depth -= 1;
    if (depth === 0) return source.slice(start + marker.length, index);
  }
  throw new Error("unterminated identity payload");
}

describe("Human Commitment", () => {
  it("creates one commitment to the complete Action Intent without duplicating option or action fields", async () => {
    const predecessor = await actionIntent();
    expect(Object.keys(input()).sort()).toEqual(["committedBy", "rationale"]);
    const result = createHumanCommitment(predecessor, input());
    expect(result).toMatchObject({ artifactKind: "HUMAN_COMMITMENT", schemaVersion: "HUMAN_COMMITMENT_V1", actionIntent: predecessor, committedBy: { origin: "HUMAN_INPUT", actorId: "committer" }, rationale: "commitment rationale" });
    expect(Object.keys(result).sort()).toEqual(["actionIntent", "artifactKind", "committedBy", "humanCommitmentId", "rationale", "schemaVersion"]);
    expect(result).not.toHaveProperty("operationalizedOptionItemIds");
    expect(result).not.toHaveProperty("chosenOptionItemIds");
    for (const field of ["actionType", "targetRef", "assignedTo", "assignee", "executor", "responsibleFor", "ownerOf", "accountableFor"]) expect(result).not.toHaveProperty(field);
  });

  it("keeps the commitment actor independent, permits multiple independent commitments, and validates local canonical state", async () => {
    const predecessor = await actionIntent();
    const first = createHumanCommitment(predecessor, input({ committedBy: { origin: "HUMAN_INPUT", actorId: "first" }, rationale: null }));
    const second = createHumanCommitment(predecessor, input({ committedBy: { origin: "HUMAN_INPUT", actorId: "second" } }));
    expect(first.committedBy.actorId).not.toBe(predecessor.humanDecisionDeclaration.decidedBy.actorId);
    expect(first.committedBy.actorId).not.toBe(predecessor.declaredBy.actorId);
    expect(first.humanCommitmentId).not.toBe(second.humanCommitmentId);
    expect(first.rationale).toBeNull();
    expect(() => createHumanCommitment(predecessor, input({ committedBy: { origin: "MODEL_PROPOSAL", actorId: "actor" } as never }))).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID");
    expect(() => createHumanCommitment(predecessor, input({ committedBy: { origin: "HUMAN_INPUT", actorId: " " } }))).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID");
    expect(() => createHumanCommitment(predecessor, input({ rationale: " " }))).toThrow("ERR_DECISION_HUMAN_COMMITMENT_RATIONALE_INVALID");
  });

  it("captures predecessor and input defensively and commits complete Action Intent state into DHCOM identity", async () => {
    const predecessor = await actionIntent();
    const supplied = input();
    const result = createHumanCommitment(predecessor, supplied);
    const original = structuredClone(result);
    predecessor.declaredBy.actorId = "changed";
    supplied.committedBy.actorId = "changed";
    supplied.rationale = "changed";
    expect(result).toEqual(original);
    const reordered = reorder(original.actionIntent) as DecisionActionIntent;
    expect(createHumanCommitment(reordered, input()).humanCommitmentId).toBe(original.humanCommitmentId);
    const changedPredecessor = await actionIntent("different intended operation");
    expect(changedPredecessor.actionIntentId).not.toBe(original.actionIntent.actionIntentId);
    expect(createHumanCommitment(changedPredecessor, input()).humanCommitmentId).not.toBe(original.humanCommitmentId);
    expect(createHumanCommitment(original.actionIntent, input({ committedBy: { origin: "HUMAN_INPUT", actorId: "other" } })).humanCommitmentId).not.toBe(original.humanCommitmentId);
    expect(createHumanCommitment(original.actionIntent, input({ rationale: "other" })).humanCommitmentId).not.toBe(original.humanCommitmentId);
    expect(createHumanCommitment(original.actionIntent, input()).humanCommitmentId).toBe(original.humanCommitmentId);
  });

  it("asserts exact canonical stored state without repair and separates stale identity", async () => {
    const result = createHumanCommitment(await actionIntent(), input());
    assertHumanCommitment(result);
    const stale = structuredClone(result); stale.humanCommitmentId = "DHCOM_000000000000000000000000";
    expect(() => assertHumanCommitment(stale)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH");
    const actor = structuredClone(result); actor.committedBy.actorId = " committer ";
    const rationale = structuredClone(result); rationale.rationale = " commitment rationale ";
    for (const value of [actor, rationale]) expect(() => assertHumanCommitment(value)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_INVALID");
  });

  it("rejects hostile local constructor and stored representations without executing getters", async () => {
    const predecessor = await actionIntent();
    let getterCalls = 0;
    const accessorInput = input() as unknown as Record<string, unknown>;
    Object.defineProperty(accessorInput, "rationale", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "rationale"; } });
    const symbolInput = input() as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolInput, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenInput = input() as unknown as Record<string, unknown>; Object.defineProperty(hiddenInput, "hidden", { enumerable: false, value: true });
    const cyclicInput = input() as unknown as Record<string, unknown>; cyclicInput.self = cyclicInput;
    for (const value of [accessorInput, symbolInput, hiddenInput, cyclicInput]) expect(() => createHumanCommitment(predecessor, value as never)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_INPUT_INVALID");
    const result = createHumanCommitment(predecessor, input());
    const accessorStored = structuredClone(result); Object.defineProperty(accessorStored.committedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "committer"; } });
    const symbolStored = structuredClone(result) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolStored, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenStored = structuredClone(result) as unknown as Record<string, unknown>; Object.defineProperty(hiddenStored, "hidden", { enumerable: false, value: true });
    const cyclicStored = structuredClone(result) as unknown as Record<string, unknown>; cyclicStored.self = cyclicStored;
    for (const value of [accessorStored, symbolStored, hiddenStored, cyclicStored]) expect(() => assertHumanCommitment(value)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("rejects hostile nested Action Intent predecessor state without executing getters", async () => {
    const predecessor = await actionIntent();
    let getterCalls = 0;
    const hostileConstructor = structuredClone(predecessor);
    Object.defineProperty(hostileConstructor.humanDecisionDeclaration.proposalCoherenceValidation.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "requester"; } });
    expect(() => createHumanCommitment(hostileConstructor, input())).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID");
    const valid = createHumanCommitment(predecessor, input());
    const hostileStored = structuredClone(valid);
    Object.defineProperty(hostileStored.actionIntent.humanDecisionDeclaration.proposalCoherenceValidation.recommendationProposal.assessmentProposal.assessmentBasis.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "requester"; } });
    expect(() => assertHumanCommitment(hostileStored)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_INVALID");
    const sparse = structuredClone(predecessor); sparse.humanDecisionDeclaration.chosenOptionItemIds = new Array<string>(1);
    expect(() => createHumanCommitment(sparse, input())).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID");
    const custom = structuredClone(predecessor); const values = [...custom.humanDecisionDeclaration.chosenOptionItemIds]; Object.defineProperty(values, "custom", { enumerable: true, value: true }); custom.humanDecisionDeclaration.chosenOptionItemIds = values;
    expect(() => createHumanCommitment(custom, input())).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the narrow generic 8A2 contract and hashes complete predecessor representation", () => {
    expect(Object.keys(humanCommitment).sort()).toEqual(["HUMAN_COMMITMENT_SCHEMA_VERSION", "assertHumanCommitment", "createHumanCommitment"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(humanCommitment).includes(name)).sort()).toEqual(Object.keys(humanCommitment).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/human-commitment")).map((file) => readFileSync(file, "utf8")).join("\n");
    const identity = source.match(/function commitmentId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing commitment identity");
    const payload = stringifyArrayPayload(identity).replace(/\s+/g, "");
    expect(payload).toBe("HUMAN_COMMITMENT_SCHEMA_VERSION,canonical(actionIntentasunknownasCaptured),[\"HUMAN_INPUT\",committedBy.actorId],commitmentRationale");
    expect(payload).not.toContain("actionIntentId");
    expect(payload).not.toContain("predecessorId");
    expect(payload).not.toMatch(/\{[^}]*actionIntentId/);
    expect(source).not.toMatch(/from\s+["'][^"']*(human-decision|proposal-coherence|recommendation-proposal|assessment-proposal|assessment-basis|assessment-request|revision|context|persistence|lineage|career|matching)/i);
    expect(source).not.toMatch(/\b(responsibleFor|ownerOf|accountableFor|assignedTo|assignee|executor|authorized|authorization|permission|role|action occurred|executed|execution status|completed|done|success|failure|outcome|feedback|learning|timestamp|createdAt|dueAt|schedule|career|recruit|matching|accept|reject|defer|abstain)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_HUMAN_COMMITMENT_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID", "ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID", "ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH", "ERR_DECISION_HUMAN_COMMITMENT_INPUT_INVALID", "ERR_DECISION_HUMAN_COMMITMENT_INVALID", "ERR_DECISION_HUMAN_COMMITMENT_RATIONALE_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["HumanCommitment", "HumanCommitmentActor", "HumanCommitmentInput"]);
    const actor: HumanCommitmentActor = { origin: "HUMAN_INPUT", actorId: "actor" }; const commitmentInput: HumanCommitmentInput = { committedBy: actor, rationale: null }; const commitment: HumanCommitment | null = null;
    expect([actor.origin, commitmentInput.rationale, commitment]).toEqual(["HUMAN_INPUT", null, null]);
  });
});
