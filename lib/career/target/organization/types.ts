export interface TargetOrganizationEntity {
  targetOrganizationEntityId: string;
}

export interface TargetOrganizationRevision {
  targetOrganizationRevisionId: string;
  targetOrganizationEntityId: string;
  previousRevisionId: string | null;
  organizationDescriptor: string;
  descriptorKind: string;
  schemaVersion: string;
  createdAt: string;
}

export type TargetOrganizationRevisionInput = Omit<
  TargetOrganizationRevision,
  "targetOrganizationRevisionId"
>;
