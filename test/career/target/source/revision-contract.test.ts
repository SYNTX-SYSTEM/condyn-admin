import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as targetSource from "../../../../lib/career/target/source";
import {
  assertTargetSourceRevision,
  createTargetSourceEntity,
  createTargetSourceRevision,
  type TargetSourceRevision
} from "../../../../lib/career/target/source";

const entity = (targetSourceEntityId = "TARGET_SOURCE_ENTITY_ALPHA") =>
  createTargetSourceEntity({ targetSourceEntityId });

const revision = (input: Partial<{
  targetSourceEntityId: string;
  previousRevisionId: string | null;
  sourceKind: string;
  sourceLocator: string;
  rawContentHash: string;
  normalizedContentHash: string;
  normalizedContent: string;
  normalizationVersion: string;
  schemaVersion: string;
  createdAt: string;
}> = {}) => createTargetSourceRevision({
  targetSourceEntityId: "TARGET_SOURCE_ENTITY_ALPHA",
  previousRevisionId: null,
  sourceKind: "DOCUMENT",
  sourceLocator: "source://alpha",
  rawContentHash: "a".repeat(64),
  normalizedContentHash: "b".repeat(64),
  normalizedContent: "Canonical normalized source content.",
  normalizationVersion: "target-normalization-v1",
  schemaVersion: "TARGET_SOURCE_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(directory, entry.name))
      : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
  );

const moduleSpecifiers = (source: string): string[] => {
  const file = ts.createSourceFile("target-source.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const values: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) values.push(node.moduleSpecifier.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return values;
};

describe("Target Source Revision contract T1", () => {
  it("keeps stable entity identity distinct from immutable revision identity", () => {
    const stable = entity();
    const root = revision({ targetSourceEntityId: stable.targetSourceEntityId });

    expect(stable).toEqual({ targetSourceEntityId: "TARGET_SOURCE_ENTITY_ALPHA" });
    expect(root.targetSourceEntityId).toBe(stable.targetSourceEntityId);
    expect(root.targetSourceRevisionId).not.toBe(stable.targetSourceEntityId);
    expect(root.previousRevisionId).toBeNull();
  });

  it("represents changed canonical source state as another immutable revision of one entity", () => {
    const stable = entity();
    const root = revision({ targetSourceEntityId: stable.targetSourceEntityId });
    const changed = revision({
      targetSourceEntityId: stable.targetSourceEntityId,
      previousRevisionId: root.targetSourceRevisionId,
      rawContentHash: "c".repeat(64),
      normalizedContentHash: "d".repeat(64),
      normalizedContent: "Changed canonical normalized source content."
    });

    expect(changed.targetSourceEntityId).toBe(root.targetSourceEntityId);
    expect(changed.targetSourceRevisionId).not.toBe(root.targetSourceRevisionId);
    expect(changed.previousRevisionId).toBe(root.targetSourceRevisionId);
    expect(root.normalizedContent).toBe("Canonical normalized source content.");
  });

  it("treats createdAt as audit metadata rather than revision identity or selection authority", () => {
    const earlier = revision({ createdAt: "2020-01-01T00:00:00.000Z" });
    const later = revision({ createdAt: "2030-01-01T00:00:00.000Z" });

    expect(later.targetSourceRevisionId).toBe(earlier.targetSourceRevisionId);
    expect(later.createdAt).not.toBe(earlier.createdAt);
    expect(Object.keys(targetSource).filter((name) => [
      "getCurrentRevision", "getLatestRevision", "getHeadRevision", "getActiveRevision"
    ].includes(name))).toEqual([]);
  });

  it("does not turn raw or normalized content hashes into semantic authority", () => {
    const first = revision();
    const second = revision({
      rawContentHash: "e".repeat(64),
      normalizedContentHash: "f".repeat(64),
      normalizedContent: "Another normalized semantic state."
    });

    expect(first.targetSourceRevisionId).not.toBe(second.targetSourceRevisionId);
    expect(Object.keys(targetSource).filter((name) => [
      "CurrentRevision", "LatestRevision", "HeadRevision", "ActiveRevision",
      "SupersededRevision", "selectRevisionByHash", "resolveAuthoritativeHash"
    ].includes(name))).toEqual([]);
  });

  it("rejects malformed revisions and identity tampering against frozen canonical inputs", () => {
    const value = revision();
    expect(() => assertTargetSourceRevision({ ...value, targetSourceRevisionId: "TARGET_SOURCE_REVISION_TAMPERED" })).toThrow("ERR_TARGET_SOURCE_REVISION_INVALID");
    expect(() => assertTargetSourceRevision({ ...value, normalizedContentHash: "not-a-canonical-hash" })).toThrow("ERR_TARGET_SOURCE_REVISION_INVALID");
    expect(() => assertTargetSourceRevision({ ...value, previousRevisionId: "" })).toThrow("ERR_TARGET_SOURCE_REVISION_INVALID");
    expect(() => assertTargetSourceRevision({ targetSourceRevisionId: value.targetSourceRevisionId })).toThrow("ERR_TARGET_SOURCE_REVISION_INVALID");
  });

  it("exposes no mutable-current or lifecycle authority operation", () => {
    const forbidden = [
      "updateRevision", "replaceRevision", "deleteRevision", "saveRevision",
      "writeRevision", "putRevision", "setCurrentRevision", "setLatestRevision",
      "setHeadRevision", "setActiveRevision", "supersedeRevision",
      "CurrentRevision", "LatestRevision", "HeadRevision", "ActiveRevision",
      "SupersededRevision", "AuthorityCertificate", "AuthorityToken"
    ];
    expect(Object.keys(targetSource).filter((name) => forbidden.includes(name))).toEqual([]);
  });

  it("keeps Target Source core free of other domain, adapter, and database imports", () => {
    const directory = resolve(process.cwd(), "lib/career/target/source");
    const imports = sourceFiles(directory).flatMap((file) =>
      moduleSpecifiers(readFileSync(file, "utf8")).map((specifier) => ({ file, specifier }))
    );
    const forbidden = [
      "capability-core", "decision-core", "decision-adapters", "matching",
      "recommendations", "drizzle", "postgres", "database", "/db"
    ];
    expect(imports.filter(({ specifier }) => forbidden.some((term) => specifier.toLowerCase().includes(term)))).toEqual([]);
  });

  it("does not encode later ingestion failure states as Target Source revisions", () => {
    const exported = Object.keys(targetSource);
    expect(exported.filter((name) => ["NO_SOURCE", "SOURCE_UNREADABLE", "SOURCE_CHANGED"].includes(name))).toEqual([]);
    expect(() => assertTargetSourceRevision({
      ...revision(),
      sourceKind: "NO_SOURCE"
    } as unknown as TargetSourceRevision)).toThrow("ERR_TARGET_SOURCE_REVISION_INVALID");
  });
});
