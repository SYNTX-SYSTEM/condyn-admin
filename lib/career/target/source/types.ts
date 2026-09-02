/** Stable Target Source identity; it is deliberately distinct from any source state. */
export interface TargetSourceEntity {
  targetSourceEntityId: string;
}

/**
 * Immutable canonical source state bound to one stable entity. A changed state creates
 * another revision; this model does not select a current, latest, or authoritative one.
 */
export interface TargetSourceRevision {
  targetSourceRevisionId: string;
  targetSourceEntityId: string;
  /** Caller-supplied immediate predecessor. Forks are legitimate and do not imply a head. */
  previousRevisionId: string | null;
  sourceKind: string;
  sourceLocator: string;
  /** Integrity and canonical-state inputs only; equal hashes do not establish semantic authority. */
  rawContentHash: string;
  normalizedContentHash: string;
  normalizedContent: string;
  normalizationVersion: string;
  schemaVersion: string;
  /** Audit metadata only; it is neither revision identity nor an ordering or authority signal. */
  createdAt: string;
}

export type TargetSourceRevisionInput = Omit<
  TargetSourceRevision,
  "targetSourceRevisionId"
>;
