import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import {
  createBoundCareerOutcomeValenceFeedbackContextRevisionPersister,
} from "../../../../lib/career/relation/outcome-valence-feedback-context-revision-persistence";
import {
  byteReplayCareerOutcomeValenceFeedbackContextRevision,
  derivationReplayCareerOutcomeValenceFeedbackContextRevision,
  semanticReplayCareerOutcomeValenceFeedbackContextRevision,
} from "../../../../lib/career/relation/outcome-valence-feedback-context-revision-replay";
import {
  stableCareerOutcomeValenceFeedbackContextRevision,
} from "../../../../lib/career/relation/outcome-valence-feedback-context-revision";
import { createT13EHistoricalFixture } from "../../relation/outcome-valence-feedback-context-content/t13e-historical-fixture";
import { createT13HHistoricalFixture } from "../../relation/outcome-valence-feedback-context-revision-persistence/t13h-historical-fixture";

const loadAdapter = () => import(
  "../../../../lib/career/relation-adapters/outcome-valence-feedback-context-revision-persistence"
) as Promise<any>;
const loadSchema = () => import(
  "../../../../lib/career/relation-adapters/outcome-valence-feedback-context-revision-persistence/postgres-schema"
) as Promise<any>;

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const rootColumns = [
  "career_outcome_valence_feedback_context_revision_id",
  "parent_revision_kind",
  "parent_revision_id",
  "schema_version",
  "created_at",
  "payload",
];
const failed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED";
const parentNotFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_NOT_FOUND";
const parentInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_INVALID";
const parentBaseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_BASE_MISMATCH";
const parentContentMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_CONTENT_MISMATCH";
const immutableConflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_IMMUTABLE_CONFLICT";

type Session = { sql: ReturnType<typeof postgres>; schema: string; db: any; close(): Promise<void> };

async function sessionFor(schema: any): Promise<Session> {
  const root = getTableConfig(schema.careerOutcomeValenceFeedbackContextRevisions);
  const namespace = `covfcr_t14_${randomBytes(8).toString("hex")}`;
  const admin = postgres(url, { max: 1, onnotice: () => undefined });
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await admin.unsafe(`CREATE SCHEMA "${namespace}"`);
    const columns = root.columns.map((column: any) =>
      `"${column.name}" ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`,
    );
    await admin.unsafe(`CREATE TABLE "${namespace}"."${root.name}" (${columns.join(",")})`);
    await sql.unsafe(`SET search_path TO "${namespace}"`);
  } catch (error) {
    await sql.end({ timeout: 5 });
    await admin.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    await admin.end({ timeout: 5 });
    throw error;
  }
  return {
    sql,
    schema: namespace,
    db: drizzle(sql),
    async close() {
      await sql.end({ timeout: 5 });
      await admin.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.end({ timeout: 5 });
    },
  };
}

function dependencies(repository: any, base: any, mode: "valid" | "missing" | "malformed" | "audit-mismatch" | "failed" = "valid") {
  return {
    async getCareerDecisionContextRevisionById(id: string) {
      if (mode === "failed") throw new Error("database outage");
      if (mode === "missing") return null;
      if (mode === "malformed") return {};
      if (mode === "audit-mismatch") return { ...structuredClone(base), createdAt: "2027-02-14T00:00:09.000Z" };
      return id === base.careerDecisionContextRevisionId ? structuredClone(base) : null;
    },
    getCareerOutcomeValenceFeedbackContextRevisionById:
      repository.getCareerOutcomeValenceFeedbackContextRevisionById.bind(repository),
    writeCareerOutcomeValenceFeedbackContextRevision:
      repository.writeCareerOutcomeValenceFeedbackContextRevision.bind(repository),
  };
}

/*
 * T14 adds physical storage only. Constructed COVFCR remains distinct from persisted COVFCR;
 * a stored typed parent reference is neither a feedback consumer nor a sole-child/head relation.
 */
describe("CareerOutcomeValenceFeedbackContextRevision frozen PostgreSQL persistence adapter contract", () => {
  it("constructs sealed first, subsequent, branch, audit, and UNRESOLVED-capable history plus the existing abstract replay reader shape", async () => {
    const value = await createT13HHistoricalFixture();
    const unresolved = await createT13EHistoricalFixture("UNRESOLVED");
    const reader = {
      async getCareerOutcomeValenceFeedbackContextRevisionById(id: string) {
        return id === value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId
          ? structuredClone(value.firstRevision)
          : null;
      },
    };
    await expect(byteReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      reader,
    )).resolves.toEqual(value.firstRevision);
    expect(value.firstRevision.schemaVersion).toBe("CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_V1");
    expect(value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId).toMatch(/^COVFCR_[A-F0-9]{32}$/);
    expect(value.subsequentRevision.parent.parentRevisionKind).toBe("CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION");
    expect(value.branchRevision.parent).toEqual(value.firstRevision.parent);
    expect(value.firstRevisionLaterAudit.careerOutcomeValenceFeedbackContextRevisionId)
      .toBe(value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId);
    expect(unresolved.firstFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence)
      .toBe("UNRESOLVED");
  });

  it("freezes the concrete repository and minimum root schema surface without a generic resolver, receipt, or persistence state", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    expect(adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository).toBeTypeOf("function");
    expect(Object.keys(schema)).toEqual(["careerOutcomeValenceFeedbackContextRevisions"]);
    const root = getTableConfig(schema.careerOutcomeValenceFeedbackContextRevisions);
    expect(root.name).toBe("career_outcome_valence_feedback_context_revisions");
    expect(root.columns.map((column: any) => column.name)).toEqual(rootColumns);
    expect(root.foreignKeys).toHaveLength(0);
    expect(root.indexes.some((index: any) => index.config.unique && index.config.columns.some((column: any) => column.name === "parent_revision_id"))).toBe(false);
    const surface = Object.getOwnPropertyNames(adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository.prototype);
    expect(surface).toEqual(expect.arrayContaining([
      "getCareerOutcomeValenceFeedbackContextRevisionById",
      "writeCareerOutcomeValenceFeedbackContextRevision",
    ]));
    expect(surface).not.toEqual(expect.arrayContaining([
      "persistCareerOutcomeValenceFeedbackContextRevision",
      "getCareerDecisionContextRevisionById",
      "getGenericParentById",
      "getAncestorRevisionById",
      "current",
      "latest",
      "head",
      "update",
      "delete",
    ]));
  });

  it("freezes exact row/payload coherence, detached exact-ID reads, absence, and first-parent T13H composition before a physical write", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    const value = await createT13HHistoricalFixture();
    const session = await sessionFor(schema);
    try {
      const repository = new adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(session.db);
      const bound = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
        dependencies(repository, value.base),
      );
      await expect(repository.getCareerOutcomeValenceFeedbackContextRevisionById("COVFCR_00000000000000000000000000000000"))
        .resolves.toBeNull();
      const persisted = await bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
      expect(persisted).toEqual(value.firstRevision);
      expect(persisted).not.toBe(value.firstRevision);
      expect(stableCareerOutcomeValenceFeedbackContextRevision(persisted))
        .toBe(stableCareerOutcomeValenceFeedbackContextRevision(value.firstRevision));
      expect(await repository.getCareerOutcomeValenceFeedbackContextRevisionById(
        value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      )).toEqual(value.firstRevision);

      for (const [mode, error] of [
        ["missing", parentNotFound],
        ["malformed", parentInvalid],
        ["audit-mismatch", parentBaseMismatch],
        ["failed", failed],
      ] as const) {
        const blocked = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
          dependencies(repository, value.base, mode),
        );
        await expect(blocked.persistCareerOutcomeValenceFeedbackContextRevision(value.branchRevision)).rejects.toThrow(error);
        await expect(repository.getCareerOutcomeValenceFeedbackContextRevisionById(
          value.branchRevision.careerOutcomeValenceFeedbackContextRevisionId,
        )).resolves.toBeNull();
      }

      // Intentional raw corruption injection: the adapter itself must expose no UPDATE operation.
      await session.sql.unsafe(
        `UPDATE career_outcome_valence_feedback_context_revisions SET payload=jsonb_set(payload, '{careerOutcomeValenceFeedbackContextRevisionId}', '"COVFCR_00000000000000000000000000000000"'::jsonb) WHERE career_outcome_valence_feedback_context_revision_id='${value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId}'`,
      );
      await expect(repository.getCareerOutcomeValenceFeedbackContextRevisionById(
        value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      )).rejects.toThrow(failed);
    } finally {
      await session.close();
    }
  });

  it("freezes subsequent-parent physical composition and exact T13H reread", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    const value = await createT13HHistoricalFixture();
    const session = await sessionFor(schema);
    try {
      const repository = new adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(session.db);
      const bound = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
        dependencies(repository, value.base),
      );
      await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision)).resolves.toEqual(value.firstRevision);
      await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision)).resolves.toEqual(value.subsequentRevision);
    } finally {
      await session.close();
    }
  });

  it("freezes idempotency, immutable conflict, and original preservation", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    const value = await createT13HHistoricalFixture();
    const session = await sessionFor(schema);
    try {
      const repository = new adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(session.db);
      const bound = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
        dependencies(repository, value.base),
      );
      await bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
      await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision)).resolves.toEqual(value.firstRevision);
      await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevisionLaterAudit))
        .rejects.toThrow(immutableConflict);
      await expect(repository.getCareerOutcomeValenceFeedbackContextRevisionById(
        value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      )).resolves.toEqual(value.firstRevision);
    } finally {
      await session.close();
    }
  });

  it("freezes lawful physical branch freedom without a single successor", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    const value = await createT13HHistoricalFixture();
    const session = await sessionFor(schema);
    try {
      const repository = new adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(session.db);
      const bound = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
        dependencies(repository, value.base),
      );
      await bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
      await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision(value.branchRevision)).resolves.toEqual(value.branchRevision);
      const rows = await session.sql.unsafe(
        "SELECT count(*)::int AS count FROM career_outcome_valence_feedback_context_revisions WHERE parent_revision_id=$1",
        [value.base.careerDecisionContextRevisionId],
      );
      expect(Number(rows[0].count)).toBe(2);
    } finally {
      await session.close();
    }
  });

  it("freezes T13I concrete-reader compatibility without physical-byte authority", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    const value = await createT13HHistoricalFixture();
    const session = await sessionFor(schema);
    try {
      const repository = new adapter.PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(session.db);
      const bound = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
        dependencies(repository, value.base),
      );
      await bound.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
      await bound.persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision);
      await expect(byteReplayCareerOutcomeValenceFeedbackContextRevision(
        value.subsequentRevision.careerOutcomeValenceFeedbackContextRevisionId,
        repository,
      )).resolves.toEqual(value.subsequentRevision);
      await expect(semanticReplayCareerOutcomeValenceFeedbackContextRevision(
        value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
        dependencies(repository, value.base),
      )).resolves.toEqual(value.firstRevision);
      await expect(derivationReplayCareerOutcomeValenceFeedbackContextRevision(
        value.subsequentRevision.careerOutcomeValenceFeedbackContextRevisionId,
        repository,
      )).resolves.toEqual(value.subsequentRevision);
    } finally {
      await session.close();
    }
  });

  it("freezes physical storage as an immutable historical repository only, not a feedback successor, consumer, byte authority, or replay mode", async () => {
    const adapter = await loadAdapter();
    expect(Object.keys(adapter)).toEqual(expect.arrayContaining([
      "PostgresCareerOutcomeValenceFeedbackContextRevisionRepository",
    ]));
    for (const forbidden of [
      "CareerOutcomeValenceFeedbackContextRevisionPersistenceReceipt",
      "parentLineageReplayCareerOutcomeValenceFeedbackContextRevision",
      "createGenericParentResolver",
      "createFeedbackEvaluation",
      "createFeedbackLearningProposal",
      "createOrganizationRelation",
      "createCareerCoordinator",
      "currentCareerOutcomeValenceFeedbackContextRevision",
      "updateCareerOutcomeValenceFeedbackContextRevision",
    ]) expect(adapter).not.toHaveProperty(forbidden);
    expect([failed, parentNotFound, parentInvalid, parentBaseMismatch, parentContentMismatch, immutableConflict]).toEqual([
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_NOT_FOUND",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_INVALID",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_BASE_MISMATCH",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_CONTENT_MISMATCH",
      "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_IMMUTABLE_CONFLICT",
    ]);
    // A valid named-parent COVFCC mismatch is unreachable under sealed deterministic parent identity.
    // The adapter must fail malformed/corrupt physical parent rows rather than invent a new lineage walk.
    expect(drizzleSql).toBeTypeOf("function");
  });
});
