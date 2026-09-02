/** Immutable Role × resolved Organization relational state; it is not verification, matching, or authority. */
export interface TargetRoleOrganizationBindingRevision {
  targetRoleOrganizationBindingRevisionId: string;
  targetRoleEntityId: string;
  targetRoleSourceBindingRevisionId: string;
  /** Exact Organization revision; its resolved stable entity supplies chain continuity. */
  targetOrganizationRevisionId: string;
  /** Immediate immutable predecessor only; forks never select a head. */
  previousRevisionId: string | null;
  schemaVersion: string;
  createdAt: string;
}
export type TargetRoleOrganizationBindingRevisionInput = Omit<TargetRoleOrganizationBindingRevision, "targetRoleOrganizationBindingRevisionId">;
