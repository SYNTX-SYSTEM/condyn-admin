import { createHash } from "node:crypto";
import type { TargetRoleSourceBindingRevisionInput } from "./types";

export function deriveTargetRoleSourceBindingRevisionId(
  input: TargetRoleSourceBindingRevisionInput
): string {
  // createdAt is deliberately absent: audit metadata is not immutable revision identity.
  const canonicalIdentity = [
    "TARGET_ROLE_SOURCE_BINDING_REVISION_V1",
    input.targetRoleEntityId,
    input.previousRevisionId,
    input.targetSourceRevisionId,
    input.schemaVersion
  ];
  return `TRSBREV_${createHash("sha256")
    .update(JSON.stringify(canonicalIdentity), "utf8")
    .digest("hex")
    .slice(0, 32)
    .toUpperCase()}`;
}
