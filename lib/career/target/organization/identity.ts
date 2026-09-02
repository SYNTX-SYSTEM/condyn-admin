import { createHash } from "node:crypto";
import type { TargetOrganizationRevisionInput } from "./types";

export function deriveTargetOrganizationRevisionId(input: TargetOrganizationRevisionInput): string {
  // Descriptive revision state determines this immutable ID; createdAt is intentionally absent.
  const canonicalIdentity = [
    "TARGET_ORGANIZATION_REVISION_V1",
    input.targetOrganizationEntityId,
    input.previousRevisionId,
    input.organizationDescriptor,
    input.descriptorKind,
    input.schemaVersion
  ];
  return `TOREV_${createHash("sha256")
    .update(JSON.stringify(canonicalIdentity), "utf8")
    .digest("hex")
    .slice(0, 32)
    .toUpperCase()}`;
}
