import { createHash } from "node:crypto";
import { canonicalizeTargetRoleProfilePayload, stableTargetRoleProfileJson } from "./canonicalize";
import type { TargetRoleProfileRevisionInput } from "./types";

/** Artifact/run identity is deliberately absent: this identifies semantic revision state only. */
export function deriveTargetRoleProfileRevisionId(input: TargetRoleProfileRevisionInput): string {
  const profile = canonicalizeTargetRoleProfilePayload(input.profile);
  return `TRPREV_${createHash("sha256").update(stableTargetRoleProfileJson([
    "TARGET_ROLE_PROFILE_REVISION_V1", input.targetRoleEntityId,
    input.targetRoleOrganizationBindingRevisionId, input.previousRevisionId, profile,
    input.proposalState, input.sourceEvidenceState, input.semanticValidationState,
    input.authorityState, input.schemaVersion
  ]), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}
