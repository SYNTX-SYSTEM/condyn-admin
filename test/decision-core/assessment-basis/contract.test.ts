import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as assessmentBasis from "../../../lib/decision-core/assessment-basis";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertDecisionAssessmentBasis,
  createBoundDecisionAssessmentBasisBinder,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createStructuralExpectation,
  reconstructStructuralGap,
  type DecisionContextRevision
} from "../../../lib/decision-core";

const sourceReference = { producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" };
const canonical = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonical)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort((left, right) => left < right ? -1 : left > right ? 1 : 0).map((key) => [key, canonical((value as Record<string, unknown>)[key])]))
    : value;
const basisId = (request: unknown, revision: unknown): string => `DABAS_${createHash("sha256").update(JSON.stringify(["DECISION_ASSESSMENT_BASIS_V1", canonical(request), canonical(revision)]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const specifiers = (source: string): string[] => { const file = ts.createSourceFile("assessment-basis.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS); const result: string[] = []; const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) result.push(node.moduleSpecifier.text); ts.forEachChild(node, visit); }; visit(file); return result; };

function revision(withSource = false, suffix = "", extraSelections = false): DecisionContextRevision {
  const context = createDecisionContextDraft({
    sourceStateReferences: withSource ? [sourceReference] : [],
    items: [
      { role: "DECISION_QUESTION", statement: `Proceed?${suffix}`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "OPTION", statement: "Option.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "OBJECTIVE", statement: "Objective.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "CONSTRAINT", statement: "Constraint.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      ...(extraSelections ? [
        { role: "OPTION" as const, statement: "Other option.", provenance: { origin: "HUMAN_INPUT" as const, actorId: "human" } },
        { role: "OBJECTIVE" as const, statement: "Other objective.", provenance: { origin: "HUMAN_INPUT" as const, actorId: "human" } },
        { role: "CONSTRAINT" as const, statement: "Other constraint.", provenance: { origin: "HUMAN_INPUT" as const, actorId: "human" } }
      ] : [])
    ]
  });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}
const id = (value: DecisionContextRevision, role: "DECISION_QUESTION" | "OPTION" | "OBJECTIVE" | "CONSTRAINT"): string => {
  const item = value.context.items.find((candidate) => candidate.role === role);
  if (item === undefined) throw new Error("missing fixture item");
  return item.itemId;
};
const ids = (value: DecisionContextRevision, role: "OPTION" | "OBJECTIVE" | "CONSTRAINT"): string[] => value.context.items.filter((item) => item.role === role).map((item) => item.itemId);
const requestFor = (value: DecisionContextRevision, overrides: Record<string, unknown> = {}) => createDecisionAssessmentRequest({
  revisionId: value.revisionId,
  requestedBy: { origin: "HUMAN_INPUT", actorId: " human " },
  decisionQuestionItemId: id(value, "DECISION_QUESTION"),
  selectedOptionItemIds: [id(value, "OPTION")],
  selectedObjectiveItemIds: [id(value, "OBJECTIVE")],
  selectedConstraintItemIds: [id(value, "CONSTRAINT")],
  ...overrides
} as never);
const binder = (value: DecisionContextRevision, reads?: string[]) => createBoundDecisionAssessmentBasisBinder({ getRevisionById: async (revisionId: string) => { reads?.push(revisionId); return value; } });
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

describe("Decision Assessment Basis", () => {
  it("binds a canonical request to one exact sealed revision and permits all empty selections", async () => {
    const value = revision(); const request = requestFor(value);
    const result = await binder(value).bind(request);
    expect(result).toEqual({ artifactKind: "DECISION_ASSESSMENT_BASIS", schemaVersion: "DECISION_ASSESSMENT_BASIS_V1", assessmentBasisId: basisId(request, value), assessmentRequest: request, revision: value });
    assertDecisionAssessmentBasis(result);
    const empty = requestFor(value, { selectedOptionItemIds: [], selectedObjectiveItemIds: [], selectedConstraintItemIds: [] });
    await expect(binder(value).bind(empty)).resolves.toMatchObject({ assessmentRequest: empty });
  });

  it("validates the request before reading and captures one exact reader method at construction", async () => {
    let reads = 0;
    const valid = revision(); const malformed = { ...requestFor(valid), assessmentRequestId: "DAREQ_000000000000000000000000" };
    const bound = createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => { reads += 1; return valid; } });
    await expect(bound.bind(malformed)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_REQUEST_INVALID"); expect(reads).toBe(0);
    expect(() => createBoundDecisionAssessmentBasisBinder({ getRevisionById: "not-a-function" } as never)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID");
    const reader: { getRevisionById(revisionId: string): Promise<DecisionContextRevision | null> } = { getRevisionById: async () => valid }; const captured = createBoundDecisionAssessmentBasisBinder(reader);
    reader.getRevisionById = async (): Promise<DecisionContextRevision | null> => null;
    await expect(captured.bind(requestFor(valid))).resolves.toBeDefined();
  });

  it("maps missing, malformed, and wrong-ID reader results to the revision boundary", async () => {
    const value = revision(); const request = requestFor(value);
    await expect(createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => null }).bind(request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND");
    const wrong = revision(false, "other");
    await expect(createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => wrong }).bind(request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID");
    await expect(createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => ({ revisionId: value.revisionId }) as never }).bind(request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID");
  });

  it("requires question and every declared category to exist with its declared role", async () => {
    const value = revision();
    const absent = "DCI_999999999999999999999999";
    for (const request of [
      requestFor(value, { decisionQuestionItemId: absent }),
      requestFor(value, { selectedOptionItemIds: [absent] }),
      requestFor(value, { selectedObjectiveItemIds: [absent] }),
      requestFor(value, { selectedConstraintItemIds: [absent] })
    ]) await expect(binder(value).bind(request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_ITEM_NOT_FOUND");
    for (const request of [
      requestFor(value, { decisionQuestionItemId: id(value, "OPTION"), selectedOptionItemIds: [], selectedObjectiveItemIds: [], selectedConstraintItemIds: [] }),
      requestFor(value, { selectedOptionItemIds: [id(value, "OBJECTIVE")], selectedObjectiveItemIds: [], selectedConstraintItemIds: [] }),
      requestFor(value, { selectedOptionItemIds: [], selectedObjectiveItemIds: [id(value, "CONSTRAINT")], selectedConstraintItemIds: [] }),
      requestFor(value, { selectedOptionItemIds: [], selectedObjectiveItemIds: [], selectedConstraintItemIds: [id(value, "OPTION")] })
    ]) await expect(binder(value).bind(request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_ROLE_MISMATCH");
  });

  it("captures request and returned revision state before await boundaries and returns detached basis state", async () => {
    const value = revision(); const request = requestFor(value); const reads: string[] = [];
    let release: ((value: DecisionContextRevision) => void) | undefined;
    const bound = createBoundDecisionAssessmentBasisBinder({ getRevisionById: async (requested) => { reads.push(requested); return new Promise((resolve) => { release = resolve; }); } });
    const pending = bound.bind(request);
    request.revisionId = "DREV_FEDCBA9876543210FEDCBA98"; request.requestedBy.actorId = "redirected"; (request.selectedOptionItemIds as string[])[0] = id(value, "OBJECTIVE");
    release?.(value); const result = await pending;
    expect(reads).toEqual([value.revisionId]); expect(result.assessmentRequest.requestedBy.actorId).toBe("human"); expect(result.assessmentRequest.selectedOptionItemIds).toEqual([id(value, "OPTION")]);
    const originalQuestion = value.context.items[0].statement; value.context.items[0].statement = "mutated after read";
    expect(result.revision.context.items[0].statement).toBe(originalQuestion);
    request.requestedBy.actorId = "mutated later"; expect(result.assessmentRequest.requestedBy.actorId).toBe("human");
  });

  it("asserts exact self-contained bases and rejects hostile or wrong-ID stored state", async () => {
    const value = revision(); const result = await binder(value).bind(requestFor(value));
    assertDecisionAssessmentBasis(result);
    const wrongId = structuredClone(result); wrongId.assessmentBasisId = "DABAS_000000000000000000000000";
    expect(() => assertDecisionAssessmentBasis(wrongId)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH");
    expect(() => assertDecisionAssessmentBasis({ ...result, extra: true })).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
    const missing = { ...result }; delete (missing as Partial<typeof result>).revision;
    expect(() => assertDecisionAssessmentBasis(missing as never)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
    let reads = 0; const accessor = { ...result } as Record<string, unknown>;
    Object.defineProperty(accessor, "revision", { enumerable: true, get: () => { reads += 1; return value; } });
    expect(() => assertDecisionAssessmentBasis(accessor)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID"); expect(reads).toBe(0);
    const symbol = { ...result }; Object.defineProperty(symbol, Symbol("hostile"), { enumerable: true, value: true });
    expect(() => assertDecisionAssessmentBasis(symbol)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
    const hidden = { ...result }; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    expect(() => assertDecisionAssessmentBasis(hidden)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
  });

  it("commits canonical complete request and complete revision state, not DREV alone", async () => {
    const value = revision(); const request = requestFor(value); const reordered = reorder(value) as DecisionContextRevision;
    const left = await binder(value).bind(request); const right = await binder(reordered).bind(request);
    expect(right.assessmentBasisId).toBe(left.assessmentBasisId);
    const context = createDecisionContextDraft({ sourceStateReferences: [sourceReference], items: [
      { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "OPTION", statement: "Option.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "OBJECTIVE", statement: "Objective.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "CONSTRAINT", statement: "Constraint.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
    ] });
    const objective = context.items.find((item) => item.role === "OBJECTIVE"); if (objective === undefined) throw new Error("missing objective");
    const expectation = createStructuralExpectation(context, { kind: "EVIDENCE_BINDING", subjectItemId: objective.itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "human" } });
    const binding = (rationale: string) => ({ bindingId: `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", context.contextId, objective.itemId, [sourceReference.producerId, sourceReference.authorityContractId, sourceReference.artifactId, sourceReference.locator], "NOT_SUPPORTED"]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`, contextId: context.contextId, itemId: objective.itemId, stateReference: sourceReference, disposition: "NOT_SUPPORTED" as const, rationale });
    const build = (rationale: string) => { const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [binding(rationale)] }; const gap = reconstructStructuralGap(context, expectation, basis); if (gap === null) throw new Error("missing gap"); const validationInput = { expectationValidations: [{ expectation, basis, result: gap }], consequenceValidations: [] }; return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) }); };
    const first = build("first rationale"); const second = build("second rationale"); expect(second.revisionId).toBe(first.revisionId);
    const firstRequest = requestFor(first); const secondRequest = requestFor(second);
    expect((await binder(second).bind(secondRequest)).assessmentBasisId).not.toBe((await binder(first).bind(firstRequest)).assessmentBasisId);
    expect((await binder(first).bind(requestFor(first, { requestedBy: { origin: "HUMAN_INPUT", actorId: "other" } }))).assessmentBasisId).not.toBe((await binder(first).bind(firstRequest)).assessmentBasisId);
  });

  it("exports only the narrow generic 6B surface with no lineage, authority, or assessment execution", () => {
    expect(Object.keys(assessmentBasis).sort()).toEqual(["DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION", "assertDecisionAssessmentBasis", "createBoundDecisionAssessmentBasisBinder"]);
    expect(Object.keys(decisionCore).filter((name) => ["DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION", "assertDecisionAssessmentBasis", "createBoundDecisionAssessmentBasisBinder"].includes(name)).sort()).toEqual(["DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION", "assertDecisionAssessmentBasis", "createBoundDecisionAssessmentBasisBinder"]);
    const directory = resolve(process.cwd(), "lib/decision-core/assessment-basis"); const imports = sourceFiles(directory).flatMap((file) => specifiers(readFileSync(file, "utf8")));
    expect(imports.filter((entry) => ["career", "recruiting", "capability-core", "matching", "legacy", "postgres", "drizzle", "adapter", "revision-lineage"].some((term) => entry.toLowerCase().includes(term)))).toEqual([]);
    expect(Object.keys(assessmentBasis).filter((name) => ["Assessment", "Recommendation", "DecisionNeed", "Lineage", "Authority", "Evaluator", "Model", "Provider", "Repository"].includes(name))).toEqual([]);
    const source = sourceFiles(directory).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/decisionneed|decision need|recommend|priority|weight|score|ranking|confidence|probability|severity|winner|human decision|action|outcome|feedback|learning|lineage|producer|authority|persist|current|latest|head|active|resolve|model|provider|evaluator|assessment result/i);
  });

  it("rejects every hostile reader composition without executing accessors", () => {
    const valid = revision();
    const invalid = [
      { getRevisionById: async () => valid, extra: () => undefined },
      (() => { const value = {} as Record<string, unknown>; Object.defineProperty(value, Symbol("hostile"), { enumerable: true, value: true }); return value; })(),
      (() => { const value = { getRevisionById: async () => valid }; Object.defineProperty(value, "getRevisionById", { enumerable: false, value: async () => valid }); return value; })(),
      {}, null, [], 1, "reader"
    ];
    for (const value of invalid) expect(() => createBoundDecisionAssessmentBasisBinder(value as never)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID");
    let getterReads = 0;
    const accessor = {};
    Object.defineProperty(accessor, "getRevisionById", { enumerable: true, get: () => { getterReads += 1; return async () => valid; } });
    expect(() => createBoundDecisionAssessmentBasisBinder(accessor as never)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID");
    expect(getterReads).toBe(0);
  });

  it("rejects nested hostile request state before reader invocation without executing getters", async () => {
    const value = revision(); let reads = 0;
    const bound = createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => { reads += 1; return value; } });
    const attempts: Array<{ request: ReturnType<typeof requestFor>; reads: () => number }> = [];
    let actorGetterReads = 0; const actorAccessor = requestFor(value);
    Object.defineProperty(actorAccessor.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { actorGetterReads += 1; return "human"; } });
    attempts.push({ request: actorAccessor, reads: () => actorGetterReads });
    for (const mutate of [
      (request: ReturnType<typeof requestFor>) => Object.defineProperty(request.requestedBy, "unexpected", { enumerable: true, value: true }),
      (request: ReturnType<typeof requestFor>) => Object.defineProperty(request.requestedBy, Symbol("hostile"), { enumerable: true, value: true }),
      (request: ReturnType<typeof requestFor>) => Object.defineProperty(request.requestedBy, "hidden", { enumerable: false, value: true }),
      (request: ReturnType<typeof requestFor>) => Object.defineProperty(request.selectedOptionItemIds, "0", { enumerable: true, configurable: true, get: () => { actorGetterReads += 1; return id(value, "OPTION"); } }),
      (request: ReturnType<typeof requestFor>) => Object.defineProperty(request.selectedOptionItemIds, Symbol("hostile"), { enumerable: true, value: true })
    ]) { const request = requestFor(value); mutate(request); attempts.push({ request, reads: () => actorGetterReads }); }
    for (const attempt of attempts) await expect(bound.bind(attempt.request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_REQUEST_INVALID");
    expect(actorGetterReads).toBe(0); expect(reads).toBe(0);
  });

  it("rejects nested hostile reader-returned revision state without executing getters", async () => {
    const source = revision(); const request = requestFor(source);
    const cases: Array<{ value: DecisionContextRevision; reads: () => number }> = [];
    let getterReads = 0;
    const contextAccessor = structuredClone(source); Object.defineProperty(contextAccessor, "context", { enumerable: true, configurable: true, get: () => { getterReads += 1; return source.context; } }); cases.push({ value: contextAccessor, reads: () => getterReads });
    const itemsAccessor = structuredClone(source); Object.defineProperty(itemsAccessor.context, "items", { enumerable: true, configurable: true, get: () => { getterReads += 1; return source.context.items; } }); cases.push({ value: itemsAccessor, reads: () => getterReads });
    const elementAccessor = structuredClone(source); Object.defineProperty(elementAccessor.context.items, "0", { enumerable: true, configurable: true, get: () => { getterReads += 1; return source.context.items[0]; } }); cases.push({ value: elementAccessor, reads: () => getterReads });
    const fieldAccessor = structuredClone(source); Object.defineProperty(fieldAccessor.context.items[0], "statement", { enumerable: true, configurable: true, get: () => { getterReads += 1; return "Proceed?"; } }); cases.push({ value: fieldAccessor, reads: () => getterReads });
    const symbol = structuredClone(source); Object.defineProperty(symbol.context.items[0], Symbol("hostile"), { enumerable: true, value: true }); cases.push({ value: symbol, reads: () => getterReads });
    const hidden = structuredClone(source); Object.defineProperty(hidden.context, "hidden", { enumerable: false, value: true }); cases.push({ value: hidden, reads: () => getterReads });
    for (const current of cases) await expect(createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => current.value }).bind(request)).rejects.toThrow("ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID");
    expect(getterReads).toBe(0);
  });

  it("captures every DAREQ-relevant request axis before its reader await", async () => {
    const value = revision(); const original = requestFor(value);
    const mutate: Array<(request: ReturnType<typeof requestFor>) => void> = [
      (request) => { request.revisionId = "DREV_FEDCBA9876543210FEDCBA98"; },
      (request) => { request.requestedBy.actorId = "other"; },
      (request) => { request.decisionQuestionItemId = id(value, "OPTION"); },
      (request) => { (request.selectedOptionItemIds as string[])[0] = id(value, "OBJECTIVE"); },
      (request) => { (request.selectedObjectiveItemIds as string[])[0] = id(value, "CONSTRAINT"); },
      (request) => { (request.selectedConstraintItemIds as string[])[0] = id(value, "OPTION"); }
    ];
    for (const change of mutate) {
      const request = structuredClone(original); let release: ((revision: DecisionContextRevision) => void) | undefined; const reads: string[] = [];
      const bound = createBoundDecisionAssessmentBasisBinder({ getRevisionById: async (revisionId) => { reads.push(revisionId); return new Promise((resolve) => { release = resolve; }); } });
      const pending = bound.bind(request); change(request); release?.(value); const result = await pending;
      expect(reads).toEqual([value.revisionId]); expect(result.assessmentRequest).toEqual(original);
    }
  });

  it("retains captured revision complete state after external mutation", async () => {
    const value = revision(); const result = await binder(value).bind(requestFor(value)); const originalId = result.assessmentBasisId;
    const statement = result.revision.context.items[0].statement;
    value.context.items[0].statement = "mutated";
    (value.validationInput.expectationValidations as unknown as unknown[]).push({});
    expect(result.revision.context.items[0].statement).toBe(statement);
    expect(result.revision.validationInput.expectationValidations).toEqual([]);
    expect(result.assessmentBasisId).toBe(originalId);
  });

  it("rejects nested hostile stored basis state without execution or repair", async () => {
    const source = revision(); const result = await binder(source).bind(requestFor(source)); let getterReads = 0;
    const requestAccessor = structuredClone(result); Object.defineProperty(requestAccessor.assessmentRequest.requestedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterReads += 1; return "human"; } });
    const revisionAccessor = structuredClone(result); Object.defineProperty(revisionAccessor.revision.context, "items", { enumerable: true, configurable: true, get: () => { getterReads += 1; return source.context.items; } });
    const symbol = structuredClone(result); Object.defineProperty(symbol.assessmentRequest.requestedBy, Symbol("hostile"), { enumerable: true, value: true });
    const hidden = structuredClone(result); Object.defineProperty(hidden.revision.context, "hidden", { enumerable: false, value: true });
    for (const value of [requestAccessor, revisionAccessor, symbol, hidden]) expect(() => assertDecisionAssessmentBasis(value)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
    expect(getterReads).toBe(0);
  });

  it("keeps invalid stored bodies distinct from an otherwise valid wrong DABAS", async () => {
    const source = revision(); const result = await binder(source).bind(requestFor(source));
    const wrongId = structuredClone(result); wrongId.assessmentBasisId = "DABAS_000000000000000000000000";
    expect(() => assertDecisionAssessmentBasis(wrongId)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH");
    const requestTamper = structuredClone(result); requestTamper.assessmentRequest.requestedBy.actorId = "tampered";
    expect(() => assertDecisionAssessmentBasis(requestTamper)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
    const revisionTamper = structuredClone(result); revisionTamper.revision.context.items[0].statement = "tampered";
    expect(() => assertDecisionAssessmentBasis(revisionTamper)).toThrow("ERR_DECISION_ASSESSMENT_BASIS_INVALID");
  });

  it("binds every valid request selection axis into DABAS and preserves canonical caller ordering", async () => {
    const value = revision(false, "", true); const [firstOption, secondOption] = ids(value, "OPTION"); const [firstObjective, secondObjective] = ids(value, "OBJECTIVE"); const [firstConstraint, secondConstraint] = ids(value, "CONSTRAINT");
    const baseline = requestFor(value, { selectedOptionItemIds: [firstOption], selectedObjectiveItemIds: [firstObjective], selectedConstraintItemIds: [firstConstraint] });
    const base = await binder(value).bind(baseline);
    for (const request of [
      requestFor(value, { requestedBy: { origin: "HUMAN_INPUT", actorId: "other" }, selectedOptionItemIds: [firstOption], selectedObjectiveItemIds: [firstObjective], selectedConstraintItemIds: [firstConstraint] }),
      requestFor(value, { selectedOptionItemIds: [secondOption], selectedObjectiveItemIds: [firstObjective], selectedConstraintItemIds: [firstConstraint] }),
      requestFor(value, { selectedOptionItemIds: [firstOption], selectedObjectiveItemIds: [secondObjective], selectedConstraintItemIds: [firstConstraint] }),
      requestFor(value, { selectedOptionItemIds: [firstOption], selectedObjectiveItemIds: [firstObjective], selectedConstraintItemIds: [secondConstraint] })
    ]) expect((await binder(value).bind(request)).assessmentBasisId).not.toBe(base.assessmentBasisId);
    // A sealed context has exactly one DECISION_QUESTION, so a valid question change necessarily binds a different sealed revision too.
    const otherQuestionRevision = revision(false, " another question");
    expect((await binder(otherQuestionRevision).bind(requestFor(otherQuestionRevision))).assessmentBasisId).not.toBe(base.assessmentBasisId);
    const forward = requestFor(value, { selectedOptionItemIds: [firstOption, secondOption], selectedObjectiveItemIds: [firstObjective], selectedConstraintItemIds: [firstConstraint] });
    const reverse = requestFor(value, { selectedOptionItemIds: [secondOption, firstOption], selectedObjectiveItemIds: [firstObjective], selectedConstraintItemIds: [firstConstraint] });
    expect(await binder(value).bind(reverse)).toEqual(await binder(value).bind(forward));
  });
});
