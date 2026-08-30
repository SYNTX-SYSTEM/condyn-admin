import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as assemblyModule from "../../../lib/decision-core/context-observation-context-validation-assembly";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation, assertDecisionContextObservationContextValidationAssembly, createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal, createBoundDecisionContextObservationTargetRevisionBinder, createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration, createDecisionContextObservationContextTransition,
  createDecisionContextObservationContextValidationAssembly, createDecisionContextObservationItemMaterialization,
  createDecisionContextObservationItemProjection, createDecisionContextObservationMaterializationReadiness,
  createDecisionContextObservationProposal, createDecisionContextObservationTargetDeclaration, createDecisionContextRevision,
  createOutcomeAttributionProposal, createStateChangeClaim, createStructuralExpectation, reconstructStructuralGap,
  type DecisionContextObservationContextTransition, type DecisionContextRevision, type DecisionContextValidationAssemblyInput
} from "../../../lib/decision-core";

type Ref = { producerId: string; authorityContractId: string; artifactId: string; locator: string };
type Hostile = Record<PropertyKey, unknown>;
const ref: Ref = { producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" };
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])])) : value;
const assemblyId = (transition: unknown, input: unknown, assembly: unknown): string => `DCOCVA_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_V1", canonical(transition), canonical(input), canonical(assembly)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;
const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action" }, operationDescription: "operation" });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state" }, stateChangeDescription: "change" }), provenance: { origin: "HUMAN_INPUT", actorId: "association" } }), provenance: { origin: "HUMAN_INPUT", actorId: "attribution" } });

function baseRevision(): { revision: DecisionContextRevision; oldInput: DecisionContextValidationAssemblyInput } {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const expectation = createStructuralExpectation(context, { kind: "CONTEXT_ROLE", role: "OBSERVATION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  const gap = reconstructStructuralGap(context, expectation, { kind: "CONTEXT_ROLE" });
  if (gap === null) throw new Error("base observation gap missing");
  const oldInput: DecisionContextValidationAssemblyInput = { expectationValidations: [{ expectation, basis: { kind: "CONTEXT_ROLE" }, result: gap }], consequenceValidations: [] };
  return { revision: createDecisionContextRevision({ previousRevisionId: null, context, validationInput: oldInput, validationAssembly: assembleDecisionContextValidation(context, oldInput) }), oldInput };
}

async function transition(): Promise<{ transition: DecisionContextObservationContextTransition; revision: DecisionContextRevision; oldInput: DecisionContextValidationAssemblyInput }> {
  const { revision, oldInput } = baseRevision();
  const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance: { origin: "HUMAN_INPUT", actorId: "observation" } });
  const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: "admission" }, rationale: "rationale" });
  const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission });
  const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: revision.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target" }, rationale: "target" });
  const binding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => revision }).bind(declaration);
  const readiness = createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding });
  const materialization = createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: readiness });
  return { transition: createDecisionContextObservationContextTransition({ decisionContextObservationItemMaterialization: materialization }), revision, oldInput };
}
const input = (value: DecisionContextObservationContextTransition, validationInput: DecisionContextValidationAssemblyInput) => ({ decisionContextObservationContextTransition: value, validationInput });

describe("Decision Context Observation Context Validation Assembly", () => {
  it("retains one sealed 8D7 transition, explicit empty validation input, and its deterministic derivational assembly without changing NOT_RUN", async () => {
    const { transition: value, revision } = await transition(); const explicit = emptyInput(); const result = createDecisionContextObservationContextValidationAssembly(input(value, explicit));
    expect(result.artifactKind).toBe("DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY"); expect(result.decisionContextObservationContextTransition).toEqual(value); expect(result.validationInput).toEqual(explicit); expect(result.validationAssembly).toEqual(assembleDecisionContextValidation(value.context, explicit)); expect(result.validationAssembly.contextId).toBe(value.context.contextId); expect(result.decisionContextObservationContextValidationAssemblyId).toBe(assemblyId(value, explicit, result.validationAssembly));
    expect(value.context.validationStatus).toBe("NOT_RUN"); expect(result.decisionContextObservationContextTransition.context.validationStatus).toBe("NOT_RUN"); expect(result.validationInput).not.toEqual(revision.validationInput); expect(result.validationAssembly).not.toEqual(revision.validationAssembly); expect((result as unknown as Record<string, unknown>).validatedContext).toBeUndefined(); expect((result as unknown as Record<string, unknown>).validationStatus).toBeUndefined();
  });

  it("does not teleport base validation: explicitly reused base input is reassembled against the new Context and propagates its precise incoherence error", async () => {
    const { transition: value, revision, oldInput } = await transition(); expect(revision.validationInput).toEqual(oldInput); expect(() => createDecisionContextObservationContextValidationAssembly(input(value, oldInput))).toThrow("ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID");
    const empty = createDecisionContextObservationContextValidationAssembly(input(value, emptyInput())); expect(empty.validationAssembly.contextId).toBe(value.context.contextId); expect(empty.validationAssembly.assemblyId).not.toBe(revision.validationAssembly.assemblyId); expect(value.context.validationStatus).toBe("NOT_RUN");
  });

  it("accepts no implicit base state, is detached from caller transition and input mutation, and performs no Context, authority, revision, or persistence operation", async () => {
    const { transition: value } = await transition(); const explicit = emptyInput(); const beforeTransition = structuredClone(value); const result = createDecisionContextObservationContextValidationAssembly(input(value, explicit));
    expect(() => createDecisionContextObservationContextValidationAssembly({ ...input(value, explicit), revision: {} } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID");
    value.context.items[0].statement = "caller transition mutation"; (explicit.expectationValidations as unknown as unknown[]).push({}); expect(result.decisionContextObservationContextTransition).toEqual(beforeTransition); expect(result.validationInput).toEqual(emptyInput());
    expect((result as unknown as Record<string, unknown>).revisionId).toBeUndefined(); expect((result as unknown as Record<string, unknown>).previousRevisionId).toBeUndefined(); expect((result as unknown as Record<string, unknown>).persistence).toBeUndefined();
  });

  it("rejects hostile outer, transition, validation-input array, and nested entry state without executing getters", async () => {
    const { transition: value } = await transition(); let calls = 0;
    const outer = {} as Hostile; Object.defineProperty(outer, "decisionContextObservationContextTransition", { enumerable: true, get: () => { calls += 1; return value; } }); Object.defineProperty(outer, "validationInput", { enumerable: true, value: emptyInput() });
    const hostileTransition = structuredClone(value) as unknown as Hostile; Object.defineProperty(hostileTransition.context as Hostile, "items", { enumerable: true, configurable: true, get: () => { calls += 1; return value.context.items; } });
    const hostileArray = emptyInput() as unknown as Hostile; Object.defineProperty(hostileArray.expectationValidations as unknown as Hostile, "0", { enumerable: true, get: () => { calls += 1; return {}; } });
    const hostileEntry = { expectationValidations: [{}], consequenceValidations: [] } as Hostile; Object.defineProperty((hostileEntry.expectationValidations as unknown as Hostile)[0] as Hostile, "expectation", { enumerable: true, get: () => { calls += 1; return {}; } });
    expect(() => createDecisionContextObservationContextValidationAssembly(outer as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID"); expect(() => createDecisionContextObservationContextValidationAssembly(input(hostileTransition as never, emptyInput()))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_TRANSITION_INVALID");
    expect(() => createDecisionContextObservationContextValidationAssembly(input(value, hostileArray as never))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID"); expect(() => createDecisionContextObservationContextValidationAssembly(input(value, hostileEntry as never))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID"); expect(calls).toBe(0);
  });

  it("self-contained stored assertion rejects incoherent body before stale ID and commits complete transition, input, and assembly state canonically", async () => {
    const { transition: value } = await transition(); const result = createDecisionContextObservationContextValidationAssembly(input(value, emptyInput())); assertDecisionContextObservationContextValidationAssembly(structuredClone(result));
    const stale = structuredClone(result); stale.decisionContextObservationContextValidationAssemblyId = "DCOCVA_000000000000000000000000"; expect(() => assertDecisionContextObservationContextValidationAssembly(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_ID_MISMATCH");
    const variants = [structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale)];
    variants[0].validationAssembly.contextId = "DCTX_000000000000000000000000"; variants[1].validationAssembly.expectationResults.push({ expectationId: "DEXP_000000000000000000000000", basis: { kind: "CONTEXT_ROLE" }, outcome: "NO_GAP" }); (variants[2].validationInput.expectationValidations as unknown as unknown[]).push({}); variants[3].decisionContextObservationContextTransition.context.items[0].statement = "changed";
    for (const variant of variants) expect(() => assertDecisionContextObservationContextValidationAssembly(variant)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INVALID");
    const reordered = createDecisionContextObservationContextValidationAssembly(reorder(input(result.decisionContextObservationContextTransition, result.validationInput)) as never); expect(reordered.decisionContextObservationContextValidationAssemblyId).toBe(result.decisionContextObservationContextValidationAssemblyId);
    const alteredInput = structuredClone(result.validationInput); (alteredInput.expectationValidations as unknown as unknown[]).push({}); expect(assemblyId(result.decisionContextObservationContextTransition, alteredInput, result.validationAssembly)).not.toBe(result.decisionContextObservationContextValidationAssemblyId); const alteredAssembly = structuredClone(result.validationAssembly); alteredAssembly.consequenceIds.push("DCONS_000000000000000000000000"); expect(assemblyId(result.decisionContextObservationContextTransition, result.validationInput, alteredAssembly)).not.toBe(result.decisionContextObservationContextValidationAssemblyId);
  });

  it("exposes only the exact runtime and four owned errors and contains no revision, persistence, authority, model, provider, Career, Feedback, Learning, temporal, or random semantics", () => {
    expect(Object.keys(assemblyModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION", "assertDecisionContextObservationContextValidationAssembly", "createDecisionContextObservationContextValidationAssembly"]); expect(Object.keys(decisionCore).filter((key) => Object.keys(assemblyModule).includes(key)).sort()).toEqual(Object.keys(assemblyModule).sort());
    const source = files(resolve(process.cwd(), "lib/decision-core/context-observation-context-validation-assembly")).map((file) => readFileSync(file, "utf8")).join("\n"); expect(source).not.toMatch(/createDecisionContextDraft|createDecisionContextRevision|assertDecisionContextRevision|buildDecisionContextRevisionId|createBoundDecisionContextAuthorityValidator|BoundAuthoritativeStateReader|revision-persistence|revision-lineage|persister|repository writer|assessment|provider|model|evaluator|career|capability-core|Date\.now|new Date|Math\.random|UUID|Feedback|Learning/i); expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_TRANSITION_INVALID"]);
  });
});
