# CONDYN — Antigravity Video Handoff

Stand: 2026-10-19. Owner-Auftrag „SFE — GELB | ANTIGRAVITY VIDEO HANDOFF“. Verantwortlich: GELB.

Dieses Dokument versetzt Antigravity in die Lage, den End-to-End-Ablauf von Decision Loop Labs selbstständig im Browser auszuführen, zu prüfen und aufzuzeichnen. Antigravity muss dafür die Produktarchitektur nicht erraten.

Codestand ist die Integration `integration/job-field-governance` ab `fe5cbea`. Der App-Code ist dort gleich `5293eb1`; VIDEO FREEZE gilt. PINK hat diesen Stand am 2026-10-19 ohne Abweichung nachgeprüft.

Grundlagen:
- `docs/CONDYN_VIDEO_READINESS_2026-10-19.md` für Labor, Storyboard, Architekturfrage und Blocker;
- `docs/CONDYN_INTEGRATION_2026-10-15_THREE_MODES.md` für die integrierten Stände und Prüfungen;
- das ausführbare Referenzskript `docs/career_analysis/evidence/video-readiness/scripts/video-walk.mjs`.

**STOP** vor einer eigenständigen Videoaufnahme, vor neuen Live-Gemini-Aufrufen und vor jedem Deployment. Jede dieser drei Stufen braucht ein eigenes Owner-GO.

## 0. Status auf einen Blick

| Bereich | Status | Nachweis |
|---|---|---|
| Ablauf im Browser mit dem lokalen Gemini-Stand-in | **bestanden**, 30/30 in jedem Durchgang, zuletzt auf `fe5cbea` | §9 |
| Bedienelemente: Beschriftung, Größe, Lage, Sichtbarkeit, Bewegung | **erfasst** bei 1920 × 1080 (43 Interaktionen) | `evidence/video-readiness/results/handoff-targets-fe5cbea-1920.json` |
| Live-Verdrahtung (Relay, Budget, Schlüsselgrenze) | **nur als Trockenlauf bestanden**: Relay gegen den lokalen Stand-in, Testschlüssel. PINK hat sie unabhängig geprüft | Readiness-Dokument §8 |
| **Echter Live-Gemini-Durchgang** | **einmal ausgeführt, 2026-10-19 (Owner-GO):** Walk 30/30, 6 echte Aufrufe (`gemini-3.1-pro-preview`), alle 200 und STOP, Restbudget 2. G-1, G-3 und G-7 sind über die Zusammenfassung geprüft, nicht über den Walk (§9). Beobachtungen O-LIVE-1 bis O-LIVE-4 | Readiness-Dokument §9 |
| **Antigravity: Datei-Upload, Klicks auf bewegte Ziele, Aufnahme, Erreichbarkeit von 127.0.0.1** | **nicht geprüft** | §10, P-1 bis P-3, P-5 bis P-8 |

Bestanden ist damit, was mit Playwright gelaufen ist: mehrfach mit dem Stand-in und einmal mit echtem Gemini. Alles, was Antigravity selbst betrifft, ist offen.

**Nachtrag 2026-10-19:** PINK hat dieses Dokument unabhängig geprüft, mit eigenem Stand-in-Labor und Code-Abgleich auf `fe5cbea`: 79 Punkte stimmen, 4 weichen ab. Die Korrekturen sind eingearbeitet: §4 Schritte 5, 6, 22, 26, 33 und Lage; §5 G-6, G-7; §6 Upload, Analysefehler, weitere Zustände; §7 Worker-Wiederholungen, A-9; §9.

## 1. Zwei getrennte Gemini-Modelle (Grundregel)

Im Ablauf kommen zwei Modelle vor. Sie dürfen sich nie berühren.

| | **DLL-Gemini** (im Produkt) | **Antigravity-Gemini** (der Agent) |
|---|---|---|
| Rolle | Der Gegenstand des Tests: Es analysiert den Lebenslauf, und Decision Loop Labs prüft und zeigt das Ergebnis | Bedient den Browser, liest den Bildschirm und das DOM, beurteilt die Prüfpunkte und nimmt auf |
| Wo es läuft | nur im Career-Worker des Labors. Im Live-Modus geht es über das Relay im Laborprozess (ein Modell, nur `generateContent`, hartes Budget); im Stand-in-Modus antwortet der deterministische lokale Stand-in | in Antigravity, außerhalb des Labors |
| Schlüssel | `GEMINI_API_KEY` aus `.env.local`. Nur der Laborprozess liest ihn; Server, Worker, Browser und Antigravity sehen ihn nie | Antigravitys eigener Zugang. Er wird nie im Labor, in der Seite oder in einer Datei des Repositorys verwendet |

**Regeln für Antigravity**
- **T-1:** Antigravity erzeugt, ergänzt, korrigiert oder „verbessert“ keine Analyseergebnisse. Es tippt keine Modelltexte in die Seite und lädt keine eigenen Dokumente hoch, nur die zwei Eingabedateien aus §3.
- **T-2:** Antigravity beurteilt das Ergebnis des DLL-Gemini nur anhand dessen, was die Seite zeigt: DOM-Attribute, sichtbarer Text, GEMINI OUTPUT. Es wertet nichts inhaltlich nach eigenem Modellwissen um. Ob eine Fähigkeit im Lebenslauf belegt ist, entscheidet der Evidenz-Validator des Produkts, nicht Antigravity.
- **T-3:** Antigravity setzt keine Umgebungsvariablen des Labors, startet keinen Worker und ruft die Gemini-API nicht direkt auf. Kein Antigravity-Aufruf zählt als Teil des DLL-Ergebnisses.
- **T-4:** Das Inspector-Token aus §3 ist ein zufälliges Lesetoken für genau dieses Labor. Es ist kein Gemini-Schlüssel und verfällt mit dem Labor. Antigravity tippt es in das Passwortfeld von GEMINI OUTPUT, schreibt es aber nicht in Protokolle oder Videountertitel.
- **T-5:** Ob ein Ergebnis vom Stand-in oder vom echten Gemini stammt, zeigt GEMINI OUTPUT → ORIGINAL RESPONSE in der Metazeile. Beim Stand-in steht dort `video-standin-001` und eine `responseId` der Form `video-…`. Ein Durchgang, der als LIVE gilt, aber das zeigt, ist ein Abbruch (A-7).

## 2. Rollen

| Rolle | Wer | Aufgabe |
|---|---|---|
| Operator | Owner oder GELB, auf dem Rechner mit dem Repository | Startet und stoppt das Labor (§3). Übergibt Antigravity die BASE-URL und das Token. Bewahrt `relay.jsonl` und die Auslesung (§7) auf |
| Antigravity | Browser-Agent | Führt §4 aus, prüft §5 und §6, protokolliert nach §8 und nimmt nach §7 auf, aber erst nach dem Owner-GO für die Aufnahme |
| PINK und GELB | Validierung | Prüfen Antigravitys Protokoll gegen dieses Dokument |

## 3. Voraussetzungen, Testdaten und Ausgangszustand

**Labor, ein frisches pro Durchgang.** Der Operator startet es aus dem Repository-Root einer Arbeitskopie auf dem Integrationsstand, in der kein anderer `next dev` läuft:

```
set -a; . <test-db-role.env>; set +a
unset DATABASE_URL CONDYN_ALLOW_SHARED_DATABASE GEMINI_API_KEY GEMINI_MODEL GOOGLE_GEMINI_BASE_URL
VIDEO_LAB_DIR=<frisches Verzeichnis außerhalb des Repos> VIDEO_LAB_PORT=41861 \
  npx tsx docs/career_analysis/evidence/video-readiness/scripts/video-lab.ts
```

- **Bereit** ist das Labor bei der Zeile `VIDEO LAB READY http://127.0.0.1:41861 … gemini=STANDIN`, im Live-Modus `gemini=LIVE model=… budget=…`.
- **Live-Modus** nur nach eigenem Owner-GO: zusätzlich `VIDEO_LAB_GEMINI=live VIDEO_LAB_LIVE_GEMINI_GO=owner-go VIDEO_LAB_GEMINI_ENV=<.env.local> VIDEO_LAB_GEMINI_BUDGET=8`. Ohne alle drei Variablen startet das Labor nicht.
- **Stoppen:** `bash docs/career_analysis/evidence/video-readiness/scripts/stop-lab.sh <VIDEO_LAB_DIR>`. Das beendet nur die eigene PID und löscht die Wegwerf-Datenbanken; vorher auslesen (§7).
- **Datenbank:** Das Labor hat eine leere Wegwerf-Datenbank. Es gibt keine Pools und keine Analysen; der Film beginnt bei null. Die gemeinsame Datenbank `condyn` wird nie berührt.

**Was Antigravity vom Operator bekommt**
- `BASE` = `http://127.0.0.1:41861`. Das ist nur lokal erreichbar, siehe P-8.
- Das Inspector-Token aus `<VIDEO_LAB_DIR>/state.json`, Feld `token`.
- Den Modus des Labors, STANDIN oder LIVE, aus derselben Datei, Feld `gemini`.

**Eingabedateien** (Pfade relativ zum Repository-Root)
- Lebenslauf: `docs/examples/cv.synthetic.pdf`, ein synthetisches Profil „Alex Example“. Die Zeile, die der Stand-in als Evidenz zitiert, lautet „…in logistics. Focus on TypeScript, React and Node.js, relational databases and automated testing.“
- Jobpool: `docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json`. Upload-ID `JPOOL_B94850C439974E27496FE3B1A9A076B5`, 3 Organisationen, 9 Rollen.
  - Für PERSON × JOB: Organisation `org_kestrel` („Kestrel Logistics Software GmbH“), Rolle `role_kestrel_fullstack` („Senior Full-Stack Engineer – Shipment Tracking“, 9 Anforderungen).
  - Für JOB ONLY: Rolle `role_kestrel_frontend_architect` („Frontend Architect“, 10 Anforderungen).
- Actor-ID für den Pool-Upload: ein beliebiger Bezeichner, z. B. `DLL_VIDEO_OPERATOR`.

**Browser**
- Chromium, Viewport 1920 × 1080, Zoom 100 %, Sprache Englisch (die UI-Texte unten sind englisch).
- **Frisches Profil ohne gespeicherten Zustand**, sonst erscheint das Onboarding nicht.
- Ein einziger Tab; Benachrichtigungen aus.
- Die Monospace-Schrift ist ein lokal installiertes JetBrains Mono oder die Standard-Monospace des Systems. Das Schriftbild hängt also vom Aufnahmegerät ab.

## 4. Bedienreihenfolge

Jede Zeile ist eine Szene des Films und ein Prüfpunkt des Referenzskripts (V-xx).

**Wie die Spalten zu lesen sind**
- **Ziel:** die sichtbare Beschriftung, darunter das `data-testid`.
- **Warten bis:** die Bedingung, nach der die nächste Zeile beginnt.
- **Erwartet:** zuerst der *tatsächliche* Zustand aus dem Stand-in-Durchgang auf `fe5cbea`. Wo Live abweichen darf, steht das dabei.
- **Lage:** Die Pixelangaben sind bei 1920 × 1080 in einem Lauf gemessen (x, y, Breite × Höhe). **Sie sind nicht reproduzierbar:** In PINKs frischem Lauf lagen Pool-Dateifeld und Kestrel-Körper einmal 61 px höher. Ziele immer über Beschriftung oder `data-testid` finden, nie über Koordinaten.
- **Bewegung:** „bewegt sich“ heißt, das Element hat sich in 400 ms um mehr als 1 px verschoben; hier hilft der Tipp zu B-4 in §10.

| # | Szene | Aktion | Ziel (sichtbar · `data-testid`) | Warten bis | Erwartet (tatsächlich) |
|---|---|---|---|---|---|
| 1 | V-01 | `BASE/career/demo` öffnen | — | Netz ruhig; Overlay `guided-onboarding-overlay` sichtbar | Das Onboarding liegt über dem Feld |
| 2 | V-01 | Onboarding schließen | „✕“ oben rechts im Overlay · `onboarding-close-btn` (8 × 18 px bei 1183, 443; sehr klein). **Esc schließt es nicht** | Overlay entfernt | Grundzustand: Modus PERSON × JOB, Capability gesperrt (`data-capability-gate=AWAITING_JOB` am Wurzelelement `semantic-career-intelligence-field`), kein Pool |
| 3 | V-02 | Modus PERSON wählen | „PERSON“ im Modus-Schalter oben rechts · `investigation-mode-PERSON` (1209, 82) | `data-investigation-mode=PERSON` am Wurzelelement | Capability offen (`OPEN`); oben links „NO JOB SCOPE · PERSON“ |
| 4 | V-02 | Capability Field öffnen | „◈ CAPABILITY FIELD“ · `field-focus-capability-btn` (729, 76) | `data-field-focus=CAPABILITY` | Die Dock „INGEST KNOWLEDGE“ ist links sichtbar |
| 5 | V-02 | **PDF hochladen** | „+ UPLOAD PDF DOCUMENT“ · `add-pdf-source-btn` öffnet den nativen Dateidialog; das eigentliche Feld `source-dock-file-input` ist ein **verstecktes** `<input type=file>` (`display:none`). Die Datei ist `cv.synthetic.pdf` (P-1) | unter STAGED SOURCES steht „PDF cv.synthetic.pdf“; `analyze-investigation` erscheint | Die Dock nennt „INVESTIGATION BOUNDARY · PERSON“ |
| 6 | V-02 | Analyse starten | „START ANALYSIS (POST)“ · `start-intake-analysis-btn` (68, 738) | `intake-success-banner` sichtbar. Dazwischen zeigt `intake-telemetry-banner` „INTAKE TELEMETRY // STEP: …“ mit SUBMITTING, QUEUED, LOADING_RESULT und möglicherweise „ANALYZING SOURCES...“ (von PINK nie beobachtet). Die Stufen sind keine Wartebedingung. **Stand-in einige Sekunden (gemessen 2–17 s); live gemessen 113,5 s, Zeitlimit 15 min** | Genau ein ANALYZE-Request: ein PDF, `investigation:{mode:PERSON}`, kein `jobScope`. Banner „ANALYSIS COMPLETED SUCCESSFULLY“, darunter „PERSON · WITHOUT A JOB SCOPE“ (`intake-success-investigation`, `data-investigation-mode=PERSON`) |
| 7 | V-03 | Capability-Kosmos öffnen | Kreis „02 ⬡ CAPABILITY FIELD“ · `focused-stage-bubble-02` (1162, 352; 168 × 168) | Knoten `capability-cosmos-node-*` vorhanden | Stand-in: 12 Vorschläge, alle „PROPOSED“. **Live: Anzahl und Namen frei**; jeder Knoten muss PROPOSED tragen |
| 8 | V-03 | Einen Vorschlag öffnen | Knoten „TypeScript“ (Stand-in) bzw. ein beliebiger Knoten (live) · `capability-cosmos-node-<PCAP_…>` (**bewegt sich**, ca. 140 × 103) | `capability-focus-evidence-surface` sichtbar | „EVIDENCE // SOURCE MATCHING ONLY“, Quelle „cv.synthetic.pdf // DOCUMENT“ und das wörtliche Zitat aus dem PDF (siehe §5) |
| 9 | V-03 | Zurück | zuerst der Nukleus „CAPABILITY NUCLEUS // PROPOSED …“ · `capability-focus-nucleus-<PCAP_…>`, dann das Kosmos-Zentrum „02 CAPABILITY FIELD · CAPABILITY COSMOS“ · `capability-cosmos-center` (**bewegt sich**). **Esc verlässt den Tiefenfokus nicht** | `data-zoom-level=1`, dann `0` | Grundebene; die Dock ist wieder bedienbar |
| 10 | V-04 | Jobfeld öffnen | „⬡ JOB FIELD“ · `job-pool-panel-toggle` (977, 76) | `data-field-focus=FIELD` | Links die Karte „JOB FIELD“ mit „POOLS“, „+ INTAKE“, „GEMINI OUTPUT“ |
| 11 | V-04 | GEMINI OUTPUT öffnen | „GEMINI OUTPUT“ · `syntx-gemini-output-toggle` | `syntx-gemini-output` sichtbar, `data-inspection-state=IDLE` | Panel „GEMINI OUTPUT — Read-only inspector …“ |
| 12 | V-04 | Token eingeben und lesen | Passwortfeld „INSPECTOR TOKEN“ · `syntx-gemini-token`, dann „READ“ · `syntx-gemini-read`. Die Schaltfläche fährt beim Öffnen kurz ein (**bewegt sich**) | `data-inspection-state=AVAILABLE` | ORIGINAL RESPONSE mit `data-original-state=RETAINED`, Chips „sha256 ✓“, „parser = text ✓“, „STOP“. Metazeile: Modellversion · responseId · Zeitpunkte (T-5) |
| 13 | V-04 | Ansicht SCOPE | „INVESTIGATION SCOPE“ · `syntx-gemini-view-SCOPE` | `syntx-gemini-scope` sichtbar | `data-scope-state=UNSCOPED`: Die PERSON-Analyse hat keinen Job gesehen |
| 14 | V-04 | Ansicht PROCESSING | „PARSER · VERIFICATION · CONVERGENCE“ · `syntx-gemini-view-PROCESSING` | `syntx-gemini-processing` sichtbar | Parser, Evidenzprüfung je Anspruch und Convergence getrennt. Stand-in: genau ein Anspruch REJECTED (der erfundene „Quantum Annealing“). **Live: REJECTED nur, wenn das Modell etwas ohne Beleg behauptet hat** |
| 15 | V-04 | GEMINI OUTPUT schließen | „HIDE GEMINI OUTPUT“ · `syntx-gemini-output-toggle` | Panel weg | — |
| 16 | V-05 | Pool-Intake öffnen | „+ INTAKE“ · `job-pool-intake-toggle` | `job-pool-upload` sichtbar | Formular rechts |
| 17 | V-05 | **Pool-Datei wählen** | natives, **sichtbares** Dateifeld · `job-pool-file-input` (1608, 362; 252 × 26). Datei `DLL_JOBPOOL_ENGINEERING.json` (P-1) | Upload-Schaltfläche aktiv | — |
| 18 | V-05 | Actor-ID eintragen | Textfeld · `job-pool-actor-input`; den vorbelegten Wert durch `DLL_VIDEO_OPERATOR` ersetzen | — | — |
| 19 | V-05 | Hochladen | „UPLOAD →“ · `job-pool-upload-btn` | `job-pool-upload-result` mit `data-upload-outcome=CREATED` | „UPLOAD PERSISTED (NEW) · JPOOL_B94850C4… · DLL Engineering & Architecture Pool v1 · ACTIVE · UPLOADED != SELECTED“ |
| 20 | V-05 | Intake schließen, Pool wählen | „HIDE INTAKE“, dann „SELECT“ am Pool · `job-pool-select-JPOOL_B94850C439974E27496FE3B1A9A076B5` | `syntx-organization-org_kestrel` vorhanden | Die URL trägt `jobPoolUploadId`. 3 Organisationen, 9 Rollen |
| 21 | V-06 | Organisation Kestrel | Körper „01 ⬡ KESTREL LOGISTICS SOFTWARE GMBH“ · `syntx-organization-org_kestrel` (873, 170; 175 × 175) | `syntx-role-role_kestrel_fullstack` vorhanden | Organisations-Kosmos mit 3 Rollenkarten auf dem kompakten Orbit (Storyboard 10) |
| 22 | V-06 | Rolle wählen | Karte „SENIOR · L4 · Senior Full-Stack Engineer – Shipment Tracking“ · `syntx-role-role_kestrel_fullstack` (**kreist**, ca. 219 × 100). Im DOM liegen die Karten aller 9 Rollen, auch die der anderen Organisationen: über die Test-ID ansprechen, nicht zählen | `syntx-field` mit `data-observation-kind=ROLE`, `data-observation-id=role_kestrel_fullstack` | 9 Anforderungen. Die PERSON-Analyse wird **nicht** verglichen: `data-analysis-source=NONE`, Hinweis „PERSON · NO JOB COMPARISON“ |
| 23 | V-07 | (Nachweis, kein Bild) | — | — | B2 lehnt die PERSON-Analyse für diese Rolle mit 409 `ERR_JOB_COMPARISON_NOT_SCOPED` ab; `/matches` ebenfalls mit 409 `ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`. Im Bild ist das Schritt 22 und V-12b |
| 24 | V-08 | Modus PERSON × JOB | „PERSON × JOB“ · `investigation-mode-PERSON_X_JOB` (1276, 82) | `data-investigation-mode=PERSON_X_JOB` | Capability wieder gesperrt, bis ein Job gewählt ist |
| 25 | V-08 | Rolle als Job wählen | „◎ SELECT AS JOB“ · `syntx-job-scope-select` | `data-capability-gate=OPEN`; `job-scope-indicator` mit `data-job-scope-state=VALID` | Oben links „JOB · Senior Full-Stack Engineer – Shipment Tracking · Kestrel Logistics Software GmbH · DLL Engineering & Architecture Pool“ |
| 26 | V-08 | Capability Field | „◈ CAPABILITY FIELD“ · `field-focus-capability-btn` | `data-field-focus=CAPABILITY` | **Das PDF ist noch gestagt**, kein zweiter Upload. Die Dock nennt „INVESTIGATION BOUNDARY · PERSON × JOB“. Die Rolle steht nicht an der Dock, nur im Job-Indikator oben links |
| 27 | V-08 | Zweite Analyse starten | „START ANALYSIS (POST)“ · `start-intake-analysis-btn` | `intake-success-investigation` mit `data-investigation-mode=PERSON_X_JOB`. **Stand-in einige Sekunden (gemessen 2–17 s); live gemessen 104,6 s, Zeitlimit 15 min** | Genau ein neuer ANALYZE-Request: dasselbe PDF, `investigation:{mode:PERSON_X_JOB}`, `jobScope` = genau dieser Pool und diese Rolle |
| 28 | V-09 | Zur Rolle | Job-Indikator oben links · `job-scope-indicator` | `syntx-field` mit `data-analysis-source=JOB_RESULT` | Die Rolle vergleicht diese Analyse. Je Anforderung `data-support`; Stand-in: 6 SUPPORTED, 1 WEAK, 2 OPEN |
| 29 | V-09 | B2 öffnen | „◎ B2 COVERAGE“ · `syntx-investigation-toggle` | `syntx-coverage` mit `data-coverage-state=AVAILABLE` | Stand-in: `data-covered=7`, `data-not-covered=2`, je Anforderung EXACT oder TOKEN_CONTAINMENT mit wörtlichem Zitat, `data-scored=false`, gebunden an diese Analyse (`data-binding-analysis`). **Live: Zahlen frei, die Bindung muss stimmen** |
| 30 | V-09 | B2 schließen | Esc | — | — |
| 31 | V-10 | GEMINI OUTPUT der zweiten Analyse | wie 11–13 | `data-inspection-state=AVAILABLE`, dann SCOPE | `data-scope-state=RETAINED`. Der Scope-Text nennt `role_kestrel_fullstack`; er ist ausdrücklich keine Evidenz |
| 32 | V-11 | JOB ONLY | Deep Link (§4.1, „JOB ONLY“) | `job-scope-indicator` mit `data-job-scope-state=VALID` | `data-investigation-mode=JOB`, `data-capability-gate=JOB_MODE`, `data-analysis-source=NONE` |
| 33 | V-11 | Struktur | „⬡ JOB STRUCTURE“ · `syntx-investigation-toggle` | `syntx-job-structure` mit `data-structure-state=AVAILABLE` | Überschrift „JOB · STRUCTURE“ (Vertrag `JOB_STRUCTURE_V1`, nicht sichtbar). 10 Anforderungen (`syntx-structure-req-*`) in Pool-Reihenfolge mit Belegzeilen aus der Pool-Quelle; 8 Befunde (`syntx-job-structure-findings[data-finding-count]`) |
| 34 | V-11 | GEMINI OUTPUT in JOB | Esc, dann „GEMINI OUTPUT“ | `data-inspection-state=NO_GEMINI` | „No Gemini call in this mode“ |
| 35 | V-12 | Deep Link PERSON × JOB | §4.1, „Analyse an ihrer Rolle“ mit der Analyse aus 27, dann „◎ B2 COVERAGE“ | `data-coverage-state=AVAILABLE` | B2 wie in 29 |
| 36 | V-12 | Deep Link PERSON an derselben Rolle | derselbe Link mit der Analyse aus 6, dann „◎ B2 COVERAGE“ | `data-coverage-state` ≠ LOADING | `NOT_SCOPED`: „This analysis is a PERSON analysis: no job comparison.“ |

Für den Film sind 23 und 36 optional. Sie zeigen die Architekturgrenze: Eine PERSON-Analyse wird keiner Stelle nachträglich zugeordnet. Für den Rollenbezug braucht es eine neue PERSON-×-JOB-Analyse; Begründung im Readiness-Dokument §3.

Die Analyse-IDs (`ANL_…`) liest Antigravity aus `syntx-gemini-output[data-analysis-id]` (Schritt 12 für PERSON) und aus `syntx-coverage[data-binding-analysis]` (Schritt 29 für PERSON × JOB).

### 4.1 Deep Links

`<BASE>` = `http://127.0.0.1:41861`, `POOL` = `JPOOL_B94850C439974E27496FE3B1A9A076B5`.

- Rolle im Jobfeld: `<BASE>/career/demo?focus=FIELD&jobPoolUploadId=POOL&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_fullstack`
- Analyse an ihrer Rolle: derselbe Link plus `&analysisId=<ANL_…>&jobScopePoolUploadId=POOL&jobScopeRoleId=role_kestrel_fullstack`
- JOB ONLY: `<BASE>/career/demo?focus=FIELD&jobPoolUploadId=POOL&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_frontend_architect&jobScopePoolUploadId=POOL&jobScopeRoleId=role_kestrel_frontend_architect&investigationMode=JOB`

Deep Links funktionieren erst, wenn Pool und Analysen im Labor existieren, also nach den Schritten 19 und 27. Für einen Capability-Knoten gibt es keinen Deep Link.

## 5. Gemini-Ergebnisse und Evidenz prüfen

Diese Prüfungen gelten in beiden Modi. Im Live-Modus sind sie der eigentliche Gegenstand. Antigravity hält dabei den beobachteten Wert fest, nicht den erwarteten.

| ID | Prüfung | Wo | Bestanden, wenn |
|---|---|---|---|
| G-1 | Herkunft | GEMINI OUTPUT → ORIGINAL RESPONSE, Metazeile | Modus STANDIN: `video-standin-001` / `video-…`. Modus LIVE: eine echte Modellversion und eine `responseId`, die nicht mit `video-` beginnt (T-5) |
| G-2 | Unverändert aufbewahrt | dieselbe Ansicht | `data-original-state=RETAINED`, Chips „sha256 ✓“ und „parser = text ✓“ |
| G-3 | Abschluss | Chip mit dem finishReason | `STOP`. Alles andere, etwa `MAX_TOKENS` oder `SAFETY`, wird festgehalten und ist eine Abweichung |
| G-4 | Evidenz je Vorschlag | Capability-Kosmos → Knoten → Evidenzfläche (Schritt 8), für mindestens drei Knoten | Jede Evidenz nennt `cv.synthetic.pdf` und zitiert eine Zeile, die wörtlich im PDF steht. Der Status ist SOURCE_MATCH_VERIFIED, im Bild „SOURCE MATCHING ONLY“ |
| G-5 | Verworfene Ansprüche | PROCESSING | Jeder Anspruch hat einen Prüfstatus (VERIFIED oder REJECTED_*). Verworfene erscheinen **nicht** als Knoten im Kosmos |
| G-6 | Grenze der Antwort | SCOPE | PERSON: UNSCOPED. PERSON × JOB: RETAINED mit der gewählten Rolle. `NOT_RETAINED` (nur Hash) bei PERSON × JOB ist eine Abweichung |
| G-7 | Wiederverwendung | Panel GEMINI OUTPUT, `data-run-reused` | `false`. Bei `true` hat dieser Auftrag die **Discovery** nicht selbst aufgerufen; das ist im Film falsch. Die Legacy-Analyse ruft Gemini bei jedem neuen Auftrag auf |

**Was der Walk nicht prüft:** Das Referenzskript prüft G-1 (Herkunft), G-3 (finishReason) und G-7 nicht. Im LIVE-Modus prüft es V-03b, V-04c und V-09b nur abgeschwächt. Ein Labor im Modus LIVE mit Stand-in-Antworten bestünde den Walk also (so geschehen in den Trockenläufen, absichtlich). G-1, G-3 und G-7 prüfen der Mensch oder `live-summarize.mjs` (Modellversion, `responseId`, finishReason, `reused`).
| G-8 | Bindung von B2 | `syntx-coverage` | `data-binding-analysis` ist die PERSON-×-JOB-Analyse, nicht die PERSON-Analyse; `data-scored=false` |

**Was GEMINI OUTPUT nicht zeigt:** Die Originalantwort ist nur für die **Discovery** aufbewahrt. Die zweite und dritte Gemini-Antwort je Analyse (Convergence und die Legacy-Analyse) sind nicht als Rohtext archiviert. Von ihnen ist nur das verarbeitete Ergebnis sichtbar: Convergence in PROCESSING, die Legacy-Analyse als Banner und Feld. Antigravity darf für diese beiden Aufrufe keine Originalantwort als „geprüft“ melden.

## 6. Zustandsübergänge und Fehlerbedingungen

**Analyse** (Wurzelelement und Banner)

| Zustand | Erkennung | Bedeutung, was zu tun ist |
|---|---|---|
| läuft | `intake-telemetry-banner`: SUBMITTING → QUEUED → ANALYZING SOURCES... → LOADING_RESULT | warten, Zeitlimit §4 |
| fertig | `intake-success-banner`, `intake-success-investigation[data-investigation-mode]` | weiter |
| abgelehnt oder fehlgeschlagen | `intake-error-banner` mit `data-error-code` und `data-http-status`. Titel: „NO VALID JOB SCOPE“, „NO CLEAR INVESTIGATION BOUNDARY“, „SEMANTIC BOUNDARY VIOLATION“ (HTTP 422) oder „PROVIDER TRUNCATION“ (HTTP 503), sonst „ANALYSIS FAILED“. **Ein Fehler im Worker, also jeder Gemini-Fehler (Truncation, 429, 5xx, 401/403), hat keinen HTTP-Status.** Er erscheint als „ANALYSIS FAILED“ mit dem Code des Fehlers oder `EXECUTION_FAILED`; der eigentliche `ERR_…` steht im Meldungstext. Die Analyze-Route selbst liefert nie 503, und ihr einziger 422 ist `ERR_JOB_SCOPE_INVALID` (PINK) | **Abbruch A-2.** Code, Status und Meldung festhalten. **„RETRY“ (`retry-intake-btn`) nicht drücken**: Im Live-Modus löst das neue Gemini-Aufrufe aus |
| Job fehlt | `analyze-job-scope-required` an der Dock (PERSON × JOB ohne gewählten Job); START ANALYSIS gesperrt | Ablauffehler: zurück zu Schritt 25 |

**GEMINI OUTPUT** (`syntx-gemini-output[data-inspection-state]`)
- **IDLE:** noch nicht gelesen.
- **LOADING:** wird gelesen.
- **AVAILABLE:** gelesen.
- **NO_ANALYSIS:** Es ist keine Analyse im Blick.
- **NO_GEMINI:** Modus JOB.
- **CLOSED:** Token falsch oder Inspector aus. Das Labor setzt beides; also Token prüfen, **nicht raten**.
- **NOT_FOUND:** keine Inspector-Referenz zur Analyse.
- **LINEAGE_INVALID:** Lauf und Archiv passen nicht zusammen. Abbruch A-5.
- **FAILED:** Lesefehler. Abbruch A-5.
- `data-original-state=NOT_RETAINED` heißt: Es gibt keine Originalantwort. Das ist eine Abweichung; G-2 ist dann nicht bestanden.

**B2** (`syntx-coverage[data-coverage-state]`)
- **AVAILABLE:** Abdeckung liegt vor.
- **NOT_SCOPED:** PERSON-Analyse oder Lauf ohne Scope. In Schritt 36 erwartet, sonst Abweichung.
- **SCOPE_MISMATCH**, **SCOPE_DRIFT**, **SCOPE_UNAVAILABLE:** Die Analyse gehört zu einem anderen oder veränderten Job.
- **LINEAGE_INVALID**, **NOT_FOUND**, **NOT_PROVISIONED**, **FAILED:** Abweichung, festhalten.
- Außerdem **IDLE**, **LOADING** und **NO_ANALYSIS** (keine Analyse im Blick).
- `data-match-basis` je Anforderung: EXACT, ALIAS, COMPOSITE_CONSTITUENT oder TOKEN_CONTAINMENT.

**JOB-Struktur** (`syntx-job-structure[data-structure-state]`)
- **AVAILABLE:** Struktur liegt vor.
- **UNAVAILABLE:** Pool unbekannt, Rolle nicht im Pool oder Pool nicht ACTIVE.
- **LINEAGE_INVALID**, **NOT_PROVISIONED**, **FAILED:** Abweichung. Außerdem **IDLE** und **LOADING**.

**Weitere Zustände**
- Job-Indikator `job-scope-indicator[data-job-scope-state]`: VALID, NONE, CHECKING, INVALID.
- Quelle des Vergleichs `syntx-field[data-analysis-source]`: NONE, JOB_RESULT und URL (über den Deep Link mit `analysisId`).
- Unterstützung je Anforderung `data-support`: SUPPORTED, WEAK, SWEEP_ONLY („nur durch einen unbewerteten Sweep-Vorschlag abgedeckt“), OPEN, UNREAD.
- Scope in GEMINI OUTPUT `syntx-gemini-scope[data-scope-state]`: UNSCOPED, RETAINED, NOT_RETAINED.

**Pool-Upload** (`job-pool-upload-result[data-upload-outcome]`)
- **CREATED:** im frischen Labor erwartet.
- **IDENTICAL_EXISTS** („IDENTICAL UPLOAD ALREADY PERSISTED“): Das Labor ist nicht frisch; zurück zu §3.
- Ablehnungen und Fehler stehen in eigenen Elementen, alle eine Abweichung:
  - `job-pool-upload-rejected` mit `data-rejection-code` und `data-rejection-status`: 400 `ERR_JOB_POOL_JSON_INVALID` oder ACTOR_INVALID, 413 TOO_LARGE, 422 SCHEMA_INVALID oder REFERENCE_INVALID;
  - `job-pool-upload-not-provisioned`;
  - `job-pool-upload-failed`.

**Grenzen, die nicht verletzt werden dürfen** (V-07 und V-12b): Die PERSON-Analyse bekommt nie einen Jobvergleich. B2 antwortet 409 `ERR_JOB_COMPARISON_NOT_SCOPED`, `/matches` 409 `ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`, und die Seite zeigt NOT_SCOPED.

## 7. Wartebedingungen, Abbruchkriterien, Aufnahme

**Warten:** Nur auf die DOM-Bedingungen der Spalte „Warten bis“ warten, nie auf feste Zeiten. Die Zeitlimits sind:
- 30 s für jeden UI-Übergang;
- 60 s für den Pool-Upload;
- 15 min für jede Analyse im Live-Modus (Stand-in: 5 min).

**Abbruchkriterien.** Antigravity hält an, protokolliert und meldet. Es versucht es nicht erneut im selben Labor.
- **A-1:** ein Seitenfehler im Browser (Konsole `pageerror`).
- **A-2:** `intake-error-banner` erscheint.
- **A-3:** Ein Zeitlimit läuft ab.
- **A-4:** Ein erwarteter Grenzzustand stimmt nicht. Das sind der Modus am Banner, `jobScope` des Requests, B2-Bindung, NOT_SCOPED in Schritt 36 und NO_GEMINI in JOB.
- **A-5:** GEMINI OUTPUT ist LINEAGE_INVALID oder FAILED, oder `RETAINED` fehlt.
- **A-6:** Der Pool ist schon vorhanden, oder G-7 zeigt Wiederverwendung. Das Labor ist dann nicht frisch.
- **A-7:** Die Herkunft (G-1) passt nicht zum Modus des Labors.
- **A-8:** Antigravity müsste von dieser Reihenfolge abweichen oder raten.
- **A-9 (Operator, Live-Modus):** Bei einem Fehler-Banner, einem abgelaufenen Zeitlimit oder Restbudget 0 in `relay.jsonl` stoppt der Operator das Labor **sofort**. Er wartet nicht auf Wiederholungen des Workers.

**Neue Gemini-Aufrufe entstehen nicht nur über RETRY** (PINK, Code auf `fe5cbea`):
- **RETRY** (`retry-intake-btn`) ist eine neue Einreichung mit neuem Auftrag und der ganzen Pipeline. Nie drücken.
- **Der Worker wiederholt selbst,** ohne Aktion in der UI. Ein nicht-terminaler Fehler, also jeder Gemini-Fehler, setzt den Auftrag zurück auf PENDING, bis zu 3 Versuche. Erst danach erscheint der Fehler-Banner; bis dahin können schon mehrere echte Aufrufe gelaufen sein.
  - Die Discovery kann ab dem zweiten Versuch wiederverwendet werden; die Legacy-Analyse ruft jedes Mal neu.
- **Die Legacy-Analyse hat eine Modell-Kaskade:** GEMINI_MODEL, dann ältere Modelle. Bei MAX_TOKENS erzeugt sie bis zu dreimal neu. Das Relay weist fremde Modelle mit 403 ab und beendet die Kaskade dort.
- **Abgelaufener Lease:** Ein Auftrag im Zustand RUNNING, dessen Lease abgelaufen ist (30 s, Heartbeat 15 s), wird neu vergeben. Ein Neustart des Workers während einer Live-Analyse heißt: Der Lauf beginnt von vorn.
- **Die harte Grenze ist das Relay-Budget**, 8 pro Labor. Ein Fehlschlag kann schon mehrere Aufrufe verbraucht haben. Maßgeblich ist `relay.jsonl`, nicht der Banner.
- **Im Live-Modus** die Seite nicht neu laden und den Worker nicht neu starten. Neu laden reicht nichts neu ein, aber die UI verliert den laufenden Auftrag.
- **Keine Gemini-Aufrufe lösen aus:** Deep Links, Moduswechsel, GEMINI OUTPUT, B2 und die JOB-Struktur. Das sind nur GET-Anfragen. START ANALYSIS ist gegen Doppelklick geschützt.

Nach einem Abbruch:
- Der Operator liest aus und stoppt das Labor (siehe Auslesen).
- Ein neuer Versuch braucht ein **frisches** Labor.
- Im Live-Modus braucht er außerdem ein neues Owner-GO; das Budget gilt pro Labor.

**Auslesen vor dem Stopp** (Operator): `node docs/career_analysis/evidence/video-readiness/scripts/live-extract.mjs <VIDEO_LAB_DIR>/state.json <walk-results.json> <frisches privates Verzeichnis außerhalb des Repos>`
- Danach erst `stop-lab.sh`.
- Die veröffentlichbare Zusammenfassung schreibt `live-summarize.mjs`. Rohantworten bleiben lokal. Vor dem Einchecken prüfen, ob freier Modelltext darin steht, der nicht veröffentlicht werden soll (PINK).
- Im Live-Modus gehört `relay.jsonl` dazu: Aufrufe, Restbudget, kein Inhalt.

**Videoablauf** (erst nach dem Owner-GO für die Aufnahme)
1. **Probe ohne Aufnahme:** ein vollständiger Durchgang nach §4 auf einem Stand-in-Labor. Er prüft P-1 bis P-3 und P-5 bis P-8. Das Labor danach stoppen.
2. **Aufnahme** auf einem frischen Labor im freigegebenen Modus.
   - Aufgenommen wird nur das Browserfenster bei 1920 × 1080. Terminal, `state.json` und Systemdialoge mit Pfaden bleiben außerhalb.
   - Das Token erscheint im Bild nur als Punkte.
3. **Schnitt:** Die Wartezeit der Analysen (Schritte 6 und 27) wird gekürzt. Alle anderen Übergänge bleiben in Echtzeit.
4. **Kennzeichnung:** Eine Aufnahme auf dem Stand-in wird im Video als „lokaler deterministischer Stand-in, nicht Gemini“ gekennzeichnet.
   - G-1 zeigt die Herkunft ohnehin im Bild.
   - Eine Live-Aufnahme nennt das Modell aus der Metazeile.
5. **Abgabe:** die Videodatei, das Protokoll nach §8, die Bildschirmfotos der Szenen und die Start- und Endzeit. Der Operator ergänzt die Auslesung und, im Live-Modus, `relay.jsonl`.

**Dev-Indikator:** Unten links zeigt `next dev` das Symbol „N“. Ohne es geht es nur mit dem Produktions-Build (`VIDEO_LAB_PROD=1`). Der scheitert auf diesem Stand an B-3 (Readiness-Dokument §6); das Ein-Zeilen-Delta ist nicht freigegeben.

## 8. Protokoll, das Antigravity abgibt

Pro Zeile aus §4 und pro Prüfung aus §5 einen Eintrag:

```
{ "step": 12, "scene": "V-04", "action": "READ", "target": "syntx-gemini-read",
  "observed": { "data-inspection-state": "AVAILABLE", "data-original-state": "RETAINED", "meta": "<modelVersion> · <responseId>" },
  "expected": "AVAILABLE / RETAINED", "result": "PASS" | "FAIL" | "NOT_RUN", "screenshot": "<datei>", "at": "<ISO-Zeit>", "note": "" }
```

Dazu der Kopf: Labor-Modus (STANDIN oder LIVE), Codestand (`git rev-parse HEAD` vom Operator), Viewport, Browser und Version sowie die Antigravity-Version. Das Modell von Antigravity steht nur hier, getrennt vom DLL-Modell (T-5).

`NOT_RUN` ist ehrlich, wenn ein Schritt nicht ausgeführt werden konnte, etwa der Upload bei P-1. Nicht ausgeführte Schritte gelten nie als bestanden.

## 9. Was bereits nachgewiesen ist

Alle Durchgänge mit Playwright (Referenzskript, DOM-Klick für bewegte Ziele) und dem Stand-in auf je einem frischen Labor:

| Durchgang | Code | Viewport | Ergebnis |
|---|---|---|---|
| Readiness 1–7 | `c43621e` bis `5293eb1` | 1600 und 1920 | jeweils 30/30 (Readiness-Dokument §1) |
| Stand-in nach der Relay-Korrektur | `d29cc00` | 1920 × 1080 | 30/30 |
| Probe der Bedienelemente | `fe5cbea` | 1920 × 1080 | 30/30; 43 Interaktionen erfasst (`results/handoff-targets-fe5cbea-1920.json`); Analysedauer 8,8 s und 13,7 s |
| Auslesekette | `d29cc00` (Werkzeuge damals noch nicht committet, inhaltsgleich mit `fe5cbea`) | 1920 × 1080 | Walk 30/30; 10 Lesezugriffe; Zusammenfassung vollständig (Stand-in; `results/standin-extract-d29cc00-1920-summary.json`) |
| **Live-Gemini, einmal** | `104410d` (App-Code `5293eb1`) | 1920 × 1080 | **30/30**; 6 echte Aufrufe, Restbudget 2; Zusammenfassung `results/live-104410d-1920-summary.json` (Readiness-Dokument §9) |
| Live-Verdrahtung, Trockenlauf | `5293eb1` und `d29cc00` | 1920 × 1080 | 30/30; genau 6 weitergeleitete Aufrufe; kein Schlüssel in Logs |

**Storyboard:** `docs/career_analysis/evidence/video-readiness/storyboard/01-…20-*.jpg`, 960 × 540, aus der Probe auf `fe5cbea`. Es sind Stand-in-Bilder. Frame 06 zeigt deshalb `video-standin-001`.

## 10. Was praktisch noch zu prüfen ist (nicht bestanden)

| ID | Voraussetzung | Warum offen | Wie prüfen |
|---|---|---|---|
| **P-1** | Datei-Upload durch Antigravity | Das PDF-Feld ist ein verstecktes `<input type=file>`; „+ UPLOAD PDF DOCUMENT“ öffnet den nativen Dateidialog. Das Pool-Feld ist ein sichtbares natives Dateifeld. Ob Antigravity Dateien direkt an ein File-Input übergeben (wie Playwright `setInputFiles`) oder den nativen Dialog bedienen kann, ist nicht geprüft (B-2) | Probe aus §7 bis Schritt 5 und 17. Wenn es nicht geht: Der Operator lädt hoch, im Film wird geschnitten. Das Protokoll sagt das |
| **P-2** | Bildschirm- oder Browseraufnahme | Ob Antigravity Video in 1920 × 1080 mit flüssigen Animationen aufnimmt (kreisende Körper, langsames Leuchten), ist unbekannt | Probe aufnehmen, Bildrate und Auflösung prüfen |
| **P-3** | Klicks auf bewegte Ziele | Knoten, Organisationskörper und Rollenkarten kreisen (in §4 „bewegt sich“). Ein Zeigerklick wartet in Playwright auf Ruhe; ein koordinatenbasierter Agent kann danebentreffen. Hover hält die Bewegung nicht an (B-4) | Probe: Schritte 8, 9, 21, 22. Wenn ein Klick danebengeht, die Fokusführung per Tastatur versuchen (Tab, Enter; die Karte „JOB FIELD“ nennt „Tab moves between carriers“, „Enter selects“) oder für das Jobfeld den Deep Link nehmen |
| ~~P-4~~ | Echter Live-Gemini-Pfad | **Einmal bestanden am 2026-10-19** (Readiness-Dokument §9): 30/30, alle 6 Antworten STOP, alle Ansprüche VERIFIED. Weiter ungeprüft ist das Verhalten bei Fehlern des echten Modells (Wiederholungen, Kaskade, §7). Mit echtem Gemini sieht der Film anders aus als mit dem Stand-in: kein verworfener Anspruch, andere Namen, B2 8/1, Rollenebene meist SWEEP_ONLY (O-LIVE-1, O-LIVE-2) | Eine Aufnahme mit echtem Gemini braucht ein neues GO |
| **P-5** | Lesen von DOM-Attributen | Viele Prüfungen in §4 bis §6 stehen in `data-*`-Attributen. Ob Antigravity das DOM lesen kann oder nur das Bild sieht, ist unbekannt | Probe. Rein visuell bleiben Banner, Titel und Chips; die Attribute ergänzt dann der Operator aus dem Referenzskript |
| **P-6** | Token-Eingabe | Das Passwortfeld nimmt Einfügen und Tippen an; mit Antigravity nicht geprüft | Probe, Schritt 12 |
| **P-7** | Onboarding im Antigravity-Browser | Es erscheint nur bei leerem Browserzustand | frisches Profil (§3) |
| **P-8** | Erreichbarkeit | Das Labor lauscht nur auf `127.0.0.1`. Läuft Antigravitys Browser nicht auf demselben Rechner, erreicht er die Seite nicht. Eine Freigabe nach außen ist nicht vorgesehen (keine öffentliche Freigabe) | Klären, wo Antigravitys Browser läuft. Er muss lokal laufen |

Bis diese Punkte geprüft sind, gilt nur der Stand-in-Ablauf mit Playwright als bestanden.

## 11. Grenzen dieser Arbeit

- Kein App-Code geändert. Kein neues Testframework: Neu ist nur ein instrumentiertes Exemplar des bestehenden Walks, `scripts/handoff-probe-walk.mjs`. Es erfasst die Bedienelemente; die Prüfungen sind dieselben 30.
- Kein Live-Gemini-Aufruf, keine Aufnahme, kein Deployment.
- Das Labor lief nur auf Wegwerf-Datenbanken.
- Die Umgebungen :3017, :41831, :41851 (DEMO REVIEW) und GRÜNs :41805 sind unberührt.
