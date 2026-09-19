import { isDeepStrictEqual } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { assertOrganizationRelation, type OrganizationRelation } from "../../relation/organization-relation";
import type { RoleRelationRepository } from "../../relation/role-relation";
import type { TargetOrganizationRevisionRepository } from "../../target/organization";
import type { TargetRoleOrganizationBindingRevisionRepository } from "../../target/role/organization-binding";
import type { TargetRoleProfileRevisionRepository } from "../../target/role/profile";
import { organizationRelationMemberships, organizationRelations } from "./postgres-schema";

type Database = typeof db;
const fail = (code: string): never => { throw new Error(code); };

export interface OrganizationRelationRepository {
  getOrganizationRelationById(organizationRelationId: string): Promise<OrganizationRelation | null>;
  persistOrganizationRelation(value: OrganizationRelation): Promise<OrganizationRelation>;
}

export interface OrganizationRelationPersistenceDependencies {
  organizations: TargetOrganizationRevisionRepository;
  roles: RoleRelationRepository;
  profiles: TargetRoleProfileRevisionRepository;
  bindings: TargetRoleOrganizationBindingRevisionRepository;
}

function expectedMemberships(value: OrganizationRelation): string[] {
  return value.roleRelationMemberships.map(membership => [
    membership.roleRelation.roleRelationId,
    membership.targetRoleProfileRevision.targetRoleProfileRevisionId,
    membership.targetRoleOrganizationBindingRevision.targetRoleOrganizationBindingRevisionId,
  ].join(":"));
}

/** Exact-ID persistence verifies the payload, normalized witnesses, and embedded immutable parents; it never selects another relation. */
export class PostgresOrganizationRelationRepository implements OrganizationRelationRepository {
  constructor(private readonly database: Database = db, private readonly dependencies: OrganizationRelationPersistenceDependencies) {}

  async getOrganizationRelationById(organizationRelationId: string): Promise<OrganizationRelation | null> {
    const relationRows = await this.database.select().from(organizationRelations).where(eq(organizationRelations.organizationRelationId, organizationRelationId)).limit(1);
    if (!relationRows.length) return null;
    try {
      const row = relationRows[0];
      const value = row.payload;
      assertOrganizationRelation(value);
      if (row.organizationRelationId !== value.organizationRelationId || row.verifiedCapabilitySnapshotId !== value.verifiedCapabilitySnapshotId || row.targetOrganizationRevisionId !== value.targetOrganizationRevision.targetOrganizationRevisionId) fail("ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID");
      const membershipRows = await this.database.select().from(organizationRelationMemberships).where(eq(organizationRelationMemberships.organizationRelationId, organizationRelationId));
      const actual = membershipRows.map(membership => [membership.roleRelationId, membership.targetRoleProfileRevisionId, membership.targetRoleOrganizationBindingRevisionId].join(":")).sort();
      const expected = expectedMemberships(value).sort();
      if (actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) fail("ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID");
      await this.assertExactParents(value);
      return structuredClone(value);
    } catch { return fail("ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID"); }
  }

  async persistOrganizationRelation(value: OrganizationRelation): Promise<OrganizationRelation> {
    assertOrganizationRelation(value);
    await this.assertExactParents(value);
    const existing = await this.getOrganizationRelationById(value.organizationRelationId);
    if (existing) {
      if (!isDeepStrictEqual(existing, value)) fail("ERR_ORGANIZATION_RELATION_IMMUTABLE_CONFLICT");
      return existing;
    }
    await this.database.insert(organizationRelations).values({
      organizationRelationId: value.organizationRelationId,
      verifiedCapabilitySnapshotId: value.verifiedCapabilitySnapshotId,
      targetOrganizationRevisionId: value.targetOrganizationRevision.targetOrganizationRevisionId,
      payload: structuredClone(value),
    }).onConflictDoNothing();
    for (const membership of value.roleRelationMemberships) {
      await this.database.insert(organizationRelationMemberships).values({
        referenceId: `${value.organizationRelationId}:${membership.roleRelation.roleRelationId}`,
        organizationRelationId: value.organizationRelationId,
        roleRelationId: membership.roleRelation.roleRelationId,
        targetRoleProfileRevisionId: membership.targetRoleProfileRevision.targetRoleProfileRevisionId,
        targetRoleOrganizationBindingRevisionId: membership.targetRoleOrganizationBindingRevision.targetRoleOrganizationBindingRevisionId,
      }).onConflictDoNothing();
    }
    const reread = await this.getOrganizationRelationById(value.organizationRelationId);
    if (!reread || !isDeepStrictEqual(reread, value)) fail("ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID");
    return reread!;
  }

  private async assertExactParents(value: OrganizationRelation): Promise<void> {
    const organization = await this.dependencies.organizations.getRevisionById(value.targetOrganizationRevision.targetOrganizationRevisionId);
    if (!organization || !isDeepStrictEqual(organization, value.targetOrganizationRevision)) fail("ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID");
    for (const membership of value.roleRelationMemberships) {
      const [role, profile, binding] = await Promise.all([
        this.dependencies.roles.getRoleRelationById(membership.roleRelation.roleRelationId),
        this.dependencies.profiles.getRevisionById(membership.targetRoleProfileRevision.targetRoleProfileRevisionId),
        this.dependencies.bindings.getRevisionById(membership.targetRoleOrganizationBindingRevision.targetRoleOrganizationBindingRevisionId),
      ]);
      if (!role || !profile || !binding || !isDeepStrictEqual(role, membership.roleRelation) || !isDeepStrictEqual(profile, membership.targetRoleProfileRevision) || !isDeepStrictEqual(binding, membership.targetRoleOrganizationBindingRevision)) fail("ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID");
    }
  }
}
