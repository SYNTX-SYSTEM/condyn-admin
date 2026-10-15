# Gemini Result Inspector (Backend-Vertrag)

Stand: 2026-10-15. Grundlage sind die Owner-Aufträge „SELECTED JOB SCOPE → CAPABILITY DISCOVERY → OBSERVABLE RESULT FIELD“ und „NEXT OWNER GO“. Der Inspector ist ein internes Engineering- und Validierungsinstrument. Er liest nur und ist kein zweiter Analysepfad.

## 1. Relationen

| Relation | Stelle | Was gilt |
|---|---|---|
| Gemini Response → Discovery | `capability-core/discovery/gemini-provider.ts` | Der Provider gibt neben dem geprüften `kernelOutput` den empfangenen Text unverändert zurück (`providerResponse.text`), dazu SHA-256, `finishReason`, `modelVersion`, `responseId`, `usageMetadata` und die Empfangszeit. Request und Antwortschema bleiben gleich. |
| Discovery → Austausch-Archiv | `capability-core/discovery/runtime.ts` (`providerExchangeArchive`) | Nach dem Speichern des Laufs übergibt Discovery den Austausch (RUN-Kennung, Scope-Text mit Hash, Antwort) an ein eigenes Archiv. Der unveränderliche Lauf enthält weder den Antworttext noch den Scope-Text; er bleibt so, wie ihn e643e96 schreibt. Ein Fehler im Archiv lässt die Analyse unverändert, der Inspector meldet dann `NOT_RETAINED`. |
| Austausch-Archiv → Aufbewahrung | `result-inspector/retention.ts` | Jeder Austausch bekommt beim Speichern ein Ablaufdatum (`CONDYN_GEMINI_EXCHANGE_RETENTION_DAYS`, ganze Tage, Standard 7, höchstens 30). Nach Ablauf wird nichts mehr ausgegeben. Abgelaufene Einträge werden bei jedem Schreiben und Lesen gelöscht. `delete(runId)` löscht sofort. Pro RUN-Kennung gilt der erste Eintrag. |
| Discovery Run → Read Boundary | `result-inspector/access.ts` | Die Leseroute ist standardmäßig geschlossen (siehe 3). |
| Read Boundary → Inspector | `result-inspector/reader.ts`, `GET /api/career/analyses/[analysisId]/gemini-result` | Der Inspector folgt genau der gespeicherten Projektionsreferenz (Analyse → RUN_/CONV_). Der Austausch muss dieselbe RUN-Kennung und denselben Scope-Hash tragen, sonst 409. Er sucht keinen Ersatzlauf und rekonstruiert nichts. |

**Stand der Verdrahtung:** Im Worker und in der Route ist noch kein Archiv angeschlossen. Ein dauerhaftes Archiv braucht eine eigene Tabelle. Diese DDL ist nicht freigegeben, der Schließungs-Diff liegt dem Owner vor. Bis zur Freigabe zeigt der Inspector die verarbeiteten Phasen; Originalantwort und Scope-Text sind `NOT_RETAINED`.

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
- Jeder andere Fall antwortet mit 404, als gäbe es die Route nicht. Abschalten heißt: Variable entfernen. Die Pipeline ändert sich dadurch nicht.
- Das Token gehört nicht in den Browser. Eine Oberfläche ruft die Route serverseitig auf oder nutzt `createGeminiResultInspector` in einer Server-Komponente hinter derselben Freischaltung.
- Der Inspector liefert keine Kandidatendokumente (PDF-Inhalte des Auftrags), keine Keys und keine Verbindungsdaten.

## 4. Offene Grenzen

- **Dauerhaftes Archiv:** braucht die Tabelle `career_gemini_provider_exchanges` (Owner-Freigabe der DDL). Der Diff liegt vor: Tabelle, Postgres-Archiv mit Ablauf und Löschung, Verdrahtung in Worker und Route.
- **Fehlgeschlagene Antworten:** Scheitert JSON-Parse, Schema- oder Coverage-Prüfung, gibt es keinen Lauf und keinen Austausch. Das Archiv könnte sie aufnehmen, weil es nicht an den Lauf gebunden ist. Das ist eine Owner-Entscheidung.
- **Convergence-Rohantwort und Legacy-Analyse:** Sie werden nicht aufbewahrt. Der Inspector zeigt das gespeicherte Convergence-Ergebnis; der zweite Gemini-Aufruf je ANALYZE (`providers/gemini.ts`) ist nicht abgedeckt.
- **Personenbezug außerhalb des Archivs:** `kernelOutput` und die Kandidaten im Lauf enthalten wörtliche Zitate aus Lebensläufen, die Source Bundles den Text der PDFs. Für diese Daten gibt es weiterhin keinen Löschweg. Das betrifft die bestehende Pipeline, nicht den Inspector.
