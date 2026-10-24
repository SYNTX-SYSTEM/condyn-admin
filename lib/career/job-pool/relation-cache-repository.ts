import type { Sql } from "postgres";
import { assertCachedRelation, canonicalJson, type CachedRelation, type RelationCacheReader } from "./relation-cache";

/**
 * PostgreSQL store of the content-addressed relation cache (PROPOSAL_REQUIREMENT_RELATION_CACHE_V1). One row per relation key; the
 * record is kept as canonical JSON text next to the indexed identity columns. The table is created only through the job pool
 * persistence registration (positively verified disposable database, boundary B-ENTRY); on any other database no DDL runs.
 *
 * Immutability is enforced by the database itself (PINK D-RC-1): a trigger refuses UPDATE, DELETE and TRUNCATE; CHECK constraints
 * bind the JSON record to the checked columns (key, state, authority, content hashes, engine hash) and fix the key format. The
 * reader admits every record again (`assertCachedRelation`) and refuses a row whose record does not hold — nothing is served
 * unchecked. Writing is first-wins (PINK C-2): a second evaluation of the same pair is never stored; it is reported as a duplicate
 * (same content) or as divergent (other state, explanation, limitation or evidence), and the first record stays.
 */
export const RELATION_CACHE_TABLE = "career_proposal_requirement_relations";

const json = (field: string) => `(record_json::jsonb ->> '${field}')`;

export const RELATION_CACHE_DDL = [
  `CREATE TABLE IF NOT EXISTS ${RELATION_CACHE_TABLE} (
    relation_key text PRIMARY KEY CHECK (relation_key ~ '^PRREL_[0-9A-F]{40}$'),
    proposal_content_hash text NOT NULL CHECK (proposal_content_hash ~ '^[0-9a-f]{64}$'),
    requirement_content_hash text NOT NULL CHECK (requirement_content_hash ~ '^[0-9a-f]{64}$'),
    engine_version_hash text NOT NULL CHECK (engine_version_hash ~ '^[0-9a-f]{64}$'),
    relation_state text NOT NULL CHECK (relation_state IN ('EQUIVALENT', 'COVERS', 'PARTIAL', 'DIFFERENT', 'UNCLEAR')),
    authority_state text NOT NULL CHECK (authority_state = 'NONE'),
    record_json text NOT NULL,
    created_at text NOT NULL,
    CONSTRAINT ${RELATION_CACHE_TABLE}_record_binds_columns CHECK (
      ${json("relationKey")} = relation_key AND ${json("state")} = relation_state AND ${json("authorityState")} = authority_state
      AND ${json("proposalContentHash")} = proposal_content_hash AND ${json("requirementContentHash")} = requirement_content_hash
      AND ${json("engineVersionHash")} = engine_version_hash AND ${json("createdAt")} = created_at
    )
  )`,
  `CREATE INDEX IF NOT EXISTS ${RELATION_CACHE_TABLE}_requirement_idx ON ${RELATION_CACHE_TABLE} (requirement_content_hash, engine_version_hash)`,
  `CREATE INDEX IF NOT EXISTS ${RELATION_CACHE_TABLE}_proposal_idx ON ${RELATION_CACHE_TABLE} (proposal_content_hash, engine_version_hash)`,
  `CREATE OR REPLACE FUNCTION ${RELATION_CACHE_TABLE}_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'ERR_RELATION_CACHE_IMMUTABLE: % on ${RELATION_CACHE_TABLE} refused', TG_OP; END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${RELATION_CACHE_TABLE}_no_update_delete' AND tgrelid = '${RELATION_CACHE_TABLE}'::regclass) THEN
      CREATE TRIGGER ${RELATION_CACHE_TABLE}_no_update_delete BEFORE UPDATE OR DELETE ON ${RELATION_CACHE_TABLE} FOR EACH ROW EXECUTE FUNCTION ${RELATION_CACHE_TABLE}_immutable();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${RELATION_CACHE_TABLE}_no_truncate' AND tgrelid = '${RELATION_CACHE_TABLE}'::regclass) THEN
      CREATE TRIGGER ${RELATION_CACHE_TABLE}_no_truncate BEFORE TRUNCATE ON ${RELATION_CACHE_TABLE} FOR EACH STATEMENT EXECUTE FUNCTION ${RELATION_CACHE_TABLE}_immutable();
    END IF;
  END $$`
] as const;

export async function registerRelationCacheSchema(sql: Sql): Promise<readonly string[]> {
  for (const statement of RELATION_CACHE_DDL) await sql.unsafe(statement);
  return [RELATION_CACHE_TABLE];
}

const CHUNK = 500;
/** What two evaluations of the same pair must share to count as the same result (the run-bound fields excluded). */
const resultOf = (record: CachedRelation) => canonicalJson({ ...record, createdAt: null, rawOutputSha256: null });

export class PostgresRelationCacheRepository implements RelationCacheReader {
  constructor(private readonly sql: Sql) {}

  /** Every row is admitted again; a row whose record fails or names another key is refused (ERR_RELATION_CACHE_RECORD_CORRUPT). */
  async getByKeys(keys: string[]): Promise<CachedRelation[]> {
    const distinct = [...new Set(keys)];
    const out: CachedRelation[] = [];
    for (let at = 0; at < distinct.length; at += CHUNK) {
      const rows = await this.sql<{ relation_key: string; record_json: string }[]>`SELECT relation_key, record_json FROM career_proposal_requirement_relations WHERE relation_key = ANY(${distinct.slice(at, at + CHUNK)})`;
      for (const row of rows) {
        let record: CachedRelation;
        try { record = JSON.parse(row.record_json) as CachedRelation; assertCachedRelation(record); } catch { throw new Error(`ERR_RELATION_CACHE_RECORD_CORRUPT:${row.relation_key}`); }
        if (record.relationKey !== row.relation_key) throw new Error(`ERR_RELATION_CACHE_RECORD_CORRUPT:${row.relation_key}`);
        out.push(record);
      }
    }
    return out;
  }

  /**
   * First wins. `inserted`: new rows. `duplicates`: the key existed with the same result. `divergent`: the key existed with another
   * result (model nondeterminism for an identical input) — reported, never stored; the first record stays.
   */
  async saveIfAbsent(records: CachedRelation[]): Promise<{ inserted: number; duplicates: number; divergent: string[] }> {
    let inserted = 0, duplicates = 0;
    const divergent: string[] = [];
    for (const record of records) {
      assertCachedRelation(record);
      const stored = canonicalJson(record);
      const rows = await this.sql<{ relation_key: string }[]>`
        INSERT INTO career_proposal_requirement_relations (relation_key, proposal_content_hash, requirement_content_hash, engine_version_hash, relation_state, authority_state, record_json, created_at)
        VALUES (${record.relationKey}, ${record.proposalContentHash}, ${record.requirementContentHash}, ${record.engineVersionHash}, ${record.state}, ${record.authorityState}, ${stored}, ${record.createdAt})
        ON CONFLICT (relation_key) DO NOTHING RETURNING relation_key`;
      if (rows.length === 1) { inserted += 1; continue; }
      const [first] = await this.getByKeys([record.relationKey]);
      if (first && resultOf(first) === resultOf(record)) duplicates += 1; else divergent.push(record.relationKey);
    }
    return { inserted, duplicates, divergent };
  }
}
