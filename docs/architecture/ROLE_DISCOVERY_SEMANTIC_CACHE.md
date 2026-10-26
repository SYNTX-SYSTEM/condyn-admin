# Role Discovery semantic relation path

The existing `relation-cache.ts` is the semantic boundary. `GeminiSemanticRelationProvider` adapts the already-used Gemini provider to its immutable, evidence-bearing records; `evaluateSemanticRelations` validates and persists those records through `PostgresRelationCacheRepository`. The route uses explicit role-discovery engine variables when present and otherwise reuses the existing `GEMINI_API_KEY` + `GEMINI_MODEL` runtime with the pinned `ROLE_DISCOVERY_SEMANTIC_PROMPT_V1` contract:

`ROLE_DISCOVERY_SEMANTIC_PROVIDER`, `ROLE_DISCOVERY_SEMANTIC_MODEL`, and `ROLE_DISCOVERY_SEMANTIC_PROMPT_SHA256`.

Without a configured model the route remains lexical-only and reports `ENGINE_NOT_SPECIFIED`. With Gemini configured, cached pairs are reused, only pending role batches are sent to Gemini, and `rankSemanticRoles` emits deterministic presentation scores only for complete cache coverage. Scores remain `authorityState: NONE`; they are not qualification, hiring, or decision state. Missing evidence or malformed provider output fails closed.
