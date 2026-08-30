import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationRevisionPersistence,
  type DecisionContextObservationRevisionPersistence
} from "../context-observation-revision-persistence";
import {
  assertHumanCommitmentActionOccurrenceAssociationProposal,
  type HumanCommitmentActionOccurrenceAssociationProposal
} from "../human-commitment-action-occurrence-association";
import {
  DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION,
  type DecisionLoopOccurrenceReturnBinding,
  type DecisionLoopOccurrenceReturnBindingInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["humanCommitmentActionOccurrenceAssociationProposal", "decisionContextObservationRevisionPersistence"] as const;
const bindingKeys = ["artifactKind", "schemaVersion", "decisionLoopOccurrenceReturnBindingId", "humanCommitmentActionOccurrenceAssociationProposal", "decisionContextObservationRevisionPersistence"] as const;
const idPattern = /^DLORB_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

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
  const captured = dataObject(value, code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const length = Reflect.getOwnPropertyDescriptor(value, "length")?.value;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
          result.push(capture(descriptor.value, code, ancestors));
        }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail(code);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
        Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true });
      }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort(compare)) result[key] = canonical(value[key]);
  return result;
}

function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function association(value: unknown, code: string): HumanCommitmentActionOccurrenceAssociationProposal {
  try {
    const captured = capture(value, code) as unknown as HumanCommitmentActionOccurrenceAssociationProposal;
    assertHumanCommitmentActionOccurrenceAssociationProposal(captured);
    return captured;
  } catch { return fail(code); }
}

function persistence(value: unknown, code: string): DecisionContextObservationRevisionPersistence {
  try {
    const captured = capture(value, code) as unknown as DecisionContextObservationRevisionPersistence;
    assertDecisionContextObservationRevisionPersistence(captured);
    return captured;
  } catch { return fail(code); }
}

function returnClaim(value: DecisionContextObservationRevisionPersistence): Captured {
  return value.decisionContextObservationRevisionCreation.decisionContextObservationContextValidationAssembly.decisionContextObservationContextTransition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.decisionContextObservationAdmissionDeclaration.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim as unknown as Captured;
}

function requireMatched(bridge: HumanCommitmentActionOccurrenceAssociationProposal, returned: DecisionContextObservationRevisionPersistence, code: string): void {
  const bridgeClaim = capture(bridge.actionOccurrenceClaim, code);
  const persistedClaim = capture(returnClaim(returned), code);
  if (JSON.stringify(canonical(bridgeClaim)) !== JSON.stringify(canonical(persistedClaim))) fail(code);
}

function bindingId(associationProposal: HumanCommitmentActionOccurrenceAssociationProposal, persistenceArtifact: DecisionContextObservationRevisionPersistence): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION,
      canonical(associationProposal as unknown as Captured),
      canonical(persistenceArtifact as unknown as Captured)
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DLORB_${digest}`;
}

function construct(associationProposal: HumanCommitmentActionOccurrenceAssociationProposal, persistenceArtifact: DecisionContextObservationRevisionPersistence): DecisionLoopOccurrenceReturnBinding {
  return {
    artifactKind: "DECISION_LOOP_OCCURRENCE_RETURN_BINDING",
    schemaVersion: DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION,
    decisionLoopOccurrenceReturnBindingId: bindingId(associationProposal, persistenceArtifact),
    humanCommitmentActionOccurrenceAssociationProposal: associationProposal,
    decisionContextObservationRevisionPersistence: persistenceArtifact
  };
}

export function createDecisionLoopOccurrenceReturnBinding(input: DecisionLoopOccurrenceReturnBindingInput): DecisionLoopOccurrenceReturnBinding {
  const captured = exact(input, inputKeys, "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INPUT_INVALID");
  const associationProposal = association(captured.humanCommitmentActionOccurrenceAssociationProposal, "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ASSOCIATION_INVALID");
  const persistenceArtifact = persistence(captured.decisionContextObservationRevisionPersistence, "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_PERSISTENCE_INVALID");
  requireMatched(associationProposal, persistenceArtifact, "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_OCCURRENCE_MISMATCH");
  const binding = construct(associationProposal, persistenceArtifact);
  assertDecisionLoopOccurrenceReturnBinding(binding);
  return structuredClone(binding);
}

export function assertDecisionLoopOccurrenceReturnBinding(value: unknown): asserts value is DecisionLoopOccurrenceReturnBinding {
  const invalid = "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_INVALID";
  try {
    const binding = exact(value, bindingKeys, invalid);
    if (binding.artifactKind !== "DECISION_LOOP_OCCURRENCE_RETURN_BINDING" || binding.schemaVersion !== DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION || typeof binding.decisionLoopOccurrenceReturnBindingId !== "string" || !idPattern.test(binding.decisionLoopOccurrenceReturnBindingId)) fail(invalid);
    const associationProposal = association(binding.humanCommitmentActionOccurrenceAssociationProposal, invalid);
    const persistenceArtifact = persistence(binding.decisionContextObservationRevisionPersistence, invalid);
    requireMatched(associationProposal, persistenceArtifact, invalid);
    if (binding.decisionLoopOccurrenceReturnBindingId !== bindingId(associationProposal, persistenceArtifact)) fail("ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
