# JOB POOL FIRST — Backend-Grenze der Capability-Analyse

Stand 2026-10-14 · Branch `feature/job-pool-first-boundary` (Basis 311d6ee) · Rolle GELB

## 1. Invariante und Auftrag

> NO VALID POOL + SELECTED JOB → NO CAPABILITY ANALYSIS

Ein Analyseauftrag ohne gültigen Pool und ohne eine zugehörige gültige Jobauswahl wird abgelehnt.

Rahmen des Owner-Auftrags:
- keine Gemini-Änderungen;
- keine Prompt-Änderungen;
- keine neue Engine;
- nur die erforderliche Validierung.

Die Meldung stammt aus der Owner-Vorgabe zur Scope-Grenze: **„Bitte wählen Sie einen Job aus.“**

Eine gültige Auswahl ist `jobScope: { jobPoolUploadId, poolRoleId }` mit genau diesen zwei Schlüsseln. Der Server prüft gegen die gespeicherten Daten:

| Prüfung | Abgelehnt mit |
|---|---|
| `jobScope` fehlt, ist kein Objekt, hat andere Schlüssel, `jobPoolUploadId` ist nicht `JPOOL_<32 Hex>` oder `poolRoleId` ist kein nicht-leerer String (dieselbe Form wie das Pool-Schema; jede im Pool hochladbare Rollen-ID ist formal gültig) | 400 `ERR_JOB_SCOPE_REQUIRED` |
| Upload unbekannt | 422 `ERR_JOB_SCOPE_INVALID` |
| Pool nicht `ACTIVE` (DRAFT, ARCHIVED) | 422 `ERR_JOB_SCOPE_INVALID` |
| kein kanonisches Mapping zum Upload | 422 `ERR_JOB_SCOPE_INVALID` |
| Rolle gehört nicht zu diesem Pool, auch wenn es sie in einem anderen Pool gibt | 422 `ERR_JOB_SCOPE_INVALID` |
| Rolle oder eines ihrer Requirements ohne Mapping | 422 `ERR_JOB_SCOPE_INVALID` |
| Jobpool-Persistenz auf dieser DB nicht eingerichtet (Grenze B-ENTRY) | 422 `ERR_JOB_SCOPE_INVALID` |

Antwortform: `{ success: false, status: "FAILED", issues: [{ code, message: "Bitte wählen Sie einen Job aus." }] }`.

## 2. Rekonstruktion: Jobpool- und Capability-API-Relationen (Ist, 311d6ee)

| Route | Liest | Schreibt | Führt zu einer Capability-Analyse oder Gemini? |
|---|---|---|---|
| `POST /api/career/analyze` | Body `{ documents }` | `career_analysis_jobs` (Auftrag mit vollständigem Body) | **ja**, einziger Eingang; der Worker holt den Auftrag ab |
| `GET /api/career/jobs/[jobId]` | Auftrag | – | nein (Status) |
| `GET /api/career/analyses`, `GET /api/career/analyses/[id]` | Analyse, Sweep-Projektion | – | nein |
| `POST /api/career/job-pools` | Pool-JSON | Upload und kanonisches Mapping (Target-Revisionen) | nein, deterministisch |
| `GET /api/career/job-pools`, `GET …/[id]` | Upload, Mapping | – | nein |
| `GET /api/career/job-pools/[id]/matches?analysisId=` | Analyse, Pool, Projektion | – | nein, deterministisches Matching ohne Modell |
| `POST /api/career/canonical-sil/execute`, `GET …/[id]` | CSB, verifizierter Snapshot | Stage-B-Assoziation | nein, kein Provider |
| `/api/career/hr-decision-loop/*` | Entscheidungskontext | menschliche Entscheidung | nein |
| `/api/decision-contexts*`, `/api/pdf`, `/api/topology/*` | – | – | nein |
| `/api/admin/proxy/[...path]` | – | – | leitet an externes `CONDYN_API_URL` weiter, nicht an diese Analyse |

Vor dieser Änderung gab es zwischen Jobpool und Analyse keine Relation. Die Analyse kannte keinen Pool, und der Pool beeinflusste die Analyse nicht. Erst danach verband `matches` eine fertige Analyse mit einem Pool.

## 3. Recursive Deep Sweep (vorwärts: Eingang → Gemini)

1. Einziger Erzeuger von Analyseaufträgen: `createJob` und `enqueueJob` werden nur in `app/api/career/analyze/route.ts` aufgerufen (git grep über app, lib, scripts).
2. Der Auftrag liegt in `career_analysis_jobs`. Abgeholt wird er nur von `CareerJobWorker` (`lib/career/orchestration/worker.ts`).
3. Gestartet wird der Worker nur über `scripts/run-career-worker.ts`. `hr-loop:local` und die E2E-Umgebungen starten genau dieses Skript.
4. Der Worker ruft `createCareerAnalysisJobProcessor` auf, mit diesen Schritten:
   1. RECOVERY_CHECK,
   2. SOURCE_PREPARATION und CSB,
   3. Discovery (Gemini),
   4. Convergence (Gemini),
   5. Legacy-Analyse (Gemini),
   6. Persistenz.
5. Frontend-Aufrufer der Route:
   - `lib/career/ui/career-job-controller.ts:77–83` sendet `{ documents }`;
   - `app/career/analyze/page.tsx:68–71` sendet ebenfalls `{ documents }`.

   Keiner von beiden sendet heute eine Jobauswahl.

## 4. Inverse Deep Sweep (rückwärts: Gemini → Eingang)

| Gemini-Konstruktion | Erzeugt von | Erreichbar über |
|---|---|---|
| `GeminiCapabilityDiscoveryProvider`, `GeminiCapabilityConvergenceProvider` | nur `scripts/run-career-worker.ts` | Worker ← Auftrag ← `POST /api/career/analyze` |
| `GeminiProvider` (Legacy, `lib/career/providers/gemini.ts`) | `scripts/run-career-worker.ts`; `getCareerInferenceProvider` (`providers/index.ts`) | Worker; `getCareerInferenceProvider` wird nur von den Entwicklerskripten `scripts/test-pipeline-live.ts` und `scripts/test-multi-source-live.ts` importiert |
| `GoogleGenAI` direkt | `lib/career/embeddings/gemini.ts` (kein Importeur), `scripts/probe-gemini.ts`, `scripts/list-models.ts`, `scripts/test-live-*.ts` | nur manuelle Entwicklerskripte, keine HTTP-Route |

Ergebnis: Jeder Produktweg zu Gemini führt durch genau zwei Grenzen, die Route und den Worker. Die Validierung sitzt an beiden.

Die Entwicklerskripte rufen Gemini direkt auf, ohne Analyseauftrag. Sie liegen außerhalb des Produktpfads und sind in Abschnitt 9 als offener Punkt vermerkt.

## 5. Implementierung (nur Validierung)

| Datei | Inhalt |
|---|---|
| `lib/career/job-scope/errors.ts` | `JobScopeRequiredError`: code `ERR_JOB_SCOPE_REQUIRED` oder `ERR_JOB_SCOPE_INVALID`, Meldung wörtlich, `name = TERMINAL_ERROR`, damit der Worker nicht wiederholt |
| `lib/career/job-scope/scope.ts` | `parseJobScopeSelection` (Form, genau zwei Schlüssel; Rollen-ID wie im Pool-Schema: nicht-leerer String); `resolveJobScopeFromStoredPool` (ACTIVE, Rolle im Pool, Mapping für Rolle und jedes Requirement); `createJobScopeResolver` (liest Upload und Mapping) |
| `lib/career/job-scope/local-resolver.ts` | derselbe Zugang zur Jobpool-Persistenz wie die Jobpool-Routen (`ensureJobPoolPersistenceRegistration`, B-ENTRY); ohne Persistenz gibt es keinen gültigen Job |
| `lib/career/job-scope/worker-boundary.ts` | `requireValidJobScope(resolver, processJob)`: prüft jeden abgeholten Auftrag, **bevor** der unveränderte Processor läuft |
| `app/api/career/analyze/route.ts:61–75` | Prüfung nach der bestehenden Dokumentprüfung und vor `createJob`; Ablehnung mit 400 oder 422, nichts wird eingereiht |
| `scripts/run-career-worker.ts:97–98` | `processJob = requireValidJobScope(createLocalJobScopeResolver(), createCareerAnalysisJobProcessor({…}))` |
| `lib/career/orchestration/job-repository.ts:47–51` | **Blocker-Fix.** Die Idempotenzprüfung verglich `JSON.stringify` der gespeicherten JSONB-Eingabe. JSONB ordnet Schlüssel um (kürzere zuerst), deshalb lieferte der zweiteilige Body `{ documents, jobScope }` ein falsches 409. Jetzt `isDeepStrictEqual`. |
| `docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json` | Testpool, Byte-Kopie aus `frontend/job-field` @ 799f523 |

Ausdrücklich unverändert:
- Processor (`career-analysis-job-processor.ts`), Executor, Capability Core;
- alle Gemini-Provider, Kernels und Prompts;
- Modellwahl;
- Jobpool-Upload und Matching;
- die versiegelten Suites (P8-Siegel 435a112 grün).

## 6. Tests

Neue Tests:
- `test/career/job-scope/job-scope.test.ts` (ohne DB), 6 Tests:
  - Formprüfung mit 11 ungültigen Formen;
  - Auflösung A und B;
  - Ablehnung von fremder Rolle, DRAFT, ARCHIVED, Rolle ohne Mapping, Requirement ohne Mapping und Pool-Mismatch;
  - unbekannter Upload und fehlendes Mapping über den Reader;
  - Worker-Grenze: fünf ungültige Aufträge erreichen den Processor nie und melden keinen Fortschritt; ein gültiger Auftrag wird unverändert durchgereicht.
- `test/career/job-scope/job-scope.postgres.test.ts` (Wegwerf-DB, ohne Gemini), 8 Tests:
  - Route 400 (5 Formen) und 422 (unbekannt, DRAFT, unbekannte Rolle, Rolle aus anderem Pool, Rolle des einen Pools mit Upload des anderen), jeweils ohne Eintrag in `career_analysis_jobs`;
  - Dokumentprüfung bleibt zuerst;
  - 202 mit gespeicherter Auswahl für A, B und einen zweiten Pool;
  - Idempotenz unabhängig von der Schlüsselreihenfolge;
  - echter `CareerJobWorker`: Aufträge ohne Auswahl, mit DRAFT-Pool oder mit fremder Rolle enden terminal `FAILED` nach einem Versuch, ohne den Processor zu erreichen; ein gültiger Auftrag erreicht ihn.

Angepasst wurden nur Tests, die die Route aufrufen. Sie senden jetzt einen gültigen `jobScope` und laden dafür den Testpool hoch:
- `test/career-async-api-orchestration.test.ts`
- `test/career-analyze-flow.test.ts`
- `test/job-pool-validation/pdf-path.postgres.test.ts`

Ergebnisse:
- **Betroffene Suiten:** 18 Dateien, 155 Tests grün. Darin enthalten sind der Siegeltest `g2-g3-vertical-proof` (P8) und `hr-decision-loop-p7`.
- **Komplette Suite:** siehe Abschnitt 8.

## 7. Proof mit dem echten Worker-Prozess

Skript: `scripts/proofs/job-pool-first-boundary.ts`. Ergebnis: `docs/proofs/job-pool-first-boundary/2026-10-14-real-worker.json`.

Aufbau:
- frische Wegwerf-DB, nach dem Lauf gelöscht;
- drei gespeicherte Pools: Engineering ACTIVE, Engineering DRAFT und ein zweiter ACTIVE-Pool;
- der Route-Handler läuft im Prozess;
- die Aufträge verarbeitet der **echte** Worker `scripts/run-career-worker.ts` als eigener Prozess.

| Check | Beobachtet |
|---|---|
| R1 keine Auswahl | 400 `ERR_JOB_SCOPE_REQUIRED`, „Bitte wählen Sie einen Job aus.“, 0 eingereiht |
| R2 Auswahl formal falsch | 400 `ERR_JOB_SCOPE_REQUIRED`, 0 eingereiht |
| R3 unbekannter Pool | 422 `ERR_JOB_SCOPE_INVALID`, 0 eingereiht |
| R4 Pool DRAFT | 422 `ERR_JOB_SCOPE_INVALID`, 0 eingereiht |
| R5 Rolle nicht im Pool | 422 `ERR_JOB_SCOPE_INVALID`, 0 eingereiht |
| W1 Auftrag ohne Auswahl, an der Route vorbei eingereiht | `FAILED` `ERR_JOB_SCOPE_REQUIRED`, 1 Versuch, `currentOperation` null; kein CSB, keine Sweep-Referenz, keine Analyse |
| W2 Auftrag mit DRAFT-Pool | `FAILED` `ERR_JOB_SCOPE_INVALID`, wie W1 ohne jede Verarbeitungsspur |
| W3 Auftrag mit Rolle aus anderem Pool | `FAILED` `ERR_JOB_SCOPE_INVALID`, wie W1 |
| R6 und V1 gültiger Pool und Job (Kestrel) | 202, danach `SUCCEEDED` über die unveränderte Pipeline mit echtem Gemini (`gemini-3.1-pro-preview`): eine Sweep-Referenz, eine Analyse |

**Alle 10 Checks: PASS.**

## 8. Gesamtsuite und Vergleich mit dem Ausgangsstand

Ohne E2E-Browser-Tests, Wegwerf-DB, Lauf ohne parallele Last: **2400 grün, 30 rot, 8 übersprungen** (386 Dateien).

| Rot | Ursache |
|---|---|
| 27 Tests in 4 Dateien: `career-lifecycle-concurrency-idempotency`, `career-lifecycle-postgres-persistence`, `career-lifecycle-recovery`, `career-policy-activation-atomicity` | Schon auf 311d6ee identisch rot (gleiche Dateien auf beiden Ständen geprüft); Insert-Fehler in `career_policy_versions`. Nicht Teil dieser Änderung. |
| 2 Tests `career-outcome-valence-feedback-context-revision-postgres`, 1 Test `decision-core/validation/authority` | Schwanken mit der Reihenfolge der Gesamtsuite; isoliert auf diesem Branch **und** auf 311d6ee grün (24/24). |
| `career-worker-config-validation` | Auf 311d6ee isoliert 3 rot; in der Gesamtsuite schwankend (in diesem Lauf grün). |

Keine Fehlerursache stammt aus dieser Änderung.

Zuvor gefunden und behoben: Mein eigener Postgres-Test hatte PINKs `validationPool` in die gemeinsame Wegwerf-DB geladen. Dadurch erhielt `http-canonical-inverse.postgres.test.ts` beim ersten Upload 200 statt 201. Die Tests verwenden jetzt einen eigenen Mini-Pool (`OTHER_POOL` in `test/support/job-scope.ts`).

## 9. Folgen und offene Punkte

1. **Das Frontend sendet heute nur `{ documents }`.** Mit dieser Grenze wird jeder Analyze-Klick abgelehnt (400 und die Meldung), bis GRÜN die Jobauswahl mitsendet. Das ist von der Invariante so gewollt. Betroffen sind auch:
   - der Live-Browser-E2E-Test `test/job-pool-validation/live-browser-workflow.e2e.test.ts`;
   - die manuelle Umgebung `hr-loop:local`.
2. **Befunde von GRÜN** (Frontend, 799f523):
   - `CareerJobController` macht aus jeder Nicht-202-Antwort `HTTP_<status>` und verliert dabei den `code`;
   - das Fehlerbanner vergleicht `status === 422` mit einem String.
3. **Entwicklerskripte:** `scripts/test-live-*.ts`, `test-pipeline-live.ts`, `test-multi-source-live.ts`, `probe-gemini.ts` und `list-models.ts` rufen Gemini direkt auf, ohne Analyseauftrag. Sie sind kein Produktweg. Vom Owner am 2026-10-14 entschieden: Sie verlangen eine gültige Jobauswahl (§11).
4. **Meldungssprache:** Die Meldung ist auch in der englischen Oberfläche deutsch. Ob es eine EN-Variante gibt, entscheidet der Owner; der `code` erlaubt eine Übersetzung.
5. **:3017** läuft unverändert auf 5898def und hat diese Grenze nicht.
6. **Geparkte Arbeit:** Der Job-Scoped Sweep mit gespeichertem Sweep-Prompt, gescoptem Discovery-Kernel, Gemini-Gate und Traces liegt lokal auf `feature/job-scoped-capability-sweep` (026e6bd, da95ab7). Er ist nicht gepusht und nicht Teil dieses Branches.

## 10. Nachtrag 2026-10-14: Rollen-ID-Form (Befund GRÜN)

841baab prüfte `poolRoleId` gegen `/^[A-Za-z0-9_.:-]{1,128}$/`. Das ist strenger als das Pool-Schema (`role id = z.string().min(1)`). Ein hochladbarer, aktiver Pool mit einer Rollen-ID wie „Senior Engineer“ oder „rolle_ä“ wäre gespeichert worden, seine Auswahl aber mit 400 abgelehnt. Behoben:
- Formal gilt jetzt dieselbe Regel wie im Pool-Schema, also ein nicht-leerer String.
- Ob die Rolle existiert, entscheidet allein der gespeicherte Pool. Fehlt sie, folgt 422 `ERR_JOB_SCOPE_INVALID`.
- Tests: Rollen-IDs mit Leerzeichen, Umlaut, Rand-Leerzeichen und Sonderzeichen sind formal gültig und werden nur über den Pool entschieden. Der zweite Testpool hat die Rolle „Senior Engineer – rolle_ä“; die Route nimmt sie mit 202 an.

## 11. Owner-Entscheidung 2026-10-14: G-10, G-05 und alle Ausführungspfade

Owner-Vorgaben:
- **G-10, Variante A:** Die Rollen-ID wird exakt wie im gespeicherten Pool übernommen. Frontend und Backend verwenden dieselbe formale Regel: ein nicht-leerer String, ohne Normalisierung und ohne zusätzliche Zeichenbeschränkung. Existenz und Gültigkeit prüft der Server gegen den gespeicherten Pool.
- **G-05:** Die gewählte Rolle darf durch eine ausdrückliche Nutzeraktion entfernt werden. Danach ist kein Job-Scope gewählt und ANALYZE ist gesperrt. Das ist reines Frontend (GRÜN); das Backend hält keine serverseitige Auswahl.
- **Alle Ausführungspfade:** Die Job-Scope-Pflicht gilt für jeden Ausführungspfad der Career-Analysis-Pipeline, auch für direkte Aufrufe durch Entwicklungsskripte. Test- oder Retry-Code darf sie nicht umgehen.

### 11.1 G-10 im Backend

Das Backend erfüllt die Regel seit 2e61a2b. `parseJobScopeSelection` prüft nur `typeof === "string"` und `length > 0`. Es trimmt nicht und normalisiert nicht. „  role pink padded  “ und „ “ sind formal gültig; ob die Rolle existiert, entscheidet der Pool (422). Die Tests decken beide Formen ab. Auch Skripte übernehmen die Rollen-ID unverändert aus der Umgebung.

### 11.2 Sweep: Wo konnte die Pipeline ohne Job-Scope laufen?

| Pfad | Vorher | Jetzt |
|---|---|---|
| `POST /api/career/analyze` | Prüfung vor `createJob` (841baab) | unverändert |
| Worker, erster Versuch | `requireValidJobScope` vor dem Processor | unverändert, zusätzlich öffnet die Grenze den geprüften Scope für genau diesen Auftrag (`runWithJobScope`, AsyncLocalStorage) |
| Worker, Retry und abgelaufener Lease | jeder Claim läuft durch die Grenze | wie bisher, jetzt durch Test belegt: Zwischen zwei Versuchen wird der Pool archiviert, der zweite Versuch endet terminal mit `ERR_JOB_SCOPE_INVALID`, und der Processor wird nur einmal erreicht |
| Capability-Sweep im Worker (Discovery, Convergence → Gemini) | nur durch die Worker-Grenze geschützt | die Provider der Worker-Komposition verlangen bei jedem `execute` den offenen, geprüften Scope (`requireActiveJobScope`) |
| `executeCareerAnalysisPipeline`, `executeCareerAnalysisBatchPipeline` (Legacy-Analyse → Gemini) | ohne Prüfung aufrufbar | `options.jobScope` ist Pflicht; `assertIssuedJobScope` läuft als erste Anweisung, vor Dokument-, Prompt- und Provider-Arbeit |
| Entwicklungsskripte (`scripts/test-live-*.ts`, `test-pipeline-live.ts`, `test-multi-source-live.ts`, `probe-gemini.ts`, `list-models.ts`) | Gemini ohne Scope | `resolveScriptJobScope` vor `main`; ohne gültige Auswahl Exit 3 mit Code und Meldung |
| Skripte im Repo-Wurzelverzeichnis (`debug.ts`, `test-pdf.ts`, `test-github.ts`, `trace-pdf.ts`, `trace-pdf-5.ts`, `forensics-step2.ts`, `bisection.ts`, `schema-bisection.ts`, `schema-bisection-mjs.ts`, `test-schema.ts`) | Gemini oder Pipeline ohne Scope | wie die Entwicklungsskripte |
| Live- und Diagnosetests (`career-gemini-live`, `-live-probe`, `-probe`, `-request-boundary`, `-schema-bisection`, `-embedding-live`, `career-forensic-pdf`, `gemini-token-limit-matrix`, `schema-bisection`) | Gemini ohne Scope, sobald die Freigabe-Variable gesetzt ist | `resolveStoredTestJobScope()` vor dem ersten Gemini-Zugriff: Der Testpool wird in der Wegwerf-DB gespeichert und über denselben Resolver wie Route und Worker geprüft |
| Unit-Tests mit Mock-Provider | Pipeline ohne Scope | rufen die Pipeline mit einem aufgelösten Scope des Testpools auf (`resolveTestJobScope`) |

Nicht betroffen: Lese-Routen und SIL-Dienste rufen weder die Pipeline noch Gemini auf. `GeminiEmbeddingProvider` wird in keinem Produktpfad verwendet. `check.ts` gibt nur das Schema aus.

### 11.3 Kein Bypass

- **Nur ausgestellte Scopes.** `resolveJobScopeFromStoredPool` ist die einzige Stelle, die einen Scope ausstellt. Ein Scope gilt nur, wenn er in einem modulinternen `WeakSet` steht, und er ist tief eingefroren. Diese Formen werden als `ERR_JOB_SCOPE_REQUIRED` abgelehnt:
  - ein Objektliteral;
  - eine Spread-Kopie;
  - `structuredClone` oder eine JSON-Kopie;
  - die reine Auswahl `{ jobPoolUploadId, poolRoleId }`.
- **Keine Schalter.** Es gibt kein Flag, keine Umgebungsvariable und keinen Test-Modus, der die Prüfung abschaltet.
- **Skripte lesen nur.** `resolveScriptJobScope` liest den Pool über eine eigene **read-only**-Verbindung aus einer **verifizierten Wegwerf-DB**. Ein fehlendes `DATABASE_URL`, die geteilte Datenbank `condyn` oder eine DB ohne Jobpool-Persistenz führen zur Ablehnung, und es wird nichts geschrieben.
- **Unverändert:** Gemini-Provider, Prompts, Kernels, Modellwahl, der Processor und die versiegelten Suites.
- **Scope bleibt Validierung.** Der Scope wird weder an Prompt noch Provider weitergegeben; ein Test prüft, dass der Provider-Aufruf weder Scope-Hash noch Rollen-ID enthält.

### 11.4 Tests und Proofs

- `test/career/job-scope/job-scope.test.ts`, 14 Tests (davon 7 neu):
  - Pipeline und Batch-Pipeline lehnen sieben Fälschungsformen ab, ohne Provider- oder Fortschrittsaufruf;
  - ein ausgestellter Scope öffnet die Pipeline und wird nicht weitergegeben;
  - Einfrieren, Kontext außerhalb eines Auftrags, gleichzeitige Aufträge sehen jeweils ihren eigenen Scope;
  - Skript-Scope ohne Auswahl, ohne Wegwerf-DB und gegen `condyn` ohne Verbindung.
- `test/career/job-scope/job-scope.postgres.test.ts`, 10 Tests (davon 2 neu):
  - zusätzlich Retry-Neuvalidierung;
  - Skript-Scope gegen den gespeicherten Pool: gültig; ungültig bei Rand-Leerzeichen-Rolle, fremder Rolle, DRAFT und unbekanntem Upload.
- `scripts/proofs/job-scope-all-paths.ts` → `docs/proofs/job-pool-first-boundary/2026-10-14-all-paths-no-gemini.json`:
  - alle 20 Skripte als eigene Prozesse, jeweils ohne Auswahl und mit DRAFT-Pool, sowie eine Rolle außerhalb des Pools;
  - alle Prozesse laufen unter einem Netzwerk-Sentinel mit Dummy-Key; der Sentinel ist positiv kontrolliert, und es gab keinen einzigen Netzwerkversuch;
  - `debug.ts` (Mock-Provider) läuft mit gültiger Auswahl durch.
  - Kein Live-Gemini-Aufruf.
- `scripts/proofs/job-pool-first-boundary.ts --skip-valid` mit dem echten Worker-Prozess unter demselben Sentinel → `2026-10-14-all-paths-worker-no-gemini.json`.

### 11.5 PINK

`test/job-pool-validation/pdf-path.postgres.test.ts` ruft die Pipeline direkt auf und braucht jetzt `jobScope`. Die Datei gehört PINK. Die Änderung geht als Diff an PINK und ist nicht Teil dieses Commits. Bis PINK sie übernimmt, schlägt diese Datei auf diesem Branch beim Typecheck und beim Aufruf fehl.

### 11.6 Gesamtsuite auf 027abf3

Ohne e2e, auf einer Wegwerf-DB: 2408 bestanden, 32 fehlgeschlagen, 8 übersprungen. Übersprungen sind die Live- und Diagnosetests ohne Freigabe-Variable. Zum Vergleich 2e61a2b: 2400 bestanden, 30 fehlgeschlagen.

Die 32 Fehlschläge:
- **27, identisch zum Ausgangsstand:** lifecycle-concurrency-idempotency, lifecycle-postgres-persistence, lifecycle-recovery und policy-activation-atomicity.
- **3 in outcome-valence-feedback-context-revision-postgres:** reihenfolgeabhängig und schon vorher bekannt; einzeln 8/8 grün.
- **2 in PINKs `pdf-path.postgres.test.ts`:** Sie scheitern genau an der neuen Grenze (`TERMINAL_ERROR: Bitte wählen Sie einen Job aus.`). Das bleibt so, bis PINK den Diff übernimmt (§11.5).

`career-worker-config-validation` ist reihenfolgeabhängig. Einzeln scheitert die Datei auf 2e61a2b und auf 027abf3 gleich (Tabelle fehlt); in diesem Lauf war sie grün.
