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
| `20c977b` | GELB `feature/matches-boundary-guard` `eacfc97` | das getrennte Delta aus §4: `/matches` lehnt gespeicherte PERSON-Analysen und nicht auflösbare Grenzen serverseitig ab. Gemergt erst nach PINKs Prüfung ohne Abweichung (§3.42) |
| `a3c3759` | PINK `validation/hr-decision-loop-pink` `916e884` | PINK §3.43: `syntx-walk.e2e` an die Invarianten neu gebunden (siehe §2.3); nur diese Testdatei und Belege |
| `73a4701` | PINK `validation/hr-decision-loop-pink` `122aa6c` | PINKs Prüfprotokolle §3.41 (Integration `0fb7b05`) und §3.42 (Delta `eacfc97`) sowie die übernommenen Fixture-Änderungen für `http-canonical-inverse` und `pdf-path`. Der pdf-path-Schritt erwartet 409 und gilt nur zusammen mit `eacfc97`; deshalb wurde `eacfc97` zuerst gemergt |

Alle fünf Merges liefen konfliktfrei. Der Baum von `82d2f47` ist identisch mit einem vorab gemachten Probe-Merge; PINK hat `82d2f47` und `fd11389` baumgleich nachgebaut (§3.41). Die Abhängigkeiten (`package.json` und Lockfile) sind unverändert.

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

### 2.1 Erster Schritt, `0fb7b05`

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
| Leak-Check des Merge-Bereichs | keine Schlüssel. Die einzigen URL-Treffer sind synthetische Test-URLs in PINK-Belegen (`pink:pink@127.0.0.1`, `.invalid`). **Korrektur nach PINK §3.41:** Die ursprüngliche Angabe „keine lokalen Pfade“ war falsch. Im Bereich `311d6ee..0fb7b05` fügen 30 Zeilen in 25 Dateien einen lokalen Pfad `/home/<user>/…` hinzu, alle in GRÜNs `docs/career_analysis/evidence/job-pool/` (Logs und Skripte der Ordner `e2e-sweep-2026-10-13`, `semiotic-transfer`, `capability-gate`, `job-scope`, `job-scope-removal`). Keine davon liegt in GELB- oder PINK-Dateien. Die Dateien sind bereits auf gepushten Zweigen; Bereinigung und History sind Owner-Entscheidung (§5). |

Die beiden Nachweis-JSONs unter `docs/proofs/job-pool-first-boundary/2026-10-15-integration-*.json` hatten in `0fb7b05` `gitSha: null` (PINK §3.41). Sie sind auf `73a4701` neu erzeugt und tragen jetzt diesen Commit (§2.2).

### 2.2 Zweiter Schritt, `73a4701` (Sperre `eacfc97` und PINK `122aa6c`)

Gleiche Bedingungen: Wegwerf-Datenbanken unter der Testrolle, ohne Gemini, Gemini-Variablen ungesetzt oder Platzhalter. Der Code-Baum von `73a4701` ist identisch mit der Spitze dieses Zweigs; danach kamen nur Dokumente und die neu erzeugten Nachweise.

| Prüfung | Ergebnis |
|---|---|
| Volle Suite (ohne E2E) | 2629 grün, 27 rot, 8 übersprungen. Die 27 Rotfälle sind namensgleich mit der Baseline (4 Lifecycle-/Policy-Dateien), diesmal ohne Timeout unter Last |
| `tsc --noEmit` | 0 Fehler (auch der pdf-path-Schritt mit 409, der `eacfc97` voraussetzt) |
| Echter Worker, Job-Scope-Grenze | bestanden, `gitSha` `73a4701` (`…-integration-worker-no-gemini.json`) |
| Alle Skriptpfade | bestanden, 0 Netzwerkversuche, `gitSha` `73a4701` (`…-integration-all-paths-no-gemini.json`) |
| Echter Next-Server, drei Modi | 11/11, 0 Netzwerkversuche |
| Echter Next-Server, URL-Boundary mit `/matches`-Sperre | 20/20, 0 Netzwerkversuche: PERSON_X_JOB 200 (auch Vertrag vor B2), PERSON 409, ohne Auftrag 409 `NOT_RECORDED`, Lauf-Scope ≠ erklärter Job 409, unbekannt 404 |
| E2E-Suiten | 32 grün, 4 übersprungen: `job-pool-workflow` 10/10, `job-scope-gate` grün, `hr-decision-loop-frontend` 7/7, `fail-closed` 13/13, `local-decision-context-http` grün; `live-browser-workflow` übersprungen (Live-Gemini). PINK `syntx-walk.e2e` bricht jetzt schon im Aufbau ab: `/matches` lehnt `ANL_PINK_SYNTX_WALK` mit 409 ab (direkt gespeichert, NOT_RECORDED), die 3 Schritte werden übersprungen. Das ist die vorhergesagte Folge aus §4; PINK bindet den Rundgang neu. Überschriebene Belege sind auf den eingecheckten Stand zurückgesetzt |
| Lint der durch die Sperre geänderten Dateien (`application.ts`, `local-composition.ts`, `job-pool.postgres.test.ts`) | 0 Befunde |
| Leak-Check `0fb7b05..73a4701` | 0 neue Zeilen mit lokalen Pfaden, Datenbank-URLs oder Schlüsseln |

### 2.3 Dritter Schritt, `a3c3759` (PINK `916e884`)

PINK hat `20c977b` und `73a4701` baumgleich nachgebaut und die `gitSha` bestätigt; die Befunde aus §3.41 sind damit geschlossen (§3.43). Danach hat PINK den SYNTX-Rundgang neu gebunden:
- `ANL_PINK_SYNTX_WALK` bekommt einen gespeicherten SUCCEEDED-Auftrag mit PERSON_X_JOB im Validierungs-Pool, dieselbe Fixture wie in der Sperr-Prüfung;
- GRÜNs Vorschlag P-3 und die Q-11-Änderung aus `c146f05` sind übernommen;
- Q-06 ist an die geschlossene R15b-Vorschlagsliste gebunden. Das Urteil lautet **BOUNDARY-MATCH R15b-PENDING**, nicht PASS, solange R15b nicht festgehalten ist (§5).

Die Testdatei ist byte-gleich mit PINKs `916e884`; `tsc` 0. Nachgeprüft in einem eigenen Worktree auf `a3c3759`, damit die Demo aus §6 weiterläuft: `syntx-walk.e2e` 3/3, `job-scope-gate.e2e` 1/1, `job-pool-workflow.e2e` 10/10. Überschriebene Belege sind dort zurückgesetzt.

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

Stand `0fb7b05`. Den Befund zu `syntx-walk.e2e` habe ich gegengeprüft: GRÜNs geprüfter Stand `8718e3a` allein scheitert identisch. Es ist also keine Regression der Integration. Der Rundgang stammt aus der Zeit vor der Job-Scope-Sperre und öffnet das Feld über `analysisId` und Pool, ohne gewählten Job. Die Sperre (`cb3d33f`/`c146f05`) lässt das Feld dann bewusst nicht AVAILABLE werden. Die Suite gehört PINK; PINK passt sie an. Geschlossen ist der Punkt erst, wenn PINK das bestätigt.

## 4. Separates Delta: serverseitige Ablehnung an `/matches`

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

**Bewertung:** Für den produktiven Aufrufer, GRÜNs Frontend, ist die Sperre folgenlos. Betroffen sind Test-Fixtures ohne Auftrag und Bestandsdaten aus der Zeit vor dem Gate.

**Umsetzung, getrennt:** auf `feature/matches-boundary-guard` (`eacfc97`) über der Integrationsspitze `0fb7b05`. Beschreibung in `THREE_INVESTIGATION_MODES.md` §6. PINK hat das Delta unabhängig geprüft (§3.42), ohne Abweichung; danach ist es als `20c977b` in die Integration gemergt.

**Gemessene Wirkung:**
- `job-pool.postgres` (GELB): Ohne Fixture-Anpassung wurden genau die drei Matches-Tests rot. Die Fixture hat jetzt einen persistierten Auftrag, dazu kommt ein neuer Test für PERSON, ohne Auftrag, vor dem Gate und andere Rolle. Ergebnis 8/8.
- GRÜN `job-pool-workflow.e2e`: unverändert grün.
- PINK `http-canonical-inverse.postgres`: 2 rot ohne Fixture.
- PINK `pdf-path.postgres`: Der DANGLING_REFERENCE-Fall ist rot; der Auftrag bleibt RUNNING, und es gibt keine Referenz, also NOT_RECORDED.
- Mit dem Diff an PINK sind PINKs Suiten 31/31 grün.
- Echter Next-Server: 20/20, darunter PERSON 409, ohne Auftrag 409, Lauf-Scope ≠ erklärter Job 409, unbekannt 404, PERSON_X_JOB 200. 0 Netzwerkversuche.

**PINKs unabhängige Prüfung (§3.42):**
- neuer Nachweis `matches-boundary.postgres`: 26 Fälle × 2 Pools = 52/52 genau so, wie die URL-Boundary-Route die Grenze auflöst; alle 7 Gründe und PERSON erreicht; PERSON_X_JOB byte-gleich zur Komposition ohne Grenze, auch bei anderer Rolle; Reihenfolge Pool-404 → Grenze → Pool-Status; nur Identitäten, rein lesend;
- Negativkontrolle auf `0fb7b05`: 38 der 52 Fälle weichen ab;
- `matches-boundary.e2e` auf echtem Server identisch zum In-Process-Aufruf, 0 Gemini-Zugriffe;
- die Folgenabschätzung ist bestätigt; PINK hat die Fixture-Diffs übernommen (`122aa6c`);
- volle Suite auf `eacfc97`: 27 Rotfälle, identisch zur Basis.

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
  - geerbte lokale Pfade in älteren Dateien und Prüfordnern; dazu die 30 Zeilen aus GRÜNs Evidence-Ordnern im Integrationsbereich (§2.1);
  - die Wurzeldateien `debug.js` und `debug2.js`.
- **SYNTX-Governance (wartet auf die Sichtabnahme im DEMO REVIEW):** Laut `proposals/SYNTX_SEMIOTIC_TRANSFER_PROPOSALS.md` gilt nichts davon vor der Sichtabnahme durch den Owner; erst danach hält GELB R10a–R10d und R15b fest. Dazu gehören die Bewegungsarten, die eine GELB-Freigabe brauchen (`sxBoundaryHalo`, der standardmäßig abgeschaltete Prototyp `atmosphereGlow`). Bis dahin bleibt Q-06 bei BOUNDARY-MATCH R15b-PENDING.
- **PINK-Skript** `support/syntx-readonly-walk.mjs` (P-4) ist nicht neu gebunden; es braucht eine Umgebung mit gespeicherten Aufträgen.
- **Für GRÜN (O-SX-INACTIVE-NAMING):** Der Feldzustand INACTIVE_POOL entsteht nur aus einer 409 von `/matches`. Unter der URL-Grenze ist er mit konsistenten Daten nicht mehr erreichbar; das Feld zeigt dann OTHER_POOL.
- **Zur Information (PINK):**
  - O-URL-REF-STATUS;
  - Analysen ohne Discovery-Lauf werden ohne Lesen des Pools aufgelöst; das entsteht nur mit inkonsistenten Daten.

## 6. Demo für das DEMO REVIEW

Lokale Umgebung auf `127.0.0.1:41851` mit dem Integrationsbaum `6da26a7`. Sie läuft nicht öffentlich und nicht als Deployment.
- **Datenbank:** eine frische Wegwerf-Datenbank unter der Testrolle.
- **Server und Worker:** der echte Next-Server und der unveränderte Worker `scripts/run-career-worker.ts`.
- **Gemini:** eine lokale Attrappe auf Loopback (`GOOGLE_GEMINI_BASE_URL`), aufgebaut aus GRÜNs Drei-Modi-Lab. Der Worker hat nur einen Platzhalter-Schlüssel, der echte Schlüssel kommt nicht in die Umgebung.
- **Netzwerkwächter:** Beide Prozesse laufen hinter einem Wächter, der jede Verbindung außerhalb von Loopback ablehnt. Abgelehnt wurde genau ein Versuch, die Versionsabfrage von `next dev` an die npm-Registry; kein Gemini-Zugriff.
- **Daten:**
  - zwei Pools über die echte Upload-Route: den DLL-Engineering-Pool und PINKs Validierungs-Pool;
  - zwei Analysen über die echte Analyze-Route mit dem synthetischen Gold-Lebenslauf, beide SUCCEEDED: eine PERSON_X_JOB-Analyse für „Senior Full-Stack Engineer – Shipment Tracking“ und eine PERSON-Analyse.
- **Attrappe:** Sie bekam die Discovery-Anfrage mit `INVESTIGATION_SCOPE`-Block nur für PERSON_X_JOB.
- **Ausgeschlossen:** :3017, :41831 und fremde Datenbanken bleiben unberührt.

**Stichprobe vor der Übergabe** (Routen und Browser):

| Fall | Erwartung | Ergebnis |
|---|---|---|
| URL-Grenze PERSON_X_JOB / PERSON | RESOLVED mit dem jeweiligen Modus | ja |
| `/matches`: PERSON_X_JOB / PERSON / unbekannt | 200 / 409 / 404 | ja |
| PERSON_X_JOB-Analyse im eigenen Pool | Vergleich wird geladen | ja |
| PERSON-Analyse per URL mit Pool und Job | kein `/matches`-Aufruf, Hinweis „PERSON analysis: no job comparison“ | ja |
| PERSON_X_JOB-Analyse mit anderem Pool | kein `/matches`-Aufruf, Hinweis „No comparison across job scopes“, Pool nur per Klick | ja |
| Modus JOB | liest keine Analyse | ja |
| Modus PERSON | Feld im Modus PERSON | ja |
| Seitenfehler im Browser | keine | ja |

## 7. Ablauf

SFE::INTEGRATE → VERIFY → PINK → **DEMO REVIEW**. PINK hat Integration und Delta ohne Abweichung im Code bestätigt (§3.41, §3.42). Die Demo nach §6 steht für das DEMO REVIEW durch den Owner bereit; sie läuft, bis der Owner das Herunterfahren freigibt.
