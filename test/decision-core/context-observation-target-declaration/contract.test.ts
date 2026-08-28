import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as declarationContract from "../../../lib/decision-core/context-observation-target-declaration";
import type {
  DecisionContextObservationTargetDeclaration,
  DecisionContextObservationTargetDeclarationInput
} from "../../../lib/decision-core/context-observation-target-declaration";
import * as decisionCore from "../../../lib/decision-core";
import {
  assertDecisionContextObservationTargetDeclaration,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationItemProjection,
  createDecisionContextObservationProposal,
  createOutcomeAttributionProposal,
  createStateChangeClaim,
  createDecisionContextObservationTargetDeclaration
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action reporter" }, operationDescription: "operation" });
const stateChange = () => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state reporter" }, stateChangeDescription: "change" });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: "association reporter" } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: "attribution reporter" } });
const observation = (provenance: Parameters<typeof createDecisionContextObservationProposal>[0]["provenance"] = { origin: "HUMAN_INPUT", actorId: "observation reporter" }) => createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance });
const projection = (provenance?: Parameters<typeof observation>[0]) => createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: observation(provenance), admittedBy: { origin: "HUMAN_INPUT", actorId: "admission actor" }, rationale: "admission rationale" }) });
const input = (itemProjection = projection(), targetRevisionId = "DREV_0123456789ABCDEF01234567", actorId = "target actor", rationale: string | null = "target rationale"): DecisionContextObservationTargetDeclarationInput => ({ decisionContextObservationItemProjection: itemProjection, targetRevisionId, declaredBy: { origin: "HUMAN_INPUT", actorId }, rationale });

type HostileRecord = Record<PropertyKey, unknown>;

function storedHostilityMatrix<T>(artifact: T, target: (value: HostileRecord) => HostileRecord, canonicalField: string, canonicalValue: unknown, getter: () => void): unknown[] {
  const accessor = structuredClone(artifact) as HostileRecord; Object.defineProperty(target(accessor), canonicalField, { enumerable: true, configurable: true, get: () => { getter(); return canonicalValue; } });
  const symbol = structuredClone(artifact) as HostileRecord; Object.defineProperty(target(symbol), Symbol("hostile"), { enumerable: true, value: true });
  const hidden = structuredClone(artifact) as HostileRecord; Object.defineProperty(target(hidden), "hidden", { enumerable: false, value: true });
  const extra = structuredClone(artifact) as HostileRecord; target(extra).extra = true;
  return [accessor, symbol, hidden, extra];
}

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

describe("Decision Context Observation Target Declaration", () => {
  it("creates an exact detached seven-field declaration from an arbitrary shape-valid DREV reference", () => {
    const supplied = input(projection(), "DREV_ABCDEF0123456789ABCDEF01", " target actor ", " target rationale ");
    const result = createDecisionContextObservationTargetDeclaration(supplied);
    expect(Object.keys(supplied)).toEqual(["decisionContextObservationItemProjection", "targetRevisionId", "declaredBy", "rationale"]);
    expect(result).toMatchObject({ artifactKind: "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION", schemaVersion: "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_V1", targetRevisionId: "DREV_ABCDEF0123456789ABCDEF01", declaredBy: { origin: "HUMAN_INPUT", actorId: "target actor" }, rationale: "target rationale" });
    expect(result.decisionContextObservationTargetDeclarationId).toMatch(/^DCOTD_[0-9A-F]{24}$/);
    expect(Object.keys(result).sort()).toEqual(["artifactKind", "decisionContextObservationItemProjection", "decisionContextObservationTargetDeclarationId", "declaredBy", "rationale", "schemaVersion", "targetRevisionId"]);
    for (const field of ["context", "contextId", "itemId", "previousRevisionId", "futureRevisionId", "sourceStateReferences", "validation", "timestamp", "current", "head", "latest"]) expect(result).not.toHaveProperty(field);
    supplied.decisionContextObservationItemProjection.projectedItemInput.statement = "changed";
    expect(result.decisionContextObservationItemProjection.projectedItemInput.statement).toBe("observation statement");
  });

  it("preserves null rationale, validates only DREV shape, and permits independent declarations", () => {
    const first = createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_111111111111111111111111", "actor one", null));
    const second = createDecisionContextObservationTargetDeclaration(input(first.decisionContextObservationItemProjection, "DREV_222222222222222222222222", "actor two", "reason"));
    const authoritative = createDecisionContextObservationTargetDeclaration(input(projection({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } })));
    expect(first.rationale).toBeNull();
    expect(second.targetRevisionId).toBe("DREV_222222222222222222222222");
    expect(first.decisionContextObservationTargetDeclarationId).not.toBe(second.decisionContextObservationTargetDeclarationId);
    expect(first.decisionContextObservationItemProjection.decisionContextObservationItemProjectionId).toBe(second.decisionContextObservationItemProjection.decisionContextObservationItemProjectionId);
    expect(authoritative.decisionContextObservationItemProjection.projectedItemInput.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } });
    expect(authoritative).not.toHaveProperty("sourceStateReferences");
  });

  it("makes DCOIP identity, target revision, declared actor, and rationale independently identity-bearing", () => {
    const base = createDecisionContextObservationTargetDeclaration(input());
    expect(createDecisionContextObservationTargetDeclaration(input()).decisionContextObservationTargetDeclarationId).toBe(base.decisionContextObservationTargetDeclarationId);
    expect(createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_111111111111111111111111")).decisionContextObservationTargetDeclarationId).not.toBe(base.decisionContextObservationTargetDeclarationId);
    expect(createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_0123456789ABCDEF01234567", "other actor")).decisionContextObservationTargetDeclarationId).not.toBe(base.decisionContextObservationTargetDeclarationId);
    expect(createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_0123456789ABCDEF01234567", "target actor", null)).decisionContextObservationTargetDeclarationId).not.toBe(base.decisionContextObservationTargetDeclarationId);
    expect(createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_0123456789ABCDEF01234567", "target actor", "other rationale")).decisionContextObservationTargetDeclarationId).not.toBe(base.decisionContextObservationTargetDeclarationId);
    const distinctProjection = projection({ origin: "MODEL_PROPOSAL", proposalRef: "model proposal" });
    expect(createDecisionContextObservationTargetDeclaration(input(distinctProjection)).decisionContextObservationTargetDeclarationId).not.toBe(base.decisionContextObservationTargetDeclarationId);
  });

  it("routes every constructor-owned invalid category exactly", () => {
    expect(() => createDecisionContextObservationTargetDeclaration({ ...input(), extra: true } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INPUT_INVALID");
    const staleProjection = projection(); staleProjection.decisionContextObservationItemProjectionId = "DCOIP_000000000000000000000000";
    expect(() => createDecisionContextObservationTargetDeclaration(input(staleProjection))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_PROJECTION_INVALID");
    expect(() => createDecisionContextObservationTargetDeclaration(input(projection(), "not-a-drev"))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_REVISION_ID_INVALID");
    expect(() => createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_0123456789ABCDEF01234567", "   "))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ACTOR_INVALID");
    expect(() => createDecisionContextObservationTargetDeclaration(input(projection(), "DREV_0123456789ABCDEF01234567", "actor", "   "))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_RATIONALE_INVALID");
  });

  it("asserts canonical stored state without repair and gives body invalidity precedence", () => {
    const result = createDecisionContextObservationTargetDeclaration(input());
    assertDecisionContextObservationTargetDeclaration(result);
    const stale = structuredClone(result); stale.decisionContextObservationTargetDeclarationId = "DCOTD_000000000000000000000000";
    expect(() => assertDecisionContextObservationTargetDeclaration(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ID_MISMATCH");
    const spacedActor = structuredClone(result); spacedActor.declaredBy.actorId = " target actor ";
    const spacedRationale = structuredClone(result); spacedRationale.rationale = " target rationale ";
    const staleProjection = structuredClone(result); staleProjection.decisionContextObservationItemProjection.decisionContextObservationItemProjectionId = "DCOIP_000000000000000000000000";
    const staleWithDrift = structuredClone(stale); staleWithDrift.targetRevisionId = "not-a-drev";
    for (const value of [spacedActor, spacedRationale, staleProjection, staleWithDrift]) expect(() => assertDecisionContextObservationTargetDeclaration(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INVALID");
  });

  it("rejects hostile input, actor, stored declaration, and sealed DCOIP boundaries without getter execution", () => {
    let getterCalls = 0;
    const accessorInput = input() as unknown as HostileRecord; Object.defineProperty(accessorInput, "targetRevisionId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "DREV_0123456789ABCDEF01234567"; } });
    const symbolInput = input() as unknown as HostileRecord; Object.defineProperty(symbolInput, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenInput = input() as unknown as HostileRecord; Object.defineProperty(hiddenInput, "hidden", { enumerable: false, value: true });
    const extraInput = { ...input(), extra: true };
    const accessorActor = input(); Object.defineProperty(accessorActor.declaredBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "target actor"; } });
    const symbolActor = input(); Object.defineProperty(symbolActor.declaredBy, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenActor = input(); Object.defineProperty(hiddenActor.declaredBy, "hidden", { enumerable: false, value: true });
    const extraActor = input(); (extraActor.declaredBy as unknown as HostileRecord).extra = true;
    const accessorProjection = input(); Object.defineProperty(accessorProjection.decisionContextObservationItemProjection, "projectedItemInput", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return {}; } });
    const symbolProjection = input(); Object.defineProperty(symbolProjection.decisionContextObservationItemProjection, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenProjection = input(); Object.defineProperty(hiddenProjection.decisionContextObservationItemProjection, "hidden", { enumerable: false, value: true });
    const extraProjection = input(); (extraProjection.decisionContextObservationItemProjection as unknown as HostileRecord).extra = true;
    for (const value of [accessorInput, symbolInput, hiddenInput, extraInput]) expect(() => createDecisionContextObservationTargetDeclaration(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INPUT_INVALID");
    for (const value of [accessorActor, symbolActor, hiddenActor, extraActor]) expect(() => createDecisionContextObservationTargetDeclaration(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ACTOR_INVALID");
    for (const value of [accessorProjection, symbolProjection, hiddenProjection, extraProjection]) expect(() => createDecisionContextObservationTargetDeclaration(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_PROJECTION_INVALID");
    const result = createDecisionContextObservationTargetDeclaration(input());
    const stored = [
      ...storedHostilityMatrix(result, (value) => value, "targetRevisionId", result.targetRevisionId, () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => value.declaredBy as HostileRecord, "actorId", "target actor", () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => value.decisionContextObservationItemProjection as HostileRecord, "projectedItemInput", result.decisionContextObservationItemProjection.projectedItemInput, () => { getterCalls += 1; })
    ];
    for (const value of stored) expect(() => assertDecisionContextObservationTargetDeclaration(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports only the standalone 8D4A contract and excludes Context/revision, authority, persistence, and legacy semantics", () => {
    expect(Object.keys(declarationContract).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION", "assertDecisionContextObservationTargetDeclaration", "createDecisionContextObservationTargetDeclaration"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(declarationContract).includes(name)).sort()).toEqual(Object.keys(declarationContract).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-target-declaration")).map((file) => readFileSync(file, "utf8")).join("\n");
    const identity = source.match(/function declarationId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing declaration identity");
    expect(stringifyArrayPayload(identity).replace(/\s+/g, "")).toBe('DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION,decisionContextObservationItemProjection.decisionContextObservationItemProjectionId,targetRevisionId,["HUMAN_INPUT",declaredBy.actorId],rationale');
    expect(source).not.toMatch(/from\s+["'][^"']*(context\/|revisions|revision-|career|feedback|learning|persistence|repository|authority)/i);
    expect(source).not.toMatch(/\b(DecisionContextDraft|DecisionContextItem|DecisionContextRevision|getRevisionById|buildDecisionContextItemId|createDecisionContextDraft|assertDecisionContextDraft|createDecisionContextRevision|assertDecisionContextRevision|assembleDecisionContextValidation|sourceStateReferences|repository|persister|date\.now|new date|math\.random|uuid|Feedback|Learning|evaluator|provider|model)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ACTOR_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_PROJECTION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_RATIONALE_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_REVISION_ID_INVALID"]);
    const typed: DecisionContextObservationTargetDeclaration | null = null;
    expect(typed).toBeNull();
  });
});
