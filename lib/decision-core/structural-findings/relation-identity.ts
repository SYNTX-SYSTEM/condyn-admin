import { createHash } from "node:crypto";
import type { DecisionContextItemProvenance } from "../context";
import type { StructuralRelationProposalKind } from "./relation-types";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const canonicalStructuralRelationProvenance = (provenance: DecisionContextItemProvenance): unknown[] => {
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

export const structuralRelationReferenceKey = (reference: { producerId: string; authorityContractId: string; artifactId: string; locator: string }): string => JSON.stringify([
  reference.producerId,
  reference.authorityContractId,
  reference.artifactId,
  reference.locator
]);

export const buildStructuralRelationProposalId = (
  contextId: string,
  kind: StructuralRelationProposalKind,
  canonicalRelationBody: [string, string],
  provenance: DecisionContextItemProvenance
): string => `DREL_${sha256([
  "STRUCTURAL_RELATION_PROPOSAL_V1",
  contextId,
  kind,
  canonicalRelationBody,
  canonicalStructuralRelationProvenance(provenance)
]).slice(0, 24).toUpperCase()}`;
