import { getTableConfig } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import * as actionIntent from "../../../lib/career/relation-adapters/action-intent-persistence/postgres-schema";
import * as actionOccurrence from "../../../lib/career/relation-adapters/action-occurrence-persistence/postgres-schema";
import * as association from "../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence/postgres-schema";
import * as executionGrant from "../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
import * as executionContext from "../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres-schema";
import * as humanCommitment from "../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import * as outcomeRole from "../../../lib/career/relation-adapters/outcome-role-declaration-persistence/postgres-schema";
import * as outcomeValence from "../../../lib/career/relation-adapters/outcome-valence-declaration-persistence/postgres-schema";
import * as stateChange from "../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres-schema";

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;

/**
 * Post-decision chain tables (DAINT to COVD) in foreign-key order. The T11 startup
 * registration ends at human_decision_records; until R7 covers these tables they are
 * provisioned here with the same drizzle definitions the repositories write through.
 * Idempotent: CREATE TABLE IF NOT EXISTS, so a later startup registration wins.
 */
export const postDecisionTables = [
  actionIntent.careerDecisionActionIntents, actionIntent.careerDecisionActionIntentSubjects, actionIntent.careerDecisionActionIntentEvidenceReferences,
  humanCommitment.careerHumanCommitments, humanCommitment.careerHumanCommitmentSubjects, humanCommitment.careerHumanCommitmentEvidenceReferences,
  executionGrant.careerExecutionAuthorityGrantRevisions, executionGrant.careerExecutionAuthorityGrantSubjects, executionGrant.careerExecutionAuthorityGrantTargetKinds, executionGrant.careerExecutionAuthorityGrantChannelKinds, executionGrant.careerExecutionAuthorityGrantEvidenceReferences,
  executionContext.careerExecutionContextRevisions, executionContext.careerExecutionContextSubjects, executionContext.careerExecutionContextEvidenceReferences,
  actionOccurrence.careerActionOccurrences, actionOccurrence.careerActionOccurrenceSubjects, actionOccurrence.careerActionOccurrenceEvidenceReferences,
  stateChange.careerStateChangeDeclarations, stateChange.careerStateChangeDeclarationSubjects, stateChange.careerStateChangeDeclarationEvidenceReferences,
  association.careerActionStateChangeAssociationDeclarations, association.careerActionStateChangeAssociationDeclarationSubjects, association.careerActionStateChangeAssociationDeclarationEvidenceReferences,
  outcomeRole.careerOutcomeRoleDeclarations, outcomeRole.careerOutcomeRoleDeclarationSubjects, outcomeRole.careerOutcomeRoleDeclarationEvidenceReferences,
  outcomeValence.careerOutcomeValenceDeclarations, outcomeValence.careerOutcomeValenceDeclarationSubjects, outcomeValence.careerOutcomeValenceDeclarationEvidenceReferences
].map(getTableConfig);

export const postDecisionTableNames = postDecisionTables.map((config) => config.name);

export async function provisionPostDecisionTables(sql: Sql): Promise<void> {
  for (const config of postDecisionTables) {
    const columns = config.columns.map((column) => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`);
    const keys = config.foreignKeys.map((key) => {
      const reference = key.reference();
      return `FOREIGN KEY (${reference.columns.map((column) => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map((column) => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
    });
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS ${quote(config.name)} (${[...columns, ...keys].join(", ")})`);
  }
}
