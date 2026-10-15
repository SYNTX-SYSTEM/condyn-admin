# Drei Untersuchungsmodi — PERSON · PERSON × JOB · JOB

Stand: 2026-10-15. Architekturentscheidung von GELB, Owner-GO vom selben Tag („Drei-Modi-Architektur freigegeben“).

## 1. Invariante

**Keine Analyse ohne explizite Untersuchungsgrenze.** Ein Job-Scope ist nur dort erforderlich, wo der gewählte Modus ihn verlangt. Sie ersetzt die frühere Formulierung „kein Gemini-Aufruf ohne gültigen, ausgewählten Job-Scope“. Für PERSON × JOB gilt JOB POOL FIRST unverändert.

| Modus | Subjekt | Einzige Evidence | Gemini | Ergebnis |
|---|---|---|---|---|
| PERSON | Person, unabhängig von einer Stelle | Kandidaten-PDFs | Discovery und Convergence ohne Scope; Prompt und RUN-Kennung wie vor e643e96 | Capability-Vorschläge (PROPOSED, Autorität NONE); kein Jobvergleich |
| PERSON_X_JOB | Person im Scope der gewählten Stelle | Kandidaten-PDFs; der Scope ist nur Untersuchungsraum | wie e643e96 | Vorschläge und B2-Rollenabdeckung (`SELECTED_ROLE_COVERAGE.md`) |
| JOB | Stelle, unabhängig von einer Person | Pool-Quelle der Rolle | keiner (Stufe 1) | `JOB_STRUCTURE_V1` (Abschnitt 4) |

## 2. Ausstellung der Grenze

| Datei | Rolle |
|---|---|
| `lib/career/investigation/boundary.ts` | Erklärung `investigation: { mode }`. PERSON wird wie ein Job-Scope ausgestellt (WeakSet, eingefroren), nie aus einem fehlenden Feld abgeleitet. `assertIssuedAnalysisBoundary` nimmt nur eine ausgestellte PERSON-Grenze oder einen ausgestellten Job-Scope an. Alles andere wird genau wie bisher mit `ERR_JOB_SCOPE_REQUIRED` abgelehnt. |
| `lib/career/investigation/context.ts` | Worker-Kontext der PERSON-Grenze; `requireActiveAnalysisBoundary` |
| `app/api/career/analyze/route.ts` | Annahme des Requests |
| `lib/career/job-scope/worker-boundary.ts` | erneute Prüfung bei jedem Abholen durch den Worker |
| `orchestration/capability-proposal-executor.ts` | Executor-Grenze vor Discovery |
| `lib/career/pipeline.ts` | Legacy-Pipeline: nimmt `{ jobScope }` oder `{ investigation }`, nie beides |
| `scripts/run-career-worker.ts` | Provider-Wächter mit der aktiven Grenze |

**Analyze-Body**

| Erklärung | Ergebnis |
|---|---|
| ohne `investigation`, mit `jobScope` | PERSON_X_JOB (unverändert) |
| ohne `investigation`, ohne `jobScope` | 400 `ERR_JOB_SCOPE_REQUIRED`, „Bitte wähle einen Job aus einem Pool aus.“ |
| `{ mode: "PERSON_X_JOB" }` + `jobScope` | wie oben; ungültige Pools oder Rollen 422 `ERR_JOB_SCOPE_INVALID` |
| `{ mode: "PERSON" }` ohne `jobScope` | 202; die Erklärung wird mit dem Auftrag gespeichert |
| `{ mode: "PERSON" }` + `jobScope`, fehlerhafte Erklärung | 400 `ERR_INVESTIGATION_INVALID`, „Bitte wähle eine eindeutige Untersuchungsgrenze.“ |
| `{ mode: "JOB" }` | 400 `ERR_INVESTIGATION_MODE_NOT_ANALYZABLE` (JOB ist keine Dokumentanalyse) |

Bei jeder Ablehnung wird nichts eingereiht. Der Worker prüft bei jedem Abholen erneut. Widersprüchliche Erklärungen scheitern endgültig vor dem Prozessor. Skripte bleiben an einen Job gebunden.

## 3. Trennung der Grenzen

- **Identität:**
  - PERSON-Läufe tragen keinen Scope-Hash, PERSON_X_JOB-Läufe genau einen.
  - Läufe, bestätigte Stände (Snapshot-Schlüssel, 933ea4c) und Austausche werden nur innerhalb derselben Grenze wiederverwendet.
- **Ergebnis:**
  - B2 lehnt PERSON ab (`ERR_JOB_COMPARISON_NOT_SCOPED`).
  - JOB liest keine Analyse.
  - Der Inspector zeigt `investigationMode`.
- **Evidence:** PERSON und PERSON_X_JOB stützen sich nur auf die Kandidaten-PDFs, JOB nur auf die Pool-Quelle.
- **Autorität:** überall PROPOSED bzw. PROPOSAL_ONLY, Autorität NONE, NOT_EVALUATED, `scored: false`. Nichts erscheint als verifiziert.

## 4. JOB ONLY, Stufe 1 (`JOB_STRUCTURE_V1`)

`GET /api/career/job-pools/{jobPoolUploadId}/roles/{poolRoleId}/structure` (`lib/career/job-pool/job-structure.ts`)

**Inhalt**
- Organisation, Rolle und Rollenprofil.
- `responsibilityScope` ist `NOT_DECLARED`, solange der deterministische Provider nichts interpretiert.
- Die Requirements der Rolle mit Notwendigkeit, Level-Zustand, Eignung für den Abgleich, kanonischen Validierungszuständen und Belegzeilen aus der Pool-Quelle.
- Strukturbefunde als Codes:
  - **Rolle:** `ROLE_DESCRIPTION_MISSING`, `ROLE_SENIORITY_UNDECLARED`, `ROLE_DOMAIN_FOCUS_UNDECLARED`, `ROLE_RESPONSIBILITY_NOT_DECLARED`, `ROLE_WITHOUT_REQUIRED_REQUIREMENT`.
  - **Requirement:** `REQUIREMENT_NECESSITY_UNDECLARED`, `REQUIREMENT_LEVEL_UNRESOLVED`, `REQUIREMENT_MATCHING_INELIGIBLE`, `REQUIREMENT_MATCHING_ELIGIBILITY_UNKNOWN`, `REQUIREMENT_TYPE_UNDECLARED`, `REQUIREMENT_ZERO_WEIGHT`, `REQUIREMENT_DOMAIN_UNDECLARED`, `REQUIREMENT_NAME_COLLISION`.
  - Befunde sind Tatsachen der Deklaration, keine Bewertung.

**Fehler**
- 409 `ERR_JOB_STRUCTURE_UNAVAILABLE`: unbekannter Pool, fremde Rolle oder Pool nicht ACTIVE.
- 409 `ERR_JOB_STRUCTURE_LINEAGE_INVALID`.
- 503 ohne Pool-Persistenz.

**Stufe 2 (eigenes GO):** ein Gemini-Provider für den bestehenden Vertrag `TargetRoleReconstructionProvider`, mit Verantwortung und Interpretation aus der Rollenquelle samt Belegzeilen. Modellbasierte „strukturelle Probleme“ wären ein neuer Vertrag.

## 5. GEMINI OUTPUT Inspector

Siehe `GEMINI_RESULT_INSPECTOR.md`. Für GRÜN vorbereitet:
- der browsertaugliche Client `lib/career/result-inspector/client.ts` (strenge Decoder, Token pro Aufruf, nichts gespeichert);
- die Integrationsanleitung neben BOUNDARY (§6 dort).

Im Modus JOB gibt es keinen Gemini-Austausch.

## 6. Unverändert

Kernel, Prompts, Ausgabeschemata, Phase-4, Evidence-Validator, Projektion, Matches-Route, Demo-Matching, Frontend-Decoder und GRÜN-Dateien bleiben unverändert, ebenso die Siegeltests P7 und P8. Skripte bleiben an einen Job gebunden.

## 7. Umsetzung

| Commit | Inhalt |
|---|---|
| `e98a40c` | Archivtext verlustfrei (PINK O-EXCHANGE-NUL) |
| `2e5e852` | Untersuchungsgrenze, PERSON ONLY |
| `ea01bfc` | B2 |
| `0b23045` | JOB ONLY, Stufe 1 |
| dieser Commit | Inspector-Client und Doku |

## 8. Offene Relationen

- **Frontend (GRÜN, eigenes Mandat):** Moduswahl, B2-Anzeige, JOB-Strukturansicht, GEMINI-OUTPUT-Panel.
- **JOB ONLY, Stufe 2** (Gemini) und modellbasierte Strukturprobleme.
- **Bestätigtes Mapping:** Phase-4 und T6B brauchen HIA-1 und HIA-2.
- **Legacy und Demo-Matching:** Der pool-weite Legacy-Vergleich und das Demo-Matching bleiben technisch unverändert. Sie werden nicht als rollenbezogenes Ergebnis ausgegeben.
- **Zugriff:** Die Career-Routen haben weiterhin keine Anmeldung.
