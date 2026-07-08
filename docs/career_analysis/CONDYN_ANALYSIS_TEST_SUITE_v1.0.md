# CONDYN CAREER ANALYSIS PROTOCOL v1.0
## EXECUTABLE CONFORMANCE TEST SUITE (`TS-CONDYN-CAP-v1.0`)
**Dokument-ID:** `TS-CONDYN-CAP-v1.0`  
**Status:** ARCHITECTURE FREEZE v1.0 / KANONISCHER PRÜFVERTRAG  
**Gültigkeitsbereich:** Runtime Integrity Validator, CI/CD-Pipeline, TDD-Prüfinstanz, Regression Testing Engine  
**Stil & Diktion:** Charlottenburger Systematik (Höchste normative Strenge, keine prozedurale Toleranz, relationale Invarianz, unbestechliche Präzision)

---

## 1. EXECUTIVE MANDATE & TEST METHODOLOGY
Diese Test-Suite ist das **exekutive Test- und Prüfgesetz** des CONDYN Career Analysis Protocols v1.0. Ein Modell, eine Pipeline oder ein UI-Renderer gilt erst dann als konform und produktionsreif, wenn alle 10 Test-Domänen zu 100 % fehlerfrei bestanden werden.

Ab dem Architecture Freeze v1.0 gilt das Eiserne Gesetz: **Jede Änderung an der Spezifikation muss durch einen konkreten, fehlgeschlagenen Testfall oder eine harte systemische Anforderung begründet sein.**

---

## 2. DIE 10 TEST-DOMÄNEN (KONKRETE TESTFÄLLE)

### DOMÄNE 1: SPECIFICATION & VERSION VALIDATION
- **TEST-01-01 (Trilaterale Version Compliance & Major Compatibility):**
  - *Objective:* Verifikation der drei orthogonalen Versionsstempel im Header.
  - *Input:* JSON mit `analysis.metadata`: `protocol_version`, `schema_version`, `prompt_contract_version`.
  - *Pass Criteria:* Major-Versionen stimmen exakt überein (`protocol_version.split('.')[0] === "1"` und `schema_version.split('.')[0] === "1"`). Minor- und Patch-Versionen dürfen höher oder gleich sein (`v1.0.0`, `v1.1.0`), um Graceful Degradation zu ermöglichen. `prompt_contract_version === "PC-CONDYN-CAP-v1.0"`.
  - *Failure Criteria:* Abweichung der Major-Version (z. B. `2.0.0`) oder fehlerhafter Prompt Contract $\rightarrow$ Rejection (`ERR_VERSION_MISMATCH`).
- **TEST-01-02 (Mandatory Bifurcation in Structured Data):**
  - *Objective:* Prüfung der Wurzelkreise im Output.
  - *Pass Criteria:* Keys `report_markdown` und `structured_data` existieren auf Top-Level. Das Objekt `structured_data` trennt sich sauber in exakt zwei orthogonale Äste: `analysis` und `presentation`.
  - *Failure Criteria:* Fehlen eines Wurzelkreises oder Vermischung von `analysis` und `presentation` auf Top-Level $\rightarrow$ Rejection (`ERR_SCHEMA_BIFURCATION_MISSING`).
- **TEST-01-03 (Completeness of Canonical Sections):**
  - *Objective:* Nachweis, dass alle 12 vorgeschriebenen Top-Level-Sektionen (3 Objekte, 9 Arrays) in `analysis` präsent sind.
  - *Pass Criteria:* Keys `metadata`, `pipeline`, `consistency` (Objekte) sowie `documents`, `capabilities`, `domains`, `organization_classes`, `organizations`, `roles`, `opportunities`, `strategies`, `search_queries` (Arrays) existieren. Hinweis: `evidence` ist kein Top-Level-Key, sondern intrinsisch in den Entitäten verankert.
  - *Failure Criteria:* Fehlen einer Top-Level-Sektion $\rightarrow$ Rejection (`ERR_MANDATORY_SECTION_MISSING`).

### DOMÄNE 2: SYNTACTIC & ID INTEGRITY VALIDATION
- **TEST-02-01 (Strict Syntactic JSON Validity):**
  - *Objective:* Garantie syntaktisch makellosen RFC-8259-JSONs.
  - *Pass Criteria:* String lässt sich ohne SyntaxError in ein AST-Objekt überführen.
  - *Failure Criteria:* SyntaxError beim Parsing $\rightarrow$ Abbruch (`ERR_JSON_SYNTAX_INVALID`).
- **TEST-02-02 (Stable Canonical ID Prefixes):**
  - *Objective:* Prüfung der Entitäts-IDs auf verbindliche Präfixe.
  - *Pass Criteria:* Jede ID matcht auf `^(DOC|CLU|CAP|DOM|CLS|ORG|ROL|OPP|STR|QRY)_[A-Z0-9_]+$`.
  - *Failure Criteria:* Illegales Präfix $\rightarrow$ Rejection (`ERR_INVALID_ID_PREFIX`).
- **TEST-02-03 (Zero Duplicate Entity Tolerance):**
  - *Objective:* Verhinderung von ID-Kollisionen.
  - *Pass Criteria:* `ids.length === new Set(ids).size`.
  - *Failure Criteria:* Doppelte ID $\rightarrow$ Rejection (`ERR_DUPLICATE_ENTITY_ID`).
- **TEST-02-04 (Referential Integrity of Edges via Partial Graph Repair):**
  - *Objective:* Zero Orphan Tolerance im endgültigen Graphen.
  - *Pass Criteria:* $\forall \text{id} \in \text{Edges}: \text{id} \in \text{KnownIDs}$.
  - *Failure Action / Graceful Recovery:* Verweist eine Kante auf eine nicht existierende ID, führt dies NICHT zur kompletten Rejection der Payload, sondern triggert eine Warnung (`WARN_ORPHAN_EDGE_REMOVED`) und löscht die verwaiste Kante deterministisch aus dem Graphen (Partial Graph Repair).
- **TEST-02-05 (ID Immutability Verification):**
  - *Objective:* Garantie, dass bei einer Re-Analyse desselben Korpus bekannte IDs nicht überschrieben oder recycelt werden.
  - *Pass Criteria:* Keine historische ID aus Snapshot $T_0$ wird für eine abweichende semantische Entität in $T_1$ wiederverwendet.
  - *Failure Criteria:* ID-Recycling $\rightarrow$ Rejection (`ERR_ID_RECYCLED_VIOLATION`).

### DOMÄNE 3: UNIVERSAL ENTITY GRAMMAR & EVIDENCE VALIDATION
- **TEST-03-01 (Universal Entity Grammar Compliance):**
  - *Objective:* Verifikation der 7 ontologischen Kardinaleigenschaften.
  - *Pass Criteria:* Jedes Objekt besitzt zwingend `entity_id`, `identity`, `properties`, `relationships`, `evidence`, `confidence`, `validation`. Im Rohzustand muss `validation.status === "UNVERIFIED"` gelten.
  - *Failure Criteria:* Abweichung oder fehlendes Kardinalfeld $\rightarrow$ Rejection (`ERR_GRAMMAR_VIOLATION`).
- **TEST-03-02 (Mandatory Embedded Evidence Guarantee):**
  - *Objective:* Durchsetzung von *Embedded Evidence* für Fähigkeiten, Organisationen, Rollen und Strategien.
  - *Pass Criteria:* `evidence.length > 0` UND valide Subfelder `doc_id`, `location`, `context_quote` (Länge $> 10$).
  - *Failure Criteria:* Leeres Evidence-Array oder zu kurzes Zitat $\rightarrow$ Entität verbleibt auf `REJECTED` (`ERR_EVIDENCE_MISSING`).
- **TEST-03-03 (Numeric vs. String Properties & Interval Bounds Check):**
  - *Objective:* Garantie zulässiger numerischer Score-Werte im Intervall $[0.0, 1.0]$ sowie korrekter Datentypen.
  - *Pass Criteria:* Alle numerischen Scores (`confidence`, `weight`, `resonance_score`, `cohesion_score`, `evidence_score`) liegen im Intervall $[0.0, 1.0]$. Textuelle Attribute (`country_iso`, `industry_enum`, `title`, `query`) sind valide Strings oder kanonische Enums. Integer-Prozentwerte wie 94 sind verboten.
  - *Failure Criteria:* Wert unter 0.0, über 1.0, ganzzahliger Prozentwert oder falscher Datentyp $\rightarrow$ Rejection (`ERR_SCORE_OUT_OF_BOUNDS`).
- **TEST-03-04 (Evidence Score Quantification Check):**
  - *Objective:* Nachweis, dass jedes Evidenz-Zitat mit einem numerischen `evidence_score` quantifiziert ist.
  - *Pass Criteria:* $\forall \text{ev} \in \text{evidence}: typeof \text{ev.evidence\_score} === "number" \land 0.0 \le \text{ev.evidence\_score} \le 1.0$.
  - *Failure Criteria:* Fehlender oder ungültiger Score $\rightarrow$ Rejection (`ERR_EVIDENCE_SCORE_INVALID`).

### DOMÄNE 4: STRUCTURAL CONSISTENCY & COHESION VALIDATION
- **TEST-04-01 (Cohesion Score Calculation & Bounds):**
  - *Objective:* Prüfung der Kohäsions-Scores.
  - *Pass Criteria:* `overall_cohesion_score` zwischen 0.0 und 1.0; jedes Cluster referenziert eine valide `doc_id`.
  - *Failure Criteria:* Inkonsistentes Cluster-Array $\rightarrow$ Rejection (`ERR_CONSISTENCY_SCHEMA_INVALID`).
- **TEST-04-02 (Outlier Isolation Verification):**
  - *Objective:* Prüfung der automatischen Aussonderung bei Score $< 0.30$.
  - *Pass Criteria:* ID des Outliers ist in `consistency.outlier_doc_ids` enthalten und taucht in keiner Kante einer Fähigkeit auf.
  - *Failure Criteria:* Outlier fließt unmarkiert in Fähigkeits-Rekonstruktion ein $\rightarrow$ Failure (`ERR_OUTLIER_NOT_ISOLATED`).

### DOMÄNE 5: SEMANTIC PURITY & PRESENTATION READ-ONLY INVARIANCE
- **TEST-05-01 (Zero Visual Layout Pollution in Analysis Layer):**
  - *Objective:* Nachweis, dass der fachliche Ast frei von Styling-Daten ist.
  - *Pass Criteria:* Keine Keys/Values enthalten Regex-Muster wie `#([0-9A-Fa-f]{6})`, `px`, `rem`, `layout`, `ring_index`.
  - *Failure Criteria:* Styling-Attribut im Fachmodell $\rightarrow$ Rejection (`ERR_SEMANTIC_POLLUTION_UI`).
- **TEST-05-02 (Zero Domain Reasoning in Presentation Layer):**
  - *Objective:* Nachweis, dass der Ast `presentation` frei von fachlichen Erklärungen ist.
  - *Pass Criteria:* Keine Felder wie `significance_explanation`, `context_quote` oder Textblöcke $> 100$ Zeichen im Layout-Ast.
  - *Failure Criteria:* Fachliche Erklärungen im Layout-Ast $\rightarrow$ Rejection (`ERR_PRESENTATION_POLLUTION_DOMAIN`).
- **TEST-05-03 (Presentation Read-Only Invariance Check):**
  - *Objective:* Beweis, dass der Render-Prozess im Frontend niemals Attribute in `analysis` mutiert.
  - *Pass Criteria:* Deep-Freeze-Prüfung (`Object.isFrozen(structured_data.analysis) === true` während der Render-Phase).
  - *Failure Criteria:* Mutation eines fachlichen Feldes durch UI-Komponenten $\rightarrow$ Runtime Exception (`ERR_READ_ONLY_VIOLATION`).

### DOMÄNE 6: RUNTIME INTEGRITY & TAXONOMY NORMALIZATION
- **TEST-06-01 (Canonical ISO Country Code Compliance):**
  - *Objective:* Strikte ISO-Normierung für offline UI-Filtering.
  - *Pass Criteria:* `country_iso` entspricht einem zweistelligen ISO-3166-1-Alpha-2 Großbuchstaben-Code (`DE`, `CH`, `US`).
  - *Failure Criteria:* Freitext (`"Germany"`, `"DEU"`) $\rightarrow$ Rejection (`ERR_NON_CANONICAL_ISO_COUNTRY`).
- **TEST-06-02 (Canonical Industry Enum Matching):**
  - *Objective:* Unterbindung von LLM-Freitext bei Branchenbezeichnern.
  - *Pass Criteria:* $\forall \text{org} \in \text{organizations}: \text{org.properties.industry\_enum} \in \text{EnumCatalog}$.
  - *Failure Criteria:* Freitext-Branche $\rightarrow$ Rejection (`ERR_NON_CANONICAL_INDUSTRY_ENUM`).
- **TEST-06-03 (Circular Reference Rejection in DAGs):**
  - *Objective:* Graphentheoretischer Zyklentest für `DERIVED_FROM`, `BELONGS_TO_CLASS` und `ROLE_IN_ORGANIZATION`.
  - *Pass Criteria:* Der gebildete Graph ist ein gerichteter azyklischer Graph (DAG).
  - *Failure Criteria:* Ein Zyklus wird detektiert $\rightarrow$ Rejection (`ERR_CIRCULAR_REFERENCE_DETECTED`).
- **TEST-06-04 (Canonical Organizational Hierarchy Parity):**
  - *Objective:* Verifikation der Kette `Class -> Organization -> Role`.
  - *Pass Criteria:* $\forall \text{rol} \in \text{roles}: \exists \text{rel} \in \text{rol.relationships}: \text{rel.relation\_type} === "\text{ROLE\_IN\_ORGANIZATION}" \land (\text{rel.target\_id.startsWith}("\text{ORG\_}") \lor \text{rel.target\_id.startsWith}("\text{CLS\_}"))$.
  - *Failure Criteria:* Isolierte Rolle ohne Firmenbindung $\rightarrow$ Rejection (`ERR_ROLE_HIERARCHY_DISCONNECTED`).
- **TEST-06-05 (Validator Stamping vs. Confidence Separation):**
  - *Objective:* Nachweis, dass der Validator ausschließlich Daten verifiziert und niemals den analytischen Confidence-Wert berechnet oder mutiert.
  - *Pass Criteria:* Nach dem Prüfdurchlauf setzt der Validator ausschließlich `validation.status = "PASSED"` an jeder Entität und `metadata.validation_state = "VERIFIED"` im Header. Der Wert `metadata.overall_confidence` ist identisch mit der Eingabe vor der Validierung.
  - *Failure Criteria:* Mutation von `overall_confidence` durch die Prüfinstanz $\rightarrow$ Failure (`ERR_VALIDATOR_CONFIDENCE_MUTATION`).

### DOMÄNE 7: PRESENTATION TOPOLOGY & ZERO FRONTEND INFERENCE
- **TEST-07-01 (Semantic Graph Parity with Knowledge Model):**
  - *Objective:* Prüfung der Knotendeckung zwischen semantischem Graphen und Analysemodell.
  - *Pass Criteria:* Das Set der Knotenkennungen im Graphen ist eine exakte Teilmenge oder Deckungsgleich mit den verifizierten Entitäten aus `analysis`.
  - *Failure Criteria:* Knoten im Graphen ohne Fachmodell-Entsprechung $\rightarrow$ Rejection (`ERR_GRAPH_NODE_MISMATCH`).
- **TEST-07-02 (UI Layout Concentric Ring Topology):**
  - *Objective:* Prüfung der Anordnung für das Kraftfeld-Rendering.
  - *Pass Criteria:* Jedes Ring-Objekt enthält einen ganzzahligen `ring_index` ($\ge 0$) und valide `node_ids`. Zentrum (`center_node_id`) ist primär verankert.
  - *Failure Criteria:* Lücken im Ring-Index oder fehlende Knoten $\rightarrow$ Rejection (`ERR_RING_TOPOLOGY_INVALID`).
- **TEST-07-03 (Zero Frontend Inference Rule):**
  - *Objective:* Garantie, dass das Frontend keine impliziten Kanten berechnet oder Entitäten ad-hoc umgruppiert.
  - *Pass Criteria:* Die im D3-Kraftfeld oder ReactFlow rendered Kanten und Cluster entsprechen zu 100 % der Schnittmenge aus `semantic_graph.edges` und `ui_layout.priority_groups`.
  - *Failure Criteria:* Frontend-seitig generierte Kanten oder ungeregelte Visual-Cluster $\rightarrow$ Failure (`ERR_FRONTEND_INFERENCE_DETECTED`).

### DOMÄNE 8: HUMAN REPORT MARKDOWN ARCHITECTURE
- **TEST-08-01 (GFM Structure and Heading Architecture):**
  - *Objective:* AST-Analyse des Markdown-Verlaufs.
  - *Pass Criteria:* String beginnt mit genau einer `# H1` und enthält alle obligatorischen `## H2` Sektionen.
  - *Failure Criteria:* Fehlende Pflichtsektionen oder Format-Chaos $\rightarrow$ Rejection (`ERR_MARKDOWN_STRUCTURE_INVALID`).
- **TEST-08-02 (Quote Authenticity Against Evidence):**
  - *Objective:* Nachweis, dass im Markdown-Text zitierte Aussagen im Belegkorpus verankert sind.
  - *Pass Criteria:* Jedes Blockquote (`> "..."`) lässt sich zu mindestens 90 % deckungsgleich in einem Evidenz-Objekt des JSON auffinden.
  - *Failure Criteria:* Zitat unauffindbar $\rightarrow$ Rejection (`ERR_HALLUCINATED_REPORT_QUOTE`).

### DOMÄNE 9: CROSS VALIDATION (REPORT VS. GRAPH PARITY)
- **TEST-09-01 (Entity Parity Between Report and JSON):**
  - *Objective:* Mathematischer Beweis, dass Bericht und Wissensmodell dieselbe Analyse abbilden.
  - *Pass Criteria:* $\forall \text{org} \in \text{organizations}: \text{org.identity.name} \text{ existiert als Substring in } \text{report\_markdown}$.
  - *Failure Criteria:* Hoch bewertete Firma (`resonance_score > 0.85`) fehlt im Bericht oder umgekehrt $\rightarrow$ Rejection (`ERR_CROSS_PARITY_MISMATCH`).

### DOMÄNE 10: FUTURE COMPATIBILITY & GRACEFUL DEGRADATION
- **TEST-10-01 (Simulated Protocol v1.1 Upgrade & Graceful Degradation):**
  - *Objective:* Nachweis von Graceful Degradation bei zukünftigen Minor-/Patch-Schema-Erweiterungen.
  - *Input:* Simulierte Payload mit neuem Top-Level-Array (`"salary_trajectories": []`) und `protocol_version = "1.1.0"`.
  - *Pass Criteria:* Da die Major-Version übereinstimmt (`"1"`), überspringt der Validator das unbekannte Array ohne Exception, validiert alle v1.0-Entitäten fehlerfrei und stempelt `validation.status = "PASSED"`.
  - *Failure Criteria:* TypeError oder Rejection der kompletten Analyse wegen unbekannten Keys trotz gleicher Major-Version $\rightarrow$ Failure (`ERR_GRACEFUL_DEGRADATION_FAILED`).

### DOMÄNE 11: PERCEPTION, VIEW-MODEL & TOPOLOGY PROJECTION
- **TEST-11-01 (Topology Projection Parity & Bipartite Separation):**
  - *Objective:* Verifikation der Projektionsschicht (`test/career-perception.test.ts`), welche das verifizierte Analysemodell in eine topologische Zwischenstruktur überführt.
  - *Input:* `VerifiedCareerAnalysis` nach erfolgreichem Durchlauf von `validateCareerAnalysis(...)`.
  - *Pass Criteria:* Jeder Knoten im Graphen entspricht exakt einer verifizierten Entität aus `structured_data.analysis`. Strikte bipartite Trennung zwischen primären Fachknoten (`ORGANIZATION`, `ROLE`, `STRATEGY`) und unterstützenden Evidenz-/Fähigkeitsknoten.
  - *Failure Criteria:* Knoten ohne Fachmodell-Referenz oder Verlust von Entitäten $\rightarrow$ Rejection (`ERR_PROJECTION_PARITY_MISMATCH`).
- **TEST-11-02 (View-Model Transformation & Deterministic Styling):**
  - *Objective:* Verifikation von `buildViewModel(projection)` (`test/career-view-model.test.ts`).
  - *Pass Criteria:* Zuweisung ontologie-spezifischer Shapes (`HEXAGON` für Firmen, `CAPSULE` für Rollen, `DIAMOND` für Strategien) und semantischer Farbtokens ohne jegliche Rückmutation der zugrundeliegenden Fachdaten.
  - *Failure Criteria:* Mutation von Kernfeldern oder falsche Formzuweisung $\rightarrow$ Rejection (`ERR_VIEW_MODEL_POLLUTION`).
- **TEST-11-03 (Concentric Radial & D3 Force Layout Calculation):**
  - *Objective:* Verifikation von `buildRadialLayout(viewModel)` und der D3 Force Simulation (`test/career-layout.test.ts`, `test/career-d3-force.test.ts`).
  - *Pass Criteria:* Deterministische Vergabe von $(x, y)$ Koordinaten auf konzentrischen Ringen gemäß `ring_index`. Null-Überlappungs-Garantie durch abstoßende Kraftfelder (`forceCollide`).
  - *Failure Criteria:* Nahezu identische Koordinaten (Kollision) oder NaN-Werte $\rightarrow$ Failure (`ERR_LAYOUT_COLLISION_DETECTED`).
- **TEST-11-04 (ReactFlow Adapter Invariance):**
  - *Objective:* Verifikation von `toReactFlow(layout)` (`test/career-react-flow.test.ts`).
  - *Pass Criteria:* Exakte Konvertierung in kanonische ReactFlow `Node[]` und `Edge[]` Objekte. Jedes `Node.data` Objekt bewahrt eine unveränderliche Referenz auf die Quell-Entität (`originalNode`).

### DOMÄNE 12: INGESTION PIPELINE & ADAPTER NORMALIZATION
- **TEST-12-01 (Adapter Document Input Preparation):**
  - *Objective:* Verifikation von `loadDocuments(inputs)` (`test/career-adapter.test.ts`).
  - *Pass Criteria:* Standardisierung roher Texteingaben zu `DocumentInput[]`. Kanonische ID-Vergabe (`DOC_001`, `DOC_002`), wenn keine ID mitgegeben wurde.
  - *Failure Criteria:* IDs ohne `DOC_` Präfix $\rightarrow$ Rejection (`ERR_INVALID_DOCUMENT_ID`).
- **TEST-12-02 (Sequential Batch Ingestion & Progress Enforcement):**
  - *Objective:* Verifikation von `loadDocumentBatch(batch, onProgress)` (`test/career-batch-ingestion.test.ts`).
  - *Pass Criteria:* Lückenlose Verarbeitung sequenzieller Dokumenten-Batches. Fail-Fast bei leeren oder fehlerhaften Dokumenten (`ERR_EMPTY_CONTENT`). Fortschrittsmeldungen (`INGESTING`, `EXTRACTING_PDF`, `VALIDATING`, `COMPLETED`).
- **TEST-12-03 (Pipeline Execution Orchestration):**
  - *Objective:* Verifikation der 8-stufigen End-to-End Ingestion-Pipeline (`test/career-pipeline.test.ts`).
  - *Pass Criteria:* Nahtlose Orchestrierung von Ingestion, Prompt-Bündelung, LLM-Inferenz bis hin zur schematischen Verifikation (`VERIFIED`).

### DOMÄNE 13: MULTI-SOURCE INGESTION & METADATA GOVERNANCE
- **TEST-13-01 (Server-Side PDF Loader Integrity):**
  - *Objective:* Verifikation von `loadPdfDocument(buffer)` (`test/career-pdf-loader.test.ts`).
  - *Pass Criteria:* Server-seitige Extraktion reinen Textes aus PDF-Puffern via `pdf-parse`, Zuweisung von `DOC_PDF_001`.
  - *Failure Criteria:* Leerer oder beschädigter Binärpuffer $\rightarrow$ strukturierter Fehler (`ERR_PDF_PARSE_FAILURE`).
- **TEST-13-02 (Server-Side Website Loader Integrity):**
  - *Objective:* Verifikation von `loadWebsiteDocument(url)` (`test/career-website-loader.test.ts`).
  - *Pass Criteria:* Validierung auf `http/https`, Abruf und Säuberung von `<head>`, `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`.
  - *Failure Criteria:* Ungültige URL oder leere Rückgabe $\rightarrow$ strukturierte Rejection (`ERR_INVALID_WEBSITE_URL`, `ERR_WEBSITE_EMPTY_CONTENT`).
- **TEST-13-03 (Server-Side GitHub Repository Loader Integrity):**
  - *Objective:* Verifikation von `loadGitHubRepositoryDocuments(repoUrl)` (`test/career-github-loader.test.ts`).
  - *Pass Criteria:* Direkter API-Abruf von README, `package.json` und `/docs/*.md` ohne lokales Git-Cloning.
  - *Failure Criteria:* Ungültiges Repo oder fehlender Zugriff $\rightarrow$ strukturierter Fehler (`ERR_INVALID_GITHUB_URL`, `ERR_GITHUB_FETCH_FAILURE`).
- **TEST-13-04 (Source Normalization Metadata Determinism):**
  - *Objective:* Verifikation von `SourceMetadata` in allen Loadern (`test/career-source-metadata.test.ts`).
  - *Pass Criteria:* Eindeutiges `sourceKind` (`WEBSITE`, `GITHUB_README`, `PDF`, `TEXT`), deterministischer SHA-256 `contentHash` über den Inhalt und ISO-Timestamp `loadedAt`.

### DOMÄNE 14: INFERENCE PROVIDER ABSTRACTION & LIVE CAPABILITY
- **TEST-14-01 (Gemini Provider Execution & Parsing):**
  - *Objective:* Verifikation von `GeminiProvider` (`test/career-gemini-provider.test.ts`).
  - *Pass Criteria:* Erfüllung der `InferenceProvider` Schnittstelle, zuverlässige Extraktion von JSON aus LLM-Antworten und Durchleitung von Metadaten.
- **TEST-14-02 (Dynamic Runtime Provider Switch):**
  - *Objective:* Verifikation des Wechsels zwischen Mock und Live-API (`test/career-provider-switch.test.ts`).
  - *Pass Criteria:* Steuerung über `USE_GEMINI_PROVIDER`. Bei fehlendem `GEMINI_API_KEY` im Live-Modus bricht der Provider ab mit `ERR_PROVIDER_FAILURE` (HTTP 503).
- **TEST-14-03 (Gemini Live Inference & Schema Conformance):**
  - *Objective:* Verifikation der echten Google Gemini API (`test/career-gemini-live.test.ts`).
  - *Pass Criteria:* Live-Aufruf von `gemini-2.5-pro` erzeugt ein valides, 100% gegen `CanonicalCareerAnalysis` normiertes JSON-Objekt.

### DOMÄNE 15: PROMPT GOVERNANCE SYSTEM & CRYPTOGRAPHIC REGISTRY
- **TEST-15-01 (Encrypted Prompt Registry Engine):**
  - *Objective:* Verifikation der verschlüsselten Prompt-Registry (`test/career-prompt-registry.test.ts`).
  - *Pass Criteria:* Zero-Plaintext Storage mit AES-256-GCM. Abfang manipulierter Checksummen (`ERR_PROMPT_CHECKSUM_MISMATCH`) und inaktiver Versionen (`ERR_PROMPT_NOT_ACTIVE`).
- **TEST-15-02 (Prompt System Seeding & Canonical Artifacts):**
  - *Objective:* Verifikation von `seedPromptSystem(...)` (`test/career-prompt-system.test.ts`).
  - *Pass Criteria:* Seeding aller 7 kanonischen Prompts (`capability-deep-sweep`, `organization-deep-sweep`, `role-deep-sweep`, `opportunity-deep-sweep`, `strategy-deep-sweep`, `search-query-generation`, `recommendation-generation`) als `ACTIVE` Versionen.
- **TEST-15-03 (Runtime Active Prompt Resolver Integration):**
  - *Objective:* Verifikation des `ActivePromptResolver` (`test/career-pipeline-prompt-resolver.test.ts`).
  - *Pass Criteria:* Pipeline lädt den aktiven Prompt zur Laufzeit aus der Registry und verankert die `promptMetadata` (Version, Checksum) im Ergebnis.

### DOMÄNE 16: PERSISTENCE ARCHITECTURE & DUAL-ENGINE STORAGE
- **TEST-16-01 (In-Memory Repository Storage Contract):**
  - *Objective:* Verifikation von `InMemoryCareerAnalysisRepository` (`test/career-repository.test.ts`).
  - *Pass Criteria:* Korrekte CRUD-Operationen (`save`, `findById`, `listAnalyses`), Deep-Cloning zur Verhinderung von Referenz-Lecks und strikte Paginierung.
- **TEST-16-02 (Postgres Repository Storage Contract & ACID Transaction):**
  - *Objective:* Verifikation von `PostgresCareerAnalysisRepository` (`test/career-postgres-repository.test.ts`).
  - *Pass Criteria:* Relationale + JSONB Persistenz im Schema `career_analyses`, atomare Transaktionen und exakte Gleichheit bei `findById`.

### DOMÄNE 17: TEMPORAL GRAPH DIFF & CAREER EVOLUTION ENGINE
- **TEST-17-01 (Topological Graph Comparison & Diff Classification):**
  - *Objective:* Verifikation von `compareCareerAnalyses(baseline, target)` (`test/career-graph-diff.test.ts`).
  - *Pass Criteria:* Vollständige Klassifikation aller Knoten und Kanten in `ADDED`, `REMOVED`, `MODIFIED`, `UNCHANGED`.
- **TEST-17-02 (Semantic Drift & Capability Trajectory Metrics):**
  - *Objective:* Verifikation der statistischen Auswertung (`test/career-graph-diff.test.ts`).
  - *Pass Criteria:* Präzise prozentuale Drift-Berechnung (`overallStructuralDrift`) und Auswertung von Kompetenzzuwachs oder -verlust.

### DOMÄNE 18: COMPANY POOL MATCHING ENGINE
- **TEST-18-01 (Pool Resolution & Criteria Filtering):**
  - *Objective:* Verifikation von `resolveCompanyPool(criteria)` (`test/career-company-pool.test.ts`).
  - *Pass Criteria:* Filterung nach Branchen (`industry_enum`), Ländern (`country_iso`) und Größenkategorien.
- **TEST-18-02 (Capability Matching & Fit Score Quantification):**
  - *Objective:* Verifikation von `matchAnalysisAgainstPool(analysis, pool)` (`test/career-company-pool.test.ts`).
  - *Pass Criteria:* Exakte Bestimmung des `fitScore` $[0.0, 1.0]$, Auflistung gedeckter Fähigkeiten (`matchedCapabilities`) und Lücken (`missingCapabilities`).
- **TEST-18-03 (Ranked Recommendation Order):**
  - *Objective:* Verifikation der absteigenden Sortierung nach `fitScore` im Empfehlungs-Ranking.

### DOMÄNE 19: API SERVER ROUTE CONTRACTS & MULTI-SOURCE ENDPOINTS
- **TEST-19-01 (Server Boundary Execution & Input Sanitization):**
  - *Objective:* Verifikation von `POST /api/career/analyze` (`test/career-analyze-flow.test.ts`).
  - *Pass Criteria:* HTTP 400 bei leeren/invaliden Dokumenten, erfolgreiche Pipeline-Ausführung (HTTP 200) und Rückgabe von `reactFlowGraph`.
- **TEST-19-02 (REST Endpoints for Analysis Retrieval):**
  - *Objective:* Verifikation von `GET /api/career/analyses` und `GET /api/career/analyses/[analysisId]` (`test/career-real-routes.test.ts`).
  - *Pass Criteria:* Schlanke Listen-Projektion ohne Payload-Bloat sowie detaillierte Einzelabfrage mit serverseitig generiertem Graphen (HTTP 404 bei unbekannten IDs).
- **TEST-19-03 (Multi-Source API Dispatcher):**
  - *Objective:* Verifikation des Multi-Source Endpunkts (`test/career-multi-source-api.test.ts`).
  - *Pass Criteria:* Korrektes serverseitiges Dispatching von `website` und `github` Quellen, Bündelung von `text`/`pdf` und strukturierte 400er-Fehler bei unzulässigen URLs.

### DOMÄNE 20: FRONTEND PRESENTATION & COMPONENT CONTRACTS
- **TEST-20-01 (Inspector 6-Tier Information Hierarchy):**
  - *Objective:* Verifikation des `Inspector` Panels (`test/career-components.test.tsx`).
  - *Pass Criteria:* Vollständiges Rendering aller 6 Hierarchieebenen (Header, Core Metrics, Properties, Evidence Quote & Score, Relationships, Validation Status) nach Knoten-Auswahl im Graphen.
- **TEST-20-02 (Semiotic Node Shapes & Styling Compliance):**
  - *Objective:* Verifikation der ReactFlow Komponenten (`test/career-reactflow-component.test.tsx`).
  - *Pass Criteria:* Strikte Anwendung der semiotischen Formen (`HEXAGON`, `CAPSULE`, `DIAMOND`) und semantischer Farben auf Basis reiner Präsentationsdaten ("Dumb Consumer").
- **TEST-20-03 (Full Page Interaction Flow & Progress Feedback):**
  - *Objective:* Verifikation der Hauptseite (`test/career-analyze-page.test.tsx`).
  - *Pass Criteria:* Fortschritts-Indikator während der Analyse und reibungsloses Rendering des interaktiven Graphen nach Abschluss.

---
*Ende der kanonischen Prüf-Spezifikation TS-CONDYN-CAP-v1.0. Das System ist hiermit unbestechlich testbar.*
