import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationAdmissionDeclaration,
  type DecisionContextObservationAdmissionDeclaration
} from "../context-observation-admission";
import type { DecisionContextObservationProposalProvenance } from "../context-observation-proposal";
import {
  DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION,
  type DecisionContextObservationItemProjection,
  type DecisionContextObservationItemProjectionInput,
  type ProjectedDecisionContextObservationItemInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationAdmissionDeclaration"] as const;
const projectionKeys = ["artifactKind", "schemaVersion", "decisionContextObservationItemProjectionId", "decisionContextObservationAdmissionDeclaration", "projectedItemInput"] as const;
const projectedItemInputKeys = ["role", "statement", "provenance"] as const;
const idPattern = /^DCOIP_[0-9A-F]{24}$/;

function dataObject(value: unknown, code: string): Record<string, unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const result: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return fail(code);
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      Object.defineProperty(result, key, { value: descriptor.value, enumerable: true, writable: true, configurable: true });
    }
    return result;
  } catch { return fail(code); }
}

function exact(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  const object = dataObject(value, code);
  const actual = Object.keys(object);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(object, key))) return fail(code);
  return object;
}

function admission(value: unknown, code: string): DecisionContextObservationAdmissionDeclaration {
  try {
    assertDecisionContextObservationAdmissionDeclaration(value);
    return structuredClone(value);
  } catch { return fail(code); }
}

function provenance(value: unknown, code: string): DecisionContextObservationProposalProvenance {
  const captured = dataObject(value, code);
  if (captured.origin === "HUMAN_INPUT") {
    const human = exact(captured, ["origin", "actorId"], code);
    if (typeof human.actorId !== "string" || human.actorId.length === 0 || human.actorId !== human.actorId.trim()) return fail(code);
    return { origin: "HUMAN_INPUT", actorId: human.actorId };
  }
  if (captured.origin === "MODEL_PROPOSAL") {
    const model = exact(captured, ["origin", "proposalRef"], code);
    if (typeof model.proposalRef !== "string" || model.proposalRef.length === 0 || model.proposalRef !== model.proposalRef.trim()) return fail(code);
    return { origin: "MODEL_PROPOSAL", proposalRef: model.proposalRef };
  }
  if (captured.origin === "AUTHORITATIVE_STATE") {
    const authoritative = exact(captured, ["origin", "stateReference"], code);
    const reference = exact(authoritative.stateReference, ["producerId", "authorityContractId", "artifactId", "locator"], code);
    if ([reference.producerId, reference.authorityContractId, reference.artifactId, reference.locator].some((field) => typeof field !== "string" || field.trim().length === 0)) return fail(code);
    return { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: reference.producerId as string, authorityContractId: reference.authorityContractId as string, artifactId: reference.artifactId as string, locator: reference.locator as string } };
  }
  return fail(code);
}

function projectedItemInput(value: unknown, code: string): ProjectedDecisionContextObservationItemInput {
  const captured = exact(value, projectedItemInputKeys, code);
  if (captured.role !== "OBSERVATION" || typeof captured.statement !== "string" || captured.statement.length === 0 || captured.statement !== captured.statement.trim()) return fail(code);
  return { role: "OBSERVATION", statement: captured.statement, provenance: provenance(captured.provenance, code) };
}

function projectedFrom(decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration): ProjectedDecisionContextObservationItemInput {
  return {
    role: "OBSERVATION",
    statement: decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.statement,
    provenance: structuredClone(decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.provenance)
  };
}

function same(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) || Array.isArray(right)) return false;
  const leftObject = left as Record<string, unknown>;
  const rightObject = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftObject).sort();
  const rightKeys = Object.keys(rightObject).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && (typeof leftObject[key] === "object" && leftObject[key] !== null ? same(leftObject[key], rightObject[key]) : leftObject[key] === rightObject[key]));
}

function projectionId(decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION,
      decisionContextObservationAdmissionDeclaration.decisionContextObservationAdmissionId
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DCOIP_${digest}`;
}

function construct(decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration): DecisionContextObservationItemProjection {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION,
    decisionContextObservationItemProjectionId: projectionId(decisionContextObservationAdmissionDeclaration),
    decisionContextObservationAdmissionDeclaration,
    projectedItemInput: projectedFrom(decisionContextObservationAdmissionDeclaration)
  };
}

export function createDecisionContextObservationItemProjection(input: DecisionContextObservationItemProjectionInput): DecisionContextObservationItemProjection {
  const captured = exact(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INPUT_INVALID");
  const capturedAdmission = admission(captured.decisionContextObservationAdmissionDeclaration, "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ADMISSION_INVALID");
  const result = construct(capturedAdmission);
  assertDecisionContextObservationItemProjection(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationItemProjection(value: unknown): asserts value is DecisionContextObservationItemProjection {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID";
  try {
    const projection = exact(value, projectionKeys, invalid);
    if (projection.artifactKind !== "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION" || projection.schemaVersion !== DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION || typeof projection.decisionContextObservationItemProjectionId !== "string" || !idPattern.test(projection.decisionContextObservationItemProjectionId)) fail(invalid);
    const capturedAdmission = admission(projection.decisionContextObservationAdmissionDeclaration, invalid);
    const capturedProjectedItemInput = projectedItemInput(projection.projectedItemInput, invalid);
    if (!same(capturedProjectedItemInput, projectedFrom(capturedAdmission))) fail(invalid);
    if (projection.decisionContextObservationItemProjectionId !== projectionId(capturedAdmission)) fail("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
