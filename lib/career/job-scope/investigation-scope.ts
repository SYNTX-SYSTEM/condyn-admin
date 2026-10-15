import type { CapabilityInvestigationScope } from "../capability-core/discovery/types";
import { assertIssuedJobScope, type ResolvedJobScope } from "./scope";

/**
 * Renders an issued job scope as the Discovery investigation scope: the selection, the role with its description,
 * every requirement and the persisted canonical mapping. Pool lines are taken verbatim from the issued scope
 * (JOB_POOL_SOURCE_RENDERING_V1); identifiers are JSON-quoted. Deterministic, so equal scopes hash equally.
 */
export function renderInvestigationScope(scope: ResolvedJobScope): CapabilityInvestigationScope {
  assertIssuedJobScope(scope);
  const q = JSON.stringify;
  const lines = [
    `JOB_POOL_UPLOAD_ID: ${q(scope.selection.jobPoolUploadId)}`,
    `POOL: ${q(scope.poolId)} VERSION ${scope.poolVersion} CANONICAL_SHA256 ${scope.poolCanonicalSha256}`,
    `SELECTED_ROLE_ID: ${q(scope.selection.poolRoleId)}`,
    `ROLE MAPPING: TARGET_ROLE_PROFILE_REVISION_ID ${q(scope.roleMapping.targetRoleProfileRevisionId)} TARGET_ROLE_ENTITY_ID ${q(scope.roleMapping.targetRoleEntityId)}`,
    ...scope.scopeLines,
    ...scope.requirements.map(({ poolRequirement, mapping }) =>
      `REQUIREMENT ${poolRequirement.id} MAPPING: TARGET_REQUIREMENT_REVISION_ID ${q(mapping.targetRequirementRevisionId)} NECESSITY_STATE ${mapping.necessityState} MATCHING_ELIGIBILITY ${mapping.matchingEligibility}`)
  ];
  return { text: lines.join("\n") };
}
