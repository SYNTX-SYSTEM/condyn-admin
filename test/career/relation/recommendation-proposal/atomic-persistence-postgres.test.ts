import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deriveEvolutionInputStateId, type EvolutionInputState } from "../../../../lib/career/relation/evolution-input";
import { deriveRecommendationPolicyRevisionId, deriveRecommendationProposal } from "../../../../lib/career/relation/recommendation-proposal";
import { PostgresRecommendationPolicyRevisionRepository, PostgresRecommendationProposalRepository } from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence";
import { recommendationPolicyRevisions, recommendationPolicyRules, recommendationProposals, recommendationProposalAggregateReferences, recommendationProposalItems, recommendationProposalOperandReferences, recommendationProposalRelationReferences, recommendationProposalRequirementReferences, recommendationProposalResultReferences } from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence/postgres-schema";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `recommendation_atomic_${randomBytes(8).toString("hex")}`;
const stamp = "2027-02-01T00:00:00.000Z";
let admin: Sql;
const clients = new Set<Sql>();
const tables = [recommendationPolicyRevisions, recommendationPolicyRules, recommendationProposals, recommendationProposalItems, recommendationProposalRequirementReferences, recommendationProposalAggregateReferences, recommendationProposalRelationReferences, recommendationProposalResultReferences, recommendationProposalOperandReferences].map(getTableConfig);
const quote = (value: string) => `"${value}"`;
const ddl = (config: typeof tables[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`), ...config.foreignKeys.map(key => { const ref = key.reference(); return `FOREIGN KEY (${ref.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(ref.foreignTable).name)} (${ref.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`; })].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };

const policySemantic = {
  provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "ACTOR_T10", authorityEvidenceRef: "evidence://policy" },
  rules: [
    { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const },
  ],
  recommendationPolicyImplementationVersion: "recommendation-v1",
  schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const,
};
const policy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(policySemantic), ...policySemantic, createdAt: stamp };
const evolutionSemantic = {
  tensionStateId: "TSN_ATOMIC", roleRelationId: "RRL_ATOMIC", verifiedCapabilitySnapshotId: "SNAP_ATOMIC", targetRoleProfileRevisionId: "TRP_ATOMIC", targetRoleRequirementInventoryId: "TRQINV_ATOMIC",
  items: [{ evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, derivationDisposition: "DERIVABLE" as const, tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const, tensionClassificationCode: "LEVEL_BELOW_RELATION", subjectKind: "REQUIREMENT" as const, dimension: "LEVEL" as const, targetRequirementEntityId: null, targetRequirementRevisionIds: [], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] }],
  derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const,
};
const evolution: EvolutionInputState = { evolutionInputStateId: deriveEvolutionInputStateId(evolutionSemantic), ...evolutionSemantic, createdAt: stamp };
const proposal = deriveRecommendationProposal(evolution, policy, { version: "recommendation-v1" }, stamp);

beforeAll(async () => {
  admin = postgres(url, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schema}"`);
  for (const table of ["evolution_input_states", "career_capability_snapshots", "target_role_profile_revisions", "target_role_requirement_inventories", "target_requirement_revisions", "requirement_relation_aggregates", "capability_requirement_relations", "capability_requirement_relation_evaluation_results"]) {
    const column = table === "career_capability_snapshots" ? "snapshot_id" : table === "target_role_profile_revisions" ? "target_role_profile_revision_id" : table === "target_role_requirement_inventories" ? "target_role_requirement_inventory_id" : table === "target_requirement_revisions" ? "target_requirement_revision_id" : table === "requirement_relation_aggregates" ? "requirement_relation_aggregate_id" : table === "capability_requirement_relations" ? "capability_requirement_relation_id" : table === "capability_requirement_relation_evaluation_results" ? "capability_requirement_relation_evaluation_result_id" : "evolution_input_state_id";
    await admin.unsafe(`CREATE TABLE "${schema}"."${table}" ("${column}" text PRIMARY KEY)`);
  }
  for (const table of tables) await admin.unsafe(ddl(table));
});
afterAll(async () => { await Promise.all([...clients].map(value => value.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

describe("T10 PostgreSQL immutable materialization atomicity", () => {
  it("rolls back a failed RPR root-plus-rule write and permits a clean retry", async () => {
    const { sql, db } = await client();
    const policies = new PostgresRecommendationPolicyRevisionRepository(db);
    await sql.unsafe(`CREATE FUNCTION reject_rpr_rule() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected RPR rule failure'; END; $$`);
    await sql.unsafe(`CREATE TRIGGER reject_rpr_rule BEFORE INSERT ON recommendation_policy_rules FOR EACH ROW EXECUTE FUNCTION reject_rpr_rule()`);
    await expect(policies.persistRecommendationPolicyRevision(policy)).rejects.toThrow("ERR_RECOMMENDATION_POLICY_REVISION_PERSISTENCE_FAILED");
    expect(Number((await sql`SELECT count(*)::int AS count FROM recommendation_policy_revisions WHERE recommendation_policy_revision_id = ${policy.recommendationPolicyRevisionId}`)[0].count)).toBe(0);
    expect(Number((await sql`SELECT count(*)::int AS count FROM recommendation_policy_rules WHERE recommendation_policy_revision_id = ${policy.recommendationPolicyRevisionId}`)[0].count)).toBe(0);
    await sql.unsafe(`DROP TRIGGER reject_rpr_rule ON recommendation_policy_rules`);
    await sql.unsafe(`DROP FUNCTION reject_rpr_rule()`);
    await expect(policies.persistRecommendationPolicyRevision(policy)).resolves.toEqual(policy);
    await sql.end({ timeout: 5 }); clients.delete(sql);
  });

  it("rolls back a failed RCP root-plus-witness write and permits a clean retry", async () => {
    const { sql, db } = await client();
    await sql`INSERT INTO evolution_input_states (evolution_input_state_id) VALUES (${evolution.evolutionInputStateId})`;
    await sql`INSERT INTO career_capability_snapshots (snapshot_id) VALUES (${evolution.verifiedCapabilitySnapshotId})`;
    await sql`INSERT INTO target_role_profile_revisions (target_role_profile_revision_id) VALUES (${evolution.targetRoleProfileRevisionId})`;
    await sql`INSERT INTO target_role_requirement_inventories (target_role_requirement_inventory_id) VALUES (${evolution.targetRoleRequirementInventoryId})`;
    const policies = new PostgresRecommendationPolicyRevisionRepository(db);
    await policies.persistRecommendationPolicyRevision(policy);
    const evolutions = { getEvolutionInputStateById: async (id: string) => id === evolution.evolutionInputStateId ? structuredClone(evolution) : null, persistEvolutionInputState: async () => { throw new Error("unused"); } };
    const proposals = new PostgresRecommendationProposalRepository(db, evolutions, policies, { resolveRecommendationPolicyImplementation: version => version === "recommendation-v1" ? { version } : null });
    await sql.unsafe(`CREATE FUNCTION reject_rcp_item() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected RCP item failure'; END; $$`);
    await sql.unsafe(`CREATE TRIGGER reject_rcp_item BEFORE INSERT ON recommendation_proposal_items FOR EACH ROW EXECUTE FUNCTION reject_rcp_item()`);
    await expect(proposals.persistRecommendationProposal(proposal)).rejects.toThrow("ERR_RECOMMENDATION_PROPOSAL_PERSISTENCE_FAILED");
    expect(Number((await sql`SELECT count(*)::int AS count FROM recommendation_proposals WHERE recommendation_proposal_id = ${proposal.recommendationProposalId}`)[0].count)).toBe(0);
    expect(Number((await sql`SELECT count(*)::int AS count FROM recommendation_proposal_items WHERE recommendation_proposal_id = ${proposal.recommendationProposalId}`)[0].count)).toBe(0);
    await sql.unsafe(`DROP TRIGGER reject_rcp_item ON recommendation_proposal_items`);
    await sql.unsafe(`DROP FUNCTION reject_rcp_item()`);
    await expect(proposals.persistRecommendationProposal(proposal)).resolves.toEqual(proposal);
    await sql.end({ timeout: 5 }); clients.delete(sql);
  });
});
