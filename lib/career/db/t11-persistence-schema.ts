import { getTableConfig } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import { careerCapabilitySnapshots } from "./schema";
import {
  targetSourceRevisions
} from "../target-adapters/source-revision-persistence/postgres-schema";
import {
  targetOrganizationRevisions
} from "../target-adapters/organization-revision-persistence/postgres-schema";
import {
  targetRoleSourceBindingRevisions
} from "../target-adapters/role-source-binding-revision-persistence/postgres-schema";
import {
  targetRoleOrganizationBindingRevisions
} from "../target-adapters/role-organization-binding-revision-persistence/postgres-schema";
import {
  targetRoleProfileRevisions
} from "../target-adapters/role-profile-revision-persistence/postgres-schema";
import {
  targetRequirementRevisions
} from "../target-adapters/role-requirement-revision-persistence/postgres-schema";
import {
  capabilityRequirementRelationEvaluationResults,
  capabilityRequirementRelationEvaluationRuns,
  capabilityRequirementRelationRawProviderOutputs,
  capabilityRequirementRelations
} from "../relation-adapters/capability-requirement-persistence/postgres-schema";
import {
  requirementRelationAggregateFailedResults,
  requirementRelationAggregateMaterializedRelations,
  requirementRelationAggregateNotEvaluatedPairs,
  requirementRelationAggregates,
  targetRoleRequirementInventories
} from "../relation-adapters/requirement-inventory-persistence/postgres-schema";
import {
  roleRelationAggregateReferences,
  roleRelationCoverageReferences,
  roleRelations
} from "../relation-adapters/role-relation-persistence/postgres-schema";
import {
  tensionStateAggregateReferences,
  tensionStateCandidateOperandReferences,
  tensionStateEvaluationResultReferences,
  tensionStateRelationReferences,
  tensionStateRequirementReferences,
  tensionStates
} from "../relation-adapters/tension-state-persistence/postgres-schema";
import {
  evolutionInputAggregateReferences,
  evolutionInputCandidateOperandReferences,
  evolutionInputEvaluationResultReferences,
  evolutionInputItemReferences,
  evolutionInputRelationReferences,
  evolutionInputRequirementReferences,
  evolutionInputStates
} from "../relation-adapters/evolution-input-persistence/postgres-schema";
import {
  recommendationPolicyRevisions,
  recommendationPolicyRules,
  recommendationProposalAggregateReferences,
  recommendationProposalItems,
  recommendationProposalOperandReferences,
  recommendationProposalRelationReferences,
  recommendationProposalRequirementReferences,
  recommendationProposalResultReferences,
  recommendationProposals
} from "../relation-adapters/recommendation-proposal-persistence/postgres-schema";
import {
  decisionAuthorityGrantDecisionClasses,
  decisionAuthorityGrantEvidenceReferences,
  decisionAuthorityGrantRevisions,
  decisionAuthorityGrantSubjectKinds
} from "../relation-adapters/decision-authority-persistence/grant-postgres-schema";
import {
  careerDecisionContextDecisionClasses,
  careerDecisionContextEvidenceReferences,
  careerDecisionContextRevisions,
  careerDecisionContextSubjectKinds,
  careerDecisionContextSubjects
} from "../relation-adapters/decision-context-persistence/postgres-schema";
import {
  humanDecisionRecordDecisionClasses,
  humanDecisionRecordEvidenceReferences,
  humanDecisionRecords,
  humanDecisionRecordSubjectKinds,
  humanDecisionRecordSubjects
} from "../relation-adapters/decision-record-persistence/postgres-schema";

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

const tables = [
  careerCapabilitySnapshots,
  targetSourceRevisions,
  targetOrganizationRevisions,
  targetRoleSourceBindingRevisions,
  targetRoleOrganizationBindingRevisions,
  targetRoleProfileRevisions,
  targetRequirementRevisions,
  capabilityRequirementRelationRawProviderOutputs,
  capabilityRequirementRelationEvaluationRuns,
  capabilityRequirementRelationEvaluationResults,
  capabilityRequirementRelations,
  targetRoleRequirementInventories,
  requirementRelationAggregates,
  requirementRelationAggregateMaterializedRelations,
  requirementRelationAggregateFailedResults,
  requirementRelationAggregateNotEvaluatedPairs,
  roleRelations,
  roleRelationAggregateReferences,
  roleRelationCoverageReferences,
  tensionStates,
  tensionStateRequirementReferences,
  tensionStateAggregateReferences,
  tensionStateRelationReferences,
  tensionStateEvaluationResultReferences,
  tensionStateCandidateOperandReferences,
  evolutionInputStates,
  evolutionInputItemReferences,
  evolutionInputRequirementReferences,
  evolutionInputAggregateReferences,
  evolutionInputRelationReferences,
  evolutionInputEvaluationResultReferences,
  evolutionInputCandidateOperandReferences,
  recommendationPolicyRevisions,
  recommendationPolicyRules,
  recommendationProposals,
  recommendationProposalItems,
  recommendationProposalRequirementReferences,
  recommendationProposalAggregateReferences,
  recommendationProposalRelationReferences,
  recommendationProposalResultReferences,
  recommendationProposalOperandReferences,
  decisionAuthorityGrantRevisions,
  decisionAuthorityGrantDecisionClasses,
  decisionAuthorityGrantSubjectKinds,
  decisionAuthorityGrantEvidenceReferences,
  careerDecisionContextRevisions,
  careerDecisionContextSubjects,
  careerDecisionContextEvidenceReferences,
  careerDecisionContextDecisionClasses,
  careerDecisionContextSubjectKinds,
  humanDecisionRecords,
  humanDecisionRecordSubjects,
  humanDecisionRecordEvidenceReferences,
  humanDecisionRecordDecisionClasses,
  humanDecisionRecordSubjectKinds
].map(getTableConfig);

const createTableStatement = (config: typeof tables[number]) =>
  `CREATE TABLE IF NOT EXISTS ${quote(config.name)} (${[
    ...config.columns.map(column =>
      `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`
    ),
    ...config.foreignKeys.map(key => {
      const reference = key.reference();
      return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
    })
  ].join(",")})`;

/**
 * Startup-only DDL derived from the canonical Drizzle table declarations.
 * The ordered list is the complete persisted predecessor graph needed by T11.
 */
export async function initT11ProductionPersistenceSchema(sql: Sql): Promise<void> {
  for (const table of tables) await sql.unsafe(createTableStatement(table));
}

export const t11ProductionPersistenceTableNames = Object.freeze(tables.map(table => table.name));
