import { createHash } from "node:crypto";
import type { TargetRoleOrganizationBindingRevisionInput } from "./types";
export function deriveTargetRoleOrganizationBindingRevisionId(input: TargetRoleOrganizationBindingRevisionInput): string {
  // createdAt is audit metadata and deliberately absent from canonical revision identity.
  return `TROBREV_${createHash("sha256").update(JSON.stringify([
    "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", input.targetRoleEntityId,
    input.targetRoleSourceBindingRevisionId, input.targetOrganizationRevisionId,
    input.previousRevisionId, input.schemaVersion
  ]), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}
