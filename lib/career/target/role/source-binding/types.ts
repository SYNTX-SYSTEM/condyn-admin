/**
 * Immutable relational state for a Role and one exact Source revision. It is not verification,
 * matching, qualification, recommendation, or authority, and deliberately has no binding entity.
 */
export interface TargetRoleSourceBindingRevision {
  targetRoleSourceBindingRevisionId: string;
  targetRoleEntityId: string;
  /** Exact immutable Source state; its resolved Source Entity supplies continuity. */
  targetSourceRevisionId: string;
  /** Exact immutable lineage only; forks are valid and never imply current/latest/head authority. */
  previousRevisionId: string | null;
  schemaVersion: string;
  /** Audit metadata only; it never selects a binding revision. */
  createdAt: string;
}

export type TargetRoleSourceBindingRevisionInput = Omit<
  TargetRoleSourceBindingRevision,
  "targetRoleSourceBindingRevisionId"
>;
