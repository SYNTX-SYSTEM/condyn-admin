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
| `18b7c2a` | GELB | `job-structure.postgres`: der `beforeAll` mit drei echten Pool-Uploads bekommt 60 s statt der 10-s-Voreinstellung (unter Last 11,7 s, von GRÜN gemessen) |
| `d3e76ce` | PINK `validation/hr-decision-loop-pink` `5f5c636` | F-PINK-ORDER (§3.44): `http-canonical-inverse` nutzt eine eigene Pool-ID. Vorher hing die volle Suite von der Dateireihenfolge mit `pdf-path` ab, bis zu 10 Rotfälle. Dazu `pdf-path` byte-gleich zur Integration (`ad7bc55`) und PINKs Prüfung von GRÜNs `frontend/demo-ui-fix` (nicht integriert, §5) |
| `aab797c` | PINK `validation/hr-decision-loop-pink` `97cc57a` | PINK §3.45: Prüfung von GRÜNs `frontend/role-orbit` `6d386cc` auf der Probe `4b5774c`, nur Protokoll und Beweise als `.txt`, kein Code. Der Rollenorbit selbst ist nicht integriert (§5) |
| `55aec63` | PINK `validation/hr-decision-loop-pink` `ffe9954` | PINK §3.46: erneute Prüfung von GRÜNs Korrektur `7a51d89` auf der Probe `c8e99d8`; nur Protokoll und Beweise als `.txt`, kein Code. Der Rollenorbit selbst ist nicht integriert (§5) |
| `9098618` | PINK `validation/hr-decision-loop-pink` `de6829d` | PINK §3.47: D-RO-2 auf `3be1920` bestätigt und GRÜNs Korrektur `e6493a7` auf der Probe `f665b80` geprüft; nur Protokoll und Evidenz, kein Code. Der Rollenorbit selbst ist nicht integriert (§5) |
| `16f117b` | PINK `validation/hr-decision-loop-pink` `b88d33f` | PINK §3.48: Rollenkarten `ae633a1` → `6f9bc2b` → `4ecfe67` geprüft; nur Protokoll und Evidenz, kein Code. Die Rollenkarten selbst sind nicht integriert (§5) |
| `7e9f2c8` | GRÜN `frontend/demo-ui-fix` `0b5a8ea` | Owner-GO vom 2026-10-19 „GRÜN-Stapel kontrolliert integrieren“, erster von vier gestapelten Merges: GEMINI OUTPUT jederzeit schließbar, NO ANALYSIS als Signal, Esc lässt einem Dialog den Vortritt (`d9c7fea`, `0b5a8ea`; PINK §3.44) |
| `63f4dd8` | GRÜN `frontend/role-orbit` `e6493a7` | kompakter Rollenorbit `6d386cc` → `7a51d89` → `3be1920` → `e6493a7` (D-RO-1, D-RO-2 behoben; PINK §3.45–§3.47). Sichtrichtung vom Owner angenommen |
| `17181d5` | GRÜN `frontend/role-cards` `ae633a1` | neue Rollenkarten (PINK §3.48). Sichtrichtung vom Owner angenommen |
| `5293eb1` | GRÜN `frontend/role-card-footer` `4ecfe67` | Fußzeile bis 8,5 px (`6f9bc2b`) und Korrektur `4ecfe67` (D-RC-1, D-RC-2; PINK §3.48). Letzter Merge des Stapels; danach VIDEO FREEZE (§7) |
| `a3c3759` | PINK `validation/hr-decision-loop-pink` `916e884` | PINK §3.43: `syntx-walk.e2e` an die Invarianten neu gebunden (siehe §2.3); nur diese Testdatei und Belege |
| `73a4701` | PINK `validation/hr-decision-loop-pink` `122aa6c` | PINKs Prüfprotokolle §3.41 (Integration `0fb7b05`) und §3.42 (Delta `eacfc97`) sowie die übernommenen Fixture-Änderungen für `http-canonical-inverse` und `pdf-path`. Der pdf-path-Schritt erwartet 409 und gilt nur zusammen mit `eacfc97`; deshalb wurde `eacfc97` zuerst gemergt |

Alle Merges liefen konfliktfrei. Der Baum von `82d2f47` ist identisch mit einem vorab gemachten Probe-Merge; PINK hat `82d2f47` und `fd11389` baumgleich nachgebaut (§3.41). Die Abhängigkeiten (`package.json` und Lockfile) sind unverändert.

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

### 2.4 Vierter Schritt, `d3e76ce`

- Die beiden PINK-Testdateien sind byte-gleich mit `5f5c636`. Zusammen laufen sie 15/15; PINK hat beide Reihenfolgen fest geprüft.
- **Volle Suite:** 27 Basis-Rotfälle. Dazu kamen zwei Fehlerquellen, die nichts mit dem Code zu tun haben:
  - **Dev-Sperre:** `g2-g3-vertical-proof` und `hr-decision-loop-p7` starten einen eigenen `next dev` im Worktree und treffen auf die Sperre der laufenden Demo (§6). Im separaten Worktree auf `d3e76ce` sind beide grün (2 Dateien, 77 Tests zusammen mit Outcome-Valence).
  - **Last:** eine Zeitüberschreitung in `career-outcome-valence-feedback-context-revision-postgres`. Sie hängt von der Last ab: einzeln einmal 8/8, einmal 7/8. Der Code dort ist seit der Basis unverändert; PINK hat dasselbe auch auf der Basis gemessen (§3.41).
- Solange die Demo läuft, müssen volle Suite und E2E in einem anderen Worktree laufen.

### 2.5 Fünfter Schritt, `5293eb1` (GRÜN-Stapel, Owner-GO 2026-10-19)

Die vier Merges (`7e9f2c8`, `63f4dd8`, `17181d5`, `5293eb1`) liefen konfliktfrei, in der Reihenfolge des Stapels. Gemacht und geprüft wurden sie im eigenen Worktree auf einem losgelösten Stand, nicht im Integrations-Worktree: Dort läuft die Demo aus §6 als `next dev`, und ein Code-Merge hätte sie per Hot Reload verändert. Der Integrations-Worktree bleibt deshalb auf `27f3253`, bis der Owner das Herunterfahren der Demo freigibt.

- **Leak-Check** `27f3253...4ecfe67` (alle neuen Zeilen, auch die 47 PNG-Dateien): 0 Treffer für lokale Pfade, Datenbank-URLs oder Schlüssel.
- **Abhängigkeiten** (`package.json`, Lockfile) unverändert. Der Stapel ändert nur `SyntxField.tsx`, `syntx-manifestation-layout.ts`, drei Testdateien, `JOB_FIELD_FRONTEND.md`, einen Vorschlagseintrag und GRÜNs Evidenz.

Alle Läufe auf Wegwerf-Datenbanken unter der Testrolle, ohne Gemini:

| Prüfung | Ergebnis |
|---|---|
| `tsc --noEmit` | 0 Fehler |
| Job-Pool, Orbit-Härtung, drei Modi, Investigation | 27/27 Dateien, 256 grün, 4 übersprungen |
| Volle Suite (ohne E2E) | 2644 grün, 29 rot, 8 übersprungen. 27 sind die namensgleichen Basis-Rotfälle (4 Lifecycle-/Policy-Dateien). Dazu zwei Zeitüberschreitungen nach 5 s unter Last in Dateien, die der Stapel nicht berührt: `outcome-valence-declaration/persistence-postgres` einzeln zweimal 8/8. `structural-consequences/reconstruct` braucht einzeln für den Fall „propagates sealed source-gap errors“ 4,1–5,0 s, auf `27f3253` gleich wie auf `5293eb1` (abwechselnd gemessen: 4954/4087/4413/4646 ms); einzeln einmal 1 von 8 rot, sonst 8/8. Der Fall liegt also auf beiden Ständen an der 5-s-Grenze; `lib/decision-core` und `test/decision-core` sind zwischen den Ständen unverändert |
| E2E | `syntx-walk.e2e` 3/3, `job-scope-gate.e2e` 1/1, `job-pool-workflow.e2e` 10/10. Überschriebene Belege zurückgesetzt |
| Video-Walk (`docs/CONDYN_VIDEO_READINESS_2026-10-19.md`) | 30/30 bei 1920 × 1080 und 30/30 bei 1600 × 1000, je ein frisches Labor; 12 Vorschläge, B2 7 abgedeckt / 2 nicht, JOB-Struktur 10 Zeilen / 8 Befunde. Netzwerk: nur die geblockte Versionsabfrage von `next dev` |

PINK-Nachprüfung des integrierten Stands: angefragt.

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
- **GRÜN `frontend/demo-ui-fix`** (`d9c7fea`, `0b5a8ea`; Owner-Auftrag an GRÜN „DEMO UI FIX + SEMIONTIC REFINEMENT“, STOP vor Integration). Inhalt:
  - Das Signal NO ANALYSIS (`sxSignalCore`/`sxSignalAura`, 4,8 s, nur opacity/transform, nur LIVE);
  - die Esc-Führung, die einem Dialog über dem Feld den Vortritt lässt;
  - die Lage der Poolliste.

  Stand der Prüfung:
  - GELB: technisch R15b-konform; Probe-Merge auf `18b7c2a` mit `tsc` 0 und 206/206.
  - PINK: ohne Abweichung (§3.44, `demo-ui-fix.e2e` 62/62).

  **Integriert am 2026-10-19 als `7e9f2c8`** (Owner-GO, §1, §2.5).
- **GRÜN `frontend/role-orbit`** (`6d386cc`, gestapelt auf `0b5a8ea`; Owner-Auftrag an GRÜN „ROLE ORBIT REFINEMENT“ vom 2026-10-18, STOP vor Integration). Inhalt:
  - Der Rollenorbit des Organisations-Kosmos rückt per `compactRoleOrbit` bis zu 22 % pro Achse ans Zentrum, solange in jeder Phase die Luft zum Zentrum und zwischen den Karten hält. Ohne Platz und beim statischen Raster bleibt das Packing unverändert.
  - Zusätzlich die Attribute `data-orbit-compactness-x/-y`.

  Stand der Prüfung:
  - GELB, technisch:
    - Nur Geometrie. Phasen, Ringe, Perioden, Karten und Reihenfolge bleiben gleich; die geteilte `buildCapabilityCosmosLayout` ist unberührt. Damit gibt es keine neue Bewegungsart und kein R15b-Thema; auf dem kleineren Orbit laufen die Karten bei gleicher Periode nur langsamer über den Bildschirm.
    - Einziger Aufrufer ist `SyntxField.tsx`. Keine Backend-, Gemini- oder Datenbankänderung.
    - Leak-Prüfung der hinzugefügten Zeilen sauber. Die Evidence besteht aus synthetischen Daten, die zwölf PNGs sind zusammen rund 9 MB groß.
    - O-JF-PANEL wird verringert, nicht behoben.
  - GELB-Probe `7c2971c` + `6d386cc` (konfliktfrei, mit `demo-ui-fix`), außerhalb des Demo-Verzeichnisses:
    - `tsc` 0.
    - Job-Pool, Orbit-Härtung, drei Modi und Investigation: 249 grün, 4 übersprungen.
    - E2E: `syntx-walk` 3/3, `job-scope-gate` 1/1, `job-pool-workflow` 10/10.
    - Volle Suite: die 27 bekannten Rotfälle sowie 11 Zeitüberschreitungen von 5 s in Outcome-Valence- und Decision-Core-Dateien, die das Delta nicht berührt; die Last lag bei etwa 6. Seriell laufen dieselben 7 Dateien auf `7c2971c` ebenfalls rot (15 statt 11).
  - PINK §3.45 (`97cc57a`, Protokoll gemergt als `aab797c`): Abweichung **D-RO-1**.
    - Der Fehler: `compactRoleOrbit` prüft die Luft zwischen Nachbarn auf einem Orbit (12 px waagerecht, 20 px senkrecht) nur alle 5°. Dazwischen wird sie unterschritten.
    - PINKs Messung: 209 von 2450 eingezogenen Layouts, schlechtester Wert −7,65 px; mit gerenderten Kartenhöhen −9,83 px. Keine Überlappung, mit GRÜNs realem Titelsatz kein Fall.
    - Von GELB unabhängig nachgemessen, auf `6d386cc` mit eigenem zufälligem Titelsatz und Prüfung alle 0,25°: 77 von 2247 eingezogenen Layouts mehr als 1 px unter der Luft, schlechtester Wert −5,98 px, keine Überlappung. Dieselbe Klasse wie bei PINK.
    - GRÜNs eigener Test findet das nicht, weil er nur GRÜNs Titelsatz liest.
    - Alles andere erfüllt PINK, darunter Negativkontrolle, Navigation, REDUCED, Capability Field und keine neue Bewegung.
    - Vorbestehend und unverändert: Bei 1280 überlappen im Packing die Karten einer Organisation mit 14 Rollen (O-RO-PACK-14).

  Behoben werden muss D-RO-1 von GRÜN. Ein möglicher Weg ist eine dichtere Prüfung zwischen den Phasen oder ein Sicherheitsabstand, der den Fehler zwischen zwei Prüfphasen abdeckt. Integriert wird erst nach einer Korrektur, einer erneuten Prüfung durch PINK und einem Wort des Owners an GELB.

  Korrektur GRÜN `7a51d89` (2026-10-18):
  - Was GRÜN geändert hat: Geprüft wird jetzt alle 0,5°, jede Kartenhöhe bekommt 12 px Zuschlag für den gerenderten Text, und es gibt einen Test mit variablen Titeln.
  - Von GELB mit derselben Messung wie oben nachgeprüft: 2031 eingezogene Layouts, kein Fall unter der Luft. Der schlechteste Wert ist +5,54 px auf der geschätzten Höhe und +0,06 px mit 11,25 px Mehrhöhe; keine Überlappung.
  - Probe `6f31846` + `7a51d89`: `tsc` 0; Job-Pool, Orbit-Härtung, drei Modi und Investigation 250 grün, 4 übersprungen.
  - Beobachtung O-RO-COST, kein Mangel: Die Berechnung dauert in Node bis etwa 85 ms pro Layout. Am meisten kosten volle Orbits, die am Ende unverändert bleiben (14 und 24 Rollen bei 1600). Sie läuft in `useMemo` bei jeder Größenänderung.
  - PINK §3.46 (`ffe9954`, Protokoll gemergt als `55aec63`): D-RO-1 behoben, keine neue Abweichung.
    - Probe `c8e99d8` = `6f31846` + `7a51d89`.
    - Geometrie 10/10 über 7480 Layouts; Browserlauf 243/243 bei 1600, 1280 und 1366; die Negativkontrolle auf `6d386cc` erkennt den alten Mangel (5/10).
    - Regression grün: Gate 74/74, drei Modi 91/91 + 97/97, `syntx-walk` 3/3 (Q-06 bleibt R15b-PENDING), Workflow 10/10, `demo-ui-fix` 62/62.
    - Volle Suite: 27 Basisfälle und 4 Last-Timeouts, mit 30 s Zeitlimit grün.
    - O-RO-COST bestätigt PINK mit bis 156,5 ms unter Last.
    - O-RO-CROSS-GRID: Zwischen den Orbits prüft GRÜN weiter im 15°-Raster. PINK findet bei einer Prüfung alle 1° × 1° keine Verletzung.

  Sichtabnahme von `7a51d89`: vom Owner nicht angenommen, der Orbit ist noch zu groß. GELB weiß das nur über GRÜN. Damit ist `7a51d89` nicht zur Integration bereit.

  Zweite Verfeinerung GRÜN `3be1920` (Owner-Auftrag an GRÜN „ROLE ORBIT — SECOND VISUAL REFINEMENT“, 2026-10-19, STOP vor Integration und erneuter Sichtabnahme):
  - Es gibt kein festes Ziel 0,78 mehr. Gewählt wird das kleinste Faktorpaar kx·ky, das die Luftregeln hält; der äußere Orbit bleibt mindestens so breit wie hoch.
  - Die Luft zum Zentrum und zwischen den Karten eines Orbits wird geschlossen gelöst. Jede Karte und jedes Kartenpaar wird mit der eigenen Größe gelesen, eine Lücke zwischen Stützstellen gibt es nicht mehr. Zwischen den Orbits gilt ein 5°-Raster.
  - Kestrel bei 1600: Der Orbit schrumpft von 516,8 × 232,4 auf 251,8 × 190,7 px.
  - `ROLE_ORBIT_COMPACTNESS` und der Parameter `target` sind entfernt, ohne weitere Aufrufer; die Attribute `data-orbit-compactness-x/-y` bleiben.
  - GELB-Review: Beide geschlossenen Bedingungen sind korrekt.
    - Zentrum: Der Orbit schließt das um die Freihaltung erweiterte Kartenrechteck ein. Es genügt, den Eckbogen zu prüfen, weil die Ellipse konvex ist.
    - Nachbarn auf einem Orbit: Der Abstand zweier Karten läuft über eine Viertelellipse (Dx·|sin u|, Dy·|cos u|). Sie meidet das Luftrechteck genau dann, wenn dessen Ecke innerhalb liegt.
    - Die Suche ist monoton in kx; die Abbrüche in der Schleife sind zulässig.
  - Unabhängige Nachmessung durch GELB, mit eigenen Zufallstiteln, sieben Viewports und 1 bis 14 Rollen; Zentrum und Nachbarn alle 0,25°, zwischen den Orbits 1° × 1°:
    - Eingezogen werden 565 Layouts; die Luftregeln verletzt keines. Kein äußerer Orbit wird höher als breit.
    - Schlechteste Luft auf der geschätzten Höhe: Zentrum +4,02 px, Nachbarn +6,09 px. Mit 11,25 px Mehrhöhe: +0,29 px und +0,52 px.
    - ~~Ein mehrfacher Orbit wird in keinem Fall eingezogen~~ **Falsch, korrigiert (D-RO-2, unten):** Die Aussage galt nur für Level-Boxen bis 820 px Höhe; GELB hatte keine höheren gemessen.
    - Höchstens 13,7 ms pro Layout in Node; O-RO-COST ist damit deutlich verringert.
  - Probe `cdedfef` + `3be1920`: `tsc` 0; Job-Pool, Orbit-Härtung, drei Modi und Investigation 251 grün, 4 übersprungen.
  - PINK: **Abweichung D-RO-2** auf `3be1920`.
    - Ab etwa 840 px Boxhöhe werden auch Packungen mit zwei Orbits eingezogen.
    - Die Luft zwischen den Orbits ist dabei nur im 5°-Raster geprüft und wird zwischen den Rasterpunkten unterschritten; PINKs schlechtester Wert ist −6,6 px.
    - GELB hat das nachgemessen: sieben hohe Boxen von 840 bis 1240 px, 6 bis 24 Rollen, zwischen den Orbits 1° × 1°, Kartenhöhe mit 11,25 px Zuschlag. Ergebnis: 6 von 124 eingezogenen Layouts verletzen die Luft, schlechtester Wert −5,48 px. Mit der geschätzten Höhe allein gibt es keine Verletzung.

  Korrektur GRÜN `e6493a7` (2026-10-19):
  - Die Luft zwischen den Orbits ist jetzt in geschlossener Form geregelt. Weil die Packung ihre Orbits ineinanderlegt, muss der äußere Orbit in jeder Phase das Luftrechteck jeder inneren Karte umschließen.
  - Layouts mit nur einem Orbit sind laut GRÜN unverändert, Kestrel eingeschlossen; 32 von 788 Layouts mit mehreren Orbits ziehen weniger ein.
  - GELB hat auf `e6493a7` nachgemessen, jeweils mit 11,25 px Zuschlag auf die Kartenhöhe:
    - Hohe Boxen: 110 eingezogene Layouts, davon 11 mit mehreren Orbits, keine Verletzung. Schlechteste Luft zwischen den Orbits +0,96 px, am Zentrum +0,45 px, zwischen Nachbarn +0,51 px.
    - Übliche Boxen: dasselbe Ergebnis wie auf `3be1920` (565 Layouts, +0,29 px und +0,52 px).
    - Rechenzeit höchstens 23,7 ms pro Layout.
  - Probe `dcd5cbc` + `e6493a7`: `tsc` 0; Job-Pool, Orbit-Härtung, drei Modi und Investigation 252 grün, 4 übersprungen.
  - PINK §3.47 (`de6829d`, Protokoll gemergt als `9098618`): `e6493a7` validiert, keine neue Abweichung.
    - D-RO-2 auf `3be1920` bestätigt: schlechtester Wert −6,27 px; einzelne Kartenpaare liegen bis zu 32,9 px näher als gepackt.
    - Geometrie 56/56 einschließlich Minimalität, liegender Ellipse und Fläche sowie 6585 Layouts mit mehreren Orbits in hohen Boxen.
    - Browserlauf 395/395 bei vier Viewports, darunter 1600 × 1200.
    - Gegenproben erkannt: `3be1920` 54/56, `7a51d89` 16/56.
    - Regression grün: Gate 74/74, drei Modi 91/91 + 97/97, `syntx-walk` 3/3 (Q-06 R15b-PENDING), Workflow 10/10, `demo-ui-fix` 62/62.
    - Volle Suite: 27 Basisfälle und ein Umgebungsfehler (O-ENV-DROP: Beim Löschen einer Wegwerf-Datenbank war noch ein Superuser-Prozess verbunden, vermutlich Autovacuum). PINK hat die zwei zurückgebliebenen eigenen Wegwerf-Datenbanken selbst gelöscht. Die gemeinsame `condyn` ist nicht berührt.
    - O-RO-COST erledigt (≤ 22,7 ms); dazu die Beobachtungen O-RO-GRID und O-RO-COLD (nicht nachgestellt).

  Sichtabnahme von `e6493a7`: Nach Angabe von GRÜN hat der Owner sie erteilt. Das Wort zur Integration an GELB steht noch aus, und GELB integriert nur auf das direkte Wort des Owners, zusammen mit `demo-ui-fix` (`0b5a8ea`), auf dem der Rollenorbit aufbaut. Das Sichtlabor des Owners läuft bei GRÜN auf :41805; GELB greift dort nicht ein.
- **GRÜN `frontend/role-cards`** (`ae633a1`, gestapelt auf `e6493a7`; Owner-Auftrag an GRÜN „ROLE ORBIT CARD REFINEMENT“, STOP vor Integration, danach PINK und Sichtabnahme). Inhalt:
  - Die Rollenkarte im Organisationskosmos ist neu gestaltet. Alles steht zentriert untereinander:
    - die Seniorität des Pools, in ihre Teile zerlegt (`roleSeniorityParts`);
    - der Titel;
    - `domain_focus`, aber nur auf eingezogenem Orbit;
    - die Zahl der Anforderungen;
    - die Matching-Lesung.
  - Die Karte hat jetzt eine feste Höhe und schneidet überstehenden Inhalt ab (`roleCardBox`).
    - Auf eingezogenem Orbit ist sie genau so hoch wie die Box, auf der die Luft gemessen wird: Schätzhöhe + 12 px. Der Abstand zwischen geschätzter und gerenderter Höhe aus D-RO-1 ist damit für die gezeichnete Karte geschlossen.
    - Gepackt ist sie genau so hoch wie die Schätzhöhe und ohne Fachgebietszeile; früher war das nur eine Mindesthöhe.
  - `compactRoleOrbit` ist unverändert.
  - GELB-Review:
    - Die Änderung betrifft nur das Frontend: `SyntxField.tsx` und zwei reine Funktionen in `syntx-manifestation-layout.ts`.
    - `domainFocus` und `seniority` stammen aus dem bestehenden Feld-View-Model, also aus den Pooldaten. Die Matching-Anzeige liest wie bisher `role.matching`. Damit wird nichts Neues behauptet.
    - Der Ankerpunkt der Verbindungslinie rechnet mit der gezeichneten Höhe.
    - Nach GELBs Abschätzung passt der Inhalt bei einer bis vier Titelzeilen in beide Höhen. GRÜNs Messung meldet keine abgeschnittene Karte. **Einschränkung:** Abschätzung und Messung galten nur der Höhe und nur auf Englisch. In der Breite war auf `ae633a1` das deutsche „KEIN MATCHING GELESEN“ bei schmalen Karten abgeschnitten; GRÜN hat das selbst gefunden und in `6f9bc2b` behoben (unten).
    - Leak-Prüfung der hinzugefügten Zeilen sauber.
  - Probe `b823f68` + `ae633a1`: `tsc` 0; Job-Pool, Orbit-Härtung, drei Modi und Investigation 255 grün, 4 übersprungen.
  - PINK: Prüfung angefragt, ausstehend. Danach Sichtabnahme durch den Owner. Integriert wird nur auf das Wort des Owners an GELB und nur zusammen mit `role-orbit` und `demo-ui-fix` darunter oder nach ihnen.
  - Sichtabnahme: Nach Angabe von GRÜN hat der Owner die Kartengestaltung grundsätzlich abgenommen; nur die Fußzeile war ihm zu klein.
- **GRÜN `frontend/role-card-footer`** (`6f9bc2b`, gestapelt auf `ae633a1`; Owner-Auftrag an GRÜN „ROLE CARDS — FOOTER READABILITY“, STOP vor Integration). Inhalt:
  - Die Fußzeile (Anforderungen, Matching-Lesung) ist größer und heller: bis 8,5 px statt 7,5 px.
  - Die Größe wählt `monoLineSize` je Karte: die größte Viertelpixel-Größe, bei der beide Zeilen in die Kartenbreite passen.
  - Die Zeilen reichen 8 px in den seitlichen Innenabstand. Die Trennlinie gibt 2 px Höhe zurück. Kartenbox und Orbit bleiben unverändert.
  - GELB-Review:
    - Nur Frontend; Leak-Prüfung sauber.
    - Die Höhe wächst netto um etwa 0,4 px und passt weiter in die feste Box.
    - Nachgerechnet:
      - Englisch: 8,5 px auf jeder Karte.
      - Deutsch „KEIN MATCHING GELESEN“: auf der schmalsten vollen Karte (128 px) 7,75 px, ab etwa 150 px 8,5 px.
      - Deutsch auf kompakten Karten (120 px, viele Rollen): 7,5 px, also so groß wie bisher.
    - `monoLineSize` kennt keine Untergrenze. Bei den heutigen Texten und Kartenbreiten ergibt sich kein Wert unter 7,5 px.
  - Probe `62bfbcc` + `6f9bc2b`: `tsc` 0; Job-Pool, Orbit-Härtung, drei Modi und Investigation 256 grün, 4 übersprungen.
  - PINK: Prüfung angefragt, ausstehend.

  Korrektur GRÜN `4ecfe67` zu PINKs Befunden auf `ae633a1`:
  - **D-RC-1:** Andock-Lampe und Stummel wurden abgeschnitten, wegen der globalen Regel `button { overflow: hidden }`; das galt schon vor `ae633a1`. Die Karte setzt jetzt `overflow: visible`.
  - **D-RC-2:** Dichte Titel wurden gekürzt. `RoleCardTitle` verkleinert sie jetzt nach dem Layout bis 10 px, per `useLayoutEffect` ohne `setState`; die Box bleibt.
  - GELB-Review ohne Befund. Probe `c43621e` + `4ecfe67`: `tsc` 0; Job-Pool, Orbit-Härtung, drei Modi und Investigation 27/27 Dateien grün.
  - Video-Walk (`docs/CONDYN_VIDEO_READINESS_2026-10-19.md`) auf dieser Probe: 30/30.

  PINK §3.48 (`b88d33f`, Protokoll gemergt als `16f117b`): Kette `ae633a1` → `6f9bc2b` → `4ecfe67` validiert, keine neue Abweichung.
  - Probe `d685003` = `b823f68` + `4ecfe67`.
  - `role-cards.e2e` 2697/2697; Geometrie 56/56; `role-orbit.e2e` 395/395, der Orbit ist gleich `e6493a7`.
  - Regression grün; volle Suite genau die 27 Basisfälle.
  - Die gezeichnete Karte ist exakt die Box, auf der die Luft gemessen wird (±0,5 px). Gepackte Karten wachsen nicht mehr (14 Rollen bei 1280: vorher bis 131,3 px, jetzt 88 px).
  - Gerendert auf Deutsch ist die Fußzeile auf jeder Karte vollständig (7,75–8,5 px). **Auch auf den kompakten 120-px-Karten sind es 8,5 px, nicht wie von GELB gerechnet 7,5 px.** GELBs Rechnung nahm 0,6 em Zeichenbreite an; die tatsächlich gerenderte Schrift ist schmaler (PINK O-RC-MONO: Fira Code).
  - Beobachtungen: O-RC-MONO, O-RC-DISC (kompakte Karten unter der Scheibe, vorbestehend), O-RC-DEVTOOLS.

  **Integriert am 2026-10-19** auf das Owner-GO an GELB, in der Reihenfolge `demo-ui-fix` → `role-orbit` → `role-cards` → `role-card-footer` bis `4ecfe67` (`7e9f2c8`, `63f4dd8`, `17181d5`, `5293eb1`; §1, §2.5). Der Owner hat die Sichtrichtung des kompakten Rollenorbits und der neuen Rollenkarten angenommen. Die Einträge zu `role-orbit`, `role-cards` und `role-card-footer` oben sind der Prüfverlauf bis dahin.
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

**2026-10-19, Owner-GO „GRÜN-Stapel kontrolliert integrieren“:** SFE::INTEGRATE → VERIFY → FREEZE → GEMINI GO → ANTIGRAVITY → VIDEO.
- INTEGRATE und VERIFY: §1, §2.5. PINK-Nachprüfung angefragt.
- **VIDEO FREEZE ab `5293eb1`:** keine weiteren kosmetischen Änderungen vor dem ersten Film. Gilt für alle drei Sessions; Funktionsfehler, die den Videopfad blockieren, gehen als Befund an den Owner.
- GEMINI GO: Der Live-Modus des Video-Labors ist vorbereitet, gesperrt und ohne echten Aufruf geprüft (`docs/CONDYN_VIDEO_READINESS_2026-10-19.md` §8). STOP vor dem ersten echten Gemini-Aufruf.

Bisheriger Ablauf:

SFE::INTEGRATE → VERIFY → PINK → **DEMO REVIEW**. PINK hat Integration und Delta ohne Abweichung im Code bestätigt (§3.41, §3.42). Die Demo nach §6 steht für das DEMO REVIEW durch den Owner bereit; sie läuft, bis der Owner das Herunterfahren freigibt.
