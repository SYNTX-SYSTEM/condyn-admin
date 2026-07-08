import {
  SemanticEntityRecord,
  SemanticSearchOptions,
  SemanticSearchResultItem
} from "./types";
import { SemanticSearchStore, InMemorySemanticStore } from "./store";

export interface PgVectorStoreOptions {
  sql?: any;
  inMemoryFallback?: boolean;
}

/**
 * Server-Side PostgreSQL `pgvector` Semantic Vector Store ("Dumb Consumer" boundary).
 * Implements canonical `SemanticSearchStore` contract polymorphically.
 * Supports transparent fallback to deterministic InMemorySemanticStore for unit tests and local/offline execution.
 */
export class PgVectorStore implements SemanticSearchStore {
  private sql?: any;
  private fallbackStore: InMemorySemanticStore;
  private useFallback: boolean;

  constructor(options?: PgVectorStoreOptions) {
    this.sql = options?.sql;
    this.fallbackStore = new InMemorySemanticStore();
    this.useFallback =
      options?.inMemoryFallback === true ||
      (!this.sql && process.env.RUN_PGVECTOR_TESTS !== "true");
  }

  /**
   * Initializes the `career_embeddings` PostgreSQL table and pgvector extension if running against live DB.
   */
  async initSchema(): Promise<void> {
    if (this.useFallback || !this.sql) {
      return;
    }

    await this.sql.unsafe(`
      CREATE EXTENSION IF NOT EXISTS vector;
      CREATE TABLE IF NOT EXISTS career_embeddings (
        id TEXT PRIMARY KEY,
        analysis_id TEXT,
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        text TEXT NOT NULL,
        embedding vector(768) NOT NULL,
        metadata JSONB,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_career_embeddings_type ON career_embeddings (entity_type);
      CREATE INDEX IF NOT EXISTS idx_career_embeddings_analysis ON career_embeddings (analysis_id);
    `);
  }

  async upsert(record: SemanticEntityRecord): Promise<void> {
    if (!record || !record.entityId) {
      throw new Error("ERR_INVALID_SEMANTIC_RECORD: entityId is required.");
    }

    if (this.useFallback || !this.sql) {
      return this.fallbackStore.upsert(record);
    }

    const vectorString = `[${record.vector.join(",")}]`;
    const now = new Date().toISOString();
    const id = `${record.entityType}_${record.entityId}`;

    await this.sql`
      INSERT INTO career_embeddings (
        id,
        analysis_id,
        entity_id,
        entity_type,
        text,
        embedding,
        metadata,
        created_at
      ) VALUES (
        ${id},
        ${record.analysisId || null},
        ${record.entityId},
        ${record.entityType},
        ${record.text},
        ${vectorString}::vector,
        ${record.metadata ? JSON.stringify(record.metadata) : null}::jsonb,
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        text = EXCLUDED.text,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        analysis_id = EXCLUDED.analysis_id
    `;
  }

  async search(
    queryVector: number[],
    options?: SemanticSearchOptions
  ): Promise<SemanticSearchResultItem[]> {
    if (this.useFallback || !this.sql) {
      return this.fallbackStore.search(queryVector, options);
    }

    const topK = options?.topK ?? 10;
    const minSim = options?.minSimilarity ?? 0.0;
    const targetType = options?.entityType || null;
    const targetAnalysisId = options?.analysisId || null;

    const queryVectorString = `[${queryVector.join(",")}]`;

    const rows = await this.sql`
      SELECT
        entity_id,
        entity_type,
        text,
        metadata,
        analysis_id,
        1 - (embedding <=> ${queryVectorString}::vector) AS similarity_score
      FROM career_embeddings
      WHERE
        (${targetType}::text IS NULL OR entity_type = ${targetType})
        AND (${targetAnalysisId}::text IS NULL OR analysis_id = ${targetAnalysisId})
      ORDER BY embedding <=> ${queryVectorString}::vector
      LIMIT ${topK}
    `;

    return rows
      .map((r: any) => ({
        entityId: r.entity_id,
        entityType: r.entity_type,
        text: r.text,
        similarityScore: Number(r.similarity_score),
        metadata: r.metadata,
        analysisId: r.analysis_id
      }))
      .filter((item: SemanticSearchResultItem) => item.similarityScore >= minSim);
  }
}
