# CONDYN — End-to-End Video Readiness

Stand: 2026-10-19. Owner-Auftrag „SFE — GELB | END-TO-END VIDEO READINESS“. Verantwortlich: GELB.
Ziel ist ein ausführbarer, dokumentierter Browser-Walk als Grundlage für die Videoaufnahme durch Antigravity. Danach STOP für das Owner-GO.

## 1. Ergebnis

Der gesamte Ablauf funktioniert im Browser, auch reproduzierbar: PDF-Upload → PERSON-Analyse → Ergebnis → Capability Field und Evidenz → GEMINI OUTPUT → Jobpool → Organisation → Rolle → PERSON × JOB → B2-Abdeckung, dazu JOB ONLY.

Jeder Durchgang lief auf einem frischen, leeren Labor. Der Walk umfasst 30 Prüfpunkte, jeder Durchgang bestand alle 30:

| Durchgang | Code | Server | Viewport | Ergebnis | Analysedauer PERSON / PERSON × JOB |
|---|---|---|---|---|---|
| 1 | Integration `c43621e` | `next dev` | 1600 × 1000 | 30/30 | 11,6 s / 17,2 s |
| 2 | Integration `c43621e` | `next dev` | 1920 × 1080 | 30/30 | 6,1 s / 3,3 s |
| 3 | Probe `c43621e` + GRÜN `6f9bc2b` | `next dev` | 1920 × 1080 | 30/30 | 10,8 s / 8,3 s |
| 4 | Probe `c43621e` + GRÜN `4ecfe67` | `next dev` | 1920 × 1080 | 30/30 | 8,0 s / 3,0 s |
| 5 | Experiment: `c43621e` mit lokal entferntem `export` (B-3), nicht committet | Produktions-Build, `next start` | 1920 × 1080 | 30/30 | 2,5 s / 2,4 s |

Weitere einzelne Durchgänge während der Rekonstruktion bestanden ebenfalls 30/30.

**Was die Durchgänge belegen**
- Echter Server und echter Worker (`scripts/run-career-worker.ts`, unverändert).
- Kernel, Prompts, Parser, Evidenz-Validator, Projektion und B2 laufen unverändert.
- Gemini ist ein **deterministischer Stand-in auf 127.0.0.1**; es gab keinen Live-Gemini-Aufruf.
  - Der Netzwerkwächter verzeichnet je Durchgang nur die geblockte Versionsabfrage von `next dev` an `registry.npmjs.org`. Im Produktionsmodus gab es keinen Netzwerkversuch.
  - Die Discovery von PERSON × JOB trug den INVESTIGATION_SCOPE-Block, die von PERSON nicht.
  - Nachweis: `evidence/video-readiness/results/*-standin.jsonl`.

**Blocker für die eigentliche Videoaufnahme:** B-1 bis B-5 in Abschnitt 6.

## 2. Der tatsächliche Ablauf (Storyboard = Walk)

Das Skript ist `docs/career_analysis/evidence/video-readiness/scripts/video-walk.mjs`. Jeder Schritt ist eine sichtbare Szene. Die Spalte „Nachweis“ nennt, was der Walk am gerenderten DOM prüft.

| Szene | Aktion im Browser | Sichtbar / Nachweis |
|---|---|---|
| V-01 | `/career/demo` öffnen; Onboarding über × schließen (`onboarding-close-btn`, Esc schließt es nicht) | Grundzustand PERSON × JOB, Capability gesperrt (AWAITING_JOB), kein Pool |
| V-02 | Modus **PERSON** (`investigation-mode-PERSON`) → CAPABILITY FIELD → PDF in die Dock (`source-dock-file-input`) → START ANALYSIS | Die Dock nennt „INVESTIGATION BOUNDARY · PERSON“. Ein ANALYZE-Request: `documents:[pdf]`, `investigation:{mode:PERSON}`, kein `jobScope`. Banner „PERSON · WITHOUT A JOB SCOPE“ |
| V-03 | Region 02 Capability Field (`focused-stage-bubble-02`) → Knoten TypeScript → Evidenz; zurück über Nukleus und Kosmos-Zentrum | 12 Vorschläge in jedem Durchgang, alle PROPOSED. Die Evidenzfläche nennt `cv.synthetic.pdf` und zitiert die PDF-Zeile wörtlich, mit „SOURCE MATCHING ONLY“. Danach wieder Zoom 0 |
| V-04 | JOB FIELD → GEMINI OUTPUT → Inspector-Token → READ; Ansichten SCOPE und PROCESSING | Die Originalantwort ist RETAINED und byte-gleich mit dem Archiv. SCOPE: UNSCOPED. PROCESSING zeigt Parser, Verifikation und Convergence getrennt; der erfundene Anspruch ist REJECTED |
| V-05 | + INTAKE → `DLL_JOBPOOL_ENGINEERING.json` → Actor-ID → UPLOAD → Pool per SELECT wählen | „UPLOAD PERSISTED (NEW)“ mit `JPOOL_B94850C4…`. Die URL trägt `jobPoolUploadId`. 3 Organisationen, 9 Rollen |
| V-06 | Organisation Kestrel → Rolle „Senior Full-Stack Engineer – Shipment Tracking“ | Organisations-Kosmos mit 3 Rollen; Rollenebene mit 9 Anforderungen. Die PERSON-Analyse wird **nicht** verglichen (Quelle NONE, „PERSON · NO JOB COMPARISON“) |
| V-07 | — (API) | B2 lehnt die PERSON-Analyse für diese Rolle mit 409 `ERR_JOB_COMPARISON_NOT_SCOPED` ab; `/matches` ebenfalls mit 409 `ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS` (Abschnitt 3) |
| V-08 | Modus **PERSON × JOB** → SELECTED JOB (`syntx-job-scope-select`) → CAPABILITY FIELD → START ANALYSIS | Der Job-Indikator nennt die Rolle. **Das PDF ist noch gestagt**, ein neuer Upload ist nicht nötig. Ein neuer ANALYZE-Request mit demselben PDF, `investigation:{mode:PERSON_X_JOB}` und `jobScope` = genau dieser Pool und diese Rolle |
| V-09 | Job-Indikator → Rollenebene → B2 COVERAGE | Die Rolle vergleicht diese Analyse (Quelle JOB_RESULT). B2 in allen fünf Durchgängen gleich: 7 abgedeckt, 2 nicht abgedeckt; EXACT bzw. TOKEN_CONTAINMENT, wörtliche Zitate, `scored: false`, gebunden an diese Analyse |
| V-10 | GEMINI OUTPUT → READ → SCOPE | Der Scope-Text ist RETAINED und trägt die Rolle; er ist ausdrücklich keine Evidenz |
| V-11 | Modus **JOB** (Deep Link mit `investigationMode=JOB`, Rolle Frontend Architect) → STRUCTURE → GEMINI OUTPUT | Capability ist geschlossen (JOB_MODE), es wird keine Analyse gelesen. `JOB_STRUCTURE_V1`: 10 Anforderungen mit Belegzeilen aus der Pool-Quelle und 8 Befunde. GEMINI OUTPUT: „No Gemini call in this mode“ |
| V-12 | Deep Links | Die PERSON × JOB-Analyse an ihrer Rolle: B2 AVAILABLE. Die PERSON-Analyse an derselben Rolle: NOT_SCOPED, „This analysis is a PERSON analysis: no job comparison.“ |

Für die Video-Dramaturgie zeigen V-07 und V-12 die Architekturgrenze; beide sind optional.

## 3. Architekturfrage: Darf eine vorhandene PERSON-Analyse einer Stelle zugeordnet werden?

**Nein.** Für den Rollenbezug braucht es eine neue, ausdrücklich rollenbezogene Analyse (PERSON × JOB). Dieser Weg ist im Produkt vorhanden und belegt (V-08).

- **Die Grenze entsteht mit der Analyse:**
  - Der Modus wird mit dem Auftrag erklärt und gespeichert.
  - Der Worker prüft ihn bei jedem Abholen erneut.
  - Die Discovery läuft genau dann mit Scope, wenn der Modus PERSON × JOB ist: Der INVESTIGATION_SCOPE-Block steht im Prompt, und der Scope-Hash steht am Lauf.
  - Die PERSON-Discovery hat die Stelle nie gesehen (Stand-in-Protokoll: `scopeBlock: false`).
- **B2 prüft die Abstammung:** Analyse → Projektion → Discovery-Lauf → Scope-Hash der gewählten Rolle. Eine PERSON-Analyse hat keinen Scope-Hash; deshalb lehnt B2 sie mit `ERR_JOB_COMPARISON_NOT_SCOPED` ab. `/matches` lehnt sie serverseitig ab (Sperre `eacfc97`), und das Frontend zeigt keinen Vergleich (URL-Grenze, `26df225`/`d54c718`).
- **Eine nachträgliche Zuordnung** ließe einen ungescopten Lauf wie einen gescopten aussehen. Damit bräche sie die Invariante „keine Analyse ohne explizite Untersuchungsgrenze“ und die Scope-Identität. Sie wäre eine neue Architekturentscheidung (Human Authority) und ist **nicht** Teil dieser Readiness.
- **Kosten des zulässigen Wegs:** eine zweite Analyse desselben PDFs, also mit echtem Gemini ein zweiter Discovery-, Convergence- und Legacy-Aufruf.
  - Die gestagte Quelle bleibt erhalten (V-08b).
  - Läufe werden nur innerhalb derselben Grenze wiederverwendet, die PERSON-Ergebnisse also nicht.

## 4. Was Antigravity braucht

**Umgebung, ein frisches Labor pro Aufnahme**
- Aus dem Repository-Root einer Arbeitskopie, in der kein anderer `next dev` läuft (Next-Dev-Lock):
  `CONDYN_PLAYWRIGHT_MODULE=<playwright/index.js> bash docs/career_analysis/evidence/video-readiness/scripts/run-take.sh <out> 1920 1080 [port]`
  Das ist der verifizierte Durchgang: Labor starten → Walk → Labor stoppen.
- Nur das Labor, für eine Aufnahme durch Antigravity:
  `VIDEO_LAB_DIR=<dir außerhalb des Repos> VIDEO_LAB_PORT=41861 npx tsx docs/career_analysis/evidence/video-readiness/scripts/video-lab.ts`
  - Davor die Test-Rolle laden: `set -a; . ~/.config/condyn/test-db-role.env; set +a`.
  - Die Variablen `DATABASE_URL`, `CONDYN_ALLOW_SHARED_DATABASE` und `GEMINI_*` dürfen nicht gesetzt sein.
  - Bereit ist das Labor bei der Zeile `VIDEO LAB READY http://127.0.0.1:41861`.
  - Gestoppt wird es mit `bash …/scripts/stop-lab.sh <dir>`: Das beendet nur die eigene PID und löscht die Wegwerf-Datenbanken.
- Das Labor nutzt nur eine leere Wegwerf-Datenbank. Die gemeinsame `condyn` wird nie berührt.

**Zustand und Eingaben**
- Die Startseite ist `http://127.0.0.1:<port>/career/demo`. Es gibt keine vorab angelegten Pools oder Analysen; das Video beginnt bei null.
- Der Lebenslauf ist `docs/examples/cv.synthetic.pdf`, ein synthetisches Profil („Alex Example“).
- Der Jobpool ist `docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json` (Upload-ID `JPOOL_B94850C439974E27496FE3B1A9A076B5`, Organisation `org_kestrel`, Rolle `role_kestrel_fullstack`; für JOB ONLY `role_kestrel_frontend_architect`).
- Der Inspector-Token für GEMINI OUTPUT steht in `<dir>/state.json` (`token`, Modus 0600) und wird pro Labor neu erzeugt. Er wird nicht dokumentiert und nicht ausgegeben.
- Als Actor-ID für den Pool-Upload dient ein beliebiger Bezeichner, z. B. `DLL_VIDEO_OPERATOR`.

**Deep Links** (`<BASE>` = `http://127.0.0.1:<port>`)
- Rolle im Jobfeld: `<BASE>/career/demo?focus=FIELD&jobPoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_fullstack`
- Fertige PERSON × JOB-Analyse an ihrer Rolle: denselben Link mit `&analysisId=<ANL_…>&jobScopePoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobScopeRoleId=role_kestrel_fullstack` ergänzen.
- JOB ONLY: `<BASE>/career/demo?focus=FIELD&jobPoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_frontend_architect&jobScopePoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobScopeRoleId=role_kestrel_frontend_architect&investigationMode=JOB`

**Schrittfolge, Selektoren und erwartete Zustände:** `video-walk.mjs`. Die Spalte „Aktion“ in Abschnitt 2 ist die Regieanweisung.

## 5. Wiederholbarkeit

- **Ein frisches Labor pro Aufnahme.** In derselben Datenbank würde ein zweiter Upload desselben PDFs unter derselben Grenze den Discovery-Lauf wiederverwenden: kein neuer Austausch, `data-run-reused` wird wahr. Außerdem wäre der Pool schon vorhanden, und V-05 zeigte dann „IDENTICAL UPLOAD ALREADY PERSISTED“.
- **Der Stand-in ist deterministisch.** Er antwortet nur aus dem gesendeten Dokument: Für jeden Begriff seiner festen Liste, der im Dokument vorkommt, zitiert er die eigene Zeile des Dokuments. Dazu kommt genau ein erfundener Anspruch, den der Validator verwerfen muss. Gleiches PDF ergibt also gleiche Vorschläge und gleiche B2-Zählung.
- **Analysedauer im Stand-in:** 2 bis 17 Sekunden.
- **Nachweise im Repository:** `evidence/video-readiness/results/` (Walk-Ergebnisse je Durchgang, Stand-in- und Netzwerkprotokoll) und `evidence/video-readiness/shots/` (vier Bilder bei 1920 × 1080 aus Durchgang 2).

## 6. Blocker und Risiken

| ID | Thema | Befund | Was es braucht |
|---|---|---|---|
| **B-1** | Live-Gemini | Der verifizierte Walk nutzt den Stand-in. GEMINI OUTPUT zeigt dann sichtbar dessen Antwort: Modell `video-standin-001`, `responseId` `video-…`, ein erfundener, verworfener Anspruch. Das darf im Video nicht als Gemini erscheinen. Mit echtem Gemini dauert eine Analyse erfahrungsgemäß etwa 2 Minuten (Demo vom 2026-10-13), hier sind es zwei | **Owner-Entscheidung.** Entweder ein Live-Gemini-GO für Aufnahme-Läufe (echter Schlüssel nur im Worker, Netzwerk nur zur Gemini-API, Wartezeit schneiden), oder eine Aufnahme mit Stand-in, im Video ausdrücklich als solche gekennzeichnet. Ein Live-Modus ist im Labor bewusst nicht eingebaut |
| **B-2** | Datei-Upload | Das PDF geht über ein verstecktes `<input type="file">` (`source-dock-file-input`, `display:none`), der Pool über `job-pool-file-input`. Ein Klick auf „+ UPLOAD PDF DOCUMENT“ öffnet den nativen Dateidialog des Betriebssystems | Klären, ob Antigravity Dateien direkt an ein File-Input übergeben kann (wie Playwright `setInputFiles`). Wenn nicht: den Upload im Video manuell bedienen oder schneiden. Der Rest des Walks braucht keinen Dateidialog |
| **B-3** | Produktions-Build | `next dev` zeigt unten links den Next.js-Dev-Indikator „N“ im Bild. `next build` scheitert auf der Integration an `app/api/admin/proxy/[...path]/route.ts`: Die Datei exportiert `handleProxy`, das ist kein gültiger Route-Export. Sie stammt aus `8677ffa`, liegt nicht auf `main` und ist von dieser Arbeit unabhängig. Lokal und nicht committet: Ohne dieses `export` baut die Integration, und der Walk besteht im Produktionsmodus 30/30 ohne Indikator (Durchgang 5). Nebenwirkung: Der Build legt `.next/types` an, und `tsc -p .` schlägt dann fehl, solange der Fehler besteht | Owner-GO für das Ein-Zeilen-Delta (`handleProxy` nicht exportieren; kein anderer Aufrufer). Alternativ mit Indikator aufnehmen |
| **B-4** | Bewegte Ziele | Capability-Knoten, Organisationskörper und Rollenkarten kreisen. Ein Zeigerklick wartet auf ein ruhendes Element (Playwright), oder ein koordinatenbasierter Agent trifft womöglich daneben. Der Walk löst sie per DOM-Klick aus. Hover hält die Bewegung nicht an | Mit Antigravity testen. Für das Jobfeld gibt es Deep Links (Abschnitt 4), für den Capability-Knoten nicht |
| **B-5** | Codestand fürs Video | Die Integration `c43621e` enthält GRÜNs vom Owner abgenommene Sichtstände nicht: Demo-UI-Fix, Rollenorbit, Rollenkarten, Fußzeile. Der Walk besteht auf beiden Ständen (Durchgänge 3 und 4) | **Owner-Entscheidung:** Aufnahme auf der Integration oder erst nach Integration des GRÜN-Stapels (eigenes Wort an GELB, PINK-Prüfung von `4ecfe67` läuft) |

**Beobachtungen ohne Blocker**
- **Onboarding:** Beim ersten Besuch erscheint das Onboarding. Es schließt nur über ×, nicht über Esc.
- **Capability-Tiefenfokus:** Esc verlässt ihn nicht. Zurück führen der Nukleus („RETURN TO CAPABILITY COSMOS“) und danach das Kosmos-Zentrum. Die Dock ist nur auf der Grundebene (Zoom 0) bedienbar.
- **Schrift:** MONO ist ein lokal installiertes JetBrains Mono, sonst die Monospace-Standardschrift (GRÜN). Das Aufnahmegerät bestimmt also das Schriftbild.
- **GEMINI OUTPUT:** Der Token wird in ein Passwortfeld getippt und erscheint im Bild nur als Punkte. Er ist pro Labor zufällig.

## 7. Grenzen dieser Arbeit

- Kein App-Code geändert, kein Kernel, kein Deployment.
- Kein Live-Gemini; die Netzwerkwächter haben jeden Fremdzugriff verweigert.
- Datenbank nur als Wegwerf-Datenbank, die gemeinsame `condyn` nicht.
- Die Umgebungen :3017, :41831, :41851 (DEMO REVIEW) und GRÜNs :41805 sind unberührt.
- Das B-3-Experiment lief nur in einer losgelösten Arbeitskopie und ist zurückgesetzt.
- Neu sind nur Skripte, Belege und dieses Dokument. Das Labor ist eine Variante des bestehenden Drei-Modi-Labors von GRÜN (`evidence/job-pool/three-modes/scripts/`); der Netzwerkwächter ist byte-gleich.
