import { createHash } from "node:crypto";
import {
  assertOutcomeAttributionProposal,
  type OutcomeAttributionProposal
} from "../outcome-attribution-proposal";
import {
  DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION,
  type DecisionContextObservationProposal,
  type DecisionContextObservationProposalInput,
  type DecisionContextObservationProposalProvenance
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["outcomeAttributionProposal", "statement", "provenance"] as const;
const proposalKeys = ["artifactKind", "schemaVersion", "decisionContextObservationProposalId", "outcomeAttributionProposal", "statement", "provenance"] as const;
const humanProvenanceKeys = ["origin", "actorId"] as const;
const modelProvenanceKeys = ["origin", "proposalRef"] as const;
const stateProvenanceKeys = ["origin", "stateReference"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const idPattern = /^DCOP_[0-9A-F]{24}$/;

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

function provenance(value: unknown, trimLocal: boolean, provenanceCode: string, referenceCode: string): DecisionContextObservationProposalProvenance {
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

function outcomeAttributionProposal(value: unknown, code: string): OutcomeAttributionProposal {
  try {
    assertOutcomeAttributionProposal(value);
    return structuredClone(value);
  } catch { return fail(code); }
}

function statement(value: unknown, trim: boolean, code: string): string {
  if (typeof value !== "string") return fail(code);
  const captured = trim ? value.trim() : value;
  if (captured.length === 0 || (!trim && captured !== value.trim())) return fail(code);
  return captured;
}

function canonicalProvenance(provenance: DecisionContextObservationProposalProvenance): readonly ["HUMAN_INPUT", string] | readonly ["MODEL_PROPOSAL", string] | readonly ["AUTHORITATIVE_STATE", readonly [string, string, string, string]] {
  if (provenance.origin === "HUMAN_INPUT") return ["HUMAN_INPUT", provenance.actorId];
  if (provenance.origin === "MODEL_PROPOSAL") return ["MODEL_PROPOSAL", provenance.proposalRef];
  return ["AUTHORITATIVE_STATE", [provenance.stateReference.producerId, provenance.stateReference.authorityContractId, provenance.stateReference.artifactId, provenance.stateReference.locator]];
}

function observationId(outcomeAttributionProposal: OutcomeAttributionProposal, statement: string, provenance: DecisionContextObservationProposalProvenance): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION,
      outcomeAttributionProposal.outcomeAttributionProposalId,
      statement,
      canonicalProvenance(provenance)
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DCOP_${digest}`;
}

function construct(outcomeAttributionProposal: OutcomeAttributionProposal, statement: string, provenance: DecisionContextObservationProposalProvenance): DecisionContextObservationProposal {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_PROPOSAL",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION,
    decisionContextObservationProposalId: observationId(outcomeAttributionProposal, statement, provenance),
    outcomeAttributionProposal,
    statement,
    provenance
  };
}

export function createDecisionContextObservationProposal(input: DecisionContextObservationProposalInput): DecisionContextObservationProposal {
  const captured = exact(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID");
  const capturedOutcomeAttributionProposal = outcomeAttributionProposal(captured.outcomeAttributionProposal, "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID");
  const capturedStatement = statement(captured.statement, true, "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_STATEMENT_INVALID");
  const capturedProvenance = provenance(captured.provenance, true, "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID");
  const proposal = construct(capturedOutcomeAttributionProposal, capturedStatement, capturedProvenance);
  assertDecisionContextObservationProposal(proposal);
  return structuredClone(proposal);
}

export function assertDecisionContextObservationProposal(value: unknown): asserts value is DecisionContextObservationProposal {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID";
  try {
    const proposal = exact(value, proposalKeys, invalid);
    if (proposal.artifactKind !== "DECISION_CONTEXT_OBSERVATION_PROPOSAL" || proposal.schemaVersion !== DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION || typeof proposal.decisionContextObservationProposalId !== "string" || !idPattern.test(proposal.decisionContextObservationProposalId)) fail(invalid);
    const capturedOutcomeAttributionProposal = outcomeAttributionProposal(proposal.outcomeAttributionProposal, invalid);
    const capturedStatement = statement(proposal.statement, false, invalid);
    const capturedProvenance = provenance(proposal.provenance, false, invalid, invalid);
    if (proposal.decisionContextObservationProposalId !== observationId(capturedOutcomeAttributionProposal, capturedStatement, capturedProvenance)) fail("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
