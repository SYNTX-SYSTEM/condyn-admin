import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as readinessModule from "../../../lib/decision-core/context-observation-materialization-readiness";
import * as decisionCore from "../../../lib/decision-core";
import { buildDecisionContextItemId } from "../../../lib/decision-core/context/identity";
import {
  assembleDecisionContextValidation,
  assertDecisionContextObservationMaterializationReadiness,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createBoundDecisionContextObservationTargetRevisionBinder,
  createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationItemProjection,
  createDecisionContextObservationMaterializationReadiness,
  createDecisionContextObservationProposal,
  createDecisionContextObservationTargetDeclaration,
  createDecisionContextRevision,
  createOutcomeAttributionProposal,
  createStateChangeClaim,
  type DecisionContextItemInput,
  type DecisionContextObservationMaterializationReadiness,
  type DecisionContextObservationTargetRevisionBinding,
  type DecisionContextRevision
} from "../../../lib/decision-core";

type SourceReference = { producerId: string; authorityContractId: string; artifactId: string; locator: string };
type ObservationProvenance = Parameters<typeof createDecisionContextObservationProposal>[0]["provenance"];
type HostileRecord = Record<PropertyKey, unknown>;

const sourceReference: SourceReference = { producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" };
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])])) : value;
const readinessId = (binding: unknown, candidateItemId: string): string => `DCOMR_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_V1", canonical(binding), candidateItemId]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action reporter" }, operationDescription: "operation" });
const stateChange = () => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state reporter" }, stateChangeDescription: "change" });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: "association reporter" } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: "attribution reporter" } });
const observation = (provenance: ObservationProvenance) => createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance });
const projection = (provenance: ObservationProvenance) => createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: observation(provenance), admittedBy: { origin: "HUMAN_INPUT", actorId: "admission actor" }, rationale: "admission rationale" }) });
const projectedItem = (provenance: ObservationProvenance): DecisionContextItemInput => ({ role: "OBSERVATION", statement: "observation statement", provenance });

function revision(sourceStateReferences: SourceReference[] = [], items: DecisionContextItemInput[] = [], suffix = ""): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences, items: [{ role: "DECISION_QUESTION", statement: `Proceed?${suffix}`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } }, ...items] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

async function bindingFor(value: DecisionContextRevision, provenance: ObservationProvenance, rationale = "target rationale"): Promise<DecisionContextObservationTargetRevisionBinding> {
  const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection(provenance), targetRevisionId: value.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target actor" }, rationale });
  return createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async (revisionId) => revisionId === value.revisionId ? value : null }).bind(declaration);
}

const inputFor = (binding: DecisionContextObservationTargetRevisionBinding) => ({ decisionContextObservationTargetRevisionBinding: binding });
const candidateFor = (provenance: ObservationProvenance) => buildDecisionContextItemId("OBSERVATION", "observation statement", provenance);

describe("Decision Context Observation Materialization Readiness", () => {
  it("creates positive structural readiness for detached HUMAN_INPUT and MODEL_PROPOSAL projected observations whose candidates are absent", async () => {
    for (const provenance of [{ origin: "HUMAN_INPUT", actorId: "observation reporter" } as const, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" } as const]) {
      const binding = await bindingFor(revision(), provenance);
      const result = createDecisionContextObservationMaterializationReadiness(inputFor(binding));
      const candidateItemId = candidateFor(provenance);
      expect(result).toEqual({ artifactKind: "DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS", schemaVersion: "DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_V1", decisionContextObservationMaterializationReadinessId: readinessId(binding, candidateItemId), decisionContextObservationTargetRevisionBinding: binding, candidateItemId });
      expect(Object.keys(result).sort()).toEqual(["artifactKind", "candidateItemId", "decisionContextObservationMaterializationReadinessId", "decisionContextObservationTargetRevisionBinding", "schemaVersion"]);
      expect(result.candidateItemId).toBe(candidateItemId);
      expect(result.decisionContextObservationTargetRevisionBinding).toEqual(binding);
    }
  });

  it("requires only AUTHORITATIVE_STATE inventory membership using the existing source-reference identity semantics", async () => {
    const authoritative = { origin: "AUTHORITATIVE_STATE", stateReference: sourceReference } as const;
    const present = await bindingFor(revision([{ ...sourceReference }]), authoritative);
    expect(createDecisionContextObservationMaterializationReadiness(inputFor(present)).candidateItemId).toBe(candidateFor(authoritative));
    const absent = await bindingFor(revision(), authoritative);
    expect(() => createDecisionContextObservationMaterializationReadiness(inputFor(absent))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING");
  });

  it("uses the exact Decision Context candidate identity and rejects an already-present exact item without treating a different DCI as present", async () => {
    const human = { origin: "HUMAN_INPUT", actorId: "observation reporter" } as const;
    const existing = await bindingFor(revision([], [projectedItem(human)]), human);
    expect(() => createDecisionContextObservationMaterializationReadiness(inputFor(existing))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT");
    const different = await bindingFor(revision([], [projectedItem({ origin: "HUMAN_INPUT", actorId: "different reporter" })]), human);
    const result = createDecisionContextObservationMaterializationReadiness(inputFor(different));
    expect(result.candidateItemId).toBe(buildDecisionContextItemId("OBSERVATION", "observation statement", human));
    expect(result.candidateItemId).not.toBe(different.revision.context.items.find((item) => item.role === "OBSERVATION")?.itemId);
  });

  it("creates no readiness artifact on either incremental structural precondition failure and neither mutates the bound base revision nor materializes an item", async () => {
    const authoritative = { origin: "AUTHORITATIVE_STATE", stateReference: sourceReference } as const;
    const missing = await bindingFor(revision(), authoritative);
    const existing = await bindingFor(revision([], [projectedItem({ origin: "HUMAN_INPUT", actorId: "observation reporter" })]), { origin: "HUMAN_INPUT", actorId: "observation reporter" });
    const missingBefore = structuredClone(missing); const existingBefore = structuredClone(existing);
    expect(() => createDecisionContextObservationMaterializationReadiness(inputFor(missing))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING");
    expect(() => createDecisionContextObservationMaterializationReadiness(inputFor(existing))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT");
    expect(missing).toEqual(missingBefore); expect(existing).toEqual(existingBefore);
  });

  it("captures the complete sealed predecessor and returns detached canonical data that caller mutation cannot redirect", async () => {
    const provenance = { origin: "HUMAN_INPUT", actorId: "observation reporter" } as const;
    const binding = await bindingFor(revision(), provenance);
    const result = createDecisionContextObservationMaterializationReadiness(inputFor(binding));
    const capturedId = result.candidateItemId;
    binding.revision.context.items[0].statement = "caller mutation";
    binding.decisionContextObservationTargetDeclaration.declaredBy.actorId = "caller mutation";
    expect(result.candidateItemId).toBe(capturedId);
    expect(result.decisionContextObservationTargetRevisionBinding.revision.context.items[0].statement).toBe("Proceed?");
    expect(result.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.declaredBy.actorId).toBe("target actor");
    result.decisionContextObservationTargetRevisionBinding.revision.context.items[0].statement = "result mutation";
    expect(binding.revision.context.items[0].statement).toBe("caller mutation");
  });

  it("rejects hostile input and nested binding representations without executing getters", async () => {
    const binding = await bindingFor(revision(), { origin: "HUMAN_INPUT", actorId: "observation reporter" }); let getterCalls = 0;
    const wrapper = {} as HostileRecord;
    Object.defineProperty(wrapper, "decisionContextObservationTargetRevisionBinding", { enumerable: true, get: () => { getterCalls += 1; return binding; } });
    const nested = structuredClone(binding) as unknown as HostileRecord;
    Object.defineProperty(((nested.revision as DecisionContextRevision).context as unknown as HostileRecord), "items", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return binding.revision.context.items; } });
    expect(() => createDecisionContextObservationMaterializationReadiness(wrapper as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INPUT_INVALID");
    expect(() => createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: nested as never })).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_BINDING_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("asserts stored readiness self-contained, treats stale candidate and failed readiness preconditions as body invalidity, and prioritizes body invalidity over ID mismatch", async () => {
    const human = { origin: "HUMAN_INPUT", actorId: "observation reporter" } as const;
    const ready = createDecisionContextObservationMaterializationReadiness(inputFor(await bindingFor(revision(), human)));
    assertDecisionContextObservationMaterializationReadiness(structuredClone(ready));
    const staleId = structuredClone(ready); staleId.decisionContextObservationMaterializationReadinessId = "DCOMR_000000000000000000000000";
    expect(() => assertDecisionContextObservationMaterializationReadiness(staleId)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ID_MISMATCH");
    const staleCandidate = structuredClone(staleId); staleCandidate.candidateItemId = "DCI_000000000000000000000000";
    expect(() => assertDecisionContextObservationMaterializationReadiness(staleCandidate)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INVALID");
    const authoritative = { origin: "AUTHORITATIVE_STATE", stateReference: sourceReference } as const;
    const absentBinding = await bindingFor(revision(), authoritative);
    const absentBody = structuredClone(staleId); absentBody.decisionContextObservationTargetRevisionBinding = absentBinding; absentBody.candidateItemId = candidateFor(authoritative);
    expect(() => assertDecisionContextObservationMaterializationReadiness(absentBody)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INVALID");
    const existingBinding = await bindingFor(revision([], [projectedItem(human)]), human);
    const existingBody = structuredClone(staleId); existingBody.decisionContextObservationTargetRevisionBinding = existingBinding; existingBody.candidateItemId = candidateFor(human);
    expect(() => assertDecisionContextObservationMaterializationReadiness(existingBody)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INVALID");
  });

  it("has deterministic complete-binding identity independent of insertion order and does not reduce readiness to the DCOTRB string", async () => {
    const provenance = { origin: "HUMAN_INPUT", actorId: "observation reporter" } as const;
    const value = revision(); const leftBinding = await bindingFor(value, provenance, "first rationale"); const rightBinding = await bindingFor(value, provenance, "second rationale");
    const left = createDecisionContextObservationMaterializationReadiness(inputFor(leftBinding));
    const reordered = createDecisionContextObservationMaterializationReadiness(reorder(inputFor(leftBinding)) as never);
    const right = createDecisionContextObservationMaterializationReadiness(inputFor(rightBinding));
    expect(reordered.decisionContextObservationMaterializationReadinessId).toBe(left.decisionContextObservationMaterializationReadinessId);
    expect(right.candidateItemId).toBe(left.candidateItemId);
    expect(rightBinding.decisionContextObservationTargetRevisionBindingId).not.toBe(leftBinding.decisionContextObservationTargetRevisionBindingId);
    expect(right.decisionContextObservationMaterializationReadinessId).not.toBe(left.decisionContextObservationMaterializationReadinessId);
  });

  it("is self-contained with zero read, resolver, payload, truth, support, Context-construction, revision-construction, or persistence operations and exposes only the exact six-code public surface", () => {
    expect(Object.keys(readinessModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SCHEMA_VERSION", "assertDecisionContextObservationMaterializationReadiness", "createDecisionContextObservationMaterializationReadiness"]);
    expect(Object.keys(decisionCore).filter((key) => Object.keys(readinessModule).includes(key)).sort()).toEqual(Object.keys(readinessModule).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-materialization-readiness")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/createDecisionContextDraft|assertDecisionContextDraft|createDecisionContextRevision|assertDecisionContextRevision|revision-persistence|revision-lineage|persister|repository writer|authority resolver|authority reader|validation|assessment|provider|model|evaluator|career|capability-core|Date\.now|new Date|Math\.random|UUID|currentRevision|headRevision|latestRevision|materializedItem|futureContext|futureRevision|sourcePayload|resolution|truth|support/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_BINDING_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT", "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING"]);
  });
});
