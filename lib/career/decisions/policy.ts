import { deepFreeze } from "./decision";

export interface PolicyConfiguration {
  minimumExplainability: number;
  minimumFit: number;
  partialSupportContribution: number;
}

export interface PolicyVersion {
  policyId: string;
  policyFamilyId: string;
  version: number;
  parentVersion?: number;
  configuration: PolicyConfiguration;
  createdAt: string;
  createdBy: string;
}

export interface PolicyFamilyHead {
  policyFamilyId: string;
  activePolicyVersionId: string | null;
  revision: number;
  updatedAt: string;
}

export interface PolicyPromotionRecord {
  promotionId: string;
  policyFamilyId: string;
  fromPolicyVersionId: string | null;
  toPolicyVersionId: string;
  actor: string;
  promotedAt: string;
  rationale?: string;
  evaluationId?: string;
  previousRevision: number;
  resultingRevision: number;
}

export function createPolicyVersion(
  policyId: string,
  policyFamilyId: string,
  version: number,
  configuration: PolicyConfiguration,
  createdBy: string,
  createdAt: string = new Date().toISOString(),
  parentVersion?: number
): Readonly<PolicyVersion> {
  const policy: PolicyVersion = {
    policyId,
    policyFamilyId,
    version,
    configuration,
    createdAt,
    createdBy,
    parentVersion
  };

  return deepFreeze(policy);
}

export function createPromotionRecord(
  promotionId: string,
  policyFamilyId: string,
  toPolicyVersionId: string,
  fromPolicyVersionId: string | null,
  previousRevision: number,
  actor: string,
  rationale?: string,
  evaluationId?: string,
  promotedAt: string = new Date().toISOString()
): Readonly<PolicyPromotionRecord> {
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_POLICY_PROMOTION_MISSING_ACTOR: Promotion requires an explicit actor.");
  }
  return deepFreeze({
    promotionId,
    policyFamilyId,
    toPolicyVersionId,
    fromPolicyVersionId,
    actor,
    promotedAt,
    rationale,
    evaluationId,
    previousRevision,
    resultingRevision: previousRevision + 1
  });
}
