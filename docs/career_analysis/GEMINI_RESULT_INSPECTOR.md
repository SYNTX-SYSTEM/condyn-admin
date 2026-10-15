# Gemini Result Inspector (Backend-Vertrag)

Stand: 2026-10-15. Grundlage sind die Owner-Aufträge „SELECTED JOB SCOPE → CAPABILITY DISCOVERY → OBSERVABLE RESULT FIELD“ und „NEXT OWNER GO“. Der Inspector ist ein internes Engineering- und Validierungsinstrument. Er liest nur und ist kein zweiter Analysepfad.

## 1. Relationen

| Relation | Stelle | Was gilt |
|---|---|---|
| Gemini Response → Discovery | `capability-core/discovery/gemini-provider.ts` | Der Provider gibt neben dem geprüften `kernelOutput` den empfangenen Text unverändert zurück (`providerResponse.text`), dazu SHA-256, `finishReason`, `modelVersion`, `responseId`, `usageMetadata` und die Empfangszeit. Request und Antwortschema bleiben gleich. |
| Discovery → Austausch-Archiv | `capability-core/discovery/runtime.ts` (`providerExchangeArchive`) | Jede empfangene Antwort geht an ein eigenes Archiv, angenommen oder abgelehnt. Gespeichert werden die RUN-Kennung, unter der sie entstand, und die Request-Identität (SHA-256 von System- und User-Prompt, Source-Bundle-Hash, Kernel-Checksumme, Provider, Modell, Schema). Dazu kommen Scope-Text mit Hash, die Antwort und das Ergebnis: `COMPLETED` erst nachdem der Lauf aus genau dieser Antwort gespeichert ist, sonst `FAILED` mit stabilem Fehlercode (`ERR_…`, nie Freitext). Abgelehnte Antworten trägt `CapabilityProviderResponseError` aus dem Provider. Fehlercodes und Verhalten bleiben gleich; ohne empfangene Antwort (Netzwerkfehler) entsteht kein Eintrag. Der unveränderliche Lauf bleibt exakt wie in e643e96. Ein Fehler im Archiv lässt die Analyse unverändert; auf ein langsames Archiv wartet Discovery höchstens `EXCHANGE_ARCHIVE_WAIT_MS` (1 s, PINK O-ARCHIVE-AWAIT), der Schreibvorgang läuft danach allein zu Ende. |
| Austausch-Archiv → Aufbewahrung | `result-inspector/retention.ts`, `result-inspector/postgres-exchange-store.ts` | Jeder Eintrag bekommt beim Speichern ein Ablaufdatum (`CONDYN_GEMINI_EXCHANGE_RETENTION_DAYS`, ganze Tage, Standard 7, höchstens 30). Nach Ablauf wird nichts mehr ausgegeben. Abgelaufene Zeilen werden bei jedem Schreiben und Lesen gelöscht (`DELETE`). `delete(exchangeId)` löscht sofort. Pro RUN-Kennung gibt es höchstens einen `COMPLETED`-Eintrag (partieller Unique-Index). |
| Discovery Run → Read Boundary | `result-inspector/access.ts` | Die Leseroute ist standardmäßig geschlossen (siehe 3). |
| Read Boundary → Inspector | `result-inspector/reader.ts`, `GET /api/career/analyses/[analysisId]/gemini-result`, `GET /api/career/jobs/[jobId]/gemini-exchanges` | Die Analyse-Sicht folgt der gespeicherten Projektionsreferenz (Analyse → RUN_/CONV_). Sie zeigt nur den einen `COMPLETED`-Austausch dieser RUN-Kennung, und nur wenn dessen Scope-Hash und Request-Identität zum Lauf passen, sonst 409. Die Auftrags-Sicht zeigt alle Austausche, die beim Speichern diesem Auftrag zugeordnet wurden (Auftrag und Lease im Worker-Kontext `runWithExchangeAttempt`), auch fehlgeschlagene. Beide suchen keinen Ersatz und rekonstruieren nichts. |

**Stand der Verdrahtung:** Owner-GO 2026-10-15 „EXCHANGE ARCHIVE“ für Tabelle und Migration nur im isolierten Engineering- und Testkontext. Das Archiv ist opt-in (`CONDYN_GEMINI_EXCHANGE_ARCHIVE=1`). Die Tabelle `career_gemini_provider_exchanges` entsteht nur, wenn die Datenbank als markierte Wegwerf-Datenbank verifiziert ist (dieselbe Prüfung wie beim Job Pool, B-ENTRY). Auf jeder anderen Datenbank gibt es keine DDL und kein Archiv; der Inspector meldet dort `NOT_RETAINED`.

## 2. Antwort (`GEMINI_RESULT_INSPECTION_V1`)

`{ success: true, inspection }`, `Cache-Control: no-store`. Die Abschnitte sind getrennt und werden nie zusammengeführt:

| Abschnitt | Inhalt |
|---|---|
| `investigationInput` | Job-Auswahl (`jobPoolUploadId`, `poolRoleId`); Scope: `RETAINED` (Text, Hash, `textMatchesScopeHash`, `expiresAt`), `NOT_RETAINED` (nur Hash) oder `UNSCOPED`; Discovery-Run-ID; Kernel (Version, Template, Version-ID, Checksumme); Provider und Modell; Schema-Version; Dokument-Identitäten aus dem Source Bundle (IDs, Titel und Hashes, kein Inhalt); Zeitpunkte von Lauf und Auftrag. Ein früherer Lauf als der Auftrag bedeutet: wiederverwendet, kein neuer Gemini-Aufruf. |
| `originalGeminiResponse` | `RETAINED` mit dem unveränderten Text, den Envelope-Feldern, `retainedAt`, `expiresAt` und den Prüfungen `textMatchesSha256` und `parserResultMatchesText`; sonst `NOT_RETAINED` (nie gespeichert, abgelaufen oder gelöscht). Dann wird nie ein verarbeitetes Ergebnis an dieser Stelle gezeigt. |
| `parserResult` | das gespeicherte `kernelOutput` (nach JSON-Parse und Schemaprüfung) und `rawOutputHash` (Hash des geparsten Objekts, nicht des Texts) |
| `evidenceVerification` | die gespeicherten Kandidaten mit dem Prüfstatus je Claim (`VERIFIED`, `REJECTED_*`) |
| `convergence` | der gespeicherte Convergence-Lauf (Gruppen, Entwürfe, Relationen, ausgeschlossene Kandidaten) |
| `projection` | das bestehende Lesemodell der Capability-Vorschläge, so wie es auch das Capability Field erhält |

`originalGeminiResponse` trägt im Zustand `RETAINED` zusätzlich `exchangeId`, `attempt` (Auftrag und Lease oder `null`) und `request` (Request-Identität).

**Auftrags-Sicht** `GET /api/career/jobs/[jobId]/gemini-exchanges` (`GEMINI_EXCHANGE_INSPECTION_V1`): `{ success: true, archive: "AVAILABLE" | "NOT_AVAILABLE", inspection: { jobId, exchanges } }`. Jeder Austausch enthält `exchangeId`, `runId`, `outcome` (`COMPLETED`/`FAILED`), `errorCode`, `attempt`, `request`, `investigationScope`, `response` (Text unverändert oder `null`, Envelope), `retainedAt`, `expiresAt`, `textMatchesSha256` und `scopeTextMatchesScopeHash`. Für einen unbekannten Auftrag gibt es 404. Dieselbe Zugriffsgrenze, `no-store`.

Fehler: 404 `ERR_NOT_FOUND` (geschlossen oder falsches Token), 404 `ERR_RESULT_INSPECTION_NOT_FOUND` (keine Sweep-Referenz zur Analyse), 409 `ERR_RESULT_INSPECTION_LINEAGE_INVALID`, 500 `ERR_RESULT_INSPECTION_FAILED` (ohne Fehlertext).

## 3. Lesegrenzen

Rekonstruiert am 2026-10-15:

| Ebene | Stand |
|---|---|
| Deployment (`deploy/nginx/admin.condyn.eu`) | `/api/*` geht an das Backend auf Port 8002, nur `/api/pdf` an Next.js. `/api/career/*` von Next.js ist über diese Domain nicht erreichbar. Das ist eine Routing-Folge, keine Autorisierung. |
| Next.js-App | Keine Middleware, keine Anmeldung. `/api/career/*` ist für jeden erreichbar, der den Next-Port direkt erreicht (lokal :3017 und andere). Nur der Admin-Proxy nutzt `BACKEND_TOKEN`. |
| Inspector | Eigene Grenze, standardmäßig geschlossen (unten). |

Inspector-Grenze:

- Er antwortet nur mit `CONDYN_RESULT_INSPECTOR=1` **und** `CONDYN_RESULT_INSPECTOR_TOKEN` (mindestens 32 Zeichen) im Server-Environment **und** demselben Token im Header `x-condyn-result-inspector-token`. Der Vergleich ist zeitkonstant.
- Jeder andere Fall antwortet mit demselben JSON-404 `ERR_NOT_FOUND` ohne Daten. Von einer Route, die Next.js nicht kennt (HTML-404), ist das unterscheidbar (PINK O-INSPECTOR-404-SHAPE); über Analysen oder Konfiguration verrät es nichts. Abschalten heißt: Variable entfernen. Die Pipeline ändert sich dadurch nicht.
- Das Token gehört nicht in den Browser. Eine Oberfläche ruft die Route serverseitig auf oder nutzt `createGeminiResultInspector` in einer Server-Komponente hinter derselben Freischaltung.
- Der Inspector liefert keine Kandidatendokumente (PDF-Inhalte des Auftrags), keine Keys und keine Verbindungsdaten.

Nachweis an einem echten Next-Server auf einer Wegwerf-Datenbank, ohne Gemini (`docs/proofs/job-pool-first-boundary/2026-10-15-result-inspector-access.json`, 9e54662, 7/7):

| Fall | Status |
|---|---|
| bestehende Analyse-Route ohne Anmeldung (gespeicherte / unbekannte Analyse) | vom Handler beantwortet (500 wegen der leeren Test-Payload / 404), kein 401 oder 403 |
| Inspector ausgeschaltet, Header mit Token | 404 `ERR_NOT_FOUND` |
| eingeschaltet, ohne Header / mit falschem Token | 404 |
| eingeschaltet, richtiges Token | 200, `no-store`, Originalantwort `NOT_RETAINED`, weder PDF-Inhalt noch Antworttext noch Token im Body |
| eingeschaltet, unbekannte Analyse | 404 |

## 4. Bestehender Lifecycle (rekonstruiert 2026-10-15)

| Artefakt | Ablage | Ablauf oder Löschung |
|---|---|---|
| Discovery-, Convergence- und Verification-Läufe | `career_capability_runs` | keine; unveränderlich, `saveRun` lehnt jede abweichende Fassung ab |
| bestätigte Capability-Stände | `career_capability_snapshots` | keine; unveränderlich |
| Source Bundles (Text der PDFs) | `candidate_source_bundles` | keine |
| Aufträge samt Eingabe (PDF-Inhalt in `inputRef`) | `career_analysis_jobs` | keine; abgelaufen sind nur Worker-Leases (`lease_expires_at`) |
| Analysen | `career_analyses` | keine; nur die Projektionsreferenz fiele per `ON DELETE CASCADE` mit, gelöscht wird aber nirgends |
| Job Pools | `career_job_pool_uploads` | Status `DRAFT`/`ACTIVE`/`ARCHIVED`, keine Löschung |

Im Laufzeitcode (lib, app, scripts) gibt es keinen einzigen Löschpfad und keine Aufbewahrungsfrist. Die einzige Frist mit Löschung ist die des Austausch-Archivs (`retention.ts`). Ohne Owner-GO für dessen Tabelle wird keine Rohantwort gespeichert.

## 5. Offene Grenzen

- **Produktive Datenbank:** keine Tabelle, kein Archiv (nicht freigegeben).
- **Fehlschläge vor Discovery:** Abbrüche ohne empfangene Antwort (Netzwerk, fehlender Key) werden nicht erfasst. Es gibt nichts Empfangenes, das gespeichert werden könnte.
- **Convergence-Rohantwort und Legacy-Analyse:** Sie werden nicht aufbewahrt. Der Inspector zeigt das gespeicherte Convergence-Ergebnis; der zweite Gemini-Aufruf je ANALYZE (`providers/gemini.ts`) ist nicht abgedeckt.
- **Personenbezug außerhalb des Archivs:** `kernelOutput` und die Kandidaten im Lauf enthalten wörtliche Zitate aus Lebensläufen, die Source Bundles den Text der PDFs. Für diese Daten gibt es weiterhin keinen Löschweg. Das betrifft die bestehende Pipeline, nicht den Inspector.
