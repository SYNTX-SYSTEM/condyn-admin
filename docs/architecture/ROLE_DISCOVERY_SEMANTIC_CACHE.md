# Role Discovery semantic relation path

The existing `relation-cache.ts` is the semantic boundary. `GeminiSemanticRelationProvider` adapts the already-used Gemini provider to its immutable, evidence-bearing records; `evaluateSemanticRelations` validates and persists those records through `PostgresRelationCacheRepository`. The route executes only when all three explicit engine variables are configured:

`ROLE_DISCOVERY_SEMANTIC_PROVIDER`, `ROLE_DISCOVERY_SEMANTIC_MODEL`, and `ROLE_DISCOVERY_SEMANTIC_PROMPT_SHA256`.

Without that configuration the route remains lexical-only and reports `ENGINE_NOT_SPECIFIED`; a secret alone never enables an untracked model path. With configuration, cached pairs are reused, only pending role batches are sent to Gemini, and `rankSemanticRoles` emits deterministic presentation scores only for complete cache coverage. Scores remain `authorityState: NONE`; they are not qualification, hiring, or decision state. Missing evidence or malformed provider output fails closed.
