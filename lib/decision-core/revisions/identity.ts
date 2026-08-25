import { createHash } from "node:crypto";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const buildDecisionContextRevisionId = (previousRevisionId: string | null, contextId: string, assemblyId: string): string => `DREV_${sha256([
  "DECISION_CONTEXT_REVISION_V1",
  previousRevisionId,
  contextId,
  assemblyId
]).slice(0, 24).toUpperCase()}`;

export const compareDecisionContextRevisionStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
