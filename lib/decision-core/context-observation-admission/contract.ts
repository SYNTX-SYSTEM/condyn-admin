import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationProposal,
  type DecisionContextObservationProposal
} from "../context-observation-proposal";
import {
  DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION,
  type DecisionContextObservationAdmissionActor,
  type DecisionContextObservationAdmissionDeclaration,
  type DecisionContextObservationAdmissionDeclarationInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationProposal", "admittedBy", "rationale"] as const;
const declarationKeys = ["artifactKind", "schemaVersion", "decisionContextObservationAdmissionId", "decisionContextObservationProposal", "admittedBy", "rationale"] as const;
const actorKeys = ["origin", "actorId"] as const;
const idPattern = /^DCOAD_[0-9A-F]{24}$/;

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

function decisionContextObservationProposal(value: unknown, code: string): DecisionContextObservationProposal {
  try {
    assertDecisionContextObservationProposal(value);
    return structuredClone(value);
  } catch { return fail(code); }
}

function actor(value: unknown, trim: boolean, code: string): DecisionContextObservationAdmissionActor {
  const captured = exact(value, actorKeys, code);
  if (captured.origin !== "HUMAN_INPUT" || typeof captured.actorId !== "string") return fail(code);
  const actorId = trim ? captured.actorId.trim() : captured.actorId;
  if (actorId.length === 0 || (!trim && actorId !== captured.actorId.trim())) return fail(code);
  return { origin: "HUMAN_INPUT", actorId };
}

function rationale(value: unknown, trim: boolean, code: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return fail(code);
  const captured = trim ? value.trim() : value;
  if (captured.length === 0 || (!trim && captured !== value.trim())) return fail(code);
  return captured;
}

function admissionId(decisionContextObservationProposal: DecisionContextObservationProposal, admittedBy: DecisionContextObservationAdmissionActor, rationale: string | null): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION,
      decisionContextObservationProposal.decisionContextObservationProposalId,
      ["HUMAN_INPUT", admittedBy.actorId],
      rationale
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DCOAD_${digest}`;
}

function construct(decisionContextObservationProposal: DecisionContextObservationProposal, admittedBy: DecisionContextObservationAdmissionActor, rationale: string | null): DecisionContextObservationAdmissionDeclaration {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION,
    decisionContextObservationAdmissionId: admissionId(decisionContextObservationProposal, admittedBy, rationale),
    decisionContextObservationProposal,
    admittedBy,
    rationale
  };
}

export function createDecisionContextObservationAdmissionDeclaration(input: DecisionContextObservationAdmissionDeclarationInput): DecisionContextObservationAdmissionDeclaration {
  const captured = exact(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INPUT_INVALID");
  const capturedProposal = decisionContextObservationProposal(captured.decisionContextObservationProposal, "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_PROPOSAL_INVALID");
  const capturedActor = actor(captured.admittedBy, true, "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID");
  const capturedRationale = rationale(captured.rationale, true, "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_RATIONALE_INVALID");
  const declaration = construct(capturedProposal, capturedActor, capturedRationale);
  assertDecisionContextObservationAdmissionDeclaration(declaration);
  return structuredClone(declaration);
}

export function assertDecisionContextObservationAdmissionDeclaration(value: unknown): asserts value is DecisionContextObservationAdmissionDeclaration {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID";
  try {
    const declaration = exact(value, declarationKeys, invalid);
    if (declaration.artifactKind !== "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION" || declaration.schemaVersion !== DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION || typeof declaration.decisionContextObservationAdmissionId !== "string" || !idPattern.test(declaration.decisionContextObservationAdmissionId)) fail(invalid);
    const capturedProposal = decisionContextObservationProposal(declaration.decisionContextObservationProposal, invalid);
    const capturedActor = actor(declaration.admittedBy, false, invalid);
    const capturedRationale = rationale(declaration.rationale, false, invalid);
    if (declaration.decisionContextObservationAdmissionId !== admissionId(capturedProposal, capturedActor, capturedRationale)) fail("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
