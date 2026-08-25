import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as decisionCore from "../../../lib/decision-core";
import { createBoundDecisionContextRevisionPersister } from "../../../lib/decision-core/revision-persistence/persister";
import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createStructuralExpectation,
  type DecisionContextDraft,
  type DecisionContextRevision,
  type DecisionContextValidationAssemblyInput,
  InMemoryDecisionContextRevisionRepository,
  reconstructStructuralGap
} from "../../../lib/decision-core";

const reference = () => ({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" });
const secondReference = () => ({ producerId: "PRODUCER_2", authorityContractId: "CONTRACT_2", artifactId: "ARTIFACT_2", locator: "locator-two" });
const draft = (): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference(), secondReference()],
  items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Protect source.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: "Protect target.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});
const item = (context: DecisionContextDraft, role: string) => {
  const result = context.items.find((candidate) => candidate.role === role);
  if (result === undefined) throw new Error(`missing ${role}`);
  return result;
};
const binding = (context: DecisionContextDraft, rationale: string) => {
  const stateReference = reference(); const itemId = item(context, "OBJECTIVE").itemId;
  const disposition = "NOT_SUPPORTED" as const;
  return {
    bindingId: `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", context.contextId, itemId, [stateReference.producerId, stateReference.authorityContractId, stateReference.artifactId, stateReference.locator], disposition]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`,
    contextId: context.contextId, itemId, stateReference, disposition, rationale
  };
};
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const revision = (context: DecisionContextDraft, previousRevisionId: string | null = null, input = emptyInput()) => createDecisionContextRevision({
  previousRevisionId,
  context,
  validationInput: input,
  validationAssembly: assembleDecisionContextValidation(context, input)
});
const evidenceRevision = (context: DecisionContextDraft, rationale: string) => {
  const expectation = createStructuralExpectation(context, {
    kind: "EVIDENCE_BINDING", subjectItemId: item(context, "OBJECTIVE").itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "expectation" }
  });
  const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [binding(context, rationale)] };
  const gap = reconstructStructuralGap(context, expectation, basis);
  if (gap === null) throw new Error("expected gap");
  const input = { expectationValidations: [{ expectation, basis, result: gap }], consequenceValidations: [] };
  return revision(context, null, input);
};
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const specifiers = (source: string): string[] => {
  const file = ts.createSourceFile("revision-persistence.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const output: string[] = [];
  const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) output.push(node.moduleSpecifier.text); ts.forEachChild(node, visit); };
  visit(file); return output;
};

class TrackingRepository extends InMemoryDecisionContextRevisionRepository {
  reads: string[] = [];

  override async getRevisionById(revisionId: string): Promise<DecisionContextRevision | null> {
    this.reads.push(revisionId);
    return super.getRevisionById(revisionId);
  }

}

describe("Decision Context Revision Persistence", () => {
  it("exposes only the repository-bound Phase-5D2A persistence surface", () => {
    expect(InMemoryDecisionContextRevisionRepository).toBeTypeOf("function");
    const exported = Object.keys(decisionCore);
    expect(exported.filter((name) => ["saveRevision", "writeRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision", "AuthorityCertificate", "AuthorityToken", "PersistedAuthorityToken", "isAuthoritative", "RevisionNumber", "BranchStatus", "BranchRank", "SemanticChange", "CurrentRevision", "ActiveRevision", "LatestRevision", "HeadRevision", "SupersededRevision", "DecisionNeed", "Priority", "Score", "Confidence", "Severity", "Recommendation", "HumanDecision", "Action", "Outcome", "Feedback"].includes(name))).toEqual([]);
  });

  it("does not expose a runtime-callable raw writer on the shipped repository", async () => {
    const repository = new InMemoryDecisionContextRevisionRepository() as unknown as Record<string, unknown>;
    for (const name of ["writeRevision", "saveRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision"]) {
      expect(name in repository).toBe(false);
      expect(typeof repository[name]).not.toBe("function");
    }
    const bound = (repository as unknown as InMemoryDecisionContextRevisionRepository).createDecisionContextRevisionPersister();
    await expect(bound.persist(revision(draft()))).resolves.toMatchObject({ artifactKind: "DECISION_CONTEXT_REVISION" });
  });

  it("persists a root through one bound persister, rereads it exactly, and detaches every returned value", async () => {
    const repository = new InMemoryDecisionContextRevisionRepository();
    const value = revision(draft()); const persister = repository.createDecisionContextRevisionPersister();
    const persisted = await persister.persist(value);
    expect(persisted).toEqual(value);
    persisted.context.items[0].statement = "Mutated return.";
    expect((await repository.getRevisionById(value.revisionId))?.context.items.find((candidate) => candidate.role === "DECISION_QUESTION")?.statement).toBe("Proceed?");
    const read = await repository.getRevisionById(value.revisionId);
    if (read === null) throw new Error("missing stored root");
    read.context.items[0].statement = "Mutated read.";
    expect((await repository.getRevisionById(value.revisionId))?.context.items.find((candidate) => candidate.role === "DECISION_QUESTION")?.statement).toBe("Proceed?");
  });

  it("replays exact revisions idempotently but rejects same-DREV divergent complete payload", async () => {
    const context = draft(); const first = evidenceRevision(context, "First rationale."); const second = evidenceRevision(context, "Second rationale.");
    expect(first.revisionId).toBe(second.revisionId);
    expect(first).not.toEqual(second);
    const repository = new InMemoryDecisionContextRevisionRepository(); const persister = repository.createDecisionContextRevisionPersister();
    await expect(persister.persist(first)).resolves.toEqual(first);
    await expect(persister.persist(structuredClone(first))).resolves.toEqual(first);
    await expect(persister.persist(second)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
  });

  it("requires exactly one valid immediate parent, permits forks and no-change children, and never traverses farther", async () => {
    const repository = new TrackingRepository(); const persister = repository.createDecisionContextRevisionPersister(); const context = draft();
    const root = revision(context); const parent = revision(context, root.revisionId);
    const childA = revision(context, parent.revisionId);
    const alternateContext = createDecisionContextDraft({
      sourceStateReferences: [reference(), secondReference()],
      items: draft().items.map(({ role, statement, provenance }) => ({ role, statement: role === "OBJECTIVE" ? "Alternative source." : statement, provenance }))
    });
    const childB = revision(alternateContext, parent.revisionId);
    await expect(persister.persist(childA)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND");
    expect(await repository.getRevisionById(childA.revisionId)).toBeNull();
    await persister.persist(root);
    await persister.persist(parent);
    repository.reads = [];
    await expect(persister.persist(childA)).resolves.toEqual(childA);
    await expect(persister.persist(childB)).resolves.toEqual(childB);
    expect(childA.revisionId).not.toBe(childB.revisionId);
    expect(childA.context.contextId).toBe(parent.context.contextId);
    expect(childA.validationAssembly.assemblyId).toBe(parent.validationAssembly.assemblyId);
    expect(repository.reads.filter((id) => id === parent.revisionId)).toHaveLength(2);
    expect(repository.reads).not.toContain(root.revisionId);
    expect(repository.reads.filter((id) => id !== parent.revisionId && id !== childA.revisionId && id !== childB.revisionId)).toEqual([]);
  });

  it("rejects malformed or mismatched immediate parents before writing children", async () => {
    const context = draft(); const requestedParent = revision(context); const child = revision(context, requestedParent.revisionId);
    const mismatchContext = createDecisionContextDraft({
      sourceStateReferences: [reference(), secondReference()],
      items: draft().items.map(({ role, statement, provenance }) => ({ role, statement: role === "OBJECTIVE" ? "Different source." : statement, provenance }))
    });
    const mismatch = revision(mismatchContext);
    let writes = 0;
    const persister = createBoundDecisionContextRevisionPersister({ getRevisionById: async () => structuredClone(mismatch), writeRevision: async () => { writes += 1; } });
    await expect(persister.persist(child)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID");
    expect(writes).toBe(0);
    const malformed = createBoundDecisionContextRevisionPersister({ getRevisionById: async () => ({} as DecisionContextRevision), writeRevision: async () => { writes += 1; } });
    await expect(malformed.persist(child)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID");
    expect(writes).toBe(0);
  });

  it("requires exact post-write reread and preserves underlying write failures", async () => {
    const value = revision(draft());
    await expect(createBoundDecisionContextRevisionPersister({ getRevisionById: async () => null, writeRevision: async () => {} }).persist(value)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    await expect(createBoundDecisionContextRevisionPersister({ getRevisionById: async () => ({} as DecisionContextRevision), writeRevision: async () => {} }).persist(value)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    const context = draft(); const expected = evidenceRevision(context, "Expected rationale."); const divergent = evidenceRevision(context, "Divergent rationale.");
    await expect(createBoundDecisionContextRevisionPersister({ getRevisionById: async () => structuredClone(divergent), writeRevision: async () => {} }).persist(expected)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    await expect(createBoundDecisionContextRevisionPersister({ getRevisionById: async () => null, writeRevision: async () => { throw new Error("UNDERLYING_WRITE_FAILURE"); } }).persist(value)).rejects.toThrow("UNDERLYING_WRITE_FAILURE");
  });

  it("keeps the pristine validated expected artifact separate from a writer-mutable input", async () => {
    const original = evidenceRevision(draft(), "Pristine rationale.");
    let stored: DecisionContextRevision | null = null;
    const persister = createBoundDecisionContextRevisionPersister({
      getRevisionById: async () => stored === null ? null : structuredClone(stored),
      writeRevision: async (writerInput) => {
        const validation = writerInput.validationInput.expectationValidations[0];
        if (validation?.basis.kind !== "EVIDENCE_BINDING") throw new Error("missing binding basis");
        validation.basis.bindings[0].rationale = "Writer-mutated rationale.";
        stored = structuredClone(writerInput);
      }
    });
    await expect(persister.persist(original)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    expect(original.validationInput.expectationValidations[0].basis.kind).toBe("EVIDENCE_BINDING");
    if (original.validationInput.expectationValidations[0].basis.kind === "EVIDENCE_BINDING") expect(original.validationInput.expectationValidations[0].basis.bindings[0].rationale).toBe("Pristine rationale.");
  });

  it("captures repository dependencies and each caller revision exactly once before asynchronous work", async () => {
    const repository = new InMemoryDecisionContextRevisionRepository(); const persister = repository.createDecisionContextRevisionPersister();
    let redirectedReads = 0;
    repository.getRevisionById = async () => { redirectedReads += 1; return null; };
    const root = revision(draft()); await expect(persister.persist(root)).resolves.toEqual(root);
    expect(redirectedReads).toBe(0);

    const parent = revision(draft());
    const delayed = new TrackingRepository(); await delayed.createDecisionContextRevisionPersister().persist(parent);
    const originalGet = delayed.getRevisionById.bind(delayed);
    let release: (() => void) | undefined;
    let delayParent = true;
    delayed.getRevisionById = async (id) => delayParent ? new Promise((resolve) => { release = () => resolve(id === parent.revisionId ? structuredClone(parent) : null); }) : originalGet(id);
    const delayedPersister = delayed.createDecisionContextRevisionPersister();
    const child = revision(parent.context, parent.revisionId);
    const operation = delayedPersister.persist(child);
    child.context.items[0].statement = "Mutated after capture.";
    if (release === undefined) throw new Error("parent read not started");
    delayParent = false;
    release();
    const persisted = await operation;
    expect(persisted.context.items.find((candidate) => candidate.role === "DECISION_QUESTION")?.statement).toBe("Proceed?");
  });

  it("keeps revision-persistence generic and free of database or later-decision imports", () => {
    const directory = resolve(process.cwd(), "lib/decision-core/revision-persistence");
    const imports = sourceFiles(directory).flatMap((file) => specifiers(readFileSync(file, "utf8")).map((specifier) => ({ file, specifier })));
    expect(imports.filter(({ specifier }) => ["career", "recruiting", "capability-core", "matching", "recommendation", "decision-looper", "decision-adapters", "drizzle", "postgres", "database", "db"].some((term) => specifier.toLowerCase().includes(term)))).toEqual([]);
  });
});
