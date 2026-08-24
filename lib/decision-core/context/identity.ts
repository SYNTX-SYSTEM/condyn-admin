import { createHash } from "node:crypto";
import type { AuthoritativeStateReference } from "../authority";
import type { DecisionContextItemProvenance, DecisionContextItemRole } from "./types";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const compareDecisionContextStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

export const sourceStateReferenceKey = (reference: AuthoritativeStateReference): string => JSON.stringify([
  reference.producerId,
  reference.authorityContractId,
  reference.artifactId,
  reference.locator
]);

export const canonicalDecisionContextProvenance = (provenance: DecisionContextItemProvenance): unknown[] => {
  switch (provenance.origin) {
    case "AUTHORITATIVE_STATE":
      return [provenance.origin, [
        provenance.stateReference.producerId,
        provenance.stateReference.authorityContractId,
        provenance.stateReference.artifactId,
        provenance.stateReference.locator
      ]];
    case "HUMAN_INPUT":
      return [provenance.origin, provenance.actorId];
    case "MODEL_PROPOSAL":
      return [provenance.origin, provenance.proposalRef];
    case "DETERMINISTIC_DERIVATION":
      return [provenance.origin, provenance.ruleId];
  }
};

export const buildDecisionContextItemId = (
  role: DecisionContextItemRole,
  normalizedStatement: string,
  provenance: DecisionContextItemProvenance
): string => `DCI_${sha256([role, normalizedStatement, canonicalDecisionContextProvenance(provenance)]).slice(0, 24).toUpperCase()}`;

export const buildDecisionContextId = (
  schemaVersion: string,
  sourceStateReferences: AuthoritativeStateReference[],
  decisionQuestionId: string,
  itemIds: string[]
): string => `DCTX_${sha256([
  "DECISION_CONTEXT_DRAFT",
  schemaVersion,
  sourceStateReferences.map(sourceStateReferenceKey),
  decisionQuestionId,
  itemIds
]).slice(0, 24).toUpperCase()}`;
