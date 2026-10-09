/**
 * Namespace of the G3 Career Canonical Chain as an authoritative-state producer for G2.
 *
 * Relation R1/R6 of docs/architecture/decision-fields/G2_G3_FIELD_RELATION.md:
 * one resolver per eligible artifact family, bound to one (producerId, authorityContractId)
 * pair, resolving one exact artifact id by an exact-length pattern. Nothing here resolves
 * by prefix, selects a latest row, or upgrades an authority state (decision D3).
 *
 * The contract id names the artifact family and the state literals the artifact itself
 * carries: `proposalState` and `authorityState` where the family has them
 * (NONE is rendered as AUTHORITY_NONE), DECLARATION for explicit human declarations,
 * and IMMUTABLE_RECORD for families whose contract carries no proposal or authority field.
 * PHASE4_VERIFIED stays reserved for Capability Core.
 */

export const CAREER_CANONICAL_PRODUCER_ID = "CONDYN_CAREER_CANONICAL_CHAIN";

export type CareerCanonicalFamily =
  | "RCP"
  | "EIS"
  | "TSN"
  | "RRL"
  | "TRQREV"
  | "TRPREV"
  | "TOREV"
  | "ORL"
  | "CRRES"
  | "AOC"
  | "SCD"
  | "ASCAD"
  | "CORD"
  | "COVD"
  | "COVFCR";

/** Literal state an artifact must carry for its contract id to be truthful (decision D3). */
export type CareerCanonicalEstablishedState =
  | { kind: "PROPOSAL"; proposalState: "PROPOSAL_ONLY"; authorityState: "NONE" | "RECOMMENDATION_POLICY_BOUND" }
  | { kind: "DECLARATION" }
  | { kind: "IMMUTABLE_RECORD" };

export interface CareerCanonicalFamilyDefinition {
  family: CareerCanonicalFamily;
  prefix: string;
  /** Exact-length identity pattern. A shorter or longer hex body never matches (R6). */
  artifactIdPattern: RegExp;
  idField: string;
  authorityContractId: string;
  establishedState: CareerCanonicalEstablishedState;
  /** Only the RCP family admits an item locator `<artifactId>/items/<ordinal>`. */
  itemLocatorField: "items" | null;
}

export const CAREER_CANONICAL_HEX_LENGTH = 32;

/** Builds the exact-length identity pattern of one G3 prefix; never a prefix-only test. */
export function careerCanonicalArtifactIdPattern(prefix: string): RegExp {
  if (!/^[A-Z]+$/.test(prefix)) throw new Error("ERR_CAREER_CANONICAL_NAMESPACE_PREFIX_INVALID");
  return new RegExp(`^${prefix}_[0-9A-F]{${CAREER_CANONICAL_HEX_LENGTH}}$`);
}

const proposalOnlyNone: CareerCanonicalEstablishedState = { kind: "PROPOSAL", proposalState: "PROPOSAL_ONLY", authorityState: "NONE" };
const declaration: CareerCanonicalEstablishedState = { kind: "DECLARATION" };
const immutableRecord: CareerCanonicalEstablishedState = { kind: "IMMUTABLE_RECORD" };

const define = (
  family: CareerCanonicalFamily,
  prefix: string,
  idField: string,
  authorityContractId: string,
  establishedState: CareerCanonicalEstablishedState,
  itemLocatorField: "items" | null = null
): CareerCanonicalFamilyDefinition => Object.freeze({
  family,
  prefix,
  artifactIdPattern: careerCanonicalArtifactIdPattern(prefix),
  idField,
  authorityContractId,
  establishedState,
  itemLocatorField
});

export const CAREER_CANONICAL_FAMILIES: Readonly<Record<CareerCanonicalFamily, CareerCanonicalFamilyDefinition>> = Object.freeze({
  RCP: define("RCP", "RCP", "recommendationProposalId", "CAREER_RECOMMENDATION_PROPOSAL_PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND_V1", { kind: "PROPOSAL", proposalState: "PROPOSAL_ONLY", authorityState: "RECOMMENDATION_POLICY_BOUND" }, "items"),
  EIS: define("EIS", "EIS", "evolutionInputStateId", "CAREER_EVOLUTION_INPUT_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1", proposalOnlyNone),
  TSN: define("TSN", "TSN", "tensionStateId", "CAREER_TENSION_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1", proposalOnlyNone),
  RRL: define("RRL", "RRL", "roleRelationId", "CAREER_ROLE_RELATION_PROPOSAL_ONLY_AUTHORITY_NONE_V1", proposalOnlyNone),
  TRQREV: define("TRQREV", "TRQREV", "targetRequirementRevisionId", "CAREER_TARGET_REQUIREMENT_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1", proposalOnlyNone),
  TRPREV: define("TRPREV", "TRPREV", "targetRoleProfileRevisionId", "CAREER_TARGET_ROLE_PROFILE_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1", proposalOnlyNone),
  TOREV: define("TOREV", "TOREV", "targetOrganizationRevisionId", "CAREER_TARGET_ORGANIZATION_REVISION_IMMUTABLE_RECORD_V1", immutableRecord),
  ORL: define("ORL", "ORL", "organizationRelationId", "CAREER_ORGANIZATION_RELATION_IMMUTABLE_RECORD_V1", immutableRecord),
  CRRES: define("CRRES", "CRRES", "capabilityRequirementRelationEvaluationResultId", "CAREER_CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_IMMUTABLE_RECORD_V1", immutableRecord),
  AOC: define("AOC", "AOC", "careerActionOccurrenceId", "CAREER_ACTION_OCCURRENCE_DECLARATION_V1", declaration),
  SCD: define("SCD", "SCD", "careerStateChangeDeclarationId", "CAREER_STATE_CHANGE_DECLARATION_V1", declaration),
  ASCAD: define("ASCAD", "ASCAD", "careerActionStateChangeAssociationDeclarationId", "CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_V1", declaration),
  CORD: define("CORD", "CORD", "careerOutcomeRoleDeclarationId", "CAREER_OUTCOME_ROLE_DECLARATION_V1", declaration),
  COVD: define("COVD", "COVD", "careerOutcomeValenceDeclarationId", "CAREER_OUTCOME_VALENCE_DECLARATION_V1", declaration),
  COVFCR: define("COVFCR", "COVFCR", "careerOutcomeValenceFeedbackContextRevisionId", "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_IMMUTABLE_RECORD_V1", immutableRecord)
});

export const CAREER_CANONICAL_FAMILY_ORDER: readonly CareerCanonicalFamily[] = Object.freeze([
  "RCP", "EIS", "TSN", "RRL", "TRQREV", "TRPREV", "TOREV", "ORL", "CRRES", "AOC", "SCD", "ASCAD", "CORD", "COVD", "COVFCR"
]);

/**
 * G3 prefixes that are deliberately not resolvable through this producer.
 * CRREL: its identity excludes the evaluation (use CRRES).
 * DAINT, DCR, DCTXREV, DAR, HCOM, EAGR, ECTXREV: the human decision carrier and its
 * execution chain are never upstream state for a G2 context (decision D1).
 */
export const CAREER_CANONICAL_NON_RESOLVABLE_PREFIXES: readonly string[] = Object.freeze([
  "CRREL", "DAINT", "DCR", "DCTXREV", "DAR", "HCOM", "EAGR", "ECTXREV"
]);

export const CAREER_CANONICAL_ITEM_LOCATOR_SEGMENT = "/items/";

/**
 * Locator grammar: the exact artifact id, or `<artifactId>/items/<ordinal>` for one
 * exact item of an RCP. Returns the ordinal, or null for a whole-artifact locator.
 * Any other shape is a reference mismatch, never a near-miss resolution.
 */
export function parseCareerCanonicalLocator(definition: CareerCanonicalFamilyDefinition, artifactId: string, locator: string): number | null {
  if (locator === artifactId) return null;
  if (definition.itemLocatorField === null) throw new Error("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
  const head = `${artifactId}${CAREER_CANONICAL_ITEM_LOCATOR_SEGMENT}`;
  if (!locator.startsWith(head)) throw new Error("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
  const ordinalText = locator.slice(head.length);
  if (!/^(0|[1-9][0-9]*)$/.test(ordinalText)) throw new Error("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
  const ordinal = Number(ordinalText);
  if (!Number.isSafeInteger(ordinal)) throw new Error("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
  return ordinal;
}

export function careerCanonicalItemLocator(artifactId: string, ordinal: number): string {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0) throw new Error("ERR_CAREER_CANONICAL_NAMESPACE_ORDINAL_INVALID");
  return `${artifactId}${CAREER_CANONICAL_ITEM_LOCATOR_SEGMENT}${ordinal}`;
}
