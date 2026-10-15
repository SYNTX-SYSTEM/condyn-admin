# E2E-Prüfbericht: Job Field und Capability Field (Funktions-Sweep, 2026-10-13)

Auftrag: Owner-Mandat „SFE::FULL END-TO-END FUNCTIONAL SWEEP“ (Design eingefroren). Ausgeführt von GRÜN.
Geprüfter Stand: `frontend/job-field` @ `0a8a57d`, mit Resonanz-Atmung aus (Standard).
Es wurde nichts repariert; dieser Bericht enthält nur Befunde und Korrekturvorschläge.

Belege: `docs/career_analysis/evidence/job-pool/e2e-sweep-2026-10-13/`
- `results.jsonl`: jede Prüfung mit Zeitpunkt, Schritt, Ergebnis, Art und Detail.
- `tally.json`: letzte Zeile je Prüfung.
- `logs/`: Logs der Suiten.
- `shots/`: Screenshots.
- `scripts/`: Treiber.
- `testdata/`: zweiter, synthetischer Lebenslauf.

## 1. Umgebung und Art der Ergebnisse

| | |
|---|---|
| Umgebung | Eigener Wegwerf-Worktree `condyn-admin-e2e` (detached `0a8a57d`); `npm run job-pool:local` auf Port 41821 |
| Datenbank | Wegwerf-Datenbank `condyn_test_0d1a8d08dcf3ada4`, angelegt über die Isolations-Guards mit der Least-Privilege-Rolle |
| Worker | Echter Produktions-Worker `scripts/run-career-worker.ts` mit `GeminiProvider`, Modell `gemini-3.1-pro-preview` (wie die Owner-Umgebung) |
| Nicht berührt | Port 3017 und die Owner-Datenbank, GELB, PINK. Das Review-Lab auf 41803 lief unverändert weiter. |
| Browser | Playwright-Chromium, headless und **ohne GPU**. Bildraten sind deshalb nur relativ vergleichbar. |

**Art der Ergebnisse** (Spalte `kind` in `results.jsonl`):

| Art | Bedeutung |
|---|---|
| **REAL** | Echte Gemini-Analyse oder echter Upload über die Oberfläche bzw. die Produktions-API, geprüft im Browser |
| **DERIVED** | Aus den echten Läufen abgeleitete inverse Prüfungen: Datei ⇄ API ⇄ Analyse ⇄ PDF-Text |
| **FIXTURE** | Daten aus Fixtures, entweder in den Suiten des Projekts oder als für das Wachstum erzeugte, skalierte Kopien des Enterprise-Pools |

Das Review-Lab auf 41803 nutzt einen **Mock-Worker** und wurde für diesen Bericht nicht als Quelle verwendet.

### Testdaten
- `docs/examples/cv.synthetic.pdf` (ENG): Softwareingenieur, synthetisch.
- `testdata/cv-ai-data.synthetic.pdf` (AI): für diesen Test erzeugte Daten- und ML-Ingenieurin, synthetisch. Kafka, Flink, MLOps, RAG und Knowledge Graph sind enthalten; Java und SPARQL fehlen bewusst.

### Echte Läufe
- **Gemini-Analysen:**
  - ENG `ANL_1791904911180_388`: 126 s, 10 vorgeschlagene Capabilities.
  - AI `ANL_1791905099818_748`: 117 s, 11 vorgeschlagene Capabilities.
  - Zusätzlich lief PINKs Live-Suite mit eigenem echtem Durchlauf.
- **Pools** (über den Intake im Browser): `JPOOL_B948…` (Engineering), `JPOOL_0DCD…` (AI & Data), `JPOOL_D39A…` (Enterprise).

## 2. Ergebnis je Prozessschritt

Gezählt wird die letzte Zeile je Prüfung. Zeilen, die nur wegen meiner eigenen falschen Erwartung scheiterten, sind in Abschnitt 5 korrigiert.

| # | Prozessschritt | PASS | FAIL | Befund | Kern |
|---|---|---|---|---|---|
| 1 | PDF-Upload und neue Gemini-Analyse | 2 | 0 | – | Beide PDFs über die Oberfläche; Analyse in 126 s bzw. 117 s; Status VERIFIED |
| 2 | Persistenz und Darstellung im Capability Field | 6 | **2** | F-1 | Die Analyse ist gespeichert (API 200, Projektion mit wörtlichen Zitaten) und erscheint in der Sitzung. **Nach einem Refresh bleibt das Capability Field leer.** |
| 3 | Upload und Parsing der drei Pool-JSONs | 11 | 0 | – | Erwartete Upload-IDs, `MAPPED`. Ein Duplikat ergibt `IDENTICAL_EXISTS`. „Uploaded ≠ Selected“ gilt; SELECT öffnet den Pool. |
| 4 | Organisationen, Rollen, Anforderungen, Relationen | 16 | 0 | – | Datei = API = DOM für Anzahl, IDs, Rolle→Organisation und Anforderung→Rolle in allen drei Pools; Rollenzahl je Organisationskörper korrekt |
| 5 | Matching, Evidenzbindung, fehlende Anforderungen | 34 | 0 | **6** (F-2, F-3) | Siehe unten |
| 6 | Navigation durch alle Ebenen und zurück | 8 | 0 | – | Klickpfad Feld → Organisation → Rolle → Anforderung über bewegte Zeichen; Esc-Kette; RETURN; Pfadschritt |
| 7 | Boundary, Governance, Zustände, Autoritätsgrenzen | 15 | 0 | – | Boundary = API: Autorität NONE, Policy, Sweep (unbewertet), Kandidatenzahl, Schwelle, Mapping, Labels. Keine kanonische Bewertung, keine Entscheidung, `NOT_EVALUATED`. |
| 8 | Wechsel zwischen Capability Field und Job Field | 3 | 0 | – | Gestagte Quellen bleiben erhalten, die URL folgt dem Feld, Pool und Analyse bleiben gewählt |
| 9 | Klick, Tastatur, Scroll, Refresh, Fehler, Reduced Motion | 25 | 0 | – | Siehe unten |
| 10 | Performance und wachsender Pool | 10 | **7** | F-4, F-7, F-8 | Bei 1600×1000 sauber bis 32 Organisationen. Bei 1280×720 abgeschnitten (F-4). Bei 64 Organisationen Überlappung (F-8). Upload-Zeit wächst überproportional (F-7). |

**Schritt 5 im Detail**
- Jede Rolle zerfällt exakt in gestützt, schwach und fehlend; die Zuordnung im DOM ist für alle 25 geprüften Rollen gleich der API.
- Alle 103 Evidenzzitate (bewertete und Sweep-Zitate über alle Kombinationen) stehen **wörtlich** im analysierten PDF.
- Die Evidenz-Apertur zeigt das Zitat aus der API wörtlich, zusammen mit der Autoritätsgrenze.
- Fehlende Anforderungen tragen keinen Score.
- Schwache Evidenz liegt unter der Schwelle oder beruht auf Token-Containment, jeweils mit Begründung.
- Die Rollen sind absteigend nach resonanceScore geordnet.
- Die Zahl der Sweep-Vorschläge entspricht den Projektions-Capabilities.
- Sweep-Vorschläge sind nie bewertet.
- **Fachlich unplausibel** (F-2, F-3).

**Schritt 9 im Detail**
- **Tastatur:** Tab erreicht eine Organisation, Enter öffnet sie.
- **Scroll:** Das Mausrad über dem Feld ändert nichts; die Boundary scrollt bei 1280×720 ihren eigenen Inhalt.
- **Refresh:** Eine Anforderungsebene und das Job Field werden aus der URL wiederhergestellt.
- **Fehlerzustände:**
  - unbekannter Pool → `NOT_FOUND` (API 404 `ERR_JOB_POOL_NOT_FOUND`)
  - Pool ohne Analyse → `NO_ANALYSIS`
  - unbekannte Analyse → `NOT_FOUND`, kein erfundenes Matching (API 404 `ERR_ANALYSIS_NOT_FOUND`)
  - unbekannte Deep-Link-IDs → zurück auf eine gültige Ebene
- **Negativ-Uploads über die Oberfläche:**

  | Fall | Antwort |
  |---|---|
  | `weight` 1,5 | 422 `ERR_JOB_POOL_SCHEMA_INVALID`, mit Pfad |
  | Unbekannte Organisation | 422 `ERR_JOB_POOL_REFERENCE_INVALID` |
  | Datei über 1 MiB | 413 `ERR_JOB_POOL_TOO_LARGE` |
  | Kaputtes JSON | 400 `ERR_JOB_POOL_JSON_INVALID` |

- **Reduced Motion:** Auf allen vier Ebenen läuft keine Animation; die Navigation funktioniert.
- **Seitenfehler:** in keinem Lauf.

### Automatisierte Suiten des Projekts (gleicher Stand, je eigene Wegwerf-Datenbank)

| Suite | Ergebnis | Anmerkung |
|---|---|---|
| `test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts` | **10 / 10** | HTTP gegen die Produktionsrouten und Browser-Walk FIELD → … → EVIDENCE → RETURN |
| `test/job-pool-validation/syntx-walk.e2e.test.ts` (PINK), wie committed | 0 / 3 | Exakt die drei bekannten Darstellungsbindungen aus Vorschlag P-3: Rolle als Button, Kamera, `g`-Tag |
| ↳ mit der P-3-Umbindung (nur lokal, uncommittet im Wegwerf-Worktree) | 2 / 3 | Q-06 scheitert an `sxOrientPass`, siehe F-5 |
| `test/job-pool-validation/live-browser-workflow.e2e.test.ts` (PINK, echter Gemini-Lauf) | 0 / 1 | Die echte Kette ist bestanden: PDF → Gemini → Upload → Auswahl → Abgleich mit Datenbank und Projektion. Abbruch erst in Zeile 200 beim Klick auf eine Rolle auf Feldebene (F-6). |
| Unit-, Komponenten-, HTTP- und Postgres-Batch (37 Dateien) | 36 / 37 Dateien, 208 / 219 Tests | Die eine Datei scheitert an einem Timeout unter Last (F-7) |
| ↳ `http-canonical-inverse.postgres.test.ts` allein | **13 / 13** | Der erste Upload braucht 4,2 s bei 5 s Limit |

## 3. Befunde

Schweregrade:
- **HOCH:** Fachliche Aussage des Systems falsch oder unbrauchbar.
- **MITTEL:** Funktion eingeschränkt oder Wachstumsrisiko.
- **NIEDRIG:** Testvertrag oder Doku.

### F-1 · Capability Field wird nach Refresh nicht aus der gespeicherten Analyse geladen (MITTEL)
- **Wirkung:**
  - Vor dem Refresh zeigt die Sitzung 1 Identity-Item und 10 bzw. 11 Capability-Items.
  - Nach dem Neuladen mit `?analysisId=…` zeigen alle Bubbles 0 Items, obwohl `GET /api/career/analyses/{id}` 200 liefert.
  - Der Nutzer verliert die Capability-Darstellung und müsste die Analyse erneut anstoßen, was weitere Gemini-Kosten verursacht.
  - Das Job Field ist nicht betroffen; es liest die Analyse aus der URL.
- **Ursache:** `SemanticCareerIntelligenceField.tsx:336–356` füllt `activeData` nur aus einem in der Sitzung erfolgreichen Job (`job.state.canonicalAnalysis`) oder aus `canonicalSilAssociationId`. Der URL-Parameter `analysisId` speist nur den Job-Pool-Workflow (Z. 270).
- **Reproduktion:** PDF analysieren, dann `/career/demo?analysisId=<ANL>` neu laden. Belege: `shots/A1-*-capability-after-analysis.jpg` und `shots/A2-*-capability-after-reload.jpg`.
- **Minimale Korrektur:** Ist `analysisId` gesetzt und kein Job vorhanden, `GET /api/career/analyses/{id}` laden und über denselben Weg (`adaptCanonicalToDemoState` plus Projektions-Overlay) setzen.
- **Freigabe:** Die Änderung liegt in der Capability-Hülle (R10). Nötig sind ein Render-Identitätsnachweis und die Freigabe durch Owner und GELB.

### F-2 · Bewertetes Matching nutzt nur 3–4 grobe Legacy-Capabilities (HOCH)
- **Wirkung:** Die Ergebnisse sind fachlich kaum aussagekräftig. Der AI-&-Data-Lebenslauf gegen den AI-&-Data-Pool ergibt **1 gestützte, 0 schwache und 129 fehlende von 130 Anforderungen**. 38 der „fehlenden“ Anforderungen stehen wörtlich im Lebenslauf.

  | Pool × Lebenslauf | gestützt / schwach / fehlend | fehlend, aber wörtlich im Lebenslauf (davon als Sweep sichtbar) | Beispiele |
  |---|---|---|---|
  | Engineering × ENG | 3 / 4 / 72 | 9 (3) | PostgreSQL, SQL, Kubernetes, CI/CD |
  | Engineering × AI | 0 / 0 / 79 | 5 (0) | |
  | AI & Data × ENG | 0 / 13 / 117 | 4 (3) | |
  | AI & Data × AI | 1 / 0 / 129 | 38 (11) | Kubernetes, Python, PyTorch, Model Monitoring |
  | Enterprise × ENG | 3 / 12 / 275 | 12 (10) | |
  | Enterprise × AI | 0 / 0 / 290 | 21 (2) | |

- **Ursache** (in Daten und Code verifiziert):
  - `presentation-matching.ts` bewertet gegen `structured_data.analysis.capabilities` der Analyse. Das sind 3–4 grobe Sammelbegriffe, etwa „Streaming Data Platforms“, „MLOps & Infrastructure“ oder „Applied LLM Systems“.
  - Die 10–11 feineren, quellverifizierten Projektions-Capabilities (`EVIDENCE_PASSED`, `SOURCE_MATCH_VERIFIED`) gehen nur als unbewerteter Sweep ein.
  - Das folgt der Governance-Regel „COVERED != SCORED“ und der offenen Grenze B-JP-CANDIDATES.
- **Reproduktion:** `GET /api/career/job-pools/JPOOL_0DCD…/matches?analysisId=ANL_1791905099818_748`. Belege: `phaseB-summary.json`, `results.jsonl` (B5).
- **Optionen (Entscheidung für Owner und GELB, keine Frontend-Korrektur):**
  - (a) Gegen die verifizierten Projektions-Capabilities bewerten. Das ist eine Governance-Änderung.
  - (b) Die Kandidatenmenge der Legacy-Analyse feiner machen.
  - (c) Bei unverändertem Verhalten in der Oberfläche deutlich machen, dass nur gegen N Kandidaten bewertet wird. Heute steht das nur in der Boundary.

### F-3 · Das Matching ist lexikalisch, nicht semantisch (HOCH zusammen mit F-2)
- **Wirkung:** Werkzeug-Anforderungen wie „Apache Kafka“, „Apache Flink“ oder „Python“ finden keine abstrahierten Capability-Namen wie „Real-Time Stream Processing Pipeline Engineering“. Das gilt selbst dann, wenn das Evidenzzitat den Begriff wörtlich enthält.
- **Ursache:** Es gibt nur die Basen EXACT, ALIAS, COMPOSITE_CONSTITUENT und TOKEN_CONTAINMENT, und zwar auf Capability-Namen. Embeddings werden nicht genutzt, obwohl `GEMINI_EMBEDDING_MODEL` konfiguriert ist.
- **Optionen (Architekturentscheidung):**
  - Gegen die Tokens der Evidenzzitate abgleichen, nicht nur gegen den Namen.
  - Alias-Anreicherung aus der Projektion.
  - Semantische Ähnlichkeit, deterministisch versioniert und als Vorschlag gekennzeichnet.

### F-4 · Die Seite ist immer höher als das Fenster; bei 1280×720 fehlen 301 px (MITTEL)
- **Gemessen:**

  | Fenster | Dokumenthöhe | Überstand |
  |---|---|---|
  | 1600×1000 | 1061 | 61 px |
  | 1440×900 | 1021 | 121 px |
  | 1280×720 | 1021 | 301 px |

  Das gilt für das Job Field und das Capability Field gleichermaßen.
- **Folge bei 1280×720:**
  - Der untere Planetarium-Ring ist angeschnitten (2 bis 5 Körper je Pool).
  - Kreisende Rollenkarten laufen unten aus dem Bild.
  - Die Fußzeile mit den Governance-Aussagen („PRESENTED != EVALUATED …“) liegt außerhalb des sichtbaren Bereichs.
  - Alles ist nur durch Seitenscroll erreichbar.
- **Ursache:** `SemanticCareerIntelligenceField.tsx:569–570` setzt `height: 100vh` und `minHeight: 960px` unter der 61 px hohen Kopfzeile.
- **Belege:** `shots/D-*-1280*.jpg`, `phaseD.json`, `scripts/overflow.mjs`.
- **Minimale Korrektur:**
  - Höhe auf `calc(100dvh - <Kopfzeile>)` setzen.
  - Die Mindesthöhe 960 px durch eine feldinterne Skalierung ersetzen; das Planetarium hat schon eine eigene Anpassung (`fit`).
- **Freigabe:** Die Änderung liegt in der Hülle beider Felder (R10/R10b): Render-Identitätsnachweis und Freigabe nötig.

### F-5 · `sxOrientPass` fehlt in der R15b-Liste und in der P-3-Umbindung (NIEDRIG; Lücke von GRÜN)
- **Wirkung:** PINKs Walk Q-06 scheitert auch mit der P-3-Umbindung: „allowed motion at ROLE sxOrientPass“.
- **Ursache:** Die endliche Lichtbewegung der Orientierungsfläche (Durchgang `801b778`) steht in `JOB_FIELD_FRONTEND.md`, wurde aber nicht in die R15b-Vorschlagstabelle und in die erlaubten Namen der P-3-Umbindung übernommen. Dasselbe prüfe ich für alle Bewegungen, die nach P-3 dazukamen: `syntxFieldSweep*`, `sxBoundaryOpen`, `sxBoundaryHalo` und die Resonanz-Übergänge.
- **Korrektur:** R15b-Tabelle und P-3-Patch ergänzen; reine Doku und Vorschlag. GRÜN kann das nach GO erledigen.

### F-6 · PINKs Live-Suite ist nicht auf „Organisationen zuerst“ umgebunden (NIEDRIG, Testvertrag)
- **Wirkung:** Nach bestandener echter Kette klickt `live-browser-workflow.e2e.test.ts:200` eine Rolle auf Feldebene. Rollen sind dort seit dem Semiotic Transfer bewusst nicht interaktiv (`interaction none`).
- **Korrektur:** Umbindung analog zu P-3: zuerst die Organisation, dann den Rollen-Satelliten mit Prüfung, dass der Zeiger ihn wirklich trifft. Das ist ein Vorschlag für PINK.

### F-7 · Upload-Latenz wächst überproportional (MITTEL); Test-Timeout unter Last (NIEDRIG)
- **Gemessen** (synchroner Request; die ×2- und ×4-Pools sind skalierte Kopien des Enterprise-Pools):

  | Anforderungen | Upload-Zeit |
  |---|---|
  | 79 | 7,9 s |
  | 130 | 7,4 s |
  | 290 | 16,8 s |
  | 580 | 41 s |
  | 1160 | 107 s |

  Ein Pool am 1-MiB-Limit läge rechnerisch bei mehreren Minuten und riskiert Proxy- oder Browser-Timeouts.
- **Matching:** bleibt schnell, 0,2–0,5 s.
- **Ursache:** `lib/career/job-pool/canonical-mapping.ts:94–193` persistiert jede Organisation, Rolle, Bindung, jedes Profil und jede Anforderung einzeln und nacheinander mit `await`; dazu kommt die durable Anforderungsrekonstruktion.
- **Folge im Test:** Der erste Test der HTTP-Suite (4,2 s bei 5 s Limit) kippt im Batch unter Last.
- **Korrektur:**
  - Gebündelte Writes in einer Transaktion (GELB, `lib/career/job-pool`).
  - Das Test-Timeout für Upload-Tests anheben (PINK).

### F-8 · Planetarium ab etwa 64 Organisationen nicht mehr lesbar (NIEDRIG bis MITTEL)
- **Wirkung:**
  - Bei 16 und 32 Organisationen gibt es keine Überlappung.
  - Bei 64 Organisationen entsteht ein zweiter Ring mit 32 überlappenden Körperpaaren. Die kleinsten Körper haben nur noch 25 px Radius; Schrift und Klickziele werden zu klein.
- **Beleg:** `shots/D2-x4-field.jpg`.
- **Korrektur:** Eine Layout-Regel für große Pools, etwa Ringzahl, Abstand und Detailstufe der Beschriftung. Wegen des Design-Freeze ist das eine Owner-Entscheidung.

## 4. Beobachtungen ohne Fehlerstatus
- Die erste Matching-Anfrage nach einem Serverstart dauert etwa 5,6 s. Das ist Dev-Kompilierung und nur im Dev-Modus so.
- `GET /api/career/analyses/{id}` liefert weiterhin die Legacy-Felder `matching` und `recommendations.capabilityGaps`. Das Job Field bindet sie nicht; das belegt der Governance-Test.
- Es war keine Messung in einem Browser mit GPU möglich. Die Bildraten (2–7 fps headless) sind nur relativ aussagekräftig. Der Vorher/Nachher-Vergleich zur Resonanz zeigte keine Regression.

## 5. Eigene Prüffehler (transparent korrigiert, keine Produktfehler)
1. **Duplikat-Upload:** Der Zustand heißt `IDENTICAL_EXISTS`; ich hatte `IDENTICAL` erwartet.
2. **`data-requirement-count`:** Er zählt die Anforderungszeichen der beobachteten Ebene, auf Feldebene also laut Vertrag 0 (PINK-Walk Z. 348). Ich hatte 79 bzw. 130 erwartet. Die rollengenaue Prüfung (alle 25 Rollen) ist grün.
3. **Label-Name:** Er lautet `NOT_A_CANONICAL_EVALUATION`; mein Erwartungswert war falsch geschrieben.
4. **Onboarding-Overlay:** Es war in einem Skriptschritt nicht geschlossen; der Schritt wurde wiederholt.

Die ursprünglichen Zeilen stehen weiter in `results.jsonl`, die Korrekturzeilen direkt dahinter.

## 6. Nicht abgedeckt
- Kein vollständiger Walk in deutscher Sprache.
- Keine Fehlerpfade des Modells, etwa Gemini-Fehler oder Timeout.
- Keine gleichzeitigen Nutzer.
- Kein HR Decision Loop.
- Die tieferen Ebenen des Capability Field (Kosmos und Deep Focus) wurden nicht erneut durchlaufen.

## 7. Reproduktion
- **Echte Umgebung:**
  - `HR_LOOP_LOCAL_PORT=<frei> GEMINI_MODEL=gemini-3.1-pro-preview npm run job-pool:local`, mit `GEMINI_API_KEY` nur in der Shell, in einem eigenen Worktree und **nie auf 3017**.
  - Danach `scripts/phaseA.mjs` bis `phaseD2.mjs` in dieser Reihenfolge. `common.mjs` setzt `E2E_BASE`; die Skripte erwarten Pfade im Scratchpad und müssen bei Bedarf angepasst werden.
- **Suiten:** `npm run -s test:isolated -- <Datei>` mit `CONDYN_PLAYWRIGHT_MODULE` gesetzt.
- **Erhaltener Stand:** Die Wegwerf-Datenbank `condyn_test_0d1a8d08dcf3ada4` mit beiden Analysen und allen Pools bleibt bis zur Freigabe erhalten. Ihr Server läuft auf 41821; der Worker ist aus.

## 8. Vorgeschlagene Reihenfolge der Korrekturen (erst nach Befund-Freigabe)

| Befund | Zuständig | Art |
|---|---|---|
| F-2, F-3 | Owner und GELB | Grundsatzentscheidung zur Bewertungsbasis |
| F-1 | GRÜN | Capability-Hülle mit R10-Nachweis |
| F-4 | GRÜN | Hüllenhöhe mit R10b-Nachweis |
| F-7 | GELB | Upload bündeln |
| F-5 | GRÜN | Doku und Vorschlag |
| F-6 | PINK | Testvertrag |
| F-8 | Owner | Layout-Regel für große Pools |
