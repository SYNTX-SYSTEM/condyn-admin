import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  assertStructuralExpectation,
  createDecisionContextDraft,
  createStructuralExpectation,
  type AuthoritativeStateReference,
  type DecisionContextDraft,
  type EvidenceBindingDisposition,
  type StructuralExpectationInput
} from "../../../lib/decision-core";

const reference = (suffix = "A"): AuthoritativeStateReference => ({
  producerId: `PRODUCER_${suffix}`,
  authorityContractId: `CONTRACT_${suffix}`,
  artifactId: `ARTIFACT_${suffix}`,
  locator: `locator-${suffix}`
});

const context = (): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference()],
  items: [
    { role: "DECISION_QUESTION", statement: "Should the system proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human-1" } },
    { role: "OBJECTIVE", statement: "Preserve service availability.", provenance: { origin: "HUMAN_INPUT", actorId: "human-1" } },
    { role: "CONSTRAINT", statement: "Do not exceed the approved window.", provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" } },
    { role: "UNCERTAINTY", statement: "The maintenance duration is unknown.", provenance: { origin: "HUMAN_INPUT", actorId: "human-2" } }
  ]
});

const humanProvenance = { origin: "HUMAN_INPUT" as const, actorId: "human-expectation" };
const modelProvenance = { origin: "MODEL_PROPOSAL" as const, proposalRef: "proposal-expectation" };
const itemByRole = (draft: DecisionContextDraft, role: string) => {
  const item = draft.items.find((candidate) => candidate.role === role);
  if (item === undefined) throw new Error(`missing ${role} item`);
  return item;
};

const evidenceInput = (draft: DecisionContextDraft, overrides: Partial<Extract<StructuralExpectationInput, { kind: "EVIDENCE_BINDING" }>> = {}): Extract<StructuralExpectationInput, { kind: "EVIDENCE_BINDING" }> => ({
  kind: "EVIDENCE_BINDING",
  subjectItemId: itemByRole(draft, "OBJECTIVE").itemId,
  acceptedDispositions: ["SUPPORTED", "NOT_SUPPORTED"],
  provenance: humanProvenance,
  ...overrides
});

const roleInput = (overrides: Partial<Extract<StructuralExpectationInput, { kind: "CONTEXT_ROLE" }>> = {}): Extract<StructuralExpectationInput, { kind: "CONTEXT_ROLE" }> => ({
  kind: "CONTEXT_ROLE",
  role: "OPTION",
  minimumCount: 1,
  provenance: humanProvenance,
  ...overrides
});

const dependencyInput = (draft: DecisionContextDraft, overrides: Partial<Extract<StructuralExpectationInput, { kind: "DEPENDENCY" }>> = {}): Extract<StructuralExpectationInput, { kind: "DEPENDENCY" }> => ({
  kind: "DEPENDENCY",
  dependentItemId: itemByRole(draft, "OBJECTIVE").itemId,
  prerequisiteItemId: itemByRole(draft, "CONSTRAINT").itemId,
  provenance: modelProvenance,
  ...overrides
});

const forbiddenExports = ["Gap", "Contradiction", "Dependency", "Consequence", "DecisionNeed", "Recommendation", "Score", "Confidence", "HumanDecision", "Action", "Outcome", "Feedback"];

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
);

const moduleSpecifiers = (source: string): string[] => {
  const file = ts.createSourceFile("structural-findings.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers: string[] = [];
  const add = (value: ts.Expression | undefined) => { if (value !== undefined && ts.isStringLiteralLike(value)) specifiers.push(value.text); };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression);
    else if (ts.isCallExpression(node)) {
      const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const requireCall = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if ((dynamicImport || requireCall) && node.arguments.length === 1) add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return specifiers;
};

const publicExportNames = (entry: string): string[] => {
  const program = ts.createProgram({ rootNames: [entry], options: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, noEmit: true, skipLibCheck: true } });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  if (source === undefined) throw new Error("missing structural findings entry");
  const symbol = checker.getSymbolAtLocation(source);
  if (symbol === undefined) throw new Error("missing structural findings module symbol");
  const names = new Set<string>();
  for (const exported of checker.getExportsOfModule(symbol)) {
    names.add(exported.getName());
    if ((exported.flags & ts.SymbolFlags.Alias) !== 0) names.add(checker.getAliasedSymbol(exported).getName());
  }
  return [...names];
};

describe("Explicit Structural Expectation", () => {
  it("constructs each explicit expectation variant", () => {
    const draft = context();
    expect(createStructuralExpectation(draft, evidenceInput(draft))).toMatchObject({ artifactKind: "STRUCTURAL_EXPECTATION", schemaVersion: "STRUCTURAL_EXPECTATION_V1", kind: "EVIDENCE_BINDING" });
    expect(createStructuralExpectation(draft, roleInput())).toMatchObject({ kind: "CONTEXT_ROLE", role: "OPTION", minimumCount: 1 });
    expect(createStructuralExpectation(draft, dependencyInput(draft))).toMatchObject({ kind: "DEPENDENCY" });
  });

  it("derives deterministic DEXP identities and canonicalizes accepted disposition order", () => {
    const draft = context();
    const first = createStructuralExpectation(draft, evidenceInput(draft, { acceptedDispositions: ["NOT_SUPPORTED", "SUPPORTED"] }));
    const second = createStructuralExpectation(draft, evidenceInput(draft, { acceptedDispositions: ["SUPPORTED", "NOT_SUPPORTED"] }));
    const subjectItemId = itemByRole(draft, "OBJECTIVE").itemId;
    const expected = `DEXP_${createHash("sha256").update(JSON.stringify([
      "STRUCTURAL_EXPECTATION_V1",
      draft.contextId,
      "EVIDENCE_BINDING",
      [subjectItemId, ["SUPPORTED", "NOT_SUPPORTED"]],
      ["HUMAN_INPUT", "human-expectation"]
    ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;

    expect(first).toEqual(second);
    expect(first.expectationId).toBe(expected);
    if (first.kind !== "EVIDENCE_BINDING") throw new Error("wrong expectation fixture");
    expect(first.acceptedDispositions).toEqual(["SUPPORTED", "NOT_SUPPORTED"]);
  });

  it("rejects a stored EVIDENCE_BINDING artifact whose dispositions are not already canonical", () => {
    const draft = context();
    const expectation = createStructuralExpectation(draft, evidenceInput(draft, { acceptedDispositions: ["CONTRADICTED", "SUPPORTED"] }));
    if (expectation.kind !== "EVIDENCE_BINDING") throw new Error("wrong expectation fixture");
    expect(expectation.acceptedDispositions).toEqual(["SUPPORTED", "CONTRADICTED"]);

    const tampered = structuredClone(expectation);
    tampered.acceptedDispositions.reverse();

    expect(() => assertStructuralExpectation(draft, tampered)).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  });

  it("detaches nested caller-owned expectation input", () => {
    const draft = context();
    const acceptedDispositions: Extract<StructuralExpectationInput, { kind: "EVIDENCE_BINDING" }>["acceptedDispositions"] = ["SUPPORTED", "NOT_SUPPORTED"];
    const provenance = { origin: "HUMAN_INPUT" as const, actorId: "caller-owned" };
    const expectation = createStructuralExpectation(draft, evidenceInput(draft, { acceptedDispositions, provenance }));
    if (expectation.kind !== "EVIDENCE_BINDING") throw new Error("wrong expectation fixture");
    const original = structuredClone(expectation);

    (acceptedDispositions as EvidenceBindingDisposition[]).splice(0, acceptedDispositions.length, "CONTRADICTED");
    provenance.actorId = "mutated-caller-owned";

    expect(expectation).toEqual(original);
  });

  it("rejects duplicate, invalid, and empty accepted dispositions", () => {
    const draft = context();
    expect(() => createStructuralExpectation(draft, evidenceInput(draft, { acceptedDispositions: ["SUPPORTED", "SUPPORTED"] }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION");
    expect(() => createStructuralExpectation(draft, evidenceInput(draft, { acceptedDispositions: [] }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID");
    const invalid = { ...evidenceInput(draft), acceptedDispositions: ["UNKNOWN"] };
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, invalid])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID");
  });

  it("rejects missing subject/dependency items and self dependencies", () => {
    const draft = context();
    expect(() => createStructuralExpectation(draft, evidenceInput(draft, { subjectItemId: "DCI_UNKNOWN" }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND");
    expect(() => createStructuralExpectation(draft, dependencyInput(draft, { prerequisiteItemId: "DCI_UNKNOWN" }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND");
    const itemId = itemByRole(draft, "OBJECTIVE").itemId;
    expect(() => createStructuralExpectation(draft, dependencyInput(draft, { dependentItemId: itemId, prerequisiteItemId: itemId }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
  });

  it("makes dependency direction identity-bearing", () => {
    const draft = context();
    const forward = createStructuralExpectation(draft, dependencyInput(draft));
    if (forward.kind !== "DEPENDENCY") throw new Error("wrong expectation fixture");
    const reverse = createStructuralExpectation(draft, dependencyInput(draft, { dependentItemId: forward.prerequisiteItemId, prerequisiteItemId: forward.dependentItemId }));
    expect(forward.expectationId).not.toBe(reverse.expectationId);
  });

  it("rejects invalid roles and non-positive/non-safe context-role counts", () => {
    const invalidRole = { ...roleInput(), role: "UNKNOWN" };
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [context(), invalidRole])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    expect(() => createStructuralExpectation(context(), roleInput({ minimumCount: 0 }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    expect(() => createStructuralExpectation(context(), roleInput({ minimumCount: 1.5 }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    expect(() => createStructuralExpectation(context(), roleInput({ minimumCount: Number.MAX_SAFE_INTEGER + 1 }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
  });

  it("requires AUTHORITATIVE_STATE provenance to name a listed context reference while preserving human/model distinctions", () => {
    const draft = context();
    expect(() => createStructuralExpectation(draft, roleInput({ provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("ABSENT") } }))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID");
    expect(createStructuralExpectation(draft, roleInput({ provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference() } })).provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: reference() });
    expect(createStructuralExpectation(draft, roleInput({ provenance: humanProvenance })).provenance.origin).toBe("HUMAN_INPUT");
    expect(createStructuralExpectation(draft, roleInput({ provenance: modelProvenance })).provenance.origin).toBe("MODEL_PROPOSAL");
  });

  it("keeps malformed provenance input distinct from malformed authoritative-state references", () => {
    const draft = context();
    const malformedHuman = { ...roleInput(), provenance: { origin: "HUMAN_INPUT", actorId: "   " } };
    const malformedReference = { ...roleInput(), provenance: { origin: "AUTHORITATIVE_STATE", stateReference: { ...reference(), locator: "" } } };

    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, malformedHuman])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, malformedReference])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID");
  });

  it("does not derive expectations from OBJECTIVE, CONSTRAINT, UNCERTAINTY, or zero bindings", () => {
    const draft = context();
    expect(draft.items.filter((item) => ["OBJECTIVE", "CONSTRAINT", "UNCERTAINTY"].includes(item.role))).toHaveLength(3);
    expect(createStructuralExpectation(draft, roleInput({ role: "OPTION", minimumCount: 1 })).kind).toBe("CONTEXT_ROLE");
  });

  it("rejects tampered context and expectation identity/content", () => {
    const draft = context();
    const expectation = createStructuralExpectation(draft, evidenceInput(draft));
    const tamperedContext = structuredClone(draft);
    tamperedContext.contextId = "DCTX_TAMPERED";
    expect(() => createStructuralExpectation(tamperedContext, evidenceInput(draft))).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID");
    const tamperedId = structuredClone(expectation);
    tamperedId.expectationId = "DEXP_TAMPERED";
    expect(() => assertStructuralExpectation(draft, tamperedId)).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH");
    const tamperedContent = structuredClone(expectation);
    if (tamperedContent.kind !== "EVIDENCE_BINDING") throw new Error("wrong expectation fixture");
    tamperedContent.subjectItemId = itemByRole(draft, "CONSTRAINT").itemId;
    expect(() => assertStructuralExpectation(draft, tamperedContent)).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH");
  });

  it("rejects hostile shapes and returns detached artifacts", () => {
    const draft = context();
    const accessor = evidenceInput(draft);
    Object.defineProperty(accessor, "subjectItemId", { enumerable: true, get: () => itemByRole(draft, "OBJECTIVE").itemId });
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, accessor])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    const extra = { ...evidenceInput(draft), hidden: true };
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, extra])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    const symbol = evidenceInput(draft);
    Reflect.set(symbol, Symbol("hidden"), true);
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, symbol])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    const sparse = evidenceInput(draft, { acceptedDispositions: ["SUPPORTED"] });
    const sparseDispositions: string[] = [];
    sparseDispositions[1] = "SUPPORTED";
    const sparseInput = { ...sparse, acceptedDispositions: sparseDispositions };
    expect(() => Reflect.apply(createStructuralExpectation, undefined, [draft, sparseInput])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    const artifact = createStructuralExpectation(draft, evidenceInput(draft));
    if (artifact.kind !== "EVIDENCE_BINDING") throw new Error("wrong expectation fixture");
    artifact.acceptedDispositions.push("CONTRADICTED");
    const pristine = createStructuralExpectation(draft, evidenceInput(draft));
    if (pristine.kind !== "EVIDENCE_BINDING") throw new Error("wrong expectation fixture");
    expect(pristine.acceptedDispositions).toEqual(["SUPPORTED", "NOT_SUPPORTED"]);
  });

  it("rejects hostile stored artifacts at the assertion boundary", () => {
    const draft = context();
    const expectation = createStructuralExpectation(draft, evidenceInput(draft));
    const accessor = structuredClone(expectation);
    Object.defineProperty(accessor, "contextId", { enumerable: true, get: () => draft.contextId });
    expect(() => assertStructuralExpectation(draft, accessor)).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");

    const symbol = structuredClone(expectation);
    Reflect.set(symbol, Symbol("extra"), true);
    expect(() => assertStructuralExpectation(draft, symbol)).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");

    const extra = { ...structuredClone(expectation), extra: true };
    expect(() => Reflect.apply(assertStructuralExpectation, undefined, [draft, extra])).toThrow("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  });

  it("exposes no finding or decision concepts and keeps structural-findings production generic", () => {
    const entry = resolve(process.cwd(), "lib/decision-core/structural-findings/index.ts");
    expect(publicExportNames(entry).filter((name) => forbiddenExports.includes(name))).toEqual([]);
    const forbidden = sourceFiles(resolve(process.cwd(), "lib/decision-core/structural-findings")).flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8"))
      .filter((specifier) => ["career", "capability-core", "matching", "recommendation", "recommendations", "career/decisions", "decision-looper"].some((term) => specifier.toLowerCase().includes(term)))
      .map((specifier) => ({ file, specifier })));
    expect(forbidden).toEqual([]);
  });
});
