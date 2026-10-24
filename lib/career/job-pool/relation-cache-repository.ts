import type { Sql } from "postgres";
import { assertCachedRelation, canonicalJson, type CachedRelation, type RelationCacheReader } from "./relation-cache";

/**
 * PostgreSQL store of the content-addressed relation cache (PROPOSAL_REQUIREMENT_RELATION_CACHE_V1). One immutable row per relation
 * key; the record is kept as canonical JSON text next to the indexed identity columns. The table is created only through
 * `ensureJobPoolPersistenceRegistration` (positively verified disposable database, boundary B-ENTRY); on any other database no DDL
 * runs. No UPDATE, no DELETE: an existing key with a different record is refused.
 */
export const RELATION_CACHE_TABLE = "career_proposal_requirement_relations";

export const RELATION_CACHE_DDL = [
  `CREATE TABLE IF NOT EXISTS ${RELATION_CACHE_TABLE} (
    relation_key text PRIMARY KEY,
    proposal_content_hash text NOT NULL,
    requirement_content_hash text NOT NULL,
    engine_version_hash text NOT NULL,
    relation_state text NOT NULL CHECK (relation_state IN ('EQUIVALENT', 'COVERS', 'PARTIAL', 'DIFFERENT', 'UNCLEAR')),
    authority_state text NOT NULL CHECK (authority_state = 'NONE'),
    record_json text NOT NULL,
    created_at text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS ${RELATION_CACHE_TABLE}_requirement_idx ON ${RELATION_CACHE_TABLE} (requirement_content_hash, engine_version_hash)`,
  `CREATE INDEX IF NOT EXISTS ${RELATION_CACHE_TABLE}_proposal_idx ON ${RELATION_CACHE_TABLE} (proposal_content_hash, engine_version_hash)`
] as const;

export async function registerRelationCacheSchema(sql: Sql): Promise<readonly string[]> {
  for (const statement of RELATION_CACHE_DDL) await sql.unsafe(statement);
  return [RELATION_CACHE_TABLE];
}

const CHUNK = 500;

export class PostgresRelationCacheRepository implements RelationCacheReader {
  constructor(private readonly sql: Sql) {}

  async getByKeys(keys: string[]): Promise<CachedRelation[]> {
    const distinct = [...new Set(keys)];
    const out: CachedRelation[] = [];
    for (let at = 0; at < distinct.length; at += CHUNK) {
      const rows = await this.sql<{ record_json: string }[]>`SELECT record_json FROM career_proposal_requirement_relations WHERE relation_key = ANY(${distinct.slice(at, at + CHUNK)})`;
      for (const row of rows) out.push(JSON.parse(row.record_json) as CachedRelation);
    }
    return out;
  }

  /** Stores each record once. Returns how many were new; an existing key with identical content is a no-op, with other content an error. */
  async saveIfAbsent(records: CachedRelation[]): Promise<{ inserted: number; existing: number }> {
    let inserted = 0, existing = 0;
    for (const record of records) {
      assertCachedRelation(record);
      const json = canonicalJson(record);
      const rows = await this.sql<{ relation_key: string }[]>`
        INSERT INTO career_proposal_requirement_relations (relation_key, proposal_content_hash, requirement_content_hash, engine_version_hash, relation_state, authority_state, record_json, created_at)
        VALUES (${record.relationKey}, ${record.proposalContentHash}, ${record.requirementContentHash}, ${record.engineVersionHash}, ${record.state}, ${record.authorityState}, ${json}, ${record.createdAt})
        ON CONFLICT (relation_key) DO NOTHING RETURNING relation_key`;
      if (rows.length === 1) { inserted += 1; continue; }
      const [stored] = await this.sql<{ record_json: string }[]>`SELECT record_json FROM career_proposal_requirement_relations WHERE relation_key = ${record.relationKey}`;
      if (!stored || stored.record_json !== json) throw new Error(`ERR_RELATION_CACHE_CONFLICT:${record.relationKey}`);
      existing += 1;
    }
    return { inserted, existing };
  }
}
