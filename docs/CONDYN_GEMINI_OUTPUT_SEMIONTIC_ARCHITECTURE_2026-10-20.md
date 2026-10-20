# CONDYN — GEMINI OUTPUT: semiontische Ausgabearchitektur (SFE-Rekonstruktion, 2026-10-20)

**Auftrag:** Owner, „SYNTX::SFE::SEMIONTIC_OUTPUT_ARCHITECTURE“, 2026-10-20 (MODE = STRICT_SFE, IMPLEMENTATION = FORBIDDEN, INTEGRATION = FORBIDDEN).

**Rolle:** GELB, Architektur-Rekonstruktion. Dieses Dokument ist eine Spezifikation, keine Umsetzung. Es ändert keinen Code und keinen Test, ruft Gemini nicht auf, integriert nichts und deployt nichts. Danach ist STOP, bis der Owner ein ausdrückliches GO gibt.

**Untersuchter Stand:**
- `origin/integration/job-field-governance` auf `35f00bc`, der App-Code ist gleich `5293eb1` (VIDEO-FREEZE-Stand).
- Alle Zeilenangaben `datei:zeile` beziehen sich auf diesen Stand.

**Kennzeichnung**

| Marke | Bedeutung |
|---|---|
| **[OBSERVED]** | im Code oder in einem eingecheckten Beleg nachgewiesen, mit Fundstelle |
| **[DERIVED]** | aus beobachteten Fakten zwingend gefolgert, ohne neue Annahme |
| **[PROPOSED]** | Vorschlag dieses Dokuments; gilt erst nach Owner-GO |
| **[UNRESOLVED]** | aus dem Code nicht entscheidbar oder Owner-Entscheidung |

Testergebnisse werden hier **nicht** behauptet. §11 beschreibt Prüfungen, die noch niemand ausgeführt hat.

---

## 0. Kurzfassung

1. **[OBSERVED]** Wo GEMINI OUTPUT heute „technisches JSON“ zeigt:
   - Es betrifft genau zwei der fünf Ansichten: PROCESSING mit drei `JSON.stringify`-Blöcken und PROJECTION mit einem (`SyntxField.tsx:1891-1907`, Helfer `:1796`).
   - ORIGINAL zeigt mit Absicht den Rohtext der Discovery-Antwort, unverändert (`:1869-1889`); dieser Text ist selbst JSON.
   - SCOPE und EXCHANGES sind teilweise schon strukturiert dargestellt (`:1859-1867`, `:1909-1923`).
2. **[DERIVED]** Die Daten für eine lesbare Hauptansicht liegen schon vollständig in der Antwort des Inspectors (`GeminiResultInspection`, `reader.ts:32-57`):
   - Vorschläge mit verifizierten Zitaten (Projektion);
   - Kandidaten mit jedem einzelnen Claim und dessen Prüfstatus, auch verworfene;
   - Gruppen, Entwürfe und vorgeschlagene Relationen der Convergence;
   - Titel der Quelldokumente, Scope, Modell.

   Eine erste semiontische Ansicht ist deshalb **reine Darstellung (Klasse A)**: Sie braucht keine Vertragserweiterung, keine neue Route und keinen Gemini-Aufruf.
3. **[OBSERVED]** Grenzen, die keine Darstellung aufhebt:
   - Nur die Discovery-Antwort ist als Rohtext archiviert (`discovery/runtime.ts:57`, die einzige `retain`-Stelle). Convergence und Legacy gibt es nur verarbeitet.
   - Legacy steht überhaupt nicht in der Inspector-Antwort.
   - Eine semantische Prüfung findet nicht statt (`semanticDefinitionState: "NOT_RUN"`), eine Autorität gibt es nicht (`authorityState: "NONE"`) (`projection/reader.ts:9-13`).
   - „VERIFIED“ bei einem Zitat heißt nur: Das Zitat steht nach Normalisierung im Dokument (`evidence-validator.ts:31,41`).
4. **[PROPOSED] Minimal-Delta:**
   - eine reine, deterministische Projektionsfunktion `GeminiResultInspection → GeminiSemionticView`;
   - eine sechste Ansicht INVESTIGATION neben den fünf bestehenden. Die fünf Rohansichten bleiben unverändert und gelten als die technische Zweitansicht.
5. **[OBSERVED] Integrationssperren:**
   - Der VIDEO FREEZE gilt (Owner, 2026-10-19).
   - Der laufende Typografie-Sweep von GRÜN berührt dieselben Dateien (`SyntxField.tsx`, `sil-language.ts`).
   - Video-Walk V-04a und Handoff §4 Schritt 12 erwarten nach dem Lesen die Standardansicht ORIGINAL (`video-walk.mjs:112-116`, `SyntxField.tsx:1811`).
6. **[UNRESOLVED]** Die Owner-Entscheidungen Q-1 bis Q-8 stehen in §12. Am wichtigsten:
   - ob Modell-Selbstauskünfte (`model_confidence`, Stufe L1–L6) in der Hauptansicht erscheinen dürfen; Vorschlag: nein;
   - welche Ansicht beim Öffnen gezeigt wird.

---

## 1. Rekonstruierte Ist-Architektur (01)

### 1.1 Kette von der Quelle zur Darstellung

```
CV-PDF ──► Quell-Bundle (Dokumente, sourceBundleHash)
  │
  ├─[Gemini-Aufruf 1] DISCOVERY  (lib/career/capability-core/discovery/runtime.ts)
  │     Antwort ──(nur mit CONDYN_GEMINI_EXCHANGE_ARCHIVE=1, nur Wegwerf-DB)──► Austausch-Archiv
  │                                   (Rohtext + Hülle, Ablauf nach 7 Tagen, retention.ts:9-19)
  │     ► Schema-Parse (runtime.ts:64) ► Kernel-Version ► Coverage-Audit-Zählprüfung (coverage-validator.ts)
  │     ► Evidence-Validator je Claim (evidence-validator.ts) ► RUN_ { kernelOutput, candidates, coverageValidation }
  │
  ├─[Gemini-Aufruf 2] CONVERGENCE (convergence/runtime.ts:50-53)
  │     ► CONV_ { convergenceOutput, canonicalDrafts, proposedRelations, eligibleCandidateIds, excludedCandidateIds }
  │       (verarbeitet und validiert; kein Rohtext archiviert)
  │
  ├─ Projektionsreferenz  ANL_ → (RUN_, CONV_)  (unveränderlich)
  │     ► Lesemodell CAPABILITY_PROPOSAL (projection/reader.ts:66-148)
  │
  └─[Gemini-Aufruf 3] LEGACY (Kernel PC-CONDYN-CAP-v1.0; ohne Scope, O-LIVE-3)
        ► analysis.structured_data; speist die Rollenebene (SUPPORTED/WEAK) über die Präsentations-Zuordnung

Lesewege (alle nur GET):
  /api/career/analyses/[id]                  ► u. a. capabilityProposalProjection, OHNE Token (route.ts:55-67)
  /api/career/analyses/[id]/gemini-result    ► GeminiResultInspection, Token (gemini-result/route.ts:21-44)
  /api/career/jobs/[jobId]/gemini-exchanges  ► alle Austausche eines Auftrags, Token (gemini-exchanges/route.ts:17-29)
  /api/career/analyses/[id]/job-comparison   ► B2 SELECTED_ROLE_COVERAGE_V1 (getrennter Körper)
  /api/career/analyses/[id]/investigation    ► persistierte Untersuchungsgrenze (investigation/route.ts:18-48)
UI: SyntxField ► Schalter „GEMINI OUTPUT“ (SyntxField.tsx:2174) ► GeminiOutputBody (:1806-1930, eingebunden :2284)
```

Belege:
- **[OBSERVED]** Die Reihenfolge der drei Aufrufe und ihre Arten zeigt der Live-Lauf in `results/live-104410d-1920-relay.jsonl` (CONVERGENCE und LEGACY, je zweimal).
- **[OBSERVED]** Dass Legacy ohne Scope läuft, belegen die gleich großen Requests (11 477 B) in derselben Datei; siehe `CONDYN_VIDEO_READINESS_2026-10-19.md` §9.
- **[DERIVED]** Legacy fehlt im Inspector, weil `GeminiResultInspection` kein Feld dafür hat (`reader.ts:32-57`).

### 1.2 Zugangsgrenzen (alle drei müssen offen sein)

| Grenze | Wirkung | Quelle |
|---|---|---|
| Build-Schalter `NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI=1` | ohne ihn gibt es weder Schalter noch Körper | `SyntxField.tsx:1608-1609, 2174, 2284` |
| Server: `CONDYN_RESULT_INSPECTOR=1` und ein Token mit mindestens 32 Zeichen im Header | sonst einheitlich 404 `ERR_NOT_FOUND`, ohne Daten | `access.ts:3-25`, `gemini-result/route.ts:22` |
| Austausch-Archiv `CONDYN_GEMINI_EXCHANGE_ARCHIVE=1`, nur auf einer geprüften Wegwerf-Datenbank | ohne Archiv sind die Originalantwort und der Scope-Text `NOT_RETAINED` | `postgres-exchange-store.ts:18-22, 51-70`, `gemini-result/route.ts:34-35` |

- **[OBSERVED]** Das Token liegt nur im Speicher des Körpers. Es wird bei jedem Lesen als Header gesendet, beim Schließen verworfen, und es gibt keine Wiederholung (`SyntxField.tsx:1800-1805`, `client.ts:1-7, 47-58`).

### 1.3 Ist-Darstellung (`GeminiOutputBody`, `SyntxField.tsx:1806-1930`)

| Ansicht | Zeilen | Darstellung heute | Testids |
|---|---|---|---|
| Kopf, Zugang | 1837-1853 | Analyse- und Auftrags-ID, Passwortfeld, LESEN, Zustandssatz | `syntx-gemini-output[data-inspection-state]`, `-token`, `-read`, `-state`, `-unavailable` |
| SCOPE | 1859-1867 | Chips für Modus und Rollen-ID, Metazeile (Lauf, Provider, Modell, Schema, Kernel), Scope-Text als `<pre>` | `syntx-gemini-scope[data-scope-state]`, `-scope-text` |
| ORIGINAL (Standard, `:1811`) | 1869-1889 | Chips für sha256 und parser = text und finishReason, Metazeile, Rohtext `<pre>` oder NOT_RETAINED mit Begründung | `syntx-gemini-original[data-original-state]`, `-original-text`, `-not-retained`, `-reused` |
| PROCESSING | 1891-1900 | **drei JSON-Blöcke:** kernelOutput, candidates, convergence.payload | `syntx-gemini-processing` |
| PROJECTION | 1902-1907 | **ein JSON-Block:** die Projektion | `syntx-gemini-projection` |
| EXCHANGES | 1909-1923 | Liste mit Ausgang, Fehlercode, Metazeile und Rohtext je Austausch | `syntx-gemini-exchanges[data-exchanges-state]`, `-exchange-<id>`, `-read-exchanges`, `-exchanges-empty` |

- **[OBSERVED]** Zustände, die der Code heute zeigt:
  - am Körper: `IDLE`, `LOADING`, `AVAILABLE`, `CLOSED`, `NOT_FOUND`, `LINEAGE_INVALID`, `FAILED`, `NO_GEMINI`, `NO_ANALYSIS` (`:1835-1837`, `client.ts:12-18`);
  - „Lauf wiederverwendet“: abgeleitet aus Lauf-Zeit < Auftrag-Zeit (`:1833-1834`).
- **[OBSERVED]** Menschenlesbare Belegdarstellung gibt es anderswo schon:
  - B2 zeigt Zitate mit `quoteLine` (`:1634, 1685`);
  - die Evidenzfläche der Rolle zeigt Zitate je Quelldokument (`:1296-1330`).

  Diese Grammatik ist erprobt und kann wiederverwendet werden.

---

## 2. Quell- und Schema-Abhängigkeitskarte (02)

Jedes Feld, das heute oder künftig angezeigt wird, mit seiner tatsächlichen Quelle und seiner Aussagekraft. Was hier fehlt, existiert im Vertrag nicht.

| # | Feld | Quelle (Code) | Herkunft | Aussagekraft |
|---|---|---|---|---|
| F-01 | `analysisId` | Routenparameter, `reader.ts:125` | Kennung | — |
| F-02 | `jobId` | Projektionsreferenz, `reader.ts:126` | Kennung | — |
| F-03 | `investigationMode` PERSON / PERSON_X_JOB / UNDECLARED | `job.inputRef.sourceData`, `reader.ts:72-77` | gespeicherte Auftragseingabe | gespeicherte Grenze, **nicht** der aktuelle UI-Modus |
| F-04 | `jobScopeSelection` {jobPoolUploadId, poolRoleId} | `reader.ts:79-85` | Auftragseingabe | nur IDs. **Rollentitel und Organisation fehlen im Vertrag** |
| F-05 | Zustand des Scopes RETAINED / NOT_RETAINED / UNSCOPED, Text, Hash-Prüfung | `reader.ts:130-134` | Lauf (Hash), Archiv (Text) | Der Text ist nur Systemprompt, nie Evidenz (`discovery/types.ts:7-12`) |
| F-06 | Discovery-Lauf: ID, Zeit, Provider, Modell, Schema, Kernel | `reader.ts:135-141` | RUN_ | Identität des Laufs |
| F-07 | Quelldokumente: docId, title, mimeType, rawContentHash, normalizedTextHash | `reader.ts:142-144` | Quell-Bundle | **kein Dokumenttext**; `null`, wenn das Bundle fehlt |
| F-08 | Originalantwort: text, textSha256, finishReason, modelVersion, responseId, usageMetadata, receivedAt, exchangeId, attempt, request, retainedAt, expiresAt | `reader.ts:146-148`, `discovery/types.ts:20, 34` | Archiv | unverändert wie empfangen; nur Discovery |
| F-09 | `textMatchesSha256`, `parserResultMatchesText` | `reader.ts:95-97, 147` | beim Lesen berechnet | Integrität, keine inhaltliche Prüfung |
| F-10 | `parserResult.kernelOutput.capabilities[]`: canonical_name, capability_scope, structural_definition, primary_domain, demonstrated_capability_level, **model_confidence**, evidence_mode, evidence[] | `reader.ts:149`, `schema.ts:14-23, 46-50` | Gemini-Aufruf 1, geparst und schemageprüft | **Modelltext.** `model_confidence` (0..1) und die Stufe L1–L6 sind ungeprüfte Selbstauskünfte des Modells |
| F-11 | `kernelOutput.coverage_audit` | `schema.ts:25-44` | Modell | Selbstauskunft; geprüft wird nur, dass die Zählungen zusammenpassen (`coverage-validator.ts:2-4`) |
| F-12 | `evidenceVerification.candidates[]`: candidateId, proposedCanonicalName, proposedScope, structuralDefinition, proposedPrimaryDomain, proposedDemonstratedLevel, modelConfidence, evidenceMode, status | `reader.ts:150`, `schema.ts:78-90` | RUN_ | `status`: EVIDENCE_PASSED, sobald **mindestens ein** Claim VERIFIED ist (`evidence-validator.ts:46`) |
| F-13 | `candidates[].evidenceClaims[]`: evidenceId, sourceDocumentRef, declaredLocation, exactQuote, verification {status, matchedDocId, matchedPageNumber, matchedNormalizedQuote, sourceSpanStart/End, reason} | `schema.ts:57-76` | Modell (Quelle, Ort, Zitat) + Validator (verification) | `sourceDocumentRef` und `declaredLocation` sind **Modellangaben**. `matchedPageNumber` gibt es nur, wenn der Ort eine Seite nennt und diese das Zitat enthält, oder wenn das Zitat ohne Seitenangabe auf genau einer Seite steht (`evidence-validator.ts:8-10, 23-41`) |
| F-14 | `convergence.payload.convergenceOutput`: groups {member_candidate_ids, canonical_name, …}, relations {source/target_group_key, relation_type, reason}, reconciliation_audit | `reader.ts:151`, `convergence/schema.ts:4-16` | Gemini-Aufruf 2, validiert | Modelltext. **Die Convergence kann umbenennen:** Der Gruppenname ist ein neuer Name |
| F-15 | `convergence.payload.canonicalDrafts[]` {provisionalCapabilityId, evidenceIds, provenance}, `proposedRelations[]`, `eligibleCandidateIds`, `excludedCandidateIds` | `convergence/types.ts:11-12`, `convergence/runtime.ts:50-53`, `canonicalizer.ts:12-15` | deterministisch aus Gruppen und VERIFIED-Claims | `excludedCandidateIds` = alle EVIDENCE_REJECTED |
| F-16 | `projection.capabilities[]` {id PCAP_, name, domain, scope, structuralDefinition, sourceCandidateIds, sourceDocumentIds, evidence[{evidenceId, sourceDocumentId, exactQuote, verificationState: SOURCE_MATCH_VERIFIED}]} | `projection/reader.ts:6-22, 105-141` | aus RUN_ und CONV_ | `authorityState: "NONE"`, `semanticDefinitionState: "NOT_RUN"`; nur verifizierte Zitate |
| F-17 | `projection.relations[]` {type, state: PROPOSED, reason} | `projection/reader.ts:142-145` | Convergence | immer PROPOSED; der Grund ist Modelltext |
| F-18 | Austausche des Auftrags: outcome, errorCode, runId, attempt, Hülle, Text | `reader.ts:163-188`, `retention.ts:23` | Archiv | FAILED-Austausche erreichen nie eine Analyse (`reader.ts:158-162`) |
| F-19 | „Lauf wiederverwendet“ | `SyntxField.tsx:1833-1834` | berechnet: Zeit des Laufs < Zeit des Auftrags | Hinweis: Dieser Auftrag hat Gemini nicht neu aufgerufen |

Nicht im Vertrag **[OBSERVED]**:
- Rohtexte von Convergence und Legacy;
- Text oder Kontext eines Dokuments rund um ein Zitat;
- Rollentitel und Organisation zur gespeicherten Auswahl;
- jede Zuordnung Fähigkeit → Anforderung: Das ist B2, mit `NOT_EVALUATED` (`selected-role-coverage.ts:16-23`);
- jeder Score und jede Rangfolge in GEMINI OUTPUT;
- der Laufzustand eines Auftrags, der noch rechnet (der Inspector kennt nur fertige Analysen).

---

## 3. Matrix der Untersuchungsgrenzen (03)

| Element in GEMINI OUTPUT | PERSON | JOB | PERSON × JOB |
|---|---|---|---|
| Körper aktiv | ja | **nein**: `NO_GEMINI` [OBSERVED `:1835`] | ja |
| Scope | `UNSCOPED` | — | `RETAINED` (Text + Hash-Prüfung) oder `NOT_RETAINED` (nur Hash) |
| Rollenbezug | keiner | — | nur `jobScopeSelection` (IDs). Titel nur unter Bindungsgleichheit [PROPOSED M-7] |
| Vorschläge, Zitate, Verwerfungen, Relationen | ja | — | ja, mit dem Hinweis, dass der Scope die Namen prägt (O-LIVE-1) |
| Anforderungen der Rolle, Abdeckung | **nie** in GEMINI OUTPUT | Strukturkörper (`StructureBody`, `:1722`) | **nie** in GEMINI OUTPUT; nur B2 (`CoverageBody`, `:1650`) |
| Unterstützung auf Rollenebene SUPPORTED/WEAK/SWEEP_ONLY | **nie** | Jobfeld (`syntx-field-view-model.ts:679`) | **nie** in GEMINI OUTPUT |

**Geschützte Invarianten und wie sie gehalten werden**

| Invariante | Heute [OBSERVED] | Regel für die semiontische Ansicht [PROPOSED] |
|---|---|---|
| PERSON ≠ JOB | JOB wird gar nicht gelesen (`:1835`) | unverändert; INVESTIGATION wird in JOB nie aufgebaut |
| JOB ≠ PERSON × JOB | Die Rollenstruktur kommt aus einer eigenen Route, nicht aus dem Inspector | INVESTIGATION zeigt keine Anforderungen und keine Gewichte |
| PROPOSED_CAPABILITY ≠ VERIFIED_QUALIFICATION | Projektion `authorityState: NONE`, `semanticDefinitionState: NOT_RUN` (`projection/reader.ts:9-13`) | Jeder Vorschlag trägt sichtbar „VORSCHLAG · keine Autorität“. Die Wörter „verifiziert“, „nachgewiesen“, „qualifiziert“ stehen nie an einer Fähigkeit, nur am Zitat und dort mit fester Bedeutung (§6) |
| COVERED ≠ VERIFIED_COMPETENCE | Abdeckung gibt es nur in B2, `scored: false`, `NOT_EVALUATED` (`selected-role-coverage.ts:16-23`) | INVESTIGATION rechnet und zeigt **keine** Abdeckung. Höchstens ein Verweis „Abdeckung: siehe B2“ |
| RELATIONSHIP ≠ HIRING_DECISION | Der Inspector enthält keine Entscheidungsfelder | keine Entscheidungs- und keine Eignungssprache, keine Ampel |
| Persistierter Modus ≠ UI-Modus | Der Inspector liefert den gespeicherten Modus (`reader.ts:72-77`); der Körper zeigt ihn nur als Chip | Der Kopf zeigt den gespeicherten Modus. Weicht der UI-Modus ab, steht das als Feststellung da, ohne umzudeuten (M-6). UNDECLARED bleibt UNDECLARED |
| Projektion hebt keine Autorität | — | Jedes Element übernimmt den Autoritäts- und Prüfstatus seiner Quelle. Die Abbildung darf ihn senken oder halten, aber nie heben (M-12) |

---

## 4. Semiontisches Projektionsmodell (04) [PROPOSED]

### 4.1 Kette

```
GET gemini-result ─► decodeGeminiResultInspection (client.ts:24-34, unverändert)
   ─► projectGeminiInspection(inspection, uiContext)   (neu, rein, deterministisch)
   ─► GeminiSemionticView                              (neu, nur Lesemodell)
   ─► GeminiInvestigationView (Komponenten)            (neu)
```

Grundsätze:
- Ein einziger Lesezugriff. Die semiontische Ansicht rendert **dieselbe** Inspector-Antwort, die auch die Rohansichten zeigen; es gibt keinen zweiten Fetch und kein Mischen mit der öffentlichen Analyse-Route.
- Kein neuer Gemini-Aufruf, kein Schreibzugriff, keine Speicherung.

### 4.2 Lesemodell (Skizze, nicht verbindlich als Code)

```ts
type Src = string;                       // JSON-Pointer in die Inspector-Antwort, z. B. "/projection/capabilities/3/evidence/0"
interface GeminiSemionticView {
  version: "GEMINI_SEMIONTIC_VIEW_V1";
  header: {
    analysisId: string; jobId: string;
    persistedMode: "PERSON" | "PERSON_X_JOB" | "UNDECLARED"; uiModeDiffers: boolean;
    selection: { jobPoolUploadId: string; poolRoleId: string; roleTitle: string | null } | null;
    scope: "RETAINED" | "NOT_RETAINED" | "UNSCOPED"; scopeHashMatches: boolean | null;
    inference: { provider: string; model: string; modelVersion: string | null };
    runReused: boolean; src: Src[];
  };
  sources: Array<{ docId: string; title: string; mimeType: string | null; src: Src }> | null;   // null = Bundle nicht lesbar
  proposals: Array<{
    id: string; name: string; scope: "ATOMIC" | "COMPOSITE"; domain: string | null; definition: string;
    authority: "NONE"; semantic: "NOT_RUN";
    evidence: EvidenceAnchor[];                                   // nur SOURCE_MATCH_VERIFIED, in Projektionsreihenfolge
    origin: Array<{ candidateId: string; name: string; src: Src }>; renamed: boolean;   // Discovery → Convergence
    src: Src;
  }>;
  relations: Array<{ id: string; from: string; to: string; type: string; state: "PROPOSED"; reason: string; src: Src }>;
  rejected: {
    candidates: Array<{ candidateId: string; name: string; claims: EvidenceAnchor[]; src: Src }>;          // EVIDENCE_REJECTED
    claimsOfAdmitted: Array<EvidenceAnchor & { candidateId: string }>;                                     // abgelehnte Claims zugelassener Kandidaten
  };
  absences: Array<{ code: AbsenceCode; src: Src | null }>;
  raw: { original: "RETAINED" | "NOT_RETAINED"; textMatchesSha256: boolean | null; parserMatchesText: boolean | null };
}
interface EvidenceAnchor {
  evidenceId: string; quote: string;                     // exactQuote unverändert
  declaredSource: string; declaredLocation: string;      // Modellangaben
  matchedDocId: string | null; matchedDocTitle: string | null; matchedPage: number | null;
  status: "VERIFIED" | "REJECTED_UNKNOWN_SOURCE" | "REJECTED_EMPTY_QUOTE" | "REJECTED_QUOTE_NOT_FOUND" | "REJECTED_LOCATION_MISMATCH" | "UNVERIFIED" | "UNSUPPORTED";
  reason: string | null; src: Src;
}
type AbsenceCode =
  | "ORIGINAL_NOT_RETAINED" | "SCOPE_TEXT_NOT_RETAINED" | "PROJECTION_ABSENT" | "SOURCES_NOT_READABLE"
  | "NO_PROPOSED_RELATIONS" | "NO_REJECTED_EVIDENCE" | "CONVERGENCE_RAW_NOT_ARCHIVED" | "LEGACY_NOT_INSPECTED"
  | "SEMANTIC_VERIFICATION_NOT_RUN" | "REQUIREMENT_RELATION_NOT_EVALUATED";
```

**Bewusst nicht im Lesemodell [PROPOSED, Owner-Entscheidung Q-1/Q-2]:**
- `model_confidence` bzw. `modelConfidence`;
- `demonstrated_capability_level` bzw. `proposedDemonstratedLevel`;
- die Zahlen aus `coverage_audit`.

Sie existieren im Vertrag, sind aber Selbstauskünfte des Modells. In einer gestalteten Hauptansicht würden sie wie geprüfte Sicherheit oder Stufe wirken; das verletzt „No invented confidence“ und „A visual projection may not upgrade the authority“. Sie bleiben in PROCESSING (roh) vollständig sichtbar.

### 4.3 Abbildungsregeln

| Regel | Inhalt |
|---|---|
| M-1 | `proposals` = `projection.capabilities` in **Projektionsreihenfolge**, ohne Umsortieren, Ranking oder Filtern. Ist `projection === null`, entsteht `PROJECTION_ABSENT`, und es wird **nichts** aus den Kandidaten nachgebaut. |
| M-2 | `origin` über `sourceCandidateIds` → Kandidat mit gleicher `candidateId`. `renamed = true`, wenn ein Kandidatenname ≠ Vorschlagsname ist. Fehlt ein Kandidat, wird `origin` mit `name: null` geführt und als UNRESOLVED markiert, nicht still weggelassen. |
| M-3 | `evidence` = `projection.capabilities[].evidence`, angereichert um den Claim mit gleicher `evidenceId` aus den Kandidaten (`declaredLocation`, `matchedPageNumber`) und um den Titel aus `sources` (docId). Kein Fund ergibt `null`-Felder, keine Annahme. |
| M-4 | `rejected.candidates` = Kandidaten mit `status === "EVIDENCE_REJECTED"`. `claimsOfAdmitted` = Claims mit Status ≠ VERIFIED bei zugelassenen Kandidaten. Beides wird gezeigt, weil Abwesenheit eine Information ist. |
| M-5 | `relations` = `projection.relations` unverändert. **Keine** Relation aus räumlicher Nähe, gemeinsamen Zitaten, gleichen Wörtern oder gleicher Domäne. |
| M-6 | `persistedMode` aus der Inspector-Antwort; `uiModeDiffers` ist der Vergleich mit dem UI-Modus. Der Text sagt nur, dass er abweicht. |
| M-7 | `roleTitle` nur, wenn `jobPoolUploadId` und `poolRoleId` der aktuellen UI-Auswahl genau der gespeicherten `jobScopeSelection` gleichen (Muster `comparisonBelongsToSelection`, `client.ts:74-77`). Sonst nur IDs. |
| M-8 | Jeder Inhaltstext ist ein Quellwert, zeichengleich. Die Darstellung erzeugt keinen Text außer festem Copy. Kein Zusammenfassen, kein Kürzen mit Bedeutungsänderung; Kürzen nur visuell, mit vollem Text bei Aufklappen. |
| M-9 | Rein und deterministisch: kein Fetch, keine Uhr, kein Zufall, keine Locale-abhängige Sortierung. Gleiche Eingabe ergibt ein tiefengleiches Ergebnis. |
| M-10 | Unbekannter Enum-Wert, zum Beispiel ein neuer Prüfstatus, wird `UNSUPPORTED` und als solcher sichtbar; er wird nie auf den nächstliegenden Wert abgebildet. |
| M-11 | `absences` werden immer vollständig erzeugt: `CONVERGENCE_RAW_NOT_ARCHIVED`, `LEGACY_NOT_INSPECTED`, `SEMANTIC_VERIFICATION_NOT_RUN` und `REQUIREMENT_RELATION_NOT_EVALUATED` stehen **fest** in jeder Ansicht, weil sie für jede Analyse gelten. |
| M-12 | Keine Autoritätshebung. Kein Feld des Lesemodells trägt einen höheren Status als seine Quelle. Insbesondere wird `EVIDENCE_PASSED` eines Kandidaten nie als „Fähigkeit belegt“ dargestellt. |
| M-13 | Umkehrbarkeit: Jedes Element hat `src`. Die UI bietet je Element „roh zeigen“ an; das springt in PROCESSING oder PROJECTION an die Stelle (bzw. zeigt den Ausschnitt). |

---

## 5. Matrix Zustand → Darstellung (05)

Die Zustände aus dem Auftrag werden auf die real existierenden abgebildet. „Nicht ableitbar“ heißt: Dieser Zustand wird nicht gezeigt.

| Auftragszustand | Realer Zustand und Quelle | Erlaubter Inhalt | Anzeige [PROPOSED] | Interaktion | Autoritätsgrenze |
|---|---|---|---|---|---|
| NO_INVESTIGATION | `NO_ANALYSIS` bei `analysisId === null` · `NO_GEMINI` im Modus JOB (`:1835`) [OBSERVED] | nur der bestehende Zustandssatz | Bernstein-Statement wie heute | keine | keine Aussage über eine Person |
| NO_RESULT | `NOT_FOUND` (404, keine Referenz) · `CLOSED` (Inspector aus oder Token falsch) (`client.ts:53`) [OBSERVED] | Zustandssatz | Bernstein-Statement | erneut lesen | „nichts gefunden“ ist kein Befund |
| RESULT_PENDING | Analyse läuft noch: **im Inspector nicht ableitbar**, er kennt nur fertige Referenzen und meldet `NOT_FOUND` [DERIVED] · Lesen läuft: `LOADING` [OBSERVED] | nur LOADING | Cyan, „wird gelesen“ | — | Ein Laufzustand des Auftrags wäre Klasse B (G-B3) |
| RESULT_AVAILABLE | `AVAILABLE` [OBSERVED] | INVESTIGATION + 5 Rohansichten | Kopf mit Modus, Scope, Modell | Ansichten wechseln | alles PROPOSED / NONE |
| RAW_RESPONSE_AVAILABLE | `originalGeminiResponse.state === "RETAINED"` (`reader.ts:146`) [OBSERVED] | Hinweis „Originalantwort vorhanden“ + sha256- und Parser-Chips | Grün nur für die **Integrität** (sha256 ✓), nie für den Inhalt | Sprung zu ORIGINAL | nur Discovery |
| PROCESSED_OUTPUT_ONLY | `NOT_RETAINED` bei `AVAILABLE` (Discovery) · **immer** für Convergence und Legacy [OBSERVED] | Vorschläge aus der Projektion mit dem Etikett „verarbeitet, kein Rohtext aufbewahrt“ | Bernstein-Chip `NOT_RETAINED` / `CONVERGENCE_RAW_NOT_ARCHIVED` | — | nie „Originalantwort“ nennen |
| EVIDENCE_PRESENT | Claim `VERIFIED` (`evidence-validator.ts:31,41`) [OBSERVED] | Zitat, gefundenes Dokument, Seite nur wenn `matchedPageNumber` | Mint-Linie wie `quoteLine` (`:1634`) | aufklappen, roh zeigen | „Zitat gefunden“, **nicht** „Fähigkeit belegt“ |
| EVIDENCE_MISSING | Claim `REJECTED_*` mit `reason` · Kandidat `EVIDENCE_REJECTED` [OBSERVED] | Zitat **und** Ablehnungsgrund wörtlich | gedämpftes Rot oder Bernstein, durchgezogene Kante „verworfen“ | aufklappen | keine Spekulation über das Warum |
| PARSER_FAILURE | Ein fehlgeschlagener Austausch mit `errorCode` (zum Beispiel `ERR_CAPABILITY_DISCOVERY_SCHEMA_INVALID`, `discovery/runtime.ts:64`) erscheint nur in EXCHANGES und **nie** an einer Analyse (`reader.ts:158-162`) · bei RETAINED kann `parserResultMatchesText === false` sein [OBSERVED] | Fehlercode wörtlich | Bernstein-Chip mit dem Code | Sprung zu EXCHANGES | Ein Fehler ist kein Ergebnis |
| UNSUPPORTED_SCHEMA | Der Decoder lehnt ab → `FAILED` (`client.ts:24-34, 56-57`) [OBSERVED] · unbekannter Enum → `UNSUPPORTED` (M-10) [PROPOSED] | Zustandssatz | Bernstein | — | nichts Teilweises anzeigen |
| *(zusätzlich)* LINEAGE_INVALID | 409 (`reader.ts:69`, `client.ts:54`) [OBSERVED] | Zustandssatz, **kein** Teilinhalt | Bernstein | — | — |
| *(zusätzlich)* RUN_REUSED | `:1833-1834` [OBSERVED] | Chip „Lauf wiederverwendet“ + Satz | Bernstein-Chip | — | kein neuer Gemini-Aufruf in diesem Auftrag |
| *(zusätzlich)* SCOPE_HASH_MISMATCH | `textMatchesScopeHash === false` (`reader.ts:133`) [OBSERVED] | Scope-Text + „Hash stimmt nicht“ | Bernstein | — | Der Text gilt dann nicht als der verwendete Scope |
| *(zusätzlich)* PROJECTION_ABSENT | `projection === null` (`reader.ts:152`, `projection/reader.ts:73-74`) [OBSERVED] | Satz „keine Projektion“ | Bernstein | Sprung zu PROCESSING | kein Nachbau aus den Kandidaten (M-1) |

**Leitsatz:** Fehlen wird nie positiv dargestellt. Ein leerer Bereich zeigt ausdrücklich seinen Abwesenheitscode, statt zu verschwinden.

---

## 6. Evidenz und Herkunft (06)

**Herkunftskette, vollständig aus dem Vertrag [OBSERVED]**

```
Zitat (exactQuote, Modell) ─ Claim (evidenceId = Hash aus Quelle, Ort und Zitat, schema.ts:98-105)
  ─ Prüfung (Validator: Quelle per Titel, Zitat normalisiert im Dokument, ggf. Seite)
  ─ Kandidat (candidateId, Discovery-Name)
  ─ Convergence-Gruppe (member_candidate_ids, neuer Name)
  ─ Entwurf PCAP_ (evidenceIds = verifizierte Claims der Mitglieder, canonicalizer.ts:12-13)
  ─ Projektion (nur SOURCE_MATCH_VERIFIED)
```

**Was „VERIFIED“ heißt [OBSERVED]**
- Die vom Modell genannte Quelle ließ sich über docId oder Titel genau einem Dokument zuordnen (`evidence-validator.ts:14-17`).
- Das Zitat ist nicht leer (`:19`).
- Das Zitat steht nach Normalisierung im Text dieses Dokuments; nennt der Ort eine Seite, steht es auf genau dieser Seite (`:22-41`).

**Was „VERIFIED“ nicht heißt [OBSERVED]**
- Es heißt nicht, dass das Zitat die genannte Fähigkeit trägt: `semanticDefinitionStatus: "NOT_RUN"` (`convergence/types.ts:11`, `projection/reader.ts:12`); dazu O-LIVE-1.

**Darstellungsregeln [PROPOSED]**
- **E-1 Zitat:** zeichengleich `exactQuote`, in typografischen Anführungszeichen, mit der Mint-Linie (`quoteLine`).
- **E-2 Fundort:** „gefunden in ‹Titel›“ aus `sources[docId]`, dazu „· Seite N“ nur bei `matchedPageNumber`. Ist der Titel nicht auflösbar: docId und „Titel nicht lesbar“.
- **E-3 Modellangaben:** `declaredSource` und `declaredLocation` stehen getrennt als „Angabe des Modells“, kleiner und in Mono. Sie werden nie als geprüfter Ort gezeigt.
- **E-4 Feste Fußzeile jedes Vorschlags:** „Zitat im Dokument gefunden · Bedeutung nicht geprüft · keine Autorität“.
- **E-5 Umbenennung:** Hat die Convergence umbenannt (`renamed`), zeigt der Vorschlag die Discovery-Namen als „aus: …“, damit kein Name ohne Herkunft erscheint.
- **E-6 Kein Kontext:** Kein Satz rund um das Zitat. Der Dokumenttext ist nicht im Vertrag (G-C2), und mehr Lebenslauftext auf dem Bildschirm wäre auch eine Datenschutzfrage.
- **E-7 Spannen:** Die Spannen (`sourceSpanStart/End`) beziehen sich auf den normalisierten Text. In der Hauptansicht erscheinen sie nicht; sie bleiben roh.

---

## 7. Erhalt des Roh-Inspectors (07) [PROPOSED]

- **R-1:** Die fünf bestehenden Ansichten bleiben in Verhalten, Text und Testids unverändert. Sie sind die technische Zweitansicht, als zweite Gruppe von Tabs mit dem Etikett „TECHNISCH“ und ohne Umbenennung der Tabs.
- **R-2:** Neu ist die Ansicht `INVESTIGATION` als erste Gruppe. Ob sie die Standardansicht wird, entscheidet der Owner (Q-3).
  - Wird sie Standard, müssen Walk V-04a/V-10a und Handoff §4 Schritte 12/31 angepasst werden: Heute lesen sie `syntx-gemini-original-text` direkt nach AVAILABLE, ohne Tab-Klick (`video-walk.mjs:112-116`).
  - Ohne Owner-Wort bleibt ORIGINAL der Standard (`SyntxField.tsx:1811`).
- **R-3:** „Originalantwort“ heißt ausschließlich der archivierte Rohtext der Discovery. Alles andere trägt „verarbeitet“.
  - Für Convergence gilt fest „kein Rohtext aufbewahrt“.
  - Legacy wird nicht gezeigt; der feste Satz lautet „Legacy-Analyse: nicht Teil dieses Inspectors“.
- **R-4:** Zugang unverändert: dieselben drei Grenzen (§1.2), dasselbe Token nur im Speicher, dieselbe eine GET-Lesung. INVESTIGATION macht keinen eigenen Request.
- **R-5:** Je Element ein Sprung „roh“ (M-13) in die passende technische Ansicht.

---

## 8. Architekturlücken (08)

**Klassen:**
- **A** reine Darstellung;
- **B** Daten existieren, sind aber hier nicht freigegeben;
- **C** braucht eine Vertragserweiterung;
- **D** durch Evidenz nicht gedeckt;
- **E** unbekannt.

Für C und D gibt es ausdrücklich **keinen** Umsetzungsvorschlag.

| ID | Lücke | Klasse | Grundlage |
|---|---|---|---|
| G-A1 | Vorschläge als Entitäten statt JSON (PROJECTION) | A | F-16, `:1902-1907` |
| G-A2 | Zitate als Belegankert mit Fundort statt JSON (PROCESSING) | A | F-13, F-16 |
| G-A3 | Verworfene Claims und Kandidaten sichtbar als Abwesenheit | A | F-12/F-13, `evidence-validator.ts:46` |
| G-A4 | Convergence-Herkunft „n Kandidaten → 1 Vorschlag“, Umbenennung | A | F-14/F-15 |
| G-A5 | Vorgeschlagene Relationen als Liste mit Typ und Grund | A | F-17 |
| G-A6 | Feste Abwesenheiten (Convergence roh, Legacy, semantisch, Anforderungsrelation) | A | §1.1, `projection/reader.ts:9-13` |
| G-A7 | Hinweis, wenn gespeicherter Modus ≠ UI-Modus | A | F-03 |
| G-A8 | EN/DE-Copy für alle neuen Etiketten | A | `sil-language.ts:601ff / 1353ff` |
| G-B1 | Rollentitel und Organisation zur gespeicherten Auswahl: in Pool, Strukturroute und B2 vorhanden, nicht im Inspector | B | F-04; Lösung als A unter Bindungsgleichheit möglich (M-7) |
| G-B2 | Legacy-Ergebnis: in der öffentlichen Analyse-Route vorhanden (`route.ts:60-69`), nicht im Inspector | B | bewusst nicht einbezogen; jede Einbeziehung = Owner-Entscheidung (Q-6) |
| G-B3 | Laufzustand des Auftrags (QUEUED/RUNNING/FAILED): in `/api/career/jobs/[jobId]`, nicht im Inspector | B | — |
| G-C1 | Rohtext von Convergence und Legacy | C | einzige `retain`-Stelle `discovery/runtime.ts:57` |
| G-C2 | Dokumentkontext um das Zitat | C | F-07 (nur Hashes); zugleich Datenschutz |
| G-C3 | Seite bei Zitaten ohne Seitenangabe, die auf mehreren Seiten (oder in einem Dokument ohne Seiten) vorkommen | C | `evidence-validator.ts:37-41` |
| G-C4 | Semantische Prüfung „Zitat trägt Fähigkeit“ | C | `NOT_RUN` |
| G-C5 | Fähigkeit → Anforderung ausgewertet | C | `NOT_EVALUATED`, `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` |
| G-D1 | Konfidenz, Score, Ranking, Eignung, Ampel | D | kein gedeckter Vertrag; `model_confidence` ist Selbstauskunft |
| G-D2 | Geprüfte Stufe L1–L6 | D | Stufe nur Modellvorschlag; `levelVerificationStatus` existiert nur im (hier nicht vorhandenen) verifizierten Snapshot (`schema.ts:153`) |
| G-D3 | Relationen aus Nähe, Wortgleichheit oder Domäne | D | M-5 |
| G-E1 | Bekommt eine Analyse aus `VERIFIED_SNAPSHOT_REUSED` (`discovery/runtime.ts:42-45`) eine Projektionsreferenz, und was zeigt der Inspector dann? | E | nicht nachverfolgt; Prüfung durch PINK vorgeschlagen |
| G-E2 | Ist GEMINI OUTPUT für den Film oder die Demo überhaupt eingeschaltet (Build-Schalter)? | E | Owner |
| G-E3 | Woran ist der Stand-in in der UI erkennbar außer an `modelVersion` (`video-standin-001`)? | E | Der Vertrag hat kein Feld „synthetisch“ |

---

## 9. Minimal-Delta-Komponentenspezifikation (09) [PROPOSED]

**Unverändert wiederverwendet**

| Bereich | Bausteine |
|---|---|
| Vertrag und Zugang | `reader.ts`, `client.ts`, `access.ts`, beide Inspector-Routen |
| Körper | `GeminiOutputBody` (Zugang, Token, Lesen, Tab-Leiste) |
| Bausteine in `SyntxField.tsx` | `LimitChip` (`:1642`), `StateStatement` (`:1645`), `BodyHeading` (`:1639`), `boundaryLayer`, `quoteLine` (`:1634`), `sourceLine` (`:1635`), `rawText` (`:1636`), `bodyStyle` / `BODY_WIDTH` (`:1629-1630`) |

**Neu**

| ID | Baustein | Verantwortung |
|---|---|---|
| N-1 | `lib/career/result-inspector/semiontic-view.ts`: `projectGeminiInspection(inspection, ui)` | reine Abbildung nach §4; keine Imports aus `node:*`, kein React |
| N-2 | `GeminiInvestigationView` | Zusammenstellung; nur Props aus N-1 |
| N-3 | `InvestigationHeader` | Modus, Scope, Auswahl, Modell, Wiederverwendung, Abweichung vom UI-Modus |
| N-4 | `ProposalEntity` | Name, Umfang, Domäne, Definition, Herkunft, Belege, feste Fußzeile E-4 |
| N-5 | `EvidenceAnchor` | E-1 bis E-3, Sprung „roh“ |
| N-6 | `RejectionGroup` | verworfene Kandidaten und Claims mit dem Grund wörtlich |
| N-7 | `ProposedRelationList` | Typ, Grund, PROPOSED |
| N-8 | `AbsenceList` | alle `AbsenceCode`, über `StateStatement` |
| N-9 | Copy `t.gemini.investigation.*` | EN und DE, gleiche Schlüssel |

**Minimale Eingriffe in bestehende Dateien**
- `SyntxField.tsx`:
  - `GeminiView` und `GEMINI_VIEWS` (`:1794-1795`) um `INVESTIGATION` erweitern;
  - einen Render-Zweig ergänzen;
  - die Tab-Leiste in zwei Gruppen teilen.

  Die Standardansicht bleibt `ORIGINAL`, bis Q-3 entschieden ist.
- `sil-language.ts`: neue Schlüssel unter `gemini` (EN `:601ff`, DE `:1353ff`).

**Neue Testids**
- `syntx-gemini-view-INVESTIGATION`;
- `syntx-gemini-investigation[data-proposal-count][data-rejected-count][data-relation-count][data-persisted-mode][data-ui-mode-differs]`;
- `syntx-gemini-proposal-<PCAP>[data-authority=NONE][data-semantic=NOT_RUN][data-renamed]`;
- `syntx-gemini-anchor-<EVD>[data-status][data-matched-page]`;
- `syntx-gemini-rejected-<CAND>`;
- `syntx-gemini-absence-<CODE>`.

**Nicht berührt**
- Worker, Kernels, Prompts, Provider, Discovery, Convergence, Legacy;
- B2, Strukturkörper, Rollenorbits, Rollenkarten, Navigation;
- Datenbank, Migrationen.

**Tests, die zur Umsetzung gehören**
- **T-U (Unit):** für N-1 auf den bestehenden Fixtures (`test/career/result-inspector/fixture.ts`): Determinismus, `src`-Rückverfolgung, M-1 bis M-13.
- **T-S (SSR):** wie `test/career/three-modes/three-modes-ssr.test.tsx:182-193` für die neue Ansicht und alle Zustände.
- **T-W (Walk):** neuer Punkt V-04d (INVESTIGATION) ergänzt V-04a bis V-04c. Die alten bleiben unverändert grün.

---

## 10. Umsetzungsfolge für GRÜN (10) [PROPOSED, erst nach Owner-GO]

| Schritt | Inhalt |
|---|---|
| S-0 | Voraussetzung: Owner-GO für die Umsetzung. GRÜN beendet zuerst den laufenden Typografie-Sweep; beide berühren `SyntxField.tsx` und `sil-language.ts`. Keine parallelen Frontend-Änderungen. |
| S-1 | Basis = Integrationsstand **nach** der Owner-Entscheidung zum Typografie-Sweep, in eigenem Branch und eigenem Arbeitsverzeichnis, mit eigenem Labor. |
| S-2 | N-1 und die Unit-Tests T-U. Wer N-1 baut (GRÜN oder GELB als Vertragseigner), entscheidet der Owner (Q-5). |
| S-3 | N-2 bis N-8 nur aus N-1, ohne eigene Datenlogik. |
| S-4 | N-9 Copy EN/DE; kein Wort aus der Verbotsliste in §11 Check 05/06. |
| S-5 | T-S für jeden Zustand aus §5. |
| S-6 | Sichtprüfung im eigenen Stand-in-Labor bei 1920 × 1080, 1280 × 720 und der Mindestbreite des Körpers (340 px, `BODY_WIDTH` `:1629`); dazu Screenshots. |
| S-7 | Video-Walk 30/30 unverändert + V-04d; dann Übergabe an PINK. STOP vor der Integration. |

---

## 11. Unabhängige Validierung für PINK (11)

Keine dieser Prüfungen ist ausgeführt. Jede gilt gegen eine künftige Umsetzung.

| # | Prüfung | Eingabe | Erwarteter Zustand | Beobachtbar | Fehlschlag |
|---|---|---|---|---|---|
| 01 | Datentreue | Inspector-Antwort aus dem Stand-in-Labor (PERSON und PERSON × JOB) | Jeder Name, jede Definition und jedes Zitat in INVESTIGATION ist zeichengleich mit der Quelle | DOM-Text jedes `proposal-*` und `anchor-*` gegen `GET gemini-result` | Abweichung, Kürzung ohne Aufklapp-Volltext, erzeugter Text |
| 02 | Rückverfolgbarkeit | dieselbe Antwort | Jedes Element trägt `src`; der Sprung „roh“ zeigt genau diese Stelle | `src` auflösen und mit dem Element vergleichen | `src` fehlt oder zeigt woandershin |
| 03 | Grenzerhalt | Modi PERSON, JOB, PERSON × JOB; dazu eine PERSON-Analyse in PERSON × JOB | JOB = `NO_GEMINI`; keine Anforderung, Abdeckung oder Unterstützung in GEMINI OUTPUT; bei Abweichung `data-ui-mode-differs=true` | DOM | Anforderungen, Abdeckung oder SUPPORTED/WEAK im Körper; der UI-Modus überschreibt den gespeicherten |
| 04 | Abwesenheit, Unsicherheit | Archiv aus (NOT_RETAINED), Projektion `null` (Fixture), keine Relationen, keine Verwerfung | Alle passenden `absence-*` sichtbar; die vier festen Abwesenheiten immer | DOM | Ein leerer Bereich verschwindet still, oder Fehlen wird als Befund formuliert |
| 05 | Keine erfundene Konfidenz | beliebige Antwort mit `model_confidence` | Keine Zahl 0..1, kein Prozent, keine Stufe, kein Balken, keine Sterne, keine Rangfolge in INVESTIGATION (vorbehaltlich Q-1/Q-2) | DOM-Text und Attribute; Copy-Liste | Fund eines dieser Elemente |
| 06 | Keine erfundenen Relationen | Antwort mit 0 und mit n `proposedRelations` | Die Zahl der Relationen in der UI ist gleich `projection.relations.length` | `data-relation-count` | Abweichung; Linien oder Gruppen, die eine Relation andeuten, ohne Quelle |
| 07 | Nur lesen | Netzwerkprotokoll beim Öffnen, Lesen, Tab-Wechsel und Aufklappen | Genau ein GET `gemini-result` je LESEN, optional ein GET `gemini-exchanges`; kein POST/PUT/DELETE, kein Storage-Eintrag, kein Token in URL oder DOM-Attribut | HAR, `localStorage`, `sessionStorage`, Cookies, DOM | jeder Schreibzugriff, jeder zusätzliche Request, Token sichtbar |
| 08 | Roh-Inspector erreichbar | AVAILABLE | Die fünf Rohansichten unverändert, mit Testids und Texten wie §1.3; ORIGINAL byte-gleich (wie V-04a) | Walk V-04a bis V-04c, V-10a | ein Rohwert fehlt oder ist verändert |
| 09 | Navigation erhalten | Walk V-01 bis V-12, V-99 | 30/30 wie vor der Änderung | Walk-JSON | jeder neue Fehlschlag |
| 10 | Keine Regression der Rollenorbits | Rollenorbit- und Rollenkarten-Belege wie §3.45 bis §3.48 | gleiche Geometrie, gleiche Abstände | PINK-Messskripte | jede Abweichung |
| 11 | Unvollständige Daten | Fixtures: `sources = null`, Claim ohne Seite, Kandidat ohne Namen, unbekannter Status | `null` sichtbar als „nicht lesbar“, keine Seite erfunden, `UNSUPPORTED` sichtbar | SSR-Tests, DOM | Absturz, erfundene Werte, stilles Weglassen |
| 12 | EN und DE | beide Sprachen | gleiche Schlüssel, keine fehlenden Texte; Lesbarkeit nach dem Typografie-Sweep | Schlüsselvergleich, Screenshots | fehlender Schlüssel, abgeschnittener Text |
| 13 | Responsives Verhalten | 1920 × 1080, 1280 × 720, Körper bei 340 px | kein horizontales Scrollen im Körper; Zitate umbrechen | Screenshots, `scrollWidth ≤ clientWidth` | Überlauf, Überlappung |
| 14 | Kennzeichnung synthetischer Stände | Stand-in-Labor | Kopf zeigt `model` und `modelVersion` (`video-standin-001`) zeichengleich; kein Etikett, das echtes Gemini behauptet | DOM | Der Stand-in ist nicht erkennbar, oder es wird ein „live“-Etikett erfunden |

**Verbotsliste für Copy und Attribute** (zu Check 05/06):
- die Wörter „qualifiziert / qualified“, „geeignet / suitable“, „Kompetenz bestätigt / competence verified“;
- „Score“, „Ranking“, „Konfidenz / confidence“, „Match %“;
- „empfohlen / recommended“.

Erlaubt ist „verifiziert“ nur im festen Satz zum Zitat (E-4).

---

## 12. Risiken und offene Fragen (12)

**Risiken [DERIVED]**

| ID | Risiko |
|---|---|
| K-1 | **Autoritätssog durch Gestaltung.** Eine ruhige, gut lesbare Fähigkeitskarte wirkt geprüft. Gegenmittel: feste Fußzeile E-4, kein Grün am Vorschlag, Grün nur für die sha256-Integrität. |
| K-2 | **Dünne Belege wirken stark (O-LIVE-1).** Gerade unter Scope übernimmt Gemini die Anforderungsnamen. Eine schöne Darstellung verstärkt den Eindruck von Abdeckung. Gegenmittel: E-3/E-4, keine Abdeckung in GEMINI OUTPUT. |
| K-3 | **Datenschutz.** Die Hauptansicht macht Lebenslaufzitate prominenter. Bilder oder Filme davon sind wie F-LIVE-RAW zu behandeln: mit dem synthetischen CV unkritisch, mit echten Personen nicht freigegeben. |
| K-4 | **Verwechslung mit B2 und der Rollenebene (O-LIVE-2).** Drei Sichten auf eine Person: Vorschläge, B2-Namensabdeckung, Rollenebene (Legacy). Gegenmittel: GEMINI OUTPUT zeigt nur die erste. |
| K-5 | **Mergekonflikte mit dem Typografie-Sweep** in denselben Dateien. Gegenmittel: S-0/S-1, also nacheinander. |
| K-6 | **Walk und Handoff brechen**, wenn sich Standardansicht oder Testids ändern. Gegenmittel: R-1/R-2. |
| K-7 | **Umfang.** Viele Kandidaten und Claims machen den Körper lang. Gegenmittel: schrittweise Offenlegung (aufklappen), keine Kürzung mit Bedeutungsänderung. |
| K-8 | **Bestehende Autoritätsbezeichnung außerhalb von GEMINI OUTPUT:** Die öffentliche Analyse-Route antwortet fest mit `status: "VERIFIED"` (`app/api/career/analyses/[analysisId]/route.ts:62`). Dieser Status darf nicht in die semiontische Ansicht übernommen werden. Ob er selbst falsch etikettiert ist, ist eine eigene Owner-Frage (Q-8). |

**Offene Owner-Fragen [UNRESOLVED]**

| ID | Frage | Vorschlag |
|---|---|---|
| Q-1 | Darf `model_confidence` in der Hauptansicht erscheinen? | Nein; nur roh |
| Q-2 | Darf die vom Modell vorgeschlagene Stufe L1–L6 erscheinen? | Nein, oder nur als „Stufe laut Modell, ungeprüft“ in der aufgeklappten Detailzeile |
| Q-3 | Standardansicht beim Lesen: INVESTIGATION oder ORIGINAL? | ORIGINAL bis nach dem ersten Film; danach INVESTIGATION mit angepasstem Walk und Handoff |
| Q-4 | Rollentitel im Kopf unter Bindungsgleichheit (M-7)? | ja, sonst nur IDs |
| Q-5 | Wer baut N-1? | GELB, als Vertragseigner, mit Unit-Tests; GRÜN die Komponenten |
| Q-6 | Soll Legacy in irgendeiner Form in GEMINI OUTPUT erscheinen? | nein (G-B2); der feste Satz genügt |
| Q-7 | Soll die semiontische Ansicht im ersten Film vorkommen? | nein; der Film entsteht im VIDEO-FREEZE-Stand |
| Q-8 | Gesonderte Prüfung von `status: "VERIFIED"` in der öffentlichen Analyse-Route (K-8)? | als eigener Auftrag |

---

## 13. Exakte Quellcode-Referenzen (13)

| Bereich | Fundstelle |
|---|---|
| Inspector-Vertrag, Lesen, Lineage | `lib/career/result-inspector/reader.ts:11-57, 69-97, 99-156, 158-188` |
| Client, Zustände, Decoder, B2-Bindungswächter | `lib/career/result-inspector/client.ts:1-7, 12-18, 24-45, 47-58, 74-77` |
| Zugang | `lib/career/result-inspector/access.ts:3-25` |
| Archiv, Aufbewahrung | `lib/career/result-inspector/retention.ts:5-34`, `postgres-exchange-store.ts:11-22, 51-70` |
| Versuch, Zuordnung | `lib/career/result-inspector/attempt.ts:3-19` |
| Routen | `app/api/career/analyses/[analysisId]/gemini-result/route.ts:17-44`, `app/api/career/jobs/[jobId]/gemini-exchanges/route.ts:13-29`, `app/api/career/analyses/[analysisId]/route.ts:53-69`, `app/api/career/analyses/[analysisId]/investigation/route.ts:18-48` |
| Kernel-Schema, Kandidat, Claim | `lib/career/capability-core/schema.ts:4-50, 57-90, 98-124, 130-180` |
| Discovery-Typen, Antworthülle, Austausch | `lib/career/capability-core/discovery/types.ts:7-12, 15-20, 27-44` |
| Discovery-Laufzeit, Archivierung | `lib/career/capability-core/discovery/runtime.ts:40-75` |
| Coverage-Audit-Prüfung | `lib/career/capability-core/discovery/coverage-validator.ts:2-4` |
| Evidenzprüfung | `lib/career/capability-core/evidence-validator.ts:4-46` |
| Convergence | `lib/career/capability-core/convergence/schema.ts:4-18`, `types.ts:11-12`, `runtime.ts:50-53`, `canonicalizer.ts:12-15` |
| Projektion | `lib/career/capability-core/projection/reader.ts:6-22, 24-52, 66-148` |
| B2 | `lib/career/job-pool/selected-role-coverage.ts:7-71` |
| Rollenebene | `lib/career/job-pool/syntx-field-view-model.ts:146-147, 663-681` |
| GEMINI OUTPUT, UI | `app/components/career/demo/SyntxField.tsx:1601-1648, 1650-1720, 1794-1930, 2174, 2284` |
| Copy EN/DE | `lib/career/view-model/sil-language.ts:601-637, 1353-1389` |
| Bestehende Tests, Walk | `test/career/three-modes/three-modes-ssr.test.tsx:182-193`, `test/career/result-inspector/*`, `docs/career_analysis/evidence/video-readiness/scripts/video-walk.mjs:108-124, 211-216` |
| Handoff-Abhängigkeit | `docs/CONDYN_ANTIGRAVITY_VIDEO_HANDOFF_2026-10-19.md` §4 Schritte 11–15, 31, 34 |

---

## 14. Bewertung der Integrationsabhängigkeiten (14)

| Abhängigkeit | Stand | Folge |
|---|---|---|
| VIDEO FREEZE (Owner, 2026-10-19) | gilt für die Integration | keine Integration vor dem ersten Film ohne ausdrückliches Owner-Wort |
| Typografie-Sweep GRÜN (`frontend/ui-typography`, ab `35f00bc`) | in Arbeit, STOP vor der Integration | gleiche Dateien → die Umsetzung beginnt erst auf dem Stand nach der Owner-Entscheidung zum Sweep (S-0/S-1) |
| Video-Walk V-04a/V-04b/V-04c/V-10a/V-11 | erwartet ORIGINAL als Standard und die heutigen Testids | bei Q-3 = INVESTIGATION müssen Walk und Handoff vorher angepasst werden; sonst unverändert grün zu halten |
| Antigravity-Handoff §4 | nennt Labels und Testids von GEMINI OUTPUT | jede Label-Änderung macht den Handoff ungültig; neue Ansicht = neue Zeilen, alte unverändert |
| PINK-Suiten | `three-modes-ssr`, `result-inspector/*` | müssen unverändert grün bleiben; neue Fälle für die neue Ansicht |
| Build-Schalter `NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI` | nur Engineering-Builds | Die Ansicht ist ohne den Schalter unsichtbar (G-E2) |
| F-LIVE-RAW | offen beim Owner | gleiche Regel für Screenshots der neuen Ansicht (K-3) |
| Datenbank, Worker, Gemini | unberührt | keine Migration, kein Aufruf, keine Änderung |

---

**STOP.** Dieses Dokument ist der vollständige Architekturbericht. Umsetzung, Integration, Deployment und jeder Gemini-Aufruf brauchen ein ausdrückliches Owner-GO.
