import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as bindingModule from "../../../lib/decision-core/context-observation-target-revision-binding";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionContextObservationTargetRevisionBinding,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createBoundDecisionContextObservationTargetRevisionBinder,
  createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationItemProjection,
  createDecisionContextObservationProposal,
  createDecisionContextObservationTargetDeclaration,
  createDecisionContextRevision,
  createStructuralExpectation,
  createOutcomeAttributionProposal,
  reconstructStructuralGap,
  createStateChangeClaim,
  type DecisionContextObservationTargetDeclaration,
  type DecisionContextRevision
} from "../../../lib/decision-core";

type HostileRecord = Record<PropertyKey, unknown>;
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])])) : value;
const bindingId = (declaration: unknown, revision: unknown): string => `DCOTRB_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_V1", canonical(declaration), canonical(revision)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action reporter" }, operationDescription: "operation" });
const stateChange = () => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state reporter" }, stateChangeDescription: "change" });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: "association reporter" } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: "attribution reporter" } });
const observation = (provenance: Parameters<typeof createDecisionContextObservationProposal>[0]["provenance"] = { origin: "HUMAN_INPUT", actorId: "observation reporter" }) => createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance });
const projection = (provenance?: Parameters<typeof observation>[0]) => createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: observation(provenance), admittedBy: { origin: "HUMAN_INPUT", actorId: "admission actor" }, rationale: "admission rationale" }) });

function revision(suffix = "", sourceStateReferences: Array<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }> = []): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences, items: [{ role: "DECISION_QUESTION", statement: `Proceed?${suffix}`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } }] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

function declarationFor(value: DecisionContextRevision, provenance?: Parameters<typeof observation>[0]): DecisionContextObservationTargetDeclaration {
  return createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection(provenance), targetRevisionId: value.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target actor" }, rationale: "target rationale" });
}

function revisionWithSameDrevButDifferentRepresentedState(rationale: string): DecisionContextRevision {
  const sourceReference = { producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" };
  const context = createDecisionContextDraft({ sourceStateReferences: [sourceReference], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Objective.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ] });
  const objective = context.items.find((item) => item.role === "OBJECTIVE"); if (objective === undefined) throw new Error("missing objective");
  const expectation = createStructuralExpectation(context, { kind: "EVIDENCE_BINDING", subjectItemId: objective.itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "human" } });
  const identity = `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", context.contextId, objective.itemId, [sourceReference.producerId, sourceReference.authorityContractId, sourceReference.artifactId, sourceReference.locator], "NOT_SUPPORTED"]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
  const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [{ bindingId: identity, contextId: context.contextId, itemId: objective.itemId, stateReference: sourceReference, disposition: "NOT_SUPPORTED" as const, rationale }] };
  const gap = reconstructStructuralGap(context, expectation, basis); if (gap === null) throw new Error("missing gap");
  const validationInput = { expectationValidations: [{ expectation, basis, result: gap }], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

describe("Decision Context Observation Target Revision Binding", () => {
  it("binds one sealed declaration to one exact sealed returned revision with a complete deterministic five-field artifact", async () => {
    const value = revision(); const declaration = declarationFor(value); const reads: string[] = [];
    const result = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async (revisionId) => { reads.push(revisionId); return value; } }).bind(declaration);
    expect(reads).toEqual([declaration.targetRevisionId]);
    expect(result).toEqual({ artifactKind: "DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING", schemaVersion: "DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_V1", decisionContextObservationTargetRevisionBindingId: bindingId(declaration, value), decisionContextObservationTargetDeclaration: declaration, revision: value });
    expect(Object.keys(result).sort()).toEqual(["artifactKind", "decisionContextObservationTargetDeclaration", "decisionContextObservationTargetRevisionBindingId", "revision", "schemaVersion"]);
    assertDecisionContextObservationTargetRevisionBinding(result);
  });

  it("validates and captures the complete declaration before exactly one reader call", async () => {
    const value = revision(); const malformed = { ...declarationFor(value), decisionContextObservationTargetDeclarationId: "DCOTD_000000000000000000000000" }; let reads = 0;
    const bound = createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => { reads += 1; return value; } });
    await expect(bound.bind(malformed)).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_DECLARATION_INVALID"); expect(reads).toBe(0);
    const declaration = declarationFor(value); let release: ((value: DecisionContextRevision) => void) | undefined; const requested: string[] = [];
    const pending = createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async (id) => { requested.push(id); return new Promise((resolve) => { release = resolve; }); } }).bind(declaration);
    declaration.targetRevisionId = "DREV_FEDCBA9876543210FEDCBA98"; release?.(value);
    expect((await pending).decisionContextObservationTargetDeclaration.targetRevisionId).toBe(value.revisionId); expect(requested).toEqual([value.revisionId]);
  });

  it("maps null, malformed, and wrong-ID returned states exactly while preserving operational reader errors", async () => {
    const value = revision(); const declaration = declarationFor(value);
    await expect(createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => null }).bind(declaration)).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_NOT_FOUND");
    await expect(createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => ({ revisionId: value.revisionId }) as never }).bind(declaration)).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_INVALID");
    await expect(createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => revision("other") }).bind(declaration)).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_INVALID");
    const operational = new Error("reader unavailable"); await expect(createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => { throw operational; } }).bind(declaration)).rejects.toBe(operational);
  });

  it("captures the reader method at construction and rejects hostile reader composition without getter execution", async () => {
    const value = revision(); const declaration = declarationFor(value); const reader = { getRevisionById: async (): Promise<DecisionContextRevision | null> => value };
    const captured = createBoundDecisionContextObservationTargetRevisionBinder(reader); reader.getRevisionById = async (): Promise<DecisionContextRevision | null> => null;
    await expect(captured.bind(declaration)).resolves.toBeDefined();
    let getterCalls = 0; const accessor = {};
    Object.defineProperty(accessor, "getRevisionById", { enumerable: true, get: () => { getterCalls += 1; return async () => value; } });
    const hidden = { getRevisionById: async () => value }; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    const symbol = { getRevisionById: async () => value }; Object.defineProperty(symbol, Symbol("hostile"), { enumerable: true, value: true });
    for (const invalid of [accessor, hidden, symbol, { getRevisionById: async () => value, extra: true }, { getRevisionById: "not-a-function" }, null, [], 1]) expect(() => createBoundDecisionContextObservationTargetRevisionBinder(invalid as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_READER_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("captures returned state, returns detached data, and makes stored assertion self-contained", async () => {
    const value = revision(); const declaration = declarationFor(value); let reads = 0;
    const result = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => { reads += 1; return value; } }).bind(declaration);
    assertDecisionContextObservationTargetRevisionBinding(structuredClone(result)); expect(reads).toBe(1);
    const statement = result.revision.context.items[0].statement; value.context.items[0].statement = "changed after read"; declaration.declaredBy.actorId = "changed later";
    expect(result.revision.context.items[0].statement).toBe(statement); expect(result.decisionContextObservationTargetDeclaration.declaredBy.actorId).toBe("target actor");
    result.revision.context.items[0].statement = "caller mutation"; expect(value.context.items[0].statement).toBe("changed after read");
  });

  it("asserts stored complete state with body invalidity precedence and rejects hostile nested representations without getter execution", async () => {
    const value = revision(); const result = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => value }).bind(declarationFor(value));
    const stale = structuredClone(result); stale.decisionContextObservationTargetRevisionBindingId = "DCOTRB_000000000000000000000000";
    expect(() => assertDecisionContextObservationTargetRevisionBinding(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_ID_MISMATCH");
    const bodyInvalid = structuredClone(stale); bodyInvalid.revision.context.items[0].statement = "tampered";
    expect(() => assertDecisionContextObservationTargetRevisionBinding(bodyInvalid)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_INVALID");
    let getterCalls = 0;
    const outer = structuredClone(result) as unknown as HostileRecord; Object.defineProperty(outer, "revision", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return value; } });
    const nestedDeclaration = structuredClone(result) as unknown as HostileRecord; Object.defineProperty((nestedDeclaration.decisionContextObservationTargetDeclaration as HostileRecord).declaredBy as HostileRecord, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "target actor"; } });
    const nestedRevision = structuredClone(result) as unknown as HostileRecord; Object.defineProperty(((nestedRevision.revision as DecisionContextRevision).context as unknown as HostileRecord), "items", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return value.context.items; } });
    for (const hostile of [outer, nestedDeclaration, nestedRevision]) expect(() => assertDecisionContextObservationTargetRevisionBinding(hostile)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("commits canonical complete declaration and revision state, including non-identity-bearing represented revision state", async () => {
    const value = revision(); const declaration = declarationFor(value); const reorderedDeclaration = reorder(declaration) as DecisionContextObservationTargetDeclaration; const reorderedRevision = reorder(value) as DecisionContextRevision;
    const left = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => value }).bind(declaration);
    const right = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => reorderedRevision }).bind(reorderedDeclaration);
    expect(right.decisionContextObservationTargetRevisionBindingId).toBe(left.decisionContextObservationTargetRevisionBindingId);
    const changedDeclaration = declarationFor(value, { origin: "MODEL_PROPOSAL", proposalRef: "different complete declaration state" });
    const changed = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => value }).bind(changedDeclaration);
    expect(changed.decisionContextObservationTargetRevisionBindingId).not.toBe(left.decisionContextObservationTargetRevisionBindingId);
    const firstRepresented = revisionWithSameDrevButDifferentRepresentedState("first rationale"); const secondRepresented = revisionWithSameDrevButDifferentRepresentedState("second rationale");
    expect(secondRepresented.revisionId).toBe(firstRepresented.revisionId); expect(secondRepresented).not.toEqual(firstRepresented);
    const representedDeclaration = declarationFor(firstRepresented);
    const firstBinding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => firstRepresented }).bind(representedDeclaration);
    const secondBinding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => secondRepresented }).bind(representedDeclaration);
    expect(secondBinding.decisionContextObservationTargetRevisionBindingId).not.toBe(firstBinding.decisionContextObservationTargetRevisionBindingId);
  });

  it("does not require AUTHORITATIVE_STATE projected provenance to be present in the bound revision source-state inventory", async () => {
    const value = revision(); const declaration = declarationFor(value, { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "artifact", locator: "locator" } });
    const result = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => value }).bind(declaration);
    expect(result.revision.context.sourceStateReferences).toEqual([]); expect(result.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.projectedItemInput.provenance.origin).toBe("AUTHORITATIVE_STATE");
  });

  it("exposes only the narrow runtime surface and excludes traversal, materialization, persistence, temporal, and unrelated semantics", () => {
    expect(Object.keys(bindingModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION", "assertDecisionContextObservationTargetRevisionBinding", "createBoundDecisionContextObservationTargetRevisionBinder"]);
    expect(Object.keys(decisionCore).filter((key) => Object.keys(bindingModule).includes(key)).sort()).toEqual(Object.keys(bindingModule).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-target-revision-binding")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/createDecisionContextDraft|createDecisionContextRevision|revision-lineage|revision-persistence|persister|assessment-request|assessment-basis|career|capability-core|provider|model|evaluator|previousRevisionId|Date\.now|new Date|Math\.random|UUID|current|head|latest|active|selected|preferred|canonical branch|revision rank|revision number|time|materiali[sz]|context mutation|revision mutation|revision creation/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_DECLARATION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_READER_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_NOT_FOUND"]);
  });
});
