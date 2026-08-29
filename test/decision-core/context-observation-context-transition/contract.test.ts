import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as transitionModule from "../../../lib/decision-core/context-observation-context-transition";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation, assertDecisionContextObservationContextTransition, createActionOccurrenceClaim, createActionStateChangeAssociationProposal,
  createBoundDecisionContextObservationTargetRevisionBinder, createDecisionContextDraft, createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationContextTransition, createDecisionContextObservationItemMaterialization, createDecisionContextObservationItemProjection,
  createDecisionContextObservationMaterializationReadiness, createDecisionContextObservationProposal, createDecisionContextObservationTargetDeclaration,
  createDecisionContextRevision, createOutcomeAttributionProposal, createStateChangeClaim,
  type DecisionContextDraft, type DecisionContextObservationContextTransition, type DecisionContextObservationItemMaterialization, type DecisionContextRevision
} from "../../../lib/decision-core";

type Ref = { producerId: string; authorityContractId: string; artifactId: string; locator: string };
type Prov = Parameters<typeof createDecisionContextObservationProposal>[0]["provenance"];
type Hostile = Record<PropertyKey, unknown>;
const ref: Ref = { producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" };
const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map(k => [k, canonical((v as Record<string, unknown>)[k])])) : v;
const transitionId = (m: unknown, c: unknown) => `DCOCT_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_V1", canonical(m), canonical(c)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const reorder = (v: unknown): unknown => Array.isArray(v) ? v.map(reorder) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as Record<string, unknown>).reverse().map(k => [k, reorder((v as Record<string, unknown>)[k])])) : v;
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(d, e.name)) : e.name.endsWith(".ts") ? [join(d, e.name)] : []);
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action" }, operationDescription: "operation" });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state" }, stateChangeDescription: "change" }), provenance: { origin: "HUMAN_INPUT", actorId: "association" } }), provenance: { origin: "HUMAN_INPUT", actorId: "attribution" } });
function revision(sourceStateReferences: Ref[] = []): DecisionContextRevision { const context = createDecisionContextDraft({ sourceStateReferences, items: [{ role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }, { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }] }); const input = { expectationValidations: [], consequenceValidations: [] }; return createDecisionContextRevision({ previousRevisionId: null, context, validationInput: input, validationAssembly: assembleDecisionContextValidation(context, input) }); }
async function materialization(provenance: Prov): Promise<DecisionContextObservationItemMaterialization> {
  const value = revision(provenance.origin === "AUTHORITATIVE_STATE" ? [ref] : []);
  const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance });
  const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: "admission" }, rationale: "rationale" });
  const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission });
  const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: value.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: "target" }, rationale: "target" });
  const binding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: async () => value }).bind(declaration);
  return createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding }) });
}
const base = (m: DecisionContextObservationItemMaterialization) => m.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.revision.context;
const input = (m: DecisionContextObservationItemMaterialization) => ({ decisionContextObservationItemMaterialization: m });

describe("Decision Context Observation Context Transition", () => {
  it("constructs one detached NOT_RUN Context with every base item unchanged and exactly one materialized OBSERVATION member for HUMAN_INPUT, MODEL_PROPOSAL, and AUTHORITATIVE_STATE", async () => {
    for (const p of [{ origin: "HUMAN_INPUT", actorId: "observation" } as const, { origin: "MODEL_PROPOSAL", proposalRef: "proposal" } as const, { origin: "AUTHORITATIVE_STATE", stateReference: ref } as const]) {
      const m = await materialization(p); const b = base(m); const r = createDecisionContextObservationContextTransition(input(m));
      expect(r.context.validationStatus).toBe("NOT_RUN"); expect(r.context.contextId).not.toBe(b.contextId); expect(r.context.decisionQuestionId).toBe(b.decisionQuestionId); expect(r.context.sourceStateReferences).toEqual(b.sourceStateReferences); expect(r.context.items).toHaveLength(b.items.length + 1);
      for (const item of b.items) expect(r.context.items.find(x => x.itemId === item.itemId)).toEqual(item);
      expect(r.context.items.filter(x => x.itemId === m.item.itemId)).toEqual([m.item]); expect(r.decisionContextObservationItemMaterialization).toEqual(m); expect(r.decisionContextObservationContextTransitionId).toBe(transitionId(m, r.context));
    }
  });

  it("accepts no independent Context state, leaves bound base and materialized item unchanged, and returns detached data with no revision or validation carry-forward", async () => {
    const m = await materialization({ origin: "HUMAN_INPUT", actorId: "observation" }); const before = structuredClone(m); const r = createDecisionContextObservationContextTransition(input(m));
    expect(() => createDecisionContextObservationContextTransition({ ...input(m), context: r.context } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INPUT_INVALID");
    expect(m).toEqual(before); expect((r as unknown as Record<string, unknown>).validationInput).toBeUndefined(); expect((r as unknown as Record<string, unknown>).validationAssembly).toBeUndefined();
    m.item.statement = "caller mutation"; expect(r.context.items.find(x => x.itemId === before.item.itemId)?.statement).toBe("observation statement"); r.context.items[0].statement = "result mutation"; expect(m.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.revision.context.items[0].statement).toBe("Proceed?");
  });

  it("rejects hostile wrapper, materialization, Context, item, provenance, and reference representations without getter execution", async () => {
    const m = await materialization({ origin: "AUTHORITATIVE_STATE", stateReference: ref }); const r = createDecisionContextObservationContextTransition(input(m)); let calls = 0;
    const wrapper = {} as Hostile; Object.defineProperty(wrapper, "decisionContextObservationItemMaterialization", { enumerable: true, get: () => { calls += 1; return m; } });
    const hostileM = structuredClone(m) as unknown as Hostile; Object.defineProperty(hostileM.item as Hostile, "statement", { enumerable: true, configurable: true, get: () => { calls += 1; return "observation statement"; } });
    const hostileC = structuredClone(r) as unknown as Hostile; Object.defineProperty(hostileC.context as Hostile, "items", { enumerable: true, configurable: true, get: () => { calls += 1; return r.context.items; } });
    const hostileP = structuredClone(r) as unknown as Hostile; Object.defineProperty((hostileP.context as DecisionContextDraft).items.find(x => x.itemId === m.item.itemId)!.provenance as Hostile, "locator", { enumerable: true, configurable: true, get: () => { calls += 1; return "locator"; } });
    expect(() => createDecisionContextObservationContextTransition(wrapper as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INPUT_INVALID"); expect(() => createDecisionContextObservationContextTransition({ decisionContextObservationItemMaterialization: hostileM as never })).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_MATERIALIZATION_INVALID");
    for (const v of [hostileC, hostileP]) expect(() => assertDecisionContextObservationContextTransition(v)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INVALID"); expect(calls).toBe(0);
  });

  it("asserts complete stored membership delta, prioritizes body invalidity, and commits canonical complete materialization and Context state", async () => {
    const r = createDecisionContextObservationContextTransition(input(await materialization({ origin: "HUMAN_INPUT", actorId: "observation" }))); assertDecisionContextObservationContextTransition(structuredClone(r));
    const stale = structuredClone(r); stale.decisionContextObservationContextTransitionId = "DCOCT_000000000000000000000000"; expect(() => assertDecisionContextObservationContextTransition(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_ID_MISMATCH");
    const variants = [structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale), structuredClone(stale)];
    variants[0].context.items.pop(); variants[1].context.items[0].statement = "changed"; variants[2].context.items.push({ itemId: "DCI_000000000000000000000000", role: "ASSUMPTION", statement: "extra", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }); variants[3].context.items = variants[3].context.items.filter(i => i.itemId !== r.decisionContextObservationItemMaterialization.item.itemId); variants[4].context.items.find(i => i.itemId === r.decisionContextObservationItemMaterialization.item.itemId)!.statement = "changed"; variants[5].context.sourceStateReferences.push(ref); variants[6].context.decisionQuestionId = "DCI_000000000000000000000000";
    for (const v of variants) expect(() => assertDecisionContextObservationContextTransition(v)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INVALID");
    const reordered = createDecisionContextObservationContextTransition(reorder(input(r.decisionContextObservationItemMaterialization)) as never); expect(reordered.decisionContextObservationContextTransitionId).toBe(r.decisionContextObservationContextTransitionId); expect(transitionId(r.decisionContextObservationItemMaterialization, { ...r.context, validationStatus: "NOT_RUN" })).toBe(r.decisionContextObservationContextTransitionId);
  });

  it("exposes only the exact runtime and four-code surface and excludes revision, persistence, authority, model, provider, Career, Feedback, Learning, temporal, and random semantics", () => {
    expect(Object.keys(transitionModule).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION", "assertDecisionContextObservationContextTransition", "createDecisionContextObservationContextTransition"]); expect(Object.keys(decisionCore).filter(k => Object.keys(transitionModule).includes(k)).sort()).toEqual(Object.keys(transitionModule).sort());
    const source = files(resolve(process.cwd(), "lib/decision-core/context-observation-context-transition")).map(f => readFileSync(f, "utf8")).join("\n"); expect(source).not.toMatch(/createDecisionContextRevision|assertDecisionContextRevision|buildDecisionContextRevisionId|assembleDecisionContextValidation|revision-persistence|revision-lineage|persister|repository writer|authority resolver|authority reader|assessment|provider|model|evaluator|career|capability-core|previousRevisionId|Date\.now|new Date|Math\.random|UUID|Feedback|Learning/i); expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_MATERIALIZATION_INVALID"]);
  });
});
