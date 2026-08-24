import {
  assertVerifiedCapabilitySnapshot,
  computeSnapshotKey,
  type CapabilityCoreRepository,
  type VerifiedCapabilitySnapshot
} from "../career/capability-core";
import type { AuthoritativeStateReference, AuthoritativeStateResolver } from "../decision-core";

export const CAPABILITY_CORE_PRODUCER_ID = "CONDYN_CAPABILITY_CORE";
export const CAPABILITY_CORE_AUTHORITY_CONTRACT_ID = "CAPABILITY_PHASE4_VERIFIED_V1";

const fail = (code: string): never => { throw new Error(code); };

function assertCapabilityCoreReference(reference: AuthoritativeStateReference): void {
  if (reference.producerId !== CAPABILITY_CORE_PRODUCER_ID || reference.authorityContractId !== CAPABILITY_CORE_AUTHORITY_CONTRACT_ID) {
    fail("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
  }
}

function assertPhase4CapabilitySnapshot(snapshot: VerifiedCapabilitySnapshot): void {
  try {
    assertVerifiedCapabilitySnapshot(snapshot);
  } catch {
    fail("ERR_DECISION_AUTHORITY_STATE_INVALID");
  }
  if (snapshot.status !== "VERIFIED" || snapshot.publication?.mode !== "PHASE4_VERIFIED") {
    fail("ERR_DECISION_AUTHORITY_STATE_INVALID");
  }
}

/**
 * The captured repository determines what is authoritative for this adapter.
 * A successful payload is detached state, not a portable authority token.
 */
export function createCapabilityCoreAuthoritativeStateResolver(
  repository: Pick<CapabilityCoreRepository, "getSnapshotByKey">
): AuthoritativeStateResolver<VerifiedCapabilitySnapshot> {
  // Bind the read capability once; the underlying repository state remains live.
  const getSnapshotByKey = repository.getSnapshotByKey.bind(repository);
  return {
    producerId: CAPABILITY_CORE_PRODUCER_ID,
    authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
    async resolve(reference: AuthoritativeStateReference): Promise<VerifiedCapabilitySnapshot> {
      assertCapabilityCoreReference(reference);
      const persistedSnapshot = await getSnapshotByKey(reference.locator);
      if (persistedSnapshot === null) throw new Error("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
      assertPhase4CapabilitySnapshot(persistedSnapshot);
      if (computeSnapshotKey(persistedSnapshot) !== reference.locator || persistedSnapshot.snapshotId !== reference.artifactId) {
        fail("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
      }
      return structuredClone(persistedSnapshot);
    }
  };
}
