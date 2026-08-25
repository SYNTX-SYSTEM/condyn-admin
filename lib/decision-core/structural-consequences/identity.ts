import { createHash } from "node:crypto";

export const buildStructuralConsequenceId = (
  contextId: string,
  sourceGapId: string,
  dependencyPathRelationProposalIds: readonly string[]
): string => `DCONS_${createHash("sha256").update(JSON.stringify([
  "STRUCTURAL_CONSEQUENCE_V1",
  contextId,
  sourceGapId,
  dependencyPathRelationProposalIds
]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
