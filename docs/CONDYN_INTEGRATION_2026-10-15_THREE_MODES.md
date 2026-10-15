# CONDYN Integration 2026-10-15 — Drei Untersuchungsmodi

Owner-GO „SFE — GELB | OWNER INTEGRATION GO“ vom 2026-10-15: kontrollierte Integration des unabhängig geprüften Drei-Modi-Stands, einschließlich B2, JOB ONLY, GEMINI OUTPUT, URL-Boundary und der abgestimmten PINK-Änderungen.

Integrationszweig ist `integration/job-field-governance`, Basis `311d6ee`. `main` bleibt unberührt.

**Ausgeschlossen:**
- Deployment und öffentliche Freigabe;
- Live-Gemini;
- jede Änderung an der Owner-Umgebung :3017 (`5898def`), an der isolierten Demo :41831 und an fremden Datenbanken.

## 1. Integrierte Stände

| Merge | Quelle | Inhalt |
|---|---|---|
| `82d2f47` | GRÜN `frontend/three-modes` `8718e3a` | GELB `feature/job-pool-first-boundary` bis `4e72260` und GRÜNs Job-Field- und Drei-Modi-Frontend `ca11794`…`8718e3a` |
| `fd11389` | PINK `validation/hr-decision-loop-pink` `c5b323f` | PINKs Prüfprotokolle §3.17–§3.40, Abnahmeplan 1.9.1, die Fixture der Job-Scope-Sperre mit persistiertem Auftrag sowie die pdf-path-Änderung `d4f61c1` |

Beide Merges liefen konfliktfrei. Der Baum von `82d2f47` ist identisch mit einem vorab gemachten Probe-Merge. Die Abhängigkeiten (`package.json` und Lockfile) sind unverändert.

**Fachlicher Inhalt** (Prüfungen von PINK, §3.30–§3.39):
- **Job-Scope und Identität:**
  - Job-Scope in Capability Discovery (`e643e96`);
  - Scope-Identität in Snapshot-Schlüsseln (`933ea4c`).
- **Gemini-Austausch:**
  - Result Inspector (`9e54662`), Lesegrenze standardmäßig geschlossen;
  - Archiv der Gemini-Austausche (`dfb4b63`, `e98a40c`), opt-in, mit Aufbewahrungsfrist und Löschung.
- **Untersuchungsgrenze PERSON / PERSON_X_JOB / JOB:** `2e5e852`, Invariante vom Owner bestätigt (PINK §3.35).
- **Vergleich und Struktur:**
  - B2-Rollenabdeckung (`ea01bfc`);
  - JOB ONLY Stufe 1 (`0b23045`).
- **Frontend-Schnittstellen:**
  - GEMINI-OUTPUT-Client (`6a30220`);
  - persistierte Untersuchungsgrenze einer Analyse, „URL-Boundary“ (`26df225`, `d54c718`).
- **GRÜNs Frontend:**
  - Moduswahl, B2-Anzeige, JOB-Struktur, GEMINI-OUTPUT-Panel;
  - URL-Boundary (`da59568`): ein älterer Vergleich nur bei RESOLVED PERSON_X_JOB im untersuchten Pool.

Dokumentation: `docs/career_analysis/THREE_INVESTIGATION_MODES.md`, `SELECTED_ROLE_COVERAGE.md`, `GEMINI_RESULT_INSPECTOR.md`, `JOB_POOL_FIRST_BOUNDARY.md`, `JOB_FIELD_FRONTEND.md`.

## 2. Prüfungen auf dem Integrationsstand (GELB)

Alle Läufe fanden auf Wegwerf-Datenbanken unter der Testrolle statt, ohne Gemini. Gemini-Variablen waren entweder ungesetzt oder Platzhalter.

| Prüfung | Ergebnis |
|---|---|
| Volle Suite (ohne E2E) | 2627 grün, 28 rot: 27 bekannte Rotfälle der Baseline in 4 Lifecycle-/Policy-Dateien und ein Timeout unter Last (`career-outcome-valence-feedback-context-revision-persistence`, einzeln zweimal 6/6) |
| `tsc --noEmit` | 0 Fehler (die pdf-path-Zeile ist geschlossen) |
| pdf-path-Nachweis (PINK) | 2/2 |
| Echter Next-Server, drei Modi | 11/11, 0 Netzwerkversuche |
| Echter Next-Server, URL-Boundary | 15/15, 0 Netzwerkversuche |
| Echter Worker, Job-Scope-Grenze | bestanden (`docs/proofs/job-pool-first-boundary/2026-10-15-integration-worker-no-gemini.json`) |
| Alle Skriptpfade | bestanden, 0 Netzwerkversuche (`…-integration-all-paths-no-gemini.json`) |
| E2E-Suiten | 32 grün, 3 rot (PINK `syntx-walk.e2e`, schon vor der Integration rot), 1 übersprungen (Live); siehe §3 |
| Lint (pro Datei gegen `311d6ee`) | keine neuen Fehler in GELB-Dateien. Neu sind 55 Fehler in GRÜN- und PINK-Dateien: überwiegend `no-explicit-any` in Tests, dazu einige `react-hooks`-Regeln in `SyntxField.tsx`, `SyntxFieldSelector.tsx`, `useRoleInvestigation.ts`, `useJobScope.ts` und `analyze/page.tsx`. Sie blockieren nicht und sind den Eigentümern gemeldet. |
| Leak-Check des Merge-Bereichs | keine lokalen Pfade, keine Schlüssel. Die einzigen URL-Treffer sind synthetische Test-URLs in PINK-Belegen (`pink:pink@127.0.0.1`, `.invalid`). |

## 3. E2E-Suiten

Lauf auf Wegwerf-Datenbanken, Playwright über `CONDYN_PLAYWRIGHT_MODULE`, ohne Gemini: 6 Dateien ausgeführt, eine übersprungen. 32 Tests grün, 3 rot, 1 übersprungen.

| Suite | Ergebnis |
|---|---|
| GRÜN `job-pool-workflow.e2e` | grün |
| PINK `job-scope-gate.e2e` (mit persistiertem Auftrag für `ANL_PINK_JOB_SCOPE_GATE`) | grün |
| `hr-decision-loop-frontend.e2e` | grün |
| `database-isolation/fail-closed.e2e` | grün |
| `decision-runtime/local-decision-context-http.e2e` | grün |
| PINK `live-browser-workflow.e2e` | übersprungen (braucht Live-Gemini, kein GO) |
| PINK `syntx-walk.e2e` (Q-12) | **3 rot**: Das SYNTX-Feld erreicht nie `data-field-state="AVAILABLE"` |

Den Befund zu `syntx-walk.e2e` habe ich gegengeprüft: GRÜNs geprüfter Stand `8718e3a` allein scheitert identisch. Es ist also keine Regression der Integration. Der Rundgang stammt aus der Zeit vor der Job-Scope-Sperre und öffnet das Feld über `analysisId` und Pool, ohne gewählten Job. Die Sperre (`cb3d33f`/`c146f05`) lässt das Feld dann bewusst nicht AVAILABLE werden. Die Suite gehört PINK; PINK passt sie an. Geschlossen ist der Punkt erst, wenn PINK das bestätigt.

## 4. Separates Delta: serverseitige Ablehnung an `/matches` (noch nicht umgesetzt)

Owner-Vorgabe: Der alte pool-weite Vergleich bleibt vorerst rollenübergreifend. Seine Schnittstelle (`GET /api/career/job-pools/{upload}/matches?analysisId=`) soll ausdrücklich gespeicherte PERSON-Analysen und nicht auflösbare Grenzen künftig serverseitig ablehnen. Vor der Umsetzung ist der Einfluss auf Bestandsaufrufe festzustellen.

**Vorgesehene Regel:**
- Vor dem Laden der Legacy-Analyse wird die persistierte Grenze gelesen (`readPersistedAnalysisInvestigation`, wie bei der URL-Boundary).
- **Abgelehnt** werden:
  - PERSON mit 409;
  - eine nicht auflösbare Grenze mit 409 und dem Grund.
- **Unverändert:**
  - eine unbekannte Analyse bleibt 404 `ERR_ANALYSIS_NOT_FOUND`;
  - PERSON_X_JOB liefert den bisherigen pool-weiten Vergleich, rollenübergreifend.
- **Nicht Teil der Vorgabe:** die Gleichheit des Pools (siehe offene Frage).

**Einfluss auf Bestandsaufrufe** (vollständige Suche über `app/`, `lib/`, `scripts/`, `test/`):

| Aufrufer | Analyse | Folge |
|---|---|---|
| GRÜNs Frontend `lib/career/ui/useJobPool.ts` | ruft nur bei RESOLVED PERSON_X_JOB im eigenen Pool | keine |
| `test/career/job-pool/client-reads.test.ts` | gemockter Fetch | keine |
| GRÜN `job-pool-workflow.e2e` | `ANL_JOB_POOL_E2E_0001` mit persistiertem SUCCEEDED-Auftrag | keine |
| PINK `pdf-path.postgres` | echter Analyze-Ablauf mit Job-Scope | voraussichtlich keine (zu messen) |
| PINK `live-browser-workflow.e2e` | echter UI-Ablauf mit Job-Scope; braucht Live-Gemini | voraussichtlich keine |
| `test/career/job-pool/job-pool.postgres.test.ts` (3 Tests) | `FIXTURE_ANALYSIS_ID` nur im In-Memory-Repository (NODE_ENV=test), ohne Auftrag | **bricht**. Die Fixture braucht eine Postgres-Analysezeile und einen SUCCEEDED-Auftrag mit erklärter Grenze |
| PINK `http-canonical-inverse.postgres` | `ANL_PINK_JOB_POOL_VALIDATION` direkt gespeichert | **bricht**, PINK-Fixture-Diff nötig |
| PINK `syntx-walk.e2e` | `ANL_PINK_SYNTX_WALK` direkt gespeichert | **bricht**, PINK-Fixture-Diff nötig |
| PINK-Skripte für nur lesende Rundgänge (`support/syntx-readonly-walk.mjs`, `lens-readonly-proof.mjs`, `pending-label-readonly-check.mjs`) | Analysen einer bestehenden Umgebung | brechen, sobald eine Umgebung mit vor dem Gate erzeugten Analysen den neuen Code fährt |
| Bestandsdaten | alle Analysen, die vor dem Job-Scope-Gate (`cb3d33f`/`841baab`, 2026-10-14) erzeugt wurden: ohne Erklärung, also NOT_DECLARED; direkt gespeicherte Analysen: NOT_RECORDED | werden an `/matches` abgelehnt. Das betrifft die Daten von :3017 (`5898def`) und :41831 (`337033e`), falls diese Umgebungen je auf den neuen Stand gehoben werden. Beide laufen heute unverändert auf altem Code. |

**Bewertung:** Für den produktiven Aufrufer, GRÜNs Frontend, ist die Sperre folgenlos. Betroffen sind Test-Fixtures ohne Auftrag und Bestandsdaten aus der Zeit vor dem Gate. Die Umsetzung erfolgt getrennt, auf der Spitze dieser Integration: Fixtures in GELB-Dateien passe ich selbst an, PINK erhält Diffs, PINK prüft. Erst danach folgt der Merge in die Integration.

**Offene Frage (Human Authority):** Soll `/matches` auch eine PERSON_X_JOB-Analyse ablehnen, wenn der angefragte Pool nicht der untersuchte ist? Das Frontend tut das bereits; serverseitig ist es nicht Teil der Vorgabe.

## 5. Offene Relationen nach der Integration

- **Lesegrenzen:**
  - O-B2-OPEN-READ: B2 und die JOB-Struktur haben keine eigene Lesegrenze, B2 zeigt Lebenslauf-Zitate. Die Career-Routen haben keine Anmeldung. Es gibt keine öffentliche Freigabe.
  - Die Umgebungen :3017 und :41831 laufen auf altem Code ohne Job-Scope-Gate.
- **Lebenszyklus:**
  - Ein laufender Auftrag wird nicht abgebrochen, wenn eine Rolle entfernt wird.
  - Für Daten der bestehenden Pipeline gibt es keinen Löschpfad.
  - Raw-Antworten von Convergence und Legacy werden nicht archiviert.
- **Weitere Stufen:**
  - JOB ONLY Stufe 2 mit Gemini;
  - bestätigtes Mapping, das an HIA-1 und HIA-2 hängt.
- **Repository-Hygiene:**
  - geerbte lokale Pfade in älteren Dateien und Prüfordnern;
  - die Wurzeldateien `debug.js` und `debug2.js`.
- **Zur Information (PINK):**
  - O-URL-REF-STATUS;
  - Analysen ohne Discovery-Lauf werden ohne Lesen des Pools aufgelöst; das entsteht nur mit inkonsistenten Daten.

## 6. Ablauf

SFE::INTEGRATE → VERIFY → **PINK** → DEMO REVIEW. Als Nächstes prüft PINK diesen Integrationsstand unabhängig.
