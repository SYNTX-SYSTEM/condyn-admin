import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { db, initDbSchema } from "../../../../lib/career/db/client";
import { careerCanonicalSilRuntimeAssociations } from "../../../../lib/career/db/schema";
import {
  createCanonicalSilRuntimeAssociation,
  PostgresCanonicalSilRuntimeAssociationRepository,
} from "../../../../lib/career/runtime/canonical-sil-execution/association";
import { canonicalizeCanonicalSilExecutionInput } from "../../../../lib/career/runtime/canonical-sil-execution/input";

const execution = canonicalizeCanonicalSilExecutionInput({
  candidateSourceBundleId: "CSB_POSTGRES_1",
  verifiedCapabilitySnapshotId: "SNAP_POSTGRES_1",
  targetOrganizationRevisionId: "TOR_POSTGRES_1",
  roleMembership: {
    roleRelationId: "RREL_POSTGRES_1",
    targetRoleProfileRevisionId: "TRP_POSTGRES_1",
    targetRoleOrganizationBindingRevisionId: "TRB_POSTGRES_1",
  },
  organizationAggregationPolicy: {
    schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1",
    organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1",
    aggregationMode: "ROLE_RELATION_INVENTORY_ONLY",
  },
  tensionClassificationPolicyVersion: "TENSION_POSTGRES_1",
  evolutionInputDerivationPolicyVersion: "EVOLUTION_POSTGRES_1",
  createdAt: "2026-09-22T00:00:00.000Z",
});

const persisted = createCanonicalSilRuntimeAssociation(execution, {
  organizationRelationId: "ORL_POSTGRES_1",
  tensionStateId: "TSN_POSTGRES_1",
  evolutionInputStateId: "EIS_POSTGRES_1",
});

const cleanup = () => db.delete(careerCanonicalSilRuntimeAssociations)
  .where(eq(careerCanonicalSilRuntimeAssociations.canonicalSilRuntimeAssociationId, persisted.canonicalSilRuntimeAssociationId));

describe("Canonical SIL runtime association PostgreSQL persistence", () => {
  beforeEach(async () => {
    await initDbSchema();
    await cleanup();
  });
  afterAll(cleanup);

  it("durably exact-rereads immutable six-ID technical provenance after repository reconstruction", async () => {
    const first = new PostgresCanonicalSilRuntimeAssociationRepository(drizzle(db.$client));
    const stored = await first.save(persisted);
    const restarted = new PostgresCanonicalSilRuntimeAssociationRepository(drizzle(db.$client));
    const reread = await restarted.getById(stored.canonicalSilRuntimeAssociationId);
    expect(reread).toEqual(stored);
    expect(reread).not.toBe(stored);
    await expect(restarted.save({ ...stored, evolutionInputStateId: "EIS_MUTATED" }))
      .rejects.toThrow("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_IMMUTABLE_CONFLICT");
  });
});
