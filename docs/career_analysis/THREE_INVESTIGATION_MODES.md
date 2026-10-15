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

## 6. Persistierte Grenze einer Analyse (URL BOUNDARY CLOSURE)

Owner-Auftrag vom 2026-10-15: Eine über die URL geöffnete Analyse trägt keinen eigenen Modus. Das Frontend darf ihn nie aus seinem UI-Zustand ableiten, und eine PERSON-Analyse zeigt keinen Jobvergleich. Die Relation lautet **analysisId → persistierte Untersuchungsgrenze → Frontend-Projektion**.

`GET /api/career/analyses/{analysisId}/investigation` (`lib/career/investigation/persisted.ts`) liefert `ANALYSIS_INVESTIGATION_V1`. Die Antwort ist `no-store`, braucht kein Token und enthält nur Identitäten und den Modus: keine Dokumentinhalte, keine Capabilities, keinen Vergleich, keinen Gemini-Aufruf.

**Auflösung, nur aus persistierten Relationen**
1. Die Analysezeile muss existieren, sonst 404 `ERR_ANALYSIS_INVESTIGATION_NOT_FOUND`.
2. Der Auftrag ergibt sich aus `reference.jobId` der Projektionsreferenz und allen SUCCEEDED-Aufträgen mit `result_analysis_id = analysisId`. Es muss genau einer sein.
3. Geprüft wird `jobId` mit `JOB_` statt `ANL_` gegen `analysisId`, nach der Regel des Job-Prozessors.
4. Den Modus liest `parseDeclaredInvestigation(job.inputRef.sourceData)`, derselbe Parser, der den Auftrag angenommen hat und den der Worker bei jedem Abholen erneut anwendet. Ein Auftrag nach altem Vertrag mit `jobScope` ergibt PERSON_X_JOB, Links auf solche Analysen bleiben also gültig.
5. Mit Projektionsreferenz gilt dieselbe Abstammungsprüfung wie bei B2. Zusätzlich trägt der Discovery-Lauf genau dann einen Scope, wenn der Modus PERSON_X_JOB ist; `basis` ist dann `JOB_DECLARATION_AND_DISCOVERY_RUN`. Ohne Referenz (Wiederverwendung eines Snapshots) lautet `basis` `JOB_DECLARATION`.

**Nicht auflösbar: 409 `ERR_ANALYSIS_INVESTIGATION_UNRESOLVED`** mit `reason`:

| `reason` | Bedeutung |
|---|---|
| `NOT_RECORDED` | kein Auftrag; direkt gespeicherte oder historische Analysen, E2E- und Prüf-Fixtures |
| `NOT_DECLARED` | Auftrag aus der Zeit vor dem Job-Scope-Gate ohne Scope und ohne Erklärung; PERSON wird nie unterstellt |
| `DECLARATION_INVALID` | ungültige oder widersprüchliche Erklärung |
| `AMBIGUOUS` | mehrere Aufträge |
| `LINEAGE_INVALID` | Abstammung gebrochen |
| `RUN_CONTRADICTS_DECLARATION` | Erklärung und Discovery-Lauf widersprechen sich, etwa ein PERSON_X_JOB-Auftrag vor `e643e96`, dessen Discovery ohne Scope lief |

**Frontend-Projektion** (`lib/career/investigation/client.ts`; GRÜN bindet ihn im eigenen Mandat ein)
- `readAnalysisInvestigation` liefert RESOLVED, UNRESOLVED, NOT_FOUND oder FAILED. Der Decoder ist streng, und eine Antwort zu einer anderen analysisId gilt als FAILED.
- `legacyJobComparisonPermitted(read, { analysisId, jobPoolUploadId })` ist nur wahr, wenn alle drei Bedingungen gelten:
  - die Grenze ist aufgelöst;
  - der Modus ist PERSON_X_JOB;
  - der verglichene Pool ist genau der Pool, in dem die Analyse untersucht wurde.
- Der Legacy-Vergleich ist pool-weit und bleibt technisch unverändert (B2). Sein Operand ist der Pool. Ein anderer Pool, auch eine andere Pool-Version, wäre ein Vergleich über Job-Scopes hinweg.
- Den rollengenauen Vergleich liefert B2.
- Solange die Grenze noch gelesen wird, sowie bei PERSON, UNRESOLVED, NOT_FOUND und FAILED gibt es kein Matching.
- Fixtures ohne Auftrag brauchen einen persistierten SUCCEEDED-Auftrag mit deklarierter Grenze.

Die Matches-Route und die Analyse-Route bleiben unverändert. Ein serverseitiger Schutz an `/matches` wäre eine eigene Owner-Entscheidung.

## 7. Unverändert

Kernel, Prompts, Ausgabeschemata, Phase-4, Evidence-Validator, Projektion, Matches-Route, Demo-Matching, Frontend-Decoder und GRÜN-Dateien bleiben unverändert, ebenso die Siegeltests P7 und P8. Skripte bleiben an einen Job gebunden.

## 8. Umsetzung

| Commit | Inhalt |
|---|---|
| `e98a40c` | Archivtext verlustfrei (PINK O-EXCHANGE-NUL) |
| `2e5e852` | Untersuchungsgrenze, PERSON ONLY |
| `ea01bfc` | B2 |
| `0b23045` | JOB ONLY, Stufe 1 |
| `6a30220` | Inspector-Client und Doku |
| `ad15d7b` | Nachweise |
| `26df225` | persistierte Grenze einer Analyse (§6) |
| dieser Commit | Nachweis zu §6 |

## 9. Nachweise (ohne Gemini, 0 Netzwerkversuche)

Die Belege liegen unter `docs/proofs/job-pool-first-boundary/2026-10-15-three-modes-*.json`.

**Echter Next-Server auf einer Wegwerf-Datenbank: 11/11**
- Analyze:
  - PERSON 202;
  - PERSON_X_JOB 202;
  - ohne Grenze 400 mit dem Job-Scope-Satz;
  - PERSON plus Scope 400;
  - JOB 400.
- JOB-Struktur 200, ohne Personendaten.
- B2:
  - 200, `scored: false`, NOT_EVALUATED, die Legacy-Markierung fehlt;
  - eine andere Rolle 409 SCOPE_MISMATCH;
  - eine PERSON-Analyse 409 NOT_SCOPED.
- Der Inspector zeigt PERSON ohne Scope und PERSON_X_JOB mit Scope.

**Persistierte Grenze (§6), echter Next-Server auf einer Wegwerf-Datenbank: 14/14** (`2026-10-15-url-boundary-routes.json`, 0 Netzwerkversuche)
- **Antworten der Route:**
  - PERSON_X_JOB 200 mit deklarierter Auswahl und Scope-Hash;
  - PERSON 200 ohne Auswahl;
  - Auftrag nach altem Vertrag 200 PERSON_X_JOB;
  - Analyse ohne Auftrag 409 NOT_RECORDED;
  - unbekannte Analyse 404.
- **Inhalt:** keine Dokumentinhalte, kein Legacy-Payload.
- **Client gegen den Server:** Die Sperre lässt den Vergleich nur für PERSON_X_JOB im eigenen Pool zu. Kein Vergleich bei PERSON, einem anderen Pool oder einer ungeklärten Grenze.
- **Unverändert:** B2 und die Matches-Route.

**Unverändert grün**
- Alle Skriptpfade (`three-modes-all-paths`): Skripte bleiben an einen Job gebunden.
- Der echte Worker (`three-modes-worker`).

**Volle Suite** (mit PINKs ausstehendem pdf-path-Diff): 2481 grün, 28 rot. Davon sind 27 die bekannten Rotfälle der Baseline. Der übrige ist ein Timeout unter Last in der T13H-Persistenzsuite; einzeln läuft sie 8/8 grün.

## 10. Offene Relationen

- **Frontend (GRÜN, eigenes Mandat):** Moduswahl, B2-Anzeige, JOB-Strukturansicht, GEMINI-OUTPUT-Panel.
- **JOB ONLY, Stufe 2** (Gemini) und modellbasierte Strukturprobleme.
- **Bestätigtes Mapping:** Phase-4 und T6B brauchen HIA-1 und HIA-2.
- **Legacy und Demo-Matching:** Der pool-weite Legacy-Vergleich und das Demo-Matching bleiben technisch unverändert. Sie werden nicht als rollenbezogenes Ergebnis ausgegeben.
- **Zugriff:** Die Career-Routen haben weiterhin keine Anmeldung.
- **Analysen ohne Auftrag** bleiben UNRESOLVED und zeigen keinen Jobvergleich (§6).
- **Rollengleichheit für den Legacy-Vergleich:** strengere Option, Owner-Entscheidung.
