/**
 * Career-side mirror of the Career canonical authority vocabulary (decision D3, relation R6).
 * The authoritative home is the R1 resolver namespace
 * `lib/decision-adapters/career-canonical/namespace.ts`: a contract id is meaningful only where
 * a bound resolver resolves it. lib/career may not import the adapter zone, so the values are
 * mirrored here, exactly as the four-field reference shape is mirrored (R8). Equality of producer
 * id and all fifteen contract ids is proven in
 * test/decision-integration/g2-g3-cross-relation.test.ts on the integration branch.
 *
 * Vocabulary: the artifact's own proposalState and authorityState literals (NONE rendered as
 * AUTHORITY_NONE), DECLARATION for explicit human declarations, IMMUTABLE_RECORD for
 * families whose contract carries no proposal or authority field.
 * CONTRACT ID != AUTHORITY UPGRADE. PHASE4_VERIFIED stays reserved for Capability Core.
 */
export const CAREER_CANONICAL_PRODUCER_ID = "CONDYN_CAREER_CANONICAL_CHAIN" as const;

export const CAREER_CANONICAL_AUTHORITY_CONTRACTS = Object.freeze({
  RECOMMENDATION_PROPOSAL: "CAREER_RECOMMENDATION_PROPOSAL_PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND_V1",
  EVOLUTION_INPUT_STATE: "CAREER_EVOLUTION_INPUT_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
  TENSION_STATE: "CAREER_TENSION_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
  ROLE_RELATION: "CAREER_ROLE_RELATION_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
  TARGET_REQUIREMENT_REVISION: "CAREER_TARGET_REQUIREMENT_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
  TARGET_ROLE_PROFILE_REVISION: "CAREER_TARGET_ROLE_PROFILE_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
  TARGET_ORGANIZATION_REVISION: "CAREER_TARGET_ORGANIZATION_REVISION_IMMUTABLE_RECORD_V1",
  ORGANIZATION_RELATION: "CAREER_ORGANIZATION_RELATION_IMMUTABLE_RECORD_V1",
  CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT:
    "CAREER_CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_IMMUTABLE_RECORD_V1",
  ACTION_OCCURRENCE: "CAREER_ACTION_OCCURRENCE_DECLARATION_V1",
  STATE_CHANGE_DECLARATION: "CAREER_STATE_CHANGE_DECLARATION_V1",
  ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION: "CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_V1",
  OUTCOME_ROLE_DECLARATION: "CAREER_OUTCOME_ROLE_DECLARATION_V1",
  OUTCOME_VALENCE_DECLARATION: "CAREER_OUTCOME_VALENCE_DECLARATION_V1",
  OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_IMMUTABLE_RECORD_V1",
} as const);

export type CareerCanonicalAuthorityFamily = keyof typeof CAREER_CANONICAL_AUTHORITY_CONTRACTS;
export type CareerCanonicalAuthorityContractId =
  (typeof CAREER_CANONICAL_AUTHORITY_CONTRACTS)[CareerCanonicalAuthorityFamily];

/** Opaque four-field reference shape shared structurally with the generic Decision Core; no import crosses the fields. */
export interface CareerCanonicalAuthorityReference {
  producerId: typeof CAREER_CANONICAL_PRODUCER_ID;
  authorityContractId: CareerCanonicalAuthorityContractId;
  artifactId: string;
  locator: string;
}

/** G3 identities are exactly 32 upper-case hex characters after the prefix (R6). */
const idPattern = /^[A-Z]+_[0-9A-F]{32}$/;

/**
 * Builds the exact reference for one artifact id. The locator is the exact id
 * because every Career canonical repository reads by exact id only.
 * REFERENCE PRESENT != REFERENCE RESOLVABLE. LOCATOR != SELECTION.
 */
export function careerCanonicalReference(
  family: CareerCanonicalAuthorityFamily,
  artifactId: string,
): CareerCanonicalAuthorityReference {
  if (!Object.prototype.hasOwnProperty.call(CAREER_CANONICAL_AUTHORITY_CONTRACTS, family)) {
    throw new Error("ERR_CAREER_CANONICAL_AUTHORITY_FAMILY_INVALID");
  }
  if (typeof artifactId !== "string" || !idPattern.test(artifactId)) {
    throw new Error("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_ID_INVALID");
  }
  return {
    producerId: CAREER_CANONICAL_PRODUCER_ID,
    authorityContractId: CAREER_CANONICAL_AUTHORITY_CONTRACTS[family],
    artifactId,
    locator: artifactId,
  };
}

/** Deterministic check that a reference carries the exact producer and one known contract id. */
export function isCareerCanonicalReference(value: unknown): value is CareerCanonicalAuthorityReference {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as object);
  if (keys.length !== 4 || !["producerId", "authorityContractId", "artifactId", "locator"].every(key => keys.includes(key))) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.producerId === CAREER_CANONICAL_PRODUCER_ID &&
    typeof candidate.authorityContractId === "string" &&
    (Object.values(CAREER_CANONICAL_AUTHORITY_CONTRACTS) as string[]).includes(candidate.authorityContractId) &&
    typeof candidate.artifactId === "string" && idPattern.test(candidate.artifactId) &&
    typeof candidate.locator === "string" && candidate.locator.length > 0;
}
