/** Canonicalized role-level proposal state. Requirements remain a downstream revision layer. */
export interface TargetRoleProfileSemanticPayload {
  roleDescriptor: string | null;
  roleSemanticDefinition: string;
  responsibilityScope: string | null;
  seniorityInterpretation: string | null;
  domainContext: string | null;
}

/** Immutable proposal state, not semantic verification, matching, or role authority. */
export interface TargetRoleProfileRevision {
  targetRoleProfileRevisionId: string;
  targetRoleEntityId: string;
  targetRoleOrganizationBindingRevisionId: string;
  previousRevisionId: string | null;
  profile: TargetRoleProfileSemanticPayload;
  proposalState: "PROPOSAL_ONLY";
  sourceEvidenceState: "SOURCE_MATCH_VERIFIED";
  semanticValidationState: "NOT_RUN";
  authorityState: "NONE";
  schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1";
  createdAt: string;
}
export type TargetRoleProfileRevisionInput = Omit<TargetRoleProfileRevision, "targetRoleProfileRevisionId">;
