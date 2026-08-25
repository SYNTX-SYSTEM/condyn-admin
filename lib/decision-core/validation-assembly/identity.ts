import { createHash } from "node:crypto";
import type { StructuralExpectationValidationResult } from "./types";

const sha256 = (value: unknown): string => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

export const compareDecisionContextValidationAssemblyStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

export const buildDecisionContextValidationAssemblyId = (
  contextId: string,
  expectationResults: readonly StructuralExpectationValidationResult[],
  consequenceIds: readonly string[]
): string => `DVASM_${sha256([
  "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1",
  contextId,
  expectationResults,
  consequenceIds
]).slice(0, 24).toUpperCase()}`;
