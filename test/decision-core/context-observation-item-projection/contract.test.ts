import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as projection from "../../../lib/decision-core/context-observation-item-projection";
import type {
  DecisionContextObservationItemProjection,
  DecisionContextObservationItemProjectionInput,
  ProjectedDecisionContextObservationItemInput
} from "../../../lib/decision-core/context-observation-item-projection";
import * as decisionCore from "../../../lib/decision-core";
import {
  assertDecisionContextObservationItemProjection,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationItemProjection,
  createDecisionContextObservationProposal,
  createOutcomeAttributionProposal,
  createStateChangeClaim
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const occurrence = () => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action reporter" }, operationDescription: "operation" });
const stateChange = () => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state reporter" }, stateChangeDescription: "change" });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: "association reporter" } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: "attribution reporter" } });
const observation = (provenance: Parameters<typeof createDecisionContextObservationProposal>[0]["provenance"] = { origin: "HUMAN_INPUT", actorId: "observation reporter" }) => createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: "observation statement", provenance });
const admission = (proposal = observation(), rationale: string | null = "admission rationale") => createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: "admission actor" }, rationale });
const input = (declaration = admission()): DecisionContextObservationItemProjectionInput => ({ decisionContextObservationAdmissionDeclaration: declaration });

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

type HostileRecord = Record<PropertyKey, unknown>;

function storedHostilityMatrix<T>(artifact: T, target: (value: HostileRecord) => HostileRecord, canonicalField: string, canonicalValue: unknown, getter: () => void): unknown[] {
  const accessor = structuredClone(artifact) as HostileRecord; Object.defineProperty(target(accessor), canonicalField, { enumerable: true, configurable: true, get: () => { getter(); return canonicalValue; } });
  const symbol = structuredClone(artifact) as HostileRecord; Object.defineProperty(target(symbol), Symbol("hostile"), { enumerable: true, value: true });
  const hidden = structuredClone(artifact) as HostileRecord; Object.defineProperty(target(hidden), "hidden", { enumerable: false, value: true });
  const extra = structuredClone(artifact) as HostileRecord; target(extra).extra = true;
  return [accessor, symbol, hidden, extra];
}

describe("Decision Context Observation Item Projection", () => {
  it("projects exact deterministic OBSERVATION input from a sealed human-provenance admission and returns detached state", () => {
    const supplied = input();
    const result = createDecisionContextObservationItemProjection(supplied);
    expect(Object.keys(supplied)).toEqual(["decisionContextObservationAdmissionDeclaration"]);
    expect(result).toMatchObject({ artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION", schemaVersion: "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_V1", projectedItemInput: { role: "OBSERVATION", statement: "observation statement", provenance: { origin: "HUMAN_INPUT", actorId: "observation reporter" } } });
    expect(result.decisionContextObservationItemProjectionId).toMatch(/^DCOIP_[0-9A-F]{24}$/);
    expect(Object.keys(result).sort()).toEqual(["artifactKind", "decisionContextObservationAdmissionDeclaration", "decisionContextObservationItemProjectionId", "projectedItemInput", "schemaVersion"]);
    for (const field of ["itemId", "context", "contextId", "revisionId", "previousRevisionId", "decisionQuestionId", "sourceStateReferences", "rationale", "admittedBy", "timestamp"]) expect(result).not.toHaveProperty(field);
    supplied.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.statement = "changed";
    expect(result.projectedItemInput.statement).toBe("observation statement");
  });

  it("preserves MODEL_PROPOSAL and AUTHORITATIVE_STATE provenance exactly without deterministic-derivation replacement", () => {
    const model = createDecisionContextObservationItemProjection(input(admission(observation({ origin: "MODEL_PROPOSAL", proposalRef: "model proposal" }))));
    const authoritative = createDecisionContextObservationItemProjection(input(admission(observation({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } }))));
    expect(model.projectedItemInput.provenance).toEqual({ origin: "MODEL_PROPOSAL", proposalRef: "model proposal" });
    expect(model.decisionContextObservationAdmissionDeclaration.admittedBy).toEqual({ origin: "HUMAN_INPUT", actorId: "admission actor" });
    expect(model.projectedItemInput.provenance).not.toEqual(model.decisionContextObservationAdmissionDeclaration.admittedBy);
    for (const field of ["itemId", "contextId", "revisionId", "previousRevisionId", "decisionQuestionId", "sourceStateReferences"]) expect(model).not.toHaveProperty(field);
    expect(authoritative.projectedItemInput.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } });
    const deterministicDrift = structuredClone(model); deterministicDrift.projectedItemInput.provenance = { origin: "DETERMINISTIC_DERIVATION", ruleId: "rule" } as never;
    expect(() => assertDecisionContextObservationItemProjection(deterministicDrift)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID");
  });

  it("retains sealed admission lineage while distinct admissions can project equal item input", () => {
    const candidate = observation();
    const first = createDecisionContextObservationItemProjection(input(admission(candidate, "first rationale")));
    const second = createDecisionContextObservationItemProjection(input(admission(candidate, "second rationale")));
    expect(first.projectedItemInput).toEqual(second.projectedItemInput);
    expect(first.decisionContextObservationAdmissionDeclaration.decisionContextObservationAdmissionId).not.toBe(second.decisionContextObservationAdmissionDeclaration.decisionContextObservationAdmissionId);
    expect(first.decisionContextObservationItemProjectionId).not.toBe(second.decisionContextObservationItemProjectionId);
    expect(createDecisionContextObservationItemProjection(input(first.decisionContextObservationAdmissionDeclaration)).decisionContextObservationItemProjectionId).toBe(first.decisionContextObservationItemProjectionId);
  });

  it("owns malformed input and sealed admission failures at construction", () => {
    expect(() => createDecisionContextObservationItemProjection({ ...input(), extra: true } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INPUT_INVALID");
    const stale = admission(); stale.decisionContextObservationAdmissionId = "DCOAD_000000000000000000000000";
    expect(() => createDecisionContextObservationItemProjection(input(stale))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ADMISSION_INVALID");
  });

  it("asserts exact stored projection body without repair and separates stale outer identity", () => {
    const result = createDecisionContextObservationItemProjection(input());
    assertDecisionContextObservationItemProjection(result);
    const stale = structuredClone(result); stale.decisionContextObservationItemProjectionId = "DCOIP_000000000000000000000000";
    expect(() => assertDecisionContextObservationItemProjection(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ID_MISMATCH");
    const wrongRole = structuredClone(result); wrongRole.projectedItemInput.role = "OPTION" as never;
    const statementDrift = structuredClone(result); statementDrift.projectedItemInput.statement = "different";
    const provenanceDrift = structuredClone(result); provenanceDrift.projectedItemInput.provenance = { origin: "MODEL_PROPOSAL", proposalRef: "different" } as never;
    const staleAdmission = structuredClone(result); staleAdmission.decisionContextObservationAdmissionDeclaration.decisionContextObservationAdmissionId = "DCOAD_000000000000000000000000";
    const staleWithStatementDrift = structuredClone(result); staleWithStatementDrift.decisionContextObservationItemProjectionId = "DCOIP_000000000000000000000000"; staleWithStatementDrift.projectedItemInput.statement = "different";
    for (const value of [wrongRole, statementDrift, provenanceDrift, staleAdmission, staleWithStatementDrift]) expect(() => assertDecisionContextObservationItemProjection(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID");
  });

  it("rejects hostile outer, projected input, provenance, and sealed predecessor state without getter execution", () => {
    let getterCalls = 0;
    const accessorInput = input() as unknown as Record<string, unknown>; Object.defineProperty(accessorInput, "decisionContextObservationAdmissionDeclaration", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return admission(); } });
    const symbolInput = input() as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolInput, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenInput = input() as unknown as Record<string, unknown>; Object.defineProperty(hiddenInput, "hidden", { enumerable: false, value: true });
    const hostileAdmission = input(); Object.defineProperty(hostileAdmission.decisionContextObservationAdmissionDeclaration, "admittedBy", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "actor" }; } });
    for (const value of [accessorInput, symbolInput, hiddenInput]) expect(() => createDecisionContextObservationItemProjection(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INPUT_INVALID");
    expect(() => createDecisionContextObservationItemProjection(hostileAdmission)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ADMISSION_INVALID");
    const result = createDecisionContextObservationItemProjection(input());
    const modelResult = createDecisionContextObservationItemProjection(input(admission(observation({ origin: "MODEL_PROPOSAL", proposalRef: "model proposal" }))));
    const authoritativeResult = createDecisionContextObservationItemProjection(input(admission(observation({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "artifact", locator: "locator" } }))));
    const stored = [
      ...storedHostilityMatrix(result, (value) => value, "projectedItemInput", result.projectedItemInput, () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => value.projectedItemInput as HostileRecord, "statement", "observation statement", () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => (value.projectedItemInput as HostileRecord).provenance as HostileRecord, "actorId", "observation reporter", () => { getterCalls += 1; }),
      ...storedHostilityMatrix(modelResult, (value) => (value.projectedItemInput as HostileRecord).provenance as HostileRecord, "proposalRef", "model proposal", () => { getterCalls += 1; }),
      ...storedHostilityMatrix(authoritativeResult, (value) => ((value.projectedItemInput as HostileRecord).provenance as HostileRecord).stateReference as HostileRecord, "producerId", "producer", () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => value.decisionContextObservationAdmissionDeclaration as HostileRecord, "admittedBy", { origin: "HUMAN_INPUT", actorId: "admission actor" }, () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => ((value.decisionContextObservationAdmissionDeclaration as HostileRecord).decisionContextObservationProposal as HostileRecord), "provenance", { origin: "HUMAN_INPUT", actorId: "observation reporter" }, () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => (((value.decisionContextObservationAdmissionDeclaration as HostileRecord).decisionContextObservationProposal as HostileRecord).outcomeAttributionProposal as HostileRecord), "provenance", { origin: "HUMAN_INPUT", actorId: "attribution reporter" }, () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => ((((value.decisionContextObservationAdmissionDeclaration as HostileRecord).decisionContextObservationProposal as HostileRecord).outcomeAttributionProposal as HostileRecord).associationProposal as HostileRecord), "provenance", { origin: "HUMAN_INPUT", actorId: "association reporter" }, () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => (((((value.decisionContextObservationAdmissionDeclaration as HostileRecord).decisionContextObservationProposal as HostileRecord).outcomeAttributionProposal as HostileRecord).associationProposal as HostileRecord).actionOccurrenceClaim as HostileRecord), "operationDescription", "operation", () => { getterCalls += 1; }),
      ...storedHostilityMatrix(result, (value) => (((((value.decisionContextObservationAdmissionDeclaration as HostileRecord).decisionContextObservationProposal as HostileRecord).outcomeAttributionProposal as HostileRecord).associationProposal as HostileRecord).stateChangeClaim as HostileRecord), "stateChangeDescription", "change", () => { getterCalls += 1; })
    ];
    for (const value of stored) expect(() => assertDecisionContextObservationItemProjection(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports only the standalone 8D3 surface and hashes only the sealed DCOAD identity", () => {
    expect(Object.keys(projection).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION", "assertDecisionContextObservationItemProjection", "createDecisionContextObservationItemProjection"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(projection).includes(name)).sort()).toEqual(Object.keys(projection).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-item-projection")).map((file) => readFileSync(file, "utf8")).join("\n");
    const identity = source.match(/function projectionId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing projection identity");
    expect(stringifyArrayPayload(identity).replace(/\s+/g, "")).toBe('DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION,decisionContextObservationAdmissionDeclaration.decisionContextObservationAdmissionId');
    expect(source).not.toMatch(/from\s+["'][^"']*(context\/|revisions|revision-|career|feedback|learning|persistence|repository|matching)/i);
    expect(source).not.toMatch(/\b(buildDecisionContextItemId|createDecisionContextDraft|assertDecisionContextDraft|createDecisionContextRevision|assertDecisionContextRevision|assembleDecisionContextValidation|sourceStateReferences|Feedback|Learning|repository|persister|date\.now|new date|math\.random|uuid)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ADMISSION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID"]);
    const projected: ProjectedDecisionContextObservationItemInput = { role: "OBSERVATION", statement: "statement", provenance: { origin: "HUMAN_INPUT", actorId: "actor" } }; const projectionInput: DecisionContextObservationItemProjectionInput = input(); const result: DecisionContextObservationItemProjection | null = null;
    expect([projected.role, projectionInput.decisionContextObservationAdmissionDeclaration, result]).toEqual(["OBSERVATION", projectionInput.decisionContextObservationAdmissionDeclaration, null]);
  });
});
