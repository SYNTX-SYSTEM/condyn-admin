import { createHash } from "node:crypto";
import type { TargetSourceRevisionInput } from "./types";

/** createdAt is deliberately excluded: it is audit metadata, never identity. */
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
