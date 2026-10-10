import { requireTestDatabaseUrl, DISPOSABLE_TEST_DATABASE_PATTERN } from "../../lib/database-isolation/policy";
import { createDisposableTestDatabaseNamed, dropDisposableTestDatabase, newDisposableTestDatabaseName } from "../../lib/database-isolation/verification";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createBoundAuthoritativeStateReader,
  createDecisionContextDraft,
  createDecisionContextObservationProposal,
  createOutcomeAttributionProposal,
  createStateChangeClaim,
  type AuthoritativeStateReference,
  type DecisionContextDraftInput
} from "../../lib/decision-core";
import {
  CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
  CAPABILITY_CORE_PRODUCER_ID,
  createCapabilityCoreAuthoritativeStateResolver
} from "../../lib/decision-adapters/capability-core";
import {
  CAREER_CANONICAL_FAMILIES,
  CAREER_CANONICAL_FAMILY_ORDER,
  CAREER_CANONICAL_NON_RESOLVABLE_PREFIXES,
  CAREER_CANONICAL_PRODUCER_ID,
  careerCanonicalArtifactIdPattern,
  careerCanonicalItemLocator,
  createCareerCanonicalAuthoritativeStateResolvers,
  createRecommendationProposalAuthoritativeStateResolver,
  type CareerCanonicalFamily,
  type CareerCanonicalProducerRepositories
} from "../../lib/decision-adapters/career-canonical";
import { buildHrDecisionContextDraftInput } from "../../lib/hr-decision-context";
import { computeSnapshotKey } from "../../lib/career/capability-core";
import { createCareerCanonicalLocalFixture, type CareerCanonicalLocalFixture } from "./fixtures/career-canonical-local-fixture";
import { exactRead, stubRepositories } from "./fixtures/stub-repositories";
import { provisionCareerChainSchema, seedCareerCanonicalChain, type SeededCareerCanonicalChain } from "./fixtures/postgres-career-chain";

/**
 * Executable index of docs/architecture/decision-fields/VERTICAL_INTEGRATION_PROOF.md.
 * Stages owned by integration/g2-producer-adapters (P1, P2, P3, P5, P8) are real tests.
 * Stages owned by integration/g3-decision-context-binding (P0, P4, P6, P7) stay todo here.
 */

const SEAL_TAG = "v1.0.0-decision-core-phase8e2-occurrence-return-binding";
const hex = (length: number, fill = "A") => fill.repeat(length);
const reference = (family: CareerCanonicalFamily, artifactId: string, locator = artifactId): AuthoritativeStateReference => ({
  producerId: CAREER_CANONICAL_PRODUCER_ID,
  authorityContractId: CAREER_CANONICAL_FAMILIES[family].authorityContractId,
  artifactId,
  locator
});

const record = (value: object): Record<string, unknown> => value as Record<string, unknown>;

type FamilyCase = {
  family: CareerCanonicalFamily;
  repository: keyof CareerCanonicalProducerRepositories;
  method: string;
  artifact: (fixture: CareerCanonicalLocalFixture) => Record<string, unknown>;
  notFoundCode: string | null;
  invalidCode: string;
};

const familyCases: readonly FamilyCase[] = [
  { family: "RCP", repository: "recommendationProposals", method: "getRecommendationProposalById", artifact: (f) => record(f.recommendationProposal), notFoundCode: null, invalidCode: "ERR_RECOMMENDATION_PROPOSAL_PERSISTENCE_FAILED" },
  { family: "EIS", repository: "evolutionInputStates", method: "getEvolutionInputStateById", artifact: (f) => record(f.evolutionInputState), notFoundCode: null, invalidCode: "ERR_EVOLUTION_INPUT_PERSISTENCE_FAILED" },
  { family: "TSN", repository: "tensionStates", method: "getTensionStateById", artifact: (f) => record(f.tensionState), notFoundCode: null, invalidCode: "ERR_TENSION_STATE_PERSISTENCE_FAILED" },
  { family: "RRL", repository: "roleRelations", method: "getRoleRelationById", artifact: (f) => record(f.roleRelation), notFoundCode: null, invalidCode: "ERR_ROLE_RELATION_PERSISTENCE_INVALID" },
  { family: "TRQREV", repository: "targetRequirementRevisions", method: "getRevisionById", artifact: (f) => record(f.requirementA), notFoundCode: null, invalidCode: "ERR_TARGET_REQUIREMENT_REVISION_POSTGRES_RECORD_INVALID" },
  { family: "TRPREV", repository: "targetRoleProfileRevisions", method: "getRevisionById", artifact: (f) => record(f.profile), notFoundCode: null, invalidCode: "ERR_TARGET_ROLE_PROFILE_REVISION_POSTGRES_RECORD_INVALID" },
  { family: "TOREV", repository: "targetOrganizationRevisions", method: "getRevisionById", artifact: (f) => record(f.organization), notFoundCode: null, invalidCode: "ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID" },
  { family: "ORL", repository: "organizationRelations", method: "getOrganizationRelationById", artifact: (f) => record(f.organizationRelation), notFoundCode: null, invalidCode: "ERR_ORGANIZATION_RELATION_PERSISTENCE_INVALID" },
  { family: "CRRES", repository: "capabilityRequirementRelations", method: "getResultById", artifact: (f) => record(f.evaluationResult), notFoundCode: "ERR_CAPABILITY_REQUIREMENT_RELATION_RESULT_NOT_FOUND", invalidCode: "ERR_CAPABILITY_REQUIREMENT_RELATION_PERSISTENCE_INVALID" },
  { family: "AOC", repository: "actionOccurrences", method: "getCareerActionOccurrenceById", artifact: (f) => record(f.actionOccurrence), notFoundCode: "ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND", invalidCode: "ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED" },
  { family: "SCD", repository: "stateChangeDeclarations", method: "getCareerStateChangeDeclarationById", artifact: (f) => record(f.stateChangeDeclaration), notFoundCode: "ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND", invalidCode: "ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED" },
  { family: "ASCAD", repository: "actionStateChangeAssociationDeclarations", method: "getCareerActionStateChangeAssociationDeclarationById", artifact: (f) => record(f.associationDeclaration), notFoundCode: "ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND", invalidCode: "ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED" },
  { family: "CORD", repository: "outcomeRoleDeclarations", method: "getCareerOutcomeRoleDeclarationById", artifact: (f) => record(f.outcomeRoleDeclaration), notFoundCode: "ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND", invalidCode: "ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED" },
  { family: "COVD", repository: "outcomeValenceDeclarations", method: "getCareerOutcomeValenceDeclarationById", artifact: (f) => record(f.outcomeValenceDeclaration), notFoundCode: "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND", invalidCode: "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED" },
  { family: "COVFCR", repository: "outcomeValenceFeedbackContextRevisions", method: "getCareerOutcomeValenceFeedbackContextRevisionById", artifact: (f) => record(f.feedbackContextRevision), notFoundCode: null, invalidCode: "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED" }
];

let fixture: CareerCanonicalLocalFixture;
beforeAll(async () => { fixture = await createCareerCanonicalLocalFixture("P1"); }, 30_000);

/** A reader over the full family where exactly one family's read is replaced by `read`. */
function readerWith(family: CareerCanonicalFamily, repository: keyof CareerCanonicalProducerRepositories, method: string, read: (id: string) => Promise<unknown>) {
  const repositories = stubRepositories(fixture) as unknown as Record<string, Record<string, unknown>>;
  repositories[repository] = { [method]: read };
  const resolvers = createCareerCanonicalAuthoritativeStateResolvers(repositories as unknown as CareerCanonicalProducerRepositories);
  return { reader: createBoundAuthoritativeStateReader(resolvers), resolver: resolvers[CAREER_CANONICAL_FAMILY_ORDER.indexOf(family)] };
}

describe("G2/G3 vertical integration proof", () => {
  describe("P0 provisioning order", () => {
    it("is proven in hr-decision-loop-postgres.test.ts (unified registration, post-decision chain, no cross-field FK)", () => {
      const source = readFileSync(resolve(process.cwd(), "test/decision-integration/hr-decision-loop-postgres.test.ts"), "utf8");
      expect(source).toContain("P0 integrated registration including the post-decision chain (R7)");
    });
  });

  describe("P1 resolver local proof per G3 family", () => {
    for (const { family, repository, method, artifact, notFoundCode, invalidCode } of familyCases) {
      const idField = CAREER_CANONICAL_FAMILIES[family].idField;

      it(`${family}: accepts persisted exact artifact as a detached clone`, async () => {
        const stored = artifact(fixture);
        const artifactId = stored[idField] as string;
        expect(artifactId).toMatch(CAREER_CANONICAL_FAMILIES[family].artifactIdPattern);
        const read = exactRead(stored, idField);
        const { reader, resolver } = readerWith(family, repository, method, read);
        expect(resolver.producerId).toBe(CAREER_CANONICAL_PRODUCER_ID);
        expect(resolver.authorityContractId).toBe(CAREER_CANONICAL_FAMILIES[family].authorityContractId);
        const first = await reader.resolve(reference(family, artifactId));
        expect(first.payload).toEqual(stored);
        expect(first.payload).not.toBe(stored);
        expect(first.reference).toEqual(reference(family, artifactId));
        expect(read).toHaveBeenCalledWith(artifactId);
        (first.payload as Record<string, unknown>).createdAt = "caller mutation";
        (first.payload as Record<string, unknown>)[idField] = "caller mutation";
        const second = await reader.resolve(reference(family, artifactId));
        expect(second.payload).toEqual(stored);
      });

      it(`${family}: rejects missing, non-recomputing, mismatched, and foreign-pair references`, async () => {
        const stored = artifact(fixture);
        const artifactId = stored[idField] as string;
        const absent = readerWith(family, repository, method, async () => null).reader;
        await expect(absent.resolve(reference(family, artifactId))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
        if (notFoundCode !== null) {
          const throwing = readerWith(family, repository, method, async () => { throw new Error(notFoundCode); }).reader;
          await expect(throwing.resolve(reference(family, artifactId))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
        }

        const tampered = readerWith(family, repository, method, async () => ({ ...structuredClone(stored), schemaVersion: "TAMPERED" })).reader;
        await expect(tampered.resolve(reference(family, artifactId))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_INVALID");
        const repositoryInvalid = readerWith(family, repository, method, async () => { throw new Error(invalidCode); }).reader;
        await expect(repositoryInvalid.resolve(reference(family, artifactId))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_INVALID");
        const swapped = readerWith(family, repository, method, async () => { const copy = structuredClone(stored) as Record<string, unknown>; copy[idField] = `${CAREER_CANONICAL_FAMILIES[family].prefix}_${hex(32, "0")}`; return copy; }).reader;
        await expect(swapped.resolve(reference(family, `${CAREER_CANONICAL_FAMILIES[family].prefix}_${hex(32, "0")}`))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_INVALID");

        const { reader } = readerWith(family, repository, method, exactRead(stored, idField));
        await expect(reader.resolve(reference(family, `${CAREER_CANONICAL_FAMILIES[family].prefix}_${hex(31)}`))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        await expect(reader.resolve(reference(family, `${CAREER_CANONICAL_FAMILIES[family].prefix}_${hex(33)}`))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        await expect(reader.resolve(reference(family, artifactId.toLowerCase()))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        await expect(reader.resolve(reference(family, artifactId, "other-locator"))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        if (family === "RCP") {
          const items = (stored.items as unknown[]).length;
          await expect(reader.resolve(reference(family, artifactId, careerCanonicalItemLocator(artifactId, items - 1)))).resolves.toMatchObject({ payload: stored });
          await expect(reader.resolve(reference(family, artifactId, careerCanonicalItemLocator(artifactId, items)))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
          await expect(reader.resolve(reference(family, artifactId, `${artifactId}/items/01`))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
          await expect(reader.resolve(reference(family, artifactId, `${artifactId}/items/-1`))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        } else {
          await expect(reader.resolve(reference(family, artifactId, careerCanonicalItemLocator(artifactId, 0)))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        }

        const otherFamily = CAREER_CANONICAL_FAMILY_ORDER.find((candidate) => candidate !== family)!;
        await expect(reader.resolve({ ...reference(family, artifactId), authorityContractId: CAREER_CANONICAL_FAMILIES[otherFamily].authorityContractId })).rejects.toThrow(/ERR_DECISION_AUTHORITY_(RESOLVER_NOT_FOUND|ARTIFACT_REFERENCE_MISMATCH)/);
        await expect(reader.resolve({ ...reference(family, artifactId), producerId: CAPABILITY_CORE_PRODUCER_ID })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
        await expect(reader.resolve({ ...reference(family, artifactId), authorityContractId: `${CAREER_CANONICAL_FAMILIES[family].authorityContractId}_UPGRADED` })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
        const { resolver } = readerWith(family, repository, method, exactRead(stored, idField));
        await expect(resolver.resolve({ ...reference(family, artifactId), producerId: "OTHER" })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
      });

      it(`${family}: keeps the bound read live for append-only growth`, async () => {
        const stored = artifact(fixture);
        const artifactId = stored[idField] as string;
        const laterId = `${CAREER_CANONICAL_FAMILIES[family].prefix}_${hex(32, "B")}`;
        const rows = new Map<string, Record<string, unknown>>();
        let originalCalls = 0;
        let replacementCalls = 0;
        const repositoryObject: Record<string, unknown> = {
          rows,
          [method]: async function (this: { rows: Map<string, Record<string, unknown>> }, id: string) {
            originalCalls += 1;
            const found = this.rows.get(id);
            return found === undefined ? null : structuredClone(found);
          }
        };
        const repositories = stubRepositories(fixture) as unknown as Record<string, unknown>;
        repositories[repository] = repositoryObject;
        const bound = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(repositories as unknown as CareerCanonicalProducerRepositories));
        repositoryObject[method] = async () => { replacementCalls += 1; return null; };

        await expect(bound.resolve(reference(family, artifactId))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
        rows.set(artifactId, stored);
        await expect(bound.resolve(reference(family, artifactId))).resolves.toMatchObject({ payload: stored });
        await expect(bound.resolve(reference(family, laterId))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
        expect(originalCalls).toBe(3);
        expect(replacementCalls).toBe(0);
      });
    }

    it("CRREL has no resolver because its identity excludes the evaluation", () => {
      const resolvers = createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture));
      expect(resolvers).toHaveLength(CAREER_CANONICAL_FAMILY_ORDER.length);
      expect(resolvers.map((resolver) => resolver.authorityContractId).some((contractId) => /CAPABILITY_REQUIREMENT_RELATION_(PROPOSAL|IMMUTABLE|DECLARATION)/.test(contractId) && !contractId.includes("EVALUATION_RESULT"))).toBe(false);
      expect(CAREER_CANONICAL_NON_RESOLVABLE_PREFIXES).toContain("CRREL");
      expect(Object.values(CAREER_CANONICAL_FAMILIES).map((definition) => definition.prefix)).not.toContain("CRREL");
      const reader = createBoundAuthoritativeStateReader(resolvers);
      const crrel = `CRREL_${hex(32)}`;
      for (const family of CAREER_CANONICAL_FAMILY_ORDER) {
        expect(reader.resolve(reference(family, crrel))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
      }
    });

    it("every contract id names the artifact's own established state literally and never PHASE4_VERIFIED", () => {
      for (const definition of Object.values(CAREER_CANONICAL_FAMILIES)) {
        expect(definition.authorityContractId).toMatch(/^CAREER_[A-Z_]+_V1$/);
        expect(definition.authorityContractId).not.toContain("PHASE4");
        expect(definition.authorityContractId).not.toContain("VERIFIED");
        if (definition.establishedState.kind === "PROPOSAL") {
          expect(definition.authorityContractId).toContain(`_${definition.establishedState.proposalState}_`);
          expect(definition.authorityContractId).toContain(definition.establishedState.authorityState === "NONE" ? "_AUTHORITY_NONE_" : `_${definition.establishedState.authorityState}_`);
        } else {
          expect(definition.authorityContractId).toContain(definition.establishedState.kind === "DECLARATION" ? "_DECLARATION_" : "_IMMUTABLE_RECORD_");
        }
      }
      const artifacts: Record<CareerCanonicalFamily, Record<string, unknown>> = Object.fromEntries(familyCases.map((entry) => [entry.family, entry.artifact(fixture)])) as never;
      for (const [family, definition] of Object.entries(CAREER_CANONICAL_FAMILIES) as [CareerCanonicalFamily, typeof CAREER_CANONICAL_FAMILIES[CareerCanonicalFamily]][]) {
        const artifact = artifacts[family];
        if (definition.establishedState.kind === "PROPOSAL") {
          expect(artifact.proposalState).toBe(definition.establishedState.proposalState);
          expect(artifact.authorityState).toBe(definition.establishedState.authorityState);
        } else {
          expect(artifact).not.toHaveProperty("authorityState");
          expect(artifact).not.toHaveProperty("proposalState");
        }
      }
      expect(CAPABILITY_CORE_AUTHORITY_CONTRACT_ID).toBe("CAPABILITY_PHASE4_VERIFIED_V1");
    });
  });

  describe("P2 reader composition and namespace", () => {
    it("binds capability and all G3 resolvers; unknown and duplicate pairs fail", async () => {
      const capability = createCapabilityCoreAuthoritativeStateResolver({ getSnapshotByKey: async (key) => key === computeSnapshotKey(fixture.snapshot) ? structuredClone(fixture.snapshot) : null });
      const g3 = createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture));
      const reader = createBoundAuthoritativeStateReader([capability, ...g3]);
      const pairs = [capability, ...g3].map((resolver) => `${resolver.producerId}|${resolver.authorityContractId}`);
      expect(new Set(pairs).size).toBe(pairs.length);
      expect(pairs).toHaveLength(16);
      await expect(reader.resolve({ producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: fixture.snapshot.snapshotId, locator: computeSnapshotKey(fixture.snapshot) })).resolves.toMatchObject({ payload: fixture.snapshot });
      for (const { family, artifact } of familyCases) {
        const stored = artifact(fixture);
        await expect(reader.resolve(reference(family, stored[CAREER_CANONICAL_FAMILIES[family].idField] as string))).resolves.toMatchObject({ payload: stored });
      }
      await expect(reader.resolve({ producerId: CAREER_CANONICAL_PRODUCER_ID, authorityContractId: "CAREER_CAPABILITY_REQUIREMENT_RELATION_PROPOSAL_ONLY_AUTHORITY_NONE_V1", artifactId: `CRREL_${hex(32)}`, locator: `CRREL_${hex(32)}` })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
      await expect(reader.resolve({ producerId: "CONDYN_CAREER_LEGACY", authorityContractId: CAREER_CANONICAL_FAMILIES.RCP.authorityContractId, artifactId: fixture.recommendationProposal.recommendationProposalId, locator: fixture.recommendationProposal.recommendationProposalId })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
      expect(() => createBoundAuthoritativeStateReader([capability, ...g3, createRecommendationProposalAuthoritativeStateResolver({ getRecommendationProposalById: async () => null })])).toThrow("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
      expect(() => createBoundAuthoritativeStateReader([capability, capability])).toThrow("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
    });

    it("24-hex DAINT_ under the G3 pair and 32-hex DAINT_ under any G2 pair both fail", async () => {
      const g2Contract = readFileSync(resolve(process.cwd(), "lib/decision-core/action-intent/contract.ts"), "utf8");
      const g3Contract = readFileSync(resolve(process.cwd(), "lib/career/relation/action-intent/contract.ts"), "utf8");
      expect(g2Contract).toContain("/^DAINT_[0-9A-F]{24}$/");
      expect(g3Contract).toContain("/^DAINT_[0-9A-F]{32}$/");
      const daint24 = `DAINT_${hex(24)}`;
      const daint32 = `DAINT_${hex(32)}`;
      expect(careerCanonicalArtifactIdPattern("DAINT").test(daint24)).toBe(false);
      expect(careerCanonicalArtifactIdPattern("DAINT").test(daint32)).toBe(true);
      expect(/^DAINT_[0-9A-F]{24}$/.test(daint32)).toBe(false);
      expect(CAREER_CANONICAL_NON_RESOLVABLE_PREFIXES).toContain("DAINT");

      const capability = createCapabilityCoreAuthoritativeStateResolver({ getSnapshotByKey: async () => null });
      const g3 = createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture));
      const reader = createBoundAuthoritativeStateReader([capability, ...g3]);
      const g3ActionIntentPair = { producerId: CAREER_CANONICAL_PRODUCER_ID, authorityContractId: "CAREER_DECISION_ACTION_INTENT_DECLARATION_V1" };
      await expect(reader.resolve({ ...g3ActionIntentPair, artifactId: daint24, locator: daint24 })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
      await expect(reader.resolve({ ...g3ActionIntentPair, artifactId: daint32, locator: daint32 })).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
      for (const family of CAREER_CANONICAL_FAMILY_ORDER) {
        await expect(reader.resolve(reference(family, daint24))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
        await expect(reader.resolve(reference(family, daint32))).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
      }
      await expect(reader.resolve({ producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: daint32, locator: daint32 })).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
      await expect(reader.resolve({ producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: daint24, locator: daint24 })).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
    });

    it("no resolver accepts an id by prefix alone", async () => {
      const reader = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture)));
      for (const { family, artifact } of familyCases) {
        const artifactId = artifact(fixture)[CAREER_CANONICAL_FAMILIES[family].idField] as string;
        for (const candidate of [artifactId.slice(0, -1), `${artifactId}0`, `${artifactId} `, ` ${artifactId}`, `${CAREER_CANONICAL_FAMILIES[family].prefix}_`, CAREER_CANONICAL_FAMILIES[family].prefix]) {
          await expect(reader.resolve(reference(family, candidate))).rejects.toThrow(/ERR_DECISION_AUTHORITY_(ARTIFACT_REFERENCE_MISMATCH|REFERENCE_INVALID)/);
        }
      }
    });
  });

  describe("P3 root context from G3 state over HTTP", () => {
    const databaseBasis = requireTestDatabaseUrl();
    const basisName = new URL(databaseBasis).pathname.slice(1);
    const databaseName = newDisposableTestDatabaseName();
    const sentinel = `P3SENTINEL${randomBytes(6).toString("hex").toUpperCase()}`;
    const databaseUrl = new URL(databaseBasis); databaseUrl.pathname = `/${databaseName}`;
    const administrativeUrl = new URL(databaseBasis); administrativeUrl.pathname = "/postgres";
    let administrativeClient: Sql;
    let databaseClient: Sql;
    let server: ChildProcess | undefined;
    let port: number;
    let serverOutput = "";
    let readiness: { status: number; body: unknown };
    let seeded: SeededCareerCanonicalChain;
    const cleanup: string[] = [];
    const delay = (milliseconds: number) => new Promise<void>((done) => setTimeout(done, milliseconds));

    async function availablePort(): Promise<number> {
      const listener = createServer();
      await new Promise<void>((ok, bad) => { listener.once("error", bad); listener.listen(0, "127.0.0.1", () => ok()); });
      const address = listener.address();
      if (address === null || typeof address === "string") throw new Error("P3 did not receive a TCP port.");
      await new Promise<void>((ok, bad) => listener.close((error) => error === undefined ? ok() : bad(error)));
      return address.port;
    }
    async function tableExists(name: string): Promise<boolean> {
      const rows = await databaseClient.unsafe("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1) AS exists", [name]);
      return rows[0]?.exists === true;
    }
    async function revisionCount(): Promise<number> {
      const rows = await databaseClient.unsafe("SELECT COUNT(*)::int AS count FROM decision_context_revisions");
      return rows[0]?.count ?? 0;
    }
    async function waitForDecisionEndpoint(): Promise<{ status: number; body: unknown }> {
      const url = `http://127.0.0.1:${port}/api/decision-contexts/DREV_P3_READINESS_ABSENT`;
      for (let attempt = 0; attempt < 120; attempt += 1) {
        try {
          const response = await fetch(url);
          const body = await response.json();
          if (response.status === 404) return { status: response.status, body };
        } catch {
          // not ready until the endpoint answers its own 404 envelope
        }
        await delay(250);
      }
      throw new Error(`P3 Next server did not reach the Decision endpoint. Output:\n${serverOutput}`);
    }
    async function stopServer(): Promise<void> {
      if (server === undefined || server.exitCode !== null || server.signalCode !== null) return;
      server.kill("SIGTERM");
      await Promise.race([once(server, "exit"), delay(10_000)]);
      if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
    }
    const post = (body: string) => fetch(`http://127.0.0.1:${port}/api/decision-contexts`, { method: "POST", headers: { "content-type": "application/json" }, body });

    beforeAll(async () => {
      expect(databaseName).not.toBe(basisName);
      administrativeClient = postgres(administrativeUrl.toString(), { max: 1, onnotice: () => undefined });
      await createDisposableTestDatabaseNamed(databaseBasis, databaseName);
      databaseClient = postgres(databaseUrl.toString(), { max: 1, onnotice: () => undefined });
      await provisionCareerChainSchema(databaseClient);
      expect(await tableExists("decision_context_revisions")).toBe(false);
      seeded = await seedCareerCanonicalChain(drizzle(databaseClient), sentinel);
      port = await availablePort();
      server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "-p", String(port), "-H", "127.0.0.1"], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl.toString(), NEXT_TELEMETRY_DISABLED: "1" },
        stdio: ["ignore", "pipe", "pipe"]
      });
      const append = (chunk: Buffer) => { serverOutput = `${serverOutput}${chunk.toString("utf8")}`.slice(-16_000); };
      server.stdout?.on("data", append);
      server.stderr?.on("data", append);
      readiness = await waitForDecisionEndpoint();
    }, 120_000);

    /** Cleanup is its own transition: identity of the dropped database and preservation of the basis database are proven. */
    afterAll(async () => {
      await stopServer();
      if (databaseClient !== undefined) await databaseClient.end({ timeout: 5 });
      if (administrativeClient === undefined) return;
      try {
        const before = await administrativeClient.unsafe("SELECT datname FROM pg_database WHERE datname = ANY($1::text[]) ORDER BY datname", [[databaseName, basisName]]);
        cleanup.push(`before=${before.map((row) => row.datname).join(",")}`);
        expect(DISPOSABLE_TEST_DATABASE_PATTERN.test(databaseName)).toBe(true);
        await dropDisposableTestDatabase(databaseUrl.toString());
        const after = await administrativeClient.unsafe("SELECT datname FROM pg_database WHERE datname = ANY($1::text[]) ORDER BY datname", [[databaseName, basisName]]);
        cleanup.push(`after=${after.map((row) => row.datname).join(",")}`);
        expect(after.map((row) => row.datname)).not.toContain(databaseName);
        expect(after.map((row) => row.datname).includes(basisName)).toBe(before.map((row) => row.datname).includes(basisName));
        console.info(`[P3 CLEANUP] dropped=${databaseName} ${cleanup.join(" ")} basisPreserved=${after.some((row) => row.datname === basisName)}`);
      } finally {
        await administrativeClient.end({ timeout: 5 });
      }
    }, 30_000);

    it("HR context layer builds OPTION items with AUTHORITATIVE_STATE provenance to the RCP", async () => {
      const r = seeded.repositories;
      const reread = {
        verifiedCapabilitySnapshot: (await r.capability.getSnapshotById(seeded.snapshot.snapshotId))!,
        recommendationProposal: (await r.proposals.getRecommendationProposalById(seeded.recommendationProposal.recommendationProposalId))!,
        evolutionInputState: (await r.evolutionInputs.getEvolutionInputStateById(seeded.evolutionInputState.evolutionInputStateId))!,
        tensionState: (await r.tensionStates.getTensionStateById(seeded.tensionState.tensionStateId))!,
        roleRelation: (await r.roleRelations.getRoleRelationById(seeded.roleRelation.roleRelationId))!,
        targetRoleProfileRevision: (await r.profile.getRevisionById(seeded.profile.targetRoleProfileRevisionId))!,
        targetRequirementRevisions: [(await r.requirement.getRevisionById(seeded.requirementA.targetRequirementRevisionId))!, (await r.requirement.getRevisionById(seeded.requirementB.targetRequirementRevisionId))!]
      };
      expect(reread.recommendationProposal).toEqual(seeded.recommendationProposal);
      expect(reread.recommendationProposal.items.some((item) => item.recommendationDisposition === "PROPOSED")).toBe(true);
      expect(JSON.stringify(reread.recommendationProposal)).toContain(sentinel);
      expect(JSON.stringify(reread.verifiedCapabilitySnapshot)).toContain(sentinel);
      const input = buildHrDecisionContextDraftInput({ question: { statement: "Which proposed option should be pursued for this role?", actorId: "hr-p3" }, sourceState: reread });
      const contracts = input.sourceStateReferences.map((entry) => entry.authorityContractId);
      for (const family of ["RCP", "EIS", "TSN", "RRL", "TRPREV", "TRQREV"] as const) expect(contracts).toContain(CAREER_CANONICAL_FAMILIES[family].authorityContractId);
      expect(contracts).toContain(CAPABILITY_CORE_AUTHORITY_CONTRACT_ID);
      const options = input.items.filter((item) => item.role === "OPTION");
      expect(options.length).toBe(reread.recommendationProposal.items.filter((item) => item.recommendationDisposition === "PROPOSED").length);
      for (const option of options) {
        expect(option.provenance.origin).toBe("AUTHORITATIVE_STATE");
        if (option.provenance.origin !== "AUTHORITATIVE_STATE") throw new Error("unreachable");
        expect(option.provenance.stateReference.artifactId).toBe(reread.recommendationProposal.recommendationProposalId);
        expect(option.provenance.stateReference.locator).toMatch(new RegExp(`^${reread.recommendationProposal.recommendationProposalId}/items/(0|[1-9][0-9]*)$`));
      }
      expect(JSON.stringify(input)).not.toContain(sentinel);
      (globalThis as Record<string, unknown>).__p3Input = input;
    });

    it("POST 201 == stored payload == GET; RCP payload sentinel absent from the DREV", async () => {
      const input = (globalThis as Record<string, unknown>).__p3Input as DecisionContextDraftInput;
      expect(readiness).toEqual({ status: 404, body: { success: false, error: { code: "ERR_DECISION_API_NOT_FOUND", message: "Decision Context revision was not found." } } });
      expect(await tableExists("decision_context_revisions")).toBe(true);
      expect(await revisionCount()).toBe(0);
      const response = await post(JSON.stringify(input));
      expect(response.status).toBe(201);
      const body = await response.json() as { success: boolean; revision: Record<string, unknown> };
      expect(Object.keys(body)).toEqual(["success", "revision"]);
      expect(body.revision.previousRevisionId).toBeNull();
      expect(body.revision.revisionId).toMatch(/^DREV_[0-9A-F]{24}$/);
      expect(body.revision.context).toEqual(createDecisionContextDraft(input));
      const serialized = JSON.stringify(body.revision);
      expect(serialized).not.toContain(sentinel);
      expect(serialized).not.toContain("recommendationDisposition");
      const stored = await databaseClient.unsafe("SELECT revision_id, payload FROM decision_context_revisions WHERE revision_id = $1", [body.revision.revisionId as string]);
      expect(stored).toHaveLength(1);
      expect(stored[0]?.payload).toEqual(body.revision);
      expect(JSON.stringify(stored[0]?.payload)).not.toContain(sentinel);
      const get = await fetch(`http://127.0.0.1:${port}/api/decision-contexts/${encodeURIComponent(body.revision.revisionId as string)}`);
      expect(get.status).toBe(200);
      const getBody = await get.json();
      expect(getBody).toEqual(body);
      const forbiddenKeys = ["current", "head", "latest", "accepted", "authority", "verified", "loopClosed", "success"];
      const walk = (value: unknown, path: string[] = []): string[] => value !== null && typeof value === "object" ? Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [...(forbiddenKeys.includes(key) ? [[...path, key].join(".")] : []), ...walk(child, [...path, key])]) : [];
      expect(walk(body.revision)).toEqual([]);
      const legacy = await databaseClient.unsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('career_decisions','career_commitments','career_actions','career_outcomes','career_feedback','career_attributions','career_learning_proposals','career_policy_versions') ORDER BY table_name");
      expect(legacy).toEqual([]);
      (globalThis as Record<string, unknown>).__p3Count = await revisionCount();
    });

    it("mutating the persisted RCP row makes the same POST fail; deleting the RCP turns it into 422; malformed JSON is 400", async () => {
      const input = (globalThis as Record<string, unknown>).__p3Input as DecisionContextDraftInput;
      const count = (globalThis as Record<string, unknown>).__p3Count as number;
      const id = seeded.recommendationProposal.recommendationProposalId;
      const original = await databaseClient.unsafe("SELECT payload FROM recommendation_proposals WHERE recommendation_proposal_id = $1", [id]);
      expect(original).toHaveLength(1);
      await databaseClient.unsafe("UPDATE recommendation_proposals SET payload = jsonb_set(payload, '{items,0,recommendationDisposition}', '\"ABSTAINED\"') WHERE recommendation_proposal_id = $1", [id]);
      const tampered = await post(JSON.stringify(input));
      expect([422, 500]).toContain(tampered.status);
      const tamperedBody = await tampered.json() as { success: boolean; error: { code: string } };
      expect(tamperedBody.success).toBe(false);
      expect(["ERR_DECISION_API_REQUEST_REJECTED", "ERR_DECISION_API_INTERNAL"]).toContain(tamperedBody.error.code);
      expect(JSON.stringify(tamperedBody)).not.toMatch(/ERR_DECISION_AUTHORITY|ERR_RECOMMENDATION/);
      expect(await revisionCount()).toBe(count);
      await expect(seeded.repositories.proposals.getRecommendationProposalById(id)).rejects.toThrow("ERR_RECOMMENDATION_PROPOSAL_PERSISTENCE_FAILED");
      await databaseClient.unsafe("UPDATE recommendation_proposals SET payload = $2::jsonb WHERE recommendation_proposal_id = $1", [id, JSON.stringify(original[0]!.payload)]);
      const restored = await post(JSON.stringify(input));
      expect(restored.status).toBe(201);
      expect(await revisionCount()).toBe(count);

      for (const table of ["recommendation_proposal_items", "recommendation_proposal_requirement_references", "recommendation_proposal_aggregate_references", "recommendation_proposal_relation_references", "recommendation_proposal_result_references", "recommendation_proposal_operand_references"]) {
        await databaseClient.unsafe(`DELETE FROM ${table} WHERE recommendation_proposal_id = $1`, [id]);
      }
      await databaseClient.unsafe("DELETE FROM recommendation_proposals WHERE recommendation_proposal_id = $1", [id]);
      await expect(seeded.repositories.proposals.getRecommendationProposalById(id)).resolves.toBeNull();
      const absent = await post(JSON.stringify(input));
      expect(absent.status).toBe(422);
      expect(await absent.json()).toEqual({ success: false, error: { code: "ERR_DECISION_API_REQUEST_REJECTED", message: "Decision Context request was rejected." } });
      expect(await revisionCount()).toBe(count);

      const malformed = await post("{invalid-json");
      expect(malformed.status).toBe(400);
      expect(await malformed.json()).toEqual({ success: false, error: { code: "ERR_DECISION_API_INVALID_JSON", message: "Request body must be valid JSON." } });
      expect(await revisionCount()).toBe(count);
      console.info(`[P3 E2E] GREEN database=${databaseName} port=${port} readiness=${readiness.status} post=201 tampered=${tampered.status} restored=${restored.status} absent=${absent.status} malformed=${malformed.status}`);
    }, 30_000);

    it("API v1 contract freeze test remains unchanged and green", () => {
      const freeze = spawnSync("git", ["diff", "--quiet", "435a112", "--", "test/decision-runtime/api/local-api-contract-freeze.test.ts", "lib/decision-runtime/http/decision-contexts.ts", "docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md", "app/api/decision-contexts"], { cwd: process.cwd() });
      expect(freeze.status).toBe(0);
    });
  });

  describe("P4 decision context binding (R4)", () => {
    it("is proven in g3-decision-context-binding-vertical.test.ts (DCDRB over PostgreSQL, idempotence, conflict, replay, falsifiers)", () => {
      const source = readFileSync(resolve(process.cwd(), "test/decision-integration/g3-decision-context-binding-vertical.test.ts"), "utf8");
      expect(source).toContain("P4 DCTXREV to DREV binding over real PostgreSQL (R4, D4)");
    });
  });

  describe("P5 claims from G3 declarations (R5)", () => {
    it("8B and 8C1 preserve AOC/SCD references exactly and call no resolver", () => {
      const resolvers = createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture));
      const spied = resolvers.map((resolver) => ({ ...resolver, resolve: vi.fn(resolver.resolve) }));
      createBoundAuthoritativeStateReader(spied);
      const aocReference = reference("AOC", fixture.actionOccurrence.careerActionOccurrenceId);
      const scdReference = reference("SCD", fixture.stateChangeDeclaration.careerStateChangeDeclarationId);
      const occurrence = createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: aocReference }, operationDescription: "Applied for the target role." });
      const change = createStateChangeClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: scdReference }, stateChangeDescription: "Application status moved to interview-invited." });
      expect(occurrence.source).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: aocReference });
      expect(change.source).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: scdReference });
      expect(occurrence.actionOccurrenceClaimId).toMatch(/^DAOC_[0-9A-F]{24}$/);
      expect(change.stateChangeClaimId).toMatch(/^DSCC_[0-9A-F]{24}$/);
      for (const resolver of spied) expect(resolver.resolve).not.toHaveBeenCalled();
    });

    it("8C2, 8C3, 8D1 accept AUTHORITATIVE_STATE provenance to ASCAD, CORD, COVD", () => {
      const occurrence = createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: reference("AOC", fixture.actionOccurrence.careerActionOccurrenceId) }, operationDescription: "Applied for the target role." });
      const change = createStateChangeClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: reference("SCD", fixture.stateChangeDeclaration.careerStateChangeDeclarationId) }, stateChangeDescription: "Application status moved to interview-invited." });
      const ascad = reference("ASCAD", fixture.associationDeclaration.careerActionStateChangeAssociationDeclarationId);
      const cord = reference("CORD", fixture.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId);
      const covd = reference("COVD", fixture.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId);
      const association = createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence, stateChangeClaim: change, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: ascad } });
      const attribution = createOutcomeAttributionProposal({ associationProposal: association, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: cord } });
      const observation = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution, statement: "The declared outcome was DESIRABLE for the target role.", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: covd } });
      expect(association.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: ascad });
      expect(attribution.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: cord });
      expect(observation.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: covd });
      expect(observation.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim).toEqual(occurrence);
      expect(JSON.stringify(observation)).not.toMatch(/"(current|head|latest|accepted|authority|loopClosed|success)":/);
    });

    it("adapter-level reachability probe resolves the same references", async () => {
      const reader = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture)));
      const probes: Array<[AuthoritativeStateReference, unknown]> = [
        [reference("AOC", fixture.actionOccurrence.careerActionOccurrenceId), fixture.actionOccurrence],
        [reference("SCD", fixture.stateChangeDeclaration.careerStateChangeDeclarationId), fixture.stateChangeDeclaration],
        [reference("ASCAD", fixture.associationDeclaration.careerActionStateChangeAssociationDeclarationId), fixture.associationDeclaration],
        [reference("CORD", fixture.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId), fixture.outcomeRoleDeclaration],
        [reference("COVD", fixture.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId), fixture.outcomeValenceDeclaration],
        [reference("COVFCR", fixture.feedbackContextRevision.careerOutcomeValenceFeedbackContextRevisionId), fixture.feedbackContextRevision]
      ];
      for (const [probe, expected] of probes) await expect(reader.resolve(probe)).resolves.toEqual({ reference: probe, payload: expected });
      // Reachability is not truth: the same claim is constructible while the artifact is absent.
      const absent = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers({ ...stubRepositories(fixture), actionOccurrences: { getCareerActionOccurrenceById: async () => null } }));
      const claim = createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: probes[0][0] }, operationDescription: "Claimed without resolution." });
      expect(claim.source.origin).toBe("AUTHORITATIVE_STATE");
      await expect(absent.resolve(probes[0][0])).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
    });
  });

  describe("P6 HR decision path in G3 against a bound context", () => {
    it("is proven in hr-decision-loop-postgres.test.ts (DCTXREV producer, DCDRB, one DCR, declarant and window falsifiers)", () => {
      const source = readFileSync(resolve(process.cwd(), "test/decision-integration/hr-decision-loop-postgres.test.ts"), "utf8");
      expect(source).toContain("P6 HR decision boundary on PostgreSQL across both fields (D1, D4)");
    });
  });

  describe("P7 full loop root DREV to child DREV through G3", () => {
    it("is proven in hr-decision-loop-p7.test.ts (forward, inverse, sealed 8D5 boundary)", () => {
      const source = readFileSync(resolve(process.cwd(), "test/decision-integration/hr-decision-loop-p7.test.ts"), "utf8");
      expect(source).toContain("P7 inverse: fresh process walks child DREV to root by exact ids only");
    });
  });

  describe("P8 preservation and regression", () => {
    const testFiles = (directory: string): string[] => readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? testFiles(join(directory, entry.name)) : /\.test\.tsx?$/.test(entry.name) ? [join(directory, entry.name)] : []);

    it("decision-core 38 files, capability-core 37 files, runtime 7 plus adapters 1 files; sealed suites and runtime files unchanged", () => {
      expect(testFiles("test/decision-core")).toHaveLength(38);
      expect(testFiles("test/career/capability-core")).toHaveLength(37);
      expect(testFiles("test/decision-runtime")).toHaveLength(7);
      expect(testFiles("test/decision-adapters")).toHaveLength(1);
      const unchanged = spawnSync("git", ["diff", "--quiet", "435a112", "--", "test/decision-core", "test/career/capability-core", "test/decision-runtime", "test/decision-adapters", "lib/decision-runtime/types.ts", "lib/decision-runtime/runtime.ts", "lib/decision-runtime/index.ts", "lib/decision-runtime/composition/index.ts", "lib/decision-runtime/composition/postgres-capability-core.ts", "lib/decision-runtime/composition/types.ts", "lib/decision-adapters/capability-core.ts", "lib/decision-adapters/revision-persistence"], { cwd: process.cwd() });
      expect(unchanged.status).toBe(0);
    });

    it("lib/decision-core production files byte-identical to the 8E2 seal; import boundary tests green", () => {
      const tag = spawnSync("git", ["rev-parse", "--verify", `${SEAL_TAG}^{commit}`], { cwd: process.cwd(), encoding: "utf8" });
      expect(tag.status).toBe(0);
      const diff = spawnSync("git", ["diff", "--stat", SEAL_TAG, "--", "lib/decision-core"], { cwd: process.cwd(), encoding: "utf8" });
      expect(diff.status).toBe(0);
      expect(diff.stdout.trim()).toBe("");
      expect(testFiles("test/decision-integration")).toContain(join("test/decision-integration", "import-boundary.test.ts"));
      const sealedBoundary = readFileSync(resolve(process.cwd(), "test/decision-core/authority/contract.test.ts"), "utf8");
      expect(sealedBoundary).toContain("keeps the generic kernel free of Career, Capability, matching, and recommendation imports");
    });
  });
});
