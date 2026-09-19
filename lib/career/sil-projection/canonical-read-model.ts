import { computeSourceBundleHash, type SourceDocument, type VerifiedCapabilitySnapshot } from "../capability-core";
import type { OrganizationRelation } from "../relation/organization-relation";
import type { RoleRelation } from "../relation/role-relation";
import type { TensionState } from "../relation/tension-state";
import type { EvolutionInputState } from "../relation/evolution-input";

export type CanonicalSilRegionState =
  | "AVAILABLE"
  | "EMPTY"
  | "NOT_PRODUCED"
  | "UNKNOWN"
  | "FAILED";

export type CanonicalSilRegion<T> =
  | { state: "AVAILABLE"; artifacts: readonly T[] }
  | { state: "EMPTY" }
  | { state: "NOT_PRODUCED" }
  | { state: "UNKNOWN" }
  | { state: "FAILED"; failureCode: string };

export interface CanonicalSilProjectionInput {
  identity: CanonicalSilRegion<SourceDocument>;
  capability: CanonicalSilRegion<VerifiedCapabilitySnapshot>;
  resonance: CanonicalSilRegion<OrganizationRelation>;
  role: CanonicalSilRegion<RoleRelation>;
  tension: CanonicalSilRegion<TensionState>;
  evolution: CanonicalSilRegion<EvolutionInputState>;
}

export type CanonicalSilProjectionRegion<T> =
  | { state: "AVAILABLE"; artifactIds: string[]; artifacts: T[] }
  | { state: "EMPTY" }
  | { state: "NOT_PRODUCED" }
  | { state: "UNKNOWN" }
  | { state: "FAILED"; failureCode: string };

/**
 * A representation-only, exact-artifact projection for the SIL. It neither
 * discovers artifacts nor selects a revision: callers supply every artifact
 * explicitly and this boundary only preserves their lineage for reading.
 */
export interface CanonicalSilReadModel {
  schemaVersion: "CANONICAL_SIL_READ_MODEL_V1";
  identity: CanonicalSilProjectionRegion<SourceDocument>;
  capability: CanonicalSilProjectionRegion<VerifiedCapabilitySnapshot>;
  /** SIL terminology only; its artifacts remain OrganizationRelation values. */
  resonance: CanonicalSilProjectionRegion<OrganizationRelation>;
  role: CanonicalSilProjectionRegion<RoleRelation>;
  tension: CanonicalSilProjectionRegion<TensionState>;
  evolution: CanonicalSilProjectionRegion<EvolutionInputState>;
}

const invalid = (): never => {
  throw new Error("ERR_CANONICAL_SIL_PROJECTION_INPUT_INVALID");
};

const lineageInvalid = (): never => {
  throw new Error("ERR_CANONICAL_SIL_PROJECTION_LINEAGE_INVALID");
};

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function validState(value: unknown): value is CanonicalSilRegionState {
  return value === "AVAILABLE" || value === "EMPTY" || value === "NOT_PRODUCED" || value === "UNKNOWN" || value === "FAILED";
}

function projectRegion<T>(
  value: CanonicalSilRegion<T>,
  artifactId: (artifact: T) => unknown,
): CanonicalSilProjectionRegion<T> {
  if (!value || typeof value !== "object" || !validState((value as { state?: unknown }).state)) invalid();
  if (value.state === "AVAILABLE") {
    if (!Array.isArray(value.artifacts) || value.artifacts.length === 0) invalid();
    const artifactIds = value.artifacts.map(artifactId);
    if (artifactIds.some((id) => !nonblank(id)) || new Set(artifactIds).size !== artifactIds.length) invalid();
    return { state: "AVAILABLE", artifactIds: artifactIds as string[], artifacts: structuredClone([...value.artifacts]) };
  }
  if (value.state === "FAILED") {
    if (!nonblank(value.failureCode)) invalid();
    return { state: "FAILED", failureCode: value.failureCode };
  }
  return { state: value.state };
}

function available<T>(region: CanonicalSilRegion<T>): readonly T[] | null {
  return region.state === "AVAILABLE" ? region.artifacts : null;
}

function ids<T>(items: readonly T[], id: (item: T) => string): Set<string> {
  return new Set(items.map(id));
}

function hasExactLineage(input: CanonicalSilProjectionInput): void {
  const sources = available(input.identity);
  const snapshots = available(input.capability);
  const organizations = available(input.resonance);
  const roles = available(input.role);
  const tensions = available(input.tension);
  const evolutions = available(input.evolution);

  if (sources && snapshots) {
    const sourceBundleHash = computeSourceBundleHash([...sources]);
    if (snapshots.some((snapshot) => snapshot.sourceBundleHash !== sourceBundleHash)) lineageInvalid();
  }

  if (snapshots && organizations) {
    const snapshotIds = ids(snapshots, (snapshot) => snapshot.snapshotId);
    if (organizations.some((organization) => !snapshotIds.has(organization.verifiedCapabilitySnapshotId))) lineageInvalid();
  }

  if (snapshots && roles) {
    const snapshotIds = ids(snapshots, (snapshot) => snapshot.snapshotId);
    if (roles.some((role) => !snapshotIds.has(role.verifiedCapabilitySnapshotId))) lineageInvalid();
  }

  if (organizations && roles) {
    const organizationRoleIds = new Set(
      organizations.flatMap((organization) => organization.roleRelationMemberships.map(({ roleRelation }) => roleRelation.roleRelationId)),
    );
    if (roles.some((role) => !organizationRoleIds.has(role.roleRelationId))) lineageInvalid();
  }

  if (roles && tensions) {
    const rolesById = new Map(roles.map((role) => [role.roleRelationId, role]));
    for (const tension of tensions) {
      const role = rolesById.get(tension.roleRelationId);
      if (!role ||
        role.verifiedCapabilitySnapshotId !== tension.verifiedCapabilitySnapshotId ||
        role.targetRoleProfileRevisionId !== tension.targetRoleProfileRevisionId ||
        role.targetRoleRequirementInventoryId !== tension.targetRoleRequirementInventoryId) lineageInvalid();
    }
  }

  if (tensions && evolutions) {
    const tensionsById = new Map(tensions.map((tension) => [tension.tensionStateId, tension]));
    for (const evolution of evolutions) {
      const tension = tensionsById.get(evolution.tensionStateId);
      if (!tension ||
        tension.roleRelationId !== evolution.roleRelationId ||
        tension.verifiedCapabilitySnapshotId !== evolution.verifiedCapabilitySnapshotId ||
        tension.targetRoleProfileRevisionId !== evolution.targetRoleProfileRevisionId ||
        tension.targetRoleRequirementInventoryId !== evolution.targetRoleRequirementInventoryId) lineageInvalid();
    }
  }
}

export function composeCanonicalSilReadModel(input: CanonicalSilProjectionInput): CanonicalSilReadModel {
  if (!input || typeof input !== "object") invalid();
  const model: CanonicalSilReadModel = {
    schemaVersion: "CANONICAL_SIL_READ_MODEL_V1",
    identity: projectRegion(input.identity, (source) => source.docId),
    capability: projectRegion(input.capability, (snapshot) => snapshot.snapshotId),
    resonance: projectRegion(input.resonance, (organization) => organization.organizationRelationId),
    role: projectRegion(input.role, (role) => role.roleRelationId),
    tension: projectRegion(input.tension, (tension) => tension.tensionStateId),
    evolution: projectRegion(input.evolution, (evolution) => evolution.evolutionInputStateId),
  };
  hasExactLineage(input);
  return model;
}
