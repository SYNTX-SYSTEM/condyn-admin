# CONDYN Career Analysis Protocol v1.0 — System-Manifest, Semiotische Architektur & TDD Walkthrough

> *"Charlottenburger Straßenstil trifft institutionelle Ingenieurspräzision. Wir hacken hier keine Prototypen zusammen, wir gießen unzerstörbare Gesetze in Code. Semiotisch sauber, mathematisch invariant, 100 % deterministisch."*

---

## 1. Semiotische Grundlegung & Charlottenburger Philosophie

In der Softwareentwicklung wird viel gelabert. Da werden irgendwelche JSONs durch die Gegend geschoben, LLMs halluzinieren sich Datenstrukturen zusammen, und am Ende knallt es in der UI, weil ein ID-Feld fehlt oder ein Prozentwert als String ankommt. Nicht bei CONDYN. Hier herrscht **Charlottenburger Straßenstil**: klare Kante, keine Kompromisse, institutionelle Härte.

### Semiotik des Codes: Signifikant vs. Signifikat
Semiotisch betrachtet ist Software eine Zeichenlehre. Ein ID-Prefix wie `CAP_101_TYPESCRIPT` oder ein Zod-Feld in unserer Datenbank ist der **Signifikant** (das Formzeichen, der Code-Träger). Die tatsächliche menschliche Fähigkeit, die berufliche Erfahrung oder die Organisationsstruktur einer Firma ist das **Signifikat** (der reale Gehalt, die Bedeutung in der physikalischen und ökonomischen Welt).

Wenn der Signifikant verrottet – durch unsaubere Typen, fehlende Beweise oder zirkuläre Graphen – verliert das System den Kontakt zur Realität (dem Signifikat). Deshalb haben wir für das CONDYN Career Analysis Protocol v1.0 eine **kompromisslose Zeichenordnung** etabliert:

1. **Die Root-Bifurkation (Die Große Spaltung):**
   Eine Analyse dient immer zwei Meistern: dem menschlichen Auge (hermeneutische Sinnfindung) und der maschinellen Wahrnehmung (graphische Berechnung, Topologie). Semiotisch trennen wir diese beiden Welten gnadenlos ab der Wurzel:
   * **`report_markdown` (Narrativer Signifikant):** Die freie, menschlich lesbare Erzählung. Hier darf das LLM rhetorisch glänzen, Zusammenhänge narrativ erklären und Zitate ausbreiten.
   * **`structured_data` (Berechenbarer Signifikant):** Die nackte, mathematische Wahrheit. Keine Prosa, kein Gelaber. Strikte Typen, geschlossene numerische Intervalle $[0.0, 1.0]$, referenziell abgesicherte Graphen.

2. **Die Universal Entity Grammar (Die 7 Gebote der Zeichenbildung):**
   Damit ein Zeichen in unserem Ökosystem überhaupt als gültig anerkannt wird, muss es der universellen Entitätsgrammatik gehorchen. Jedes Domänen-Objekt – egal ob Dokument, Fähigkeit, Firma oder Strategie – durchläuft zwingend diese 7 Stationen:
   ```
   [Identity] -> [Properties] -> [Relationships] -> [Evidence] -> [Confidence] -> [Validation]
   ```
   * *Wer keine Identity hat, existiert nicht.*
   * *Wer keine Properties hat, ist leer.*
   * *Wer keine Relationships hat, ist isoliert.*
   * *Wer kein Evidence (Beweis-Zitat) hat, ist eine Halluzination.*
   * *Wer keine Confidence hat, ist unberechenbar.*
   * *Wer kein Validation-Stamping hat, ist ungeprüft.*

---

## 2. Die 4 Säulen der CONDYN-Architektur

Unser System ist in vier exakt isolierte Schichten gegliedert. Jede Schicht hat eine einzige, glasklare Verantwortung. Es gibt kein Architektur-Leakage, keine Hintertüren:

```
+-----------------------------------------------------------------------------------+
| 1. SPECIFICATION LAYER (Die RFC-Verträge)                                         |
|    docs/career_analysis/CONDYN_ANALYSIS_PROTOCOL_SPEC_v1.0.md                     |
|    docs/career_analysis/CONDYN_ANALYSIS_TEST_SUITE_v1.0.md                        |
|    -> Bestimmt Was gebaut wird, niemals Wie. Verdeckt interne LLM-Mechaniken.   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 2. CANONICAL GRAMMAR & SCHEMA LAYER (Das Zod-Gesetzbuch)                          |
|    lib/career/schema.ts                                                           |
|    -> 10 ID-Präfixe | 12 Sektionen | [0.0, 1.0] Intervall | Enums                 |
|    -> Verwandelt die Semiotik in ausführbaren TypeScript/Zod-Code.                |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 3. RUNTIME INTEGRITY & REPAIR ENGINE (Die Härtungsmaschine)                       |
|    lib/career/validator.ts                                                        |
|    -> Phase 2.2 Zod-Parse -> 2.3 ID-Registry & Orphans -> 2.4 DAG Zyklen & Hier.  |
|    -> Phase 2.5 Nicht-mutative Graph-Reparatur -> 2.6 Offizielles Stamping        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 4. INFERENCE ADAPTER & PROMPT PIPELINE (Die Abstraktions-Schleuse)                |
|    lib/career/adapter.ts                                                          |
|    -> Prompt Builder (8 Invariance Rules) -> InferenceProvider Contract           |
|    -> Output Processor (Regex Markdown Stripper, Syntax Guard -> Validator)       |
+-----------------------------------------------------------------------------------+
```

---

## 3. Phase 0: Architektur-Freeze & Vertragswerk

In `docs/career_analysis/` wurden die beiden kanonischen Dokumente erschaffen, die als Single Source of Truth für alle späteren Sprints dienen:
* **`CONDYN_ANALYSIS_PROTOCOL_SPEC_v1.0.md`**: Definiert die 8 Invariance Rules, die Root-Bifurkation, die 12 Sektionen von `structured_data.analysis` (`metadata`, `pipeline`, `consistency`, `documents`, `capabilities`, `domains`, `organization_classes`, `organizations`, `roles`, `opportunities`, `strategies`, `search_queries`) und die entkoppelte Präsentationsschicht (`semantic_graph` vs. `ui_layout`).
* **`CONDYN_ANALYSIS_TEST_SUITE_v1.0.md`**: Ein vollständiger Testkatalog über 10 Domänen, der vorab festlegt, welche Eingaben welche Ausgaben erzeugen müssen und wann ein Test rot oder grün ist.

---

## 4. Step 1: Das Zod-Gesetzbuch (`lib/career/schema.ts`)

Im ersten Implementierungsschritt haben wir `zod` installiert und die gesamte Semiotik in harten Typen-Code gegossen (`lib/career/schema.ts`). Hier sind die entscheidenden architektonischen Meilensteine dieses Bausteins:

### Kanonische ID-Präfixe (`CanonicalIdSchema`)
Um zu verhindern, dass wild formatierte Strings („id_123“, „test-cap“) das Ökosystem verdrecken, haben wir einen zentralen Regex-Wächter gebaut:
```ts
export const CanonicalIdSchema = z.string().regex(
  /^(DOC|CLU|CAP|DOM|CLS|ORG|ROL|OPP|STR|QRY)_[A-Z0-9_-]+$/,
  "ID must start with a valid prefix (DOC_, CLU_, CAP_, DOM_, CLS_, ORG_, ROL_, OPP_, STR_, QRY_) and contain only alphanumeric characters, underscores, or hyphens."
);
```
Jedes Domänen-Array hat sein fest zugewiesenes Präfix:
* `DOC_` $\rightarrow$ Dokumente (`documents`)
* `CLU_` $\rightarrow$ Konsistenz-Cluster (`consistency.clusters`)
* `CAP_` $\rightarrow$ Fähigkeiten (`capabilities`)
* `DOM_` $\rightarrow$ Fachdomänen (`domains`)
* `CLS_` $\rightarrow$ Organisations-Klassen (`organization_classes`)
* `ORG_` $\rightarrow$ Konkrete Firmen (`organizations`)
* `ROL_` $\rightarrow$ Rollen (`roles`)
* `OPP_` $\rightarrow$ Verdeckte Chancen (`opportunities`)
* `STR_` $\rightarrow$ Einstiegsstrategien (`strategies`)
* `QRY_` $\rightarrow$ Suchabfragen (`search_queries`)

### Geschlossene numerische Intervalle $[0.0, 1.0]$
In sloppy Codebases schreiben Entwickler gerne mal Prozentwerte als Integer (`94`) oder Strings (`"94%"`). Semiotisch verfälscht das die Gewichtung in Algorithmen. Zod erzwingt bei CONDYN mathematische Invarianz:
```ts
export const ScoreSchema = z.number().min(0.0).max(1.0);
```
Ob `resonance_score`, `cohesion_score`, `weight` oder `overall_confidence` – jeder Wert außerhalb von $[0.0, 1.0]$ löst sofort einen fatalen Validierungsfehler aus.

### Die 12-teilige Matrix & Präsentations-Entkopplung
Das Zod-Schema sichert exakt ab, dass `structured_data` in `analysis` (reine Befunde) und `presentation` (reines Layout) zerfällt:
* In `presentation.semantic_graph` liegen Knoten (`nodes`) und Kanten (`edges`) mit physikalischen Kräften (`forces: { repulsion, attraction, center_gravity }`).
* In `presentation.ui_layout` liegen die visuellen Projektionshinweise: konzentrische Ringe (`concentric_rings`: `CORE_CAPABILITIES`, `PRIMARY_MARKET`, `ADJACENT_OPPORTUNITIES`, `LONG_TERM_HORIZON`), Prioritätsgruppen (`priority_groups`), und Farb-Tokens (`color_tokens`). **Wichtig:** Das UI-Layout darf niemals eigene Geschäftslogik erfinden, es konsumiert nur die IDs aus der Analyse!

---

## 5. Step 2 & 3: Die Härtungsmaschine (`lib/career/validator.ts`) & Gold Case 001

Ein Zod-Schema prüft nur Syntax und lokale Typen. Was aber, wenn Entität A auf Entität B verweist, die gar nicht existiert? Was, wenn Rollen in einer Endlosschleife aufeinander verweisen? Dafür haben wir in [lib/career/validator.ts](file:///home/codi/Entwicklung/condyn-admin/lib/career/validator.ts) eine **5-phasige Runtime Integrity Engine** gebaut und mit [test/gold/case_001_minimal_valid/](file:///home/codi/Entwicklung/condyn-admin/test/gold/case_001_minimal_valid) abgesichert.

### Phase 2.2: Schema Validation (Syntax & Grammar)
Die rohe Eingabe wird per `CanonicalCareerAnalysisSchema.safeParse(rawInput)` geprüft. Schlägt dies fehl, werden die Zod-Fehler in ein standardisiertes `ValidationIssue[]`-Format übersetzt (mit Codes wie `ERR_ID_PREFIX_INVALID` oder `ERR_SCORE_OUT_OF_BOUNDS`).

### Phase 2.3: Referential Integrity Check & Orphan Detection
Das System registriert alle Entitäten in einer zentralen `idRegistry = new Map<string, string>()`.
* **Duplikats-Wächter:** Taucht eine ID zweimal auf, kracht es mit `ERR_DUPLICATE_ENTITY_ID`.
* **Orphan-Check:** Prüft bei jedem Beleg (`evidence[].doc_id`) und jedem Cluster (`clusters[].doc_ids`), ob das referenzierte Dokument auch wirklich unter `documents` existiert. Wenn nicht $\rightarrow$ `ERR_ORPHAN_REFERENCE`.

### Phase 2.4: Semantic Rules & DAG Cycle Detection
Hier wird die semantische Logik der Karriere-Analyse geprüft:
1. **Rollen-Hierarchie:** Jede Rolle in `roles` muss mindestens eine Beziehung vom Typ `ROLE_IN_ORGANIZATION` besitzen. Eine schwebende Rolle ohne Firma ist ein Architekturfehler (`ERR_ROLE_HIERARCHY_DISCONNECTED`).
2. **Mandatory Evidence:** Keines der 8 Domänen-Arrays darf eine Entität mit leerem `evidence`-Array enthalten. Halluzinationen werden im Keim erstickt (`ERR_EVIDENCE_MISSING`).
3. **DAG (Directed Acyclic Graph) Zyklen-Erkennung:**
   Mittels einer Tiefensuche (DFS / Depth-First Search) mit `visited`-Set und `recursionStack` scannen wir den gesamten Beziehungs-Graphen. Wenn Kante A auf B zeigt, B auf C, und C wieder auf A, wird die Prüfung sofort abgebrochen (`ERR_CIRCULAR_REFERENCE_DETECTED`). Zirkuläre Graphen zerstören D3-Force-Berechnungen und enden in endlosen Rendering-Loops!

### Phase 2.5: Partial Graph Repair (Orphan Edge Removal)
Im Charlottenburger Straßenstil schmeißen wir nicht gleich die ganze Arbeit weg, wenn nur ein Reifen platt ist. Wenn ein LLM eine ansonsten brillante Analyse liefert, aber in einer Entität eine Kante auf eine nicht-existente `target_id` setzt (z. B. eine halluzinierte Capability), greift Phase 2.5:
* Die Engine filtert die kaputten Kanten aus dem `relationships`-Array heraus.
* Sie emittiert eine Warnung: `WARN_ORPHAN_EDGE_REMOVED`.
* **Das Heiligste Gesetz der Reparatur:** Bei einer solchen Graph-Bereinigung darf der Wert von `metadata.overall_confidence` **niemals** manipuliert, verfälscht oder nach oben/unten gerechnet werden! Die Integrität des ursprünglichen Befunds bleibt unangetastet.

### Phase 2.6: Validator Stamping
Hat eine Analyse alle Hürden gemeistert, drückt die Engine ihr den offiziellen Siegelstempel auf:
```ts
analysis.metadata.validation_state = "VERIFIED";
// Für jede einzelne Entität im System:
entity.validation = {
  status: "PASSED",
  timestamp: new Date().toISOString(),
  validator_version: "v1.0.0"
};
```
Ergebnis: Die Testsuite [test/career-analysis.test.ts](file:///home/codi/Entwicklung/condyn-admin/test/career-analysis.test.ts) verifiziert die vollständige Schema- und Validator-Spezifikation. Die konkrete Assertionsanzahl wird dynamisch zur Laufzeit durch die Vitest-CI ermittelt.

---

## 6. Step 4: Die Abstraktions-Schleuse (`lib/career/adapter.ts`)

Ein System, das fest an OpenAI oder Gemini verkabelt ist, ist nicht zukunftssicher. In Step 4 definieren wir in [lib/career/adapter.ts](file:///home/codi/Entwicklung/condyn-admin/lib/career/adapter.ts) eine model-agnostische Schleuse, die den KI-Anbieter komplett vom Validator isoliert. Absicherung erfolgt durch [test/career-adapter.test.ts](file:///home/codi/Entwicklung/condyn-admin/test/career-adapter.test.ts).

### Step 4.1: Prompt Builder (`buildCareerAnalysisPrompt`)
Diese Funktion nimmt ein Array von Eingabedokumenten (`DocumentInput[]`) und erzeugt das kanonische `PromptBuilderOutput`:
* **`systemPrompt`**: Hämmerte dem LLM die **8 Invariance Rules** in den System-Speicher (Rule 1: Keine Halluzinationen, Rule 2: Root-Bifurkation, Rule 3: Universal Entity Grammar, Rule 4: 12 Sektionen, Rule 5: $[0.0, 1.0]$ Schranken, Rule 6: ID-Präfixe, Rule 7: UI-Entkopplung, Rule 8: Zod-Syntax).
* **`userPrompt`**: Formatiert den Input unter dem Protokoll-Vertrag **`PC-CONDYN-CAP-v1.0`**, gibt den `Document Count` aus und setzt die unmissverständliche Charlottenburger Ansage ans LLM:
  > *"WICHTIG: Bitte ausschließlich valides JSON als Ausgabe liefern. Kein Markdown Code-Wrapper! DO NOT wrap the output in \`\`\`json or any markdown block. Return ONLY the raw JSON object string starting with { and ending with }."*

### Step 4.2: Inference Provider Contract (`InferenceProvider`)
Wir abstrahieren die KI-Schnittstelle als reines Interface:
```ts
export interface InferenceProvider {
  execute(prompt: PromptBuilderOutput): Promise<string>;
}
```
* Dazu kommt die Klasse `MockInferenceProvider` für TDD, die im Konstruktor einen Raw-String entgegennimmt und bei der Ausführung strikt prüft, ob `systemPrompt` und `userPrompt` vorhanden und nicht leer sind (wirft ansonsten `ERR_INVALID_PROMPT_BUNDLE`).
* **Die semiotische Konsequenz:** Ob wir morgen `GeminiProvider`, `ClaudeProvider`, `OpenAIProvider` oder ein lokales Llama-3 Modell nutzen – die Signifikanten der KI werden immer durch denselben Trichter gepresst.

### Step 4.3: LLM Output Processor (`processLlmOutput`)
LLMs halten sich trotz strengster Verbote nicht immer an Regeln und packen ihr JSON gerne mal in Markdown-Codeblocks (````json ... ````) oder quatschen noch ein "Here is your analysis:" davor. Unser Output Processor säubert die Rohdaten brutal und zuverlässig:
1. **Markdown Fence Stripping:** Mittels des Regex `/```(?:json)?\s*([\s\S]*?)\s*```/i` wird der innere Block aus Backticks herausgeholt.
2. **Brace Extractor Fallback:** Gibt es keine Backticks, sucht der Code die erste `{` und die letzte `}` und schneidet exakt diesen Bereich aus.
3. **Syntax Guard:** Schlägt `JSON.parse(cleanString)` fehl, stürzt nicht die App ab, sondern der Processor liefert einen sauberen `ValidationResult` mit Code `ERR_JSON_SYNTAX_INVALID`.
4. **Handoff:** Das saubere JSON wird sofort an `validateCareerAnalysis(...)` übergeben – wo Zod-Prüfung, ID-Registrierung, DAG-Check, Reparatur und Stamping voll automatisch ablaufen!

Ergebnis: Die Testsuite [test/career-adapter.test.ts](file:///home/codi/Entwicklung/condyn-admin/test/career-adapter.test.ts) verifiziert Prompt-Contract, Provider-Schnittstelle und Output Processing.

---

## 7. Kontinuierliche Verifikation & Test-Spezifikation

Das Architekturmanifest definiert keine flüchtigen Assertionszahlen, sondern verankert die zu prüfenden Domänen. Die Test-Suiten verifizieren kontinuierlich:

| Komponente | Test-Datei | Validierte Domäne / Scope |
| :--- | :--- | :--- |
| **Zod Schema & Validator** | `test/career-analysis.test.ts` | Schema-Invarianz, Referenzielle Integrität, Semantik, DAG-Zyklen, Reparatur, Stamping |
| **LLM Adapter & Pipeline** | `test/career-adapter.test.ts` | Prompt-Contract-Konstruktion, Provider-Abstraktionsvertrag, Output Processing & Parsing |
| **E2E Inference Pipeline** | `test/career-pipeline.test.ts` | Sequentielle DOC_-ID Vergabe, Custom-ID Zod/Präfix Guard, E2E Orchestrierung bis VERIFIED, Orphan & Syntax Error Propagierung |
| **Persistence & Repository** | `test/career-repository.test.ts` | Kanonische `analysis_id`, Verified-Type & Runtime Guard, Immutability, titelfreie Index-Deskriptoren |
| **Perception Mapper** | `test/career-perception.test.ts` | 1:1 Projection Model, Stempel-Wächter (`ERR_UNVERIFIED_ANALYSIS_PROJECTION`), deterministische Zirkulär-Koordinaten |
| **View Model Builder** | `test/career-view-model.test.ts` | Framework-unabhängige visuelle Semantik (Style tokens, Tooltips, Groups, Collapse flags), 0 % Engine-Schmutz |
| **Radial Layout Layer** | `test/career-layout.test.ts` | Engine-neutrale Zirkulär-Trigonometrie (`x`, `y`), Center Node auf `{0,0}`, 0 % ReactFlow/D3-Schmutz |

*Die konkrete Test- und Assertionsanzahl wird dynamisch zur Laufzeit in der Vitest-CI ermittelt und protokolliert (aktueller Meilenstein: 7 Testsuiten / 43 Tests fehlerfrei passierend).*

---

## 8. Step 4.4: Die Implementierte E2E Inference Pipeline (`lib/career/pipeline.ts`)

Bevor die UI-Schicht angedockt wird, haben wir in [lib/career/pipeline.ts](file:///home/codi/Entwicklung/condyn-admin/lib/career/pipeline.ts) die lückenlose **End-to-End-Pipeline** im Charlottenburger Straßenstil geschmiedet und durch [test/career-pipeline.test.ts](file:///home/codi/Entwicklung/condyn-admin/test/career-pipeline.test.ts) abgesichert:

### Document Loader (`loadDocuments`)
Der Loader nimmt rohe Eingaben (Text, Markdown, Strings) entgegen und erzwingt institutionelle Ordnung:
* **Sequentielle Automatik:** Wenn keine ID geliefert wird, vergibt der Loader deterministisch 3-stellig gepaddete IDs: `DOC_001`, `DOC_002`, `DOC_003`.
* **Custom-ID Guard:** Wird eine ID geliefert, prüft Zod strikt gegen das `CanonicalIdSchema`. Zusätzlich wird hart verifiziert, dass die ID mit `DOC_` beginnt (ein Versuch, ein Dokument mit `CAP_001` einzuschleusen, endet sofort mit `ERR_INVALID_DOCUMENT_ID`).

### E2E Orchestrator (`executeCareerAnalysisPipeline`)
Diese zentrale Schnittstelle verbindet alle 4 Säulen der Architektur zu einem einzigen, deterministischen Durchlauf:
```
[Raw Documents] -> loadDocuments -> buildCareerAnalysisPrompt -> InferenceProvider.execute -> processLlmOutput -> [VERIFIED Canonical Model]
```
1. Ingestion und Stempelung der Dokumente mit kanonischen IDs.
2. Formattierung des Prompt-Bundles unter Vertrag `PC-CONDYN-CAP-v1.0` mit den 8 Invariance Rules.
3. Model-agnostische Ausführung über das `InferenceProvider`-Interface (z. B. `MockInferenceProvider`, Gemini, OpenAI).
4. Regex-sichere Bereinigung und phasenreine Validierung (Schema $\rightarrow$ Registry/Orphans $\rightarrow$ Semantik/DAG-Zyklen $\rightarrow$ Graph-Reparatur $\rightarrow$ Stamping).
5. Rückgabe des garantiert sauberen `ValidationResult<CanonicalCareerAnalysis>` mit Zustand `VERIFIED`.

---

## 9. Step 4.5: Persistence & Repository Layer (`lib/career/repository.ts` & `lib/career/types.ts`)

Zwischen der E2E-Pipeline und dem Frontend sorgt der Repository-Layer dafür, dass unsere visuelle Präsentationsschicht vollständig von der konkreten Datenbanktechnologie (PostgreSQL, Supabase, Prisma, MongoDB oder InMemory für TDD) entkoppelt ist.

### Die 3 Charlottenburger Persistenz-Gesetze
1. **Kanonische `analysis_id` (`ANL_...`):** Die Identität einer Analyse wird niemals von der Datenbank erfunden. Sie ist als `analysis_id` fest im kanonischen Metadata-Header in [lib/career/schema.ts](file:///home/codi/Entwicklung/condyn-admin/lib/career/schema.ts) verankert und dient als Primary Key im gesamten System.
2. **Compile-Time & Runtime Verified Guard:** In [lib/career/types.ts](file:///home/codi/Entwicklung/condyn-admin/lib/career/types.ts) ist der gebrandete Lifecycle-Typ `VerifiedCareerAnalysis` verankert. Das Repository akzeptiert via `save(analysis: VerifiedCareerAnalysis)` ausschließlich Objekte, die den Stempel `validation_state === "VERIFIED"` tragen. Wer versucht, ungeprüften Schmutz an der Typ-Schranke vorbei einzuschleusen, scheitert an einem harten Runtime-Guard (`ERR_UNVERIFIED_ANALYSIS_PERSISTENCE`).
3. **Schlanke Index-Deskriptoren (`list()` ohne UI-Schmutz):** Da das Protokoll keinen kanonischen Titel einer Analyse garantiert, liefert `list()` ausschließlich reine, unberührte Fakten des Analyse-Laufs zurück:
   ```ts
   export interface AnalysisIndexEntry {
     analysisId: string;
     createdAt: string;
     validationState: "VERIFIED";
     overallConfidence: number;
   }
   ```
   Keine UI-Strukturen, keine erfundenen Titel, keine Verschmutzung des kanonischen Index!

---

## 10. Step 5.1: Der implementierte Topology Projection Mapper (`lib/career/perception.ts`)

Mit dem **Backend Architecture Freeze v1.0** im Rücken haben wir die erste Brücke ins Frontend geschlagen: Eine strikt entkoppelte Abbildungsschicht ("Noch kein React, kein D3, kein UI. Nur kanonisches Modell $\rightarrow$ Projection Model").

### Die Charlottenburger Grundregel für Step 5
> *"Die UI-Schicht ist ein strunzdummer Konsument ('dumb consumer'). Sie führt keinerlei Inferenz durch, erfindet keine Entitäten dazu und mutiert niemals den gestempelten Score!"*

1. **Stempel-Wächter:** Funktion `projectTopology(analysis)` verweigert die Projektion sofort mit `ERR_UNVERIFIED_ANALYSIS_PROJECTION`, wenn das übergebene Analyse-Objekt nicht den Stempel `metadata.validation_state === "VERIFIED"` trägt.
2. **1:1 Immutability & Deterministische Zirkulär-Koordinaten:** Labels, Weights und Farbtoken werden unberührt übernommen. Die Koordinaten `position: { x, y }` werden pro Ring (`radius = ringIndex * 250`) trigonometrisch berechnet und auf Integer-Pixel gerundet – garantiert zu **100 % deterministisch** bei jedem Aufruf!

---

## 11. Step 5.2: Der implementierte View Model Builder (`lib/career/view-model.ts`)

Um sicherzustellen, dass unser Frontend genauso modellagnostisch und entkoppelt bleibt wie unser Backend LLM-agnostisch ist, haben wir eine framework-unabhängige Zwischenschicht eingezogen.

### Die 3 Charlottenburger View-Model-Gesetze
1. **0 % Framework-Schmutz:** Das generierte View Model (`CareerViewModel`, `ViewNode`, `ViewEdge`, `ViewGroup`) ist reines, serialisierbares JSON. Es existieren keinerlei Abhängigkeiten zu React, ReactFlow, D3 oder dem DOM. Alle engine-spezifischen Variablen (wie `x`, `y`, `fx`, `fy`, `position`, `data`, `sourceHandle`, `targetHandle`) sind strikt verboten!
2. **Semantisch-projektive Anreicherung:** Die Funktion `buildViewModel(projection)` leitet aus der reinen Projektion deterministisch visuelle Semantik ab: Form-Token (`shape: "CIRCLE" | "HEXAGON" | "RECTANGLE" | "PILL"`), Kanten-Stile (`strokeStyle: "SOLID" | "DASHED"`, `strokeWidth`, `animated`), verständliche Tooltip-Strings und UI-Steuerflags (`isCollapsible`, `isExpandedByDefault`).
3. **Keine erfundene Fachlogik:** Der View Model Builder erfindet keine Scores oder Entitäten dazu. Er wandelt lediglich die bereits verifizierte Struktur in eine einheitliche Sprache um, die von beliebigen Rendering-Engines konsumiert werden kann.

---

## 12. Step 5.3a: Die implementierte Radial Layout Layer (`lib/career/layout.ts`)

Bevor konkrete Rendering-Adapter (ReactFlow oder D3) angedockt werden, haben wir mit der **Engine-Neutral Radial Layout Layer** sichergestellt, dass jegliche Trigonometrie und Koordinatenberechnung ($x, y$) vollständig framework-unabhängig aus der Struktur des View Models abgeleitet wird.

### Die 3 Charlottenburger Layout-Gesetze
1. **0 % ReactFlow/D3-Schmutz:** Das generierte `CareerLayoutModel` enthält weder `position` noch `data`, `sourceHandle`, `targetHandle`, `fx` oder `fy`. Es fügt den sauberen View-Model-Nodes ausschließlich die berechneten ganzzahligen Pixelkoordinaten `x` und `y` hinzu!
2. **Deterministische Zirkulär-Trigonometrie:** Der Center Node (`centerNodeId`) sitzt unumstößlich auf `{ x: 0, y: 0 }`. Alle anderen Nodes verteilen sich nach ihren Ring-Radien (`radius = ringIndex * 250`) auf Winkel und werden deterministisch auf Integer gebändigt.
3. **100 % Strukturerhalt:** Die Anzahl der Nodes, Edges und Groups sowie deren IDs und semantischen Anreicherungen bleiben zu 100 % intakt.

---

## 13. Ausblick: Step 5.3b–5.5 — Rendering Adapters & React Components

In den nächsten Schritten docken wir schlanke Adapter an unser reines Layout Model an. Die gesamte Schichtenfolge des CONDYN Systems lautet nun makellos:
```
SPEC -> Schema -> Types -> Validator -> Adapter -> Pipeline -> Repository -> Perception -> View Model -> Radial Layout -> [ReactFlow / D3 Adapter] -> UI
```
1. **Step 5.3b (`lib/career/adapters/react-flow.ts`):** Strunzdummes 1:1 Mapping vom Layout Model in ReactFlow Nodes (`position: { x, y }`) und Edges ohne jegliche Trigonometrie!
2. **Step 5.4 (`lib/career/adapters/d3-force.ts`):** 1:1 Mapping vom Layout Model in D3 Simulation Graphs.
3. **Step 5.5 (`app/components/career/*`):** Strunzdumme Präsentations-Komponenten (`CareerGraph`, `CareerNode`, `CareerSidebar`, `CareerInspector`), die ausschließlich den fertigen Adapter-Output visualisieren.


