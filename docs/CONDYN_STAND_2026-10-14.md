# CONDYN / SYNTX — Aktueller Stand (14.10.2026)

Erstellt von GELB (Integration, Vertragsprüfung, Governance). Dieses Dokument ist die Ausgangsbasis für die nächsten zwei
Schritte: **1. Gemini-API**, **2. Frontend**.

Alle Angaben sind am 14.10.2026 gegen das Repository und die laufende Umgebung geprüft. Wo eine Angabe aus einer früheren
Beobachtung stammt, steht das Datum dabei.

---

## 1. Kurzfassung

- **Freigegebener Stand:** `integration/job-field-governance` @ `5898def`. Der Anwendungscode ist identisch mit `9e86d44`
  (GRÜN `9f225f2` Evidence Ecology + R15a).
- **Läuft auf** http://127.0.0.1:3017 (`next dev` mit Gemini-Worker) auf der Wegwerf-Datenbank
  `condyn_test_e46502b73c9f316f`. Die gemeinsame Datenbank `condyn` wird nicht benutzt.
- **Abnahme:** PINK grün.
  - Prüfplan 1.9.0, auf Port 3017 per GET-only-Walk 149/149.
  - Vollständiger Produktablauf (PDF → Gemini → Capability Field → Jobpool → Matching → Rolle/Anforderung → Evidenz/Quelle)
    auf einer Kopie der Owner-Daten nachgewiesen. Die Analyse dauerte 47 s.
- **Noch nicht in `main`:** Die Integration liegt 552 Commits vor `main` (`b712152`).
- **Wichtigste offene Punkte für die Gemini-Phase:**
  - Die eingebaute Modell-Kaskade nennt abgekündigte Modelle. Ohne `GEMINI_MODEL` fällt die Analyse aus.
  - Die Analyse hat zwei Gemini-Pfade (Legacy-Analyse und Capability Sweep). Sie liefern unterschiedliche Fähigkeiten,
    und nur der Legacy-Pfad wird im Matching bewertet.
  - Mehrere Owner-Entscheidungen sind offen (Abschnitt 6).

---

## 2. Repository, Branches, Commits

Repository: https://github.com/SYNTX-SYSTEM/condyn-admin (`git@github.com:SYNTX-SYSTEM/condyn-admin.git`).
Alle Branches sind gepusht; lokal und GitHub sind gleich.

### 2.1 SYNTX-Kern

| Branch | Rolle | Worktree | Commit |
|---|---|---|---|
| `integration/job-field-governance` | GELB-Integration, freigegebener Stand | `condyn-admin-hr-integration` | `5898def8b021d79f86931518180db789a51e211b` |
| `frontend/job-pool-workflow` | Owner-Umgebung Port 3017, identisch mit der Integration | `condyn-admin-job-pool` | `5898def8b021d79f86931518180db789a51e211b` |
| `frontend/job-field` | GRÜN, Renderer (Evidence Ecology) | `condyn-admin-job-field` | `9f225f2c172b55f2746d664bffe1dfeda569c0e5` |
| `validation/hr-decision-loop-pink` | PINK, Prüfplan 1.9.1 (nur Dokumente über 5898def hinaus) | `condyn-admin-hr-validation` | `ce47933e018208de357f2eb6ba4a40a1ae7980d8` |
| `main` | Basis, nicht zusammengeführt | — | `b712152d5e161337cf2fed03266d0fad04146f54` |

### 2.2 Frühere Phasen (Worktrees vorhanden, alle gepusht)

| Branch | Commit |
|---|---|
| `capability-mapping` (Hauptcheckout `condyn-admin`) | `ee06ff650080528c341fff024b132192a3850af6` |
| `architecture/g2-g3-field-relation` | `5b2ce3a834ff1eb0becb6a6b995a32f5412dedd4` |
| `integration/g2-producer-adapters` | `1fb55caa477abeed86b26a803744b804ef85f2b6` |
| `integration/g3-decision-context-binding` | `67cf5dcc430e42efcfcf33aeedd1fb4493454ad4` |
| `frontend/hr-decision-dock-finalization` | `1572dcf233f3707c5be635b061b4d43b8ae4dbac` |
| `frontend/hr-decision-loop` | `aa83348e42fc2c219d0f1e8eb234837631cc68d2` |
| `tooling/decision-core-phase-gate` | `1bfc45b38c73c26b33146fab472e9f595c6b94cc` |
| `wip/field-01-overlay-2026-09-22` | `435a1126c3d6949cb8b79d8df280235fe98d6491` |

Nicht eingecheckt, weil irrelevant: leere 0-Byte-Dateien aus Shell-Umleitungen.
- Im Hauptcheckout: `RUNNING`, `currentOperation`, `exact`, `rejected`.
- In `condyn-admin-sil-integration`: `=`, `DAR`, `DCR`, `DCTXREV`, `RCP`, `repository`, `returned`.

### 2.3 Herkunft des freigegebenen Stands

```
36058a4  SYNTX Visual Grammar Transfer (GRÜN 9759889)        PINK 1.8.0 grün
010f082  + PINK-Plan 1.8.0                                     lief bis 12.10. auf :3017
0c2c68a  + GRÜN 9f225f2 Evidence Ecology
9e86d44  + R15a (Bindungsdokument, Owner-Entscheidung)         PINK 1.9.0 grün
5898def  + PINK-Plan 1.9.0                                     läuft auf :3017
```

Rückweg: `010f082`.

---

## 3. Laufende Umgebung (Port 3017)

| Punkt | Wert |
|---|---|
| URL | http://127.0.0.1:3017/career/demo |
| Prozess | `npx tsx scripts/hr-decision-loop-local.ts up --with-worker` (= `npm run job-pool:local`) in `condyn-admin-job-pool`, ohne `--fresh` |
| Server | `next dev`, kein Produktions-Build |
| Datenbank | `condyn_test_e46502b73c9f316f` (als Wegwerf-DB markiert und verifiziert) |
| Worker | `scripts/run-career-worker.ts`, pollt die Job-Queue |
| Gemini-Modell | `GEMINI_MODEL=gemini-3.1-pro-preview` (aus `/home/codi/Entwicklung/condyn-admin/.env.local`, nur in die Kindprozesse geladen) |
| Schlüssel | `GEMINI_API_KEY` aus derselben Datei, wird nie ausgegeben oder committet |
| Prompt-Schlüssel | `PROMPT_ENCRYPTION_KEY` pro Start neu, Prompt-Repository nur im Speicher |

**Datenbestand** (unverändert seit 11.10.; Inhaltsvergleich vor und nach jedem Wechsel identisch):

| Kennzahl | Wert |
|---|---|
| Umfang | 123 Tabellen, 280 Zeilen |
| Hashes | countsHash `3644dcdf00006a7f`, contentHash `a5050f17b5264235` |

| Art | Einträge |
|---|---|
| Analysen | `ANL_1791660225500_612`, `ANL_1791678642893_788`, `ANL_1791679347032_206`, `ANL_1791697406804_831` (alle Jobs `SUCCEEDED`) |
| Jobpool | `JPOOL_30F7145E21F34BEF0FCE510DFC75837B` (`pool_condyn_sample_tech_v1`: 3 Organisationen, 6 Rollen) |

**Firefox-Links:**

- Neuer Ablauf (Upload, Analyse): http://127.0.0.1:3017/career/demo
- Job Field mit bestehenden Daten: http://127.0.0.1:3017/career/demo?focus=FIELD&analysisId=ANL_1791660225500_612&jobPoolUploadId=JPOOL_30F7145E21F34BEF0FCE510DFC75837B
- Tiefer: Parameter anhängen.
  - Organisation: `&jobOrganizationId=org_nordlicht`
  - Rolle: `&jobRoleId=role_fullstack`
  - Anforderung: `&jobRequirementId=req_001`

**Betriebsregeln:**
- Keine Datenbank-Resets und nie `--fresh`.
- Prozesse nur über die eigene PID stoppen, nie mit `pkill`.
- Port 3017 nur mit Owner-Freigabe ändern.
- Nach jedem Neustart die Routen einmal per GET vorwärmen (siehe 7.1).

---

## 4. Gemini — Ist-Stand im Code

### 4.1 SDK und Einstiegspunkte

- SDK: `@google/genai` `^2.10.0`.
- Der Worker (`scripts/run-career-worker.ts`) startet nur, wenn `GEMINI_API_KEY` gesetzt ist. Sonst bricht er mit
  `ERR_PROVIDER_CONFIG` ab.

Pro Analyse-Job laufen **zwei getrennte Gemini-Pfade**:

| Pfad | Datei | Ergebnis | Wird im Matching bewertet? |
|---|---|---|---|
| A — Legacy-Analyse | `lib/career/providers/gemini.ts` (`GeminiProvider`) | `career_analyses`: Dokumente, Fähigkeiten, Organisationen, Rollen | **ja**: die Scores des Jobpool-Matchings kommen nur von hier |
| B — Capability Sweep (Discovery → Convergence) | `lib/career/capability-core/discovery/gemini-provider.ts`, `lib/career/capability-core/convergence/gemini-provider.ts`, Orchestrierung `lib/career/orchestration/capability-proposal-executor.ts` | Fähigkeitsvorschläge `PCAP_*` mit Quellzitaten, `authorityState NONE` | **nein**: wird als „unbewertete Sweep-Abdeckung“ angezeigt (COVERED ≠ SCORED) |

Daneben gibt es Embeddings in `lib/career/embeddings/gemini.ts`. Das Modell ist `GEMINI_EMBEDDING_MODEL` mit dem Standard
`text-embedding-004`; ob dieser Standard noch verfügbar ist, ist ungeprüft.

### 4.2 Modellauswahl

- **`DEFAULT_GEMINI_MODEL_CASCADE`** (`lib/career/providers/gemini.ts:6`): `gemini-2.0-flash` → `gemini-2.5-flash` →
  `gemini-1.5-pro` → `gemini-1.5-flash`.
  - Am 10.10. beobachtet: `gemini-2.0-flash` liefert 404, `gemini-2.5-flash` meldet „no longer available to new users“.
  - **Die Standard-Kaskade ist damit unbrauchbar.**
- **Pfad A:** Ein gesetztes `GEMINI_MODEL` kommt an die Spitze, danach folgt die alte Kaskade als Rückfall.
- **Pfad B:** Benutzt `GEMINI_MODEL`, sonst `DEFAULT_GEMINI_MODEL_CASCADE[0]` = `gemini-2.0-flash`. Ohne `GEMINI_MODEL`
  scheitert der Sweep.
  - Der Provider maskiert das als `ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE`.
- **Sonderfall** im Code: `gemini-3.5-flash` hat eine eigene Behandlung (`gemini.ts:201`).
- **Generierungsprofil Pfad B:** `responseMimeType: application/json`, `temperature 0.1`, `maxOutputTokens 32768`,
  JSON-Schema aus den `gemini-schema-projector.ts`-Dateien.
- **Pfad A** ist über `GEMINI_MAX_OUTPUT_TOKENS` und `GEMINI_MAX_CONTINUATIONS` steuerbar. `DEBUG_GEMINI_REQUEST` protokolliert
  die Anfrage.
- **Provider-Auswahl** (`lib/career/providers/index.ts`): OpenAI hat Vorrang, wenn `OPENAI_API_KEY` gesetzt ist und
  `USE_GEMINI_PROVIDER` nicht `true` ist. Sonst wird Gemini benutzt, sobald `GEMINI_API_KEY` vorhanden ist.

### 4.3 Beobachtetes Verhalten (live)

| Datum | Lauf | Ergebnis |
|---|---|---|
| 10.10. | PDF-Pfad, `docs/examples/cv.synthetic.pdf` | durchgängig nachgewiesen |
| 10.10. | PINK JP-LIVE (`gemini-3.1-pro-preview`) | Sweep 132 s, 17 Vorschläge |
| 10.10.–11.10. | Pfad A, mehrere Läufe | 1–7 Fähigkeiten pro Lauf (instabil) |
| 10.10.–11.10. | Pfad B, mehrere Läufe | 9–14 Vorschläge pro Lauf (stabil) |
| 12.10. | Produktablauf auf der Owner-Kopie | Analyse 47 s; Capability Field 10 Fähigkeiten; Matching 6 Rollen, Sweep `AVAILABLE` mit 10 unbewerteten Vorschlägen |

### 4.4 Für die Gemini-Phase zu klären oder zu tun

1. **Modell-Kaskade:** abgekündigte Modelle ersetzen oder entfernen. Danach `GEMINI_MODEL` nicht mehr implizit voraussetzen.
   Entscheidung, welches Modell Standard wird (bisher läuft `gemini-3.1-pro-preview`).
2. **Fehlerbilder sichtbar machen:** Ein toter Modellname darf nicht als allgemeiner `…PROVIDER_FAILURE` enden.
3. **Zwei Pfade, zwei Ergebnisse:** Das Matching bewertet nur die instabilen Legacy-Fähigkeiten (Pfad A). Die stabileren
   Sweep-Vorschläge (Pfad B) bleiben unbewertet. Das ist die Owner-Entscheidung HIA-3 / B-JP-CANDIDATES (Abschnitt 6).
4. **Embeddings-Standard** `text-embedding-004` prüfen.
5. **Laufzeit und Robustheit:** 47–132 s pro Analyse. Der Worker leased Jobs (`lease=1`); Timeouts und Retries sind live noch
   nicht unter Last geprüft.
6. **Schlüssel-Handhabung bleibt:** nur aus `.env.local` in Kindprozesse, nie loggen, nie committen.

---

## 5. Frontend — Ist-Stand

### 5.1 Seite und Komponenten

Die einzige Produktseite ist `/career/demo`.

| Datei | Zeilen | Inhalt |
|---|---|---|
| `app/components/career/demo/SemanticCareerIntelligenceField.tsx` | 1743 | Capability Field („Planetarium“): Intake (PDF/GitHub/URL/Text), Analyse-Start, Orbits, Fokus-Umschaltung CAPABILITY ↔ JOB FIELD |
| `app/components/career/demo/SyntxField.tsx` | 932 | Job Field (SYNTX): Ebenen FIELD → ORGANIZATION → ROLE → REQUIREMENT → Detailansicht (Aperture) → RETURN; Pool-Liste, Pool-Upload, Boundary-Ansicht |
| `app/components/career/demo/OrbitalSatelliteMotion.tsx` | 71 | gemeinsamer rAF-Takt (aus dem Capability Field, jetzt auch für die Quellenträger) |
| `lib/career/job-pool/syntx-field-view-model.ts` | 889 | reines View-Model (`deriveSyntxField`), die gesamte Geometrie und alle Zeichen mit Belegen |
| `lib/career/job-pool/analysis-sources.ts` | 109 | liest Quelltitel und Evidenzorte aus der Analyse (nur exakte Joins) |
| `lib/career/job-pool/frontend-presentation.ts` | 337 | strikte Decoder für Pool- und Matching-Antworten |
| `lib/career/ui/useJobPool.ts`, `useJobPoolSources.ts` | 202 / 23 | Datenzugriff |

- Grammatik: `SYNTX_FIELD_V1`.
- URL-Parameter: `focus`, `analysisId`, `jobPoolUploadId`, `jobOrganizationId`, `jobRoleId`, `jobRequirementId`. Die
  Detailansicht steht nie in der URL.

### 5.2 API-Routen

| Bereich | Routen |
|---|---|
| Analyse | `POST /api/career/analyze` (Job einreihen), `GET /api/career/jobs/[jobId]`, `GET /api/career/analyses`, `GET /api/career/analyses/[analysisId]` |
| Jobpool | `GET/POST /api/career/job-pools`, `GET /api/career/job-pools/[id]`, `GET /api/career/job-pools/[id]/matches?analysisId=` |
| HR-Loop, Canonical SIL | `hr-decision-loop/*`, `canonical-sil/*` (frühere Phasen, nicht Teil des SYNTX-Felds) |

Die Jobpool-Routen sind hinter dem Wegwerf-DB-Gate: Gegen eine unmarkierte Datenbank antworten sie mit 503.

### 5.3 Verbindliche Regeln

Die Regeln stehen in `docs/architecture/decision-fields/SYNTX_FIELD_CONTRACT_BINDING.md`.

| Regel | Inhalt |
|---|---|
| R1 | kein Abschluss oder Urteil, solange die kanonische Bewertung `NOT_EVALUATED` ist |
| R2 | „Bewertung ausstehend“ ist der Grundzustand |
| R3 | fehlende Stützung ist neutral, nie rot |
| R4 / R14 | Score ist sekundär und steuert keine Geometrie und keine Bewegung |
| R5 | der Sweep ist unbewertet (COVERED ≠ SCORED) |
| R7 | Überlappungen bleiben sichtbar |
| R8 | Escape führt zurück |
| R9 | Barrierefreiheits-Texte aus demselben View-Model |
| R10 | Capability Field ist versiegelt |
| R12 | kein neuer Datenpfad |

- **R15 / R15a:** Bewegung ist eine geschlossene Liste.
  - FIELD/ORGANIZATION: `sxOrbit`, `sxBreathe`, `sxSuspend`.
  - ROLE/REQUIREMENT: `sxSuspend`, der kreisende Quellenträger mit mitlaufenden Linien, `sxMoonOrbit`, Photonen auf den
    Linien, `sxAtmosphere` und `sxRingPulse` nur am geöffneten Träger.
  - Bei reduzierter Bewegung steht alles still.
- **Sprachregeln** SG-1..6 und Governance G1–G6 (Job Field), Glossar in `docs/architecture/decision-fields/JOB_POOL_CONNECTION.md` §12.
- **Design-Freeze** (Owner, 12.10.): kein Redesign, keine neuen Funktionen ohne neuen Auftrag.

### 5.4 Bekannte Frontend-Punkte

1. **Neuladen beim ersten Analyse-Lauf** (12.10., `next dev`):
   - Ablauf: Die Statusroute wird erst beim ersten Aufruf übersetzt. Etwa 10 s danach lud die Seite einmal neu und verlor
     den laufenden Auftrag. Der Job lief zu Ende, die Analyse ist gespeichert, aber die Erfolgsmeldung kam nicht.
   - Umgehung: Routen nach dem Start vorwärmen.
   - Echte Lösung: Produktions-Build (`next build` + `next start`) oder ein Wiederaufnehmen laufender Jobs nach dem
     Neuladen (Job-ID im URL- oder Session-Zustand). Das ist eine Frontend-Aufgabe.
2. **Polling** (`lib/career/ui/career-job-controller.ts`):
   - Alle 2 s, ohne Obergrenze, ohne Wiederaufnahme nach dem Neuladen.
   - Netzfehler werden still übergangen; ein 5xx stoppt das Polling nicht und zeigt nichts an.
3. **rAF-Takt:** Der Takt rendert die Leinwand des Job Fields bei normaler Bewegung in jedem Frame neu. Die
   Prozessorlast ist nicht gemessen.
4. **`SYNTX_AMBIENT_NAMES`** in `SyntxField.tsx` nennt nur die FIELD/ORGANIZATION-Liste. Die R15a-Bewegungen sind im
   Bindungsdokument geregelt, nicht in dieser Konstante.
5. **Versiegelte Texte** der Orbits 02/04/05 im Capability Field (B-ORBIT-COPY): Änderungen nur mit Owner-Entscheidung.
6. **Kein Produktions-Build geprüft:** Alle Abnahmen liefen auf `next dev`.

---

## 6. Offene Owner-Entscheidungen

| Kennung | Frage | Bedeutung |
|---|---|---|
| HIA-3 / B-JP-CANDIDATES | Soll der Capability Sweep (Pfad B) bewertet werden, oder bleibt das Matching auf den Legacy-Fähigkeiten (Pfad A)? | bestimmt, welche Gemini-Ausgabe die Scores trägt; Kern der Gemini-Phase |
| B-GEMINI-MODEL | Welches Modell ist Standard, wie sieht die Kaskade aus? | ohne Entscheidung hängt alles an `GEMINI_MODEL` |
| HIA-1 | Wer verifiziert Fähigkeiten (Phase 4: Vorschlag → `VerifiedCapabilitySnapshot`)? | ohne das bleibt die kanonische Bewertung dauerhaft `NOT_EVALUATED`; kein Produzent vorhanden |
| Zielanforderungen | Laufzeit-Produzent für kanonische Zielrollen und Anforderungen jenseits des JSON-Jobpools | bisher nur über den Jobpool-Upload |
| B-JP-REC | Empfehlungsobjekt im Vertrag? | bisher keins; das Frontend zeigt keine Empfehlungen |
| F-JP-5 | DDL-Drift `career_policy_versions` (`lib/career/db/client.ts:128` vs. `schema.ts:111`) | macht alle G1-Lifecycle-Testsuiten auf frischen Datenbanken rot (vorbestehend) |
| `main` | Wann und wie wird `integration/job-field-governance` nach `main` zusammengeführt? | 552 Commits Abstand |

---

## 7. Betrieb und Tests

### 7.1 Umgebung starten und wechseln (ohne Datenverlust)

1. Datenbank-Stand nur lesend festhalten (Zeilen und Inhalt pro Tabelle, `md5` je Tabelle in einer Read-only-Transaktion).
2. Eigenen Prozess per PID stoppen.
3. `git merge --ff-only <commit>` in `condyn-admin-job-pool`.
4. Neu starten.
   ```
   set -a; . ~/.config/condyn/test-db-role.env; set +a
   unset DATABASE_URL
   export GEMINI_API_KEY=… GEMINI_MODEL=…   # Werte aus .env.local, nie ausgeben
   npx tsx scripts/hr-decision-loop-local.ts up --with-worker
   ```
5. Vorwärmen nur mit GET: Seiten, `/api/career/job-pools…`, `/api/career/analyses/…`, `/api/career/jobs/<nicht-existent>`
   (404), `/api/career/analyze` (405).
6. Datenbank-Stand erneut festhalten und vergleichen; er muss identisch sein.

### 7.2 Tests

- **Runner:** `npx tsx scripts/test-db/run.ts <Pfade>`. Er legt pro Lauf eine eigene Wegwerf-Datenbank an. Ein nacktes
  `vitest` verweigert der Guard absichtlich.
- **Stand `5898def`:**
  - `tsc` sauber.
  - `test/career/job-pool`: 13 Dateien, 88 grün, 4 übersprungen (Browser-Tests ohne Playwright-Modul).
  - Governance-Test `syntx-field-governance.test.ts`: 10 Fälle.
- **PINK** (`test/job-pool-validation/`):
  - e2e-Walk 3/3.
  - GET-only-Walk 149/149 auf Port 3017.
  - Live-Test `live-browser-workflow.e2e.test.ts` (braucht `GEMINI_API_KEY`).
  - Prüfplan `docs/acceptance/CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.9.md`.
- **Bekannte rote Suiten außerhalb des SYNTX-Deltas:** G1-Lifecycle wegen F-JP-5; Ladezeit-Timeouts in COVFCR/Decision-Core
  bei Volltests (mit längerem Timeout grün).

### 7.3 Sicherheitsregeln (gelten weiter)

- Die gemeinsame Datenbank `condyn` wird nie verändert, gelöscht, migriert oder befüllt. Auch Tests tun das nicht.
- Ein fehlendes `DATABASE_URL` fällt nie auf `condyn` zurück.
- Zugangsdaten liegen in `~/.config/condyn/test-db-role.env` (Modus 600) und `.hr-loop-local/state.json` (gitignored). Beide
  werden nie ausgegeben.
- Keine Produktions-Bereitstellung ohne Owner-Freigabe.

---

## 8. Dokumente

| Thema | Datei |
|---|---|
| SYNTX-Bindung, Regeln R1–R15a | `docs/architecture/decision-fields/SYNTX_FIELD_CONTRACT_BINDING.md` |
| SYNTX-Spezifikation (Owner) | `docs/architecture/decision-fields/SYNTX_SEMIOTIC_RECONSTRUCTION_SPEC.md` |
| Jobpool-Anbindung, Glossar §12 | `docs/architecture/decision-fields/JOB_POOL_CONNECTION.md` |
| Jobpool-Validierung (PINK) | `docs/architecture/decision-fields/JOB_POOL_CONNECTION_VALIDATION.md` |
| Job-Field-Frontend, DOM-Vertrag | `docs/career_analysis/JOB_FIELD_FRONTEND.md` |
| Jobpool-Frontend und manueller Test | `docs/career_analysis/JOB_POOL_WORKFLOW_FRONTEND.md`, `JOB_POOL_WORKFLOW_MANUAL_TEST.md` |
| Abnahmeplan | `docs/acceptance/CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.9.md` (+ `condyn-acceptance-scenarios.v1.json`) |
| Prüfbelege | `docs/architecture/decision-fields/evidence/` |
| Capability Core, Phase 4 | `docs/capability-core/ARCHITECTURE.md` |
