import { createHash } from "node:crypto";
import { assertDecisionProposalCoherenceValidation, type DecisionProposalCoherenceValidation } from "../proposal-coherence";
import {
  HUMAN_DECISION_DECLARATION_SCHEMA_VERSION,
  type HumanDecisionActor,
  type HumanDecisionDeclaration,
  type HumanDecisionDeclarationInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decidedBy", "chosenOptionItemIds", "rationale"] as const;
const declarationKeys = ["artifactKind", "schemaVersion", "humanDecisionId", "proposalCoherenceValidation", "decidedBy", "chosenOptionItemIds", "rationale"] as const;
const actorKeys = ["origin", "actorId"] as const;
const idPattern = /^DHDEC_[0-9A-F]{24}$/;
const itemPattern = /^DCI_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const length = Reflect.getOwnPropertyDescriptor(value, "length")?.value;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
          result.push(capture(descriptor.value, code, ancestors));
        }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail(code);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
        Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true });
      }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort(compare)) result[key] = canonical(value[key]);
  return result;
}

function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function captureValidation(value: unknown, code: string): DecisionProposalCoherenceValidation {
  try {
    const validation = capture(value, code) as unknown as DecisionProposalCoherenceValidation;
    assertDecisionProposalCoherenceValidation(validation);
    return validation;
  } catch { return fail(code); }
}

function actor(value: unknown, trim: boolean, code: string): HumanDecisionActor {
  const captured = exact(value, actorKeys, code);
  if (captured.origin !== "HUMAN_INPUT" || typeof captured.actorId !== "string") return fail(code);
  const actorId = trim ? captured.actorId.trim() : captured.actorId;
  if (actorId.length === 0 || (!trim && actorId !== captured.actorId.trim())) return fail(code);
  return { origin: "HUMAN_INPUT", actorId };
}

function rationale(value: unknown, trim: boolean, code: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return fail(code);
  const result = trim ? value.trim() : value;
  if (result.length === 0 || (!trim && result !== value.trim())) return fail(code);
  return result;
}

function optionIds(value: unknown, code: { input: string; id: string }): string[] {
  const captured = capture(value, code.input);
  if (!Array.isArray(captured) || captured.length === 0 || captured.some((item) => typeof item !== "string")) return fail(code.input);
  for (const item of captured) if (!itemPattern.test(item as string)) fail(code.id);
  return captured as string[];
}

function validateOptions(validation: DecisionProposalCoherenceValidation, values: readonly string[], code: { id: string; missing: string; role: string; duplicate: string }): void {
  const items = validation.recommendationProposal.assessmentProposal.assessmentBasis.revision.context.items;
  const seen = new Set<string>();
  for (const value of values) {
    if (!itemPattern.test(value)) fail(code.id);
    const item = items.find((candidate) => candidate.itemId === value);
    if (item === undefined) {
      fail(code.missing);
    } else if (item.role !== "OPTION") {
      fail(code.role);
    }
    if (seen.has(value)) fail(code.duplicate);
    seen.add(value);
  }
}

function decisionId(validation: DecisionProposalCoherenceValidation, decidedBy: HumanDecisionActor, chosenOptionItemIds: readonly string[], decisionRationale: string | null): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      HUMAN_DECISION_DECLARATION_SCHEMA_VERSION,
      canonical(validation as unknown as Captured),
      ["HUMAN_INPUT", decidedBy.actorId],
      chosenOptionItemIds,
      decisionRationale
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DHDEC_${digest}`;
}

function construct(validation: DecisionProposalCoherenceValidation, decidedBy: HumanDecisionActor, chosenOptionItemIds: readonly string[], decisionRationale: string | null): HumanDecisionDeclaration {
  const ordered = [...chosenOptionItemIds].sort(compare);
  return {
    artifactKind: "HUMAN_DECISION_DECLARATION",
    schemaVersion: HUMAN_DECISION_DECLARATION_SCHEMA_VERSION,
    humanDecisionId: decisionId(validation, decidedBy, ordered, decisionRationale),
    proposalCoherenceValidation: validation,
    decidedBy,
    chosenOptionItemIds: ordered,
    rationale: decisionRationale
  };
}

export function createHumanDecisionDeclaration(proposalCoherenceValidation: DecisionProposalCoherenceValidation, input: HumanDecisionDeclarationInput): HumanDecisionDeclaration {
  const validation = captureValidation(proposalCoherenceValidation, "ERR_DECISION_HUMAN_DECISION_PROPOSAL_COHERENCE_INVALID");
  const captured = exact(input, inputKeys, "ERR_DECISION_HUMAN_DECISION_INPUT_INVALID");
  const decidedBy = actor(captured.decidedBy, true, "ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID");
  const chosenOptionItemIds = optionIds(captured.chosenOptionItemIds, { input: "ERR_DECISION_HUMAN_DECISION_INPUT_INVALID", id: "ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID" });
  const decisionRationale = rationale(captured.rationale, true, "ERR_DECISION_HUMAN_DECISION_RATIONALE_INVALID");
  validateOptions(validation, chosenOptionItemIds, { id: "ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID", missing: "ERR_DECISION_HUMAN_DECISION_OPTION_NOT_FOUND", role: "ERR_DECISION_HUMAN_DECISION_OPTION_ROLE_MISMATCH", duplicate: "ERR_DECISION_HUMAN_DECISION_DUPLICATE_OPTION" });
  const declaration = construct(validation, decidedBy, chosenOptionItemIds, decisionRationale);
  assertHumanDecisionDeclaration(declaration);
  return structuredClone(declaration);
}

export function assertHumanDecisionDeclaration(value: unknown): asserts value is HumanDecisionDeclaration {
  const invalid = "ERR_DECISION_HUMAN_DECISION_INVALID";
  try {
    const declaration = exact(value, declarationKeys, invalid);
    if (declaration.artifactKind !== "HUMAN_DECISION_DECLARATION" || declaration.schemaVersion !== HUMAN_DECISION_DECLARATION_SCHEMA_VERSION || typeof declaration.humanDecisionId !== "string" || !idPattern.test(declaration.humanDecisionId)) fail(invalid);
    const validation = captureValidation(declaration.proposalCoherenceValidation, invalid);
    const decidedBy = actor(declaration.decidedBy, false, invalid);
    const chosenOptionItemIds = optionIds(declaration.chosenOptionItemIds, { input: invalid, id: invalid });
    const decisionRationale = rationale(declaration.rationale, false, invalid);
    validateOptions(validation, chosenOptionItemIds, { id: invalid, missing: invalid, role: invalid, duplicate: invalid });
    const ordered = [...chosenOptionItemIds].sort(compare);
    if (JSON.stringify(chosenOptionItemIds) !== JSON.stringify(ordered)) fail(invalid);
    if (declaration.humanDecisionId !== decisionId(validation, decidedBy, chosenOptionItemIds, decisionRationale)) fail("ERR_DECISION_HUMAN_DECISION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_HUMAN_DECISION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
