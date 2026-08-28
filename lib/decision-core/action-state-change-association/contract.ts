import { createHash } from "node:crypto";
import {
  assertActionOccurrenceClaim,
  type ActionOccurrenceClaim
} from "../action-occurrence-claim";
import {
  assertStateChangeClaim,
  type StateChangeClaim
} from "../state-change-claim";
import {
  ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,
  type ActionStateChangeAssociationProposal,
  type ActionStateChangeAssociationProposalInput,
  type ActionStateChangeAssociationProvenance
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["actionOccurrenceClaim", "stateChangeClaim", "provenance"] as const;
const proposalKeys = ["artifactKind", "schemaVersion", "actionStateChangeAssociationProposalId", "actionOccurrenceClaim", "stateChangeClaim", "provenance"] as const;
const humanProvenanceKeys = ["origin", "actorId"] as const;
const modelProvenanceKeys = ["origin", "proposalRef"] as const;
const stateProvenanceKeys = ["origin", "stateReference"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const idPattern = /^DASCA_[0-9A-F]{24}$/;

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

function provenance(value: unknown, trimLocal: boolean, provenanceCode: string, referenceCode: string): ActionStateChangeAssociationProvenance {
  const captured = dataObject(value, provenanceCode);
  if (typeof captured.origin !== "string") return fail(provenanceCode);
  if (captured.origin === "HUMAN_INPUT") {
    const human = exact(captured, humanProvenanceKeys, provenanceCode);
    if (typeof human.actorId !== "string") return fail(provenanceCode);
    const actorId = trimLocal ? human.actorId.trim() : human.actorId;
    if (actorId.length === 0 || (!trimLocal && actorId !== human.actorId.trim())) return fail(provenanceCode);
    return { origin: "HUMAN_INPUT", actorId };
  }
  if (captured.origin === "MODEL_PROPOSAL") {
    const model = exact(captured, modelProvenanceKeys, provenanceCode);
    if (typeof model.proposalRef !== "string") return fail(provenanceCode);
    const proposalRef = trimLocal ? model.proposalRef.trim() : model.proposalRef;
    if (proposalRef.length === 0 || (!trimLocal && proposalRef !== model.proposalRef.trim())) return fail(provenanceCode);
    return { origin: "MODEL_PROPOSAL", proposalRef };
  }
  if (captured.origin === "AUTHORITATIVE_STATE") {
    const state = exact(captured, stateProvenanceKeys, provenanceCode);
    return { origin: "AUTHORITATIVE_STATE", stateReference: reference(state.stateReference, referenceCode) };
  }
  return fail(provenanceCode);
}

function actionClaim(value: unknown, code: string): ActionOccurrenceClaim {
  try {
    assertActionOccurrenceClaim(value);
    return structuredClone(value);
  } catch { return fail(code); }
}

function stateClaim(value: unknown, code: string): StateChangeClaim {
  try {
    assertStateChangeClaim(value);
    return structuredClone(value);
  } catch { return fail(code); }
}

function canonicalProvenance(provenance: ActionStateChangeAssociationProvenance): readonly ["HUMAN_INPUT", string] | readonly ["MODEL_PROPOSAL", string] | readonly ["AUTHORITATIVE_STATE", readonly [string, string, string, string]] {
  if (provenance.origin === "HUMAN_INPUT") return ["HUMAN_INPUT", provenance.actorId];
  if (provenance.origin === "MODEL_PROPOSAL") return ["MODEL_PROPOSAL", provenance.proposalRef];
  return ["AUTHORITATIVE_STATE", [provenance.stateReference.producerId, provenance.stateReference.authorityContractId, provenance.stateReference.artifactId, provenance.stateReference.locator]];
}

function associationId(actionOccurrenceClaim: ActionOccurrenceClaim, stateChangeClaim: StateChangeClaim, provenance: ActionStateChangeAssociationProvenance): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,
      actionOccurrenceClaim.actionOccurrenceClaimId,
      stateChangeClaim.stateChangeClaimId,
      canonicalProvenance(provenance)
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DASCA_${digest}`;
}

function construct(actionOccurrenceClaim: ActionOccurrenceClaim, stateChangeClaim: StateChangeClaim, provenance: ActionStateChangeAssociationProvenance): ActionStateChangeAssociationProposal {
  return {
    artifactKind: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL",
    schemaVersion: ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,
    actionStateChangeAssociationProposalId: associationId(actionOccurrenceClaim, stateChangeClaim, provenance),
    actionOccurrenceClaim,
    stateChangeClaim,
    provenance
  };
}

export function createActionStateChangeAssociationProposal(input: ActionStateChangeAssociationProposalInput): ActionStateChangeAssociationProposal {
  const captured = exact(input, inputKeys, "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID");
  const actionOccurrenceClaim = actionClaim(captured.actionOccurrenceClaim, "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID");
  const stateChangeClaim = stateClaim(captured.stateChangeClaim, "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID");
  const capturedProvenance = provenance(captured.provenance, true, "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID");
  const proposal = construct(actionOccurrenceClaim, stateChangeClaim, capturedProvenance);
  assertActionStateChangeAssociationProposal(proposal);
  return structuredClone(proposal);
}

export function assertActionStateChangeAssociationProposal(value: unknown): asserts value is ActionStateChangeAssociationProposal {
  const invalid = "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID";
  try {
    const proposal = exact(value, proposalKeys, invalid);
    if (proposal.artifactKind !== "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL" || proposal.schemaVersion !== ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION || typeof proposal.actionStateChangeAssociationProposalId !== "string" || !idPattern.test(proposal.actionStateChangeAssociationProposalId)) fail(invalid);
    const actionOccurrenceClaim = actionClaim(proposal.actionOccurrenceClaim, invalid);
    const stateChangeClaim = stateClaim(proposal.stateChangeClaim, invalid);
    const capturedProvenance = provenance(proposal.provenance, false, invalid, invalid);
    if (proposal.actionStateChangeAssociationProposalId !== associationId(actionOccurrenceClaim, stateChangeClaim, capturedProvenance)) fail("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
