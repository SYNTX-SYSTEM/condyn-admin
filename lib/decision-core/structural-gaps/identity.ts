import { createHash } from "node:crypto";
import type { StructuralGapKind } from "./types";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const compareStructuralGapStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

export const buildStructuralGapId = (
  contextId: string,
  expectationId: string,
  kind: StructuralGapKind,
  canonicalGapBody: unknown
): string => `DGAP_${sha256([
  "STRUCTURAL_GAP_V1",
  contextId,
  expectationId,
  kind,
  canonicalGapBody
]).slice(0, 24).toUpperCase()}`;
