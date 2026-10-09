import type { AuthoritativeStateReference, AuthoritativeStateResolver } from "../../decision-core";
import { assertCareerActionOccurrence, type CareerActionOccurrence } from "../../career/relation/action-occurrence";
import {
  assertCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration
} from "../../career/relation/action-state-change-association-declaration";
import {
  assertCapabilityRequirementRelationEvaluationResult,
  type CapabilityRequirementRelationEvaluationResult,
  type CapabilityRequirementRelationRepository
} from "../../career/relation/capability-requirement";
import { assertEvolutionInputState, type EvolutionInputState, type EvolutionInputStateRepository } from "../../career/relation/evolution-input";
import { assertOrganizationRelation, type OrganizationRelation } from "../../career/relation/organization-relation";
import { assertCareerOutcomeRoleDeclaration, type CareerOutcomeRoleDeclaration } from "../../career/relation/outcome-role-declaration";
import { assertCareerOutcomeValenceDeclaration, type CareerOutcomeValenceDeclaration } from "../../career/relation/outcome-valence-declaration";
import {
  assertCareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevision
} from "../../career/relation/outcome-valence-feedback-context-revision";
import {
  assertRecommendationProposal,
  type RecommendationProposal,
  type RecommendationProposalRepository
} from "../../career/relation/recommendation-proposal";
import { assertRoleRelation, type RoleRelation, type RoleRelationRepository } from "../../career/relation/role-relation";
import { assertCareerStateChangeDeclaration, type CareerStateChangeDeclaration } from "../../career/relation/state-change-declaration";
import { assertTensionState, type TensionState, type TensionStateRepository } from "../../career/relation/tension-state";
import { assertTargetOrganizationRevision, type TargetOrganizationRevision, type TargetOrganizationRevisionRepository } from "../../career/target/organization";
import {
  assertTargetRequirementRevision,
  assertTargetRoleProfileRevision,
  type TargetRequirementRevision,
  type TargetRequirementRevisionRepository,
  type TargetRoleProfileRevision,
  type TargetRoleProfileRevisionRepository
} from "../../career/target/role";
import {
  CAREER_CANONICAL_FAMILIES,
  CAREER_CANONICAL_FAMILY_ORDER,
  CAREER_CANONICAL_PRODUCER_ID,
  parseCareerCanonicalLocator,
  type CareerCanonicalFamily,
  type CareerCanonicalFamilyDefinition
} from "./namespace";

const STATE_NOT_FOUND = "ERR_DECISION_AUTHORITY_STATE_NOT_FOUND";
const STATE_INVALID = "ERR_DECISION_AUTHORITY_STATE_INVALID";
const REFERENCE_MISMATCH = "ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH";
const RESOLVER_NOT_FOUND = "ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND";

const fail = (code: string): never => { throw new Error(code); };

/** Exact read by artifact id. A repository may answer `null` or throw its own not-found code. */
export type CareerCanonicalExactRead<T> = (artifactId: string) => Promise<T | null>;

interface CareerCanonicalFamilyBinding {
  definition: CareerCanonicalFamilyDefinition;
  assertArtifact: (value: unknown) => void;
  /** Repository codes that mean "no such row"; mapped to ERR_DECISION_AUTHORITY_STATE_NOT_FOUND. */
  notFoundCodes: readonly string[];
  /** Repository codes that mean "the stored row no longer recomputes"; mapped to ERR_DECISION_AUTHORITY_STATE_INVALID. */
  invalidCodes: readonly string[];
}

const bind = (
  family: CareerCanonicalFamily,
  assertArtifact: (value: unknown) => void,
  notFoundCodes: readonly string[],
  invalidCodes: readonly string[]
): CareerCanonicalFamilyBinding => Object.freeze({ definition: CAREER_CANONICAL_FAMILIES[family], assertArtifact, notFoundCodes, invalidCodes });

const bindings: Readonly<Record<CareerCanonicalFamily, CareerCanonicalFamilyBinding>> = Object.freeze({
  RCP: bind("RCP", assertRecommendationProposal, [], ["ERR_RECOMMENDATION_PROPOSAL_PERSISTENCE_FAILED"]),
  EIS: bind("EIS", assertEvolutionInputState, [], ["ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED"]),
  TSN: bind("TSN", assertTensionState, [], ["ERR_TENSION_STATE_PERSISTENCE_FAILED"]),
  RRL: bind("RRL", assertRoleRelation, [], ["ERR_ROLE_RELATION_PERSISTENCE_INVALID"]),
  TRQREV: bind("TRQREV", assertTargetRequirementRevision, [], ["ERR_TARGET_REQUIREMENT_REVISION_POSTGRES_RECORD_INVALID", "ERR_TARGET_REQUIREMENT_REVISION_PERSISTENCE_INVALID"]),
  TRPREV: bind("TRPREV", assertTargetRoleProfileRevision, [], ["ERR_TARGET_ROLE_PROFILE_REVISION_POSTGRES_RECORD_INVALID", "ERR_TARGET_ROLE_PROFILE_REVISION_PERSISTENCE_INVALID"]),
  TOREV: bind("TOREV", assertTargetOrganizationRevision, [], ["ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID", "ERR_TARGET_ORGANIZATION_REVISION_PERSISTENCE_INVALID"]),
  ORL: bind("ORL", assertOrganizationRelation, [], ["ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID"]),
  CRRES: bind("CRRES", assertCapabilityRequirementRelationEvaluationResult, ["ERR_CAPABILITY_REQUIREMENT_RELATION_RESULT_NOT_FOUND"], ["ERR_CAPABILITY_REQUIREMENT_RELATION_PERSISTENCE_INVALID"]),
  AOC: bind("AOC", assertCareerActionOccurrence, ["ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND"], ["ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED"]),
  SCD: bind("SCD", assertCareerStateChangeDeclaration, ["ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND"], ["ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED"]),
  ASCAD: bind("ASCAD", assertCareerActionStateChangeAssociationDeclaration, ["ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND"], ["ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED"]),
  CORD: bind("CORD", assertCareerOutcomeRoleDeclaration, ["ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND"], ["ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED"]),
  COVD: bind("COVD", assertCareerOutcomeValenceDeclaration, ["ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND"], ["ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED"]),
  COVFCR: bind("COVFCR", assertCareerOutcomeValenceFeedbackContextRevision, [], ["ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED"])
});

function assertPair(definition: CareerCanonicalFamilyDefinition, reference: AuthoritativeStateReference): void {
  if (reference.producerId !== CAREER_CANONICAL_PRODUCER_ID || reference.authorityContractId !== definition.authorityContractId) {
    fail(RESOLVER_NOT_FOUND);
  }
}

/** The stored state must equal the state the contract id names; no implicit upgrade (decision D3). */
function assertEstablishedState(definition: CareerCanonicalFamilyDefinition, artifact: Record<string, unknown>): void {
  const established = definition.establishedState;
  if (established.kind === "PROPOSAL") {
    if (artifact.proposalState !== established.proposalState || artifact.authorityState !== established.authorityState) fail(STATE_INVALID);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(artifact, "authorityState") || Object.prototype.hasOwnProperty.call(artifact, "proposalState")) fail(STATE_INVALID);
}

function mapReadFailure(binding: CareerCanonicalFamilyBinding, error: unknown): never {
  const code = error instanceof Error ? error.message : "";
  if (binding.notFoundCodes.includes(code)) fail(STATE_NOT_FOUND);
  if (binding.invalidCodes.includes(code)) fail(STATE_INVALID);
  throw error;
}

/**
 * One resolver for one G3 family. The read capability is captured once; the repository
 * remains the live source for append-only growth. A resolved payload is detached state,
 * never a portable authority token, and never Decision Context content.
 */
function createCareerCanonicalResolver<T extends object>(binding: CareerCanonicalFamilyBinding, read: CareerCanonicalExactRead<T>): AuthoritativeStateResolver<T> {
  const { definition } = binding;
  if (typeof read !== "function") fail("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
  return {
    producerId: CAREER_CANONICAL_PRODUCER_ID,
    authorityContractId: definition.authorityContractId,
    async resolve(reference: AuthoritativeStateReference): Promise<T> {
      assertPair(definition, reference);
      if (!definition.artifactIdPattern.test(reference.artifactId)) fail(REFERENCE_MISMATCH);
      const ordinal = parseCareerCanonicalLocator(definition, reference.artifactId, reference.locator);
      let stored: T | null;
      try {
        stored = await read(reference.artifactId);
      } catch (error) {
        return mapReadFailure(binding, error);
      }
      if (stored === null || stored === undefined) return fail(STATE_NOT_FOUND);
      try {
        binding.assertArtifact(stored);
      } catch {
        return fail(STATE_INVALID);
      }
      const artifact = stored as unknown as Record<string, unknown>;
      assertEstablishedState(definition, artifact);
      if (artifact[definition.idField] !== reference.artifactId) fail(REFERENCE_MISMATCH);
      if (ordinal !== null) {
        const items = definition.itemLocatorField === null ? undefined : artifact[definition.itemLocatorField];
        if (!Array.isArray(items) || ordinal >= items.length) fail(REFERENCE_MISMATCH);
      }
      return structuredClone(stored);
    }
  };
}

const capture = <R extends object, K extends keyof R>(repository: R, method: K): CareerCanonicalExactRead<never> => {
  const value = repository[method];
  if (typeof value !== "function") fail("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
  // Bind the read capability once; later mutation of the repository object cannot redirect it.
  return (value as unknown as (id: string) => Promise<never>).bind(repository);
};

export interface CareerActionOccurrenceExactReader { getCareerActionOccurrenceById(id: string): Promise<CareerActionOccurrence | null>; }
export interface CareerStateChangeDeclarationExactReader { getCareerStateChangeDeclarationById(id: string): Promise<CareerStateChangeDeclaration | null>; }
export interface CareerActionStateChangeAssociationDeclarationExactReader { getCareerActionStateChangeAssociationDeclarationById(id: string): Promise<CareerActionStateChangeAssociationDeclaration | null>; }
export interface CareerOutcomeRoleDeclarationExactReader { getCareerOutcomeRoleDeclarationById(id: string): Promise<CareerOutcomeRoleDeclaration | null>; }
export interface CareerOutcomeValenceDeclarationExactReader { getCareerOutcomeValenceDeclarationById(id: string): Promise<CareerOutcomeValenceDeclaration | null>; }
export interface CareerOutcomeValenceFeedbackContextRevisionExactReader { getCareerOutcomeValenceFeedbackContextRevisionById(id: string): Promise<CareerOutcomeValenceFeedbackContextRevision | null>; }
export interface OrganizationRelationExactReader { getOrganizationRelationById(id: string): Promise<OrganizationRelation | null>; }

export function createRecommendationProposalAuthoritativeStateResolver(repository: Pick<RecommendationProposalRepository, "getRecommendationProposalById">): AuthoritativeStateResolver<RecommendationProposal> {
  return createCareerCanonicalResolver<RecommendationProposal>(bindings.RCP, capture(repository, "getRecommendationProposalById"));
}
export function createEvolutionInputStateAuthoritativeStateResolver(repository: Pick<EvolutionInputStateRepository, "getEvolutionInputStateById">): AuthoritativeStateResolver<EvolutionInputState> {
  return createCareerCanonicalResolver<EvolutionInputState>(bindings.EIS, capture(repository, "getEvolutionInputStateById"));
}
export function createTensionStateAuthoritativeStateResolver(repository: Pick<TensionStateRepository, "getTensionStateById">): AuthoritativeStateResolver<TensionState> {
  return createCareerCanonicalResolver<TensionState>(bindings.TSN, capture(repository, "getTensionStateById"));
}
export function createRoleRelationAuthoritativeStateResolver(repository: Pick<RoleRelationRepository, "getRoleRelationById">): AuthoritativeStateResolver<RoleRelation> {
  return createCareerCanonicalResolver<RoleRelation>(bindings.RRL, capture(repository, "getRoleRelationById"));
}
export function createTargetRequirementRevisionAuthoritativeStateResolver(repository: Pick<TargetRequirementRevisionRepository, "getRevisionById">): AuthoritativeStateResolver<TargetRequirementRevision> {
  return createCareerCanonicalResolver<TargetRequirementRevision>(bindings.TRQREV, capture(repository, "getRevisionById"));
}
export function createTargetRoleProfileRevisionAuthoritativeStateResolver(repository: Pick<TargetRoleProfileRevisionRepository, "getRevisionById">): AuthoritativeStateResolver<TargetRoleProfileRevision> {
  return createCareerCanonicalResolver<TargetRoleProfileRevision>(bindings.TRPREV, capture(repository, "getRevisionById"));
}
export function createTargetOrganizationRevisionAuthoritativeStateResolver(repository: Pick<TargetOrganizationRevisionRepository, "getRevisionById">): AuthoritativeStateResolver<TargetOrganizationRevision> {
  return createCareerCanonicalResolver<TargetOrganizationRevision>(bindings.TOREV, capture(repository, "getRevisionById"));
}
export function createOrganizationRelationAuthoritativeStateResolver(repository: OrganizationRelationExactReader): AuthoritativeStateResolver<OrganizationRelation> {
  return createCareerCanonicalResolver<OrganizationRelation>(bindings.ORL, capture(repository, "getOrganizationRelationById"));
}
export function createCapabilityRequirementEvaluationResultAuthoritativeStateResolver(repository: Pick<CapabilityRequirementRelationRepository, "getResultById">): AuthoritativeStateResolver<CapabilityRequirementRelationEvaluationResult> {
  return createCareerCanonicalResolver<CapabilityRequirementRelationEvaluationResult>(bindings.CRRES, capture(repository, "getResultById"));
}
export function createCareerActionOccurrenceAuthoritativeStateResolver(repository: CareerActionOccurrenceExactReader): AuthoritativeStateResolver<CareerActionOccurrence> {
  return createCareerCanonicalResolver<CareerActionOccurrence>(bindings.AOC, capture(repository, "getCareerActionOccurrenceById"));
}
export function createCareerStateChangeDeclarationAuthoritativeStateResolver(repository: CareerStateChangeDeclarationExactReader): AuthoritativeStateResolver<CareerStateChangeDeclaration> {
  return createCareerCanonicalResolver<CareerStateChangeDeclaration>(bindings.SCD, capture(repository, "getCareerStateChangeDeclarationById"));
}
export function createCareerActionStateChangeAssociationDeclarationAuthoritativeStateResolver(repository: CareerActionStateChangeAssociationDeclarationExactReader): AuthoritativeStateResolver<CareerActionStateChangeAssociationDeclaration> {
  return createCareerCanonicalResolver<CareerActionStateChangeAssociationDeclaration>(bindings.ASCAD, capture(repository, "getCareerActionStateChangeAssociationDeclarationById"));
}
export function createCareerOutcomeRoleDeclarationAuthoritativeStateResolver(repository: CareerOutcomeRoleDeclarationExactReader): AuthoritativeStateResolver<CareerOutcomeRoleDeclaration> {
  return createCareerCanonicalResolver<CareerOutcomeRoleDeclaration>(bindings.CORD, capture(repository, "getCareerOutcomeRoleDeclarationById"));
}
export function createCareerOutcomeValenceDeclarationAuthoritativeStateResolver(repository: CareerOutcomeValenceDeclarationExactReader): AuthoritativeStateResolver<CareerOutcomeValenceDeclaration> {
  return createCareerCanonicalResolver<CareerOutcomeValenceDeclaration>(bindings.COVD, capture(repository, "getCareerOutcomeValenceDeclarationById"));
}
export function createCareerOutcomeValenceFeedbackContextRevisionAuthoritativeStateResolver(repository: CareerOutcomeValenceFeedbackContextRevisionExactReader): AuthoritativeStateResolver<CareerOutcomeValenceFeedbackContextRevision> {
  return createCareerCanonicalResolver<CareerOutcomeValenceFeedbackContextRevision>(bindings.COVFCR, capture(repository, "getCareerOutcomeValenceFeedbackContextRevisionById"));
}

/** Exact-read repositories for every resolvable family, one per family, nothing shared. */
export interface CareerCanonicalProducerRepositories {
  recommendationProposals: Pick<RecommendationProposalRepository, "getRecommendationProposalById">;
  evolutionInputStates: Pick<EvolutionInputStateRepository, "getEvolutionInputStateById">;
  tensionStates: Pick<TensionStateRepository, "getTensionStateById">;
  roleRelations: Pick<RoleRelationRepository, "getRoleRelationById">;
  targetRequirementRevisions: Pick<TargetRequirementRevisionRepository, "getRevisionById">;
  targetRoleProfileRevisions: Pick<TargetRoleProfileRevisionRepository, "getRevisionById">;
  targetOrganizationRevisions: Pick<TargetOrganizationRevisionRepository, "getRevisionById">;
  organizationRelations: OrganizationRelationExactReader;
  capabilityRequirementRelations: Pick<CapabilityRequirementRelationRepository, "getResultById">;
  actionOccurrences: CareerActionOccurrenceExactReader;
  stateChangeDeclarations: CareerStateChangeDeclarationExactReader;
  actionStateChangeAssociationDeclarations: CareerActionStateChangeAssociationDeclarationExactReader;
  outcomeRoleDeclarations: CareerOutcomeRoleDeclarationExactReader;
  outcomeValenceDeclarations: CareerOutcomeValenceDeclarationExactReader;
  outcomeValenceFeedbackContextRevisions: CareerOutcomeValenceFeedbackContextRevisionExactReader;
}

/** The complete resolver family in canonical order; each entry binds its own exact read once. */
export function createCareerCanonicalAuthoritativeStateResolvers(repositories: CareerCanonicalProducerRepositories): AuthoritativeStateResolver[] {
  const byFamily: Record<CareerCanonicalFamily, () => AuthoritativeStateResolver> = {
    RCP: () => createRecommendationProposalAuthoritativeStateResolver(repositories.recommendationProposals),
    EIS: () => createEvolutionInputStateAuthoritativeStateResolver(repositories.evolutionInputStates),
    TSN: () => createTensionStateAuthoritativeStateResolver(repositories.tensionStates),
    RRL: () => createRoleRelationAuthoritativeStateResolver(repositories.roleRelations),
    TRQREV: () => createTargetRequirementRevisionAuthoritativeStateResolver(repositories.targetRequirementRevisions),
    TRPREV: () => createTargetRoleProfileRevisionAuthoritativeStateResolver(repositories.targetRoleProfileRevisions),
    TOREV: () => createTargetOrganizationRevisionAuthoritativeStateResolver(repositories.targetOrganizationRevisions),
    ORL: () => createOrganizationRelationAuthoritativeStateResolver(repositories.organizationRelations),
    CRRES: () => createCapabilityRequirementEvaluationResultAuthoritativeStateResolver(repositories.capabilityRequirementRelations),
    AOC: () => createCareerActionOccurrenceAuthoritativeStateResolver(repositories.actionOccurrences),
    SCD: () => createCareerStateChangeDeclarationAuthoritativeStateResolver(repositories.stateChangeDeclarations),
    ASCAD: () => createCareerActionStateChangeAssociationDeclarationAuthoritativeStateResolver(repositories.actionStateChangeAssociationDeclarations),
    CORD: () => createCareerOutcomeRoleDeclarationAuthoritativeStateResolver(repositories.outcomeRoleDeclarations),
    COVD: () => createCareerOutcomeValenceDeclarationAuthoritativeStateResolver(repositories.outcomeValenceDeclarations),
    COVFCR: () => createCareerOutcomeValenceFeedbackContextRevisionAuthoritativeStateResolver(repositories.outcomeValenceFeedbackContextRevisions)
  };
  return CAREER_CANONICAL_FAMILY_ORDER.map((family) => byFamily[family]());
}
