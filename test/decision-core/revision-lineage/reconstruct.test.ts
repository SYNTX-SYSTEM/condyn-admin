import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  InMemoryDecisionContextRevisionRepository,
  type DecisionContextDraft,
  type DecisionContextRevision
} from "../../../lib/decision-core";

const reference = () => ({ producerId: "PRODUCER", authorityContractId: "CONTRACT", artifactId: "ARTIFACT", locator: "locator" });
const context = (statement = "Proceed?"): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference()],
  items: [
    { role: "DECISION_QUESTION", statement, provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: "Protect source.", provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});
const revision = (draft: DecisionContextDraft, previousRevisionId: string | null = null): DecisionContextRevision => {
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId, context: draft, validationInput, validationAssembly: assembleDecisionContextValidation(draft, validationInput) });
};
const reader = (records: readonly DecisionContextRevision[], reads: string[] = []) => ({
  getRevisionById: async (revisionId: string): Promise<DecisionContextRevision | null> => {
    reads.push(revisionId);
    const record = records.find((candidate) => candidate.revisionId === revisionId);
    return record === undefined ? null : structuredClone(record);
  }
});
const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const imports = (source: string): string[] => {
  const file = ts.createSourceFile("revision-lineage.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const output: string[] = [];
  const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteralLike(node.moduleSpecifier)) output.push(node.moduleSpecifier.text); ts.forEachChild(node, visit); };
  visit(file); return output;
};

describe("Decision Context Revision Lineage", () => {
  it("reconstructs root-only and multi-revision chains in root-to-start predecessor order", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    const draft = context(); const root = revision(draft); const a = revision(draft, root.revisionId); const b = revision(draft, a.revisionId); const start = revision(draft, b.revisionId);
    const rootReads: string[] = [];
    const rootOnly = await reconstruct(reader([root], rootReads)).reconstruct(root.revisionId);
    expect(rootOnly).toEqual({ startRevisionId: root.revisionId, rootRevisionId: root.revisionId, revisions: [root] });
    expect(rootReads).toEqual([root.revisionId]);
    const lineage = await reconstruct(reader([root, a, b, start])).reconstruct(start.revisionId);
    expect(lineage.startRevisionId).toBe(start.revisionId);
    expect(lineage.rootRevisionId).toBe(root.revisionId);
    expect(lineage.revisions.map((value) => value.revisionId)).toEqual([root.revisionId, a.revisionId, b.revisionId, start.revisionId]);
    expect(lineage.revisions.slice(1).every((value, index) => value.previousRevisionId === lineage.revisions[index].revisionId)).toBe(true);
  });

  it("follows only the supplied start predecessor path, permits forks, and permits no-change children", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    const draft = context(); const root = revision(draft); const parent = revision(draft, root.revisionId); const childA = revision(draft, parent.revisionId); const childB = revision(context("Other branch?"), parent.revisionId); const later = revision(draft, childA.revisionId);
    const reads: string[] = [];
    const lineage = await reconstruct(reader([root, parent, childA, childB, later], reads)).reconstruct(childA.revisionId);
    expect(lineage.revisions.map((value) => value.revisionId)).toEqual([root.revisionId, parent.revisionId, childA.revisionId]);
    expect(reads).not.toContain(childB.revisionId);
    expect(reads).not.toContain(later.revisionId);
    expect(childA.context.contextId).toBe(parent.context.contextId);
    expect(childA.validationAssembly.assemblyId).toBe(parent.validationAssembly.assemblyId);
  });

  it("validates start input before reading and distinguishes missing start from missing predecessor", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    expect(() => reconstruct({} as never)).toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID");
    let reads = 0;
    const missing = reconstruct({ getRevisionById: async () => { reads += 1; return null; } });
    await expect(missing.reconstruct("DREV_invalid")).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_ID_INVALID");
    expect(reads).toBe(0);
    const root = revision(context()); const child = revision(root.context, root.revisionId);
    await expect(reconstruct(reader([])).reconstruct(root.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_NOT_FOUND");
    const predecessorReads: string[] = [];
    await expect(reconstruct(reader([child], predecessorReads)).reconstruct(child.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_PREDECESSOR_NOT_FOUND");
    expect(predecessorReads).toEqual([child.revisionId, root.revisionId]);
  });

  it("rejects malformed or wrong-ID reader results and preserves reader exceptions", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    const requested = revision(context()); const other = revision(context("Other?"));
    await expect(reconstruct({ getRevisionById: async () => ({}) as DecisionContextRevision }).reconstruct(requested.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID");
    await expect(reconstruct({ getRevisionById: async () => structuredClone(other) }).reconstruct(requested.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID");
    await expect(reconstruct({ getRevisionById: async () => { throw new Error("REPOSITORY_SENTINEL"); } }).reconstruct(requested.revisionId)).rejects.toThrow("REPOSITORY_SENTINEL");
    const malformed = structuredClone(requested) as DecisionContextRevision;
    (malformed as { previousRevisionId: unknown }).previousRevisionId = "invalid";
    const malformedReads: string[] = [];
    await expect(reconstruct({ getRevisionById: async (revisionId) => { malformedReads.push(revisionId); return malformed; } }).reconstruct(requested.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID");
    expect(malformedReads).toEqual([requested.revisionId]);
  });

  it("rejects reader dependencies with any extra write capability without invoking it", () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    let reads = 0; let writes = 0;
    const dependency = {
      getRevisionById: async () => { reads += 1; return null; },
      persist: () => { writes += 1; }
    };
    expect(() => reconstruct(dependency as never)).toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID");
    expect(reads).toBe(0);
    expect(writes).toBe(0);
  });

  it("rejects accessor-backed reader dependencies without invoking their getter", () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    let getterReads = 0;
    const dependency = {};
    Object.defineProperty(dependency, "getRevisionById", {
      enumerable: true,
      get: () => { getterReads += 1; return async () => null; }
    });
    expect(() => reconstruct(dependency as never)).toThrow("ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID");
    expect(getterReads).toBe(0);
  });

  it("uses detached returned state and captures the reader method once", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    const stored = revision(context());
    const dependency = reader([stored]);
    const bound = reconstruct(dependency);
    dependency.getRevisionById = async () => { throw new Error("REDIRECTED"); };
    const first = await bound.reconstruct(stored.revisionId);
    const firstQuestion = first.revisions[0].context.items.find((item) => item.role === "DECISION_QUESTION");
    if (firstQuestion === undefined) throw new Error("missing returned question");
    firstQuestion.statement = "Mutated result.";
    const second = await bound.reconstruct(stored.revisionId);
    expect(second.revisions[0].context.items.find((item) => item.role === "DECISION_QUESTION")?.statement).toBe("Proceed?");
    expect(stored.context.items.find((item) => item.role === "DECISION_QUESTION")?.statement).toBe("Proceed?");
  });

  it("uses only the existing generic repository read contract", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    const repository = new InMemoryDecisionContextRevisionRepository();
    const root = revision(context()); const child = revision(root.context, root.revisionId);
    const persister = repository.createDecisionContextRevisionPersister();
    await persister.persist(root); await persister.persist(child);
    const lineage = await reconstruct({ getRevisionById: repository.getRevisionById.bind(repository) }).reconstruct(child.revisionId);
    expect(lineage.revisions.map((value) => value.revisionId)).toEqual([root.revisionId, child.revisionId]);
  });

  it("returns only the exact detached lineage read-model shape and isolates concurrent operations", async () => {
    const reconstruct = decisionCore.createBoundDecisionContextRevisionLineageReconstructor;
    const root = revision(context()); const childA = revision(root.context, root.revisionId); const childB = revision(context("Second child?"), root.revisionId);
    const bound = reconstruct(reader([root, childA, childB]));
    const [first, second] = await Promise.all([bound.reconstruct(childA.revisionId), bound.reconstruct(childB.revisionId)]);
    expect(Object.keys(first).sort()).toEqual(["revisions", "rootRevisionId", "startRevisionId"]);
    expect(Object.keys(second).sort()).toEqual(["revisions", "rootRevisionId", "startRevisionId"]);
    expect(first.revisions.map((value) => value.revisionId)).toEqual([root.revisionId, childA.revisionId]);
    expect(second.revisions.map((value) => value.revisionId)).toEqual([root.revisionId, childB.revisionId]);
  });

  it("places repeated-ID protection before every reader invocation and exposes only the generic read-only lineage surface", () => {
    const directory = resolve(process.cwd(), "lib/decision-core/revision-lineage");
    const reconstructSource = readFileSync(resolve(directory, "reconstruct.ts"), "utf8");
    const file = ts.createSourceFile("reconstruct.ts", reconstructSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let guard: ts.IfStatement | undefined;
    let addPosition = -1;
    let readPosition = -1;
    const visit = (node: ts.Node): void => {
      if (ts.isIfStatement(node) && node.expression.getText(file) === "visited.has(currentRevisionId)") guard = node;
      if (ts.isCallExpression(node) && node.expression.getText(file) === "visited.add" && node.arguments.length === 1 && node.arguments[0].getText(file) === "currentRevisionId") addPosition = node.getStart(file);
      if (ts.isCallExpression(node) && node.expression.getText(file) === "getRevisionById" && node.arguments.length === 1 && node.arguments[0].getText(file) === "currentRevisionId") readPosition = node.getStart(file);
      ts.forEachChild(node, visit);
    };
    visit(file);
    expect(guard).toBeDefined();
    expect(guard?.thenStatement.getText(file)).toContain("ERR_DECISION_CONTEXT_REVISION_LINEAGE_CYCLE");
    expect(guard?.getStart(file)).toBeLessThan(addPosition);
    expect(addPosition).toBeLessThan(readPosition);
    const sourceImports = sourceFiles(directory).flatMap((file) => imports(readFileSync(file, "utf8")));
    expect(sourceImports.filter((value) => ["career", "recruiting", "capability-core", "matching", "recommendation", "decision-looper", "decision-adapters", "drizzle", "postgres", "database", "db"].some((term) => value.toLowerCase().includes(term)))).toEqual([]);
    const exported = Object.keys(decisionCore);
    expect(exported).toEqual(expect.arrayContaining(["createBoundDecisionContextRevisionLineageReconstructor"]));
    expect(exported.filter((name) => ["getChildren", "listRevisions", "getLatest", "getHead", "getCurrent", "getAncestors", "getDescendants", "findBranches", "queryLineage", "DecisionNeed", "Recommendation", "HumanDecision", "Action", "Outcome", "Feedback", "DLINE_"].includes(name))).toEqual([]);
  });
});
