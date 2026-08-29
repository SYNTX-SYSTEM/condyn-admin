import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as materializationModule from "../../../lib/decision-core/context-observation-item-materialization";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionContextObservationItemMaterialization,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createBoundDecisionContextObservationTargetRevisionBinder,
  createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationItemMaterialization,
  createDecisionContextObservationItemProjection,
  createDecisionContextObservationMaterializationReadiness,
  createDecisionContextObservationProposal,
  createDecisionContextObservationTargetDeclaration,
  createDecisionContextRevision,
  createOutcomeAttributionProposal,
  createStateChangeClaim,
  type DecisionContextItem,
  type DecisionContextObservationItemMaterialization,
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
const materializationId = (readiness: unknown, item: unknown): string => `DCOIM_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_V1", canonical(readiness), canonical(item)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action reporter" }, operationDescription: "operation" });
const stateChange = () => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state reporter" }, stateChangeDescription: "change" });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: "association reporter" } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: "attribution reporter" } });
const observation = (provenance: ObservationProvenance) => createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance });
const projection = (provenance: ObservationProvenance) => createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: observation(provenance), admittedBy: { origin: "HUMAN_INPUT", actorId: "admission actor" }, rationale: "admission rationale" }) });

function revision(sourceStateReferences: SourceReference[] = [], suffix = ""): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences, items: [{ role: "DECISION_QUESTION", statement: `Proceed?${suffix}`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } }] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

async function readinessFor(provenance: ObservationProvenance, rationale = "target rationale"): Promise<DecisionContextObservationMaterializationReadiness> {
  const value = revision(provenance.origin === "AUTHORITATIVE_STATE" ? [sourceReference] : []);
  const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection(provenance), targetRevisionId: value.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target actor" }, rationale });
  const binding: DecisionContextObservationTargetRevisionBinding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => value }).bind(declaration);
  return createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding });
}

const inputFor = (readiness: DecisionContextObservationMaterializationReadiness) => ({ decisionContextObservationMaterializationReadiness: readiness });
const expectedItem = (readiness: DecisionContextObservationMaterializationReadiness): DecisionContextItem => {
  const projected = readiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.projectedItemInput;
  return { itemId: readiness.candidateItemId, role: projected.role, statement: projected.statement, provenance: projected.provenance };
};

describe("Decision Context Observation Item Materialization", () => {
  it("materializes exactly one standalone OBSERVATION item from one sealed readiness and preserves HUMAN_INPUT, MODEL_PROPOSAL, and AUTHORITATIVE_STATE provenance", async () => {
    for (const provenance of [{ origin: "HUMAN_INPUT", actorId: "observation reporter" } as const, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" } as const, { origin: "AUTHORITATIVE_STATE", stateReference: sourceReference } as const]) {
      const readiness = await readinessFor(provenance); const item = expectedItem(readiness);
      const result = createDecisionContextObservationItemMaterialization(inputFor(readiness));
      expect(result).toEqual({ artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION", schemaVersion: "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_V1", decisionContextObservationItemMaterializationId: materializationId(readiness, item), decisionContextObservationMaterializationReadiness: readiness, item });
      expect(Object.keys(result).sort()).toEqual(["artifactKind", "decisionContextObservationItemMaterializationId", "decisionContextObservationMaterializationReadiness", "item", "schemaVersion"]);
      expect(Object.keys(result.item).sort()).toEqual(["itemId", "provenance", "role", "statement"]);
      expect(result.item.itemId).toBe(readiness.candidateItemId); expect(result.item.role).toBe("OBSERVATION"); expect(result.item.statement).toBe("observation statement"); expect(result.item.provenance).toEqual(provenance); expect(result.item.provenance.origin).not.toBe("DETERMINISTIC_DERIVATION");
    }
  });

  it("accepts no independent item input and creates neither Context membership nor mutation, revision, source-inventory, or persistence state", async () => {
    const readiness = await readinessFor({ origin: "HUMAN_INPUT", actorId: "observation reporter" }); const before = structuredClone(readiness);
    expect(() => createDecisionContextObservationItemMaterialization({ ...inputFor(readiness), item: expectedItem(readiness) } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INPUT_INVALID");
    const result = createDecisionContextObservationItemMaterialization(inputFor(readiness));
    expect(result.item).toEqual(expectedItem(readiness)); expect(readiness).toEqual(before);
    expect(readiness.decisionContextObservationTargetRevisionBinding.revision.context.items).toEqual(before.decisionContextObservationTargetRevisionBinding.revision.context.items);
    expect(readiness.decisionContextObservationTargetRevisionBinding.revision.context.sourceStateReferences).toEqual(before.decisionContextObservationTargetRevisionBinding.revision.context.sourceStateReferences);
  });

  it("retains complete sealed readiness and returns detached data that caller or returned-source mutation cannot alter", async () => {
    const readiness = await readinessFor({ origin: "HUMAN_INPUT", actorId: "observation reporter" }); const result = createDecisionContextObservationItemMaterialization(inputFor(readiness));
    readiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.declaredBy.actorId = "caller mutation";
    (readiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.projectedItemInput.provenance as { actorId: string }).actorId = "caller mutation";
    expect(result.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.declaredBy.actorId).toBe("target actor");
    expect(result.item.provenance).toEqual({ origin: "HUMAN_INPUT", actorId: "observation reporter" });
    result.item.statement = "result mutation"; expect(readiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.projectedItemInput.statement).toBe("observation statement");
  });

  it("rejects hostile wrapper, readiness, item, provenance, and state-reference representations without getter execution", async () => {
    const human = await readinessFor({ origin: "HUMAN_INPUT", actorId: "observation reporter" }); const authoritative = await readinessFor({ origin: "AUTHORITATIVE_STATE", stateReference: sourceReference }); const result = createDecisionContextObservationItemMaterialization(inputFor(human)); let getterCalls = 0;
    const wrapper = {} as HostileRecord; Object.defineProperty(wrapper, "decisionContextObservationMaterializationReadiness", { enumerable: true, get: () => { getterCalls += 1; return human; } });
    const hostileReadiness = structuredClone(human) as unknown as HostileRecord; Object.defineProperty((hostileReadiness.decisionContextObservationTargetRevisionBinding as HostileRecord).revision as HostileRecord, "context", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return human.decisionContextObservationTargetRevisionBinding.revision.context; } });
    const hostileItem = structuredClone(result) as unknown as HostileRecord; Object.defineProperty(hostileItem.item as HostileRecord, "statement", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "observation statement"; } });
    const hostileProvenance = structuredClone(result) as unknown as HostileRecord; Object.defineProperty((hostileProvenance.item as DecisionContextItem).provenance as HostileRecord, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "observation reporter"; } });
    const hostileReference = createDecisionContextObservationItemMaterialization(inputFor(authoritative)) as unknown as HostileRecord; Object.defineProperty((((hostileReference.item as DecisionContextItem).provenance as unknown as { stateReference: HostileRecord }).stateReference), "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    expect(() => createDecisionContextObservationItemMaterialization(wrapper as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INPUT_INVALID");
    expect(() => createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: hostileReadiness as never })).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_READINESS_INVALID");
    for (const hostile of [hostileItem, hostileProvenance, hostileReference]) expect(() => assertDecisionContextObservationItemMaterialization(hostile)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("asserts stored materializations self-contained, rejects every item divergence as body invalidity, and gives body invalidity precedence over a stale DCOIM", async () => {
    const result = createDecisionContextObservationItemMaterialization(inputFor(await readinessFor({ origin: "HUMAN_INPUT", actorId: "observation reporter" })));
    assertDecisionContextObservationItemMaterialization(structuredClone(result));
    const stale = structuredClone(result); stale.decisionContextObservationItemMaterializationId = "DCOIM_000000000000000000000000";
    expect(() => assertDecisionContextObservationItemMaterialization(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_ID_MISMATCH");
    const wrongItemId = structuredClone(stale); wrongItemId.item.itemId = "DCI_000000000000000000000000";
    const wrongRole = structuredClone(stale); wrongRole.item.role = "OBJECTIVE";
    const wrongStatement = structuredClone(stale); wrongStatement.item.statement = "changed";
    const wrongProvenance = structuredClone(stale); wrongProvenance.item.provenance = { origin: "MODEL_PROPOSAL", proposalRef: "changed" };
    for (const invalid of [wrongItemId, wrongRole, wrongStatement, wrongProvenance]) expect(() => assertDecisionContextObservationItemMaterialization(invalid)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INVALID");
  });

  it("has deterministic complete readiness-and-item identity independent of insertion order and does not reduce materialization to a DCOMR string", async () => {
    const leftReadiness = await readinessFor({ origin: "HUMAN_INPUT", actorId: "observation reporter" }, "first rationale"); const rightReadiness = await readinessFor({ origin: "HUMAN_INPUT", actorId: "observation reporter" }, "second rationale");
    const left = createDecisionContextObservationItemMaterialization(inputFor(leftReadiness)); const reordered = createDecisionContextObservationItemMaterialization(reorder(inputFor(leftReadiness)) as never); const right = createDecisionContextObservationItemMaterialization(inputFor(rightReadiness));
    expect(reordered.decisionContextObservationItemMaterializationId).toBe(left.decisionContextObservationItemMaterializationId);
    expect(right.item).toEqual(left.item); expect(rightReadiness.decisionContextObservationMaterializationReadinessId).not.toBe(leftReadiness.decisionContextObservationMaterializationReadinessId); expect(right.decisionContextObservationItemMaterializationId).not.toBe(left.decisionContextObservationItemMaterializationId);
    expect(materializationId(leftReadiness, { ...left.item, statement: "different represented item" })).not.toBe(left.decisionContextObservationItemMaterializationId);
  });

  it("performs no reader, authority, Context-construction, membership, revision, persistence, model, provider, Career, Feedback, Learning, temporal, or random operation and exposes only the exact four-code runtime surface", () => {
    expect(Object.keys(materializationModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION", "assertDecisionContextObservationItemMaterialization", "createDecisionContextObservationItemMaterialization"]);
    expect(Object.keys(decisionCore).filter((key) => Object.keys(materializationModule).includes(key)).sort()).toEqual(Object.keys(materializationModule).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-item-materialization")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/createDecisionContextDraft|assertDecisionContextDraft|buildDecisionContextId|createDecisionContextRevision|assertDecisionContextRevision|revision-persistence|revision-lineage|persister|repository writer|authority resolver|authority reader|validation|assessment|provider|model|evaluator|career|capability-core|membership|contextId|previousRevisionId|currentRevision|headRevision|latestRevision|persistence|Feedback|Learning|Date\.now|new Date|Math\.random|UUID/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_READINESS_INVALID"]);
  });
});
