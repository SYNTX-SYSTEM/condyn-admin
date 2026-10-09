import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { PostgresCareerDecisionActionIntentRepository } from "../../../lib/career/relation-adapters/action-intent-persistence/postgres";
import { PostgresCareerActionOccurrenceRepository } from "../../../lib/career/relation-adapters/action-occurrence-persistence/postgres";
import { PostgresCareerActionStateChangeAssociationDeclarationRepository } from "../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence/postgres";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../../../lib/career/relation-adapters/decision-authority-persistence";
import { PostgresCareerDecisionContextRevisionRepository } from "../../../lib/career/relation-adapters/decision-context-persistence";
import { PostgresCareerDecisionContextDecisionRevisionBindingRepository } from "../../../lib/career/relation-adapters/decision-context-decision-revision-binding-persistence";
import { PostgresHumanDecisionRecordRepository } from "../../../lib/career/relation-adapters/decision-record-persistence";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres";
import { PostgresCareerExecutionContextRevisionRepository } from "../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres";
import { PostgresCareerHumanCommitmentRepository } from "../../../lib/career/relation-adapters/human-commitment-persistence/postgres";
import { PostgresCareerOutcomeRoleDeclarationRepository } from "../../../lib/career/relation-adapters/outcome-role-declaration-persistence/postgres";
import { PostgresCareerOutcomeValenceDeclarationRepository } from "../../../lib/career/relation-adapters/outcome-valence-declaration-persistence/postgres";
import { PostgresCareerStateChangeDeclarationRepository } from "../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres";
import type { RecommendationProposalRepository } from "../../../lib/career/relation/recommendation-proposal";

/** The T11/T12 decision and execution chain repositories over one database, each with its exact lineage lookup. */
export function careerDecisionChainRepositories(db: PostgresJsDatabase, proposals: RecommendationProposalRepository) {
  const authorities = new PostgresDecisionAuthorityGrantRevisionRepository(db);
  const contexts = new PostgresCareerDecisionContextRevisionRepository(db, authorities, proposals);
  const records = new PostgresHumanDecisionRecordRepository(db, contexts, authorities, proposals);
  const intents = new PostgresCareerDecisionActionIntentRepository(db, records);
  const commitments = new PostgresCareerHumanCommitmentRepository(db, intents);
  const executionGrants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(db, commitments);
  const executionContexts = new PostgresCareerExecutionContextRevisionRepository(db, executionGrants);
  const occurrences = new PostgresCareerActionOccurrenceRepository(db, executionContexts, executionGrants);
  const stateChanges = new PostgresCareerStateChangeDeclarationRepository(db, occurrences);
  const associations = new PostgresCareerActionStateChangeAssociationDeclarationRepository(db, stateChanges);
  const outcomeRoles = new PostgresCareerOutcomeRoleDeclarationRepository(db, associations);
  const outcomeValences = new PostgresCareerOutcomeValenceDeclarationRepository(db, outcomeRoles);
  const bindings = new PostgresCareerDecisionContextDecisionRevisionBindingRepository(db);
  return { authorities, contexts, records, intents, commitments, executionGrants, executionContexts, occurrences, stateChanges, associations, outcomeRoles, outcomeValences, bindings };
}
