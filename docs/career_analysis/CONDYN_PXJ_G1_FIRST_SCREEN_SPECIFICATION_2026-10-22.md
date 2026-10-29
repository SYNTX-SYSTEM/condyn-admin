# PERSON × JOB — G1: Relation auf dem ersten Bildschirm (Spezifikation, 2026-10-22)

Owner-Auftrag „SYNTX::SFE::OWNER_DECISION_PXJ_E2E“ (Lane GELB, STATE E2E_REVIEW). Grundlage ist die Feldvalidierung `CONDYN_PERSON_JOB_E2E_FIELD_VALIDATION_2026-10-22.md` (§10, G-1 bis G-6).

Dieses Dokument spezifiziert nur. Es gibt keine Implementierung, keine Backend-Änderung, keine Integration und keinen Gemini-Aufruf. Labor :41862 bleibt unverändert für die Owner-Abnahme erhalten.

Codestand der Rekonstruktion: `49e2bc6`. Alle Zeilenangaben beziehen sich auf diesen Stand.

## 00 — Owner-Entscheidungen (wörtlich)

| Schlüssel | Entscheidung |
|---|---|
| FIRST_SCREEN | CAPABILITY_FIELD_IMMEDIATELY_AFTER_ANALYSIS |
| PRIMARY_RELATION_SOURCE | B2_UNSCORED_REQUIREMENT_COVERAGE |
| LEGACY_MATCHING | SEPARATE_NON_AUTHORITATIVE_PRESENTATION |
| LEGACY_SCORES_ON_FIRST_SCREEN | FORBIDDEN |
| G1 | PREPARE_SEPARATE_FRONTEND_IMPLEMENTATION_SPECIFICATION |
| PINK_EVIDENCE_ACCESS | AUTHORIZED_READ_ONLY_MINIMUM_SCOPE |
| LAB_41862 | PRESERVE_FOR_OWNER_REVIEW |
| ADDITIONAL_GEMINI_CALLS | FORBIDDEN_WITHOUT_NEW_GO |

Invarianten: COVERED ≠ VERIFIED_COMPETENCE · QUOTE_VERIFIED ≠ CAPABILITY_VERIFIED · B2 ≠ LEGACY · FOCUS ≠ SELECTION · RELATION ≠ HIRING_DECISION · NO_NEW_SCORE · NO_SYNTHETIC_RELATION · NO_HIDDEN_SOURCE_SUBSTITUTION · NO_BACKEND_MUTATION · NO_INTEGRATION.

## 01 — Rekonstruktion der Kette

### 01.1 PERSON CAPABILITY PROPOSAL

- Nach ANALYZE lädt der Controller das Ergebnis genau einmal: `lib/career/ui/career-job-controller.ts:183` ruft `fetchCanonicalResult(resultAnalysisId)` auf, also `GET /api/career/analyses/{analysisId}`.
- Die Route liefert unter anderem `capabilityProposalProjection` (`app/api/career/analyses/[analysisId]/route.ts:55-67`). Der Typ steht in `lib/career/capability-core/projection/reader.ts:6-22`:
  - Zustände fest: `PROPOSED` / `EVIDENCE_PASSED` / `NOT_RUN` / `authorityState NONE`;
  - je Fähigkeit `id` (PCAP_…), `name`, `scope`, `evidence[]` mit `evidenceId`, `sourceDocumentId`, `exactQuote` und `verificationState: SOURCE_MATCH_VERIFIED`;
  - `relations[]`: vorgeschlagene Beziehungen zwischen Fähigkeiten, alle `PROPOSED`.
- Das Capability Field übernimmt davon nur `capabilities` (`lib/career/capability-proposal-sil-adapter.ts:9-31`, aufgerufen in `SemanticCareerIntelligenceField.tsx:436-455`). `relations` wird nirgends gelesen. Damit ist O-1 beantwortet: Die 7 vorgeschlagenen Beziehungen zwischen Fähigkeiten werden nicht angezeigt.

### 01.2 B2 REQUIREMENT COVERAGE

- Route: `GET /api/career/analyses/{analysisId}/job-comparison?jobPoolUploadId&poolRoleId` (`app/api/career/analyses/[analysisId]/job-comparison/route.ts`). Sie liest nur, ruft weder Gemini noch die Legacy-Analyse auf und vergleicht nicht über den ganzen Pool.
- Die Route prüft, dass die angefragte Auswahl die eigene Auswahl der Analyse ist, und belegt das über den Scope-Hash des Discovery-Runs (`resolveAnalysisJobScope`).
- Berechnung: `buildSelectedRoleCoverage` (`lib/career/job-pool/selected-role-coverage.ts:47-69`).
  - Operand ist dieselbe Projektion wie in 01.1, über denselben Reader.
  - Abgleich nur über Namen mit `findSweepCoverage`, Grundlage EXACT, ALIAS, COMPOSITE_CONSTITUENT oder TOKEN_CONTAINMENT; die letzte gilt als schwach.
  - Der Authority-Block ist fest: `scored: false`, `authorityState NONE`, `capabilityRequirementRelationState NOT_EVALUATED`, Grund `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT`.
- Frontend-Decoder `decodeSelectedRoleCoverage` und Anzeigewächter `comparisonBelongsToSelection` stehen in `lib/career/ui/useRoleInvestigation.ts:62-112` und `lib/career/result-inspector/client.ts:74-77`. Der Hook `useSelectedRoleCoverage` (`:207`) ist an den Schlüssel aus Analyse, Upload und Rolle gebunden.
- Heute nutzt nur das Job Field den Hook (`SyntxField.tsx:1994`, Fläche `CoverageBody` `:1663`). Das Capability Field liest B2 nicht.

### 01.3 SOURCE REFERENCES

| Ebene | Feld | Quelle | Prüfstatus |
|---|---|---|---|
| Projektion | `evidence[].exactQuote`, `sourceDocumentId`, `evidenceId` | Convergence-Lineage, nur Zitate mit `VERIFIED` | Zitat steht wörtlich im Dokument (SOURCE_MATCH_VERIFIED) |
| B2 | `coverage.proposal.evidence[]` = `{ docId, quote }` | dieselbe Projektion, ohne `evidenceId` | wie oben |
| Quelltitel | `activeData.sources[]` | Legacy-Adapter (`lib/career/ui-adapter.ts`), Join über `sourceDocumentId` | Titel aufgelöst, nicht verifiziert |
| Spannen und Hash des Quellbündels | `gemini-result` | nur über den Inspector, mit Token | nur für den Inspector sichtbar |

Ein Zitat belegt nur, dass der Satz im Dokument steht. Dass er die Fähigkeit trägt, prüft niemand (G-5). Das gilt für jede Projektion, also auch für G1.

### 01.4 FIRST_SCREEN_SEMIONTIC_PROJECTION (Stand heute)

Der erste Bildschirm ist das Capability Field mit sechs Orbits (`SemanticCareerIntelligenceField.tsx:536-621`). Belegt ist das durch die Walk-Aufnahme `shots/14-pxj-analysis-done-1920.jpg`, aufgenommen direkt nach ANALYZE in der Sitzung.

| Orbit | Anzeige | Datenquelle | im Lauf `ANL_…_10` |
|---|---|---|---|
| 01 IDENTITY CORE | Quellen | Legacy-Adapter | 1 |
| 02 CAPABILITY FIELD | Vorschläge | Projektion (01.1) | 8 |
| 03 RESONANCE ORBITS | „Inferred organisations (analysis) · not pool resonance“ | Legacy-Analyse, aus dem Lebenslauf gelesene Organisationen | 2 |
| 04 ROLE MANIFESTATION | Rollen aus dem Lebenslauf | Legacy-Analyse | 2 |
| 05 TENSION FIELD | — | leer per Code (`ui-adapter.ts:143`) | 0 |
| 06 EVOLUTION PATHS | Strategien | Legacy-Analyse | 0 |

Auf diesem Bildschirm gibt es keine Anforderung, keine Rolle aus dem Pool und keine Relation Fähigkeit → Anforderung. Das ist G-1.

## 02 — Befunde aus VERIFY (2026-10-22, nur lesend gegen :41862)

Sonde `scripts/capability-reload-probe.mjs.txt`, Ergebnis `capability-reload-probe.json`, Aufnahme `shots/q1-capability-reload-empty-1920.jpg`. Sie hat nur GET gesendet und nur im Client geklickt; es gab 0 Nicht-GET-Anfragen und keinen Gemini-Aufruf.

- **K-1 (Korrektur meines Berichts §09):** Die Aufnahme `shots/p1-first-screen-1920.jpg` zeigt nicht das Capability Field. Sie zeigt das Job Field ohne gewählten Pool, weil meine Sonde `focus=CAPABILITY` nicht gesetzt hatte und die App dann im Job Field startet (`SemanticCareerIntelligenceField.tsx:322`). Der Wert „requirementNodes 0“ in `first-screen-probe.json → first` stammt also vom falschen Bildschirm.
  - Der richtige Beleg für den ersten Bildschirm ist Walk-Aufnahme 14. Sie zeigt dasselbe Ergebnis, G-1 bleibt bestehen.
- **F-PXJ-RELOAD:** Ein Deep Link oder Reload mit `analysisId=ANL_…_10&focus=CAPABILITY` füllt das Capability Field nicht. Alle sechs Orbits zeigen „0 items“, und gelesen werden nur `/investigation` und die Pool-Routen.
  - Ursache: `activeData` wird nur aus dem Ergebnis der laufenden Sitzung gesetzt (`:436`). Die URL-`analysisId` bestimmt die Untersuchungsgrenze, lädt aber kein Ergebnis.
  - Folge: Der erste Bildschirm existiert nur in der Sitzung, in der analysiert wurde. In :41862 lässt er sich ohne neues ANALYZE, also ohne neue Gemini-Aufrufe, nicht wieder herstellen. Eine leere Anzeige ohne Hinweis ist dabei kein Fehlerzustand, sie sieht aus wie „keine Ergebnisse“.
- **F-LEG-DORMANT:** `lib/career/view-model/cluster-presentation.ts:46-54,87` formatiert für die Orbits 03 und 04 `fitScore` als Prozentwert.
  - Die Fläche `subspace-cluster` wird nur bei Zoom ≥ 1 ohne Orbit-Fokus gerendert (`SemanticCareerIntelligenceField.tsx:1195`). Über die normale Bedienung ist sie praktisch nicht erreichbar; die Orbit-Kosmosansicht (`orbit-focus-projection.ts:48-57`) zeigt keinen `fitScore`.
  - In der Sonde gab es in L0 und in den Orbits 02, 03 und 04 keine Treffer für Score-, Rang- oder Prozentwerte.
  - Es bleibt ein schlafender Pfad, auf dem Legacy-Werte auf den ersten Bildschirm kämen. Gegen LEGACY_SCORES_ON_FIRST_SCREEN = FORBIDDEN ist er abzusichern (P-09).
- **F-DEMO-POOL:** `GET /api/career/analyses/{id}` berechnet zusätzlich `matching` gegen `DEMO_COMPANY_POOL` (`route.ts:51-52`). Das Frontend liest das Feld nicht. Es darf in G1 auch nicht gelesen werden (P-08).

## 03 — G1: Abhängigkeitskarte von der Quelle bis zum Bildschirm

```
PDF ── Discovery (Gemini, RUN_…) ── Validator (Zitat im Text) ── Convergence (CONV_…)
        │                                                          │
        │                                      persistierte Projektionsreferenz (ANL_ → RUN_/CONV_)
        │                                                          │
        │                     ┌────────────────────────────────────┴───────────────────┐
        │                     ▼                                                        ▼
        │       GET /api/career/analyses/{ANL}                    GET /api/career/analyses/{ANL}/job-comparison
        │       → capabilityProposalProjection                      ?jobPoolUploadId&poolRoleId
        │       (career-job-controller, einmal nach SUCCEEDED)      → buildSelectedRoleCoverage(binding, scope, projection)
        │                     │                                       ▲            ▲
        │                     ▼                                       │            │
        │       applyCapabilityProposalProjectionToDemoState     Pool-Datensatz   Scope-Hash des Discovery-Runs
        │       → activeData.capabilities[] (PCAP_…)             (Rolle, Revision)   (resolveAnalysisJobScope)
        │                     │                                       │
        │                     │                       readSelectedRoleCoverage → decodeSelectedRoleCoverage
        │                     │                       → comparisonBelongsToSelection → useSelectedRoleCoverage
        │                     │                                       │
        │                     └──────────── Join: capabilities[].id = coverage.proposal.capabilityProposalId
        │                                                 = proposals[].id; Zitat: (docId, quote) = (sourceDocumentId, exactQuote)
        │                                                             │
        └── activeData.sources[] (Titel zu docId) ───────────────────►▼
                                                      ERSTER BILDSCHIRM (Capability Field, PERSON × JOB)
```

| Bildschirmelement (G1) | Wert | Herkunft | Bedingung |
|---|---|---|---|
| Rolle (Titel, Organisation) | `coverage.role.title`, `organizationName` | B2 | B2 im Zustand AVAILABLE |
| Bindung | `binding.analysisId`, `jobPoolUploadId`, `poolRoleId`, `investigationScopeHash`, `discoveryRunId`, `convergenceRunId` | B2 | gleich der Analyse in der Sitzung und dem gewählten Job |
| Anforderung (Pool-Reihenfolge) | `requirements[].poolRequirementId`, `capabilityName`, `necessityState`, `requiredLevel` | B2, aus dem Pool deklariert | — |
| Abdeckungszustand | `coverage.state` COVERED oder NOT_COVERED | B2 | — |
| Abgleichsgrundlage | `coverage.proposal.matchBasis`, `matchedConstituent` | B2 | TOKEN_CONTAINMENT als schwach kennzeichnen |
| Abdeckender Vorschlag | `coverage.proposal.capabilityProposalId`, `name` | B2, gejoint auf `activeData.capabilities[].id` | Join exakt, sonst P-05 |
| Zitat | `coverage.proposal.evidence[].quote`, `docId` | B2, gegen `capabilities[].evidence[]` geprüft | byte-gleich, sonst P-06 |
| Quelltitel | `sources[].sourceTitle` zu `docId` | Legacy-Adapter | nur der Titel, keine Bewertung |
| Relationszustand | `authority.capabilityRequirementRelationState` = NOT_EVALUATED und `reason` | B2, fest | immer sichtbar |
| Zähler | `counts.covered`, `counts.notCovered`, `counts.requirements` | B2 | nur als ganze Zahlen (P-10) |
| Fokus Vorschlag ↔ Anforderungen | `proposals[].coversPoolRequirementIds` | B2 | Fokus nur als Hervorhebung (P-12) |

Das Capability Field braucht keine neue Route und keine Backend-Funktion. Alles liegt über die beiden bestehenden GET-Routen vor.

## 04 — Lesender Projektionsvertrag (Frontend)

Jede Regel ist bindend. Abweichungen brauchen eine Owner-Entscheidung.

- **P-01 · Bedingung:** Die B2-Projektion erscheint auf dem ersten Bildschirm nur, wenn alles zugleich gilt:
  - das aktive Feld ist CAPABILITY;
  - der Modus ist PERSON_X_JOB;
  - die Analyse in Sicht ist das Ergebnis dieser Sitzung (`job.state.resultAnalysisId`), und ihre Projektion ist geladen;
  - ihre Untersuchungsgrenze ist RESOLVED mit dem Modus PERSON_X_JOB;
  - der gewählte Job ist VALID.

  Fehlt eine Bedingung, wird B2 nicht gelesen. Bei einer PERSON-Analyse erscheint keine Abdeckung.
- **P-02 · Eine Quelle:** Gelesen wird genau einmal, und zwar mit dem bestehenden `useSelectedRoleCoverage(analysisId, jobScope)`.
  - Kein neuer Fetcher und kein zweiter Decoder.
  - Das Capability Field liest weder `/api/career/job-pools/{id}/matches` noch `gemini-result`, `gemini-exchanges` oder ein Legacy-Feld als Relationsquelle.
- **P-03 · Keine Mutation:** Nur `GET` mit `cache: "no-store"`. Kein POST, kein Analyze, kein Upload, keine Änderung an `lib/` oder `app/api/`.
- **P-04 · Bindung:** Angezeigt wird nur, solange `comparisonBelongsToSelection` für die aktuelle Analyse und den aktuellen Job wahr ist.
  - Wechselt die Analyse, der Job oder der Modus, wird die Anzeige sofort verworfen; späte Antworten werden ignoriert. Der bestehende Hook leistet das.
  - Auf dem Bildschirm steht die Bindung: Rolle, Organisation und Analyse-ID, mindestens gekürzt.
- **P-05 · Join ohne Raten:** Ein abdeckender Vorschlag wird nur über die ID verknüpft: `capabilityProposalId` = `activeData.capabilities[].id`.
  - Findet sich keine ID, gilt die Zeile als „proposal not in this projection“ und als Abweichung. Es gibt keinen Join über den Namen und keinen über Ähnlichkeit.
- **P-06 · Zitat byte-gleich:** Ein Zitat erscheint als verifizierte Quelle nur, wenn `(docId, quote)` byte-gleich in `evidence[]` desselben Vorschlags steht.
  - Sonst steht dort „quote not in projection“, ohne Verifikationszeichen.
  - Das Zitat wird wörtlich gezeigt, nicht gekürzt umformuliert. Kürzen ist nur mit einer sichtbaren Ellipse erlaubt.
- **P-07 · Pflichttexte:** Wo eine Abdeckung sichtbar ist, steht diese Grenzaussage dauerhaft daneben, nicht nur beim Hover:
  - Name coverage by a capability proposal · not scored · relation NOT_EVALUATED · not a competence verification · not a hiring decision.
  - Deutsch: Namensabdeckung durch einen Fähigkeitsvorschlag · nicht bewertet · Relation NICHT BEWERTET · keine Kompetenzprüfung · keine Einstellungsentscheidung.

  Wortlaut und Lokalisierung legt GRÜN in `sil-language.ts` fest; die fünf Aussagen sind Pflicht. Begriffe wie „match“, „fit“, „qualified“, „verified skill“, „Eignung“ oder „passt“ sind verboten.
- **P-08 · Kein Legacy, keine Score-Werte:** Im Capability Field unter PERSON × JOB erscheinen keine Legacy-Werte, also weder `fitScore`, `confidence`, `evidenceConfidence`, CONTRIBUTION, RESONANCE %, RANK # noch SCORED. Gilt auch für `matching` und `recommendations` aus `GET /api/career/analyses/{id}`.
- **P-09 · Schlafender Pfad:** Der `fitScore`-Pfad in `cluster-presentation.ts` (F-LEG-DORMANT) bleibt im Capability Field unter PERSON × JOB ausgeschlossen. GRÜN legt das mit einem Test fest; dafür ist keine Änderung an der Bedeutung des Codes nötig.
- **P-10 · Keine neue Zahl:** Erlaubt sind nur die gelieferten ganzen Zähler, etwa „8 covered · 1 not covered · 9 requirements“.
  - Verboten sind Prozent, Quote, Verhältnisbalken, proportional gefüllte Ringe, Farb- oder Größenabstufung nach Zahl oder Gewicht und eine Sortierung nach Abdeckung. Die Reihenfolge ist die des Pools.
  - `weight` ist ein deklariertes Poolfeld. Es darf in einer Detailansicht neben der Anforderung stehen, aber nicht auf L0, nie summiert und nie als Gewichtung dargestellt.
- **P-11 · Schwach bleibt schwach:** TOKEN_CONTAINMENT erscheint als schwache Abdeckung, wie im Job Field (`SyntxField.tsx:1688`). NOT_COVERED erscheint ohne Urteil: kein Rot und kein „gap“, „fehlt“ oder „missing skill“.
- **P-12 · Fokus ist keine Auswahl:** Fokus oder Hover auf einen Vorschlag oder eine Anforderung hebt nur hervor.
  - Er ändert weder `jobScope`, `investigationMode` noch die URL-Parameter `jobScopePoolUploadId` und `jobScopeRoleId`, und er löst keinen Lesevorgang aus.
  - Die Auswahl ändert sich nur über die bestehenden ausdrücklichen Aktionen.
- **P-13 · Keine Relation erfinden:** Gezeigt werden nur Kanten Anforderung ↔ Vorschlag, die B2 liefert.
  - Keine Kanten zwischen Anforderungen und Legacy-Orbits (03, 04, 06).
  - Keine Anzeige von `projection.relations`, also der vorgeschlagenen Beziehungen zwischen Fähigkeiten: sie sind keine Relation Fähigkeit → Anforderung.
  - Kein visueller Pfad Person → Rolle als Ergebnis.
- **P-14 · Zustände sichtbar, kein Ersatz:** Jeder Zustand des Hooks hat eine eigene sichtbare Aussage: LOADING, NOT_SCOPED, SCOPE_MISMATCH, SCOPE_DRIFT, SCOPE_UNAVAILABLE, LINEAGE_INVALID, NOT_FOUND, NOT_PROVISIONED und FAILED mit Code.
  - In keinem Zustand springt `/matches`, die Rollenebene oder die Legacy-Analyse ein (NO_HIDDEN_SOURCE_SUBSTITUTION).
- **P-15 · Kein halbes Bild:** Ist B2 AVAILABLE, die Projektion der Sitzung aber nicht geladen, etwa nach einem Reload (F-PXJ-RELOAD), zeigt der erste Bildschirm keine Abdeckung. Stattdessen sagt er, dass das Ergebnis nicht geladen ist. Ob ein Reload das Ergebnis wieder lädt, ist Owner-Frage Q-2.
- **P-16 · Bestehende Verträge unverändert:** Testids und Verhalten des Job Field, von `CoverageBody`, Capability Gate, Untersuchungsgrenze und URL-Grenze bleiben unverändert.

## 05 — Umgang mit widersprüchlichen Relationsquellen

| | B2 (SELECTED_ROLE_COVERAGE_V1) | Rollenebene (`/matches`, JOB_POOL_PRESENTATION_MATCHING_V1) |
|---|---|---|
| Operand | Projektion der Fähigkeitsvorschläge dieser Analyse, mit Scope | zuerst die Legacy-Analyse ohne Scope, nicht deterministisch (O-LIVE-3), danach Sweep-Vorschläge |
| Reichweite | genau die gewählte Rolle | der ganze Pool |
| Werte | `scored: false`, keine Zahlen | SCORED, CONTRIBUTION, CONFIDENCE, RESONANCE %, RANK # |
| Lauf `ANL_…_10` | 8 abgedeckt / 1 nicht | SUPPORTED 1 / WEAK 2 / SWEEP_ONLY 5 / OPEN 1 |
| Rolle laut Owner | **primäre Relationsquelle**, erster Bildschirm | **getrennte, nicht autoritative Präsentation** |

Regeln:
- **R-1:** Der erste Bildschirm hat genau eine Relationsquelle, B2. Die Rollenebene erscheint dort weder ganz noch in Teilen, auch nicht als Zusatz („also SUPPORTED by legacy“).
- **R-2:** Die beiden Quellen werden nie zusammengeführt, verrechnet, gegeneinander sortiert oder als eine Zahl gezeigt.
- **R-3:** Fällt B2 aus, ersetzt die Rollenebene es nicht (P-14).
- **R-4:** Der Unterschied wird nicht versteckt. Wo beide für dieselbe Rolle sichtbar sind, also im Job Field, muss die Rollenebene ihre Quelle nennen: „legacy analysis (unscoped) + sweep · presentation“.
  - Heute nennt sie „presentation matching“, aber nicht, dass die Legacy-Analyse ohne Scope zuerst kommt.
  - Die Knotenzustände mischen Legacy und Sweep in einer Skala (SUPPORTED, WEAK, SWEEP_ONLY, OPEN).
  - **C-LEG-1:** Ob die Rollenebene damit schon „SEPARATE_NON_AUTHORITATIVE“ ist, entscheidet der Owner (Q-4). Das gehört nicht zu G1.
- **R-5:** Die Legacy-Orbits 03, 04 und 06 des ersten Bildschirms stammen aus der Legacy-Analyse. Es sind Organisationen und Rollen aus dem Lebenslauf, keine Treffer im Pool.
  - Sie bleiben getrennt von der B2-Projektion: keine gemeinsame Kante, keine gemeinsame Farbe für „Relation“ und keine gemeinsame Zählung.
  - Ob sie unter PERSON × JOB sichtbar bleiben, ist Owner-Frage Q-1.

## 06 — PINK: Zugang zu den Belegen (Spezifikation)

Der Owner hat lesenden Zugang im minimalen Umfang freigegeben. Dieser Abschnitt legt den Umfang fest. **Aktiviert wird nichts, bevor der Owner diese Spezifikation bestätigt.** Es ist ein neuer Sicherheitsmechanismus, und dafür gilt Human Authority.

- **E-1 · Kein Token an PINK:** Der Inspector-Token verlässt GELB nicht: keine Datei, kein Pfad, keine Nachricht, keine Umgebungsvariable.
- **E-2 · Lesetor:** GELB betreibt ein Lesetor als eigenen Prozess unter GELBs PID.
  - Es läuft außerhalb des Repositorys und lauscht nur auf `127.0.0.1`, auf einem eigenen Port, nicht auf :41862.
  - Es setzt den Header `x-condyn-result-inspector-token` selbst und entfernt einen vom Aufrufer gesendeten Header dieses Namens.
  - Die Antwort reicht es ohne `set-cookie` weiter.
  - Das Labor, sein Code und seine Konfiguration bleiben unverändert.
- **E-3 · Erlaubte Pfade:** Weitergeleitet werden nur genau vier GET-Pfade, sonst nichts:
  - `GET /api/career/analyses/ANL_1792628831636_456/gemini-result` (PERSON)
  - `GET /api/career/analyses/ANL_1792628993472_10/gemini-result` (PERSON × JOB)
  - `GET /api/career/jobs/JOB_1792628831636_456/gemini-exchanges`
  - `GET /api/career/jobs/JOB_1792628993472_10/gemini-exchanges`

  Abweichende Pfade, Query-Parameter oder Methoden beantwortet das Tor lokal mit 403 bzw. 405 und leitet sie nicht weiter. Die übrigen Routen erreicht PINK wie bisher direkt mit GET.
- **E-4 · Protokoll:** Das Tor protokolliert Zeit, Methode, Pfad, Status und Bytes, nie Inhalte. PINK bekommt eine Kopie des Protokolls.
- **E-5 · Laufzeit:** Das Tor läuft, bis der Owner die Abnahme von :41862 beendet oder den Zugang widerruft. Spätestens mit dem Stopp des Labors endet es, denn dann wird auch die Wegwerf-Datenbank gelöscht.
- **E-6 · Umgang mit Rohdaten:** Die Antworten enthalten Rohtext von Gemini und Textstellen aus dem synthetischen Lebenslauf.
  - PINK checkt davon nichts ein, weil das Repository öffentlich ist. Einchecken darf PINK nur IDs, Hashes, Zählungen und Urteile.
  - Rohdaten bleiben lokal mit Modus 0700/0600.
- **E-7 · Relay-Log:** `relay.jsonl` enthält nur Metadaten. Es liegt schon im Beleg und stammt von GELB, ist also keine unabhängige Quelle. PINK darf es zum Abgleich nutzen, aber nicht als Beweis für Punkt 5.
- **E-8 · Gemini ausgeschlossen:** Über das Tor ist kein Gemini-Aufruf möglich: Es gibt kein POST, und `/api/career/analyze` ist nicht freigeschaltet.

Damit schließbar: die Spannen und der Hash des Quellbündels (Punkte 2 und 8). Für Punkt 5 sieht PINK die serverseitig persistierte Antworthülle: `responseId`, `modelVersion`, `finishReason`, Token-Zählung und SHA-256 des Rohtexts gegen den archivierten Rohtext. Grenze dazu: V-1.

## 07 — Lücken der unabhängigen Prüfung

- **V-1 · Echte Modellausführung:** Auch mit dem Lesetor sieht PINK nur, was das System selbst persistiert hat. Einen Beleg auf Seiten von Google gibt es nur in der Nutzungs- oder Abrechnungsansicht des Google-Cloud-Projekts, und die sieht nur der Owner. Ohne sie bleibt Punkt 5 „vom System bezeugt“, nicht „extern bezeugt“.
- **V-2 · Erster Bildschirm nicht wiederholbar:** Nach F-PXJ-RELOAD kann PINK den ersten Bildschirm in :41862 nicht selbst sehen. Dafür bräuchte es ein neues ANALYZE mit 3 Gemini-Aufrufen, also ein neues GO. Bis dahin ist der einzige Beleg die Walk-Aufnahme 14, und die stammt von GELB.
- **V-3 · Zitat trägt Fähigkeit:** Das prüft niemand, weder Validator noch B2, GELB oder PINK. Es ist eine Grenze des Vertrags (G-5), kein Prüfversäumnis. Für G1 heißt das: P-07 ist Pflicht.
- **V-4 · Legacy und Convergence roh:** Nur Discovery ist als Rohtext archiviert (G-6). `gemini-exchanges` hilft nur, soweit die Archivierung im Labor eingeschaltet war; das prüft PINK über das Tor.
- **V-5 · Nicht deterministisch:** Die PERSON-Analyse ohne Scope und die Legacy-Analyse variieren zwischen Läufen (O-LIVE-3). Unabhängig wiederholbar sind nur die lesenden Ableitungen B2 und Hashes, nicht die Modellausgabe.
- **V-6 · G1 mit echten Daten:** Eine G1-Umsetzung lässt sich in :41862 nicht prüfen, denn das Labor bleibt auf `49e2bc6` und unverändert. Es gibt zwei Wege:
  - echte Daten in einem neuen Labor, mit neuem GO für Gemini;
  - oder ein Stand-in-Labor, was der Owner ausdrücklich zulassen muss.

  Das ist Owner-Frage Q-3.
- **V-7 · Name zirkulär:** Unter Scope übernimmt Gemini die Anforderungsnamen (O-PXJ-NAME). 8 von 8 Abdeckungen sind deshalb EXACT. B2 bestätigt in diesem Fall vor allem, dass der Scope gewirkt hat. P-07 und V-3 müssen das tragen.

## 08 — Übergabe an GRÜN (G1)

Eine Umsetzung braucht einen **eigenen Owner-Auftrag an GRÜN**. Diese Übergabe ist die Vorlage dafür, keine Freigabe.

**Umfang**
- Im Capability Field unter PERSON × JOB direkt nach ANALYZE wird B2 der gewählten Rolle dargestellt, nach §03 und §04.
- Den Ort und die Gestalt im Feld wählt GRÜN in der bestehenden Bildsprache. Owner-Abnahme visuell.

**Dateien**
- Erlaubt: `app/components/career/demo/SemanticCareerIntelligenceField.tsx`, eine neue Präsentationskomponente unter `app/components/career/demo/`, `lib/career/view-model/sil-language.ts` (nur Texte), neue Tests unter `test/career/`.
- Nicht erlaubt: `lib/career/job-pool/*`, `lib/career/job-scope/*`, `lib/career/capability-core/*`, `lib/career/ui/useRoleInvestigation.ts` (nur nutzen), `app/api/**` und `test/job-pool-validation/*` (PINK).

**Wiederverwenden:** `useSelectedRoleCoverage`, `comparisonBelongsToSelection` und den Zustandssatz `SelectedRoleCoverageState`, unverändert.

**Testid-Vorschlag** (endgültig legt sie GRÜN fest; PINK prüft dagegen):
- `pxj-first-coverage` mit `data-coverage-state`, `data-scored="false"`, `data-relation-state="NOT_EVALUATED"`, `data-binding-analysis`, `data-binding-upload` und `data-binding-role`;
- `pxj-first-req-<poolRequirementId>` mit `data-coverage`, `data-match-basis` und `data-proposal-id`;
- `pxj-first-quote-<poolRequirementId>-<n>` mit `data-doc-id` und `data-quote-in-projection="true|false"`;
- `pxj-first-coverage-boundary` für die Pflichtaussage nach P-07.

**Abnahme durch GRÜN**, vor der Prüfung durch PINK:
- **A-01:** B2 auf dem Bildschirm ist feldgleich mit dem Server-Body: 9 von 9 Zeilen, Zustand, Grundlage, Vorschlags-ID und Zitate. Fixture: `test/career/three-modes/fixtures.ts` bzw. der echte B2-Body.
- **A-02:** Im Capability Field gibt es 0 Lesevorgänge von `/matches`, `gemini-result` und `gemini-exchanges` und 0 Anfragen außer GET.
- **A-03:** Kein Legacy-Wert, geprüft über Testids und Attribute, nicht über Text. Zitate dürfen „%“ enthalten, etwa „35% to 80%“.
- **A-04:** Alle Zustände nach P-14 werden mit Fetcher-Stubs gerendert, ohne Ersatz.
- **A-05:** Wechseln Rolle, Analyse oder Modus, verschwindet die Abdeckung sofort; eine späte Antwort bleibt unsichtbar.
- **A-06:** Fokus ändert weder URL, Job noch Modus (P-12).
- **A-07:** Eine PERSON-Analyse zeigt keine Abdeckung. Nach einem Reload gibt es kein halbes Bild (P-15).
- **A-08:** Pflichtaussagen und Wortverbote nach P-07 halten, auf Deutsch und Englisch.
- **A-09:** `tsc` ohne neue Fehler. Bekannt ist nur `relay-check.mts(13,214)`. `npm run test:isolated` ist grün, und alle bestehenden Testids sind unverändert.

**Verboten:** neue Scores oder Zahlen, eine synthetische Relation, ein Fallback auf Legacy oder `/matches`, Backend-Änderungen, Änderungen an :41862, neue Gemini-Aufrufe, Merge und Deployment.

**Basis:** Darüber entscheidet der Owner. Vorschlag: auf `49e2bc6`, wenn die Fokus-Lesbarkeit vorher integriert ist, sonst auf dem dann aktuellen Integrationsstand.

## 09 — Owner-Fragen

- **Q-1:** Sollen die Legacy-Orbits 03, 04 und 06 auf dem ersten Bildschirm unter PERSON × JOB sichtbar bleiben, getrennt nach R-5, oder ausgeblendet werden?
- **Q-2 (F-PXJ-RELOAD):** Soll ein Reload oder Deep Link das Ergebnis über die bestehende Route `GET /api/career/analyses/{id}` wieder laden, nur im Frontend? Das kann Teil von G1 sein oder ein eigener Auftrag. Ohne diese Änderung gilt P-15.
- **Q-3 (V-6):** Wie wird G1 mit echten Daten geprüft? Möglich sind ein neues GO für 3 Gemini-Aufrufe in einem frischen Labor oder ein ausdrücklich zugelassenes Stand-in-Labor.
- **Q-4 (C-LEG-1):** Erfüllt die Rollenebene des Job Field schon „SEPARATE_NON_AUTHORITATIVE_PRESENTATION“, oder braucht sie einen eigenen Auftrag mit Quellenkennzeichnung und getrennter Skala?
- **Q-5:** Bestätigen Sie das Lesetor für PINK nach §06? Erst danach starte ich es und gebe PINK den Port.

## 10 — Status

- Rekonstruiert, nachgezeichnet, spezifiziert und lesend geprüft. Einziger Laborkontakt: die Sonde aus §02 mit GET.
- Keine Implementierung, keine Backend-Änderung, kein Gemini-Aufruf, keine Integration.
- Labor :41862 läuft unverändert.
- STOP.

## 11 — Owner-Entscheidung G1 (2026-10-22, „SYNTX::SFE::OWNER_DECISION_G1“)

Die Architektur ist angenommen (ARCHITECTURE_SPECIFICATION_ACCEPTED). Die Fragen aus §09 sind beantwortet:

- **Q-1:** Legacy-Orbits werden unter PERSON × JOB ausgeblendet, wo sie ein Matching oder eine Bewertung nahelegen. B2 ist die einzige Quelle. Daraus folgt: 03, 04, 05 und 06 werden ausgeblendet (Auftrag §06.1).
- **Q-2:** Die Wiederherstellung nach einem Reload gehört zu G1. **P-15 ist damit ersetzt** durch Auftrag §03 und §04.
- **Q-3:** Stufe 1 mit vorhandenen persistierten Testdaten oder deterministischem Fixture; Stufe 2 mit echtem Gemini nur nach einem eigenen GO. Stand-in nie als Modellausführung.
- **Q-4:** Die Legacy-Rollendarstellung ist eine eigene, nicht autoritative Schicht. Quelle und Grenzen werden offengelegt, das Verhalten bleibt in G1 unverändert.
- **Q-5:** Das Lesetor ist nur unter Bedingungen freigegeben. Der Prüfbericht liegt in `CONDYN_PINK_INSPECTOR_READ_GATE_SECURITY_2026-10-22.md`; gestartet wird erst auf ein Wort des Owners.

Auftrag an GRÜN (Entwurf zur Freigabe): `CONDYN_PXJ_G1_GRUEN_ASSIGNMENT_2026-10-22.md`.
