import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "../../career/db/client";
import { PostgresCareerDecisionActionIntentRepository } from "../../career/relation-adapters/action-intent-persistence/postgres";
import { PostgresCareerActionOccurrenceRepository } from "../../career/relation-adapters/action-occurrence-persistence/postgres";
import { PostgresCareerActionStateChangeAssociationDeclarationRepository } from "../../career/relation-adapters/action-state-change-association-declaration-persistence/postgres";
import { PostgresCapabilityRequirementRelationRepository } from "../../career/relation-adapters/capability-requirement-persistence";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../../career/relation-adapters/decision-authority-persistence";
import { PostgresCareerDecisionContextRevisionRepository } from "../../career/relation-adapters/decision-context-persistence";
import { PostgresHumanDecisionRecordRepository } from "../../career/relation-adapters/decision-record-persistence";
import { PostgresEvolutionInputStateRepository } from "../../career/relation-adapters/evolution-input-persistence";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../career/relation-adapters/execution-authority-grant-persistence/postgres";
import { PostgresCareerExecutionContextRevisionRepository } from "../../career/relation-adapters/execution-context-revision-persistence/postgres";
import { PostgresCareerHumanCommitmentRepository } from "../../career/relation-adapters/human-commitment-persistence/postgres";
import { PostgresOrganizationRelationRepository } from "../../career/relation-adapters/organization-relation-persistence";
import { PostgresCareerOutcomeRoleDeclarationRepository } from "../../career/relation-adapters/outcome-role-declaration-persistence/postgres";
import { PostgresCareerOutcomeValenceDeclarationRepository } from "../../career/relation-adapters/outcome-valence-declaration-persistence/postgres";
import { PostgresCareerOutcomeValenceFeedbackContextRevisionRepository } from "../../career/relation-adapters/outcome-valence-feedback-context-revision-persistence";
import {
  PostgresRecommendationPolicyRevisionRepository,
  PostgresRecommendationProposalRepository
} from "../../career/relation-adapters/recommendation-proposal-persistence";
import { productionRecommendationPolicyImplementationRegistry } from "../../career/relation-adapters/recommendation-proposal-persistence/implementation-registry";
import { PostgresRoleRelationRepository } from "../../career/relation-adapters/role-relation-persistence";
import { PostgresCareerStateChangeDeclarationRepository } from "../../career/relation-adapters/state-change-declaration-persistence/postgres";
import { PostgresTensionStateRepository } from "../../career/relation-adapters/tension-state-persistence";
import { PostgresTargetOrganizationRevisionRepository } from "../../career/target-adapters/organization-revision-persistence";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../career/target-adapters/role-organization-binding-revision-persistence";
import { PostgresTargetRoleProfileRevisionRepository } from "../../career/target-adapters/role-profile-revision-persistence";
import { PostgresTargetRequirementRevisionRepository } from "../../career/target-adapters/role-requirement-revision-persistence";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../career/target-adapters/role-source-binding-revision-persistence";
import { PostgresTargetSourceRevisionRepository } from "../../career/target-adapters/source-revision-persistence";
import type { CareerCanonicalProducerRepositories } from "../../decision-adapters/career-canonical";

type CareerDatabase = PostgresJsDatabase;
type OrganizationRelationDatabase = NonNullable<ConstructorParameters<typeof PostgresOrganizationRelationRepository>[0]>;

/**
 * R3: the G3 repositories are constructed locally, on the one shared PostgreSQL
 * connection, with their own exact lineage lookups. No repository is shared with the
 * G2 revision repository, no foreign key crosses the fields, and nothing here selects
 * a current, head or latest artifact.
 */
export function createLocalCareerCanonicalProducerRepositories(database: CareerDatabase = db as unknown as CareerDatabase): CareerCanonicalProducerRepositories {
  const organizations = new PostgresTargetOrganizationRevisionRepository(database);
  const sources = new PostgresTargetSourceRevisionRepository(database);
  const roleSources = new PostgresTargetRoleSourceBindingRevisionRepository(database, {
    getTargetSourceRevisionById: sources.getRevisionById.bind(sources)
  });
  const bindings = new PostgresTargetRoleOrganizationBindingRevisionRepository(database, {
    getTargetRoleSourceBindingRevisionById: roleSources.getRevisionById.bind(roleSources),
    getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations)
  });
  const profiles = new PostgresTargetRoleProfileRevisionRepository(database, {
    getTargetRoleOrganizationBindingRevisionById: bindings.getRevisionById.bind(bindings),
    getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations)
  });
  const requirements = new PostgresTargetRequirementRevisionRepository(database, {
    getTargetRoleProfileRevisionById: profiles.getRevisionById.bind(profiles),
    getTargetRoleOrganizationBindingRevisionById: bindings.getRevisionById.bind(bindings),
    getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations)
  });
  const relations = new PostgresCapabilityRequirementRelationRepository(database);
  const roleRelations = new PostgresRoleRelationRepository(database);
  const tensionStates = new PostgresTensionStateRepository(database);
  const evolutionInputs = new PostgresEvolutionInputStateRepository(database, tensionStates);
  const policies = new PostgresRecommendationPolicyRevisionRepository(database);
  const proposals = new PostgresRecommendationProposalRepository(database, evolutionInputs, policies, productionRecommendationPolicyImplementationRegistry);
  const organizationRelations = new PostgresOrganizationRelationRepository(database as unknown as OrganizationRelationDatabase, { organizations, roles: roleRelations, profiles, bindings });

  const decisionAuthorities = new PostgresDecisionAuthorityGrantRevisionRepository(database);
  const decisionContexts = new PostgresCareerDecisionContextRevisionRepository(database, decisionAuthorities, proposals);
  const decisionRecords = new PostgresHumanDecisionRecordRepository(database, decisionContexts, decisionAuthorities, proposals);
  const actionIntents = new PostgresCareerDecisionActionIntentRepository(database, decisionRecords);
  const commitments = new PostgresCareerHumanCommitmentRepository(database, actionIntents);
  const executionGrants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(database, commitments);
  const executionContexts = new PostgresCareerExecutionContextRevisionRepository(database, executionGrants);
  const occurrences = new PostgresCareerActionOccurrenceRepository(database, executionContexts, executionGrants);
  const stateChanges = new PostgresCareerStateChangeDeclarationRepository(database, occurrences);
  const associations = new PostgresCareerActionStateChangeAssociationDeclarationRepository(database, stateChanges);
  const outcomeRoles = new PostgresCareerOutcomeRoleDeclarationRepository(database, associations);
  const outcomeValences = new PostgresCareerOutcomeValenceDeclarationRepository(database, outcomeRoles);
  const feedbackContextRevisions = new PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(database);

  return {
    recommendationProposals: proposals,
    evolutionInputStates: evolutionInputs,
    tensionStates,
    roleRelations,
    targetRequirementRevisions: requirements,
    targetRoleProfileRevisions: profiles,
    targetOrganizationRevisions: organizations,
    organizationRelations,
    capabilityRequirementRelations: relations,
    actionOccurrences: occurrences,
    stateChangeDeclarations: stateChanges,
    actionStateChangeAssociationDeclarations: associations,
    outcomeRoleDeclarations: outcomeRoles,
    outcomeValenceDeclarations: outcomeValences,
    outcomeValenceFeedbackContextRevisions: feedbackContextRevisions
  };
}
