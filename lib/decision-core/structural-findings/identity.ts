import { createHash } from "node:crypto";
import type { AuthoritativeStateReference } from "../authority";
import type { DecisionContextItemProvenance } from "../context";
import type { EvidenceBindingDisposition } from "../evidence-binding";
import type { StructuralExpectationKind } from "./types";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const canonicalStructuralExpectationProvenance = (provenance: DecisionContextItemProvenance): unknown[] => {
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

export const structuralExpectationReferenceKey = (reference: AuthoritativeStateReference): string => JSON.stringify([
  reference.producerId,
  reference.authorityContractId,
  reference.artifactId,
  reference.locator
]);

export const buildStructuralExpectationId = (
  contextId: string,
  kind: StructuralExpectationKind,
  canonicalBody: unknown,
  provenance: DecisionContextItemProvenance
): string => `DEXP_${sha256([
  "STRUCTURAL_EXPECTATION_V1",
  contextId,
  kind,
  canonicalBody,
  canonicalStructuralExpectationProvenance(provenance)
]).slice(0, 24).toUpperCase()}`;

export type CanonicalEvidenceBindingExpectationBody = [string, EvidenceBindingDisposition[]];
export type CanonicalContextRoleExpectationBody = [string, number];
export type CanonicalDependencyExpectationBody = [string, string];
