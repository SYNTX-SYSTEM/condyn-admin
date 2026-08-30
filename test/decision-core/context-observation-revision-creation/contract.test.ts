import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as creationModule from "../../../lib/decision-core/context-observation-revision-creation";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation, assertDecisionContextObservationRevisionCreation, createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal, createBoundDecisionContextObservationTargetRevisionBinder, createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration, createDecisionContextObservationContextTransition,
  createDecisionContextObservationContextValidationAssembly, createDecisionContextObservationItemMaterialization,
  createDecisionContextObservationItemProjection, createDecisionContextObservationMaterializationReadiness,
  createDecisionContextObservationProposal, createDecisionContextObservationRevisionCreation,
  createDecisionContextObservationTargetDeclaration, createDecisionContextRevision, createOutcomeAttributionProposal,
  createStateChangeClaim, reconstructStructuralGap, createStructuralExpectation,
  type DecisionContextObservationContextValidationAssembly, type DecisionContextRevision, type DecisionContextValidationAssemblyInput
} from "../../../lib/decision-core";

type Hostile = Record<PropertyKey, unknown>;
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])])) : value;
const creationId = (predecessor: unknown, revision: unknown): string => `DCORC_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_V1", canonical(predecessor), canonical(revision)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;
const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action" }, operationDescription: "operation" });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state" }, stateChangeDescription: "change" }), provenance: { origin: "HUMAN_INPUT", actorId: "association" } }), provenance: { origin: "HUMAN_INPUT", actorId: "attribution" } });

function baseRevision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const expectation = createStructuralExpectation(context, { kind: "CONTEXT_ROLE", role: "OBSERVATION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  const gap = reconstructStructuralGap(context, expectation, { kind: "CONTEXT_ROLE" });
  if (gap === null) throw new Error("base observation gap missing");
  const validationInput = { expectationValidations: [{ expectation, basis: { kind: "CONTEXT_ROLE" as const }, result: gap }], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

async function predecessor(): Promise<{ value: DecisionContextObservationContextValidationAssembly; base: DecisionContextRevision }> {
  const base = baseRevision();
  const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance: { origin: "HUMAN_INPUT", actorId: "observation" } });
  const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: "admission" }, rationale: "rationale" });
  const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission });
  const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: base.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target" }, rationale: "target" });
  const binding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => base }).bind(declaration);
  const readiness = createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding });
  const materialization = createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: readiness });
  const transition = createDecisionContextObservationContextTransition({ decisionContextObservationItemMaterialization: materialization });
  return { value: createDecisionContextObservationContextValidationAssembly({ decisionContextObservationContextTransition: transition, validationInput: emptyInput() }), base };
}

const input = (value: DecisionContextObservationContextValidationAssembly) => ({ decisionContextObservationContextValidationAssembly: value });
const expectedRevision = (value: DecisionContextObservationContextValidationAssembly, base: DecisionContextRevision) => createDecisionContextRevision({ previousRevisionId: base.revisionId, context: value.decisionContextObservationContextTransition.context, validationInput: value.validationInput, validationAssembly: value.validationAssembly });

describe("Decision Context Observation Revision Creation", () => {
  it("constructs one complete deterministic child DecisionContextRevision from the sealed 8D8 predecessor and exact bound base ID", async () => {
    const { value, base } = await predecessor(); const result = createDecisionContextObservationRevisionCreation(input(value)); const expected = expectedRevision(value, base);
    expect(result.artifactKind).toBe("DECISION_CONTEXT_OBSERVATION_REVISION_CREATION"); expect(result.decisionContextObservationContextValidationAssembly).toEqual(value); expect(result.revision).toEqual(expected); expect(result.revision.previousRevisionId).toBe(base.revisionId); expect(result.revision.revisionId).not.toBe(base.revisionId); expect(result.revision.context).toEqual(value.decisionContextObservationContextTransition.context); expect(result.revision.context.validationStatus).toBe("NOT_RUN"); expect(result.revision.validationInput).toEqual(expected.validationInput); expect(result.revision.validationAssembly).toEqual(expected.validationAssembly); expect(result.decisionContextObservationRevisionCreationId).toBe(creationId(value, expected));
  });

  it("accepts no independent revision input, leaves every predecessor state unchanged, and returns detached data without persistence or repository state", async () => {
    const { value, base } = await predecessor(); const before = structuredClone(value); const baseBefore = structuredClone(base); const result = createDecisionContextObservationRevisionCreation(input(value));
    expect(() => createDecisionContextObservationRevisionCreation({ ...input(value), previousRevisionId: base.revisionId } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INPUT_INVALID");
    value.decisionContextObservationContextTransition.context.items[0].statement = "caller mutation"; (value.validationInput.expectationValidations as unknown as unknown[]).push({});
    expect(result.decisionContextObservationContextValidationAssembly).toEqual(before); expect(base).toEqual(baseBefore); expect((result as unknown as Record<string, unknown>).repository).toBeUndefined(); expect((result as unknown as Record<string, unknown>).persisted).toBeUndefined(); expect((result as unknown as Record<string, unknown>).current).toBeUndefined();
  });

  it("rejects hostile wrapper, nested predecessor, and stored revision state without executing getters", async () => {
    const { value } = await predecessor(); const result = createDecisionContextObservationRevisionCreation(input(value)); let calls = 0;
    const wrapper = {} as Hostile; Object.defineProperty(wrapper, "decisionContextObservationContextValidationAssembly", { enumerable: true, get: () => { calls += 1; return value; } });
    const hostilePredecessor = structuredClone(value) as unknown as Hostile; Object.defineProperty((hostilePredecessor.decisionContextObservationContextTransition as { context: Hostile }).context, "items", { enumerable: true, configurable: true, get: () => { calls += 1; return value.decisionContextObservationContextTransition.context.items; } });
    const hostileStored = structuredClone(result) as unknown as Hostile; Object.defineProperty((hostileStored.revision as { context: Hostile }).context, "items", { enumerable: true, configurable: true, get: () => { calls += 1; return result.revision.context.items; } });
    expect(() => createDecisionContextObservationRevisionCreation(wrapper as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INPUT_INVALID"); expect(() => createDecisionContextObservationRevisionCreation(input(hostilePredecessor as never))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_VALIDATION_ASSEMBLY_INVALID"); expect(() => assertDecisionContextObservationRevisionCreation(hostileStored)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INVALID"); expect(calls).toBe(0);
  });

  it("self-contained stored assertion reconstructs the exact child revision, rejects complete-state divergence before stale outer ID, and does no parent lookup", async () => {
    const { value, base } = await predecessor(); const result = createDecisionContextObservationRevisionCreation(input(value)); assertDecisionContextObservationRevisionCreation(structuredClone(result)); expect(result.revision).toEqual(expectedRevision(value, base));
    const stale = structuredClone(result); stale.decisionContextObservationRevisionCreationId = "DCORC_000000000000000000000000"; expect(() => assertDecisionContextObservationRevisionCreation(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_ID_MISMATCH");
    const variants = [structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale)];
    variants[0].revision.previousRevisionId = "DREV_000000000000000000000000"; variants[1].revision.context.items[0].statement = "wrong Context"; (variants[2].revision.validationInput.expectationValidations as unknown as unknown[]).push({}); variants[3].revision.validationAssembly.consequenceIds.push("DCONS_000000000000000000000000"); variants[4].revision.context.sourceStateReferences.push({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "changed" });
    expect(variants[4].revision.revisionId).toBe(result.revision.revisionId);
    for (const variant of variants) expect(() => assertDecisionContextObservationRevisionCreation(variant)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INVALID");
  });

  it("commits complete predecessor and revision state with deterministic canonical DCORC identity", async () => {
    const { value } = await predecessor(); const result = createDecisionContextObservationRevisionCreation(input(value)); const reordered = createDecisionContextObservationRevisionCreation(reorder(input(value)) as never);
    expect(reordered.decisionContextObservationRevisionCreationId).toBe(result.decisionContextObservationRevisionCreationId);
    const alteredPredecessor = structuredClone(value); alteredPredecessor.validationAssembly.consequenceIds.push("DCONS_000000000000000000000000"); expect(creationId(alteredPredecessor, result.revision)).not.toBe(result.decisionContextObservationRevisionCreationId);
    const alteredRevision = structuredClone(result.revision); alteredRevision.context.sourceStateReferences.push({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "different" }); expect(creationId(value, alteredRevision)).not.toBe(result.decisionContextObservationRevisionCreationId);
  });

  it("exposes only the exact runtime and four owned errors and contains no persistence, repository, lineage, authority, model, provider, Career, Feedback, Learning, temporal, or random semantics", () => {
    expect(Object.keys(creationModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION", "assertDecisionContextObservationRevisionCreation", "createDecisionContextObservationRevisionCreation"]); expect(Object.keys(decisionCore).filter((key) => Object.keys(creationModule).includes(key)).sort()).toEqual(Object.keys(creationModule).sort());
    const source = files(resolve(process.cwd(), "lib/decision-core/context-observation-revision-creation")).map((file) => readFileSync(file, "utf8")).join("\n"); expect(source).not.toMatch(/buildDecisionContextRevisionId|createBoundDecisionContextRevisionPersister|DecisionContextRevisionRepository|InMemoryDecisionContextRevisionRepository|PostgresDecisionContextRevisionRepository|createBoundDecisionContextRevisionLineageReconstructor|revision-persistence|revision-lineage|repository writer|authority resolver|authority reader|assessment|provider|model|evaluator|career|capability-core|Date\.now|new Date|Math\.random|UUID|Feedback|Learning|currentRevision|headRevision|latestRevision/i); expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_VALIDATION_ASSEMBLY_INVALID"]);
  });
});
