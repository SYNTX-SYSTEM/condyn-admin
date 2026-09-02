import { createHash } from "node:crypto";
import type { TargetSourceRevisionInput } from "./types";

/**
 * Canonical state inputs deterministically identify an immutable revision. createdAt is
 * deliberately excluded: audit metadata must never imply ordering or authority.
 */
export function deriveTargetSourceRevisionId(input: TargetSourceRevisionInput): string {
  const canonicalIdentity = [
    "TARGET_SOURCE_REVISION_V1",
    input.targetSourceEntityId,
    input.previousRevisionId,
    input.sourceKind,
    input.sourceLocator,
    input.rawContentHash,
    input.normalizedContentHash,
    input.normalizedContent,
    input.normalizationVersion,
    input.schemaVersion
  ];
  return `TSREV_${createHash("sha256")
    .update(JSON.stringify(canonicalIdentity), "utf8")
    .digest("hex")
    .slice(0, 32)
    .toUpperCase()}`;
}
