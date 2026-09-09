import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as core from "../../../../lib/career/capability-core";
import * as verification from "../../../../lib/career/capability-core/verification";
import { PostgresCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../../lib/career/capability-core";
import { careerCapabilityRuns, careerCapabilitySnapshots } from "../../../../lib/career/db/schema";
import { PostgresCapabilityRequirementRelationRepository } from "../../../../lib/career/relation-adapters/capability-requirement-persistence";
import { capabilityRequirementRelationEvaluationResults, capabilityRequirementRelationEvaluationRuns, capabilityRequirementRelationRawProviderOutputs, capabilityRequirementRelations } from "../../../../lib/career/relation-adapters/capability-requirement-persistence/postgres-schema";
import { PostgresRequirementInventoryRepository } from "../../../../lib/career/relation-adapters/requirement-inventory-persistence";
import { requirementRelationAggregateFailedResults, requirementRelationAggregateMaterializedRelations, requirementRelationAggregateNotEvaluatedPairs, requirementRelationAggregates, targetRoleRequirementInventories } from "../../../../lib/career/relation-adapters/requirement-inventory-persistence/postgres-schema";
import { PostgresTargetOrganizationRevisionRepository } from "../../../../lib/career/target-adapters/organization-revision-persistence";
import { targetOrganizationRevisions } from "../../../../lib/career/target-adapters/organization-revision-persistence/postgres-schema";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence";
import { targetRoleOrganizationBindingRevisions } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence/postgres-schema";
import { PostgresTargetRoleProfileRevisionRepository } from "../../../../lib/career/target-adapters/role-profile-revision-persistence";
import { targetRoleProfileRevisions } from "../../../../lib/career/target-adapters/role-profile-revision-persistence/postgres-schema";
import { PostgresTargetRequirementRevisionRepository } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence";
import { targetRequirementRevisions } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence/postgres-schema";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import { targetRoleSourceBindingRevisions } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence/postgres-schema";
import { PostgresTargetSourceRevisionRepository } from "../../../../lib/career/target-adapters/source-revision-persistence";
import { targetSourceRevisions } from "../../../../lib/career/target-adapters/source-revision-persistence/postgres-schema";
import { produceCapabilityRequirementRelation, type CapabilityRequirementRelationProducerDependencies } from "../../../../lib/career/relation/capability-requirement";
import { buildTargetRoleRequirementInventory, byteReplayRequirementRelationAggregate, byteReplayTargetRoleRequirementInventory, derivationReplayRequirementRelationAggregate, derivationReplayTargetRoleRequirementInventory, discoverRequirementRelationAggregate, semanticReplayRequirementRelationAggregate, semanticReplayTargetRoleRequirementInventory, type T6BPairRepository } from "../../../../lib/career/relation/requirement-inventory";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import { createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision } from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createTargetSourceRevision } from "../../../../lib/career/target/source";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `requirement_inventory_t7a_seal_${randomBytes(8).toString("hex")}`;
const stamp = "2026-10-06T00:00:00.000Z";
const protocol = { relationProducerVersion: "relation-v1", requirementAdmissionPolicyVersion: "admission-v1", semanticPolicyVersion: "semantic-v1", levelPolicyVersion: "level-v1", scopePolicyVersion: "scope-v1", evidencePolicyVersion: "evidence-v1" };
const lineage = { ...protocol, promptChecksum: "prompt-v1", provider: "bounded-fake", model: "model-v1", outputSchemaVersion: "output-v1" };
let admin: Sql;
const clients = new Set<Sql>();
const configs = [careerCapabilityRuns, careerCapabilitySnapshots, targetSourceRevisions, targetOrganizationRevisions, targetRoleSourceBindingRevisions, targetRoleOrganizationBindingRevisions, targetRoleProfileRevisions, targetRequirementRevisions, capabilityRequirementRelationRawProviderOutputs, capabilityRequirementRelationEvaluationRuns, capabilityRequirementRelationEvaluationResults, capabilityRequirementRelations, targetRoleRequirementInventories, requirementRelationAggregates, requirementRelationAggregateMaterializedRelations, requirementRelationAggregateFailedResults, requirementRelationAggregateNotEvaluatedPairs].map(getTableConfig);
const quote = (value: string) => `"${value}"`;
const ddl = (config: typeof configs[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[
  ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
  ...config.foreignKeys.map(foreignKey => { const reference = foreignKey.reference(); return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(foreignKey.onDelete ?? "no action").toUpperCase()}`; }),
].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };
const close = async (sql: Sql) => { await sql.end({ timeout: 5 }); clients.delete(sql); };

beforeAll(async () => { admin = postgres(url, { max: 1, onnotice: () => undefined }); await admin.unsafe(`CREATE SCHEMA "${schema}"`); for (const config of configs) await admin.unsafe(ddl(config)); });
afterAll(async () => { await Promise.all([...clients].map(sql => sql.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

type CapabilityDb = NonNullable<ConstructorParameters<typeof PostgresCapabilityCoreRepository>[0]>;

function runtime(db: PostgresJsDatabase) {
  const source = new PostgresTargetSourceRevisionRepository(db);
  const organization = new PostgresTargetOrganizationRevisionRepository(db);
  const roleSource = new PostgresTargetRoleSourceBindingRevisionRepository(db, { getTargetSourceRevisionById: source.getRevisionById.bind(source) });
  const binding = new PostgresTargetRoleOrganizationBindingRevisionRepository(db, { getTargetRoleSourceBindingRevisionById: roleSource.getRevisionById.bind(roleSource), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const profile = new PostgresTargetRoleProfileRevisionRepository(db, { getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const requirement = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: profile.getRevisionById.bind(profile), getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  return { source, organization, roleSource, binding, profile, requirement, capability: new PostgresCapabilityCoreRepository(db as unknown as CapabilityDb), relations: new PostgresCapabilityRequirementRelationRepository(db), inventories: new PostgresRequirementInventoryRepository(db) };
}

/** Builds the canonical Phase-4 fixture shape with three distinct canonical capabilities in one snapshot. */
function createThreeCapabilityPhase4Input(key: string): verification.CapabilityVerificationIntegrityInput {
  createPhase4Input(`${key}_CANONICAL_FIXTURE`); // retain the canonical fixture as the source contract for this concrete composition variant.
  const names = ["TypeScript", "PostgreSQL", "Distributed systems"];
  const sourceDocuments = [core.createSourceDocument({ docId: `DOC_${key}`, title: `Document ${key}`, rawContent: names.map(name => `Proof ${key} ${name}`).join("\n") })];
  const capabilities = names.map(name => ({ canonical_name: name, capability_scope: "ATOMIC" as const, structural_definition: `${name} capability`, primary_domain: "engineering", demonstrated_capability_level: null, model_confidence: 0.9, evidence_mode: "EXPLICIT" as const, evidence: [{ source_document: `DOC_${key}`, location: "source", exact_quote: `Proof ${key} ${name}` }] }));
  const kernelOutput: core.CapabilityKernelOutput = { kernel_version: "discovery-v1", capabilities, coverage_audit: { source_documents_examined: 1, capability_count: 3, atomic_capability_count: 3, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 } };
  const sourceBundleHash = core.computeSourceBundleHash(sourceDocuments);
  const discoveryRunId = core.buildCapabilityDiscoveryRunId({ sourceBundleHash, kernelVersion: "discovery-v1", promptChecksum: "discovery-prompt", provider: "provider", model: "discovery-model", schemaVersion: "discovery-schema" });
  const candidates = kernelOutput.capabilities.map(item => core.verifyCandidateEvidence(core.createCapabilityCandidate(discoveryRunId, item), sourceDocuments));
  const discoveryRun: core.CapabilityDiscoveryRun = { runId: discoveryRunId, sourceBundleHash, kernelVersion: "discovery-v1", prompt: { checksum: "discovery-prompt" }, inference: { provider: "provider", model: "discovery-model" }, schemaVersion: "discovery-schema", status: "COMPLETED", rawOutputHash: core.sha256Utf8(core.stableJsonStringify(kernelOutput)), payload: { kernelOutput, candidates, coverageValidation: { status: "PASSED" } }, createdAt: stamp, completedAt: stamp };
  const convergenceOutput = core.validateCapabilityConvergenceOutput({ convergence_version: "convergence-v1", groups: candidates.map((candidate, index) => ({ group_key: `group-${index}`, member_candidate_ids: [candidate.candidateId], canonical_name: names[index], capability_scope: "ATOMIC", structural_definition: `${names[index]} capability`, primary_domain: "engineering" })), relations: [], reconciliation_audit: { input_candidate_count: 3, grouped_candidate_count: 3, group_count: 3, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } }, candidates);
  const canonical = core.canonicalizeCapabilityConvergence(convergenceOutput, candidates, stamp);
  const convergenceRunId = core.buildCapabilityConvergenceRunId({ discoveryRunId, discoveryRawOutputHash: discoveryRun.rawOutputHash!, kernelVersion: "convergence-v1", promptChecksum: "convergence-prompt", provider: "provider", model: "convergence-model", schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm" });
  const convergenceRun: core.CapabilityConvergenceRun = { runKind: "CAPABILITY_CONVERGENCE", convergenceRunId, discoveryRunId, discoveryRawOutputHash: discoveryRun.rawOutputHash!, sourceBundleHash, kernelVersion: "convergence-v1", prompt: { checksum: "convergence-prompt" }, inference: { provider: "provider", model: "convergence-model" }, schemaVersion: "convergence-schema", algorithmVersion: "convergence-algorithm", status: "COMPLETED", rawOutputHash: core.sha256Utf8(core.stableConvergenceJsonStringify(convergenceOutput)), payload: { convergenceOutput, canonicalDrafts: canonical.canonicalDrafts, proposedRelations: canonical.proposedRelations, eligibleCandidateIds: candidates.map(candidate => candidate.candidateId).sort(), excludedCandidateIds: [], reconciliation: { status: "PASSED" } }, createdAt: stamp, completedAt: stamp };
  const payload = verification.canonicalizeCapabilityVerificationPayload({ semanticDefinitionOutcomes: canonical.canonicalDrafts.map(draft => ({ provisionalCapabilityId: draft.provisionalCapabilityId, status: "PASSED" })), demonstratedLevelOutcomes: canonical.canonicalDrafts.map(draft => ({ provisionalCapabilityId: draft.provisionalCapabilityId, status: "UNVERIFIED", demonstratedCapabilityLevel: null })), relationDispositions: [], publicationEligibility: "ELIGIBLE" });
  const verificationRun: verification.CapabilityVerificationRun = { runKind: "CAPABILITY_VERIFICATION", verificationRunId: "", convergenceRunId, convergenceRawOutputHash: convergenceRun.rawOutputHash, sourceEvidenceRepresentationHash: verification.computeSourceEvidenceRepresentationHash(sourceDocuments), sourceBundleHash, kernelVersion: "verification-v1", promptChecksum: "verification-prompt", inference: { provider: "provider", model: "verification-model" }, schemaVersion: "verification-schema", algorithmVersion: "verification-algorithm", snapshotSchemaVersion: "snapshot-schema", rawOutputHash: verification.computeCapabilityVerificationRawOutputHash(payload), status: "COMPLETED", payload, createdAt: stamp, completedAt: stamp };
  verificationRun.verificationRunId = verification.buildCapabilityVerificationRunId({ convergenceRunId, convergenceRawOutputHash: verificationRun.convergenceRawOutputHash, sourceEvidenceRepresentationHash: verificationRun.sourceEvidenceRepresentationHash, kernelVersion: verificationRun.kernelVersion, promptChecksum: verificationRun.promptChecksum, provider: verificationRun.inference.provider, model: verificationRun.inference.model, schemaVersion: verificationRun.schemaVersion, algorithmVersion: verificationRun.algorithmVersion, snapshotSchemaVersion: verificationRun.snapshotSchemaVersion });
  return { sourceDocuments, discoveryRun, convergenceRun, verificationRun };
}

async function seed(db: PostgresJsDatabase) {
  const r = runtime(db);
  const source = createTargetSourceRevision({ targetSourceEntityId: "SOURCE_T7A_SEAL", previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: "source://t7a-seal", rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: "TypeScript PostgreSQL Distributed systems", normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_T7A_SEAL", previousRevisionId: null, organizationDescriptor: "Org", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  await r.source.createTargetSourceRevisionPersister().persist(source); await r.organization.createTargetOrganizationRevisionPersister().persist(organization);
  const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: "ROLE_T7A_SEAL", targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp }); await r.roleSource.createTargetRoleSourceBindingRevisionPersister().persist(roleSource);
  const binding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: "ROLE_T7A_SEAL", targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp }); await r.binding.createTargetRoleOrganizationBindingRevisionPersister().persist(binding);
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: "ROLE_T7A_SEAL", targetRoleOrganizationBindingRevisionId: binding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: "Platform role", responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp }); await r.profile.createTargetRoleProfileRevisionPersister().persist(profile);
  const requirement = (entity: string, previous: string | null, statement: string, necessity: "REQUIRED" | "OPTIONAL" | "PREFERRED", type: "CAPABILITY" | "RESPONSIBILITY") => createTargetRequirementRevision({ targetRequirementEntityId: entity, targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, previousRevisionId: previous, requirement: { normalizedStatement: statement, requirementType: type, capabilityExpression: type === "CAPABILITY" ? statement : null, structuralDefinition: type === "CAPABILITY" ? `${statement} capability` : null, requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: necessity }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: statement }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp });
  const required = requirement("REQ_T7A_REQUIRED", null, "TypeScript", "REQUIRED", "CAPABILITY");
  const optional = requirement("REQ_T7A_OPTIONAL", null, "PostgreSQL", "OPTIONAL", "CAPABILITY");
  const nonDirect = requirement("REQ_T7A_NON_DIRECT", null, "Design platform responsibilities", "PREFERRED", "RESPONSIBILITY");
  const unresolvedFirst = requirement("REQ_T7A_UNRESOLVED", null, "Distributed systems", "PREFERRED", "CAPABILITY");
  const unresolvedSecond = requirement("REQ_T7A_UNRESOLVED", unresolvedFirst.targetRequirementRevisionId, "Distributed systems revision", "PREFERRED", "CAPABILITY");
  for (const item of [required, optional, nonDirect, unresolvedFirst, unresolvedSecond]) await r.requirement.createTargetRequirementRevisionPersister().persist(item);
  return { r, profile, required, optional, nonDirect, unresolvedFirst, unresolvedSecond };
}

const implementations = { resolveRequirementInventoryPolicy: (version: string) => version === "inventory-v1" ? { version } : null, resolvePairInventoryPolicy: (version: string) => version === "pair-v1" ? { version } : null, resolveCompositionPolicy: (version: string) => version === "composition-v1" ? { version } : null };

describe("T7A concrete PostgreSQL process-restart composition seal", () => {
  it("persists canonical concrete composition and replays it after a fresh repository restart without providers", async () => {
    const first = await client(); const seeded = await seed(first.db); const phase4 = createThreeCapabilityPhase4Input("T7A_SEAL"); verification.assertPersistableCapabilityVerificationRun(phase4.verificationRun);
    await seeded.r.capability.saveRun(phase4.discoveryRun); await seeded.r.capability.saveConvergenceRun(phase4.convergenceRun); await seeded.r.capability.saveVerificationRun(phase4.verificationRun);
    const snapshot = await seeded.r.capability.createVerifiedCapabilitySnapshotPublisher().publish(phase4);
    expect(snapshot.capabilities).toHaveLength(3);
    const operands = await Promise.all(snapshot.capabilities.map(capability => deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: capability.capabilityId }, seeded.r.capability)));
    const calls = { value: 0 };
    const policies: Pick<CapabilityRequirementRelationProducerDependencies, "levelPolicy" | "evidencePolicy" | "scopePolicy" | "now"> = { levelPolicy: { version: "level-v1", mapTargetCapabilityLevel: () => null }, evidencePolicy: { version: "evidence-v1", assess: ({ proposed }) => proposed }, scopePolicy: { version: "scope-v1", assess: ({ proposed }) => proposed }, now: () => stamp };
    const materializedDependencies: CapabilityRequirementRelationProducerDependencies = { repository: seeded.r.relations, lineage, ...policies, provider: { execute: async () => { calls.value++; return { rawOutput: "materialized terminal", evaluation: { candidateCapabilityOperandId: operands[0].candidateCapabilityOperandId, targetRequirementRevisionId: seeded.required.targetRequirementRevisionId, semanticRelation: "SEMANTIC_EQUIVALENT", evidenceAssessment: "EVIDENCE_SUFFICIENT", scopeAssessment: "SCOPE_NOT_APPLICABLE", evidenceBasis: { candidateEvidenceIds: [operands[0].source.evidenceIds[0]], targetRequirementEvidenceQuotes: [seeded.required.evidence[0].exactQuote] } } }; } } };
    const materialized = await produceCapabilityRequirementRelation(operands[0], seeded.required, materializedDependencies);
    const failedDependencies: CapabilityRequirementRelationProducerDependencies = { repository: seeded.r.relations, lineage, ...policies, provider: { execute: async () => { calls.value++; throw new Error("canonical producer failure"); } } };
    await expect(produceCapabilityRequirementRelation(operands[1], seeded.required, failedDependencies)).rejects.toThrow("PRODUCER_FAILED");
    expect(calls.value).toBe(2);
    const inventory = await buildTargetRoleRequirementInventory({ targetRoleProfileRevisionId: seeded.profile.targetRoleProfileRevisionId, requirementInventoryPolicyVersion: "inventory-v1", createdAt: stamp }, { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: seeded.r.requirement.listTargetRequirementRevisionsByTargetRoleProfileRevisionId.bind(seeded.r.requirement) });
    const aggregate = await discoverRequirementRelationAggregate({ inventory, verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRequirementEntityId: seeded.required.targetRequirementEntityId, targetRequirementRevisionId: seeded.required.targetRequirementRevisionId, candidateCapabilityOperandIds: operands.map(operand => operand.candidateCapabilityOperandId), t6bProtocol: protocol, pairInventoryPolicyVersion: "pair-v1", compositionPolicyVersion: "composition-v1", createdAt: stamp }, seeded.r.relations);
    await seeded.r.inventories.persistInventory(inventory); await seeded.r.inventories.persistAggregate(aggregate);
    expect(inventory.targetRoleRequirementInventoryId).toMatch(/^TRQINV_/); expect(aggregate.requirementRelationAggregateId).toMatch(/^RRA_/);
    expect(inventory.requirementGroups).toEqual(expect.arrayContaining([expect.objectContaining({ targetRequirementEntityId: seeded.required.targetRequirementEntityId, revisionDisposition: "SINGLE_REVISION", directRelationAdmission: "DIRECT_CAPABILITY_REQUIREMENT", necessityStates: [expect.objectContaining({ necessityState: "REQUIRED" })] }), expect.objectContaining({ targetRequirementEntityId: seeded.optional.targetRequirementEntityId, directRelationAdmission: "DIRECT_CAPABILITY_REQUIREMENT", necessityStates: [expect.objectContaining({ necessityState: "OPTIONAL" })] }), expect.objectContaining({ targetRequirementEntityId: seeded.nonDirect.targetRequirementEntityId, directRelationAdmission: "TARGET_REQUIREMENT_TYPE_NOT_DIRECT_CAPABILITY" }), expect.objectContaining({ targetRequirementEntityId: seeded.unresolvedFirst.targetRequirementEntityId, revisionDisposition: "MULTIPLE_REVISIONS_UNRESOLVED" })]));
    expect(inventory.failureReasons).toEqual(["REQUIREMENT_REVISION_BRANCH_UNRESOLVED"]);
    expect(aggregate.pairDispositions.map(pair => pair.disposition).sort()).toEqual(["EVALUATION_FAILED", "MATERIALIZED_RELATION", "NOT_EVALUATED"]);
    expect(aggregate.pairDispositions).toEqual(expect.arrayContaining([expect.objectContaining({ candidateCapabilityOperandId: operands[0].candidateCapabilityOperandId, disposition: "MATERIALIZED_RELATION", capabilityRequirementRelationId: materialized.capabilityRequirementRelationId }), expect.objectContaining({ candidateCapabilityOperandId: operands[1].candidateCapabilityOperandId, disposition: "EVALUATION_FAILED" }), expect.objectContaining({ candidateCapabilityOperandId: operands[2].candidateCapabilityOperandId, disposition: "NOT_EVALUATED" })]));
    expect(aggregate.semanticRelationInventory.SEMANTIC_EQUIVALENT.count).toBe(1); expect(aggregate.levelRelationInventory.LEVEL_NOT_APPLICABLE.count).toBe(1); expect(aggregate.evidenceSufficiencyInventory.EVIDENCE_SUFFICIENT.count).toBe(1); expect(aggregate.scopeRelationInventory.SCOPE_NOT_APPLICABLE.count).toBe(1);
    expect(aggregate.composition.state).toBe("COMPOSITION_NOT_EVALUATED"); expect(aggregate.proposalState).toBe("PROPOSAL_ONLY"); expect(aggregate.authorityState).toBe("NONE"); expect(calls.value).toBe(2);
    const ids = { inventory: inventory.targetRoleRequirementInventoryId, aggregate: aggregate.requirementRelationAggregateId, snapshot: snapshot.snapshotId };
    await close(first.sql);

    const second = await client(); const restarted = runtime(second.db);
    const replay = { repository: restarted.inventories, requirements: { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: restarted.requirement.listTargetRequirementRevisionsByTargetRoleProfileRevisionId.bind(restarted.requirement) }, getTargetRoleProfileRevisionById: restarted.profile.getRevisionById.bind(restarted.profile), candidateRepository: restarted.capability, t6b: restarted.relations, implementations };
    const durableInventory = await restarted.inventories.getInventoryById(ids.inventory); const durableAggregate = await restarted.inventories.getAggregateById(ids.aggregate);
    expect(durableInventory).toEqual(inventory); expect(durableAggregate).toEqual(aggregate);
    const replayedSnapshot = await restarted.capability.getSnapshotById(ids.snapshot); expect(replayedSnapshot?.capabilities).toHaveLength(3);
    const replayedOperands = await Promise.all(replayedSnapshot!.capabilities.map(capability => deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: ids.snapshot, capabilityId: capability.capabilityId }, restarted.capability)));
    expect(replayedOperands.map(operand => operand.candidateCapabilityOperandId).sort()).toEqual(operands.map(operand => operand.candidateCapabilityOperandId).sort());
    await expect(byteReplayTargetRoleRequirementInventory(ids.inventory, restarted.inventories)).resolves.toEqual(inventory);
    await expect(byteReplayRequirementRelationAggregate(ids.aggregate, restarted.inventories)).resolves.toEqual(aggregate);
    await expect(semanticReplayTargetRoleRequirementInventory(ids.inventory, restarted.inventories)).resolves.toEqual(inventory);
    await expect(semanticReplayRequirementRelationAggregate(ids.aggregate, { repository: restarted.inventories, t6b: restarted.relations })).resolves.toEqual(aggregate);
    await expect(derivationReplayTargetRoleRequirementInventory(ids.inventory, replay)).resolves.toEqual(inventory);
    await expect(derivationReplayRequirementRelationAggregate(ids.aggregate, replay)).resolves.toEqual(aggregate);
    expect(calls.value).toBe(2);

    await expect(derivationReplayRequirementRelationAggregate(ids.aggregate, { ...replay, implementations: { ...implementations, resolveCompositionPolicy: () => null } })).rejects.toThrow("PINNED_VERSION_UNAVAILABLE");
    const changedTerminal: T6BPairRepository = { getRelationById: restarted.relations.getRelationById.bind(restarted.relations), getResultById: restarted.relations.getResultById.bind(restarted.relations), getRunById: restarted.relations.getRunById.bind(restarted.relations), discoverPairTerminal: async (input) => input.candidateCapabilityOperandId === operands[0].candidateCapabilityOperandId ? { disposition: "NOT_EVALUATED" as const } : restarted.relations.discoverPairTerminal(input) };
    await expect(derivationReplayRequirementRelationAggregate(ids.aggregate, { ...replay, t6b: changedTerminal })).rejects.toThrow("DERIVATION_REPLAY_MISMATCH");
    await second.db.transaction(async tx => { const transaction = runtime(tx as unknown as PostgresJsDatabase); await tx.execute(drizzleSql`UPDATE target_role_requirement_inventories SET payload = jsonb_set(payload, '{targetRoleProfileRevisionId}', '"corrupt"'::jsonb) WHERE target_role_requirement_inventory_id = ${ids.inventory}`); await expect(transaction.inventories.getInventoryById(ids.inventory)).rejects.toThrow("PERSISTENCE_INVALID"); throw new Error("rollback inventory corruption"); }).catch(error => { if (error.message !== "rollback inventory corruption") throw error; });
    await second.db.transaction(async tx => { const transaction = runtime(tx as unknown as PostgresJsDatabase); await tx.execute(drizzleSql`DELETE FROM requirement_relation_aggregate_not_evaluated_pairs WHERE requirement_relation_aggregate_id = ${ids.aggregate}`); await expect(transaction.inventories.getAggregateById(ids.aggregate)).rejects.toThrow("PERSISTENCE_INVALID"); throw new Error("rollback physical aggregate corruption"); }).catch(error => { if (error.message !== "rollback physical aggregate corruption") throw error; });
    const materializedPairIndex = aggregate.pairDispositions.findIndex(pair => pair.disposition === "MATERIALIZED_RELATION");
    await second.db.transaction(async tx => { const transaction = runtime(tx as unknown as PostgresJsDatabase); await tx.execute(drizzleSql`UPDATE requirement_relation_aggregates SET payload = jsonb_set(payload, ARRAY['pairDispositions', ${materializedPairIndex.toString()}, 'capabilityRequirementRelationId'], '"CRREL_MISSING"'::jsonb) WHERE requirement_relation_aggregate_id = ${ids.aggregate}`); await expect(transaction.inventories.getAggregateById(ids.aggregate)).rejects.toThrow("PERSISTENCE_INVALID"); throw new Error("rollback wrong normalized T6B reference"); }).catch(error => { if (error.message !== "rollback wrong normalized T6B reference") throw error; });
    expect(calls.value).toBe(2); await close(second.sql);
  });
});
