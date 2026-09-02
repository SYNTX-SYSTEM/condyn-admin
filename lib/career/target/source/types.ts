export interface TargetSourceEntity {
  targetSourceEntityId: string;
}

export interface TargetSourceRevision {
  targetSourceRevisionId: string;
  targetSourceEntityId: string;
  previousRevisionId: string | null;
  sourceKind: string;
  sourceLocator: string;
  rawContentHash: string;
  normalizedContentHash: string;
  normalizedContent: string;
  normalizationVersion: string;
  schemaVersion: string;
  createdAt: string;
}

export type TargetSourceRevisionInput = Omit<
  TargetSourceRevision,
  "targetSourceRevisionId"
>;
