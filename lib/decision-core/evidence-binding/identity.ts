import { createHash } from "node:crypto";
import type { AuthoritativeStateReference } from "../authority";
import type { EvidenceBindingDisposition } from "./types";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const compareEvidenceBindingStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

export const canonicalEvidenceBindingReference = (reference: AuthoritativeStateReference): [string, string, string, string] => [
  reference.producerId,
  reference.authorityContractId,
  reference.artifactId,
  reference.locator
];

export const evidenceBindingTargetKey = (itemId: string, reference: AuthoritativeStateReference): string => JSON.stringify([
  itemId,
  canonicalEvidenceBindingReference(reference)
]);

/** Internal identity builder; public construction occurs only through the bound binder. */
export const buildSemanticEvidenceBindingId = (
  contextId: string,
  itemId: string,
  stateReference: AuthoritativeStateReference,
  disposition: EvidenceBindingDisposition
): string => `EBIND_${sha256([
  "SEMANTIC_EVIDENCE_BINDING_V1",
  contextId,
  itemId,
  canonicalEvidenceBindingReference(stateReference),
  disposition
]).slice(0, 24).toUpperCase()}`;
