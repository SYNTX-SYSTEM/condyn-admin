import { describe, expect, it } from "vitest";
import {
  createCanonicalSilRuntimeAssociation,
  InMemoryCanonicalSilRuntimeAssociationRepository,
} from "../../../../lib/career/runtime/canonical-sil-execution/association";
import { canonicalizeCanonicalSilExecutionInput } from "../../../../lib/career/runtime/canonical-sil-execution/input";

const execution = canonicalizeCanonicalSilExecutionInput({ candidateSourceBundleId: "CSB_1", verifiedCapabilitySnapshotId: "SNAP_1", targetOrganizationRevisionId: "TOR_1", roleMembership: { roleRelationId: "RREL_1", targetRoleProfileRevisionId: "TRP_1", targetRoleOrganizationBindingRevisionId: "TRB_1" }, organizationAggregationPolicy: { schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1", organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1", aggregationMode: "ROLE_RELATION_INVENTORY_ONLY" }, tensionClassificationPolicyVersion: "TENSION_1", evolutionInputDerivationPolicyVersion: "EVOLUTION_1", createdAt: "2026-09-22T00:00:00.000Z" });

describe("canonical SIL runtime association", () => {
  it("retains all six exact IDs and only pinned-input provenance", () => {
    const value = createCanonicalSilRuntimeAssociation(execution, { organizationRelationId: "ORL_1", tensionStateId: "TSN_1", evolutionInputStateId: "EIS_1" });
    expect(value).toMatchObject({ candidateSourceBundleId: "CSB_1", verifiedCapabilitySnapshotId: "SNAP_1", organizationRelationId: "ORL_1", roleRelationId: "RREL_1", tensionStateId: "TSN_1", evolutionInputStateId: "EIS_1" });
    expect(value.canonicalSilRuntimeAssociationId).toMatch(/^CSILRA_/);
    expect(Object.keys(value)).not.toContain("current");
  });

  it("is immutable and returns detached exact rereads", async () => {
    const repository = new InMemoryCanonicalSilRuntimeAssociationRepository();
    const value = createCanonicalSilRuntimeAssociation(execution, { organizationRelationId: "ORL_1", tensionStateId: "TSN_1", evolutionInputStateId: "EIS_1" });
    const stored = await repository.save(value);
    stored.roleRelationId = "MUTATED";
    expect((await repository.getById(value.canonicalSilRuntimeAssociationId))?.roleRelationId).toBe("RREL_1");
    await expect(repository.save({ ...value, createdAt: "2026-09-23T00:00:00.000Z" })).rejects.toThrow("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_IMMUTABLE_CONFLICT");
  });

});
