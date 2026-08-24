import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  assertStructuralRelationProposal,
  createDecisionContextDraft,
  createStructuralRelationProposal,
  type AuthoritativeStateReference,
  type DecisionContextDraft,
  type StructuralRelationProposalInput
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
    { role: "CONSTRAINT", statement: "Do not exceed the approved window.", provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" } }
  ]
});

const itemByRole = (draft: DecisionContextDraft, role: string) => {
  const item = draft.items.find((candidate) => candidate.role === role);
  if (item === undefined) throw new Error(`missing ${role} item`);
  return item;
};

const contradictionInput = (draft: DecisionContextDraft, overrides: Partial<Extract<StructuralRelationProposalInput, { kind: "CONTRADICTION" }>> = {}): Extract<StructuralRelationProposalInput, { kind: "CONTRADICTION" }> => ({
  kind: "CONTRADICTION",
  itemIds: [itemByRole(draft, "OBJECTIVE").itemId, itemByRole(draft, "CONSTRAINT").itemId],
  provenance: { origin: "HUMAN_INPUT", actorId: "human-relation" },
  ...overrides
});

const dependencyInput = (draft: DecisionContextDraft, overrides: Partial<Extract<StructuralRelationProposalInput, { kind: "DEPENDENCY" }>> = {}): Extract<StructuralRelationProposalInput, { kind: "DEPENDENCY" }> => ({
  kind: "DEPENDENCY",
  dependentItemId: itemByRole(draft, "OBJECTIVE").itemId,
  prerequisiteItemId: itemByRole(draft, "CONSTRAINT").itemId,
  provenance: { origin: "MODEL_PROPOSAL", proposalRef: "model-relation" },
  ...overrides
});

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
);

const moduleSpecifiers = (source: string): string[] => {
  const file = ts.createSourceFile("relation.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
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

describe("Explicit Structural Relation Proposal", () => {
  it("constructs CONTRADICTION and DEPENDENCY proposals", () => {
    const draft = context();
    expect(createStructuralRelationProposal(draft, contradictionInput(draft))).toMatchObject({ artifactKind: "STRUCTURAL_RELATION_PROPOSAL", schemaVersion: "STRUCTURAL_RELATION_PROPOSAL_V1", kind: "CONTRADICTION" });
    expect(createStructuralRelationProposal(draft, dependencyInput(draft))).toMatchObject({ kind: "DEPENDENCY" });
  });

  it("canonicalizes contradiction endpoints symmetrically and derives the exact DREL identity", () => {
    const draft = context();
    const objective = itemByRole(draft, "OBJECTIVE").itemId;
    const constraint = itemByRole(draft, "CONSTRAINT").itemId;
    const [first, second] = [objective, constraint].sort();
    const forward = createStructuralRelationProposal(draft, contradictionInput(draft, { itemIds: [objective, constraint] }));
    const reverse = createStructuralRelationProposal(draft, contradictionInput(draft, { itemIds: [constraint, objective] }));
    const expected = `DREL_${createHash("sha256").update(JSON.stringify([
      "STRUCTURAL_RELATION_PROPOSAL_V1", draft.contextId, "CONTRADICTION", [first, second], ["HUMAN_INPUT", "human-relation"]
    ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    expect(forward).toEqual(reverse);
    expect(forward.relationProposalId).toBe(expected);
    if (forward.kind !== "CONTRADICTION") throw new Error("wrong relation fixture");
    expect(forward.itemIds).toEqual([first, second]);
  });

  it("keeps dependency direction identity-bearing while rejecting self relations", () => {
    const draft = context();
    const forward = createStructuralRelationProposal(draft, dependencyInput(draft));
    if (forward.kind !== "DEPENDENCY") throw new Error("wrong relation fixture");
    const reverse = createStructuralRelationProposal(draft, dependencyInput(draft, { dependentItemId: forward.prerequisiteItemId, prerequisiteItemId: forward.dependentItemId }));
    expect(forward.relationProposalId).not.toBe(reverse.relationProposalId);
    const itemId = forward.dependentItemId;
    expect(() => createStructuralRelationProposal(draft, contradictionInput(draft, { itemIds: [itemId, itemId] }))).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
    expect(() => createStructuralRelationProposal(draft, dependencyInput(draft, { dependentItemId: itemId, prerequisiteItemId: itemId }))).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
  });

  it("requires stored contradiction endpoints to already be canonical", () => {
    const draft = context();
    const proposal = createStructuralRelationProposal(draft, contradictionInput(draft));
    if (proposal.kind !== "CONTRADICTION") throw new Error("wrong relation fixture");
    const tampered = structuredClone(proposal);
    tampered.itemIds.reverse();
    expect(() => assertStructuralRelationProposal(draft, tampered)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  });

  it("rejects missing stored variant fields as invalid artifact representations", () => {
    const draft = context();
    const contradiction = createStructuralRelationProposal(draft, contradictionInput(draft));
    const missingContradictionItems = structuredClone(contradiction);
    expect(Reflect.deleteProperty(missingContradictionItems, "itemIds")).toBe(true);
    expect(() => assertStructuralRelationProposal(draft, missingContradictionItems)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");

    const dependency = createStructuralRelationProposal(draft, dependencyInput(draft));
    const missingDependencyEndpoint = structuredClone(dependency);
    expect(Reflect.deleteProperty(missingDependencyEndpoint, "prerequisiteItemId")).toBe(true);
    expect(() => assertStructuralRelationProposal(draft, missingDependencyEndpoint)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  });

  it("rejects stored dependency direction changes through DREL identity mismatch", () => {
    const draft = context();
    const proposal = createStructuralRelationProposal(draft, dependencyInput(draft));
    if (proposal.kind !== "DEPENDENCY") throw new Error("wrong relation fixture");
    const swapped = structuredClone(proposal);
    [swapped.dependentItemId, swapped.prerequisiteItemId] = [swapped.prerequisiteItemId, swapped.dependentItemId];
    expect(() => assertStructuralRelationProposal(draft, swapped)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH");
  });

  it("requires context item membership and listed authoritative-state provenance references", () => {
    const draft = context();
    expect(() => createStructuralRelationProposal(draft, dependencyInput(draft, { dependentItemId: "DCI_UNKNOWN" }))).toThrow("ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND");
    expect(() => createStructuralRelationProposal(draft, dependencyInput(draft, { provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("ABSENT") } }))).toThrow("ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID");
    const malformed = { producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT" };
    const malformedInput = { ...dependencyInput(draft), provenance: { origin: "AUTHORITATIVE_STATE", stateReference: malformed } };
    expect(() => Reflect.apply(createStructuralRelationProposal, undefined, [draft, malformedInput])).toThrow("ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID");
    expect(createStructuralRelationProposal(draft, dependencyInput(draft, { provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference() } })).provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: reference() });
  });

  it("keeps human, model, and deterministic provenance distinct and identity-bearing", () => {
    const draft = context();
    const human = createStructuralRelationProposal(draft, contradictionInput(draft, { provenance: { origin: "HUMAN_INPUT", actorId: "actor" } }));
    const model = createStructuralRelationProposal(draft, contradictionInput(draft, { provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal" } }));
    const deterministic = createStructuralRelationProposal(draft, contradictionInput(draft, { provenance: { origin: "DETERMINISTIC_DERIVATION", ruleId: "rule" } }));
    const authoritative = createStructuralRelationProposal(draft, contradictionInput(draft, { provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference() } }));
    expect(new Set([human.relationProposalId, model.relationProposalId, deterministic.relationProposalId, authoritative.relationProposalId]).size).toBe(4);
  });

  it("detaches nested caller-owned input", () => {
    const draft = context();
    const itemIds = [...contradictionInput(draft).itemIds] as [string, string];
    const provenance = { origin: "HUMAN_INPUT" as const, actorId: "caller-owned" };
    const proposal = createStructuralRelationProposal(draft, contradictionInput(draft, { itemIds, provenance }));
    const original = structuredClone(proposal);
    itemIds.reverse();
    provenance.actorId = "mutated";
    expect(proposal).toEqual(original);
  });

  it("rejects hostile constructor and stored-artifact representations without reading accessors", () => {
    const draft = context();
    const accessor = contradictionInput(draft);
    Object.defineProperty(accessor, "itemIds", { enumerable: true, get: () => { throw new Error("getter must not run"); } });
    expect(() => Reflect.apply(createStructuralRelationProposal, undefined, [draft, accessor])).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
    const symbol = contradictionInput(draft);
    Reflect.set(symbol, Symbol("extra"), true);
    expect(() => Reflect.apply(createStructuralRelationProposal, undefined, [draft, symbol])).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
    expect(() => Reflect.apply(createStructuralRelationProposal, undefined, [draft, { ...contradictionInput(draft), extra: true }])).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
    const sparse: string[] = [];
    sparse[1] = itemByRole(draft, "OBJECTIVE").itemId;
    expect(() => Reflect.apply(createStructuralRelationProposal, undefined, [draft, { ...contradictionInput(draft), itemIds: sparse }])).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");

    const proposal = createStructuralRelationProposal(draft, contradictionInput(draft));
    const storedAccessor = structuredClone(proposal);
    Object.defineProperty(storedAccessor, "contextId", { enumerable: true, get: () => draft.contextId });
    expect(() => assertStructuralRelationProposal(draft, storedAccessor)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
    const storedSymbol = structuredClone(proposal);
    Reflect.set(storedSymbol, Symbol("extra"), true);
    expect(() => assertStructuralRelationProposal(draft, storedSymbol)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
    expect(() => Reflect.apply(assertStructuralRelationProposal, undefined, [draft, { ...proposal, extra: true }])).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  });

  it("distinguishes a tampered ID from a foreign/tampered context", () => {
    const draft = context();
    const proposal = createStructuralRelationProposal(draft, dependencyInput(draft));
    const tamperedId = structuredClone(proposal);
    tamperedId.relationProposalId = "DREL_TAMPERED";
    expect(() => assertStructuralRelationProposal(draft, tamperedId)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH");
    const foreign = createDecisionContextDraft({
      sourceStateReferences: [reference("FOREIGN")],
      items: [
        { role: "DECISION_QUESTION", statement: "Should the system proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human-1" } },
        { role: "OBJECTIVE", statement: "Preserve service availability.", provenance: { origin: "HUMAN_INPUT", actorId: "human-1" } },
        { role: "CONSTRAINT", statement: "Do not exceed the approved window.", provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" } }
      ]
    });
    expect(() => assertStructuralRelationProposal(foreign, proposal)).toThrow("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  });

  it("has no detector/evaluator coupling or public finding and decision concepts", () => {
    const directory = resolve(process.cwd(), "lib/decision-core/structural-findings");
    const relationFiles = sourceFiles(directory).filter((file) => /relation(?:-|\.)/.test(file));
    const prohibitedRelationSpecifiers = relationFiles.flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8")).filter((specifier) =>
      ["../evidence-binding", "./expectation", "./types", "career", "capability-core", "matching", "recommendation", "recommendations", "career/decisions", "decision-looper"].some((term) => specifier.toLowerCase().includes(term))
    ));
    expect(prohibitedRelationSpecifiers).toEqual([]);
    const forbiddenExports = ["Gap", "GapProposal", "GapFinding", "StructuralGap", "StructuralGapProposal", "ContradictionFinding", "DependencyFinding", "Consequence", "ConsequenceProposal", "DecisionNeed", "DecisionNeedProposal", "Priority", "Score", "Confidence", "Ranking", "Recommendation", "HumanDecision", "Action", "Outcome", "Feedback", "buildStructuralRelationProposalId", "canonicalStructuralRelationProvenance", "structuralRelationReferenceKey"];
    const entry = resolve(process.cwd(), "lib/decision-core/structural-findings/index.ts");
    expect(publicExportNames(entry).filter((name) => forbiddenExports.includes(name))).toEqual([]);
    expect(createStructuralRelationProposal.length).toBe(2);
  });
});
