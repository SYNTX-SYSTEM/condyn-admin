import { requireTestDatabaseUrl } from "../../lib/database-isolation/policy";
import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as sealedComposition from "../../lib/decision-runtime/composition";
import { createPostgresResolverListDecisionApplicationRuntime } from "../../lib/decision-runtime/composition/postgres-resolver-list";
import { createPersistRootDecisionContextRevisionUseCase } from "../../lib/decision-runtime/use-cases/root-decision-context";
import { createCapabilityCoreAuthoritativeStateResolver } from "../../lib/decision-adapters/capability-core";
import { createCareerCanonicalAuthoritativeStateResolvers, createRecommendationProposalAuthoritativeStateResolver } from "../../lib/decision-adapters/career-canonical";
import { buildHrDecisionContextDraftInput } from "../../lib/hr-decision-context";
import { computeSnapshotKey } from "../../lib/career/capability-core";
import { createCareerCanonicalLocalFixture, type CareerCanonicalLocalFixture } from "./fixtures/career-canonical-local-fixture";
import { stubRepositories } from "./fixtures/stub-repositories";

const databaseUrl = requireTestDatabaseUrl();
const schemaName = `g2g3_r3_${randomBytes(8).toString("hex")}`;
let admin: Sql;
let client: Sql;
let fixture: CareerCanonicalLocalFixture;

beforeAll(async () => {
  admin = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schemaName}"`);
  client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  await client.unsafe(`SET search_path TO "${schemaName}"`);
  fixture = await createCareerCanonicalLocalFixture("R3");
}, 30_000);

afterAll(async () => {
  await client.end({ timeout: 5 });
  await admin.unsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
  await admin.end({ timeout: 5 });
});

describe("R3 resolver-list composition root", () => {
  it("keeps the sealed R2 export surface untouched", () => {
    expect(Object.keys(sealedComposition).sort()).toEqual(["createPostgresCapabilityDecisionApplicationRuntime", "ensureDecisionRuntimePostgresSchema"]);
  });

  it("persists a root context whose references resolve through capability and G3 resolvers, and refuses the same context when the RCP resolver is absent", async () => {
    const database = drizzle(client);
    await sealedComposition.ensureDecisionRuntimePostgresSchema(database);
    const repositories = stubRepositories(fixture);
    const capability = createCapabilityCoreAuthoritativeStateResolver({ getSnapshotByKey: async (key) => key === computeSnapshotKey(fixture.snapshot) ? structuredClone(fixture.snapshot) : null });
    const g3 = createCareerCanonicalAuthoritativeStateResolvers(repositories);
    const input = buildHrDecisionContextDraftInput({
      question: { statement: "Which proposed option should be pursued for this role?", actorId: "hr-r3" },
      sourceState: {
        verifiedCapabilitySnapshot: fixture.snapshot,
        recommendationProposal: fixture.recommendationProposal,
        evolutionInputState: fixture.evolutionInputState,
        tensionState: fixture.tensionState,
        roleRelation: fixture.roleRelation,
        targetRoleProfileRevision: fixture.profile,
        targetRequirementRevisions: [fixture.requirementA, fixture.requirementB]
      }
    });

    const complete = createPostgresResolverListDecisionApplicationRuntime({ database, resolvers: [capability, ...g3] });
    expect(Object.keys(complete).sort()).toEqual(["persistDecisionContextRevision", "readDecisionContextRevision", "resolveAuthoritativeState"]);
    const persisted = await createPersistRootDecisionContextRevisionUseCase({ runtime: complete }).execute(input);
    expect(persisted.previousRevisionId).toBeNull();
    await expect(complete.readDecisionContextRevision(persisted.revisionId)).resolves.toEqual(persisted);

    const withoutProposalResolver = createPostgresResolverListDecisionApplicationRuntime({ database, resolvers: [capability, ...g3.filter((resolver) => resolver.authorityContractId !== g3[0].authorityContractId)] });
    await expect(createPersistRootDecisionContextRevisionUseCase({ runtime: withoutProposalResolver }).execute(input)).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");

    const withAbsentProposal = createPostgresResolverListDecisionApplicationRuntime({ database, resolvers: [capability, ...g3.filter((resolver) => resolver.authorityContractId !== g3[0].authorityContractId), createRecommendationProposalAuthoritativeStateResolver({ getRecommendationProposalById: async () => null })] });
    await expect(createPersistRootDecisionContextRevisionUseCase({ runtime: withAbsentProposal }).execute(input)).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
  });

  it("rejects duplicate pairs, hostile dependency containers and sparse resolver lists at construction", () => {
    const database = drizzle(client);
    const g3 = createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture));
    expect(() => createPostgresResolverListDecisionApplicationRuntime({ database, resolvers: [...g3, g3[0]] })).toThrow("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
    const getter = {} as Record<PropertyKey, unknown>;
    const spy = vi.fn(() => []);
    Object.defineProperty(getter, "database", { enumerable: true, value: database });
    Object.defineProperty(getter, "resolvers", { enumerable: true, get: spy });
    for (const value of [null, [], { database }, { database, resolvers: g3, extra: true }, { database, resolvers: "none" }, { database, resolvers: [g3[0], , g3[1]] }, { database, resolvers: [null] }, getter]) {
      expect(() => createPostgresResolverListDecisionApplicationRuntime(value as never)).toThrow("ERR_DECISION_RUNTIME_COMPOSITION_DEPENDENCIES_INVALID");
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
