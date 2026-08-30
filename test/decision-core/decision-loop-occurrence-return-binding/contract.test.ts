import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as bindingModule from "../../../lib/decision-core/decision-loop-occurrence-return-binding";
import type { DecisionLoopOccurrenceReturnBindingInput } from "../../../lib/decision-core/decision-loop-occurrence-return-binding";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation, assertDecisionContextObservationRevisionPersistence, assertDecisionLoopOccurrenceReturnBinding, assertHumanCommitmentActionOccurrenceAssociationProposal, createActionOccurrenceClaim, createActionStateChangeAssociationProposal,
  createBoundDecisionAssessmentBasisBinder, createBoundDecisionAssessmentProposer, createBoundDecisionContextObservationRevisionPersister,
  createBoundDecisionContextObservationTargetRevisionBinder, createBoundDecisionRecommendationProposer, createDecisionActionIntent,
  createDecisionAssessmentRequest, createDecisionContextDraft, createDecisionLoopOccurrenceReturnBinding, createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationContextTransition, createDecisionContextObservationContextValidationAssembly,
  createDecisionContextObservationItemMaterialization, createDecisionContextObservationItemProjection,
  createDecisionContextObservationMaterializationReadiness, createDecisionContextObservationProposal,
  createDecisionContextObservationRevisionCreation, createDecisionContextObservationTargetDeclaration, createDecisionContextRevision,
  createHumanCommitment, createHumanCommitmentActionOccurrenceAssociationProposal, createHumanDecisionDeclaration,
  createOutcomeAttributionProposal, createStateChangeClaim, createStructuralExpectation, reconstructStructuralGap,
  validateDecisionProposalCoherence, InMemoryDecisionContextRevisionRepository, type ActionOccurrenceClaim, type DecisionContextObservationRevisionPersistence,
  type DecisionContextRevision, type DecisionContextValidationAssemblyInput, type HumanCommitment
} from "../../../lib/decision-core";

const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const occurrence = (operationDescription = "performed operation", actorId = "occurrence actor"): ActionOccurrenceClaim => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId }, operationDescription });

function contextRevision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Option", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const input = emptyInput();
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput: input, validationAssembly: assembleDecisionContextValidation(context, input) });
}

async function commitment(): Promise<HumanCommitment> {
  const revision = contextRevision(); const item = (role: string) => revision.context.items.find((entry) => entry.role === role)?.itemId as string; const optionId = item("OPTION");
  const request = createDecisionAssessmentRequest({ revisionId: revision.revisionId, requestedBy: { origin: "HUMAN_INPUT", actorId: "requester" }, decisionQuestionItemId: item("DECISION_QUESTION"), selectedOptionItemIds: [optionId], selectedObjectiveItemIds: [item("OBJECTIVE")], selectedConstraintItemIds: [] });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => revision }).bind(request);
  const assessment = await createBoundDecisionAssessmentProposer({ evaluate: async () => [{ optionItemId: optionId, criterionItemId: item("OBJECTIVE"), disposition: "ALIGNED" as const, rationale: "assessment" }] }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "assessment" });
  const recommendation = await createBoundDecisionRecommendationProposer({ recommend: async () => [{ optionItemId: optionId, rationale: "recommendation" }] }).propose(assessment, { origin: "MODEL_PROPOSAL", proposalRef: "recommendation" });
  const declaration = createHumanDecisionDeclaration(validateDecisionProposalCoherence(recommendation), { decidedBy: { origin: "HUMAN_INPUT", actorId: "decider" }, chosenOptionItemIds: [optionId], rationale: null });
  const intent = createDecisionActionIntent(declaration, { declaredBy: { origin: "HUMAN_INPUT", actorId: "intent" }, operationalizedOptionItemIds: [optionId], operationDescription: "intended operation", rationale: null });
  return createHumanCommitment(intent, { committedBy: { origin: "HUMAN_INPUT", actorId: "committer" }, rationale: null });
}

async function persistence(actionOccurrenceClaim: ActionOccurrenceClaim, observationStatement = "observation"): Promise<DecisionContextObservationRevisionPersistence> {
  const baseContext = createDecisionContextDraft({ sourceStateReferences: [], items: [{ role: "DECISION_QUESTION", statement: "Return?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }, { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }] });
  const expectation = createStructuralExpectation(baseContext, { kind: "CONTEXT_ROLE", role: "OBSERVATION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  const gap = reconstructStructuralGap(baseContext, expectation, { kind: "CONTEXT_ROLE" }); if (gap === null) throw new Error("gap missing");
  const oldInput = { expectationValidations: [{ expectation, basis: { kind: "CONTEXT_ROLE" as const }, result: gap }], consequenceValidations: [] };
  const base = createDecisionContextRevision({ previousRevisionId: null, context: baseContext, validationInput: oldInput, validationAssembly: assembleDecisionContextValidation(baseContext, oldInput) });
  const stateChange = createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state actor" }, stateChangeDescription: "state change" });
  const association = createActionStateChangeAssociationProposal({ actionOccurrenceClaim, stateChangeClaim: stateChange, provenance: { origin: "HUMAN_INPUT", actorId: "association" } });
  const attribution = createOutcomeAttributionProposal({ associationProposal: association, provenance: { origin: "HUMAN_INPUT", actorId: "attribution" } });
  const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution, statement: observationStatement, provenance: { origin: "HUMAN_INPUT", actorId: "observation" } });
  const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: "admission" }, rationale: null });
  const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission });
  const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: base.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target" }, rationale: null });
  const targetBinding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => base }).bind(declaration);
  const readiness = createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: targetBinding });
  const materialization = createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: readiness });
  const transition = createDecisionContextObservationContextTransition({ decisionContextObservationItemMaterialization: materialization });
  const assembly = createDecisionContextObservationContextValidationAssembly({ decisionContextObservationContextTransition: transition, validationInput: emptyInput() });
  const creation = createDecisionContextObservationRevisionCreation({ decisionContextObservationContextValidationAssembly: assembly });
  const repository = new InMemoryDecisionContextRevisionRepository();
  await repository.createDecisionContextRevisionPersister().persist(base);
  const result = await createBoundDecisionContextObservationRevisionPersister(repository.createDecisionContextRevisionPersister()).persist({ decisionContextObservationRevisionCreation: creation });
  expect(await repository.getRevisionById(creation.revision.revisionId)).toEqual(creation.revision);
  return result;
}

async function bridge(actionOccurrenceClaim: ActionOccurrenceClaim) {
  return createHumanCommitmentActionOccurrenceAssociationProposal({ humanCommitment: await commitment(), actionOccurrenceClaim, provenance: { origin: "HUMAN_INPUT", actorId: "bridge" } });
}

async function input(bridgeClaim = occurrence(), returnClaim = bridgeClaim): Promise<DecisionLoopOccurrenceReturnBindingInput> {
  return {
    humanCommitmentActionOccurrenceAssociationProposal: await bridge(bridgeClaim),
    decisionContextObservationRevisionPersistence: await persistence(returnClaim)
  };
}

describe("Decision Loop Occurrence Return Binding", () => {
  it("binds exact complete occurrence state end to end across the sealed 8E1 bridge and governed 8D10 return path", async () => {
    const supplied = await input(); const result = createDecisionLoopOccurrenceReturnBinding(supplied);
    const bridgeClaim = result.humanCommitmentActionOccurrenceAssociationProposal.actionOccurrenceClaim;
    const returnClaim = result.decisionContextObservationRevisionPersistence.decisionContextObservationRevisionCreation.decisionContextObservationContextValidationAssembly.decisionContextObservationContextTransition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim;
    expect(bridgeClaim).toEqual(returnClaim); expect(result.humanCommitmentActionOccurrenceAssociationProposal.humanCommitment.actionIntent.humanDecisionDeclaration).toBeDefined(); expect(result.decisionLoopOccurrenceReturnBindingId).toMatch(/^DLORB_[0-9A-F]{24}$/);
    expect(Object.keys(result).sort()).toEqual(["artifactKind", "decisionContextObservationRevisionPersistence", "decisionLoopOccurrenceReturnBindingId", "humanCommitmentActionOccurrenceAssociationProposal", "schemaVersion"]);
    for (const key of ["actionOccurrenceClaim", "loopClosed", "closureStatus", "success", "executionStatus", "fulfilled", "causation", "feedback", "learning", "truth", "authorityCertificate", "current", "head", "latest", "timestamp"]) expect(result).not.toHaveProperty(key);
  });

  it("accepts independently constructed complete-equal claims but rejects valid claim differences with exact mismatch", async () => {
    const first = occurrence("same", "actor"); const equal = occurrence("same", "actor"); expect(first).toEqual(equal);
    const equalInput = await input(first, equal); expect(() => createDecisionLoopOccurrenceReturnBinding(equalInput)).not.toThrow();
    await expect((async () => createDecisionLoopOccurrenceReturnBinding(await input(occurrence("bridge"), occurrence("return"))) )()).rejects.toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_OCCURRENCE_MISMATCH");
    await expect((async () => createDecisionLoopOccurrenceReturnBinding(await input(occurrence("same", "bridge actor"), occurrence("same", "return actor"))) )()).rejects.toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_OCCURRENCE_MISMATCH");
  });

  it("retains complete predecessors, commits complete state deterministically, and returns detached data", async () => {
    const supplied = await input(); const result = createDecisionLoopOccurrenceReturnBinding(supplied); const baseline = structuredClone(result);
    supplied.humanCommitmentActionOccurrenceAssociationProposal.provenance = { origin: "MODEL_PROPOSAL", proposalRef: "changed" }; supplied.decisionContextObservationRevisionPersistence.persistedRevision.context.items[0].statement = "changed";
    expect(result).toEqual(baseline); expect(createDecisionLoopOccurrenceReturnBinding(reorder({ humanCommitmentActionOccurrenceAssociationProposal: baseline.humanCommitmentActionOccurrenceAssociationProposal, decisionContextObservationRevisionPersistence: baseline.decisionContextObservationRevisionPersistence }) as DecisionLoopOccurrenceReturnBindingInput).decisionLoopOccurrenceReturnBindingId).toBe(baseline.decisionLoopOccurrenceReturnBindingId);
    const changedBridge = await input(); changedBridge.humanCommitmentActionOccurrenceAssociationProposal = createHumanCommitmentActionOccurrenceAssociationProposal({ humanCommitment: changedBridge.humanCommitmentActionOccurrenceAssociationProposal.humanCommitment, actionOccurrenceClaim: changedBridge.humanCommitmentActionOccurrenceAssociationProposal.actionOccurrenceClaim, provenance: { origin: "MODEL_PROPOSAL", proposalRef: "other" } }); const changedReturn = await input(); changedReturn.decisionContextObservationRevisionPersistence.persistedRevision.context.items[0].statement = "other";
    expect(createDecisionLoopOccurrenceReturnBinding(changedBridge).decisionLoopOccurrenceReturnBindingId).not.toBe(baseline.decisionLoopOccurrenceReturnBindingId); expect(() => createDecisionLoopOccurrenceReturnBinding(changedReturn)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_PERSISTENCE_INVALID");
  });

  it("commits a valid complete governed 8D10 return lineage to DLORB identity even when the shared complete occurrence claim is unchanged", async () => {
    const sharedClaim = occurrence("shared occurrence", "shared actor"); const sharedBridge = await bridge(sharedClaim);
    const firstReturn = await persistence(sharedClaim, "first valid observation"); const secondReturn = await persistence(sharedClaim, "second valid observation");
    assertHumanCommitmentActionOccurrenceAssociationProposal(sharedBridge); assertDecisionContextObservationRevisionPersistence(firstReturn); assertDecisionContextObservationRevisionPersistence(secondReturn);
    const first = createDecisionLoopOccurrenceReturnBinding({ humanCommitmentActionOccurrenceAssociationProposal: sharedBridge, decisionContextObservationRevisionPersistence: firstReturn });
    const second = createDecisionLoopOccurrenceReturnBinding({ humanCommitmentActionOccurrenceAssociationProposal: sharedBridge, decisionContextObservationRevisionPersistence: secondReturn });
    const firstClaim = first.decisionContextObservationRevisionPersistence.decisionContextObservationRevisionCreation.decisionContextObservationContextValidationAssembly.decisionContextObservationContextTransition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim;
    const secondClaim = second.decisionContextObservationRevisionPersistence.decisionContextObservationRevisionCreation.decisionContextObservationContextValidationAssembly.decisionContextObservationContextTransition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim;
    expect(firstClaim).toEqual(secondClaim); expect(first.decisionLoopOccurrenceReturnBindingId).not.toBe(second.decisionLoopOccurrenceReturnBindingId);
  });

  it("rejects hostile outer and nested predecessor state without getter execution", async () => {
    let calls = 0; const valid = await input(); const accessor = structuredClone(valid) as unknown as Record<string, unknown>; Object.defineProperty(accessor, "decisionContextObservationRevisionPersistence", { enumerable: true, get: () => { calls += 1; return valid.decisionContextObservationRevisionPersistence; } });
    const symbol = structuredClone(valid) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbol, Symbol("hostile"), { enumerable: true, value: true }); const hidden = structuredClone(valid) as unknown as Record<string, unknown>; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true }); const extra = { ...valid, extra: true };
    const hostileBridge = structuredClone(valid); Object.defineProperty(hostileBridge.humanCommitmentActionOccurrenceAssociationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, get: () => { calls += 1; return "x"; } });
    const hostileReturn = structuredClone(valid); Object.defineProperty(hostileReturn.decisionContextObservationRevisionPersistence.decisionContextObservationRevisionCreation.decisionContextObservationContextValidationAssembly.decisionContextObservationContextTransition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, get: () => { calls += 1; return "x"; } });
    for (const value of [accessor, symbol, hidden, extra]) expect(() => createDecisionLoopOccurrenceReturnBinding(value as never)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INPUT_INVALID");
    expect(() => createDecisionLoopOccurrenceReturnBinding(hostileBridge)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ASSOCIATION_INVALID"); expect(() => createDecisionLoopOccurrenceReturnBinding(hostileReturn)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_PERSISTENCE_INVALID"); expect(calls).toBe(0);
  });

  it("asserts stored matched state without repository, persistence, or authority operations and separates invalidity from stale identity", async () => {
    const result = createDecisionLoopOccurrenceReturnBinding(await input()); assertDecisionLoopOccurrenceReturnBinding(structuredClone(result));
    const stale = structuredClone(result); stale.decisionLoopOccurrenceReturnBindingId = "DLORB_000000000000000000000000"; expect(() => assertDecisionLoopOccurrenceReturnBinding(stale)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ID_MISMATCH");
    const mismatch = structuredClone(stale); mismatch.decisionContextObservationRevisionPersistence.decisionContextObservationRevisionCreation.decisionContextObservationContextValidationAssembly.decisionContextObservationContextTransition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim.operationDescription = "different";
    const invalidBridge = structuredClone(stale); invalidBridge.humanCommitmentActionOccurrenceAssociationProposal.humanCommitment.humanCommitmentId = "DHCOM_000000000000000000000000";
    for (const value of [mismatch, invalidBridge]) expect(() => assertDecisionLoopOccurrenceReturnBinding(value)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INVALID");
  });

  it("maps an independently valid stored bridge/return occurrence mismatch to binding INVALID before its stale outer DLORB identity", async () => {
    const proposalA = await bridge(occurrence("claim A", "actor A")); const persistenceB = await persistence(occurrence("claim B", "actor B"));
    assertHumanCommitmentActionOccurrenceAssociationProposal(proposalA); assertDecisionContextObservationRevisionPersistence(persistenceB);
    const stored = { artifactKind: "DECISION_LOOP_OCCURRENCE_RETURN_BINDING" as const, schemaVersion: "DECISION_LOOP_OCCURRENCE_RETURN_BINDING_V1" as const, decisionLoopOccurrenceReturnBindingId: "DLORB_000000000000000000000000", humanCommitmentActionOccurrenceAssociationProposal: proposalA, decisionContextObservationRevisionPersistence: persistenceB };
    expect(() => assertDecisionLoopOccurrenceReturnBinding(stored)).toThrow("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INVALID");
  });

  it("exports only the narrow six-error binding surface and contains no repository, persistence, authority, matching, execution, causal, temporal, model, provider, or legacy semantics", () => {
    expect(Object.keys(bindingModule).sort()).toEqual(["DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION", "assertDecisionLoopOccurrenceReturnBinding", "createDecisionLoopOccurrenceReturnBinding"]); expect(Object.keys(decisionCore).filter((key) => Object.keys(bindingModule).includes(key)).sort()).toEqual(Object.keys(bindingModule).sort());
    const source = files(resolve(process.cwd(), "lib/decision-core/decision-loop-occurrence-return-binding")).map((file) => readFileSync(file, "utf8")).join("\n"); expect(source).not.toMatch(/createActionOccurrenceClaim|assertActionOccurrenceClaim|getRevisionById|writeRevision|createBoundDecisionContextRevisionPersister|similarity|matching|temporal|causation|execution verification|feedback generation|learning generation|current selection|head selection|latest selection|provider|model|evaluator|career|capability-core|Date\.now|new Date|Math\.random|UUID/i);
    expect([...new Set(source.match(/ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ASSOCIATION_INVALID", "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ID_MISMATCH", "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INPUT_INVALID", "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INVALID", "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_OCCURRENCE_MISMATCH", "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_PERSISTENCE_INVALID"]);
  });
});
