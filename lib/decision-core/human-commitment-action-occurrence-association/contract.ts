import { createHash } from "node:crypto";
import { assertActionOccurrenceClaim, type ActionOccurrenceClaim } from "../action-occurrence-claim";
import { assertHumanCommitment, type HumanCommitment } from "../human-commitment";
import {
  HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,
  type HumanCommitmentActionOccurrenceAssociationProposal,
  type HumanCommitmentActionOccurrenceAssociationProposalInput,
  type HumanCommitmentActionOccurrenceAssociationProvenance
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["humanCommitment", "actionOccurrenceClaim", "provenance"] as const;
const proposalKeys = ["artifactKind", "schemaVersion", "humanCommitmentActionOccurrenceAssociationProposalId", "humanCommitment", "actionOccurrenceClaim", "provenance"] as const;
const humanProvenanceKeys = ["origin", "actorId"] as const;
const modelProvenanceKeys = ["origin", "proposalRef"] as const;
const stateProvenanceKeys = ["origin", "stateReference"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const idPattern = /^DHCAOA_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

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

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort(compare)) result[key] = canonical(value[key]);
  return result;
}

function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function commitment(value: unknown, code: string): HumanCommitment {
  try {
    const captured = capture(value, code) as unknown as HumanCommitment;
    assertHumanCommitment(captured);
    return captured;
  } catch { return fail(code); }
}

function occurrence(value: unknown, code: string): ActionOccurrenceClaim {
  try {
    const captured = capture(value, code) as unknown as ActionOccurrenceClaim;
    assertActionOccurrenceClaim(captured);
    return captured;
  } catch { return fail(code); }
}

function reference(value: unknown, code: string): { producerId: string; authorityContractId: string; artifactId: string; locator: string } {
  const captured = exact(value, referenceKeys, code);
  const values = referenceKeys.map((key) => captured[key]);
  if (values.some((entry) => typeof entry !== "string" || entry.trim().length === 0)) return fail(code);
  return { producerId: captured.producerId as string, authorityContractId: captured.authorityContractId as string, artifactId: captured.artifactId as string, locator: captured.locator as string };
}

function provenance(value: unknown, trimLocal: boolean, provenanceCode: string, referenceCode: string): HumanCommitmentActionOccurrenceAssociationProvenance {
  const captured = dataObject(value, provenanceCode);
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

function proposalId(humanCommitment: HumanCommitment, actionOccurrenceClaim: ActionOccurrenceClaim, capturedProvenance: HumanCommitmentActionOccurrenceAssociationProvenance): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,
      canonical(humanCommitment as unknown as Captured),
      canonical(actionOccurrenceClaim as unknown as Captured),
      canonical(capturedProvenance as unknown as Captured)
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DHCAOA_${digest}`;
}

function construct(humanCommitment: HumanCommitment, actionOccurrenceClaim: ActionOccurrenceClaim, capturedProvenance: HumanCommitmentActionOccurrenceAssociationProvenance): HumanCommitmentActionOccurrenceAssociationProposal {
  return {
    artifactKind: "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL",
    schemaVersion: HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,
    humanCommitmentActionOccurrenceAssociationProposalId: proposalId(humanCommitment, actionOccurrenceClaim, capturedProvenance),
    humanCommitment,
    actionOccurrenceClaim,
    provenance: capturedProvenance
  };
}

export function createHumanCommitmentActionOccurrenceAssociationProposal(input: HumanCommitmentActionOccurrenceAssociationProposalInput): HumanCommitmentActionOccurrenceAssociationProposal {
  const captured = exact(input, inputKeys, "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INPUT_INVALID");
  const humanCommitment = commitment(captured.humanCommitment, "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_HUMAN_COMMITMENT_INVALID");
  const actionOccurrenceClaim = occurrence(captured.actionOccurrenceClaim, "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ACTION_OCCURRENCE_CLAIM_INVALID");
  const capturedProvenance = provenance(captured.provenance, true, "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROVENANCE_INVALID", "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_REFERENCE_INVALID");
  const proposal = construct(humanCommitment, actionOccurrenceClaim, capturedProvenance);
  assertHumanCommitmentActionOccurrenceAssociationProposal(proposal);
  return structuredClone(proposal);
}

export function assertHumanCommitmentActionOccurrenceAssociationProposal(value: unknown): asserts value is HumanCommitmentActionOccurrenceAssociationProposal {
  const invalid = "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INVALID";
  try {
    const proposal = exact(value, proposalKeys, invalid);
    if (proposal.artifactKind !== "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL" || proposal.schemaVersion !== HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION || typeof proposal.humanCommitmentActionOccurrenceAssociationProposalId !== "string" || !idPattern.test(proposal.humanCommitmentActionOccurrenceAssociationProposalId)) fail(invalid);
    const humanCommitment = commitment(proposal.humanCommitment, invalid);
    const actionOccurrenceClaim = occurrence(proposal.actionOccurrenceClaim, invalid);
    const capturedProvenance = provenance(proposal.provenance, false, invalid, invalid);
    if (proposal.humanCommitmentActionOccurrenceAssociationProposalId !== proposalId(humanCommitment, actionOccurrenceClaim, capturedProvenance)) fail("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
