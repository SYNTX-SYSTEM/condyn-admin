import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalSilReadLineageTableNames } from "../../../lib/career/sil-projection/persistence-schema";
import { PostgresOrganizationRelationRepository } from "../../../lib/career/relation-adapters/organization-relation-persistence";

describe("canonical SIL exact-ID read lineage surface", () => {
  it("provisions only immutable source-bundle and OrganizationRelation identity witnesses", () => {
    expect(canonicalSilReadLineageTableNames).toEqual([
      "candidate_source_bundles",
      "candidate_source_bundle_document_references",
      "organization_relations",
      "organization_relation_memberships",
    ]);
  });

  it("exposes OrganizationRelation exact read/persist operations and no selection surface", () => {
    expect(Object.getOwnPropertyNames(PostgresOrganizationRelationRepository.prototype).sort()).toEqual([
      "assertExactParents",
      "constructor",
      "getOrganizationRelationById",
      "persistOrganizationRelation",
    ]);
  });

  it("keeps source and OrganizationRelation adapters free of latest/current/hash lookup and provider regeneration", () => {
    const organization = readFileSync(new URL("../../../lib/career/relation-adapters/organization-relation-persistence/postgres.ts", import.meta.url), "utf8");
    const source = readFileSync(new URL("../../../lib/career/capability-core/source-bundle-postgres.ts", import.meta.url), "utf8");
    for (const implementation of [organization, source]) {
      expect(implementation).not.toMatch(/getCurrent|getLatest|findBest|resolve.*ForCandidate|Date\.now|new Date|provider|regenerate/i);
    }
    expect(source).not.toMatch(/where\(eq\([^\n]*sourceBundleHash/);
  });
});
