import { randomBytes } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { createDecisionAuthorityGrantRevision } from "../../../../lib/career/relation/decision-authority";
import { createCareerDecisionContextRevision } from "../../../../lib/career/relation/decision-context";
import { deriveEvolutionInputStateId } from "../../../../lib/career/relation/evolution-input";
import { deriveRecommendationPolicyRevisionId, deriveRecommendationProposal } from "../../../../lib/career/relation/recommendation-proposal";
import { createHumanDecisionRecord } from "../../../../lib/career/relation/decision-record";
import { createCareerDecisionActionIntent } from "../../../../lib/career/relation/action-intent";
import { InMemoryEvolutionInputStateRepository } from "../../../../lib/career/relation/evolution-input";
import { sameRecommendationData } from "../../../../lib/career/relation/recommendation-proposal";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/decision-authority-persistence";
import { decisionAuthorityGrantDecisionClasses, decisionAuthorityGrantEvidenceReferences, decisionAuthorityGrantRevisions, decisionAuthorityGrantSubjectKinds } from "../../../../lib/career/relation-adapters/decision-authority-persistence/grant-postgres-schema";
import { PostgresCareerDecisionContextRevisionRepository } from "../../../../lib/career/relation-adapters/decision-context-persistence";
import { careerDecisionContextDecisionClasses, careerDecisionContextEvidenceReferences, careerDecisionContextRevisions, careerDecisionContextSubjectKinds, careerDecisionContextSubjects } from "../../../../lib/career/relation-adapters/decision-context-persistence/postgres-schema";
import { PostgresHumanDecisionRecordRepository } from "../../../../lib/career/relation-adapters/decision-record-persistence";
import { humanDecisionRecordDecisionClasses, humanDecisionRecordEvidenceReferences, humanDecisionRecords, humanDecisionRecordSubjectKinds, humanDecisionRecordSubjects } from "../../../../lib/career/relation-adapters/decision-record-persistence/postgres-schema";
import { careerDecisionActionIntentEvidenceReferences, careerDecisionActionIntents, careerDecisionActionIntentSubjects } from "../../../../lib/career/relation-adapters/action-intent-persistence/postgres-schema";
import { PostgresRecommendationPolicyRevisionRepository, PostgresRecommendationProposalRepository } from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence";
import { recommendationPolicyRevisions, recommendationPolicyRules, recommendationProposalAggregateReferences, recommendationProposalItems, recommendationProposalOperandReferences, recommendationProposalRelationReferences, recommendationProposalRequirementReferences, recommendationProposalResultReferences, recommendationProposals } from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence/postgres-schema";

export const t12aStamp = "2027-02-01T00:00:00.000Z";
export const t12aLater = "2027-02-02T00:00:00.000Z";
export function createT12AHistoricalFixture() {
  const authority = createDecisionAuthorityGrantRevision({ grantorActorId: "GRANTOR_T12A", authorizedActorId: "DECIDER_T12A", authorityScope: "CAREER_RECOMMENDATION_DECISION", permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REJECT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"], permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://grant/t12a"], declaredAt: t12aStamp, effectiveFrom: t12aStamp, effectiveUntil: "2027-02-01T12:00:00.000Z", createdAt: t12aStamp });
  const semantic = { provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "POLICY_T12A", authorityEvidenceRef: "evidence://policy/t12a" }, rules: [{ evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const }, { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const }, { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const }, { evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const }], recommendationPolicyImplementationVersion: "recommendation-v1", schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const };
  const policy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(semantic), ...semantic, createdAt: t12aStamp };
  const evolutionSemantic = { tensionStateId: "TSN_T12A", roleRelationId: "RRL_T12A", verifiedCapabilitySnapshotId: "SNAP_T12A", targetRoleProfileRevisionId: "TRP_T12A", targetRoleRequirementInventoryId: "INV_T12A", items: ["A", "B"].map(targetRequirementEntityId => ({ evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, derivationDisposition: "DERIVABLE" as const, tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const, tensionClassificationCode: "LEVEL_BELOW_RELATION", subjectKind: "REQUIREMENT" as const, dimension: "LEVEL" as const, targetRequirementEntityId, targetRequirementRevisionIds: [`TRR_T12A_${targetRequirementEntityId}`], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] })), derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const };
  const evolution = { evolutionInputStateId: deriveEvolutionInputStateId(evolutionSemantic), ...evolutionSemantic, createdAt: t12aStamp }, proposal = deriveRecommendationProposal(evolution, policy, { version: "recommendation-v1" }, t12aStamp);
  const context = createCareerDecisionContextRevision(authority, proposal, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: proposal.recommendationProposalId, decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 1 }, { recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }], contextEvidenceRefs: ["evidence://context/t12a"], createdAt: t12aStamp });
  const decisionRecord = createHumanDecisionRecord(context, authority, proposal, { careerDecisionContextRevisionId: context.careerDecisionContextRevisionId, declarantActorId: "DECIDER_T12A", declarationClass: "ACCEPT_RECOMMENDATION", declaredAt: t12aStamp, declarationEvidenceRefs: ["evidence://decision/t12a"], createdAt: t12aStamp });
  const actionIntent = createCareerDecisionActionIntent(decisionRecord, { humanDecisionRecordId: decisionRecord.humanDecisionRecordId, declaredByActorId: decisionRecord.declarantActorId, actionIntentClass: "RECOMMENDATION_OPERATIONALIZATION", operationDescription: "Operationalize both exact recommendation subjects", declaredAt: t12aLater, actionIntentEvidenceRefs: ["evidence://intent/t12a"], createdAt: t12aLater });
  return { authority, policy, evolution, proposal, context, decisionRecord, actionIntent };
}
export function recordingRepository<T extends Record<string, string>>(value: T | null, key: keyof T) { const calls: string[] = []; return { calls, async get(id: string) { calls.push(id); return value !== null && value[key] === id ? structuredClone(value) : null; } }; }

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `t12a_${randomBytes(8).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql | undefined;
let initialized = false;
let initialization: Promise<void> | undefined;
const quote = (value: string) => `"${value}"`;
const configs = [decisionAuthorityGrantRevisions, decisionAuthorityGrantDecisionClasses, decisionAuthorityGrantSubjectKinds, decisionAuthorityGrantEvidenceReferences, recommendationPolicyRevisions, recommendationPolicyRules, recommendationProposals, recommendationProposalItems, recommendationProposalRequirementReferences, recommendationProposalAggregateReferences, recommendationProposalRelationReferences, recommendationProposalResultReferences, recommendationProposalOperandReferences, careerDecisionContextRevisions, careerDecisionContextSubjects, careerDecisionContextEvidenceReferences, careerDecisionContextDecisionClasses, careerDecisionContextSubjectKinds, humanDecisionRecords, humanDecisionRecordSubjects, humanDecisionRecordEvidenceReferences, humanDecisionRecordDecisionClasses, humanDecisionRecordSubjectKinds, careerDecisionActionIntents, careerDecisionActionIntentSubjects, careerDecisionActionIntentEvidenceReferences].map(getTableConfig);
const ddl = (config: typeof configs[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`), ...config.foreignKeys.map(key => { const reference = key.reference(); return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")})`; })].join(",")})`;

export async function initializeT12AHistoricalPostgresFixture(): Promise<void> {
  if (initialized) return;
  if (!initialization) {
    initialization = (async () => {
      const candidate = postgres(url, { max: 1, onnotice: () => undefined });
      try {
        await candidate.unsafe(`CREATE SCHEMA ${quote(schema)}`);
        for (const [table, column] of [["evolution_input_states", "evolution_input_state_id"], ["career_capability_snapshots", "snapshot_id"], ["target_role_profile_revisions", "target_role_profile_revision_id"], ["target_role_requirement_inventories", "target_role_requirement_inventory_id"], ["target_requirement_revisions", "target_requirement_revision_id"], ["requirement_relation_aggregates", "requirement_relation_aggregate_id"], ["capability_requirement_relations", "capability_requirement_relation_id"], ["capability_requirement_relation_evaluation_results", "capability_requirement_relation_evaluation_result_id"]]) await candidate.unsafe(`CREATE TABLE ${quote(schema)}.${quote(table)} (${quote(column)} text PRIMARY KEY)`);
        for (const config of configs) await candidate.unsafe(ddl(config));
        admin = candidate;
        initialized = true;
      } catch (error) {
        try {
          await candidate.unsafe(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`);
        } finally {
          await candidate.end({ timeout: 5 });
        }
        throw error;
      }
    })();
  }
  try {
    await initialization;
  } finally {
    initialization = undefined;
  }
}

export async function createT12AHistoricalClient() { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO ${quote(schema)}`); return { sql, db: drizzle(sql) }; }

export async function closeT12AHistoricalFixture(): Promise<void> {
  const registeredClients = [...clients];
  const currentAdmin = admin;
  clients.clear();
  admin = undefined;
  try {
    await Promise.all(registeredClients.map(client => client.end({ timeout: 5 })));
  } finally {
    try {
      if (currentAdmin) await currentAdmin.unsafe(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`);
    } finally {
      try {
        if (currentAdmin) await currentAdmin.end({ timeout: 5 });
      } finally {
        initialized = false;
        initialization = undefined;
      }
    }
  }
}

async function seed(db: PostgresJsDatabase, value: ReturnType<typeof createT12AHistoricalFixture>["evolution"]) {
  const seeds: Array<readonly [string, string, string]> = [
    ["evolution_input_states", "evolution_input_state_id", value.evolutionInputStateId],
    ["career_capability_snapshots", "snapshot_id", value.verifiedCapabilitySnapshotId],
    ["target_role_profile_revisions", "target_role_profile_revision_id", value.targetRoleProfileRevisionId],
    ["target_role_requirement_inventories", "target_role_requirement_inventory_id", value.targetRoleRequirementInventoryId],
    ...value.items.flatMap(item =>
      item.targetRequirementRevisionIds.map(revisionId =>
        ["target_requirement_revisions", "target_requirement_revision_id", revisionId] as const
      )
    ),
  ];

  for (const [table, column, id] of seeds) {
    await db.execute(
      drizzleSql.raw(`INSERT INTO ${table}(${column}) VALUES('${id}') ON CONFLICT DO NOTHING`)
    );
    const rows = await db.execute(
      drizzleSql.raw(`SELECT ${column} FROM ${table} WHERE ${column}='${id}'`)
    ) as unknown as Record<string, string>[];

    if (rows.length !== 1 || rows[0][column] !== id) {
      throw new Error("ERR_T12A_FIXTURE_PREDECESSOR_SEED_INVALID");
    }
  }
}

export function transactionScopedT12AHistoricalGraph(database: PostgresJsDatabase, evolution: InMemoryEvolutionInputStateRepository, implementations: { resolveRecommendationPolicyImplementation(version: string): { version: string } | null }) { const authorities = new PostgresDecisionAuthorityGrantRevisionRepository(database), policies = new PostgresRecommendationPolicyRevisionRepository(database), proposals = new PostgresRecommendationProposalRepository(database, evolution, policies, implementations), contexts = new PostgresCareerDecisionContextRevisionRepository(database, authorities, proposals), records = new PostgresHumanDecisionRecordRepository(database, contexts, authorities, proposals); return { authorities, policies, proposals, contexts, records }; }

export async function readyT12AHistoricalGraph() { await initializeT12AHistoricalPostgresFixture(); const historical = createT12AHistoricalFixture(); const first = await createT12AHistoricalClient(); await seed(first.db, historical.evolution); const evolution = new InMemoryEvolutionInputStateRepository(), implementations = { resolveRecommendationPolicyImplementation: (version: string) => version === "recommendation-v1" ? { version } : null }; await evolution.persistEvolutionInputState(historical.evolution); const graph = transactionScopedT12AHistoricalGraph(first.db, evolution, implementations); await graph.authorities.persistDecisionAuthorityGrantRevision(historical.authority); await graph.policies.persistRecommendationPolicyRevision(historical.policy); const proposal = await graph.proposals.persistRecommendationProposal(historical.proposal); const reread = await graph.proposals.getRecommendationProposalById(historical.proposal.recommendationProposalId); if (!sameRecommendationData(historical.proposal, proposal) || !sameRecommendationData(proposal, reread)) throw new Error("ERR_T12A_FIXTURE_RCP_NOT_EXACT"); await graph.contexts.persistCareerDecisionContextRevision(historical.context); await graph.records.persistHumanDecisionRecord(historical.decisionRecord); const decisionRecord = await graph.records.getHumanDecisionRecordById(historical.decisionRecord.humanDecisionRecordId); if (!decisionRecord || !isDeepStrictEqual(decisionRecord, historical.decisionRecord)) {
  throw new Error("ERR_T12A_FIXTURE_DCR_NOT_EXACT");
} return { ...historical, first, evolution, implementations, ...graph }; }
