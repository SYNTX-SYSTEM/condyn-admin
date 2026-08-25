import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  assertStructuralConsequence,
  createDecisionContextDraft,
  createStructuralExpectation,
  createStructuralRelationProposal,
  reconstructStructuralConsequence,
  reconstructStructuralGap,
  type DecisionContextDraft,
  type StructuralExpectation,
  type StructuralGap,
  type StructuralGapObservationBasis,
  type StructuralRelationProposal
} from "../../../lib/decision-core";

const reference = () => ({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" });

const context = (): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference()],
  items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Protect source.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Maintain middle one.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "ASSUMPTION", statement: "Maintain middle two.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Protect target.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});

const item = (draft: DecisionContextDraft, role: string) => {
  const found = draft.items.find((candidate) => candidate.role === role);
  if (found === undefined) throw new Error(`missing ${role}`);
  return found;
};

const evidenceExpectation = (draft: DecisionContextDraft): StructuralExpectation => createStructuralExpectation(draft, {
  kind: "EVIDENCE_BINDING",
  subjectItemId: item(draft, "OBJECTIVE").itemId,
  acceptedDispositions: ["SUPPORTED"],
  provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});

const dependencyExpectation = (draft: DecisionContextDraft): StructuralExpectation => createStructuralExpectation(draft, {
  kind: "DEPENDENCY",
  dependentItemId: item(draft, "OBJECTIVE").itemId,
  prerequisiteItemId: item(draft, "CONSTRAINT").itemId,
  provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});

const evidenceGap = (draft: DecisionContextDraft, expectation = evidenceExpectation(draft)): StructuralGap => {
  const gap = reconstructStructuralGap(draft, expectation, { kind: "EVIDENCE_BINDING", bindings: [] });
  if (gap === null || gap.kind !== "EVIDENCE_BINDING") throw new Error("missing evidence gap");
  return gap;
};

const dependency = (draft: DecisionContextDraft, dependentItemId: string, prerequisiteItemId: string, actorId: string): Extract<StructuralRelationProposal, { kind: "DEPENDENCY" }> => {
  const proposal = createStructuralRelationProposal(draft, {
    kind: "DEPENDENCY",
    dependentItemId,
    prerequisiteItemId,
    provenance: { origin: "HUMAN_INPUT", actorId }
  });
  if (proposal.kind !== "DEPENDENCY") throw new Error("wrong fixture");
  return proposal;
};

const source = (draft: DecisionContextDraft) => item(draft, "OBJECTIVE").itemId;
const middleOne = (draft: DecisionContextDraft) => item(draft, "CONSTRAINT").itemId;
const middleTwo = (draft: DecisionContextDraft) => item(draft, "ASSUMPTION").itemId;
const target = (draft: DecisionContextDraft) => item(draft, "OPTION").itemId;
const emptyEvidenceBasis: StructuralGapObservationBasis = { kind: "EVIDENCE_BINDING", bindings: [] };

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const moduleSpecifiers = (source: string): string[] => {
  const file = ts.createSourceFile("structural-consequences.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) specifiers.push(node.moduleSpecifier.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return specifiers;
};
const publicExportNames = (entry: string): string[] => {
  const program = ts.createProgram({ rootNames: [entry], options: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, noEmit: true, skipLibCheck: true } });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entry);
  if (sourceFile === undefined) throw new Error("missing entry");
  const module = checker.getSymbolAtLocation(sourceFile);
  if (module === undefined) throw new Error("missing module");
  return checker.getExportsOfModule(module).flatMap((exported) => (exported.flags & ts.SymbolFlags.Alias) !== 0 ? [exported.getName(), checker.getAliasedSymbol(exported).getName()] : [exported.getName()]);
};

describe("Structural consequence propagation", () => {
  it("reconstructs canonical one-hop and multi-hop consequences from an item-anchored evidence gap", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const one = dependency(draft, middleOne(draft), source(draft), "one");
    const two = dependency(draft, target(draft), middleOne(draft), "two");
    const oneHop = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [one] });
    const multiHop = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [one, two] });
    expect(oneHop).toMatchObject({ artifactKind: "STRUCTURAL_CONSEQUENCE", sourceGapId: gap.gapId, sourceItemId: source(draft), affectedItemId: middleOne(draft), dependencyPathRelationProposalIds: [one.relationProposalId] });
    expect(multiHop).toMatchObject({ sourceItemId: source(draft), affectedItemId: target(draft), dependencyPathRelationProposalIds: [one.relationProposalId, two.relationProposalId] });
  });

  it("uses a DEPENDENCY gap's dependent item as its source and rejects a CONTEXT_ROLE source", () => {
    const draft = context();
    const expectation = dependencyExpectation(draft);
    const gapBasis: StructuralGapObservationBasis = { kind: "DEPENDENCY", relationProposals: [] };
    const gap = reconstructStructuralGap(draft, expectation, gapBasis);
    if (gap === null || gap.kind !== "DEPENDENCY") throw new Error("missing dependency gap");
    const path = dependency(draft, target(draft), source(draft), "path");
    expect(reconstructStructuralConsequence(draft, expectation, gapBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [path] }).sourceItemId).toBe(source(draft));
    const roleExpectation = createStructuralExpectation(draft, { kind: "CONTEXT_ROLE", role: "UNCERTAINTY", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "role" } });
    const roleBasis: StructuralGapObservationBasis = { kind: "CONTEXT_ROLE" };
    const roleGap = reconstructStructuralGap(draft, roleExpectation, roleBasis);
    if (roleGap === null) throw new Error("missing role gap");
    expect(() => reconstructStructuralConsequence(draft, roleExpectation, roleBasis, roleGap, { kind: "DEPENDENCY_PATH", relationProposals: [path] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED");
  });

  it("rejects invalid propagation basis, nested relation artifacts, and invalid supplied-path topology", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const valid = dependency(draft, middleOne(draft), source(draft), "valid");
    expect(() => Reflect.apply(reconstructStructuralConsequence, undefined, [draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [], extra: true }])).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [{ ...valid, relationProposalId: "DREL_FAKE" }] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
    const contradiction = createStructuralRelationProposal(draft, { kind: "CONTRADICTION", itemIds: [source(draft), middleOne(draft)], provenance: { origin: "HUMAN_INPUT", actorId: "contradiction" } });
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [contradiction] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
    const wrongFirst = dependency(draft, target(draft), middleOne(draft), "wrong-first");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [wrongFirst] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
    const broken = dependency(draft, target(draft), middleTwo(draft), "broken");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [valid, broken] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [valid, valid] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
    const cycle = dependency(draft, source(draft), middleOne(draft), "cycle");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [valid, cycle] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
  });

  it("uses the exact ordered DCONS_ tuple and preserves path identity", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const first = dependency(draft, middleOne(draft), source(draft), "first");
    const viaOne = dependency(draft, target(draft), middleOne(draft), "via-one");
    const viaTwoStart = dependency(draft, middleTwo(draft), source(draft), "via-two-start");
    const viaTwo = dependency(draft, target(draft), middleTwo(draft), "via-two");
    const left = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [first, viaOne] });
    const same = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [first, viaOne] });
    const right = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [viaTwoStart, viaTwo] });
    const expected = `DCONS_${createHash("sha256").update(JSON.stringify(["STRUCTURAL_CONSEQUENCE_V1", draft.contextId, gap.gapId, [first.relationProposalId, viaOne.relationProposalId]]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    expect(left.consequenceId).toBe(expected);
    expect(same).toEqual(left);
    expect(right.affectedItemId).toBe(left.affectedItemId);
    expect(right.consequenceId).not.toBe(left.consequenceId);
  });

  it("basis-binds stored assertion and keeps derived fields and ordered path immutable", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const first = dependency(draft, middleOne(draft), source(draft), "first");
    const second = dependency(draft, target(draft), middleOne(draft), "second");
    const basis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [first, second] };
    const consequence = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis);
    assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis, consequence);
    const reordered = structuredClone(consequence);
    reordered.dependencyPathRelationProposalIds.reverse();
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis, reordered)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    const wrongSource = structuredClone(consequence);
    wrongSource.sourceItemId = middleOne(draft);
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis, wrongSource)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    const wrongAffected = structuredClone(consequence);
    wrongAffected.affectedItemId = middleOne(draft);
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis, wrongAffected)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    const wrongId = structuredClone(consequence);
    wrongId.consequenceId = "DCONS_FAKE";
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis, wrongId)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_ID_MISMATCH");
    const alternate = dependency(draft, target(draft), middleTwo(draft), "alternate");
    const alternateStart = dependency(draft, middleTwo(draft), source(draft), "alternate-start");
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [alternateStart, alternate] }, consequence)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    basis.relationProposals[0] = alternateStart;
    expect(consequence.dependencyPathRelationProposalIds).toEqual([first.relationProposalId, second.relationProposalId]);
  });

  it("propagates sealed source-gap errors and exposes only the adjacent generic consequence surface", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const path = dependency(draft, middleOne(draft), source(draft), "path");
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, { ...gap, gapId: "DGAP_FAKE" }, { kind: "DEPENDENCY_PATH", relationProposals: [path] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_ID_MISMATCH");
    expect(() => reconstructStructuralConsequence(draft, expectation, { kind: "EVIDENCE_BINDING", bindings: [{}] } as unknown as StructuralGapObservationBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [path] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    expect(reconstructStructuralConsequence.length).toBe(5);
    expect(assertStructuralConsequence.length).toBe(6);
    const directory = resolve(process.cwd(), "lib/decision-core/structural-consequences");
    const forbiddenImports = sourceFiles(directory).flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8")).filter((specifier) => ["career", "recruiting", "capability-core", "matching", "recommendation", "decision-looper"].some((term) => specifier.toLowerCase().includes(term))));
    expect(forbiddenImports).toEqual([]);
    const forbidden = ["buildStructuralConsequenceId", "DecisionNeed", "Priority", "Score", "Confidence", "Severity", "Probability", "Ranking", "Recommendation", "HumanDecision", "Action", "Outcome", "Feedback"];
    expect(publicExportNames(resolve(directory, "index.ts")).filter((name) => forbidden.includes(name))).toEqual([]);
    const rootIndex = resolve(process.cwd(), "lib/decision-core/index.ts");
    expect(moduleSpecifiers(readFileSync(rootIndex, "utf8"))).toContain("./structural-consequences");
    const predecessorForbidden = ["Consequence", "StructuralConsequence"];
    expect(publicExportNames(resolve(process.cwd(), "lib/decision-core/structural-findings/index.ts")).filter((name) => predecessorForbidden.includes(name))).toEqual([]);
    expect(publicExportNames(resolve(process.cwd(), "lib/decision-core/structural-gaps/index.ts")).filter((name) => predecessorForbidden.includes(name))).toEqual([]);
  });

  it("validates the sealed expectation before inspecting its supplied gap basis", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const invalidExpectation = { ...expectation, expectationId: "DEXP_FAKE" };
    const path = dependency(draft, middleOne(draft), source(draft), "path");
    expect(() => reconstructStructuralConsequence(draft, invalidExpectation, { kind: "EVIDENCE_BINDING", bindings: [], extra: true } as unknown as StructuralGapObservationBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [path] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID");
    expect(() => reconstructStructuralConsequence(draft, invalidExpectation, { kind: "EVIDENCE_BINDING", bindings: [{}] } as unknown as StructuralGapObservationBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [path] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID");
  });

  it("preserves hostile propagation and stored-consequence boundaries while detaching DREL inputs", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = evidenceGap(draft, expectation);
    const relation = dependency(draft, middleOne(draft), source(draft), "relation");
    const basis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [relation] };
    const consequence = reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, basis);
    const accessorRelation = structuredClone(relation);
    Object.defineProperty(accessorRelation, "relationProposalId", { enumerable: true, get: () => "must not read" });
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [accessorRelation] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID");
    const symbolRelation = structuredClone(relation);
    Object.defineProperty(symbolRelation, Symbol("hidden"), { enumerable: true, value: true });
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: [symbolRelation] })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID");
    const malformedContainer = [relation] as StructuralRelationProposal[];
    Object.defineProperty(malformedContainer, "extra", { enumerable: true, value: true });
    expect(() => reconstructStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, { kind: "DEPENDENCY_PATH", relationProposals: malformedContainer })).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID");
    relation.dependentItemId = target(draft);
    expect(consequence).toMatchObject({ affectedItemId: middleOne(draft), dependencyPathRelationProposalIds: [basis.relationProposals[0].relationProposalId] });
    const assertionRelation = dependency(draft, middleOne(draft), source(draft), "relation");
    const assertionBasis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [assertionRelation] };
    const accessorConsequence = structuredClone(consequence);
    Object.defineProperty(accessorConsequence, "affectedItemId", { enumerable: true, get: () => "must not read" });
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, assertionBasis, accessorConsequence)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    const symbolConsequence = structuredClone(consequence);
    Object.defineProperty(symbolConsequence, Symbol("hidden"), { enumerable: true, value: true });
    expect(() => assertStructuralConsequence(draft, expectation, emptyEvidenceBasis, gap, assertionBasis, symbolConsequence)).toThrow("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
  });
});
