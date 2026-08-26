import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as assessmentRequestModule from "../../../lib/decision-core/assessment-request";
import * as decisionCore from "../../../lib/decision-core";
import { assertDecisionAssessmentRequest, createDecisionAssessmentRequest, type DecisionAssessmentRequestInput } from "../../../lib/decision-core";

const revisionId = "DREV_0123456789ABCDEF01234567";
const alternateRevisionId = "DREV_FEDCBA9876543210FEDCBA98";
const questionId = "DCI_111111111111111111111111";
const alternateQuestionId = "DCI_888888888888888888888888";
const optionOne = "DCI_222222222222222222222222";
const optionTwo = "DCI_333333333333333333333333";
const objectiveOne = "DCI_444444444444444444444444";
const objectiveTwo = "DCI_555555555555555555555555";
const constraintOne = "DCI_666666666666666666666666";
const constraintTwo = "DCI_777777777777777777777777";

const input = (overrides: Partial<DecisionAssessmentRequestInput> = {}): DecisionAssessmentRequestInput => ({
  revisionId,
  requestedBy: { origin: "HUMAN_INPUT", actorId: "  human-1  " },
  decisionQuestionItemId: questionId,
  selectedOptionItemIds: [], selectedObjectiveItemIds: [], selectedConstraintItemIds: [], ...overrides
});
const completeInput = (overrides: Partial<DecisionAssessmentRequestInput> = {}): DecisionAssessmentRequestInput => input({
  requestedBy: { origin: "HUMAN_INPUT", actorId: "human-1" },
  selectedOptionItemIds: [optionOne], selectedObjectiveItemIds: [objectiveOne], selectedConstraintItemIds: [constraintOne], ...overrides
});
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const specifiers = (source: string): string[] => {
  const file = ts.createSourceFile("assessment-request.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS); const output: string[] = [];
  const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) output.push(node.moduleSpecifier.text); ts.forEachChild(node, visit); };
  visit(file); return output;
};
const publicSymbols = (filePath: string): string[] => {
  const program = ts.createProgram([filePath], { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true });
  const source = program.getSourceFile(filePath); if (source === undefined) throw new Error("missing source");
  const symbol = program.getTypeChecker().getSymbolAtLocation(source); if (symbol === undefined) throw new Error("missing module symbol");
  return program.getTypeChecker().getExportsOfModule(symbol).map((entry) => entry.getName()).sort();
};

describe("Decision Assessment Request", () => {
  it("constructs the minimal canonical request with empty selections and the exact DAREQ identity", () => {
    const value = createDecisionAssessmentRequest(input());
    expect(value).toEqual({ artifactKind: "DECISION_ASSESSMENT_REQUEST", schemaVersion: "DECISION_ASSESSMENT_REQUEST_V1", assessmentRequestId: `DAREQ_${createHash("sha256").update(JSON.stringify(["DECISION_ASSESSMENT_REQUEST_V1", revisionId, ["HUMAN_INPUT", "human-1"], questionId, [], [], []]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`, revisionId, requestedBy: { origin: "HUMAN_INPUT", actorId: "human-1" }, decisionQuestionItemId: questionId, selectedOptionItemIds: [], selectedObjectiveItemIds: [], selectedConstraintItemIds: [] });
    assertDecisionAssessmentRequest(value);
  });

  it("binds every DAREQ identity axis independently", () => {
    const baseline = createDecisionAssessmentRequest(completeInput());
    const changed = [
      createDecisionAssessmentRequest(completeInput({ requestedBy: { origin: "HUMAN_INPUT", actorId: "human-2" } })),
      createDecisionAssessmentRequest(completeInput({ revisionId: alternateRevisionId })),
      createDecisionAssessmentRequest(completeInput({ decisionQuestionItemId: alternateQuestionId })),
      createDecisionAssessmentRequest(completeInput({ selectedOptionItemIds: [optionTwo] })),
      createDecisionAssessmentRequest(completeInput({ selectedObjectiveItemIds: [objectiveTwo] })),
      createDecisionAssessmentRequest(completeInput({ selectedConstraintItemIds: [constraintTwo] }))
    ];
    for (const value of changed) expect(value.assessmentRequestId).not.toBe(baseline.assessmentRequestId);
  });

  it("canonicalizes non-semantic caller order while preserving DAREQ", () => {
    const left = createDecisionAssessmentRequest(input({ selectedOptionItemIds: [optionTwo, optionOne], selectedObjectiveItemIds: [objectiveTwo, objectiveOne], selectedConstraintItemIds: [constraintTwo, constraintOne] }));
    const right = createDecisionAssessmentRequest(input({ selectedOptionItemIds: [optionOne, optionTwo], selectedObjectiveItemIds: [objectiveOne, objectiveTwo], selectedConstraintItemIds: [constraintOne, constraintTwo] }));
    expect(left).toEqual(right);
    expect(left.selectedOptionItemIds).toEqual([optionOne, optionTwo]);
    expect(left.selectedObjectiveItemIds).toEqual([objectiveOne, objectiveTwo]);
    expect(left.selectedConstraintItemIds).toEqual([constraintOne, constraintTwo]);
  });

  it("rejects malformed references and declared human ownership", () => {
    expect(() => createDecisionAssessmentRequest(input({ revisionId: "DREV_lowercase00000000000000" }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_REVISION_ID_INVALID");
    expect(() => createDecisionAssessmentRequest(input({ decisionQuestionItemId: "not-an-item" }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ITEM_ID_INVALID");
    expect(() => createDecisionAssessmentRequest(input({ selectedOptionItemIds: ["DCI_NOT_AN_ID"] }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ITEM_ID_INVALID");
    expect(() => createDecisionAssessmentRequest(input({ requestedBy: { origin: "HUMAN_INPUT", actorId: " \t " } }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID");
    expect(() => createDecisionAssessmentRequest(input({ requestedBy: { origin: "OTHER", actorId: "human" } as never }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID");
  });

  it("rejects duplicate members independently within every declared category", () => {
    for (const value of [input({ selectedOptionItemIds: [optionOne, optionOne] }), input({ selectedObjectiveItemIds: [objectiveOne, objectiveOne] }), input({ selectedConstraintItemIds: [constraintOne, constraintOne] })]) expect(() => createDecisionAssessmentRequest(value)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION");
  });

  it("rejects cross-category duplicate classification independently", () => {
    for (const value of [input({ selectedOptionItemIds: [optionOne], selectedObjectiveItemIds: [optionOne] }), input({ selectedOptionItemIds: [optionOne], selectedConstraintItemIds: [optionOne] }), input({ selectedObjectiveItemIds: [objectiveOne], selectedConstraintItemIds: [objectiveOne] })]) expect(() => createDecisionAssessmentRequest(value)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION");
  });

  it("rejects decision-question reuse in every declared selection category", () => {
    for (const value of [input({ selectedOptionItemIds: [questionId] }), input({ selectedObjectiveItemIds: [questionId] }), input({ selectedConstraintItemIds: [questionId] })]) expect(() => createDecisionAssessmentRequest(value)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION");
  });

  it("enforces the exact defensive constructor input boundary without executing getters", () => {
    expect(() => createDecisionAssessmentRequest({ ...input(), unexpected: true } as never)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID");
    const missing = { ...input() }; delete (missing as Partial<DecisionAssessmentRequestInput>).revisionId;
    expect(() => createDecisionAssessmentRequest(missing as never)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID");
    let reads = 0; const accessor = { ...input() } as Record<string, unknown>;
    Object.defineProperty(accessor, "revisionId", { enumerable: true, get: () => { reads += 1; return revisionId; } });
    expect(() => createDecisionAssessmentRequest(accessor as never)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID"); expect(reads).toBe(0);
    const symbol = { ...input() }; Object.defineProperty(symbol, Symbol("hostile"), { enumerable: true, value: true });
    expect(() => createDecisionAssessmentRequest(symbol)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID");
    const hidden = { ...input() }; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    expect(() => createDecisionAssessmentRequest(hidden)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID");
  });

  it("defensively captures nested human ownership without executing actor getters", () => {
    let constructorReads = 0; const constructorActor = { origin: "HUMAN_INPUT" } as Record<string, unknown>;
    Object.defineProperty(constructorActor, "actorId", { enumerable: true, get: () => { constructorReads += 1; return "human-1"; } });
    expect(() => createDecisionAssessmentRequest(input({ requestedBy: constructorActor as never }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID"); expect(constructorReads).toBe(0);
    for (const mutate of [(actor: Record<string, unknown>) => Object.defineProperty(actor, "unexpected", { enumerable: true, value: true }), (actor: Record<string, unknown>) => Object.defineProperty(actor, Symbol("hostile"), { enumerable: true, value: true }), (actor: Record<string, unknown>) => Object.defineProperty(actor, "hidden", { enumerable: false, value: true })]) {
      const actor = { origin: "HUMAN_INPUT", actorId: "human-1" } as Record<string, unknown>; mutate(actor);
      expect(() => createDecisionAssessmentRequest(input({ requestedBy: actor as never }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID");
    }
    const stored = createDecisionAssessmentRequest(input()); let storedReads = 0;
    Object.defineProperty(stored.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { storedReads += 1; return "human-1"; } });
    expect(() => assertDecisionAssessmentRequest(stored)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID"); expect(storedReads).toBe(0);
    for (const mutate of [(actor: Record<string, unknown>) => Object.defineProperty(actor, "unexpected", { enumerable: true, value: true }), (actor: Record<string, unknown>) => Object.defineProperty(actor, Symbol("hostile"), { enumerable: true, value: true }), (actor: Record<string, unknown>) => Object.defineProperty(actor, "hidden", { enumerable: false, value: true })]) {
      const value = createDecisionAssessmentRequest(input()); mutate(value.requestedBy as unknown as Record<string, unknown>);
      expect(() => assertDecisionAssessmentRequest(value)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
    }
  });

  it("defensively captures selection arrays without executing element getters", () => {
    let constructorReads = 0; const constructorSelection = [optionOne];
    Object.defineProperty(constructorSelection, "0", { enumerable: true, configurable: true, get: () => { constructorReads += 1; return optionOne; } });
    expect(() => createDecisionAssessmentRequest(input({ selectedOptionItemIds: constructorSelection }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID"); expect(constructorReads).toBe(0);
    for (const mutate of [(selection: string[]) => Object.defineProperty(selection, Symbol("hostile"), { enumerable: true, value: true }), (selection: string[]) => Object.defineProperty(selection, "hidden", { enumerable: false, value: true })]) {
      const selection = [optionOne]; mutate(selection);
      expect(() => createDecisionAssessmentRequest(input({ selectedOptionItemIds: selection }))).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID");
    }
    const stored = createDecisionAssessmentRequest(input({ selectedOptionItemIds: [optionOne] })); let storedReads = 0;
    Object.defineProperty(stored.selectedOptionItemIds, "0", { enumerable: true, configurable: true, get: () => { storedReads += 1; return optionOne; } });
    expect(() => assertDecisionAssessmentRequest(stored)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID"); expect(storedReads).toBe(0);
    for (const mutate of [(selection: readonly string[]) => Object.defineProperty(selection, Symbol("hostile"), { enumerable: true, value: true }), (selection: readonly string[]) => Object.defineProperty(selection, "hidden", { enumerable: false, value: true })]) {
      const value = createDecisionAssessmentRequest(input({ selectedOptionItemIds: [optionOne] })); mutate(value.selectedOptionItemIds);
      expect(() => assertDecisionAssessmentRequest(value)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
    }
  });

  it("detaches every caller-owned selection and human-owner input", () => {
    const options = [optionOne], objectives = [objectiveOne], constraints = [constraintOne];
    const actor = { origin: "HUMAN_INPUT" as const, actorId: "human-1" };
    const value = createDecisionAssessmentRequest(input({ requestedBy: actor, selectedOptionItemIds: options, selectedObjectiveItemIds: objectives, selectedConstraintItemIds: constraints }));
    options[0] = optionTwo; objectives[0] = objectiveTwo; constraints[0] = constraintTwo; actor.actorId = "human-2";
    expect(value.requestedBy).toEqual({ origin: "HUMAN_INPUT", actorId: "human-1" });
    expect(value.selectedOptionItemIds).toEqual([optionOne]); expect(value.selectedObjectiveItemIds).toEqual([objectiveOne]); expect(value.selectedConstraintItemIds).toEqual([constraintOne]);
  });

  it("requires exact stored canonical representation and never repairs it", () => {
    const value = createDecisionAssessmentRequest(input({ selectedOptionItemIds: [optionTwo, optionOne], selectedObjectiveItemIds: [objectiveOne], selectedConstraintItemIds: [constraintOne] }));
    const wrongId = structuredClone(value); wrongId.assessmentRequestId = "DAREQ_000000000000000000000000";
    expect(() => assertDecisionAssessmentRequest(wrongId)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH");
    const unsorted = structuredClone(value); unsorted.selectedOptionItemIds = [optionTwo, optionOne]; expect(() => assertDecisionAssessmentRequest(unsorted)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
    const duplicate = structuredClone(value); duplicate.selectedOptionItemIds = [optionOne, optionOne]; expect(() => assertDecisionAssessmentRequest(duplicate)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
    const untrimmedActor = structuredClone(value); untrimmedActor.requestedBy.actorId = " human-1 "; expect(() => assertDecisionAssessmentRequest(untrimmedActor)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
    expect(() => assertDecisionAssessmentRequest({ ...value, unexpected: true })).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
    const malformed = structuredClone(value); malformed.selectedOptionItemIds = ["DCI_invalid"]; expect(() => assertDecisionAssessmentRequest(malformed)).toThrow("ERR_DECISION_ASSESSMENT_REQUEST_INVALID");
  });

  it("exports the exact 6A runtime module surface and no later-phase public symbols", () => {
    expect(Object.keys(assessmentRequestModule).sort()).toEqual(["DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION", "assertDecisionAssessmentRequest", "createDecisionAssessmentRequest"]);
    expect(Object.keys(decisionCore).filter((name) => ["DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION", "createDecisionAssessmentRequest", "assertDecisionAssessmentRequest"].includes(name)).sort()).toEqual(["DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION", "assertDecisionAssessmentRequest", "createDecisionAssessmentRequest"]);
    const exportedSymbols = publicSymbols(resolve(process.cwd(), "lib/decision-core/assessment-request/index.ts"));
    expect(exportedSymbols.filter((name) => ["buildDecisionAssessmentRequestId", "RawIdentity", "Repository", "AssessmentExecution", "Recommendation", "DecisionNeed", "HumanDecision", "Score", "Model", "Provider"].includes(name))).toEqual([]);
    const directory = resolve(process.cwd(), "lib/decision-core/assessment-request"); const imports = sourceFiles(directory).flatMap((file) => specifiers(readFileSync(file, "utf8")));
    expect(imports.filter((value) => ["career", "recruiting", "capability-core", "matching", "legacy", "adapter", "repository", "postgres", "drizzle"].some((term) => value.toLowerCase().includes(term)))).toEqual([]);
    const source = sourceFiles(directory).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/decision need|recommendation|assessment result|model|provider|score|priority|weight|confidence|probability|severity|ranking|winner|fit|utility|current|head|latest|createdAt|updatedAt|requestedAt|timestamp/i);
  });
});
