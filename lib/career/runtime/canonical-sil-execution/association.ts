import { createHash } from "crypto";
import { isDeepStrictEqual } from "util";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { careerCanonicalSilRuntimeAssociations } from "../../db/schema";
import type { CanonicalSilExecutionInput } from "./input";


export interface CanonicalSilRuntimeAssociation {
  canonicalSilRuntimeAssociationId: string;
  candidateSourceBundleId: string;
  verifiedCapabilitySnapshotId: string;
  organizationRelationId: string;
  roleRelationId: string;
  tensionStateId: string;
  evolutionInputStateId: string;
  targetOrganizationRevisionId: string;
  targetRoleProfileRevisionId: string;
  targetRoleOrganizationBindingRevisionId: string;
  organizationAggregationPolicyVersion: string;
  tensionClassificationPolicyVersion: string;
  evolutionInputDerivationPolicyVersion: string;
  createdAt: string;
}

const fail = (): never => { throw new Error("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_INVALID"); };
const id = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;
const stable = (value: object) => JSON.stringify(value, Object.keys(value).sort());

export function createCanonicalSilRuntimeAssociation(input: CanonicalSilExecutionInput, ids: Pick<CanonicalSilRuntimeAssociation, "organizationRelationId" | "tensionStateId" | "evolutionInputStateId">): CanonicalSilRuntimeAssociation {
  if (!id(ids.organizationRelationId) || !id(ids.tensionStateId) || !id(ids.evolutionInputStateId)) fail();
  const value = {
    candidateSourceBundleId: input.candidateSourceBundleId,
    verifiedCapabilitySnapshotId: input.verifiedCapabilitySnapshotId,
    organizationRelationId: ids.organizationRelationId,
    roleRelationId: input.roleMembership.roleRelationId,
    tensionStateId: ids.tensionStateId,
    evolutionInputStateId: ids.evolutionInputStateId,
    targetOrganizationRevisionId: input.targetOrganizationRevisionId,
    targetRoleProfileRevisionId: input.roleMembership.targetRoleProfileRevisionId,
    targetRoleOrganizationBindingRevisionId: input.roleMembership.targetRoleOrganizationBindingRevisionId,
    organizationAggregationPolicyVersion: input.organizationAggregationPolicy.organizationRelationAggregationPolicyVersion,
    tensionClassificationPolicyVersion: input.tensionClassificationPolicyVersion,
    evolutionInputDerivationPolicyVersion: input.evolutionInputDerivationPolicyVersion,
  };
  const canonicalSilRuntimeAssociationId = `CSILRA_${createHash("sha256").update(stable(value)).digest("hex").slice(0, 32).toUpperCase()}`;
  return { canonicalSilRuntimeAssociationId, ...value, createdAt: input.createdAt };
}

export interface CanonicalSilRuntimeAssociationRepository {
  save(value: CanonicalSilRuntimeAssociation): Promise<CanonicalSilRuntimeAssociation>;
  getById(id: string): Promise<CanonicalSilRuntimeAssociation | null>;
}

export class InMemoryCanonicalSilRuntimeAssociationRepository implements CanonicalSilRuntimeAssociationRepository {
  readonly #values = new Map<string, CanonicalSilRuntimeAssociation>();

  async save(value: CanonicalSilRuntimeAssociation): Promise<CanonicalSilRuntimeAssociation> {
    const existing = this.#values.get(value.canonicalSilRuntimeAssociationId);
    if (existing && !isDeepStrictEqual(existing, value)) throw new Error("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_IMMUTABLE_CONFLICT");
    if (!existing) this.#values.set(value.canonicalSilRuntimeAssociationId, structuredClone(value));
    return structuredClone(this.#values.get(value.canonicalSilRuntimeAssociationId)!);
  }

  async getById(id: string): Promise<CanonicalSilRuntimeAssociation | null> {
    const value = this.#values.get(id);
    return value ? structuredClone(value) : null;
  }
}

export class PostgresCanonicalSilRuntimeAssociationRepository implements CanonicalSilRuntimeAssociationRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getById(id: string): Promise<CanonicalSilRuntimeAssociation | null> {
    const rows = await this.database.select().from(careerCanonicalSilRuntimeAssociations).where(eq(careerCanonicalSilRuntimeAssociations.canonicalSilRuntimeAssociationId, id)).limit(1);
    if (!rows.length) return null;
    const value = rows[0].payload as CanonicalSilRuntimeAssociation;
    if (value.canonicalSilRuntimeAssociationId !== rows[0].canonicalSilRuntimeAssociationId || value.candidateSourceBundleId !== rows[0].candidateSourceBundleId || value.verifiedCapabilitySnapshotId !== rows[0].verifiedCapabilitySnapshotId || value.organizationRelationId !== rows[0].organizationRelationId || value.roleRelationId !== rows[0].roleRelationId || value.tensionStateId !== rows[0].tensionStateId || value.evolutionInputStateId !== rows[0].evolutionInputStateId) throw new Error("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_INVALID");
    return structuredClone(value);
  }

  async save(value: CanonicalSilRuntimeAssociation): Promise<CanonicalSilRuntimeAssociation> {
    const existing = await this.getById(value.canonicalSilRuntimeAssociationId);
    if (existing) {
      if (!isDeepStrictEqual(existing, value)) throw new Error("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_IMMUTABLE_CONFLICT");
      return existing;
    }
    await this.database.insert(careerCanonicalSilRuntimeAssociations).values({ canonicalSilRuntimeAssociationId: value.canonicalSilRuntimeAssociationId, candidateSourceBundleId: value.candidateSourceBundleId, verifiedCapabilitySnapshotId: value.verifiedCapabilitySnapshotId, organizationRelationId: value.organizationRelationId, roleRelationId: value.roleRelationId, tensionStateId: value.tensionStateId, evolutionInputStateId: value.evolutionInputStateId, payload: structuredClone(value) }).onConflictDoNothing();
    const reread = await this.getById(value.canonicalSilRuntimeAssociationId);
    if (!reread) throw new Error("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_INVALID");
    if (!isDeepStrictEqual(reread, value)) throw new Error("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_IMMUTABLE_CONFLICT");
    return reread;
  }
}
