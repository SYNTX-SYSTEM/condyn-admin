import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { computeSourceBundleHash, createCandidateSourceBundle, createSourceDocument, type VerifiedCapabilitySnapshot } from "../../../lib/career/capability-core";
import type { OrganizationRelation } from "../../../lib/career/relation/organization-relation";
import type { RoleRelation } from "../../../lib/career/relation/role-relation";
import type { TensionState } from "../../../lib/career/relation/tension-state";
import type { EvolutionInputState } from "../../../lib/career/relation/evolution-input";
import { readCanonicalSilReadModel, type CanonicalSilReadDependencies, type CanonicalSilReadIdentitySet } from "../../../lib/career/sil-projection/server-read-service";

const identities: CanonicalSilReadIdentitySet = {
  candidateSourceBundleId: "CSB_1",
  verifiedCapabilitySnapshotId: "SNAP_1",
  organizationRelationId: "ORL_1",
  roleRelationId: "RREL_1",
  tensionStateId: "TNS_1",
  evolutionInputStateId: "EIS_1",
};

function graph() {
  const document = createSourceDocument({ docId: "DOC_1", title: "candidate.md", rawContent: "Canonical candidate source." });
  const sourceBundle = createCandidateSourceBundle({ candidateSourceBundleId: identities.candidateSourceBundleId, documents: [document], schemaVersion: "CANDIDATE_SOURCE_BUNDLE_V1", createdAt: "2027-03-01T00:00:00.000Z" });
  const snapshot = { snapshotId: identities.verifiedCapabilitySnapshotId, sourceBundleHash: computeSourceBundleHash(sourceBundle.documents) } as VerifiedCapabilitySnapshot;
  const role = { roleRelationId: identities.roleRelationId, verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRoleProfileRevisionId: "TRPROF_1", targetRoleRequirementInventoryId: "TRINV_1", proposalState: "PROPOSAL_ONLY", authorityState: "NONE" } as RoleRelation;
  const organization = { organizationRelationId: identities.organizationRelationId, verifiedCapabilitySnapshotId: snapshot.snapshotId, roleRelationMemberships: [{ roleRelation: role }] } as OrganizationRelation;
  const tension = { tensionStateId: identities.tensionStateId, roleRelationId: role.roleRelationId, verifiedCapabilitySnapshotId: role.verifiedCapabilitySnapshotId, targetRoleProfileRevisionId: role.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: role.targetRoleRequirementInventoryId, proposalState: "PROPOSAL_ONLY", authorityState: "NONE" } as TensionState;
  const evolution = { evolutionInputStateId: identities.evolutionInputStateId, tensionStateId: tension.tensionStateId, roleRelationId: tension.roleRelationId, verifiedCapabilitySnapshotId: tension.verifiedCapabilitySnapshotId, targetRoleProfileRevisionId: tension.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: tension.targetRoleRequirementInventoryId, proposalState: "PROPOSAL_ONLY", authorityState: "NONE" } as EvolutionInputState;
  return { sourceBundle, snapshot, organization, role, tension, evolution };
}

function dependencies(values = graph()): CanonicalSilReadDependencies {
  return {
    sourceBundles: { getCandidateSourceBundleById: vi.fn(async (id: string) => id === identities.candidateSourceBundleId ? values.sourceBundle : null), persistCandidateSourceBundle: vi.fn() },
    capabilities: { getSnapshotById: vi.fn(async (id: string) => id === identities.verifiedCapabilitySnapshotId ? values.snapshot : null) },
    organizations: { getOrganizationRelationById: vi.fn(async (id: string) => id === identities.organizationRelationId ? values.organization : null), persistOrganizationRelation: vi.fn() },
    roles: { getRoleRelationById: vi.fn(async (id: string) => id === identities.roleRelationId ? values.role : null) },
    tensions: { getTensionStateById: vi.fn(async (id: string) => id === identities.tensionStateId ? values.tension : null) },
    evolutions: { getEvolutionInputStateById: vi.fn(async (id: string) => id === identities.evolutionInputStateId ? values.evolution : null) },
  };
}

describe("server-side canonical SIL exact-ID read composition", () => {
  it("reads each exact caller-selected identity once and terminates in the T25 projection", async () => {
    const values = graph();
    const read = dependencies(values);
    const model = await readCanonicalSilReadModel(identities, read);
    expect(model.schemaVersion).toBe("CANONICAL_SIL_READ_MODEL_V1");
    expect(model.identity).toMatchObject({ state: "AVAILABLE", artifactIds: ["DOC_1"] });
    expect(model.resonance).toMatchObject({ state: "AVAILABLE", artifactIds: ["ORL_1"] });
    expect(read.sourceBundles.getCandidateSourceBundleById).toHaveBeenCalledTimes(1);
    expect(read.sourceBundles.getCandidateSourceBundleById).toHaveBeenCalledWith("CSB_1");
    expect(read.capabilities.getSnapshotById).toHaveBeenCalledWith("SNAP_1");
    expect(read.organizations.getOrganizationRelationById).toHaveBeenCalledWith("ORL_1");
    expect(read.roles.getRoleRelationById).toHaveBeenCalledWith("RREL_1");
    expect(read.tensions.getTensionStateById).toHaveBeenCalledWith("TNS_1");
    expect(read.evolutions.getEvolutionInputStateById).toHaveBeenCalledWith("EIS_1");
    values.sourceBundle.documents[0].title = "mutated after read";
    expect((model.identity as any).artifacts[0].title).toBe("candidate.md");
  });

  it("keeps every absent requested identity distinct and never searches a substitute", async () => {
    const cases: Array<[keyof CanonicalSilReadDependencies, string, string]> = [
      ["sourceBundles", "getCandidateSourceBundleById", "ERR_CANONICAL_SIL_READ_SOURCE_BUNDLE_NOT_FOUND"],
      ["capabilities", "getSnapshotById", "ERR_CANONICAL_SIL_READ_CAPABILITY_SNAPSHOT_NOT_FOUND"],
      ["organizations", "getOrganizationRelationById", "ERR_CANONICAL_SIL_READ_ORGANIZATION_RELATION_NOT_FOUND"],
      ["roles", "getRoleRelationById", "ERR_CANONICAL_SIL_READ_ROLE_RELATION_NOT_FOUND"],
      ["tensions", "getTensionStateById", "ERR_CANONICAL_SIL_READ_TENSION_STATE_NOT_FOUND"],
      ["evolutions", "getEvolutionInputStateById", "ERR_CANONICAL_SIL_READ_EVOLUTION_INPUT_STATE_NOT_FOUND"],
    ];
    for (const [dependency, method, error] of cases) {
      const read: any = dependencies();
      read[dependency][method] = vi.fn(async () => null);
      await expect(readCanonicalSilReadModel(identities, read)).rejects.toThrow(error);
    }
  });

  it("rejects malformed IDs, preserves repository failures, and leaves cross-artifact contradiction to T25", async () => {
    const read = dependencies();
    await expect(readCanonicalSilReadModel({ ...identities, roleRelationId: " RREL_1" }, read)).rejects.toThrow("ERR_CANONICAL_SIL_READ_INPUT_INVALID");
    expect(read.roles.getRoleRelationById).not.toHaveBeenCalled();
    const failed = dependencies();
    (failed.roles.getRoleRelationById as any).mockRejectedValue(new Error("ERR_ROLE_RELATION_PERSISTENCE_INVALID"));
    await expect(readCanonicalSilReadModel(identities, failed)).rejects.toThrow("ERR_ROLE_RELATION_PERSISTENCE_INVALID");
    const incompatibleValues = graph();
    incompatibleValues.tension.targetRoleProfileRevisionId = "TRPROF_OTHER";
    await expect(readCanonicalSilReadModel(identities, dependencies(incompatibleValues))).rejects.toThrow("ERR_CANONICAL_SIL_PROJECTION_LINEAGE_INVALID");
  });

  it("contains no persistence, schema, provider, currentness, legacy, or transport behavior", () => {
    const source = readFileSync(new URL("../../../lib/career/sil-projection/server-read-service.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\.persist[A-Z]|\.insert\(|\.delete\(|initDbSchema|from ["'][^"']*(postgres|drizzle)[^"']*["']|provider|Date\.now|new Date|current|latest|head|demo-data|ui-adapter|Request|NextResponse|Recommendation|Decision/i);
  });
});
