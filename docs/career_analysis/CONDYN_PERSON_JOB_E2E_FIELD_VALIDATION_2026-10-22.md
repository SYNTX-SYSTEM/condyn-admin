# PERSON × JOB — End-to-End-Feldvalidierung (2026-10-22)

Owner-Auftrag „SYNTX::SFE::PERSON_JOB_END_TO_END_FIELD_VALIDATION“ (Lane GELB). Echte Ausführung in einem isolierten Labor mit synthetischen Testdaten. Keine Integration, kein Deployment, kein Stand-in.

Owner-Freigaben (direkt, 2026-10-22):
- Echte Gemini-Aufrufe, Budget 8.
- Codestand `49e2bc6`, also `frontend/focus-readability`, nicht integriert.

Belege liegen unter `evidence/pxj-e2e-49e2bc6/`.

## 01 — Sitzung: neu

Eine wiederverwendbare Sitzung gab es nicht:
- Der einzige frühere echte PERSON-×-JOB-Lauf (2026-10-19, `104410d`) lief auf einer Wegwerf-Datenbank, die beim Stoppen gelöscht wurde.
- GRÜNs Labore :41809 und :41810 laufen mit dem Stand-in.
- Die Demo :41831 läuft nicht mehr und stammt aus der Zeit vor der Job-Scope-Regel.

Neue isolierte Sitzung:
- Labor `http://127.0.0.1:41862`, gestartet 2026-10-22 um 02:26 MESZ, aus einer eigenen Arbeitskopie auf `49e2bc6`.
- Leere Wegwerf-Datenbank `condyn_test_f9635670…`, mit der Least-Privilege-Testrolle.
- Echter `next dev`-Server und echter Worker. Beide laufen unter dem Netzwerkwächter und erreichen Gemini nur über das Relay im Laborprozess, mit Budget 8.

Die gemeinsame Datenbank `condyn` ist unberührt.

## 02 — PDF und Testidentität

| | Wert |
|---|---|
| Datei | `docs/examples/cv.synthetic.pdf` (synthetisch) |
| SHA-256 der Datei | `efaa47ef…9f7df3` |
| Extrahierter Text, SHA-256 (eigene Extraktion mit `extractTextFromPdf`) | `3cde2451…a5e34` |
| `rawContentHash` / `normalizedTextHash` von `DOC_001` in beiden Analysen | `3cde2451…a5e34`, gleich |
| Titel | `cv.synthetic.pdf`, RESOLVED |

## 03 — Job-Pool und Rolle

| | Wert |
|---|---|
| Datei | `docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json` |
| SHA-256 der Datei = gespeicherter `rawSha256` | `6475800a…8aaf30`, gleich |
| Upload-ID | `JPOOL_B94850C439974E27496FE3B1A9A076B5` = `JPOOL_` + die ersten 32 Zeichen von `canonicalSha256`, gleich |
| Struktur | 3 Organisationen, 9 Rollen |
| Hochgeladen | über die Oberfläche (Walk V-05, `UPLOAD PERSISTED (NEW)`) |
| Pool-Auswahl | ausdrücklich durch einen Klick auf `job-pool-select-…`; danach trägt die URL `jobPoolUploadId` |
| Rollen-Auswahl | ausdrücklich: `role_kestrel_fullstack` „Senior Full-Stack Engineer – Shipment Tracking“ (org_kestrel). Der Job-Scope wird gesetzt (V-08a, Indikator VALID), bevor der zweite ANALYZE-Aufruf läuft. |
| Anforderungen | 9. Alle 9 sind in B2 feldgleich zur Originaldatei: ID, Name, Stufe, Gewicht, Notwendigkeit, Aliase, Domäne |

## 04 — Tatsächliche Ausführungen

Das Relay protokolliert nur Metadaten; nichts wurde wiederholt, nichts abgelehnt. Die Datei ist `relay.jsonl`.

| # | Art | Status | Dauer | Request / Antwort | Scope-Block | Restbudget |
|---|---|---|---|---|---|---|
| 1 | DISCOVERY (PERSON) | 200 | 28,1 s | 9 211 / 23 184 B | nein | 7 |
| 2 | CONVERGENCE | 200 | 34,1 s | 9 690 / 21 266 B | nein | 6 |
| 3 | LEGACY | 200 | 45,6 s | 11 477 / 33 470 B | nein | 5 |
| 4 | DISCOVERY (PERSON × JOB) | 200 | 27,3 s | 18 679 / 20 502 B | **ja** | 4 |
| 5 | CONVERGENCE | 200 | 30,6 s | 8 573 / 18 407 B | nein | 3 |
| 6 | LEGACY | 200 | 32,5 s | 11 477 / 22 134 B | nein | 2 |

- Netzwerk außerhalb von Loopback: nur die blockierte Versionsabfrage von `next dev` (`net.jsonl`).
- Walk 30/30 bei 1920 × 1080, 02:27–02:32 MESZ, ohne Seitenfehler (`walk-results-1920.json`).

**PERSON** `ANL_1792628831636_456`
- Job, Run und Modus: `JOB_1792628831636_456`, `RUN_AD78E73E…`, Modus PERSON, `jobScopeSelection` null, UNSCOPED.
- Antwort von `gemini-3.1-pro-preview`: `responseId` `XVjZav3nNcHT28oP2aW7wQo`, STOP, Text 7 093 Zeichen. SHA-256 und Parser stimmen, nicht wiederverwendet.
- B2 für die Rolle: 409 `ERR_JOB_COMPARISON_NOT_SCOPED`, wie verlangt.

**PERSON × JOB** `ANL_1792628993472_10`
- Job und Run: `JOB_1792628993472_10`, `RUN_6BB62BDC…`, Convergence `CONV_A30D955F…`.
- Modus PERSON_X_JOB mit `jobScopeSelection` {Pool, `role_kestrel_fullstack`}.
- Scope RETAINED: 8 626 Zeichen, Hash `8016b7c1…` von mir nachgerechnet. Der Scope-Text nennt den Pool, die Rolle und alle 9 Anforderungs-IDs und **keine andere Rolle** des Pools.
- Antwort: `responseId` `_ljZarOMB7GFxs0PzJP2sQc`, STOP, Text 5 813 Zeichen. SHA-256 und Parser stimmen, nicht wiederverwendet.

## 05 — Vorgeschlagene Fähigkeiten

Alles sind Vorschläge des Modells: PROPOSED, `authorityState` NONE, `semanticDefinitionState` NOT_RUN. **PROPOSED_CAPABILITY ≠ VERIFIED_COMPETENCE.**

- **PERSON:** 10 Vorschläge, 9 atomar und 1 zusammengesetzt. Alle sind EVIDENCE_PASSED.
  - TypeScript and Node.js Backend Development
  - React Frontend Development
  - PostgreSQL Database Design and Querying
  - Test-Driven Development (TDD)
  - CI/CD Pipeline Engineering
  - Engineering Leadership and Architecture Review (zusammengesetzt)
  - Python ETL Development
  - Dimensional Data Modeling
  - Kubernetes Deployment
  - Linux Administration
- **PERSON × JOB:** 8 Vorschläge, 5 atomar und 3 zusammengesetzt. Alle sind EVIDENCE_PASSED. Die Stufen nennt das Modell selbst; sie sind ungeprüft.

| Vorschlag | Umfang | Stufe (Modell) | Zitat aus `cv.synthetic.pdf` |
|---|---|---|---|
| TypeScript | atomar | L4 | „Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to strict TypeScript.“ |
| React | atomar | L4 | „Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against WCAG 2.1.“ |
| Node.js | atomar | L4 | wie TypeScript |
| PostgreSQL | atomar | L3 | „Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting queries.“ |
| Event-Driven Architecture | zusammengesetzt | L3 | „Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.“ |
| Automated Testing | zusammengesetzt | L4 | „Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%.“ |
| Web Platform Engineering | zusammengesetzt | — | „Senior software engineer with eight years of experience building web platforms and data pipelines in logistics.“ |
| English | atomar | — | „English (C1).“ |

Convergence:
- PASSED, mit 8 Entwürfen und ohne Zusammenlegung.
- Die Projektion trägt dazu **7 vorgeschlagene Beziehungen zwischen Fähigkeiten**: 5 × PARENT_CHILD, 2 × RELATED_CAPABILITY, alle PROPOSED. Am 2026-10-19 waren es 0.

Legacy-Analyse ohne Scope: 5 Fähigkeiten, alle PASSED.
- TypeScript and Node.js Development
- React Frontend Development
- Data Pipeline Engineering
- Engineering Leadership
- CI/CD and Containerization

## 06 — Rekonstruierte Anforderungen der Rolle

| ID | Anforderung | Notwendigkeit | Stufe | Gewicht | Matching-Eignung |
|---|---|---|---|---|---|
| …_01 | TypeScript | REQUIRED | L4 - Advanced | 0.9 | MATCHING_INELIGIBLE |
| …_02 | React | REQUIRED | L4 - Advanced | 0.85 | MATCHING_INELIGIBLE |
| …_03 | Node.js | REQUIRED | L4 - Advanced | 0.8 | MATCHING_INELIGIBLE |
| …_04 | PostgreSQL | REQUIRED | L3 - Proficient | 0.65 | MATCHING_INELIGIBLE |
| …_05 | Event-Driven Architecture | PREFERRED | L3 - Proficient | 0.6 | MATCHING_ELIGIBLE_PROPOSAL_ONLY |
| …_06 | Automated Testing | REQUIRED | L4 - Advanced | 0.7 | MATCHING_ELIGIBLE_PROPOSAL_ONLY |
| …_07 | Geospatial Visualisation | OPTIONAL | L2 - Working | 0.3 | MATCHING_ELIGIBLE_PROPOSAL_ONLY |
| …_08 | Web Platform Engineering | REQUIRED | 5+ years | 0.75 | MATCHING_INELIGIBLE |
| …_09 | English | REQUIRED | C1 | 0.4 | MATCHING_INELIGIBLE |

Gebunden ist die Rolle an `targetRoleProfileRevisionId` `TRPREV_3B6311C8…` und an `poolCanonicalSha256` `b94850c4…`, Version 1.

## 07 — Relationsmatrix Fähigkeit → Anforderung

Für dieselbe Rolle gibt es zwei Relationsquellen. Beide sind „presentation · authority NONE“. **COVERED ≠ VERIFIED_QUALIFICATION, RELATIONSHIP ≠ HIRING_DECISION.**
- **B2:** `SELECTED_ROLE_COVERAGE_V1`, Basis `CAPABILITY_PROPOSAL_NAME_COVERAGE`. Gilt nur für diese Analyse; `scored: false`; `capabilityRequirementRelationState` NOT_EVALUATED (`VERIFIED_CAPABILITY_SNAPSHOT_ABSENT`).
- **Rollenebene im Job Field:** Legacy-Präsentationsmatching `JOB_POOL_PRESENTATION_MATCHING_V1` über die Legacy-Analyse. Was dort fehlt, nimmt sie aus dem Sweep.

| Anforderung | B2 | B2-Vorschlag (PCAP) | Rollenebene | Legacy-Fähigkeit, Basis |
|---|---|---|---|---|
| TypeScript | COVERED, EXACT | TypeScript `PCAP_AAFB…` | SUPPORTED | TypeScript and Node.js Development, COMPOSITE_CONSTITUENT |
| React | COVERED, EXACT | React `PCAP_CD63…` | WEAK | React Frontend Development, TOKEN_CONTAINMENT |
| Node.js | COVERED, EXACT | Node.js `PCAP_FFD5…` | WEAK | TypeScript and Node.js Development, TOKEN_CONTAINMENT |
| PostgreSQL | COVERED, EXACT | PostgreSQL `PCAP_6B66…` | SWEEP_ONLY | — |
| Event-Driven Architecture | COVERED, EXACT | `PCAP_A760…` | SWEEP_ONLY | — |
| Automated Testing | COVERED, EXACT | `PCAP_6B8E…` | SWEEP_ONLY | — |
| Geospatial Visualisation | **NOT_COVERED** | — | **OPEN** | — |
| Web Platform Engineering | COVERED, EXACT | `PCAP_9105…` | SWEEP_ONLY | — |
| English | COVERED, EXACT | `PCAP_4F21…` | SWEEP_ONLY | — |

Auf allen 9 Anforderungsknoten steht `data-evaluation-state` NOT_EVALUATED.

**Wiederholbarkeit**
- Lesen: B2 und `/matches` liefern bei zweimaligem Lesen byte-gleiche Antworten. B2 hat den SHA-256-Präfix `c6415c8e…`, gleich der gespeicherten Kopie.
- Modell: Gegen den unabhängigen echten Lauf vom 2026-10-19 sind die 8 PERSON-×-JOB-Vorschläge namensgleich, und die B2-Matrix ist identisch.
- PERSON ohne Scope variiert: 8 von 10 Namen sind anders.
- Die Legacy-Analyse variiert ebenfalls: 2026-10-19 lieferte sie 3 Fähigkeiten, diesmal 5 (O-LIVE-3).
- Eine zweite Modellausführung im selben Labor war mit dem Restbudget von 2 Aufrufen nicht möglich, denn eine Analyse braucht 3.

## 08 — Evidenzprüfung, rückwärts

Kette A, rückwärts: sichtbare Relation ← Relationsdatensatz ← Ergebnis ← Vorschlag ← Evidenz ← PDF.

| Glied | Prüfung | Ergebnis |
|---|---|---|
| PDF → `DOC_001` | eigene Extraktion, Hash gleich `rawContentHash` und `normalizedTextHash` | PASS (beide Analysen) |
| Evidenz → PDF | 18/18 Discovery-Zitate im unabhängigen `pdftotext`-Text; 18/18 Spannen `[start, end)` auf dem normalisierten Text byte-gleich zum Zitat; alle VERIFIED, `DOC_001` | PASS |
| Vorschlag → Evidenz | Die Evidenz-IDs der Projektion sind genau die verifizierten Anspruchs-IDs ihrer Kandidaten; alle Kandidaten gehören zum Discovery-Run der Analyse | PASS |
| Ergebnis → Vorschlag | Jede B2-Abdeckung nennt eine PCAP-ID der Projektion dieser Analyse, mit identischer Evidenz | PASS |
| Relationsdatensatz | **Es gibt keinen persistierten Relationsdatensatz.** B2 wird beim Lesen deterministisch aus persistierten Eingaben berechnet: Projektion, Rollen-Revision, Scope-Hash, Run-IDs im `binding`. | NICHT IMPLEMENTIERT (G-3) |
| Rollenebene → PDF | 3/3 Zitate der Legacy-Spuren stehen im PDF; die 8 Sweep-Spuren zeigen auf PCAP-IDs der Projektion | PASS. Der Legacy-Rohtext ist nicht archiviert, daher nur auf der verarbeiteten Ebene prüfbar |

Kette B, rückwärts: sichtbare Anforderung ← Rolle ← Pool-Datensatz ← Originalpool.

| Glied | Ergebnis |
|---|---|
| Datei → Pool-Datensatz: `rawSha256` gleich der Datei, ID aus `canonicalSha256` | PASS |
| Pool → Rolle: `role_kestrel_fullstack` steht in der Originaldatei, Titel und org_kestrel gleich | PASS |
| Rolle → Anforderungen: 9/9 feldgleich | PASS |
| Scope: Hash gleich, nennt nur diese Rolle | PASS |

**Keine Vermischung:**
- In `/matches` und B2 kommt nur die Analyse-ID `ANL_1792628993472_10` vor.
- PERSON an der Rolle ergibt 409 bzw. NOT_SCOPED (V-07a, V-12b).
- Eine falsche Rollen-ID in der URL zeigt „ROLE ID NOT IN THIS POOL“.
- Die Sonden haben keine einzige Nicht-GET-Anfrage gesendet.

**Grenze der Aussage:** Ein Zitat steht wörtlich im PDF. Ob es die genannte Fähigkeit trägt, prüft niemand.
- „Web Platform Engineering“ stützt sich nur auf den Profilsatz.
- „Event-Driven Architecture“ stützt sich auf ETL-Jobs mit Kafka.

Der Beleg eines Zitats ist kein Beleg professioneller Kompetenz.

## 09 — Erster Bildschirm

`shots/14-pxj-analysis-done`, `shots/p1-first-screen`. Sonde: `first-screen-probe.json`.

> **Korrektur K-1 (2026-10-22, GELB):** `shots/p1-first-screen` und `first-screen-probe.json → first` zeigen nicht das Capability Field, sondern das Job Field ohne gewählten Pool. Die Sonde hatte `focus=CAPABILITY` nicht gesetzt. Der Beleg für den ersten Bildschirm ist allein `shots/14-pxj-analysis-done`; das Ergebnis G-1 bleibt gleich. Ein Reload mit `focus=CAPABILITY` füllt das Capability Field nicht, alle Orbits zeigen 0 Einträge (F-PXJ-RELOAD, `capability-reload-probe.json`, `shots/q1-capability-reload-empty`). Einzelheiten: `CONDYN_PXJ_G1_FIRST_SCREEN_SPECIFICATION_2026-10-22.md` §02.

| Zustand | Erster Bildschirm (Capability Field nach ANALYZE) | Job Field, Rollenebene (`shots/15`, `p2`) | B2-Fläche (`shots/16`) |
|---|---|---|---|
| AVAILABLE | B2 und Matching liegen über bestehende Routen vor | ja | ja |
| DISPLAYED | 8 Vorschläge als Zähler „02 Capability Field · 8 items“; Indikator oben nennt die gewählte Rolle | 9 Anforderungsknoten, Quelle `cv.synthetic.pdf`, 11 Spuren | 9 Zeilen mit Zitat |
| SELECTED | Rolle im Indikator (Scope VALID) | Rolle im Pfad, SELECTED JOB | `binding` nennt Analyse, Run, Pool, Rolle, Scope |
| FOCUSED | — | Rolle im Fokus | — |
| RELATION_FOUND | **keine Relation sichtbar** (0 Anforderungsknoten, 0 B2) | SUPPORTED 1, WEAK 2, SWEEP_ONLY 5 | COVERED 8 |
| UNRESOLVED | — | OPEN 1 (Geospatial), alle NOT_EVALUATED | NOT_COVERED 1, NOT_EVALUATED |

**Einzelne Relationen geprüft** (`requirement-probe.json`, `shots/p3`–`p5`):
- **TypeScript:** „SUPPORTS · SCORED“. Legacy-Fähigkeit `CAP_001`, Bestandteil TypeScript; CONTRIBUTION 0.855, CONFIDENCE 0.95, WEIGHT 0.9. Hinweis: „not a certification … authority NONE“.
- **Automated Testing:** „COVERS (UNSCORED) · SWEEP PROPOSAL“, `PCAP_6B8E…`, source-match verified, not canonically evaluated.
- **Geospatial Visualisation:** „NO DELIVERED SUPPORT“, mit dem Hinweis aus dem Pool.

**Ergebnis:** Der erste Bildschirm stellt die Relation PERSON ↔ FÄHIGKEIT ↔ ANFORDERUNG ↔ ROLLE nicht dar. Sichtbar wird sie erst eine Ebene tiefer, im Job Field auf der Rollenebene und in B2. → G-1.

## 10 — Lücken

- **G-1 (Frontend):** Der erste Bildschirm nach einer PERSON-×-JOB-Analyse zeigt keine Relation Fähigkeit → Anforderung. Die Daten liegen über bestehende, analysegebundene Verträge vor (B2-Route, `/matches`). Es fehlt also keine Backend-Funktion, sondern die Projektion. Nicht umgesetzt; eine Umsetzung braucht einen eigenen Auftrag.
- **G-2 (Architektur):** Zwei Relationsquellen widersprechen sich für dieselbe Rolle: B2 zeigt 8 COVERED, die Rollenebene 1 / 2 / 5 / 1.
  - Die Rollenebene stützt sich zuerst auf die Legacy-Analyse ohne Scope, und die ist nicht deterministisch (O-LIVE-2 und O-LIVE-3, bestätigt).
  - Bevor eine Projektion auf den ersten Bildschirm kommt, muss feststehen, welche Quelle sie trägt.
- **G-3 (Architektur):** Es gibt keinen persistierten Relationsdatensatz Fähigkeit → Anforderung.
  - B2 ist reproduzierbar, wird aber beim Lesen berechnet.
  - Der Relationszustand bleibt NOT_EVALUATED, solange es keinen Snapshot verifizierter Fähigkeiten gibt.
- **G-4 (Darstellungsvertrag):** Die Rollenebene zeigt Zahlen aus dem Legacy-Matching: „SCORED“, CONTRIBUTION, CONFIDENCE, RESONANCE %, RANK #.
  - Sie sind als Präsentation gekennzeichnet, mit „authority NONE“ und „not a decision“.
  - B2 sagt dagegen `scored: false`.
  - Ob solche Werte in einer PERSON-×-JOB-Relation erscheinen dürfen, entscheidet der Owner.
- **G-5 (Evidenzsemantik):** Der Validator prüft, ob das Zitat existiert, nicht, ob es die Fähigkeit trägt. Bekannt als O-LIVE-1.
- **G-6 (Archiv):** Nur Discovery ist als Rohtext archiviert. Convergence und Legacy lassen sich nur auf der verarbeiteten Ebene prüfen.
- **O-1 (Beobachtung):** Die 7 vorgeschlagenen Beziehungen zwischen Fähigkeiten sind neu gegenüber dem 2026-10-19. Nachtrag: Sie werden nirgends angezeigt; der Adapter übernimmt nur `capabilities` (Spezifikation §01.1).

## 11 — Unabhängige Prüfung durch PINK

Angefragt am 2026-10-22, nur mit GET-Anfragen gegen :41862. Hier steht PINKs Rückmeldung, wie PINK sie berichtet hat; den eigenen Eintrag §3.55 schreibt PINK selbst.

Rahmen:
- PINK hat nur GET gesendet, etwa 22 per curl und 26 im Browser. Kein Gemini, kein Analyze, kein Upload.
- Den Inspector-Token hat PINK **nicht** gelesen. Der Zugriff auf GELBs Laborverzeichnis wurde in PINKs eigener Session abgelehnt, und PINK hat das nicht umgangen.
- Ohne Token antworten `gemini-result` und `gemini-exchanges` mit 404, wie vorgesehen.

| # | Punkt | PINK |
|---|---|---|
| 1 | Session-Identität | **PASS**: Job → Analyse → Run → Convergence → Bindung stimmen überein |
| 2 | PDF-Identität | **INCONCLUSIVE**: inhaltlich übereinstimmend (`DOC_001`, 247 Wörter, alle Zitate im PDF, Datei `efaa47ef…`); den Hash des Quellbündels zeigt nur der Inspector |
| 3 | Pool-Identität | **PASS**: `rawSha256` gleich der Datei; den kanonischen Hash `b94850c4…` hat PINK selbst aus der Datei berechnet |
| 4 | Rollen-Identität | **PASS**: 9/9 Anforderungen; `investigationScopeHash` unabhängig nachgerechnet, `8016b7c1…` |
| 5 | Echte Modellausführung | **INCONCLUSIVE**: Inspector und Relay-Log waren für PINK nicht lesbar; nur Indizien (Ausführungsdauer) |
| 6 | Persistiertes Ergebnis | **PASS**, über die lesenden Routen; die DB selbst hat PINK nicht gelesen |
| 7 | Relationen | **PASS / NOT IMPLEMENTED**: B2 unabhängig nachgerechnet, 8/1, 9/9 Zeilen gleich; Rollenebene 1/2/5/1. Eine kanonische Relation ist nicht implementiert (NOT_EVALUATED). Beobachtung O-PXJ-NAME: Unter Scope heißen die Vorschläge wie die Anforderungen, die Namensabdeckung ist dadurch fast zirkulär |
| 8 | Rückverfolgbarkeit | **PASS** auf Zitatebene (18 Discovery-, 16 Legacy- und 11 Trace-Zitate im PDF); **INCONCLUSIVE** für Spannen und Hashes, die nur der Inspector zeigt |
| 9 | Erster Bildschirm | **PASS mit Beobachtungen**, geprüft am Deep Link auf die Rolle: 9 Anforderungen, 11 Evidenzspuren, B2 nach einem Klick. Beobachtung O-PXJ-PERSONLINK: Beim Deep Link auf die PERSON-Analyse zeigt der Modusschalter PERSON × JOB, das Feld lädt die Analyse aber korrekt nicht (NOT_SCOPED) |
| 10 | Keine Vermischung | **PASS**: keine gemeinsamen IDs; Negativfälle 409 / 400 / 404 / SCOPE_MISMATCH |

Unterschiedliche Lesart bei Punkt 9:
- PINK hat den Deep Link auf die Rolle (Job Field) als ersten Bildschirm genommen.
- GELB hat den Bildschirm geprüft, den die App direkt nach ANALYZE zeigt (Capability Field). Dort ist keine Relation sichtbar, deshalb G-1.
- Beide Befunde stimmen. Welcher Bildschirm als „erster“ gilt, entscheidet der Owner.

Offen für Punkt 5 und für die Spannen in Punkt 8:
- PINK hat keinen unabhängigen Lesezugang zum Inspector.
- `relay.jsonl` und `summary.json` in diesem Beleg stammen von GELB und sind für PINK keine unabhängige Quelle.
- Ob PINK den Token bekommt, entscheidet der Owner.

## 12 — Quellen und Commits

- **App-Code:** `49e2bc6` (`frontend/focus-readability`, Basis `38ebc31`, Integrationsstand `35f00bc`).
- **Skripte:**
  - `evidence/video-readiness/scripts/video-lab.ts`, `video-gemini-relay.ts`, `video-walk.mjs`, `live-extract.mjs`, `live-summarize.mjs`
  - eigene Sonden unter `evidence/pxj-e2e-49e2bc6/scripts/`
- **Code-Stellen:**
  - `lib/career/capability-core/evidence-validator.ts:18-45` (Spannen)
  - `lib/career/capability-core/source.ts:25-50` (Hashes)
  - `lib/career/job-pool/upload.ts:27` (Pool-ID)
  - `lib/career/job-pool/syntx-field-view-model.ts:651` (Resonanz und Rang)
  - `app/components/career/demo/SyntxField.tsx:1547` (Anzeige von Resonanz und Rang)
- **Rohdaten** (vollständige Antworten, Scope, Inspektion): lokal außerhalb des Repositorys, Modus 0700/0600. Prüfbar über `private-SHA256SUMS.txt`.

## 13 — URL für die Owner-Abnahme

Das Labor läuft weiter. Es ist nur lokal auf diesem Rechner erreichbar.
- Start: `http://127.0.0.1:41862/career/demo`
- PERSON × JOB an der Rolle: `http://127.0.0.1:41862/career/demo?analysisId=ANL_1792628993472_10&focus=FIELD&jobPoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_fullstack&jobScopePoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobScopeRoleId=role_kestrel_fullstack`

GEMINI OUTPUT braucht den Inspector-Token aus dem `state.json` des Labors. Er wird nicht veröffentlicht.
