# B2 — Rollenbezogene Abdeckung (`SELECTED_ROLE_COVERAGE_V1`)

Stand: 2026-10-15. Owner-Entscheidung B2: eine deterministische, unbestätigte Namensabdeckung für ausschließlich die ausgewählte Rolle einer PERSON_X_JOB-Analyse.

## Request

`GET /api/career/analyses/{analysisId}/job-comparison?jobPoolUploadId={id}&poolRoleId={id}`

- Beide Parameter sind Pflicht. Der Aufrufer nennt die Auswahl, die er anzeigt.
- Der Server leitet nichts ab und kennt keinen Standardwert.
- Werte werden nicht getrimmt.

## Antwort 200 (`Cache-Control: no-store`)

```jsonc
{ "success": true, "comparison": {
  "comparisonVersion": "SELECTED_ROLE_COVERAGE_V1",
  "binding": { "analysisId", "jobId", "jobPoolUploadId", "poolRoleId", "investigationScopeHash",
               "discoveryRunId", "convergenceRunId", "poolCanonicalSha256", "poolVersion", "targetRoleProfileRevisionId" },
  "role": { "poolRoleId", "title", "poolOrganizationId", "organizationName" },
  "authority": { "comparisonBasis": "CAPABILITY_PROPOSAL_NAME_COVERAGE", "operand": "CAPABILITY_PROPOSAL_PROJECTION",
                 "scored": false, "authorityState": "NONE",
                 "capabilityRequirementRelationState": "NOT_EVALUATED", "reason": "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" },
  "requirements": [{ "poolRequirementId", "capabilityName", "aliases", "domain", "requiredLevel", "weight",
                     "necessityState", "requirementType", "matchingEligibility", "targetRequirementRevisionId",
                     "coverage": { "state": "COVERED", "proposal": JobPoolSweepProposalCoverage }
                               | { "state": "NOT_COVERED", "proposal": null } }],
  "proposals": [{ "id", "name", "scope", "coversPoolRequirementIds": [] }],
  "counts": { "requirements", "covered", "notCovered", "proposals" }
}}
```

**`proposal`** hat genau die Form der bestehenden Sweep-Abdeckung: `capabilityProposalId`, `name`, `matchBasis` (`EXACT`, `ALIAS`, `COMPOSITE_CONSTITUENT`, `TOKEN_CONTAINMENT`), `matchedConstituent`, `evidence` als `[{ docId, quote }]` (wörtliche Zitate aus den Kandidaten-PDFs), `evidenceState: "SOURCE_MATCH_VERIFIED"`, `authorityState: "NONE"`, `scored: false`.

- `TOKEN_CONTAINMENT` ist eine Heuristik und als schwache Abdeckung zu zeigen.
- `requirementType` ohne Angabe im Pool ist `CAPABILITY` (kanonische Vorgabe).
- `counts` sind Zählungen, kein Score.

## Invarianten

1. **Scope:** In dieser Reihenfolge wird geprüft; jede Prüfung lehnt ab, keine fällt zurück:
   - die Projektionsreferenz der Analyse;
   - die Kette Lauf → Convergence → Auftrag;
   - der Auftrag ist PERSON_X_JOB, und der Lauf trägt einen Scope;
   - die angefragte Auswahl ist zeichengleich mit der gespeicherten;
   - der heute aufgelöste Scope ergibt, gerendert, exakt den Scope-Hash des Discovery-Laufs.
2. **Gewählte Rolle:** Nur die Requirements der gewählten Rolle erscheinen, in Pool-Reihenfolge, nie andere Rollen.
3. **Operand:** ausschließlich die Capability-Vorschläge der Analyse (Convergence-Ebene). Nie die Legacy-Analyse, nie der pool-weite Vergleich, nie der Demo-Pool.
4. **Evidence:** nur die vorhandenen, gegen die Quellen geprüften Zitate. Der Scope-Text ist nie Evidence.
5. **Vorschläge:** Alle Vorschläge erscheinen in `proposals`, auch solche, die nichts abdecken.
6. **Autorität:** fest wie oben. Es gibt keine kanonische Capability-Requirement-Relation, kein Ranking und keinen Score.
7. **Lesen:** Lesen ruft Gemini nie auf.

## Fehler (`{ success: false, issues: [{ code }] }`, `no-store`, ohne Fehlertext)

| Status | Code | Fall |
|---|---|---|
| 400 | `ERR_JOB_COMPARISON_SELECTION_REQUIRED` | Parameter fehlen oder sind leer |
| 404 | `ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND` | keine Projektionsreferenz |
| 409 | `ERR_JOB_COMPARISON_LINEAGE_INVALID` | Referenz, Läufe oder Auftrag passen nicht zusammen |
| 409 | `ERR_JOB_COMPARISON_NOT_SCOPED` | PERSON-Analyse oder Lauf ohne Scope |
| 409 | `ERR_JOB_COMPARISON_SCOPE_MISMATCH` | angefragte Auswahl ≠ Auswahl der Analyse (Scopewechsel) |
| 409 | `ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE` | Pool nicht mehr ACTIVE oder Rolle nicht mehr auflösbar |
| 409 | `ERR_JOB_COMPARISON_SCOPE_DRIFT` | neu gerenderter Scope-Hash ≠ Hash des Laufs |
| 503 | `ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED` | keine Pool-Persistenz (bestehende Sperre B-ENTRY) |
| 500 | `ERR_JOB_COMPARISON_FAILED` | sonstiger Fehler |

## Invalidierung bei Scopewechsel

- **Server:** Eine andere Auswahl als die der Analyse ergibt immer 409 `SCOPE_MISMATCH`. Alte Vergleichsdaten können für eine neue Auswahl nicht gültig ausgeliefert werden.
- **Client (GRÜN, eigenes Mandat):** Er legt Daten nach `binding` ab und zeigt sie nur, wenn `binding` gleich der aktuellen Auswahl ist.
  - Bei jeder Änderung verwirft er die Daten, bricht laufende Anfragen ab und ignoriert späte Antworten.
  - Bei 409 zeigt er „Analyse gehört zu einem anderen Job“.

## Zugriff

Wie die bestehenden Career-Routen: ohne Anmeldung, über `deploy/nginx` nicht öffentlich erreichbar. Die Antwort enthält Lebenslauf-Zitate wie die bestehende Analyse-Route.

## Dateien

| Datei | Inhalt |
|---|---|
| `lib/career/job-scope/analysis-scope.ts` | Bindung und Fehler |
| `lib/career/job-pool/selected-role-coverage.ts` | reine Funktion, nutzt `findSweepCoverage` |
| `app/api/career/analyses/[analysisId]/job-comparison/route.ts` | Route |
| `test/career/job-pool/selected-role-coverage.test.ts`, `test/career/job-pool/job-comparison.postgres.test.ts` | Tests |

Unverändert bleiben `presentation-matching.ts`, `types.ts`, die Matches-Route, die Analyse-Route mit dem Demo-Pool und der Frontend-Decoder.
