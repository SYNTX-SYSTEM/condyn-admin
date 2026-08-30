import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as persistenceModule from "../../../lib/decision-core/context-observation-revision-persistence";
import * as decisionCore from "../../../lib/decision-core";
import { createBoundDecisionContextRevisionPersister } from "../../../lib/decision-core/revision-persistence/persister";
import {
  assembleDecisionContextValidation, assertDecisionContextObservationRevisionPersistence, createActionOccurrenceClaim, createActionStateChangeAssociationProposal,
  createBoundDecisionContextObservationTargetRevisionBinder, createBoundDecisionContextObservationRevisionPersister, createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration, createDecisionContextObservationContextTransition, createDecisionContextObservationContextValidationAssembly,
  createDecisionContextObservationItemMaterialization, createDecisionContextObservationItemProjection, createDecisionContextObservationMaterializationReadiness,
  createDecisionContextObservationProposal, createDecisionContextObservationRevisionCreation, createDecisionContextObservationTargetDeclaration,
  createDecisionContextRevision, createOutcomeAttributionProposal, createStateChangeClaim, createStructuralExpectation, InMemoryDecisionContextRevisionRepository,
  reconstructStructuralGap, type BoundDecisionContextRevisionPersister, type DecisionContextObservationRevisionCreation, type DecisionContextRevision, type DecisionContextValidationAssemblyInput
} from "../../../lib/decision-core";

type Hostile = Record<PropertyKey, unknown>;
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])])) : value;
const persistenceId = (creation: unknown, revision: unknown) => `DCORP_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_V1", canonical(creation), canonical(revision)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;
const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action" }, operationDescription: "operation" });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state" }, stateChangeDescription: "change" }), provenance: { origin: "HUMAN_INPUT", actorId: "association" } }), provenance: { origin: "HUMAN_INPUT", actorId: "attribution" } });

async function fixture(): Promise<{ creation: DecisionContextObservationRevisionCreation; base: DecisionContextRevision }> {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [{ role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }, { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }] });
  const expectation = createStructuralExpectation(context, { kind: "CONTEXT_ROLE", role: "OBSERVATION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } }); const gap = reconstructStructuralGap(context, expectation, { kind: "CONTEXT_ROLE" }); if (gap === null) throw new Error("gap missing");
  const oldInput = { expectationValidations: [{ expectation, basis: { kind: "CONTEXT_ROLE" as const }, result: gap }], consequenceValidations: [] }; const base = createDecisionContextRevision({ previousRevisionId: null, context, validationInput: oldInput, validationAssembly: assembleDecisionContextValidation(context, oldInput) });
  const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation", provenance: { origin: "HUMAN_INPUT", actorId: "observation" } }); const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: "admission" }, rationale: "rationale" }); const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission }); const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: base.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target" }, rationale: "rationale" });
  const binding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => base }).bind(declaration); const readiness = createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding }); const materialization = createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: readiness }); const transition = createDecisionContextObservationContextTransition({ decisionContextObservationItemMaterialization: materialization }); const assembly = createDecisionContextObservationContextValidationAssembly({ decisionContextObservationContextTransition: transition, validationInput: emptyInput() });
  return { creation: createDecisionContextObservationRevisionCreation({ decisionContextObservationContextValidationAssembly: assembly }), base };
}
const input = (creation: DecisionContextObservationRevisionCreation) => ({ decisionContextObservationRevisionCreation: creation });

describe("Decision Context Observation Revision Persistence", () => {
  it("uses one bound conforming persister for exact parent integrity, immutable write, exact reread, and idempotent replay", async () => {
    const { creation, base } = await fixture(); const repository = new InMemoryDecisionContextRevisionRepository(); const bound = createBoundDecisionContextObservationRevisionPersister(repository.createDecisionContextRevisionPersister());
    await expect(bound.persist(input(creation))).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND"); expect(await repository.getRevisionById(creation.revision.revisionId)).toBeNull();
    await repository.createDecisionContextRevisionPersister().persist(base); const result = await bound.persist(input(creation)); const replay = await bound.persist(input(creation));
    expect(result.persistedRevision).toEqual(creation.revision); expect(replay.persistedRevision).toEqual(creation.revision); expect(await repository.getRevisionById(creation.revision.revisionId)).toEqual(creation.revision); expect(result.decisionContextObservationRevisionPersistenceId).toBe(persistenceId(creation, creation.revision));
  });

  it("submits exactly one detached child revision, captures persist once, and does not reinterpret a structural test double as repository authority", async () => {
    const { creation } = await fixture(); let calls = 0; let submitted: DecisionContextRevision | undefined; const dependency: BoundDecisionContextRevisionPersister = { persist: async (revision) => { calls += 1; submitted = structuredClone(revision); await Promise.resolve(); return structuredClone(revision); } }; const bound = createBoundDecisionContextObservationRevisionPersister(dependency);
    dependency.persist = async () => { throw new Error("replacement"); }; const result = await bound.persist(input(creation));
    expect(calls).toBe(1); expect(submitted).toEqual(creation.revision); expect(result.persistedRevision).toEqual(creation.revision); creation.revision.context.items[0].statement = "caller mutation"; expect(result.decisionContextObservationRevisionCreation.revision.context.items[0].statement).not.toBe("caller mutation");
  });

  it("propagates underlying persistence errors unchanged and rejects malformed or same-DREV divergent returned state", async () => {
    const { creation } = await fixture(); const error = new Error("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT"); const failing = createBoundDecisionContextObservationRevisionPersister({ persist: async () => { throw error; } }); await expect(failing.persist(input(creation))).rejects.toBe(error);
    const divergent = structuredClone(creation.revision); divergent.context.items[0].statement = "divergent"; const bad = createBoundDecisionContextObservationRevisionPersister({ persist: async () => divergent }); await expect(bad.persist(input(creation))).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID"); const malformed = createBoundDecisionContextObservationRevisionPersister({ persist: async () => ({}) as never }); await expect(malformed.persist(input(creation))).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID");
  });

  it("derives immutable conflict from an occupied divergent same-DREV repository slot through the sealed persistence machinery", async () => {
    const { creation, base } = await fixture(); const divergent = structuredClone(creation.revision); divergent.context.items[0].statement = "occupied divergent payload"; const revisions = new Map<string, unknown>([[base.revisionId, base], [creation.revision.revisionId, divergent]]); let parentReads = 0; let writes = 0;
    const existing = createBoundDecisionContextRevisionPersister({
      getRevisionById: async (revisionId) => { if (revisionId === base.revisionId) parentReads += 1; return (revisions.get(revisionId) ?? null) as DecisionContextRevision | null; },
      writeRevision: async (revision) => { writes += 1; const stored = revisions.get(revision.revisionId); if (stored !== undefined && JSON.stringify(stored) !== JSON.stringify(revision)) throw new Error("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT"); revisions.set(revision.revisionId, structuredClone(revision)); }
    }); const bound = createBoundDecisionContextObservationRevisionPersister(existing);
    await expect(bound.persist(input(creation))).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT"); expect(parentReads).toBe(1); expect(writes).toBe(1); expect(revisions.get(creation.revision.revisionId)).toEqual(divergent);
  });

  it("propagates malformed immediate-parent detection from the sealed persistence contract without a child write", async () => {
    const { creation } = await fixture(); let writes = 0; const existing = createBoundDecisionContextRevisionPersister({ getRevisionById: async () => ({}) as never, writeRevision: async () => { writes += 1; } }); const bound = createBoundDecisionContextObservationRevisionPersister(existing);
    await expect(bound.persist(input(creation))).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID"); expect(writes).toBe(0);
  });

  it("keeps submitted revision and retained predecessor at their pre-mutation state while persistence is suspended", async () => {
    const { creation } = await fixture(); const baseline = structuredClone(creation); let submitted: DecisionContextRevision | undefined; let enteredResolve!: () => void; let release!: () => void; const entered = new Promise<void>((resolve) => { enteredResolve = resolve; }); const suspended = new Promise<void>((resolve) => { release = resolve; });
    const bound = createBoundDecisionContextObservationRevisionPersister({ persist: async (revision) => { submitted = structuredClone(revision); enteredResolve(); await suspended; return structuredClone(revision); } }); const pending = bound.persist(input(creation)); await entered;
    creation.revision.context.items[0].statement = "mutated while pending"; creation.decisionContextObservationContextValidationAssembly.validationInput.expectationValidations = [];
    expect(submitted).toEqual(baseline.revision); release(); const result = await pending; expect(result.decisionContextObservationRevisionCreation).toEqual(baseline); expect(result.persistedRevision).toEqual(baseline.revision);
  });

  it("rejects hostile persister, input, predecessor, and returned state without getter execution", async () => {
    const { creation } = await fixture(); let calls = 0; const hostile = {} as Hostile; Object.defineProperty(hostile, "persist", { enumerable: true, get: () => { calls += 1; return async () => creation.revision; } }); expect(() => createBoundDecisionContextObservationRevisionPersister(hostile as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID");
    const bound = createBoundDecisionContextObservationRevisionPersister({ persist: async () => creation.revision }); const wrapper = {} as Hostile; Object.defineProperty(wrapper, "decisionContextObservationRevisionCreation", { enumerable: true, get: () => { calls += 1; return creation; } }); const nested = structuredClone(creation) as unknown as Hostile; Object.defineProperty(((nested.revision as { context: Hostile }).context), "items", { enumerable: true, configurable: true, get: () => { calls += 1; return creation.revision.context.items; } });
    await expect(bound.persist(wrapper as never)).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INPUT_INVALID"); await expect(bound.persist(input(nested as never))).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_REVISION_CREATION_INVALID"); const returned = structuredClone(creation.revision) as unknown as Hostile; Object.defineProperty(returned, "context", { enumerable: true, configurable: true, get: () => { calls += 1; return creation.revision.context; } }); const hostileReturn = createBoundDecisionContextObservationRevisionPersister({ persist: async () => returned as never }); await expect(hostileReturn.persist(input(creation))).rejects.toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID"); expect(calls).toBe(0);
  });

  it("asserts a stored artifact without live persistence and rejects complete-state divergence before stale DCORP ID", async () => {
    const { creation } = await fixture(); let calls = 0; const bound = createBoundDecisionContextObservationRevisionPersister({ persist: async (revision) => { calls += 1; return structuredClone(revision); } }); const result = await bound.persist(input(creation)); assertDecisionContextObservationRevisionPersistence(structuredClone(result)); expect(calls).toBe(1);
    const stale = structuredClone(result); stale.decisionContextObservationRevisionPersistenceId = "DCORP_000000000000000000000000"; expect(() => assertDecisionContextObservationRevisionPersistence(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_ID_MISMATCH"); const variants = [structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale)]; variants[0].persistedRevision.previousRevisionId = "DREV_000000000000000000000000"; variants[1].persistedRevision.context.items[0].statement = "wrong"; (variants[2].persistedRevision.validationInput.expectationValidations as unknown as unknown[]).push({}); variants[3].persistedRevision.validationAssembly.consequenceIds.push("DCONS_000000000000000000000000"); for (const variant of variants) expect(() => assertDecisionContextObservationRevisionPersistence(variant)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INVALID"); expect(calls).toBe(1); const reordered = await bound.persist(reorder(input(result.decisionContextObservationRevisionCreation)) as never); expect(reordered.decisionContextObservationRevisionPersistenceId).toBe(result.decisionContextObservationRevisionPersistenceId);
  });

  it("exposes only the exact runtime and six owned errors with no direct repository, revision construction, lineage, adapter, temporal, or random semantics", () => {
    expect(Object.keys(persistenceModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION", "assertDecisionContextObservationRevisionPersistence", "createBoundDecisionContextObservationRevisionPersister"]); expect(Object.keys(decisionCore).filter((key) => Object.keys(persistenceModule).includes(key)).sort()).toEqual(Object.keys(persistenceModule).sort()); const source = files(resolve(process.cwd(), "lib/decision-core/context-observation-revision-persistence")).map((file) => readFileSync(file, "utf8")).join("\n"); expect(source).not.toMatch(/createBoundDecisionContextRevisionPersister|DecisionContextRevisionRepository|InMemoryDecisionContextRevisionRepository|PostgresDecisionContextRevisionRepository|getRevisionById|writeRevision|createDecisionContextRevision|buildDecisionContextRevisionId|createBoundDecisionContextRevisionLineageReconstructor|revision-lineage|decision-adapters|postgres|drizzle|database|assessment|provider|model|evaluator|career|capability-core|Date\.now|new Date|Math\.random|UUID|Feedback|Learning|current|head|latest/i); expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_REVISION_CREATION_INVALID"]);
  });
});
