/**
 * Stable identity, deliberately separate from descriptive state. Provider output, source mentions,
 * legacy org IDs, and demo-company IDs are never Target Organization identity authority.
 */
export interface TargetOrganizationEntity {
  targetOrganizationEntityId: string;
}

/**
 * Immutable descriptive state for one entity. DECLARED_NAME is neither legal, canonical, nor
 * verified identity proof; equal or different descriptors never resolve entity identity.
 */
export interface TargetOrganizationRevision {
  targetOrganizationRevisionId: string;
  targetOrganizationEntityId: string;
  /** Exact immutable predecessor. Forks are valid; this relation never selects a head. */
  previousRevisionId: string | null;
  organizationDescriptor: string;
  descriptorKind: string;
  schemaVersion: string;
  /** Audit metadata only, excluded from revision identity and selection authority. */
  createdAt: string;
}

export type TargetOrganizationRevisionInput = Omit<
  TargetOrganizationRevision,
  "targetOrganizationRevisionId"
>;
