# G1 — Auftrag an GRÜN: PERSON × JOB auf dem ersten Bildschirm (Entwurf zur Owner-Freigabe, 2026-10-22)

Vorbereitet von GELB auf Owner-Auftrag „SYNTX::SFE::OWNER_DECISION_G1“ (G1_IMPLEMENTATION_HANDOFF). Grundlage:
- die Spezifikation `CONDYN_PXJ_G1_FIRST_SCREEN_SPECIFICATION_2026-10-22.md` (`9d9f519`); der Owner hat die Architektur angenommen;
- die Owner-Entscheidungen Q1 bis Q4 vom 2026-10-22.

**Dieser Text ist der Auftrag, nicht die Freigabe.** GRÜN beginnt erst, wenn der Owner ihn GRÜN direkt erteilt. GELB implementiert nichts.

## 00 — Rahmen

| | |
|---|---|
| Lane | GRÜN (Frontend) |
| Basis | `49e2bc6` (`frontend/focus-readability`), sofern der Owner nichts anderes bestimmt |
| Branch | `frontend/pxj-first-screen-g1` |
| Verboten | Backend-Änderung, neue Route, Änderung an `lib/` außer den in §08 genannten Dateien, Gemini-Aufrufe, Änderungen an Labor :41862, Merge, Deployment |
| Prüfung | GRÜN nach §09/§10, danach PINK nach §11, danach Owner (visuell) |

## 01 — Owner-Entscheidungen, die G1 bindet

- **Q1:** Legacy-Orbits unter PERSON × JOB werden ausgeblendet, wo sie ein Matching oder eine Bewertung nahelegen (§06).
  - B2 ist die einzige zugelassene Quelle für die Abdeckung der Anforderungen.
  - Kein Legacy-Score, kein Legacy-Ersatz, keine gemischte Relationsautorität.
- **Q2:** Die Wiederherstellung nach einem Reload gehört zu G1. Die Kette ist ANALYSIS_ID → PERSISTED_RESULT → SOURCE_IDENTITY → B2_RELATIONS → SEMIONTIC_FIELD_PROJECTION (§03).
  - Die Grenzen von Untersuchung und gewählter Rolle bleiben gewahrt.
  - Es gibt keine Vermischung über Sitzungen oder Rollen hinweg.
  - Kein leerer Zustand, wenn sich ein gültiges Ergebnis rekonstruieren lässt.
  - Kein erfundenes Ergebnis, wenn keines persistiert ist.
- **Q3:** Stufe 1 prüft mit vorhandenen persistierten Testdaten oder deterministischen Fixtures. Stufe 2 mit echtem Gemini gibt es nur nach einem eigenen Owner-GO. Stand-in-Belege dürfen nie als echte Modellausführung erscheinen (§10).
- **Q4:** Die Legacy-Rollendarstellung im Job Field ist eine eigene, nicht autoritative Schicht.
  - Ihre Quelle und ihre Grenzen werden ausdrücklich offengelegt.
  - Legacy-Werte werden nicht still zu B2-Relationen.
  - Das Verhalten der Rollenebene bleibt in G1 unverändert (§06.2).

## 02 — Abbildung von der Quelle auf den Bildschirm

Alle Routen bestehen schon und werden nur mit GET gelesen. Zeilenangaben beziehen sich auf `49e2bc6`.

| # | Bildschirmelement | Wert (Feldpfad) | Route bzw. Herkunft | Leser |
|---|---|---|---|---|
| M-01 | Analyse in Sicht | `job.state.resultAnalysisId`, sonst URL `analysisId` | Sitzung bzw. URL | `describeAnalysisSource` (`lib/career/job-pool/frontend-presentation.ts:333`), unverändert |
| M-02 | Ergebnis | Body von `GET /api/career/analyses/{id}`: `success`, `status`, `analysisId`, `metadata.analysis_id`, `analysis.structured_data.analysis`, `capabilityProposalProjection` | `app/api/career/analyses/[analysisId]/route.ts` | **neu:** ein Decoder für beide Wege (§03.2) |
| M-03 | Untersuchungsgrenze | `investigation.mode`, `jobScopeSelection{jobPoolUploadId, poolRoleId}`, `discoveryRunId`, `investigationScopeHash` | `GET …/investigation` (ANALYSIS_INVESTIGATION_V1) | `useAnalysisBoundary`, unverändert |
| M-04 | Gewählter Job | `jobScope{jobPoolUploadId, poolRoleId}`, Titel und Organisation aus der Validierung | URL-Parameter `jobScopePoolUploadId` und `jobScopeRoleId`, `useJobScopeValidation` | unverändert |
| M-05 | Quelle (Orbit 01) | `documents[].entity_id` (DOC_…), `documents[].identity.name` | M-02 | nach §07; kein `HASH-…` und kein „Unknown Document“ |
| M-06 | Fähigkeitsvorschläge (Orbit 02) | `capabilityProposalProjection.capabilities[]`: `id`, `name`, `scope`, `domain`, `evidence[]{evidenceId, sourceDocumentId, exactQuote, verificationState}` | M-02 | `applyCapabilityProposalProjectionToDemoState`, unverändert |
| M-07 | Rolle der Abdeckung | `comparison.role.title`, `organizationName` | `GET …/job-comparison?jobPoolUploadId&poolRoleId` (SELECTED_ROLE_COVERAGE_V1) | `useSelectedRoleCoverage`, unverändert |
| M-08 | Bindung | `comparison.binding.analysisId`, `jobPoolUploadId`, `poolRoleId`, `discoveryRunId`, `convergenceRunId`, `investigationScopeHash` | M-07 | Gleichheit nach §05 L-1 bis L-4 |
| M-09 | Anforderung | `requirements[].poolRequirementId`, `capabilityName`, `necessityState`, `requiredLevel` (Pool-Reihenfolge) | M-07 | — |
| M-10 | Abdeckung | `requirements[].coverage.state`, `.proposal.capabilityProposalId`, `.name`, `.matchBasis`, `.matchedConstituent` | M-07 | Join auf M-06 über `id` |
| M-11 | Zitat | `coverage.proposal.evidence[]{docId, quote}` | M-07 | byte-gleich gegen M-06 `evidence[]{sourceDocumentId, exactQuote}` |
| M-12 | Relationszustand | `authority.capabilityRequirementRelationState` = NOT_EVALUATED und `authority.reason` | M-07 | immer sichtbar |
| M-13 | Zähler | `counts.requirements`, `counts.covered`, `counts.notCovered` | M-07 | nur als ganze Zahlen |
| M-14 | Fokus Vorschlag ↔ Anforderung | `proposals[].coversPoolRequirementIds` | M-07 | nur Hervorhebung, keine Auswahl |

Nie gelesen bzw. nie angezeigt:
- aus M-02: `matching` (Demo-Pool), `recommendations`, `reactFlowGraph`, `analysis.report_markdown` und `capabilityProposalProjection.relations`;
- `/api/career/job-pools/{id}/matches`, `gemini-result` und `gemini-exchanges`.

## 03 — Wiederherstellung nach Reload

### 03.1 URL

- Meldet die Sitzung SUCCEEDED, schreibt G1 mit `replaceState`, wie die bestehenden Parameter, die `analysisId` und den deklarierten `investigationMode`.
  - Beide werden ersetzt, nie angehängt. Eine neue Analyse ersetzt die alte.
- Die Parameter des gewählten Jobs bleiben, wie sie sind; G1 schreibt sie nicht.
- Fokus und Hover schreiben nichts in die URL.

### 03.2 Ein Decoder, zwei Wege

- In der Sitzung decodiert `decodeAnalysisResult(body, requestedAnalysisId)` den Body, den der Controller schon geladen hat (`job.state.canonicalAnalysis`).
- Nach einem Reload liest ein neuer Hook `useAnalysisResult(analysisId)` dieselbe Route mit GET und `no-store`, gebunden an den Schlüssel `analysisId`.
  - Wechselt die Analyse, bricht er den laufenden Lesevorgang ab und verwirft eine späte Antwort.
- Hat die Sitzung ein eigenes Ergebnis, liest der Hook nicht. Das Ergebnis der Sitzung hat Vorrang (M-01).
- **Der Decoder akzeptiert nur:**
  - `success === true`, `status === "VERIFIED"`;
  - `analysisId` und `metadata.analysis_id` gleich der angefragten ID;
  - `analysis.structured_data.analysis` ist ein Objekt;
  - `capabilityProposalProjection` ist `null` oder hat genau die festen Zustände aus `lib/career/capability-core/projection/reader.ts:6-22`. Jede Fähigkeit hat dann `id`, `name`, `scope` ATOMIC oder COMPOSITE und `evidence[]` mit `verificationState: SOURCE_MATCH_VERIFIED`.

  Alles andere ist FAILED, nie ein teilweiser Erfolg.
- Danach laufen beide Wege durch dieselben Adapter, also `adaptCanonicalToDemoState` und `applyCapabilityProposalProjectionToDemoState`.
- **Pflicht:** Aus demselben Body entsteht in der Sitzung und nach dem Reload dasselbe View Model (T-02).

### 03.3 Kette

```
analysisId (M-01)
 → PERSISTED_RESULT: GET /api/career/analyses/{id}          → decodeAnalysisResult        (§04: RESULT_*)
 → BOUNDARY:         GET /api/career/analyses/{id}/investigation → useAnalysisBoundary    (§04: BOUNDARY_*, MODE_MISMATCH, ROLE_MISMATCH)
 → SOURCE_IDENTITY:  documents[] ↔ evidence.sourceDocumentId ↔ coverage.evidence.docId   (§07)
 → B2_RELATIONS:     GET …/job-comparison (nur wenn Grenze = PERSON_X_JOB und Auswahl = gewählter Job) (§04: COVERAGE_*, LINEAGE_MISMATCH)
 → PROJECTION:       pure Funktion projectPxjFirstScreen(…) → geschlossene Union (§04) → Rendern
```

### 03.4 Grenzen

- **Modus:** Gilt der Modus in der URL bzw. Oberfläche nicht für die persistierte Grenze, zeigt der erste Bildschirm MODE_MISMATCH.
  - Er nennt den Modus, in dem die Analyse lief, und bietet einen ausdrücklichen Schalter an. Er schaltet nicht selbst um.
  - Das betrifft auch O-PXJ-PERSONLINK: Ein PERSON-Deep-Link ohne `investigationMode` landet heute im Standardmodus PERSON_X_JOB.
- **Rolle:** Unterscheidet sich die persistierte `jobScopeSelection` vom gewählten Job, zeigt der erste Bildschirm ROLE_MISMATCH. Das gilt in der Sitzung genauso wie nach einem Reload.
  - Er zeigt dann **weder Vorschläge noch Abdeckung** dieser Analyse, denn die Vorschläge entstanden unter dem Scope der anderen Rolle.
  - Er nennt die Rolle der Analyse und bietet als ausdrückliche Aktion „diese Rolle wählen“ an.
  - Das ändert das heutige Verhalten in der Sitzung: Heute bleiben die Vorschläge stehen, wenn danach ein anderer Job gewählt wird. Das ist so gewollt, nach Q2 „no cross-role contamination“.
- **Kein Job gewählt:** Fehlt nach einem Reload der gewählte Job, bleibt das Capability Gate unter PERSON × JOB zu, wie bisher. G1 wählt keinen Job automatisch, denn Fokus ist keine Auswahl. Das Job Field nennt die Rolle der Analyse als Angebot zur ausdrücklichen Auswahl.

## 04 — Geschlossene Zustände des ersten Bildschirms (PERSON × JOB)

Jeder Zustand hat eine sichtbare Aussage unter `pxj-first-state` mit `data-state`. Keiner fällt auf eine andere Quelle zurück, und keiner zeigt ein leeres Feld, als wäre das ein Ergebnis.

| Zustand | Wann | Bildschirm |
|---|---|---|
| NO_ANALYSIS | keine `analysisId` | Grundzustand wie heute (ehrlich leer) |
| RESULT_LOADING | M-02 läuft | Ladeaussage |
| RESULT_NOT_FOUND | 404 `ERR_ANALYSIS_NOT_FOUND` | „Analyse <id> nicht gefunden“, kein Ergebnis, keine Demo-Daten |
| RESULT_FAILED | anderer Status oder Decoder lehnt ab | Aussage mit Code, kein Ergebnis |
| BOUNDARY_RESOLVING · BOUNDARY_UNRESOLVED · BOUNDARY_NOT_FOUND · BOUNDARY_FAILED | M-03 | Aussage, keine Vorschläge und keine Abdeckung |
| MODE_MISMATCH | Modus ≠ persistierter Modus | §03.4 |
| ROLE_MISMATCH | Auswahl ≠ persistierte Auswahl | §03.4 |
| NO_PROJECTION | `capabilityProposalProjection === null` | „Diese Analyse hat keine Fähigkeitsvorschläge“; keine Abdeckung |
| COVERAGE_LOADING, COVERAGE_NOT_SCOPED, COVERAGE_SCOPE_MISMATCH, COVERAGE_SCOPE_DRIFT, COVERAGE_SCOPE_UNAVAILABLE, COVERAGE_LINEAGE_INVALID, COVERAGE_NOT_FOUND, COVERAGE_NOT_PROVISIONED, COVERAGE_FAILED | Zustand von `useSelectedRoleCoverage` | Vorschläge sichtbar, an Stelle der Abdeckung die Aussage zum Zustand |
| LINEAGE_MISMATCH | eine Prüfung aus §05 L-1 bis L-4 schlägt fehl | Vorschläge sichtbar, keine Abdeckung, Aussage mit der Prüfung, die fehlschlug |
| AVAILABLE | alles bestanden | Vorschläge mit B2-Abdeckung |

Für eine PERSON-Analyse unter PERSON gilt der heutige erste Bildschirm unverändert, ergänzt nur um die Reload-Wiederherstellung (§03) und die Provenienz (§07).

## 05 — Nur B2 als Relationsquelle

Es gelten P-01 bis P-14 der Spezifikation `9d9f519`, §04; P-15 ist durch §03 ersetzt. Dazu kommen die Bindungsprüfungen im Client. Sie sind alle Pflicht; schlägt eine fehl, folgt LINEAGE_MISMATCH:
- **L-1:** `binding.analysisId` = Analyse in Sicht; `binding.jobPoolUploadId` und `binding.poolRoleId` = gewählter Job = persistierte `jobScopeSelection`. Das deckt `comparisonBelongsToSelection` ab, ergänzt um den Vergleich mit der Grenze.
- **L-2:** `binding.discoveryRunId` = `investigation.discoveryRunId`.
- **L-3:** `binding.investigationScopeHash` = `investigation.investigationScopeHash`.
- **L-4:** Die Folge der `proposals[].id` aus B2 ist gleich der Folge der `capabilityProposalProjection.capabilities[].id` aus M-02, als Menge und in der Reihenfolge.

Kanten gibt es nur von einer Anforderung zu dem Vorschlag, den B2 dafür liefert.
- Keine Kante zu Orbit 01 außer der Quellangabe eines Zitats.
- Keine Kopplung an `resonance-energy-paths` oder `inter-orbital-coupling` (`SemanticCareerIntelligenceField.tsx:981`, `:998`).

## 06 — Legacy unter PERSON × JOB

### 06.1 Erster Bildschirm (Q1)

| Orbit | Inhalt | Legt Matching oder Bewertung nahe? | unter PERSON × JOB |
|---|---|---|---|
| 01 IDENTITY CORE | Quelldokumente | nein, die Quelle ist Provenienz | **sichtbar**, nach §07 |
| 02 CAPABILITY FIELD | Projektion der Vorschläge | nein, das ist der Operand von B2 | **sichtbar** |
| 03 RESONANCE ORBITS | Organisationen aus dem Lebenslauf (Legacy) | ja, der Name „Resonanz“ | **ausgeblendet** |
| 04 ROLE MANIFESTATION | Rollen aus dem Lebenslauf mit `fitScore`, `matchedCapabilities`, `missingCapabilities` (`ui-adapter.ts:84-131`) | ja, eine Passungsbewertung | **ausgeblendet** |
| 05 TENSION FIELD | Projektion von Fähigkeitslücken | ja, eine Lückenbewertung | **ausgeblendet** |
| 06 EVOLUTION PATHS | Strategien mit `expectedImpact` | ja, eine Empfehlung | **ausgeblendet** |

Ausgeblendet heißt:
- kein Orbit, kein Zähler, keine HUD-Aktion, keine Kopplungslinie;
- kein Knoten im Decision Graph Inspector aus diesen Orbits;
- kein Text aus ihnen.

Unter PERSON bleibt alles wie heute. Die Aktion „VIEW MATCHES“ (`OrbitalResonanceBubble.tsx:455`) erscheint unter PERSON × JOB an keinem Orbit.

### 06.2 Rollenebene im Job Field (Q4): nur Offenlegung, Verhalten unverändert

- **Zusätzlich** steht an der Rollenebene unter PERSON × JOB eine Offenlegung (`syntx-legacy-disclosure`). Sie nennt:
  - die Quelle: Präsentations-Matching JOB_POOL_PRESENTATION_MATCHING_V1, zuerst die Legacy-Analyse **ohne Job-Scope**, die nicht deterministisch ist, danach Sweep-Vorschläge;
  - die Reichweite: der ganze Pool;
  - die Grenzen: Präsentation, keine Autorität, nicht B2, keine Relation Fähigkeit → Anforderung, keine Entscheidung.
- **Unverändert** bleiben Knotenzustände, Zahlen, Reihenfolge, Spuren, Apertur-Inhalte, Testids und `data-*`-Attribute. Nachgewiesen wird das mit T-11.
- In G1 wird kein Legacy-Wert zu einer B2-Abdeckung oder umgekehrt.

## 07 — Provenienz der Belege

- **Quellidentität:** Die `sourceDocumentId` eines Zitats muss auf `documents[].entity_id` aus M-02 zeigen.
  - Gibt es keinen Treffer, steht dort „source not resolved“, und das Zitat erscheint ohne Verifikationszeichen.
  - Der Titel kommt aus `documents[].identity.name`.
- **Kein erfundener Wert:**
  - Der Adapter setzt bei einem fehlenden Hash `HASH-<entity_id>` ein (`ui-adapter.ts:50`) und bei einem fehlenden Titel „Unknown Document“ (`:35`). Orbit 01 zeigt den Hash heute als Zweitinhalt (`orbit-focus-projection.ts:37`).
  - G1 zeigt einen `HASH-`-Platzhalter nie als Hash, sondern „hash not delivered“, und den Titel-Platzhalter nie als Titel, sondern „title not delivered“.
  - Das gilt in allen Modi, weil es eine Wahrheitsfrage ist: F-SRC-HASH. Die Werte im Adapter selbst bleiben, damit `lib/career/ui-adapter.ts` unberührt bleibt; korrigiert wird nur die Anzeige.
- **Zitate:** wörtlich (P-06). Neben jedem Zitat stehen der Quelltitel und „source-match verified · not a competence verification“ (P-07).
- **Spannen und Hashes des Quellbündels** gibt es nur über den Inspector und nicht auf dem ersten Bildschirm. G1 erfindet keinen Ersatz dafür.

## 08 — Dateien

**Erlaubt**
- `app/components/career/demo/SemanticCareerIntelligenceField.tsx`
- `app/components/career/demo/SyntxField.tsx`, nur §06.2, also die zusätzliche Offenlegung
- neue Komponenten unter `app/components/career/demo/`
- neu `lib/career/view-model/pxj-first-screen.ts`: `projectPxjFirstScreen` und `decodeAnalysisResult`, beide pur, ohne Fetch und ohne React
- neu `lib/career/ui/useAnalysisResult.ts`: Lese-Hook, nur GET
- `lib/career/view-model/orbit-focus-projection.ts`, nur die Anzeige von Quell-Hash und Titel (§07)
- `lib/career/view-model/sil-language.ts`, nur Texte in Deutsch und Englisch
- neue Tests unter `test/career/pxj-first-screen/`

**Nicht erlaubt**
- `app/api/**`
- `lib/career/job-pool/*`, `lib/career/job-scope/*`, `lib/career/capability-core/*`, `lib/career/investigation/*`, `lib/career/result-inspector/*`
- `lib/career/ui/useRoleInvestigation.ts`, `lib/career/ui/career-job-controller.ts`, `lib/career/ui-adapter.ts`
- `test/job-pool-validation/*` (PINK)
- Konfiguration, Migrationen, Labor-Skripte

Braucht die Umsetzung etwas außerhalb dieser Liste, hält GRÜN an und meldet das an GELB und den Owner (§12).

## 09 — Deterministische Tests (GRÜN, `npm run test:isolated`)

- **T-01 · Decoder:** `decodeAnalysisResult` akzeptiert den Vertragsbody. Abgelehnt wird je einzeln:
  - ein fehlendes oder falsches Feld aus §03.2;
  - eine fremde `analysisId`;
  - eine fremde `metadata.analysis_id`;
  - ein Status ungleich VERIFIED;
  - ein Projektionszustand ungleich den festen Werten;
  - ein Zitat ohne SOURCE_MATCH_VERIFIED.
- **T-02 · Ein Weg:** Derselbe Body führt in der Sitzung und nach einem Reload zu einem tiefengleichen View Model.
- **T-03 · Zustände:** Jeder Zustand aus §04 entsteht über Fetcher-Stubs und wird per SSR mit Testid und Aussage gerendert. Ein Fetch-Spion zeigt dabei 0 Aufrufe von `/matches`, `gemini-result` und `gemini-exchanges` und 0 Aufrufe außer GET.
- **T-04 · Bindung:**
  - Wechseln Analyse, Rolle oder Modus, wird verworfen; eine späte Antwort bleibt unsichtbar.
  - ROLE_MISMATCH zeigt keine Vorschläge, auch nicht in der Sitzung.
  - MODE_MISMATCH schaltet nicht selbst um.
- **T-05 · Abstammung:** L-1 bis L-4 werden einzeln verletzt; jedes Mal folgt LINEAGE_MISMATCH.
- **T-06 · Zitat-Join:**
  - Byte-gleich: verifiziert.
  - Abweichung in einem Byte, Leerzeichen oder Unicode-Form: `data-quote-in-projection="false"`, ohne Verifikationszeichen.
  - Ein unbekannter `capabilityProposalId`: „proposal not in this projection“.
- **T-07 · Legacy:** Unter PERSON × JOB gibt es keine Testids von Orbit 03 bis 06, keine Legacy-Namen im Markup und keine Knoten im Inspector aus diesen Orbits. Unter PERSON ist das SSR-Markup der Orbits gleich der Basis `49e2bc6`, ausgenommen §07.
- **T-08 · Keine Zahl:** Das Markup unter PERSON × JOB wird ohne Zitatknoten durchsucht: kein `%`, kein score, rank, resonance, fit, match, confidence, contribution, Eignung oder passt. Zahlen kommen nur aus `counts`, als ganze Zahlen.
- **T-09 · URL:**
  - SUCCEEDED schreibt `analysisId` und `investigationMode`.
  - Eine neue Analyse ersetzt beide.
  - Fokus und Hover ändern weder die Parameter des Jobs noch den Modus noch die `analysisId`.
- **T-10 · Platzhalter:** Weder `HASH-` noch „Unknown Document“ wird gerendert.
- **T-11 · Rollenebene unverändert:** Die `data-*`-Attribute und Testids von `syntx-requirement-*`, `syntx-trace-*`, `syntx-open-*` und `syntx-source-*` sind für ein festes `/matches`-Fixture gleich der Basis `49e2bc6`. Neu ist nur `syntx-legacy-disclosure`, mit Pflichttext.
- **T-12 · Gesamt:** `tsc` ohne neue Fehler; bekannt ist nur `relay-check.mts(13,214)`. Die ganze isolierte Suite ist grün, und die Testids der Basis bleiben unverändert.

**Fixtures:** synthetisch und nach Vertrag gebaut: B2 aus `test/career/three-modes/fixtures.ts`, das Ergebnis neu. Ohne Rohtext von Gemini und ohne echte Personendaten. Echte Bodies aus :41862 werden nicht eingecheckt.

## 10 — Validierung

**Stufe 1** (Q3: vorhandene persistierte Testdaten oder deterministisches Fixture), ohne Gemini:
- **1a:** T-01 bis T-12.
- **1b, persistierte Daten aus :41862:** PINK liest mit GET `GET /api/career/analyses/ANL_1792628993472_10`, `/investigation` und B2 der Rolle `role_kestrel_fullstack`.
  - Diese Bodies speist PINK lokal in `decodeAnalysisResult` und `projectPxjFirstScreen` aus GRÜNs Branch.
  - Erwartet wird AVAILABLE mit 8 von 9 abgedeckt, 9 Zeilen in Pool-Reihenfolge, L-1 bis L-4 bestanden und 8 Zitate byte-gleich, alle mit aufgelöster Quelle `DOC_001`. GELB hat das am 2026-10-22 auf den privaten Lesekopien vorab nachgerechnet.
  - Mit der PERSON-Analyse `ANL_1792628831636_456` unter PERSON × JOB wird MODE_MISMATCH bzw. COVERAGE_NOT_SCOPED erwartet.
  - Dabei wird nichts gestartet, und das Labor bleibt unverändert. GRÜNs Code läuft nicht gegen die Labor-Datenbank.
- **1c, Browser:** in GRÜNs eigenem Labor mit dem deterministischen Loopback-Stand-in:
  - ANALYZE unter PERSON × JOB, dann der erste Bildschirm mit Abdeckung;
  - ein Reload muss dasselbe zeigen;
  - Rolle wechseln: ROLE_MISMATCH; zurück: AVAILABLE;
  - PERSON-Deep-Link: MODE_MISMATCH;
  - unbekannte `analysisId`: RESULT_NOT_FOUND.

**Kennzeichnung des Stand-ins:**
- Jeder Beleg aus 1c trägt `STANDIN` im Dateinamen und `"gemini": "STAND_IN"` im Datensatz.
- Aufnahmen tragen eine sichtbare Markierung im Bild oder in der Bildunterschrift: „STAND-IN · keine Modellausführung“.
- Kein Bericht nennt ein Stand-in-Ergebnis „Gemini“, „live“ oder „Modellausgabe“.

**Stufe 2** (echtes Gemini) nur nach einem eigenen GO des Owners: ein frisches Labor, Budget nach GO, derselbe Ablauf wie 1c, und die Prüfung durch PINK über das Lesetor.

## 11 — Abnahmekriterien für PINK

- **PA-01:** Die Abbildung M-01 bis M-14 stimmt: Feld für Feld aus Fixture und aus :41862 (1b).
- **PA-02:** Die Wiederherstellung funktioniert: Nach einem Reload ist der Zustand gleich dem in der Sitzung (T-02 und Walk 1c).
- **PA-03:** Kein leerer Zustand, wo ein Ergebnis rekonstruierbar ist, und kein erfundenes Ergebnis, wo keines persistiert ist (RESULT_NOT_FOUND und NO_PROJECTION).
- **PA-04:** Es gibt nur B2: 0 Lesevorgänge von `/matches`, `gemini-*` und Legacy-Feldern als Relationsquelle; L-1 bis L-4 werden geprüft.
- **PA-05:** Kein Legacy-Score und keine neue Zahl (T-08). Die Orbits 03 bis 06 sind unter PERSON × JOB ausgeblendet, unter PERSON unverändert (T-07).
- **PA-06:** Die Grenzen halten: ROLE_MISMATCH ohne Vorschläge, MODE_MISMATCH ohne Umschalten, keine Vermischung über Sitzungen oder Rollen (T-04).
- **PA-07:** Die Provenienz stimmt: Zitate byte-gleich, Quelle aufgelöst oder ausdrücklich nicht aufgelöst, keine Platzhalter (T-06, T-10).
- **PA-08:** Alle Zustände aus §04 sind sichtbar, und keiner springt auf eine andere Quelle über (T-03).
- **PA-09:** Pflichttexte und Wortverbote halten, auf Deutsch und Englisch (P-07).
- **PA-10:** Die Rollenebene ist unverändert; neu ist nur die Offenlegung (T-11).
- **PA-11:** Fokus ist keine Auswahl (T-09).
- **PA-12:** Der Stand-in ist überall als solcher gekennzeichnet (§10).
- **PA-13:** Gemeinsame Datenbank, Labor :41862 und Backend sind unberührt. Alle Dateien liegen in der Liste aus §08.
- **PA-14:** T-12 ist grün, nachgerechnet auf PINKs eigener Wegwerf-Datenbank.

## 12 — Anhalten und Lieferung

- **Anhalten und an GELB und Owner melden**, wenn:
  - ein Vertragsfeld fehlt;
  - ein Zustand nicht ohne Backend unterscheidbar ist;
  - eine Datei außerhalb von §08 nötig wäre;
  - ein Test nur mit einem Ersatz durch eine andere Quelle grün würde.
- **Lieferung:** Branch-Spitze, die Liste der Tests mit Ergebnis, die Belege aus 1c (gekennzeichnet) und eine Liste der Abweichungen von dieser Abbildung.
- Kein Merge.
