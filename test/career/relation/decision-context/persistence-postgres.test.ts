import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDecisionAuthorityGrantRevision } from "../../../../lib/career/relation/decision-authority";
import { createCareerDecisionContextRevision } from "../../../../lib/career/relation/decision-context";
import { deriveEvolutionInputStateId } from "../../../../lib/career/relation/evolution-input";
import { deriveRecommendationPolicyRevisionId, deriveRecommendationProposal, InMemoryRecommendationProposalRepository } from "../../../../lib/career/relation/recommendation-proposal";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/decision-authority-persistence";
import { decisionAuthorityGrantDecisionClasses, decisionAuthorityGrantEvidenceReferences, decisionAuthorityGrantRevisions, decisionAuthorityGrantSubjectKinds } from "../../../../lib/career/relation-adapters/decision-authority-persistence/grant-postgres-schema";
import { PostgresCareerDecisionContextRevisionRepository } from "../../../../lib/career/relation-adapters/decision-context-persistence";
import { careerDecisionContextDecisionClasses, careerDecisionContextEvidenceReferences, careerDecisionContextRevisions, careerDecisionContextSubjectKinds, careerDecisionContextSubjects } from "../../../../lib/career/relation-adapters/decision-context-persistence/postgres-schema";
import { recommendationPolicyRevisions, recommendationProposals } from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence/postgres-schema";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `career_context_${randomBytes(8).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
const quote = (value: string) => `"${value}"`;
const tables = [
  decisionAuthorityGrantRevisions, decisionAuthorityGrantDecisionClasses, decisionAuthorityGrantSubjectKinds, decisionAuthorityGrantEvidenceReferences,
  recommendationPolicyRevisions, recommendationProposals,
  careerDecisionContextRevisions, careerDecisionContextSubjects, careerDecisionContextEvidenceReferences, careerDecisionContextDecisionClasses, careerDecisionContextSubjectKinds
].map(getTableConfig);
const ddl = (config: typeof tables[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[
  ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
  ...config.foreignKeys.map(key => { const ref = key.reference(); return `FOREIGN KEY (${ref.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(ref.foreignTable).name)} (${ref.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`; })
].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };
const stamp = "2027-02-01T00:00:00.000Z";
const authority = createDecisionAuthorityGrantRevision({ grantorActorId: "GRANTOR_DB", authorizedActorId: "DECIDER_DB", authorityScope: "CAREER_RECOMMENDATION_DECISION", permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE"], permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://grant/db"], declaredAt: stamp, effectiveFrom: stamp, effectiveUntil: null, createdAt: stamp });
const policySemantic = { provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "POLICY_DB", authorityEvidenceRef: "evidence://policy/db" }, rules: [
  { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const },
  { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
  { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
  { evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const }
], recommendationPolicyImplementationVersion: "recommendation-v1", schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const };
const policy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(policySemantic), ...policySemantic, createdAt: stamp };
const evolutionSemantic = { tensionStateId: "TSN_DB", roleRelationId: "RRL_DB", verifiedCapabilitySnapshotId: "SNAP_DB", targetRoleProfileRevisionId: "TRP_DB", targetRoleRequirementInventoryId: "TRQINV_DB", items: [{ evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, derivationDisposition: "DERIVABLE" as const, tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const, tensionClassificationCode: "LEVEL_BELOW_RELATION", subjectKind: "REQUIREMENT" as const, dimension: "LEVEL" as const, targetRequirementEntityId: null, targetRequirementRevisionIds: [], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] }], derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const };
const evolution = { evolutionInputStateId: deriveEvolutionInputStateId(evolutionSemantic), ...evolutionSemantic, createdAt: stamp };
const proposal = deriveRecommendationProposal(evolution, policy, { version: "recommendation-v1" }, stamp);
const context = () => createCareerDecisionContextRevision(authority, proposal, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: proposal.recommendationProposalId, decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }], contextEvidenceRefs: ["evidence://context/db"], createdAt: stamp });

beforeAll(async () => {
  admin = postgres(url, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schema}"`);
  for (const table of ["evolution_input_states", "career_capability_snapshots", "target_role_profile_revisions", "target_role_requirement_inventories"]) {
    const column = table === "evolution_input_states" ? "evolution_input_state_id" : table === "career_capability_snapshots" ? "snapshot_id" : table === "target_role_profile_revisions" ? "target_role_profile_revision_id" : "target_role_requirement_inventory_id";
    await admin.unsafe(`CREATE TABLE "${schema}"."${table}" ("${column}" text PRIMARY KEY)`);
  }
  for (const table of tables) await admin.unsafe(ddl(table));
});
afterAll(async () => { await Promise.all([...clients].map(value => value.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

async function seedRcp(db: PostgresJsDatabase) {
  await db.insert(recommendationPolicyRevisions).values({ recommendationPolicyRevisionId: policy.recommendationPolicyRevisionId, recommendationPolicyImplementationVersion: policy.recommendationPolicyImplementationVersion, actorId: policy.provenance.actorId, authorityEvidenceRef: policy.provenance.authorityEvidenceRef, schemaVersion: policy.schemaVersion, createdAt: policy.createdAt, payload: policy }).onConflictDoNothing();
  await db.execute(drizzleSql`INSERT INTO evolution_input_states(evolution_input_state_id) VALUES(${evolution.evolutionInputStateId}) ON CONFLICT DO NOTHING`);
  await db.execute(drizzleSql`INSERT INTO career_capability_snapshots(snapshot_id) VALUES(${evolution.verifiedCapabilitySnapshotId}) ON CONFLICT DO NOTHING`);
  await db.execute(drizzleSql`INSERT INTO target_role_profile_revisions(target_role_profile_revision_id) VALUES(${evolution.targetRoleProfileRevisionId}) ON CONFLICT DO NOTHING`);
  await db.execute(drizzleSql`INSERT INTO target_role_requirement_inventories(target_role_requirement_inventory_id) VALUES(${evolution.targetRoleRequirementInventoryId}) ON CONFLICT DO NOTHING`);
  await db.insert(recommendationProposals).values({ recommendationProposalId: proposal.recommendationProposalId, evolutionInputStateId: proposal.evolutionInputStateId, recommendationPolicyRevisionId: proposal.recommendationPolicyRevisionId, tensionStateId: proposal.tensionStateId, roleRelationId: proposal.roleRelationId, verifiedCapabilitySnapshotId: proposal.verifiedCapabilitySnapshotId, targetRoleProfileRevisionId: proposal.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: proposal.targetRoleRequirementInventoryId, schemaVersion: proposal.schemaVersion, createdAt: proposal.createdAt, payload: proposal }).onConflictDoNothing();
}

describe("T11B PostgreSQL immutable CareerDecisionContextRevision", () => {
  it("persists exact DAR/RCP witnesses, raw inventories, restart-safe reads, and immutable conflict", async () => {
    const first = await client(); await seedRcp(first.db);
    const authorities = new PostgresDecisionAuthorityGrantRevisionRepository(first.db); const proposals = new InMemoryRecommendationProposalRepository(); await authorities.persistDecisionAuthorityGrantRevision(authority); await proposals.persistRecommendationProposal(proposal);
    const repository = new PostgresCareerDecisionContextRevisionRepository(first.db, authorities, proposals); const value = context();
    await expect(repository.persistCareerDecisionContextRevision(value)).resolves.toEqual(value); await expect(repository.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId)).resolves.toEqual(value); await expect(repository.persistCareerDecisionContextRevision(value)).resolves.toEqual(value); await expect(repository.persistCareerDecisionContextRevision({ ...value, createdAt: "2028-02-01T00:00:00.000Z" })).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_IMMUTABLE_CONFLICT");
    await first.sql.end({ timeout: 5 }); clients.delete(first.sql);
    const fresh = await client(); const restartedAuthorities = new PostgresDecisionAuthorityGrantRevisionRepository(fresh.db); const restartedProposals = new InMemoryRecommendationProposalRepository(); await restartedProposals.persistRecommendationProposal(proposal); const restarted = new PostgresCareerDecisionContextRevisionRepository(fresh.db, restartedAuthorities, restartedProposals);
    await expect(restarted.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId)).resolves.toEqual(value);
    await fresh.sql.end({ timeout: 5 }); clients.delete(fresh.sql);
  });

  it("fails closed for root, DAR/RCP, and missing/extra/duplicate raw inventory corruption", async () => {
    const { sql, db } = await client(); await seedRcp(db); const authorities = new PostgresDecisionAuthorityGrantRevisionRepository(db); const proposals = new InMemoryRecommendationProposalRepository(); await authorities.persistDecisionAuthorityGrantRevision(authority); await proposals.persistRecommendationProposal(proposal); const repository = new PostgresCareerDecisionContextRevisionRepository(db, authorities, proposals); const value = context(); await repository.persistCareerDecisionContextRevision(value);
    const foreignAuthority = createDecisionAuthorityGrantRevision({ grantorActorId: "FOREIGN_GRANTOR", authorizedActorId: "FOREIGN_DECIDER", authorityScope: "CAREER_RECOMMENDATION_DECISION", permittedDecisionClasses: ["ACCEPT_RECOMMENDATION"], permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://foreign-grant"], declaredAt: stamp, effectiveFrom: stamp, effectiveUntil: null, createdAt: stamp }); await authorities.persistDecisionAuthorityGrantRevision(foreignAuthority);
    const foreignProposalId = "RCP_11111111111111111111111111111111"; await db.insert(recommendationProposals).values({ recommendationProposalId: foreignProposalId, evolutionInputStateId: proposal.evolutionInputStateId, recommendationPolicyRevisionId: proposal.recommendationPolicyRevisionId, tensionStateId: proposal.tensionStateId, roleRelationId: proposal.roleRelationId, verifiedCapabilitySnapshotId: proposal.verifiedCapabilitySnapshotId, targetRoleProfileRevisionId: proposal.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: proposal.targetRoleRequirementInventoryId, schemaVersion: proposal.schemaVersion, createdAt: proposal.createdAt, payload: proposal }).onConflictDoNothing();
    const invalid = (transaction: PostgresJsDatabase) => expect(new PostgresCareerDecisionContextRevisionRepository(transaction, new PostgresDecisionAuthorityGrantRevisionRepository(transaction), proposals).getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId)).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    const rollback = async (operation: (transaction: PostgresJsDatabase) => Promise<void>) => db.transaction(async transaction => { await operation(transaction as unknown as PostgresJsDatabase); throw new Error("rollback context corruption"); }).catch(error => { if (error.message !== "rollback context corruption") throw error; });
    for (const statement of [
      drizzleSql`UPDATE career_decision_context_revisions SET payload=jsonb_set(payload,'{careerDecisionContextRevisionId}','"DCTXREV_00000000000000000000000000000000"'::jsonb) WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`,
      drizzleSql`UPDATE career_decision_context_revisions SET decision_authority_grant_revision_id=${foreignAuthority.decisionAuthorityGrantRevisionId} WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`,
      drizzleSql`UPDATE career_decision_context_revisions SET recommendation_proposal_id=${foreignProposalId} WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`,
      drizzleSql`UPDATE career_decision_context_revisions SET authority_scope='foreign' WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`,
      drizzleSql`UPDATE career_decision_context_revisions SET schema_version='foreign' WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`
    ]) await rollback(async transaction => { await transaction.execute(statement); await invalid(transaction); });
    const inventories = [
      ["career_decision_context_subjects", "subject"], ["career_decision_context_evidence_references", "evidence"], ["career_decision_context_decision_classes", "class"], ["career_decision_context_subject_kinds", "kind"]
    ] as const;
    for (const [table, kind] of inventories) {
      await rollback(async transaction => { await transaction.execute(drizzleSql.raw(`DELETE FROM ${table} WHERE career_decision_context_revision_id = '${value.careerDecisionContextRevisionId}'`)); await invalid(transaction); });
      const columns = table === "career_decision_context_subjects" ? "reference_id,career_decision_context_revision_id,recommendation_proposal_id,source_evolution_input_item_ordinal" : table === "career_decision_context_evidence_references" ? "reference_id,career_decision_context_revision_id,context_evidence_ref" : table === "career_decision_context_decision_classes" ? "reference_id,career_decision_context_revision_id,decision_class" : "reference_id,career_decision_context_revision_id,subject_kind";
      const values = table === "career_decision_context_subjects" ? `'${value.careerDecisionContextRevisionId}:${kind}:extra','${value.careerDecisionContextRevisionId}','${proposal.recommendationProposalId}',0` : table === "career_decision_context_evidence_references" ? `'${value.careerDecisionContextRevisionId}:${kind}:extra','${value.careerDecisionContextRevisionId}','evidence://extra'` : table === "career_decision_context_decision_classes" ? `'${value.careerDecisionContextRevisionId}:${kind}:extra','${value.careerDecisionContextRevisionId}','REJECT_RECOMMENDATION'` : `'${value.careerDecisionContextRevisionId}:${kind}:extra','${value.careerDecisionContextRevisionId}','RCP_ITEM'`;
      await rollback(async transaction => { await transaction.execute(drizzleSql.raw(`INSERT INTO ${table}(${columns}) VALUES(${values})`)); await invalid(transaction); });
    }
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO career_decision_context_evidence_references(reference_id,career_decision_context_revision_id,context_evidence_ref) VALUES(${`${value.careerDecisionContextRevisionId}:evidence:duplicate`},${value.careerDecisionContextRevisionId},${value.contextEvidenceRefs[0]})`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO career_decision_context_decision_classes(reference_id,career_decision_context_revision_id,decision_class) VALUES(${`${value.careerDecisionContextRevisionId}:class:duplicate`},${value.careerDecisionContextRevisionId},${value.permittedDecisionClasses[0]})`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`UPDATE career_decision_context_subjects SET recommendation_proposal_id=${foreignProposalId} WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`DELETE FROM decision_authority_grant_decision_classes WHERE decision_authority_grant_revision_id=${authority.decisionAuthorityGrantRevisionId}`); await invalid(transaction); });
    await expect(repository.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId)).resolves.toEqual(value); await sql.end({ timeout: 5 }); clients.delete(sql);
  });

  it("atomically rolls back root plus every child inventory and permits a clean retry", async () => {
    const { sql, db } = await client(); await seedRcp(db); const authorities = new PostgresDecisionAuthorityGrantRevisionRepository(db); const proposals = new InMemoryRecommendationProposalRepository(); await authorities.persistDecisionAuthorityGrantRevision(authority); await proposals.persistRecommendationProposal(proposal);
    for (const table of ["career_decision_context_subjects", "career_decision_context_evidence_references", "career_decision_context_decision_classes", "career_decision_context_subject_kinds"]) {
      const value = createCareerDecisionContextRevision(authority, proposal, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: proposal.recommendationProposalId, decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }], contextEvidenceRefs: [`evidence://atomic/${table}`], createdAt: stamp }); const repository = new PostgresCareerDecisionContextRevisionRepository(db, authorities, proposals); const suffix = randomBytes(4).toString("hex"); const fn = `reject_${suffix}`, trigger = `trigger_${suffix}`;
      await sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected child failure'; END; $$`); await sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(repository.persistCareerDecisionContextRevision(value)).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED"); expect(Number((await sql`SELECT count(*)::int AS count FROM career_decision_context_revisions WHERE career_decision_context_revision_id=${value.careerDecisionContextRevisionId}`)[0].count)).toBe(0);
      await sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`); await sql.unsafe(`DROP FUNCTION ${fn}()`); await expect(repository.persistCareerDecisionContextRevision(value)).resolves.toEqual(value);
    }
    await sql.end({ timeout: 5 }); clients.delete(sql);
  });
});
