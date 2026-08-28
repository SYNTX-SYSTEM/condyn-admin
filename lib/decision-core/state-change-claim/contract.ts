import { createHash } from "node:crypto";
import {
  STATE_CHANGE_CLAIM_SCHEMA_VERSION,
  type StateChangeClaim,
  type StateChangeClaimInput,
  type StateChangeClaimSource
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["source", "stateChangeDescription"] as const;
const claimKeys = ["artifactKind", "schemaVersion", "stateChangeClaimId", "source", "stateChangeDescription"] as const;
const humanSourceKeys = ["origin", "actorId"] as const;
const stateSourceKeys = ["origin", "stateReference"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const idPattern = /^DSCC_[0-9A-F]{24}$/;

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

function reference(value: unknown, code: string): { producerId: string; authorityContractId: string; artifactId: string; locator: string } {
  const captured = exact(value, referenceKeys, code);
  const values = referenceKeys.map((key) => captured[key]);
  if (values.some((entry) => typeof entry !== "string" || entry.trim().length === 0)) return fail(code);
  return {
    producerId: captured.producerId as string,
    authorityContractId: captured.authorityContractId as string,
    artifactId: captured.artifactId as string,
    locator: captured.locator as string
  };
}

function source(value: unknown, trimHumanActor: boolean, sourceCode: string, referenceCode: string): StateChangeClaimSource {
  const captured = dataObject(value, sourceCode);
  if (typeof captured.origin !== "string") return fail(sourceCode);
  if (captured.origin === "HUMAN_INPUT") {
    const human = exact(captured, humanSourceKeys, sourceCode);
    if (typeof human.actorId !== "string") return fail(sourceCode);
    const actorId = trimHumanActor ? human.actorId.trim() : human.actorId;
    if (actorId.length === 0 || (!trimHumanActor && actorId !== human.actorId.trim())) return fail(sourceCode);
    return { origin: "HUMAN_INPUT", actorId };
  }
  if (captured.origin === "AUTHORITATIVE_STATE") {
    const state = exact(captured, stateSourceKeys, sourceCode);
    return { origin: "AUTHORITATIVE_STATE", stateReference: reference(state.stateReference, referenceCode) };
  }
  return fail(sourceCode);
}

function description(value: unknown, trim: boolean, code: string): string {
  if (typeof value !== "string") return fail(code);
  const result = trim ? value.trim() : value;
  if (result.length === 0 || (!trim && result !== value.trim())) return fail(code);
  return result;
}

function canonicalSource(source: StateChangeClaimSource): readonly ["HUMAN_INPUT", string] | readonly ["AUTHORITATIVE_STATE", readonly [string, string, string, string]] {
  if (source.origin === "HUMAN_INPUT") return ["HUMAN_INPUT", source.actorId];
  return ["AUTHORITATIVE_STATE", [source.stateReference.producerId, source.stateReference.authorityContractId, source.stateReference.artifactId, source.stateReference.locator]];
}

function claimId(source: StateChangeClaimSource, stateChangeDescription: string): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      STATE_CHANGE_CLAIM_SCHEMA_VERSION,
      canonicalSource(source),
      stateChangeDescription
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DSCC_${digest}`;
}

function construct(source: StateChangeClaimSource, stateChangeDescription: string): StateChangeClaim {
  return {
    artifactKind: "STATE_CHANGE_CLAIM",
    schemaVersion: STATE_CHANGE_CLAIM_SCHEMA_VERSION,
    stateChangeClaimId: claimId(source, stateChangeDescription),
    source,
    stateChangeDescription
  };
}

export function createStateChangeClaim(input: StateChangeClaimInput): StateChangeClaim {
  const captured = exact(input, inputKeys, "ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID");
  const claimSource = source(captured.source, true, "ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID", "ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID");
  const stateChangeDescription = description(captured.stateChangeDescription, true, "ERR_DECISION_STATE_CHANGE_CLAIM_DESCRIPTION_INVALID");
  const claim = construct(claimSource, stateChangeDescription);
  assertStateChangeClaim(claim);
  return structuredClone(claim);
}

export function assertStateChangeClaim(value: unknown): asserts value is StateChangeClaim {
  const invalid = "ERR_DECISION_STATE_CHANGE_CLAIM_INVALID";
  try {
    const claim = exact(value, claimKeys, invalid);
    if (claim.artifactKind !== "STATE_CHANGE_CLAIM" || claim.schemaVersion !== STATE_CHANGE_CLAIM_SCHEMA_VERSION || typeof claim.stateChangeClaimId !== "string" || !idPattern.test(claim.stateChangeClaimId)) fail(invalid);
    const claimSource = source(claim.source, false, invalid, invalid);
    const stateChangeDescription = description(claim.stateChangeDescription, false, invalid);
    if (claim.stateChangeClaimId !== claimId(claimSource, stateChangeDescription)) fail("ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
