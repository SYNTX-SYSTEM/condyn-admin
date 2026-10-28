> **SUPERSEDED (GELB recovery, 2026-10-28) — kept as history, does not describe the current code.**
> The behaviour described here was reverted on `recovery/role-discovery`: automatic use of every ACTIVE pool (d821bb6),
> legacy `/matches` resonance candidates under PERSON incl. the `?discovery=PERSON` bypass of the PERSON refusal (993397e,
> eff2480, 887da98), and Gemini relation evaluation plus ranking inside the read-only GET route without budget, explicit start or
> evidence-id citation (d4616c7). Reasons and the current contract: `docs/career_analysis/CONDYN_DLL_SYSTEM_RECOVERY_2026-10-28.md`.

# Role Discovery semantic relation path

The existing `relation-cache.ts` is the semantic boundary. `GeminiSemanticRelationProvider` adapts the already-used Gemini provider to its immutable, evidence-bearing records; `evaluateSemanticRelations` validates and persists those records through `PostgresRelationCacheRepository`. The route uses explicit role-discovery engine variables when present and otherwise reuses the existing `GEMINI_API_KEY` + `GEMINI_MODEL` runtime with the pinned `ROLE_DISCOVERY_SEMANTIC_PROMPT_V1` contract:

`ROLE_DISCOVERY_SEMANTIC_PROVIDER`, `ROLE_DISCOVERY_SEMANTIC_MODEL`, and `ROLE_DISCOVERY_SEMANTIC_PROMPT_SHA256`.

Without a configured model the route remains lexical-only and reports `ENGINE_NOT_SPECIFIED`. With Gemini configured, cached pairs are reused, only pending role batches are sent to Gemini, and `rankSemanticRoles` emits deterministic presentation scores only for complete cache coverage. Scores remain `authorityState: NONE`; they are not qualification, hiring, or decision state. Missing evidence or malformed provider output fails closed.
