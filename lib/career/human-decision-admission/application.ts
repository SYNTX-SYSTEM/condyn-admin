import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { HumanDecisionProducerDependencies } from "../relation/decision-record";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../relation-adapters/decision-authority-persistence";
import { PostgresCareerDecisionContextRevisionRepository } from "../relation-adapters/decision-context-persistence";
import { PostgresHumanDecisionRecordRepository } from "../relation-adapters/decision-record-persistence";
import { PostgresEvolutionInputStateRepository } from "../relation-adapters/evolution-input-persistence";
import {
  PostgresRecommendationPolicyRevisionRepository,
  PostgresRecommendationProposalRepository,
  productionRecommendationPolicyImplementationRegistry
} from "../relation-adapters/recommendation-proposal-persistence";
import { PostgresTensionStateRepository } from "../relation-adapters/tension-state-persistence";

/** Constructs only the sealed T11C producer dependencies; it performs no I/O. */
export function createProductionHumanDecisionRecordDependencies(
  database: PostgresJsDatabase
): HumanDecisionProducerDependencies {
  const authorities = new PostgresDecisionAuthorityGrantRevisionRepository(database);
  const tensions = new PostgresTensionStateRepository(database);
  const evolutionInputs = new PostgresEvolutionInputStateRepository(database, tensions);
  const policies = new PostgresRecommendationPolicyRevisionRepository(database);
  const proposals = new PostgresRecommendationProposalRepository(
    database,
    evolutionInputs,
    policies,
    productionRecommendationPolicyImplementationRegistry
  );
  const contexts = new PostgresCareerDecisionContextRevisionRepository(database, authorities, proposals);
  const records = new PostgresHumanDecisionRecordRepository(database, contexts, authorities, proposals);
  return Object.freeze({ contexts, authorities, proposals, records });
}
