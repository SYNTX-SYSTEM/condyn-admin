import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as targetOrganization from "../../../../lib/career/target/organization";
import {
  assertTargetOrganizationRevision,
  createTargetOrganizationEntity,
  createTargetOrganizationRevision
} from "../../../../lib/career/target/organization";

const entity = (targetOrganizationEntityId = "TARGET_ORGANIZATION_ENTITY_ALPHA") =>
  createTargetOrganizationEntity({ targetOrganizationEntityId });

const revision = (input: Partial<{
  targetOrganizationEntityId: string;
  previousRevisionId: string | null;
  organizationDescriptor: string;
  descriptorKind: string;
  schemaVersion: string;
  createdAt: string;
}> = {}) => createTargetOrganizationRevision({
  targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_ALPHA",
  previousRevisionId: null,
  organizationDescriptor: "Siemens AG",
  descriptorKind: "DECLARED_NAME",
  schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
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
  const file = ts.createSourceFile("target-organization.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const values: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) values.push(node.moduleSpecifier.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return values;
};

describe("Target Organization Revision contract T2", () => {
  it("keeps stable organization entity identity distinct from immutable revision identity", () => {
    const stable = entity();
    const root = revision({ targetOrganizationEntityId: stable.targetOrganizationEntityId });

    expect(stable).toEqual({ targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_ALPHA" });
    expect(root.targetOrganizationEntityId).toBe(stable.targetOrganizationEntityId);
    expect(root.targetOrganizationRevisionId).not.toBe(stable.targetOrganizationEntityId);
    expect(root.previousRevisionId).toBeNull();
  });

  it("represents changed organization descriptor state as another immutable revision of one entity", () => {
    const stable = entity();
    const root = revision({ targetOrganizationEntityId: stable.targetOrganizationEntityId });
    const changed = revision({
      targetOrganizationEntityId: stable.targetOrganizationEntityId,
      previousRevisionId: root.targetOrganizationRevisionId,
      organizationDescriptor: "Siemens"
    });

    expect(changed.targetOrganizationEntityId).toBe(root.targetOrganizationEntityId);
    expect(changed.targetOrganizationRevisionId).not.toBe(root.targetOrganizationRevisionId);
    expect(changed.previousRevisionId).toBe(root.targetOrganizationRevisionId);
    expect(root.organizationDescriptor).toBe("Siemens AG");
  });

  it("treats createdAt as audit metadata rather than revision identity or selection authority", () => {
    const earlier = revision({ createdAt: "2020-01-01T00:00:00.000Z" });
    const later = revision({ createdAt: "2030-01-01T00:00:00.000Z" });

    expect(later.targetOrganizationRevisionId).toBe(earlier.targetOrganizationRevisionId);
    expect(later.createdAt).not.toBe(earlier.createdAt);
    expect(Object.keys(targetOrganization).filter((name) => [
      "getCurrentRevision", "getLatestRevision", "getHeadRevision", "getActiveRevision"
    ].includes(name))).toEqual([]);
  });

  it("treats a declared name as a descriptor rather than canonical, legal, or verified identity", () => {
    const value = revision();

    expect(value.descriptorKind).toBe("DECLARED_NAME");
    expect(value.organizationDescriptor).toBe("Siemens AG");
    expect(Object.keys(value).filter((key) => [
      "canonicalName", "legalName", "verifiedName", "resolvedName",
      "identityAuthority", "resolutionAuthority"
    ].includes(key))).toEqual([]);
  });

  it("does not infer entity equality from equal descriptors", () => {
    const first = revision({ targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_ALPHA" });
    const second = revision({ targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_BETA" });

    expect(first.organizationDescriptor).toBe(second.organizationDescriptor);
    expect(first.targetOrganizationEntityId).not.toBe(second.targetOrganizationEntityId);
    expect(first.targetOrganizationRevisionId).not.toBe(second.targetOrganizationRevisionId);
  });

  it("allows descriptor variation within one entity without treating it as identity resolution", () => {
    const root = revision({ organizationDescriptor: "Siemens AG" });
    const child = revision({
      previousRevisionId: root.targetOrganizationRevisionId,
      organizationDescriptor: "Siemens"
    });

    expect(child.targetOrganizationEntityId).toBe(root.targetOrganizationEntityId);
    expect(child.organizationDescriptor).not.toBe(root.organizationDescriptor);
    expect(Object.keys(targetOrganization).filter((name) =>
      /merge|dedup|resolve|canonicalize/i.test(name)
    )).toEqual([]);
  });

  it("rejects malformed revisions, unsupported descriptor kinds, extra authority fields, and identity tampering", () => {
    const value = revision();

    expect(() => assertTargetOrganizationRevision({
      ...value,
      targetOrganizationRevisionId: "TARGET_ORGANIZATION_REVISION_TAMPERED"
    })).toThrow("ERR_TARGET_ORGANIZATION_REVISION_INVALID");

    expect(() => assertTargetOrganizationRevision({
      ...value,
      descriptorKind: "LEGAL_NAME"
    })).toThrow("ERR_TARGET_ORGANIZATION_REVISION_INVALID");

    expect(() => assertTargetOrganizationRevision({
      ...value,
      organizationDescriptor: ""
    })).toThrow("ERR_TARGET_ORGANIZATION_REVISION_INVALID");

    expect(() => assertTargetOrganizationRevision({
      ...value,
      previousRevisionId: ""
    })).toThrow("ERR_TARGET_ORGANIZATION_REVISION_INVALID");

    expect(() => assertTargetOrganizationRevision({
      ...value,
      resonanceScore: 0.9
    })).toThrow("ERR_TARGET_ORGANIZATION_REVISION_INVALID");

    expect(() => assertTargetOrganizationRevision({
      targetOrganizationRevisionId: value.targetOrganizationRevisionId
    })).toThrow("ERR_TARGET_ORGANIZATION_REVISION_INVALID");
  });

  it("contains no source, role, relation, resonance, provider, or legacy matching state", () => {
    const value = revision();
    const forbidden = [
      "targetSourceRevisionId", "targetSourceEntityId",
      "targetRoleRevisionId", "targetRoleEntityId",
      "sourceRevisionRefs", "roleBinding",
      "resonanceScore", "resonance_score",
      "country_iso", "industry_enum",
      "org_id", "companyId",
      "provider", "model", "promptChecksum"
    ];

    expect(Object.keys(value).filter((key) => forbidden.includes(key))).toEqual([]);
  });

  it("exposes no mutable-current, lifecycle, identity-resolution, or relation authority operation", () => {
    const forbidden = [
      "updateRevision", "replaceRevision", "deleteRevision", "saveRevision",
      "writeRevision", "putRevision",
      "setCurrentRevision", "setLatestRevision", "setHeadRevision", "setActiveRevision",
      "supersedeRevision",
      "CurrentRevision", "LatestRevision", "HeadRevision", "ActiveRevision", "SupersededRevision",
      "mergeOrganizations", "deduplicateOrganizations", "resolveOrganizationIdentity",
      "canonicalizeOrganization", "matchOrganization",
      "OrganizationRelation", "OrganizationResonance",
      "AuthorityCertificate", "AuthorityToken"
    ];

    expect(Object.keys(targetOrganization).filter((name) => forbidden.includes(name))).toEqual([]);
  });

  it("keeps Target Organization core free of source, candidate, decision, matching, adapter, and database imports", () => {
    const directory = resolve(process.cwd(), "lib/career/target/organization");
    const imports = sourceFiles(directory).flatMap((file) =>
      moduleSpecifiers(readFileSync(file, "utf8")).map((specifier) => ({ file, specifier }))
    );
    const forbidden = [
      "/target/source", "capability-core", "decision-core", "decision-adapters",
      "matching", "recommendations", "target-adapters",
      "drizzle", "postgres", "database", "/db"
    ];

    expect(imports.filter(({ specifier }) =>
      forbidden.some((term) => specifier.toLowerCase().includes(term))
    )).toEqual([]);
  });
});
