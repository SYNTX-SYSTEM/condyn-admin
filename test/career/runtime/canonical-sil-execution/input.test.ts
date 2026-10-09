import { describe, expect, it } from "vitest";
import { assertCanonicalSilExecutionInput, canonicalizeCanonicalSilExecutionInput } from "../../../../lib/career/runtime/canonical-sil-execution/input";

const input = () => ({
  candidateSourceBundleId: "CSB_EXACT",
  verifiedCapabilitySnapshotId: "SNAP_EXACT",
  targetOrganizationRevisionId: "TOR_EXACT",
  roleMembership: { roleRelationId: "RREL_A", targetRoleProfileRevisionId: "TRP_A", targetRoleOrganizationBindingRevisionId: "TRB_A" },
  organizationAggregationPolicy: { schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1" as const, organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1" as const, aggregationMode: "ROLE_RELATION_INVENTORY_ONLY" as const },
  tensionClassificationPolicyVersion: "TENSION_POLICY_V1",
  evolutionInputDerivationPolicyVersion: "EVOLUTION_POLICY_V1",
  createdAt: "2026-09-22T00:00:00.000Z",
});

describe("Canonical SIL Stage-B execution input", () => {
  it("accepts one caller-selected exact membership without selecting anything", () => {
    const value = canonicalizeCanonicalSilExecutionInput(input());
    expect(value.roleMembership.roleRelationId).toBe("RREL_A");
    expect(value.verifiedCapabilitySnapshotId).toBe("SNAP_EXACT");
  });

  it("rejects partial, duplicate, and repository-selection-shaped inputs", () => {
    expect(() => assertCanonicalSilExecutionInput({ ...input(), roleMembership: {} })).toThrow("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
    expect(() => assertCanonicalSilExecutionInput({ ...input(), currentTarget: true })).toThrow("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
  });
});
