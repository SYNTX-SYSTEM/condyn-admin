import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createStructuralExpectation,
  createStructuralRelationProposal,
  reconstructStructuralConsequence,
  reconstructStructuralGap,
  assertDecisionContextRevision,
  type DecisionContextDraft,
  type DecisionContextValidationAssemblyInput
} from "../../../lib/decision-core";

const reference = () => ({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" });
const secondReference = () => ({ producerId: "PRODUCER_TWO", authorityContractId: "CONTRACT_TWO", artifactId: "ARTIFACT_TWO", locator: "locator-two" });
const draft = (): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference(), secondReference()],
  items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Protect source.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Protect target.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OPTION", statement: "Alternative.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});
const item = (context: DecisionContextDraft, role: string) => {
  const found = context.items.find((candidate) => candidate.role === role);
  if (found === undefined) throw new Error(`missing ${role}`);
  return found;
};
const evidenceExpectation = (context: DecisionContextDraft) => createStructuralExpectation(context, {
  kind: "EVIDENCE_BINDING", subjectItemId: item(context, "OBJECTIVE").itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});
const roleExpectation = (context: DecisionContextDraft) => createStructuralExpectation(context, {
  kind: "CONTEXT_ROLE", role: "OPTION", minimumCount: 1, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});
const dependencyExpectation = (context: DecisionContextDraft) => createStructuralExpectation(context, {
  kind: "DEPENDENCY", dependentItemId: item(context, "OBJECTIVE").itemId, prerequisiteItemId: item(context, "CONSTRAINT").itemId, provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
});
const binding = (context: DecisionContextDraft, stateReference: ReturnType<typeof reference>, disposition: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "CONTRADICTED", itemId = item(context, "OBJECTIVE").itemId, rationale = "Represented observation.") => ({
  bindingId: `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", context.contextId, itemId, [stateReference.producerId, stateReference.authorityContractId, stateReference.artifactId, stateReference.locator], disposition]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`,
  contextId: context.contextId,
  itemId,
  stateReference,
  disposition,
  rationale
});
const relation = (context: DecisionContextDraft, dependentItemId: string, prerequisiteItemId: string, actorId: string) => createStructuralRelationProposal(context, {
  kind: "DEPENDENCY", dependentItemId, prerequisiteItemId, provenance: { origin: "HUMAN_INPUT", actorId }
});
const evidenceInput = (context: DecisionContextDraft, bindings: ReturnType<typeof binding>[] = []) => {
  const expectation = evidenceExpectation(context);
  const basis = { kind: "EVIDENCE_BINDING" as const, bindings };
  const result = reconstructStructuralGap(context, expectation, basis);
  if (result === null) throw new Error("missing evidence gap");
  return { expectation, basis, result };
};
const dependencyInput = (context: DecisionContextDraft, proposals: ReturnType<typeof relation>[] = []) => {
  const expectation = dependencyExpectation(context);
  const basis = { kind: "DEPENDENCY" as const, relationProposals: proposals };
  const result = reconstructStructuralGap(context, expectation, basis);
  if (result === null) throw new Error("missing dependency gap");
  return { expectation, basis, result };
};
const noGapInput = (context: DecisionContextDraft) => ({ expectation: roleExpectation(context), basis: { kind: "CONTEXT_ROLE" as const }, result: null });
const consequenceInput = (context: DecisionContextDraft) => {
  const gapInput = evidenceInput(context);
  const source = item(context, "OBJECTIVE").itemId;
  const intermediate = item(context, "CONSTRAINT").itemId;
  const target = item(context, "OPTION").itemId;
  const first = relation(context, intermediate, source, "first");
  const second = relation(context, target, intermediate, "second");
  const propagationBasis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [first, second] };
  const consequence = reconstructStructuralConsequence(context, gapInput.expectation, gapInput.basis, gapInput.result, propagationBasis);
  return { ...gapInput, gapBasis: gapInput.basis, propagationBasis, consequence };
};
const inputFor = (_context: DecisionContextDraft): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const revision = (context: DecisionContextDraft, validationInput: DecisionContextValidationAssemblyInput = inputFor(context), previousRevisionId: string | null = null) => ({
  previousRevisionId,
  context,
  validationInput,
  validationAssembly: assembleDecisionContextValidation(context, validationInput)
});
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const specifiers = (source: string): string[] => {
  const file = ts.createSourceFile("revisions.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const output: string[] = [];
  const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) output.push(node.moduleSpecifier.text); ts.forEachChild(node, visit); };
  visit(file); return output;
};

describe("Decision Context Revision", () => {
  it("constructs root and child-shaped canonical revisions with the exact DREV identity", () => {
    const context = draft();
    const root = createDecisionContextRevision(revision(context));
    expect(root).toMatchObject({ artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", previousRevisionId: null, context: { contextId: context.contextId, validationStatus: "NOT_RUN" }, validationInput: inputFor(context) });
    const expected = `DREV_${createHash("sha256").update(JSON.stringify(["DECISION_CONTEXT_REVISION_V1", null, context.contextId, root.validationAssembly.assemblyId]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
    expect(root.revisionId).toBe(expected);
    const child = createDecisionContextRevision(revision(context, inputFor(context), root.revisionId));
    expect(child.previousRevisionId).toBe(root.revisionId);
    expect(() => createDecisionContextRevision(revision(context, inputFor(context), "not-a-revision"))).toThrow("ERR_DECISION_CONTEXT_REVISION_PREVIOUS_ID_INVALID");
  });

  it("binds DREV to predecessor, context, and assembly while canonicalizing non-path input order", () => {
    const context = draft();
    const evidence = evidenceInput(context);
    const role = noGapInput(context);
    const leftInput = { expectationValidations: [evidence, role], consequenceValidations: [] };
    const rightInput = { expectationValidations: [role, evidence], consequenceValidations: [] };
    const left = createDecisionContextRevision(revision(context, leftInput));
    const right = createDecisionContextRevision(revision(context, rightInput));
    expect(right).toEqual(left);
    const changedContext = createDecisionContextDraft({ sourceStateReferences: [reference(), secondReference()], items: draft().items.map(({ role, statement, provenance }) => ({ role, statement: role === "OBJECTIVE" ? "A different objective." : statement, provenance })) });
    expect(createDecisionContextRevision(revision(changedContext)).revisionId).not.toBe(createDecisionContextRevision(revision(context)).revisionId);
    expect(createDecisionContextRevision(revision(context, leftInput)).revisionId).not.toBe(createDecisionContextRevision(revision(context)).revisionId);
    expect(createDecisionContextRevision(revision(context, inputFor(context), "DREV_0123456789ABCDEF01234567")).revisionId).not.toBe(createDecisionContextRevision(revision(context)).revisionId);
  });

  it("canonicalizes EBIND and DREL basis inventories, consequence occurrence order, but preserves ordered propagation paths", () => {
    const context = draft();
    const first = binding(context, reference(), "NOT_SUPPORTED");
    const second = binding(context, secondReference(), "CONTRADICTED");
    const forwardEvidence = evidenceInput(context, [first, second]);
    const reverseEvidence = evidenceInput(context, [second, first]);
    expect(createDecisionContextRevision(revision(context, { expectationValidations: [forwardEvidence], consequenceValidations: [] }))).toEqual(createDecisionContextRevision(revision(context, { expectationValidations: [reverseEvidence], consequenceValidations: [] })));

    const dependency = dependencyExpectation(context);
    if (dependency.kind !== "DEPENDENCY") throw new Error("wrong fixture");
    const one = relation(context, dependency.prerequisiteItemId, dependency.dependentItemId, "reverse-one");
    const two = relation(context, dependency.prerequisiteItemId, dependency.dependentItemId, "reverse-two");
    expect(createDecisionContextRevision(revision(context, { expectationValidations: [dependencyInput(context, [one, two])], consequenceValidations: [] }))).toEqual(createDecisionContextRevision(revision(context, { expectationValidations: [dependencyInput(context, [two, one])], consequenceValidations: [] })));

    const firstConsequence = consequenceInput(context);
    const alternateRelation = relation(context, item(context, "OPTION").itemId, item(context, "OBJECTIVE").itemId, "alternate");
    const alternateBasis = { kind: "DEPENDENCY_PATH" as const, relationProposals: [alternateRelation] };
    const alternate = reconstructStructuralConsequence(context, firstConsequence.expectation, firstConsequence.gapBasis, firstConsequence.result, alternateBasis);
    const firstConsequenceValidation = { expectation: firstConsequence.expectation, gapBasis: firstConsequence.gapBasis, gap: firstConsequence.result, propagationBasis: firstConsequence.propagationBasis, consequence: firstConsequence.consequence };
    const secondConsequence = { expectation: firstConsequence.expectation, gapBasis: firstConsequence.gapBasis, gap: firstConsequence.result, propagationBasis: alternateBasis, consequence: alternate };
    const expectations = [{ expectation: firstConsequence.expectation, basis: firstConsequence.basis, result: firstConsequence.result }];
    const forward = createDecisionContextRevision(revision(context, { expectationValidations: expectations, consequenceValidations: [firstConsequenceValidation, secondConsequence] }));
    const reverse = createDecisionContextRevision(revision(context, { expectationValidations: expectations, consequenceValidations: [secondConsequence, firstConsequenceValidation] }));
    expect(reverse).toEqual(forward);
    const storedFirst = forward.validationInput.consequenceValidations.find((value) => value.consequence.consequenceId === firstConsequence.consequence.consequenceId);
    expect(storedFirst?.propagationBasis.relationProposals.map((value) => value.relationProposalId)).toEqual(firstConsequence.propagationBasis.relationProposals.map((value) => value.relationProposalId));
  });

  it("preserves identity-excluded valid payload while detaching the complete revision state", () => {
    const context = draft();
    const first = binding(context, reference(), "NOT_SUPPORTED", item(context, "OBJECTIVE").itemId, "First canonical rationale.");
    const second = binding(context, reference(), "NOT_SUPPORTED", item(context, "OBJECTIVE").itemId, "Second canonical rationale.");
    expect(first.bindingId).toBe(second.bindingId);
    const leftInput = { expectationValidations: [evidenceInput(context, [first])], consequenceValidations: [] };
    const rightInput = { expectationValidations: [evidenceInput(context, [second])], consequenceValidations: [] };
    const left = createDecisionContextRevision(revision(context, leftInput));
    const right = createDecisionContextRevision(revision(context, rightInput));
    expect(right.revisionId).toBe(left.revisionId);
    expect(right).not.toEqual(left);
    first.rationale = "Mutated after construction.";
    expect(left.validationInput.expectationValidations[0].basis.kind).toBe("EVIDENCE_BINDING");
    if (left.validationInput.expectationValidations[0].basis.kind === "EVIDENCE_BINDING") expect(left.validationInput.expectationValidations[0].basis.bindings[0].rationale).toBe("First canonical rationale.");
  });

  it("asserts self-contained canonical revisions and rejects tampering and hostile representations", () => {
    const context = draft();
    const value = createDecisionContextRevision(revision(context));
    assertDecisionContextRevision(value);
    const wrongId = structuredClone(value); wrongId.revisionId = "DREV_FAKE";
    expect(() => assertDecisionContextRevision(wrongId)).toThrow("ERR_DECISION_CONTEXT_REVISION_ID_MISMATCH");
    const reordered = structuredClone(createDecisionContextRevision(revision(context, { expectationValidations: [evidenceInput(context), noGapInput(context)], consequenceValidations: [] })));
    reordered.validationInput.expectationValidations = [...reordered.validationInput.expectationValidations].reverse();
    expect(() => assertDecisionContextRevision(reordered)).toThrow("ERR_DECISION_CONTEXT_REVISION_INVALID");
    const accessor = structuredClone(value) as unknown as Record<string, unknown>;
    Object.defineProperty(accessor, "context", { enumerable: true, get: () => context });
    expect(() => assertDecisionContextRevision(accessor as never)).toThrow("ERR_DECISION_CONTEXT_REVISION_INVALID");
    const symbol = structuredClone(value) as unknown as Record<string, unknown>;
    Object.defineProperty(symbol, Symbol("hostile"), { enumerable: true, value: true });
    expect(() => assertDecisionContextRevision(symbol as never)).toThrow("ERR_DECISION_CONTEXT_REVISION_INVALID");
    const cyclic = revision(context) as Record<string, unknown>; cyclic.self = cyclic;
    expect(() => createDecisionContextRevision(cyclic as never)).toThrow("ERR_DECISION_CONTEXT_REVISION_INPUT_INVALID");
  });

  it("uses one constructor snapshot for a non-idempotent revision-input representation and keeps the module generic and closed", () => {
    const context = draft();
    const firstInput: DecisionContextValidationAssemblyInput = { expectationValidations: [evidenceInput(context)], consequenceValidations: [] };
    const base = revision(context, firstInput) as Record<string, unknown>;
    let reads = 0;
    const hostile = new Proxy(base, { getOwnPropertyDescriptor(target, key) { if (key === "validationInput") { reads += 1; return { enumerable: true, configurable: true, value: reads === 1 ? target.validationInput : { expectationValidations: [], consequenceValidations: [] } }; } return Reflect.getOwnPropertyDescriptor(target, key); } });
    const captured = createDecisionContextRevision(hostile as never);
    expect(reads).toBe(1);
    expect(captured.validationInput.expectationValidations).toHaveLength(1);
    const directory = resolve(process.cwd(), "lib/decision-core/revisions");
    const imports = sourceFiles(directory).flatMap((file) => specifiers(readFileSync(file, "utf8")));
    expect(imports.filter((value) => ["career", "recruiting", "capability-core", "matching", "recommendation", "decision-looper", "../authority", "../validation/", "../evidence-binding"].some((term) => value.toLowerCase().includes(term)))).toEqual([]);
    const exported = Object.keys(decisionCore);
    expect(exported.filter((name) => ["DecisionNeed", "Priority", "Score", "Confidence", "Recommendation", "HumanDecision", "Action", "Outcome", "Feedback", "buildDecisionContextRevisionId"].includes(name))).toEqual([]);
  });

  it("asserts only detached nested revision snapshots after predecessor validation", () => {
    const context = draft();
    const source = createDecisionContextRevision(revision(context, { expectationValidations: [evidenceInput(context)], consequenceValidations: [] }));
    const wrap = <T extends object>(value: T, property: string, alternate: unknown) => {
      let reads = 0;
      const proxy = new Proxy(value, {
        get(target, key, receiver) {
          if (key === property) { reads += 1; return alternate; }
          return Reflect.get(target, key, receiver);
        }
      });
      return { proxy, reads: () => reads };
    };

    const contextProxy = wrap(source.context, "contextId", "DCTX_ALTERNATE");
    const contextRevision = structuredClone(source); contextRevision.context = contextProxy.proxy as never;
    expect(() => assertDecisionContextRevision(contextRevision)).not.toThrow();
    expect(contextProxy.reads()).toBe(0);

    const inputProxy = wrap(source.validationInput, "expectationValidations", []);
    const inputRevision = structuredClone(source); inputRevision.validationInput = inputProxy.proxy as never;
    expect(() => assertDecisionContextRevision(inputRevision)).not.toThrow();
    expect(inputProxy.reads()).toBe(0);

    const assemblyProxy = wrap(source.validationAssembly, "assemblyId", "DVASM_ALTERNATE");
    const assemblyRevision = structuredClone(source); assemblyRevision.validationAssembly = assemblyProxy.proxy as never;
    expect(() => assertDecisionContextRevision(assemblyRevision)).not.toThrow();
    expect(assemblyProxy.reads()).toBe(0);
  });
});
