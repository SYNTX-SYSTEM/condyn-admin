import { deepFreeze } from "./decision";

export type PolicyStatus = "CANDIDATE" | "ACTIVE" | "RETIRED";

export interface PolicyConfiguration {
  minimumExplainability: number;
  minimumFit: number;
  partialSupportContribution: number;
  // This explicitly limits what can be learned, preventing arbitrary JS/formulas
}

export interface PolicyVersion {
  policyId: string;
  version: number;
  parentVersion?: number;
  configuration: PolicyConfiguration;
  createdAt: string;
  createdBy: string;
  status: PolicyStatus;
  promotedBy?: string;
  promotedAt?: string;
}

const policyCache = new Map<string, PolicyVersion>();
let activePolicyId: string | null = null;

export function clearPolicyCache() {
  policyCache.clear();
  activePolicyId = null;
}

export function createPolicyVersion(
  policyId: string,
  version: number,
  configuration: PolicyConfiguration,
  createdBy: string,
  createdAt: string = new Date().toISOString(),
  parentVersion?: number
): Readonly<PolicyVersion> {
  const existing = policyCache.get(policyId);
  if (existing) {
    if (JSON.stringify(existing.configuration) !== JSON.stringify(configuration)) {
      throw new Error(`ERR_POLICY_CONFLICT: Policy ${policyId} already exists with a different configuration.`);
    }
    return existing;
  }

  const policy: PolicyVersion = {
    policyId,
    version,
    configuration,
    createdAt,
    createdBy,
    status: "CANDIDATE",
    parentVersion
  };

  const sealed = deepFreeze(policy);
  policyCache.set(sealed.policyId, sealed);
  return sealed;
}

export function promotePolicy(
  candidatePolicyId: string,
  actor: string,
  promotedAt: string = new Date().toISOString()
): Readonly<PolicyVersion> {
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_POLICY_PROMOTION_MISSING_ACTOR: Promotion requires an explicit actor.");
  }
  
  const candidate = policyCache.get(candidatePolicyId);
  if (!candidate) {
    throw new Error("ERR_POLICY_NOT_FOUND: Candidate policy not found.");
  }
  
  // Retire the currently active policy (only one active per family)
  if (activePolicyId) {
    const active = policyCache.get(activePolicyId);
    if (active) {
      const retired = deepFreeze({ ...active, status: "RETIRED" as PolicyStatus });
      policyCache.set(active.policyId, retired);
    }
  }

  // Activate the candidate
  const promoted = deepFreeze({
    ...candidate,
    status: "ACTIVE" as PolicyStatus,
    promotedBy: actor,
    promotedAt
  });
  
  policyCache.set(promoted.policyId, promoted);
  activePolicyId = promoted.policyId;
  
  return promoted;
}

export function getActivePolicyVersion(): Readonly<PolicyVersion> | null {
  if (!activePolicyId) return null;
  return policyCache.get(activePolicyId) || null;
}
