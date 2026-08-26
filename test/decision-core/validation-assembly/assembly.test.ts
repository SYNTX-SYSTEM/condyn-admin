import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  assembleDecisionContextValidation,
  assertDecisionContextValidationAssembly,
  createDecisionContextDraft,
  createStructuralExpectation,
  createStructuralRelationProposal,
  reconstructStructuralConsequence,
  reconstructStructuralGap,
  type DecisionContextDraft,
  type StructuralRelationProposal
} from "../../../lib/decision-core";

const reference = () => ({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" });
const secondReference = () => ({ producerId: "PRODUCER_2", authorityContractId: "CONTRACT_2", artifactId: "ARTIFACT_2", locator: "locator-2" });
const context = (): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference()],
  items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Protect source.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Protect target.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Alternative.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});
const item = (draft: ReturnType<typeof context>, role: string) => {
  const found = draft.items.find((candidate) => candidate.role === role);
  if (found === undefined) throw new Error(`missing ${role}`);
  return found;
};
const evidenceExpectation = (draft: ReturnType<typeof context>) => createStructuralExpectation(draft, {
  kind: "EVIDENCE_BINDING", subjectItemId: item(draft, "OBJECTIVE").itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});
const roleExpectation = (draft: ReturnType<typeof context>) => createStructuralExpectation(draft, {
  kind: "CONTEXT_ROLE", role: "OPTION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});
const coreDependencyExpectation = (draft: ReturnType<typeof context>) => createStructuralExpectation(draft, {
  kind: "DEPENDENCY", dependentItemId: item(draft, "OBJECTIVE").itemId, prerequisiteItemId: item(draft, "CONSTRAINT").itemId, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});
const dependency = (draft: ReturnType<typeof context>, dependentItemId: string, prerequisiteItemId: string, actorId: string) => createStructuralRelationProposal(draft, {
  kind: "DEPENDENCY", dependentItemId, prerequisiteItemId, provenance: { origin: "HUMAN_INPUT", actorId }
});
const evidenceBasis = { kind: "EVIDENCE_BINDING" as const, bindings: [] };
const binding = (draft: DecisionContextDraft, stateReference: ReturnType<typeof reference>, disposition: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "CONTRADICTED", itemId = item(draft, "OBJECTIVE").itemId) => ({
  bindingId: `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", draft.contextId, itemId, [stateReference.producerId, stateReference.authorityContractId, stateReference.artifactId, stateReference.locator], disposition]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`,
  contextId: draft.contextId,
  itemId,
  stateReference,
  disposition,
  rationale: "Represented observation."
});
const gapFor = (draft: ReturnType<typeof context>, expectation = evidenceExpectation(draft)) => {
  const gap = reconstructStructuralGap(draft, expectation, evidenceBasis);
  if (gap === null) throw new Error("missing gap");
  return gap;
};
const source = (draft: ReturnType<typeof context>) => item(draft, "OBJECTIVE").itemId;
const target = (draft: ReturnType<typeof context>) => item(draft, "CONSTRAINT").itemId;
const consequenceInput = (draft: ReturnType<typeof context>, expectation = evidenceExpectation(draft), gap = gapFor(draft, expectation)) => {
  const relation = dependency(draft, target(draft), source(draft), "path");
  const propagationBasis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [relation] };
  const consequence = reconstructStructuralConsequence(draft, expectation, evidenceBasis, gap, propagationBasis);
  return { expectation, gapBasis: evidenceBasis, gap, propagationBasis, consequence };
};
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const moduleSpecifiers = (source: string): string[] => {
  const file = ts.createSourceFile("validation-assembly.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const output: string[] = [];
  const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) output.push(node.moduleSpecifier.text); ts.forEachChild(node, visit); };
  visit(file); return output;
};

describe("Decision Context Validation Assembly", () => {
  it("exposes the Phase-5C4 assembly APIs", () => {
    expect(assembleDecisionContextValidation).toBeTypeOf("function");
    expect(assertDecisionContextValidationAssembly).toBeTypeOf("function");
  });

  it("assembles empty, NO_GAP, and GAP expectation derivations canonically", () => {
    const draft = context();
    expect(assembleDecisionContextValidation(draft, { expectationValidations: [], consequenceValidations: [] })).toMatchObject({ artifactKind: "DECISION_CONTEXT_VALIDATION_ASSEMBLY", contextId: draft.contextId, expectationResults: [], consequenceIds: [] });
    const noGap = roleExpectation(draft);
    const gapExpectation = evidenceExpectation(draft);
    const gap = gapFor(draft, gapExpectation);
    const assembly = assembleDecisionContextValidation(draft, { expectationValidations: [
      { expectation: gapExpectation, basis: evidenceBasis, result: gap },
      { expectation: noGap, basis: { kind: "CONTEXT_ROLE" }, result: null }
    ], consequenceValidations: [] }) as unknown as Record<string, unknown>;
    expect(assembly.expectationResults).toEqual(expect.arrayContaining([
      expect.objectContaining({ expectationId: noGap.expectationId, outcome: "NO_GAP", basis: { kind: "CONTEXT_ROLE" } }),
      expect.objectContaining({ expectationId: gapExpectation.expectationId, outcome: "GAP", gapId: gap.gapId, basis: { kind: "EVIDENCE_BINDING", bindingIds: [] } })
    ]));
    expect(draft.validationStatus).toBe("NOT_RUN");
  });

  it("rejects result mismatches and duplicate expectation derivations", () => {
    const draft = context(); const expectation = evidenceExpectation(draft); const gap = gapFor(draft, expectation);
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation, basis: evidenceBasis, result: null }], consequenceValidations: [] })).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH");
    const role = roleExpectation(draft);
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: role, basis: { kind: "CONTEXT_ROLE" }, result: gap }], consequenceValidations: [] })).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH");
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation, basis: evidenceBasis, result: gap }, { expectation, basis: evidenceBasis, result: gap }], consequenceValidations: [] })).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_EXPECTATION");
  });

  it("canonicalizes entry order and binds DVASM identity to represented basis/results", () => {
    const draft = context(); const evidence = evidenceExpectation(draft); const gap = gapFor(draft, evidence); const role = roleExpectation(draft);
    const left = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: evidenceBasis, result: gap }, { expectation: role, basis: { kind: "CONTEXT_ROLE" }, result: null }], consequenceValidations: [] });
    const right = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: role, basis: { kind: "CONTEXT_ROLE" }, result: null }, { expectation: evidence, basis: evidenceBasis, result: gap }], consequenceValidations: [] });
    expect(right).toEqual(left);
    const expected = `DVASM_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1", draft.contextId, (left as { expectationResults: unknown[] }).expectationResults, []]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    expect((left as { assemblyId: string }).assemblyId).toBe(expected);
  });

  it("canonicalizes represented EBIND and DREL basis descriptors without deduplicating them", () => {
    const draft = createDecisionContextDraft({
      sourceStateReferences: [reference(), secondReference()],
      items: context().items.map(({ role, statement, provenance }) => ({ role, statement, provenance }))
    });
    const evidence = evidenceExpectation(draft);
    const first = binding(draft, reference(), "NOT_SUPPORTED");
    const second = binding(draft, secondReference(), "CONTRADICTED");
    const gap = reconstructStructuralGap(draft, evidence, { kind: "EVIDENCE_BINDING", bindings: [first, second] });
    if (gap === null) throw new Error("missing gap");
    const forward = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: { kind: "EVIDENCE_BINDING", bindings: [first, second] }, result: gap }], consequenceValidations: [] });
    const reverse = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: { kind: "EVIDENCE_BINDING", bindings: [second, first] }, result: gap }], consequenceValidations: [] });
    expect(reverse).toEqual(forward);
    expect(forward.expectationResults[0]).toMatchObject({ basis: { kind: "EVIDENCE_BINDING", bindingIds: [first.bindingId, second.bindingId].sort() } });
    const changedGap = reconstructStructuralGap(draft, evidence, { kind: "EVIDENCE_BINDING", bindings: [first] });
    if (changedGap === null) throw new Error("missing changed gap");
    const changed = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: { kind: "EVIDENCE_BINDING", bindings: [first] }, result: changedGap }], consequenceValidations: [] });
    expect(changed.assemblyId).not.toBe(forward.assemblyId);
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: { kind: "EVIDENCE_BINDING", bindings: [first, first] }, result: gap }], consequenceValidations: [] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
  });

  it("canonicalizes DEPENDENCY descriptor order and distinguishes same-gapId derivations with different full bases", () => {
    const draft = context();
    const expectation = coreDependencyExpectation(draft);
    if (expectation.kind !== "DEPENDENCY") throw new Error("wrong fixture");
    const first = dependency(draft, expectation.prerequisiteItemId, expectation.dependentItemId, "reverse-one");
    const second = dependency(draft, expectation.prerequisiteItemId, expectation.dependentItemId, "reverse-two");
    const forwardBasis = { kind: "DEPENDENCY" as const, relationProposals: [first, second] };
    const reverseBasis = { kind: "DEPENDENCY" as const, relationProposals: [second, first] };
    const gap = reconstructStructuralGap(draft, expectation, forwardBasis);
    if (gap === null) throw new Error("missing dependency gap");
    const forward = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation, basis: forwardBasis, result: gap }], consequenceValidations: [] });
    const reverse = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation, basis: reverseBasis, result: gap }], consequenceValidations: [] });
    expect(reverse).toEqual(forward);
    expect(forward.expectationResults[0]).toMatchObject({ basis: { kind: "DEPENDENCY", relationProposalIds: [first.relationProposalId, second.relationProposalId].sort() } });

    const evidence = evidenceExpectation(draft);
    const emptyGap = gapFor(draft, evidence);
    const irrelevant = binding(draft, reference(), "NOT_SUPPORTED", item(draft, "CONSTRAINT").itemId);
    const extendedBasis = { kind: "EVIDENCE_BINDING" as const, bindings: [irrelevant] };
    const extendedGap = reconstructStructuralGap(draft, evidence, extendedBasis);
    if (extendedGap === null) throw new Error("missing extended gap");
    expect(extendedGap.gapId).toBe(emptyGap.gapId);
    const emptyAssembly = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: evidenceBasis, result: emptyGap }], consequenceValidations: [] });
    const extendedAssembly = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: evidence, basis: extendedBasis, result: extendedGap }], consequenceValidations: [] });
    expect(extendedAssembly.assemblyId).not.toBe(emptyAssembly.assemblyId);
  });

  it("requires assembled GAP source derivations for consequences and permits multiple consequences", () => {
    const draft = context(); const input = consequenceInput(draft);
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [], consequenceValidations: [input] })).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING");
    const secondRelation = dependency(draft, target(draft), source(draft), "second-path");
    const secondBasis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [secondRelation] };
    const second = reconstructStructuralConsequence(draft, input.expectation, input.gapBasis, input.gap, secondBasis);
    const assembled = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input, { ...input, propagationBasis: secondBasis, consequence: second }] }) as { consequenceIds: string[] };
    expect(assembled.consequenceIds).toEqual([input.consequence.consequenceId, second.consequenceId].sort());
    const reordered = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [{ ...input, propagationBasis: secondBasis, consequence: second }, input] });
    expect(reordered).toEqual(assembled);
    const onlyFirst = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input] });
    expect(onlyFirst.assemblyId).not.toBe((assembled as unknown as { assemblyId: string }).assemblyId);
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input, input] })).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_CONSEQUENCE");
  });

  it("basis-binds stored assembly assertion and detaches output", () => {
    const draft = context(); const input = consequenceInput(draft);
    const assembly = assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input] });
    assertDecisionContextValidationAssembly(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input] }, assembly);
    const wrongId = structuredClone(assembly); wrongId.assemblyId = "DVASM_FAKE";
    expect(() => assertDecisionContextValidationAssembly(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input] }, wrongId)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_ID_MISMATCH");
    const wrongBody = structuredClone(assembly); wrongBody.consequenceIds = [];
    expect(() => assertDecisionContextValidationAssembly(draft, { expectationValidations: [{ expectation: input.expectation, basis: input.gapBasis, result: input.gap }], consequenceValidations: [input] }, wrongBody)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
    (input.propagationBasis.relationProposals as StructuralRelationProposal[])[0] = dependency(draft, target(draft), source(draft), "mutated");
    expect((assembly.consequenceIds as string[])).toEqual([input.consequence.consequenceId]);
  });

  it("accepts a structurally identical stored assembly when only nested object insertion order differs", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const gap = gapFor(draft, expectation);
    const input = { expectationValidations: [{ expectation, basis: evidenceBasis, result: gap }], consequenceValidations: [] };
    const assembly = assembleDecisionContextValidation(draft, input);
    const result = assembly.expectationResults[0];
    if (result === undefined || result.outcome !== "GAP") throw new Error("missing GAP result");
    const reorderedResult = {
      basis: result.basis,
      gapId: result.gapId,
      outcome: "GAP" as const,
      expectationId: result.expectationId
    };
    const reorderedAssembly = {
      artifactKind: assembly.artifactKind,
      schemaVersion: assembly.schemaVersion,
      assemblyId: assembly.assemblyId,
      contextId: assembly.contextId,
      expectationResults: [reorderedResult],
      consequenceIds: [...assembly.consequenceIds]
    };

    expect(Object.keys(result)).toEqual(["expectationId", "basis", "outcome", "gapId"]);
    expect(Object.keys(reorderedResult)).toEqual(["basis", "gapId", "outcome", "expectationId"]);
    expect(reorderedAssembly).toEqual(assembly);
    expect(reorderedAssembly.expectationResults).toEqual(assembly.expectationResults);
    expect(reorderedAssembly.consequenceIds).toEqual(assembly.consequenceIds);
    expect(() => assertDecisionContextValidationAssembly(draft, input, reorderedAssembly)).not.toThrow();
  });

  it("preserves predecessor errors and rejects hostile wrappers/stored artifacts", () => {
    const draft = context(); const expectation = evidenceExpectation(draft); const gap = gapFor(draft, expectation);
    expect(() => assembleDecisionContextValidation(draft, { expectationValidations: [{ expectation, basis: { kind: "EVIDENCE_BINDING", bindings: [{}] } as never, result: gap }], consequenceValidations: [] })).toThrow("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    const hostile = { expectationValidations: [], consequenceValidations: [] as unknown[] };
    Object.defineProperty(hostile, Symbol("hidden"), { enumerable: true, value: true });
    expect(() => assembleDecisionContextValidation(draft, hostile as never)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
    const accessor = { expectationValidations: [], consequenceValidations: [] as unknown[] };
    Object.defineProperty(accessor, "expectationValidations", { enumerable: true, get: () => [] });
    expect(() => assembleDecisionContextValidation(draft, accessor as never)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
    const assembly = assembleDecisionContextValidation(draft, { expectationValidations: [], consequenceValidations: [] }) as unknown as Record<string, unknown>;
    Object.defineProperty(assembly, "contextId", { enumerable: true, get: () => "bad" });
    expect(() => assertDecisionContextValidationAssembly(draft, { expectationValidations: [], consequenceValidations: [] }, assembly as never)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
    const symbolAssembly = assembleDecisionContextValidation(draft, { expectationValidations: [], consequenceValidations: [] }) as unknown as Record<string, unknown>;
    Object.defineProperty(symbolAssembly, Symbol("hidden"), { enumerable: true, value: true });
    expect(() => assertDecisionContextValidationAssembly(draft, { expectationValidations: [], consequenceValidations: [] }, symbolAssembly as never)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
  });

  it("preserves Phase-5B context errors instead of relabeling them as structural-gap context failures", () => {
    const draft = context();
    const wrongId = structuredClone(draft);
    wrongId.contextId = "DCTX_FAKE";
    expect(() => assembleDecisionContextValidation(wrongId, { expectationValidations: [], consequenceValidations: [] })).toThrow("ERR_DECISION_CONTEXT_ID_MISMATCH");
    const missingQuestion = structuredClone(draft);
    missingQuestion.items = missingQuestion.items.filter((candidate) => candidate.role !== "DECISION_QUESTION");
    expect(() => assembleDecisionContextValidation(missingQuestion, { expectationValidations: [], consequenceValidations: [] })).toThrow("ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT");
  });

  it("uses one detached basis snapshot for derivation and the committed descriptor", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const irrelevant = binding(draft, reference(), "NOT_SUPPORTED", item(draft, "CONSTRAINT").itemId);
    let bindingReads = 0;
    const basis = new Proxy({ kind: "EVIDENCE_BINDING", bindings: [] as unknown[] }, {
      ownKeys: () => ["kind", "bindings"],
      getOwnPropertyDescriptor: (_target, key) => {
        if (key === "kind") return { enumerable: true, configurable: true, value: "EVIDENCE_BINDING" };
        if (key === "bindings") {
          bindingReads += 1;
          return { enumerable: true, configurable: true, value: bindingReads === 1 ? [] : [irrelevant] };
        }
        return undefined;
      }
    });
    const assembled = assembleDecisionContextValidation(draft, {
      expectationValidations: [{ expectation, basis: basis as never, result: gapFor(draft, expectation) }],
      consequenceValidations: []
    });
    expect(assembled.expectationResults).toEqual([expect.objectContaining({ basis: { kind: "EVIDENCE_BINDING", bindingIds: [] } })]);
  });

  it("detaches expectation/basis input and rejects hostile nested stored assembly data", () => {
    const draft = context();
    const expectation = evidenceExpectation(draft);
    const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [] as Array<ReturnType<typeof binding>> };
    const gap = gapFor(draft, expectation);
    const input = { expectationValidations: [{ expectation, basis, result: gap }], consequenceValidations: [] };
    const assembly = assembleDecisionContextValidation(draft, input);
    expectation.expectationId = "DEXP_FAKE";
    basis.bindings.push(binding(draft, reference(), "NOT_SUPPORTED", item(draft, "CONSTRAINT").itemId));
    expect(assembly.expectationResults).toEqual([expect.objectContaining({ outcome: "GAP", basis: { kind: "EVIDENCE_BINDING", bindingIds: [] } })]);
    const hostile = structuredClone(assembly);
    Object.defineProperty(hostile.expectationResults[0].basis, "kind", { enumerable: true, get: () => "EVIDENCE_BINDING" });
    expect(() => assertDecisionContextValidationAssembly(draft, { expectationValidations: [{ expectation: evidenceExpectation(draft), basis: evidenceBasis, result: gapFor(draft) }], consequenceValidations: [] }, hostile)).toThrow("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
  });

  it("keeps the module generic and exposes no authority or later-decision surface", () => {
    const directory = resolve(process.cwd(), "lib/decision-core/validation-assembly");
    const imports = sourceFiles(directory).flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8")));
    expect(imports.filter((value) => ["career", "recruiting", "capability-core", "matching", "recommendation", "decision-looper", "../authority", "../validation", "../evidence-binding"].some((term) => value.toLowerCase().includes(term)))).toEqual([]);
    expect(imports).not.toContain("../evidence-binding");
    const source = readFileSync(resolve(directory, "index.ts"), "utf8");
    expect(source).not.toContain("buildDecisionContextValidationAssemblyId");
    expect(source).not.toMatch(/DecisionNeed|Score|Confidence|Priority|Recommendation|HumanDecision|Action|Outcome|Feedback/);
  });
});
