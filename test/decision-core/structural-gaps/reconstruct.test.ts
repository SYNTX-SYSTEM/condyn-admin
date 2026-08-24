import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  assertStructuralGap,
  createDecisionContextDraft,
  createStructuralExpectation,
  createStructuralRelationProposal,
  reconstructStructuralGap,
  type AuthoritativeStateReference,
  type DecisionContextDraft,
  type SemanticEvidenceBindingProposal,
  type StructuralExpectation,
  type StructuralGapObservationBasis
} from "../../../lib/decision-core";

const reference = (): AuthoritativeStateReference => ({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" });

const context = (): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference()],
  items: [
    { role: "DECISION_QUESTION", statement: "Should the system proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Preserve availability.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Remain in the approved window.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});

const item = (draft: DecisionContextDraft, role: string) => {
  const value = draft.items.find((candidate) => candidate.role === role);
  if (value === undefined) throw new Error(`missing ${role}`);
  return value;
};

const expectation = (draft: DecisionContextDraft, kind: StructuralExpectation["kind"]): StructuralExpectation => {
  if (kind === "EVIDENCE_BINDING") return createStructuralExpectation(draft, { kind, subjectItemId: item(draft, "OBJECTIVE").itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  if (kind === "CONTEXT_ROLE") return createStructuralExpectation(draft, { kind, role: "OPTION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  return createStructuralExpectation(draft, { kind, dependentItemId: item(draft, "OBJECTIVE").itemId, prerequisiteItemId: item(draft, "CONSTRAINT").itemId, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
};

const binding = (draft: DecisionContextDraft, disposition: SemanticEvidenceBindingProposal["disposition"], itemId = item(draft, "OBJECTIVE").itemId, rationale = "Observed support."): SemanticEvidenceBindingProposal => {
  const bindingId = `EBIND_${createHash("sha256").update(JSON.stringify([
    "SEMANTIC_EVIDENCE_BINDING_V1", draft.contextId, itemId, [reference().producerId, reference().authorityContractId, reference().artifactId, reference().locator], disposition
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
  return { bindingId, contextId: draft.contextId, itemId, stateReference: reference(), disposition, rationale };
};

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const moduleSpecifiers = (source: string): string[] => {
  const file = ts.createSourceFile("structural-gaps.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const output: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) output.push(node.moduleSpecifier.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return output;
};
const publicExportNames = (entry: string): string[] => {
  const program = ts.createProgram({ rootNames: [entry], options: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, noEmit: true, skipLibCheck: true } });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  if (source === undefined) throw new Error("missing structural gap entry");
  const symbol = checker.getSymbolAtLocation(source);
  if (symbol === undefined) throw new Error("missing structural gap symbol");
  return checker.getExportsOfModule(symbol).flatMap((exported) => (exported.flags & ts.SymbolFlags.Alias) !== 0 ? [exported.getName(), checker.getAliasedSymbol(exported).getName()] : [exported.getName()]);
};

describe("Structural Gap reconstruction", () => {
  it("returns a CONTEXT_ROLE gap below the explicit minimum and null at or above it", () => {
    const draft = context();
    const roleExpectation = expectation(draft, "CONTEXT_ROLE");
    const gap = reconstructStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" });
    expect(gap).toMatchObject({ artifactKind: "STRUCTURAL_GAP", kind: "CONTEXT_ROLE", minimumCount: 1, observedCount: 0, observedItemIds: [] });
    const withOption = createDecisionContextDraft({ sourceStateReferences: [reference()], items: [...draft.items.map(({ role, statement, provenance }) => ({ role, statement, provenance })), { role: "OPTION", statement: "Proceed", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }] });
    const satisfied = createStructuralExpectation(withOption, { kind: "CONTEXT_ROLE", role: "OPTION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
    expect(reconstructStructuralGap(withOption, satisfied, { kind: "CONTEXT_ROLE" })).toBeNull();
  });

  it("reconstructs EVIDENCE_BINDING gaps only against the supplied basis", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    const empty = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [] });
    const nonSupporting = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [binding(draft, "NOT_SUPPORTED")] });
    const satisfied = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [binding(draft, "SUPPORTED")] });
    expect(empty).not.toBeNull();
    expect(nonSupporting).not.toBeNull();
    expect(empty?.gapId).not.toBe(nonSupporting?.gapId);
    expect(satisfied).toBeNull();
  });

  it("validates EBIND artifacts and ignores bindings for other items", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    const other = binding(draft, "SUPPORTED", item(draft, "CONSTRAINT").itemId);
    const gap = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [other] });
    expect(gap).toMatchObject({ kind: "EVIDENCE_BINDING", observedBindingIds: [] });
    const fake = { ...binding(draft, "SUPPORTED"), bindingId: "EBIND_FAKE" };
    expect(() => reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [fake] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    const nonCanonicalRationale = { ...binding(draft, "SUPPORTED"), rationale: " support " };
    expect(() => reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [nonCanonicalRationale] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
  });

  it("reconstructs DEPENDENCY gaps, preserves reverse proposals as observations, and does not consume contradictions", () => {
    const draft = context();
    const dependencyExpectation = expectation(draft, "DEPENDENCY");
    if (dependencyExpectation.kind !== "DEPENDENCY") throw new Error("wrong fixture");
    const reverse = createStructuralRelationProposal(draft, { kind: "DEPENDENCY", dependentItemId: dependencyExpectation.prerequisiteItemId, prerequisiteItemId: dependencyExpectation.dependentItemId, provenance: { origin: "MODEL_PROPOSAL", proposalRef: "reverse" } });
    const contradiction = createStructuralRelationProposal(draft, { kind: "CONTRADICTION", itemIds: [dependencyExpectation.dependentItemId, dependencyExpectation.prerequisiteItemId], provenance: { origin: "HUMAN_INPUT", actorId: "relation" } });
    const reverseGap = reconstructStructuralGap(draft, dependencyExpectation, { kind: "DEPENDENCY", relationProposals: [contradiction, reverse] });
    expect(reverseGap).toMatchObject({ kind: "DEPENDENCY", observedRelationProposalIds: [reverse.relationProposalId] });
    const exact = createStructuralRelationProposal(draft, { kind: "DEPENDENCY", dependentItemId: dependencyExpectation.dependentItemId, prerequisiteItemId: dependencyExpectation.prerequisiteItemId, provenance: { origin: "MODEL_PROPOSAL", proposalRef: "exact" } });
    expect(reconstructStructuralGap(draft, dependencyExpectation, { kind: "DEPENDENCY", relationProposals: [reverse, exact] })).toBeNull();
  });

  it("requires matching basis kind and rejects relation artifacts that fail sealed assertion", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    expect(() => reconstructStructuralGap(draft, evidenceExpectation, { kind: "CONTEXT_ROLE" } as StructuralGapObservationBasis)).toThrow("ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
    const dependencyExpectation = expectation(draft, "DEPENDENCY");
    const relation = createStructuralRelationProposal(draft, { kind: "DEPENDENCY", dependentItemId: item(draft, "OBJECTIVE").itemId, prerequisiteItemId: item(draft, "CONSTRAINT").itemId, provenance: { origin: "HUMAN_INPUT", actorId: "relation" } });
    const invalid = { ...relation, relationProposalId: "DREL_FAKE" };
    expect(() => reconstructStructuralGap(draft, dependencyExpectation, { kind: "DEPENDENCY", relationProposals: [invalid] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID");
  });

  it("uses exact DGAP identity and requires canonical stored gap arrays", () => {
    const secondReference: AuthoritativeStateReference = { producerId: "PRODUCER_2", authorityContractId: "CONTRACT_2", artifactId: "ARTIFACT_2", locator: "locator-2" };
    const draft = createDecisionContextDraft({ sourceStateReferences: [reference(), secondReference], items: [
      { role: "DECISION_QUESTION", statement: "Should the system proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "OBJECTIVE", statement: "Preserve availability.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "CONSTRAINT", statement: "Remain in the approved window.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
    ] });
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    const first = binding(draft, "NOT_SUPPORTED", item(draft, "OBJECTIVE").itemId, "First.");
    const secondBindingId = `EBIND_${createHash("sha256").update(JSON.stringify([
      "SEMANTIC_EVIDENCE_BINDING_V1", draft.contextId, item(draft, "OBJECTIVE").itemId, [secondReference.producerId, secondReference.authorityContractId, secondReference.artifactId, secondReference.locator], "CONTRADICTED"
    ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    const second: SemanticEvidenceBindingProposal = { bindingId: secondBindingId, contextId: draft.contextId, itemId: item(draft, "OBJECTIVE").itemId, stateReference: secondReference, disposition: "CONTRADICTED", rationale: "Second." };
    const gap = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [second, first] });
    if (gap === null || gap.kind !== "EVIDENCE_BINDING") throw new Error("missing gap");
    const expected = `DGAP_${createHash("sha256").update(JSON.stringify([
      "STRUCTURAL_GAP_V1", draft.contextId, evidenceExpectation.expectationId, "EVIDENCE_BINDING", [gap.subjectItemId, gap.acceptedDispositions, gap.observedBindingIds]
    ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    expect(gap.gapId).toBe(expected);
    const reordered = structuredClone(gap);
    reordered.observedBindingIds.reverse();
    const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [second, first] };
    expect(() => assertStructuralGap(draft, evidenceExpectation, basis, reordered)).toThrow("ERR_DECISION_STRUCTURAL_GAP_INVALID");
    const tampered = structuredClone(gap);
    tampered.gapId = "DGAP_FAKE";
    expect(() => assertStructuralGap(draft, evidenceExpectation, basis, tampered)).toThrow("ERR_DECISION_STRUCTURAL_GAP_ID_MISMATCH");
  });

  it("returns detached gaps and exposes no authority or decision dependencies", () => {
    const draft = context();
    const roleExpectation = expectation(draft, "CONTEXT_ROLE");
    const gap = reconstructStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" });
    if (gap === null || gap.kind !== "CONTEXT_ROLE") throw new Error("missing gap");
    const original = structuredClone(gap);
    gap.observedItemIds.push("tampered");
    expect(reconstructStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" })).toEqual(original);
    expect(reconstructStructuralGap.length).toBe(3);
  });

  it("rejects stored CONTEXT_ROLE count divergence", () => {
    const draft = context();
    const roleExpectation = expectation(draft, "CONTEXT_ROLE");
    const gap = reconstructStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" });
    if (gap === null || gap.kind !== "CONTEXT_ROLE") throw new Error("missing gap");
    const tampered = structuredClone(gap);
    tampered.observedCount = 1;
    expect(() => assertStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" }, tampered)).toThrow("ERR_DECISION_STRUCTURAL_GAP_INVALID");
  });

  it("keeps structural gaps generic and excludes later decision concepts from its public surface", () => {
    const directory = resolve(process.cwd(), "lib/decision-core/structural-gaps");
    const forbiddenImports = sourceFiles(directory).flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8")).filter((specifier) => ["career", "capability-core", "matching", "recommendation", "decision-looper"].some((term) => specifier.toLowerCase().includes(term))));
    expect(forbiddenImports).toEqual([]);
    const forbiddenExports = ["Consequence", "DecisionNeed", "Priority", "Score", "Confidence", "Ranking", "Recommendation", "HumanDecision", "Action", "Outcome", "Feedback", "buildStructuralGapId", "compareStructuralGapStrings"];
    expect(publicExportNames(resolve(directory, "index.ts")).filter((name) => forbiddenExports.includes(name))).toEqual([]);
  });

  it("rejects a self-consistent CONTEXT_ROLE gap under a satisfying represented basis", () => {
    const draft = createDecisionContextDraft({ sourceStateReferences: [reference()], items: [
      { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
      { role: "OPTION", statement: "Proceed", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
    ] });
    const roleExpectation = createStructuralExpectation(draft, { kind: "CONTEXT_ROLE", role: "OPTION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
    const observedItemIds = [item(draft, "OPTION").itemId];
    const gapId = `DGAP_${createHash("sha256").update(JSON.stringify([
      "STRUCTURAL_GAP_V1", draft.contextId, roleExpectation.expectationId, "CONTEXT_ROLE", ["OPTION", 1, observedItemIds]
    ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    const fakeGap = { artifactKind: "STRUCTURAL_GAP" as const, schemaVersion: "STRUCTURAL_GAP_V1" as const, gapId, contextId: draft.contextId, expectationId: roleExpectation.expectationId, kind: "CONTEXT_ROLE" as const, role: "OPTION" as const, minimumCount: 1, observedCount: 1, observedItemIds };
    expect(reconstructStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" })).toBeNull();
    expect(() => assertStructuralGap(draft, roleExpectation, { kind: "CONTEXT_ROLE" }, fakeGap)).toThrow("ERR_DECISION_STRUCTURAL_GAP_INVALID");
  });

  it("rejects two distinct EBIND IDs for one sealed item/reference target", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    expect(() => reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [binding(draft, "SUPPORTED"), binding(draft, "CONTRADICTED")] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
  });

  it("classifies a hostile nested EBIND at the binding boundary", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    const hostile = binding(draft, "NOT_SUPPORTED");
    Object.defineProperty(hostile, "rationale", { enumerable: true, get: () => "must not read" });
    expect(() => reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [hostile] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
  });

  it("preserves malformed observation-basis wrapper errors during stored-gap assertion", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    const gap = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [] });
    if (gap === null) throw new Error("missing gap");
    const malformedBasis = { kind: "EVIDENCE_BINDING", bindings: [], extra: true };
    expect(() => Reflect.apply(assertStructuralGap, undefined, [draft, evidenceExpectation, malformedBasis, gap])).toThrow("ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
  });

  it("preserves hostile nested EBIND errors during stored-gap assertion", () => {
    const draft = context();
    const evidenceExpectation = expectation(draft, "EVIDENCE_BINDING");
    const gap = reconstructStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [] });
    if (gap === null) throw new Error("missing gap");
    const hostile = binding(draft, "NOT_SUPPORTED");
    Object.defineProperty(hostile, "rationale", { enumerable: true, get: () => "must not read" });
    expect(() => assertStructuralGap(draft, evidenceExpectation, { kind: "EVIDENCE_BINDING", bindings: [hostile] }, gap)).toThrow("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
  });

  it("preserves invalid nested DREL errors during stored-gap assertion", () => {
    const draft = context();
    const dependencyExpectation = expectation(draft, "DEPENDENCY");
    if (dependencyExpectation.kind !== "DEPENDENCY") throw new Error("wrong fixture");
    const gap = reconstructStructuralGap(draft, dependencyExpectation, { kind: "DEPENDENCY", relationProposals: [] });
    if (gap === null) throw new Error("missing gap");
    const relation = createStructuralRelationProposal(draft, { kind: "DEPENDENCY", dependentItemId: dependencyExpectation.dependentItemId, prerequisiteItemId: dependencyExpectation.prerequisiteItemId, provenance: { origin: "HUMAN_INPUT", actorId: "relation" } });
    const invalid = { ...relation, relationProposalId: "DREL_FAKE" };
    expect(() => assertStructuralGap(draft, dependencyExpectation, { kind: "DEPENDENCY", relationProposals: [invalid] }, gap)).toThrow("ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID");
  });
});
