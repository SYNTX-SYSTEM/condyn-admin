# CONDYN CAREER ANALYSIS PROTOCOL v1.0
## MASTER COMPENDIUM & KANONISCHE GESAMT-SPEZIFIKATION (`SPEC-MASTER-CONDYN-CAP-v1.0`)
**Dokument-ID:** `SPEC-MASTER-CONDYN-CAP-v1.0`  
**Status:** ARCHITECTURE FREEZE v1.0 / KANONISCHER VERTRAG (UNIFIED MASTER SPECIFICATION)  
**Gültigkeitsbereich:** LLM-Inferenz, Backend-Pipeline, Runtime Integrity Validator, Frontend Perception Engine, TDD-Prüfinstanz  
**Stil & Diktion:** Charlottenburger Systematik (Höchste normative Strenge, keine prozedurale Toleranz, relationale Invarianz, unbestechliche Präzision)

---

## INHALTSVERZEICHNIS
1. **TEIL I: DER CHARLOTTENBURGER KODEX & SYSTEM-ARCHITEKTUR**
   - 1.1 Der Architektur-Freeze v1.0
   - 1.2 Das Souveränitäts-Prinzip (*The Protocol is Sole Sovereign*)
   - 1.3 Deklarative Reinheit (*What, not How*)
   - 1.4 Die Universelle Entitäts-Grammatik (*Die 7 Kardinalfelder*)
   - 1.5 Immutable ID Gesetz (*ID Immutability & Zero Recycling*)
   - 1.6 Kanonische Hierarchie: *Class $\rightarrow$ Organization $\rightarrow$ Role*
   - 1.7 Presentation Read-Only Invarianz & Frontend Dumb Rendering
   - 1.8 Knowledge Graph Serialization & 8-stufiges Datenfluss-Modell
2. **TEIL II: CANONICAL PROMPT CONTRACT (`PC-CONDYN-CAP-v1.0`)**
   - 2.1 System Prompt Contract (Die 8 kanonischen Invarianzregeln)
   - 2.2 User Prompt Contract (Der Eingabe-Wrapper)
   - 2.3 Output Contract (Duale Kapselung: Report & Knowledge Model)
   - 2.4 JSON Schema Contract (Die 7 Kardinaleigenschaften & Typen-Strenge)
   - 2.5 Markdown Contract
3. **TEIL III: KNOWLEDGE MODEL SCHEMA & PROTOCOL SPEC (`RFC-CONDYN-CAP-v1.0`)**
   - 3.1 Top-Level-Bifurkation in `structured_data`: `analysis` vs. `presentation`
   - 3.2 Die 12 kanonischen Top-Level-Sektionen in `analysis` (3 Objekte, 9 Arrays)
   - 3.3 Analysis Pipeline als Runtime-Protokoll (`pipeline.steps`)
   - 3.4 Kanonische Normierung (Taxonomy Layer: ISO-3166-1 & Zod-Enums)
   - 3.5 Presentation Model Specification (`semantic_graph` & `ui_layout`)
   - 3.6 Die 12 deterministischen Runtime Validation Rules (Strenge Trennung von Analyse und Prüfung)
   - 3.7 Versioning Strategy (Major Version Compatibility) & Abwärtskompatibilität
   - 3.8 Modulare Erweiterbarkeit (*Plug-and-Play*) & Ausfallstufen (*Partial Graph Repair*)
4. **TEIL IV: EXECUTIVE CONFORMANCE TEST SUITE (`TS-CONDYN-CAP-v1.0`)**
   - 4.1 Specification Validation Tests (TEST-01-01 bis 01-03: Major Compatibility & 12 Sektionen)
   - 4.2 JSON Validation Tests (TEST-02-01 bis 02-05: Orphan Repair & ID Immutability)
   - 4.3 Knowledge Model Validation Tests (TEST-03-01 bis 03-04: Numeric vs. String Properties)
   - 4.4 Structural Consistency Validation Tests (TEST-04-01 bis 04-02)
   - 4.5 Semantic & Presentation Invariance Tests (TEST-05-01 bis 05-03: Read-Only Check)
   - 4.6 Runtime Validation Tests / Integrity Check (TEST-06-01 bis 06-05: Hierarchy Parity & Stamping)
   - 4.7 Presentation & Frontend Validation Tests (TEST-07-01 bis 07-03: Zero Inference Rule)
   - 4.8 Human Report Validation Tests (TEST-08-01 bis 08-02)
   - 4.9 Cross Validation Tests / Parity Check (TEST-09-01)
   - 4.10 Future Compatibility Tests (TEST-10-01)
5. **TEIL V: TDD CI/CD-INSTRUMENTIERUNG (GOLD & REGRESSION TESTS)**
   - 5.1 Gold Test Cases Architektur (`test/gold/case_xxx/`)
   - 5.2 Automated Regression Diffs (Der Delta-Radar)

================================================================================

# TEIL I: DER CHARLOTTENBURGER KODEX & SYSTEM-ARCHITEKTUR

### 1.1 Der Architektur-Freeze v1.0
Die Systemarchitektur für das **Career Analysis Feature** innerhalb der CONDYN-Plattform ist hiermit besiegelt und eingefroren. Es werden keinerlei ad-hoc-Schichten oder spekulativen Zwischenebenen implementiert. Jede zukünftige Erweiterung des Systems (z. B. zusätzliche Module für Gehaltsanalysen oder Lerntrajektorien) muss sich nahtlos und zerstörungsfrei in diese kanonische Spezifikation einfügen. Ab diesem Zeitpunkt gilt das Eiserne Gesetz: **Jede Änderung an der Spezifikation muss durch einen konkreten, fehlgeschlagenen Testfall oder eine harte systemische Anforderung begründet sein.**

### 1.2 Das Souveränitäts-Prinzip (*The Protocol is Sole Sovereign*)
Große Sprachmodelle (LLMs wie Gemini, Claude oder GPT) besitzen in dieser Architektur keinerlei semantische Autorität. Sie fungieren ausschließlich als austauschbare **Inferenz- und Extraktionsmotoren**. Der einzige Vertrag des Systems ist dieses **CONDYN Career Analysis Protocol v1.0**. Das Backend, die Datenbank, die Middleware und das Frontend verhandeln niemals mit einem Modell, sondern ausschließlich mit der durch das Protokoll definierten Datenontologie. Ein Modellwechsel erfordert im nachgelagerten System exakt null Codeänderungen.

### 1.3 Deklarative Reinheit (*What, not How*)
Das Analyseprotokoll verbietet jede prozedurale Narrativik. Ein LLM hat im Ausgabevertrag niemals seinen internen Erkenntnisweg, seine Prompt-Historie oder Modellrechtfertigungen (*„Ich habe zuerst Dokument A gelesen und dann gerungfolgert...“*) darzulegen. Die Ausgabe beschreibt ausschließlich **was** strukturell im Evidenzkorpus nachgewiesen wurde. Modellabhängige Felder (z. B. `gemini_reasoning`, `claude_internal_chain`) sind illegal und führen zur sofortigen Ablehnung durch den Runtime Validator.

### 1.4 Die Universelle Entitäts-Grammatik (*Die 7 Kardinalfelder*)
Um die systemische Komplexität zu minimieren, folgt jede fachliche Entität im gesamten Knowledge Model (Dokumente, Cluster, Fähigkeiten, Domänen, Firmen-Klassen, Firmen, Rollen, Opportunities, Strategien, Suchanfragen) exakt derselben ontologischen Stammstruktur aus **7 Kardinalfeldern**:

```text
Entity
 ├── entity_id      (Eindeutige ID mit obligatorischem Typ-Präfix)
 ├── identity       (Typisierung, kanonischer Bezeichner, ISO- oder Domänen-Code)
 ├── properties     (Numerische Scores in [0.0, 1.0], Text-Attribute als Strings, ISOs oder Enums)
 ├── relationships  (Gerichtete Kanten auf existierende IDs im Graphen inkl. weight in [0.0, 1.0])
 ├── evidence       (Intrinsische Beweisladung inkl. evidence_score in [0.0, 1.0])
 ├── confidence     (Numerischer Wahrscheinlichkeits- und Stabilitätswert in [0.0, 1.0])
 └── validation     (Deterministisches Prüfsiegel des Runtime Validators, initiiert als UNVERIFIED)
```
Hierbei gilt die strikte Typentrennung: Numerische Score-Attribute (`confidence`, `weight`, `resonance_score`, `cohesion_score`, `evidence_score`) müssen im geschlossenen Intervall $[0.0, 1.0]$ liegen. Textuelle Attribute (wie `country_iso`, `industry_enum`, `title`, `query`) sind valide Zeichenketten oder kanonische Enums.

### 1.5 Immutable ID Gesetz (*ID Immutability & Zero Recycling*)
Entitäts-IDs (z. B. `CAP_001`, `ORG_002`, `ROL_001`) sind **absolut immutable**. Einmal vergeben, dürfen sie niemals geändert, niemals überschrieben und niemals recycelt werden. Entfällt eine Entität in einer späteren Re-Analyse, wird ihre ID permanent stillgelegt. Dies ist die zwingende Voraussetzung für fehlerfreie historische Graphen-Diffs und zeitliche Rückverfolgbarkeit.

### 1.6 Kanonische Hierarchie: *Class $\rightarrow$ Organization $\rightarrow$ Role*
Die organisationale Abbildung folgt einer strikten, kanonischen Graphentrajektorie:
$$\text{Organization Class (CLS\_)} \longrightarrow \text{Concrete Organization (ORG\_)} \longrightarrow \text{Role (ROL\_)}$$
Eine Rolle (`ROL_`) existiert niemals im luftleeren Raum, sondern ist relationell über eine Kante des Typs `ROLE_IN_ORGANIZATION` an eine konkrete Firma oder Firmen-Klasse gebunden. Eine konkrete Firma (`ORG_`) ist zwingend über `BELONGS_TO_CLASS` mit einer abstrakten Firmen-Klasse verbunden.

### 1.7 Presentation Read-Only Invarianz & Frontend Dumb Rendering
1. **Presentation Read-Only Rule:** Der Ast `presentation` darf niemals semantische Daten in `analysis` modifizieren, anreichern oder überschreiben. Er besitzt ausschließlich lesenden Zugriff auf die verifizierten IDs des Fachmodells. Dies verhindert architektonische UI-Abkürzungen.
2. **Zero Frontend Inference Rule:** Das Frontend ist eine reine **Perception Engine** (Render-Maschine). Es darf niemals selbst Beziehungen inferieren, Kanten berechnen oder Entitäten außerhalb des gelieferten `ui_layout` gruppieren. Es rendert ausschließlich den vom Backend gelieferten, deterministischen Knowledge Graph.

### 1.8 Knowledge Graph Serialization & 8-stufiges Datenfluss-Modell
Die Ausgabe ist ein persistierbares **serialisiertes Wissensmodell (*Knowledge Graph Serialization*)**. Das System durchläuft präzise acht sequentielle Stufen:

```text
[ 01. PDF Collection & Inputs ]
                 │
                 ▼
[ 02. Analysis Protocol Spec v1.0 ]  ──> Zwingt LLM in deklarativen Was-Vertrag
                 │
                 ▼
[ 03. Knowledge Model Schema v1.0 ]  ──> Bifurkation in "structured_data": analysis vs. presentation
                 │                       Embedded Evidence & Universal Entity Grammar
                 ▼
[ 04. Taxonomy Normalization ]       ──> Normierung von ISO-Ländern & Branchen-Enums
                 │
                 ▼
[ 05. Runtime Integrity Validator ]  ──> Deterministische Software-Prüfung (ohne KI)
                 │
                 ▼
[ 06. Semantic Graph Engine ]        ──> Reine relationale Wahrheit (Nodes, Edges, Weights)
                 │
                 ▼
[ 07. Presentation Layout Spec ]     ──> Visuelle Projektion (Ringe, Zentrum, Read-Only)
                 │
                 ▼
[ 08. Frontend Perception Layer ]    ──> Dumb Renderer: Ecosystem Map, Cards, Progress Protocol
```

================================================================================

# TEIL II: CANONICAL PROMPT CONTRACT (`PC-CONDYN-CAP-v1.0`)

### 2.1 System Prompt Contract (Die 8 kanonischen Invarianzregeln)
Der folgende System Prompt wird bei jeder Inferenzanfrage als unveränderliche Systeminstruktion übergeben:

```text
You are the CONDYN Structural Topology & Career Analysis Engine (Protocol v1.0).
Your sole operational mandate is to reconstruct the professional capability architecture, structural consistency, and market resonance of a person from an uploaded corpus of professional documents.

### CANONICAL INVARIANCE RULES (THE 8 COMMANDMENTS):
1. DECLARATIVE PURITY: You MUST never explain HOW you analyzed the documents. Never output procedural reasoning, step-by-step narration, or model justifications (e.g., "First I read document A, then I concluded..."). You MUST output exclusively WHAT was structurally reconstructed.
2. MODEL AGNOSTICISM: You MUST NOT include any model-specific metadata, reasoning strings, or internal chain-of-thought fields (e.g., `gemini_reasoning`, `claude_internal`).
3. UNIVERSAL ENTITY GRAMMAR: Every single domain object you generate (capabilities, organizations, roles, opportunities, strategies, search_queries) MUST strictly adhere to the 7 cardinal properties: `entity_id`, `identity`, `properties`, `relationships`, `evidence`, `confidence`, and `validation`.
4. EMBEDDED EVIDENCE WITH SCORES: You MUST attach intrinsic, verifiable textual evidence (`context_quote`) from the source documents to every primary capability, organization, role, and strategy. For each evidence item, you MUST provide an `evidence_score` (float 0.0 - 1.0) quantifying the evidentiary strength of the citation.
5. STRICT BIFURCATION: Your structured_data object MUST split cleanly into exactly two orthogonal branches: `analysis` (containing zero UI/layout styling data) and `presentation` (containing zero domain reasoning, only graph topological nodes/edges and visual ring layouts). Notice that the root payload splits into `report_markdown` and `structured_data`.
6. CANONICAL ENUMS, ISOS & NORMALIZED SCORES: For all concrete organizations, you MUST output valid 2-letter ISO-3166-1 country codes (e.g., "DE", "US", "CH") and pick industry sectors exclusively from standard canonical catalogs. All numeric score properties (`confidence`, `weight`, `resonance_score`, `cohesion_score`, `evidence_score`) MUST strictly lie in the closed interval [0.0, 1.0]. Textual properties must be valid strings or enums. Never output integer percentages like 94.
7. IMMUTABLE IDS & ZERO RECYCLING: You MUST generate stable, immutable IDs prefixed by entity type (`DOC_`, `CLU_`, `CAP_`, `DOM_`, `CLS_`, `ORG_`, `ROL_`, `OPP_`, `STR_`, `QRY_`). Never recycle or modify previously assigned IDs.
8. SEARCH QUERIES AS ENTITIES: Treat search queries not as raw strings, but as full domain entities (`QRY_`) with structured properties (`title`, `query`, `purpose`, `target`, `priority`) adhering to the Universal Entity Grammar.

If the document density is low or contradictions exist, document them explicitly in the `consistency` section and assign appropriate float values between 0.0 and 1.0 to `confidence` and `cohesion_score`.
```

### 2.2 User Prompt Contract (Der Eingabe-Wrapper)
Der User Prompt verpackt den unstrukturierten Textkorpus nebst Trilatera-Metadaten in eine genormte Schale:

```text
### INFERENZ-AUFTRAG: CAREER ANALYSIS PROTOCOL v1.0

ANALYSE-HEADER:
- Protocol Version: 1.0.0
- Schema Version: 1.0.0
- Prompt Contract Version: PC-CONDYN-CAP-v1.0
- Timestamp: {UTC_TIMESTAMP}
- Document Count: {DOC_COUNT}

EVIDENZ-KORPUS (ROHDATEN):
================================================================================
{DOCUMENT_1_METADATA: doc_id="DOC_001", filename="System_Architecture_Design.pdf"}
{DOCUMENT_1_FULL_TEXT}
--------------------------------------------------------------------------------
{DOCUMENT_2_METADATA: doc_id="DOC_002", filename="Incident_Postmortem_Q3.pdf"}
{DOCUMENT_2_FULL_TEXT}
================================================================================

EXEKUTIV-ANWEISUNG:
Führe die strukturelle Rekonstruktion gemäß CONDYN Analysis Protocol v1.0 durch. Erzeuge als Antwort AUSSCHLIESSLICH ein valides JSON-Objekt gemäß dem Output Contract. Keinerlei Einleitungstexte, keinerlei Markdown-Code-Wrapper (` ```json `), ausschließlich das reine JSON-Objekt.
```

### 2.3 Output Contract
Das Modell gibt zwingend ein Top-Level-JSON mit exakt zwei orthogonalen Kapseln zurück:
1. `report_markdown`: String (Valides GitHub Flavored Markdown für den Menschen).
2. `structured_data`: Objekt (Serialisierter Wissensgraph für Maschine & UI, strikt bifurkiert in `analysis` und `presentation`).

### 2.4 JSON Schema Contract (Die 7 Kardinaleigenschaften)
Für jede Entität in `analysis.*` erzwingt der Vertrag folgendes exakte Sub-Schema (Numerische Score-Werte in [0.0, 1.0], Text-Attribute als Strings/Enums):

```json
{
  "entity_id": "STRING_WITH_CANONICAL_PREFIX",
  "identity": {
    "type": "STRING_ENUM",
    "name": "STRING_CANONICAL_NAME",
    "code": "OPTIONAL_STRING_ISO_OR_DOMAIN"
  },
  "properties": {
    "STRING_PROPERTY_KEY": "STRING_VALUE_OR_CANONICAL_ENUM",
    "NUMERIC_SCORE_KEY": 0.95
  },
  "relationships": [
    {
      "target_id": "STRING_EXISTING_ENTITY_ID",
      "relation_type": "SUPPORTS | REQUIRES | RESONATES_WITH | CONFLICTS_WITH | DERIVED_FROM | BELONGS_TO_CLASS | ROLE_IN_ORGANIZATION",
      "weight": 0.95
    }
  ],
  "evidence": [
    {
      "doc_id": "DOC_001",
      "location": "STRING_PAGE_OR_SECTION",
      "context_quote": "EXACT_VERBATIM_QUOTE_FROM_TEXT",
      "evidence_score": 0.98,
      "significance_explanation": "STRING_EXPLANATION"
    }
  ],
  "confidence": 0.95,
  "validation": {
    "status": "UNVERIFIED"
  }
}
```

### 2.5 Markdown Contract
Der String in `report_markdown` erfüllt zwingend: H1-Monopol (`# H1`), obligatorische H2-Sektionen (*Executive Summary*, *Consistency*, *Capabilities*, *Target Ecosystem*, *Strategies*) und 1:1 Zitat-Authentizität gegen `evidence[].context_quote`.

================================================================================

# TEIL III: KNOWLEDGE MODEL SCHEMA & PROTOCOL SPEC (`RFC-CONDYN-CAP-v1.0`)

### 3.1 Top-Level-Bifurkation in `structured_data`: `analysis` vs. `presentation`
Das Wissensmodell trennt strikt zwischen fachlichem Inhalt (`analysis`) und visueller Darstellung (`presentation`).

### 3.2 Die 12 kanonischen Top-Level-Sektionen in `analysis` (3 Objekte, 9 Arrays)
Der Ast `analysis` innerhalb von `structured_data` gliedert sich in exakt 12 Sektionen:

```json
{
  "analysis": {
    "metadata": {
      "protocol_version": "1.0.0",
      "schema_version": "1.0.0",
      "prompt_contract_version": "PC-CONDYN-CAP-v1.0",
      "analysis_timestamp": "2026-07-06T19:00:00Z",
      "execution_duration_ms": 14200,
      "document_count": 3,
      "total_word_count": 8540,
      "dominant_cluster_name": "Distributed Systems Resilience",
      "overall_confidence": 0.92,
      "validation_state": "UNVERIFIED"
    },
    "pipeline": { "steps": [ /* Siehe 3.3 Runtime Protokoll */ ] },
    "documents": [ /* Array von Dokument-Entitäten (DOC_) */ ],
    "consistency": {
      "overall_cohesion_score": 0.88,
      "summary": "Höchste Kohäsion zwischen Architekturvorschlägen und Incident-Analysen.",
      "clusters": [ /* Array von Kohäsions-Clustern (CLU_) */ ],
      "outlier_doc_ids": [],
      "contradictions": []
    },
    "capabilities": [ /* Array von Fähigkeiten (CAP_) gem. Universal Grammar */ ],
    "domains": [ /* Array von Fachbereichen (DOM_) gem. Universal Grammar */ ],
    "organization_classes": [ /* Array abstrakter Firmen-Klassen (CLS_) */ ],
    "organizations": [
      {
        "entity_id": "ORG_001",
        "identity": { "type": "CONCRETE_ORGANIZATION", "name": "Siemens AG", "code": "SIE" },
        "properties": {
          "country_iso": "DE",
          "region_code": "EMEA",
          "industry_enum": "INDUSTRIAL_AUTOMATION",
          "scale_tier": "ENTERPRISE_GLOBAL",
          "workplace_model": "HYBRID",
          "recruiter_pool_id": "POOL_DACH_TECH_01",
          "resonance_score": 0.94
        },
        "relationships": [
          { "target_id": "CLS_001", "relation_type": "BELONGS_TO_CLASS", "weight": 1.0 },
          { "target_id": "CAP_001", "relation_type": "RESONATES_WITH", "weight": 0.95 }
        ],
        "evidence": [
          {
            "doc_id": "DOC_001",
            "location": "Sektion 4",
            "context_quote": "Leitung der weltweiten IoT-Infrastruktur-Transformation bei Siemens Industrial.",
            "evidence_score": 0.98,
            "significance_explanation": "Direkter Nachweis für Enterprise Automation Resonance."
          }
        ],
        "confidence": 0.95,
        "validation": { "status": "UNVERIFIED" }
      }
    ],
    "roles": [
      {
        "entity_id": "ROL_001",
        "identity": { "type": "ROLE", "name": "Principal Edge Systems Architect" },
        "properties": { "seniority": "PRINCIPAL", "domain_focus": "IIOT_EDGE" },
        "relationships": [
          { "target_id": "ORG_001", "relation_type": "ROLE_IN_ORGANIZATION", "weight": 0.95 }
        ],
        "evidence": [
          {
            "doc_id": "DOC_001",
            "location": "Sektion 2",
            "context_quote": "Architekturverantwortung für verteiltes IIoT Edge Computing.",
            "evidence_score": 0.92,
            "significance_explanation": "Direkter Beleg für die Rollenausrichtung."
          }
        ],
        "confidence": 0.92,
        "validation": { "status": "UNVERIFIED" }
      }
    ],
    "opportunities": [ /* Array von Latent Needs / White Spaces (OPP_) */ ],
    "strategies": [ /* Array von Entry Strategies (STR_) */ ],
    "search_queries": [
      {
        "entity_id": "QRY_001",
        "identity": { "type": "SEARCH_QUERY", "name": "Principal Distributed Systems Architect EMEA" },
        "properties": {
          "title": "Staff/Principal Infrastructure Engineer",
          "query": "(\"Distributed Systems\" OR \"Gossip Protocol\") AND (\"Fault Tolerance\" OR \"Resilience\") AND (EMEA OR DACH)",
          "purpose": "Targeting Tier-1 Cloud Infrastructure Providers with latent resilience challenges",
          "target": "ENGINEERING_LEADERSHIP",
          "priority": "HIGH_IMMEDIATE"
        },
        "relationships": [ { "target_id": "CAP_001", "relation_type": "REQUIRES", "weight": 1.0 } ],
        "evidence": [
          {
            "doc_id": "DOC_001",
            "location": "Sektion 5",
            "context_quote": "Spezialisierung auf hochverfügbare, fehlertolerante Gossip-Protokolle im Cloud-Maßstab.",
            "evidence_score": 0.95,
            "significance_explanation": "Begründet den Suchfokus auf hochverfügbare verteilte Systeme."
          }
        ],
        "confidence": 0.94,
        "validation": { "status": "UNVERIFIED" }
      }
    ]
  }
}
```

### 3.3 Analysis Pipeline als Runtime-Protokoll (`pipeline.steps`)
Der methodische Ablauf wird als objektives Zustandsmodell abgebildet, um im UI deterministischen Fortschritt anzuzeigen:

```json
{
  "pipeline": {
    "steps": [
      {
        "step_id": "STEP_1",
        "name": "documents_loaded",
        "started_at": "2026-07-06T19:00:00.000Z",
        "finished_at": "2026-07-06T19:00:01.200Z",
        "duration_ms": 1200,
        "status": "COMPLETED",
        "warnings": [],
        "errors": []
      },
      {
        "step_id": "STEP_2",
        "name": "structural_consistency_verified",
        "started_at": "2026-07-06T19:00:01.200Z",
        "finished_at": "2026-07-06T19:00:04.500Z",
        "duration_ms": 3300,
        "status": "COMPLETED",
        "warnings": ["WARN_LOW_WORD_COUNT_DOC_003"],
        "errors": []
      },
      {
        "step_id": "STEP_3",
        "name": "capability_architecture_reconstructed",
        "started_at": "2026-07-06T19:00:04.500Z",
        "finished_at": "2026-07-06T19:00:09.100Z",
        "duration_ms": 4600,
        "status": "COMPLETED",
        "warnings": [],
        "errors": []
      },
      {
        "step_id": "STEP_4",
        "name": "organizations_and_roles_mapped",
        "started_at": "2026-07-06T19:00:09.100Z",
        "finished_at": "2026-07-06T19:00:13.800Z",
        "duration_ms": 4700,
        "status": "COMPLETED",
        "warnings": [],
        "errors": []
      },
      {
        "step_id": "STEP_5",
        "name": "validation_completed",
        "started_at": "2026-07-06T19:00:13.800Z",
        "finished_at": "2026-07-06T19:00:14.200Z",
        "duration_ms": 400,
        "status": "COMPLETED",
        "warnings": [],
        "errors": []
      }
    ]
  }
}
```

### 3.4 Kanonische Normierung (Taxonomy Layer: ISO-3166-1 & Zod-Enums)
Konkrete Organisationen müssen zwingend genormte Attribute aufweisen, um deterministische Offline-UI-Filterung (ohne LLM-Re-Inferenz) zu ermöglichen.

### 3.5 Presentation Model Specification
Der Ast `presentation` ist semantisch blind und read-only. Er enthält ausschließlich topologische und visuelle Koordinaten für die Frontend Perception Engine (z. B. im CONDYN-Admin `FieldTopologyView.tsx`):

```json
{
  "presentation": {
    "semantic_graph": {
      "nodes": [
        { "node_id": "CAP_001", "entity_type": "CAPABILITY", "weight": 0.95 },
        { "node_id": "ORG_001", "entity_type": "CONCRETE_ORGANIZATION", "weight": 0.94 },
        { "node_id": "ROL_001", "entity_type": "ROLE", "weight": 0.92 }
      ],
      "edges": [
        { "source_id": "ORG_001", "target_id": "CAP_001", "interaction_force": 0.89 },
        { "source_id": "ROL_001", "target_id": "ORG_001", "interaction_force": 0.95 }
      ]
    },
    "ui_layout": {
      "center_node_id": "CAP_001",
      "concentric_rings": [
        { "ring_index": 0, "name": "Core Capabilities", "node_ids": ["CAP_001"] },
        { "ring_index": 1, "name": "Target Organizations", "node_ids": ["ORG_001"] },
        { "ring_index": 2, "name": "Target Roles", "node_ids": ["ROL_001"] }
      ],
      "color_tokens": {
        "CAPABILITY": "#1565C0",
        "CONCRETE_ORGANIZATION": "#4CAF50",
        "ROLE": "#FF9800",
        "HIDDEN_OPPORTUNITY": "#9C27B0",
        "SEARCH_QUERY": "#00BCD4"
      },
      "priority_groups": [
        { "group_id": "GRP_TOP_RESONANCE", "label": "Immediate Market Match", "node_ids": ["ORG_001"] }
      ],
      "default_views": {
        "primary_view": "ECOSYSTEM_MAP",
        "available_views": ["ECOSYSTEM_MAP", "RELATIONAL_CARDS", "PIPELINE_STEPPER", "MATRIX_TABLE"]
      }
    }
  }
}
```

### 3.6 Die 12 deterministischen Runtime Validation Rules (Strenge Trennung von Analyse und Prüfung)
Der Runtime Integrity Validator ist ein deterministischer Software-Baustein (Zod + TypeScript Graphen-Prüfer), der vor jeder Übergabe an das Frontend ausgeführt wird:
1. **Idempotenz & Read-Only Invarianz:** Die Validierung darf semantische Daten in `analysis` niemals verändern. Der Ast `presentation` darf niemals schreibend auf `analysis` zugreifen.
2. **Referentielle Integrität (Zero Orphan Policy via Partial Graph Repair):** Jede ID, die in Kanten referenziert ist, **muss** im JSON existieren. Existiert die Ziel-ID nicht, löst dies keine Rejection der gesamten Payload aus, sondern führt deterministisch zur Löschung der verwaisten Kante (`WARN_ORPHAN_EDGE_REMOVED`). Der restliche Graph bleibt intakt (Partial Graph Repair).
3. **Kreisreferenz-Ausschluss:** Graphen-Kanten vom Typ `DERIVED_FROM`, `BELONGS_TO_CLASS` oder `ROLE_IN_ORGANIZATION` müssen zwingend azyklisch sein (DAG - Directed Acyclic Graph).
4. **ID Immutability & Präfix-Invarianz:** Alle IDs müssen strikt ihrem Typ-Präfix entsprechen (`DOC_`, `CLU_`, `CAP_`, `DOM_`, `CLS_`, `ORG_`, `ROL_`, `OPP_`, `STR_`, `QRY_`). Sie dürfen niemals recycelt oder verändert werden.
5. **Evidence & Score Mandate:** Jede Entität vom Typ `CAPABILITY`, `CONCRETE_ORGANIZATION`, `ROLE` und `STRATEGY` muss mindestens ein valides Element im Array `evidence` enthalten. Jedes Zitat erfordert einen `evidence_score` ($0.0 \le s \le 1.0$). Ohne Evidenz gilt: `validation.status = "REJECTED"`.
6. **Typen- und Numerische Intervallbindung:** Alle numerischen Score-Werte (`confidence`, `weight`, `resonance_score`, `cohesion_score`, `evidence_score`) liegen zwingend im geschlossenen Intervall $[0.0, 1.0]$. Textuelle Attribute (wie Ländercodes, Branchenbezeichner, Titel) müssen valide Zeichenketten sein. Integer-Prozentwerte wie 94 sind illegal.
7. **ISO-Länderbindung:** Das Feld `country_iso` in Organisationen muss exakt einem zweistelligen ISO-3166-1-Alpha-2-Code entsprechen (`DE`, `CH`, `US`).
8. **Enum-Bindung:** Branchen und Typisierungen müssen gegen den kanonischen Katalog validieren (keine Freitext-Branchen).
9. **Hierarchische Kanonizität:** Jede Rolle (`ROL_`) muss eine Kante zu einer Firma (`ORG_`) oder Klasse (`CLS_`) aufweisen.
10. **Zero Frontend Inference Guarantee:** Das `ui_layout` muss alle zu rendernden Knoten explizit verorten. Das Frontend inferiert niemals selbst.
11. **Paritäts-Prüfung:** Der String in `report_markdown` darf keine Überschriften von Entitäten enthalten, die nicht im JSON unter `analysis` existieren.
12. **Siegel-Erteilung (Strenge Trennung von Analyse und Prüfung):** Nur wenn die Regeln 1–11 fehlerfrei passiert werden, stempelt der Validator jede Entität mit `validation.status = "PASSED"` und setzt im Header `metadata.validation_state = "VERIFIED"`. Der numerische Wert `metadata.overall_confidence` wird niemals vom Validator berechnet oder überschrieben, sondern entstammt ausschließlich der analytischen Inferenz oder einer definierten mathematischen Aggregation.

### 3.7 Versioning Strategy (Major Version Compatibility) & Abwärtskompatibilität
Das Modell führt im Header die trilaterale Versionierung:
```json
{
  "metadata": {
    "protocol_version": "1.0.0",
    "schema_version": "1.0.0",
    "prompt_contract_version": "PC-CONDYN-CAP-v1.0"
  }
}
```
Die Versionskompatibilität folgt der semantischen Strenge: Die **Major-Version** muss zwingend übereinstimmen (`protocol_version.split('.')[0] === "1"`). Minor- und Patch-Versionen dürfen in künftigen Upgrades höher ausfallen (`v1.1.0`) und garantieren Abwärtskompatibilität durch **Graceful Degradation**: Trifft ein v1.0-Frontend auf eine v1.1-Payload mit neuen Modulen, werden die unbekannten Top-Level-Arrays ignoriert; das Core-Rendering bleibt funktional.

### 3.8 Modulare Erweiterbarkeit & Ausfallstufen
- **Plug-and-Play:** Neue fachliche Dimensionen (z. B. `skill_gaps` oder `salary_trajectories`) werden als eigenständige Arrays auf Top-Level unter `analysis` eingehängt.
- **Ausfallstufen (Degradation Matrix):**
  1. *Total Invalidation:* Bei defektem JSON, Syntaxfehlern oder fehlenden Wurzelkreisen bricht die Pipeline mit HTTP 500 ab.
  2. *Partial Graph Repair:* Verweist eine Kante auf eine nicht existierende ID, wird die Kante gelöscht (`WARN_ORPHAN_EDGE_REMOVED`), das Rendering für den restlichen Graphen bleibt intakt (keine komplette Rejection).
  3. *Low Confidence Warning:* Fällt `overall_confidence` unter `0.65`, wird das Modell gerendert, aber mit einem prominenten Warn-Banner im UI versehen.
  4. *Outlier Isolation:* Dokumente mit einem Kohäsions-Score $< 0.30$ werden ins Array `consistency.outlier_doc_ids` verschoben und von der Kanten-Generierung ausgeschlossen.

================================================================================

# TEIL IV: EXECUTIVE CONFORMANCE TEST SUITE (`TS-CONDYN-CAP-v1.0`)

### 4.1 Specification Validation Tests
- **TEST-01-01 (Trilaterale Version Compliance & Major Compatibility):**
  - *Objective:* Verifikation der drei orthogonalen Versionsstempel im Header.
  - *Pass Criteria:* Major-Versionen stimmen exakt überein (`protocol_version.split('.')[0] === "1"` und `schema_version.split('.')[0] === "1"`). Minor- und Patch-Versionen dürfen höher oder gleich sein (`v1.0.0`, `v1.1.0`), um Graceful Degradation zu ermöglichen. `prompt_contract_version === "PC-CONDYN-CAP-v1.0"`.
  - *Failure Criteria:* Abweichung der Major-Version $\rightarrow$ Rejection (`ERR_VERSION_MISMATCH`).
- **TEST-01-02 (Mandatory Bifurcation in Structured Data):**
  - *Objective:* Prüfung der Wurzelkreise im Output.
  - *Pass Criteria:* Keys `report_markdown` und `structured_data` existieren auf Top-Level. Das Objekt `structured_data` trennt sich sauber in exakt zwei orthogonale Äste: `analysis` und `presentation`.
  - *Failure Criteria:* Vermischung von `analysis` und `presentation` auf Top-Level $\rightarrow$ Rejection (`ERR_SCHEMA_BIFURCATION_MISSING`).
- **TEST-01-03 (Completeness of Canonical Sections):**
  - *Objective:* Nachweis, dass alle 12 vorgeschriebenen Top-Level-Sektionen (3 Objekte, 9 Arrays) in `analysis` präsent sind.
  - *Pass Criteria:* Keys `metadata`, `pipeline`, `consistency` (Objekte) sowie `documents`, `capabilities`, `domains`, `organization_classes`, `organizations`, `roles`, `opportunities`, `strategies`, `search_queries` (Arrays) existieren. Hinweis: `evidence` ist kein Top-Level-Key, sondern intrinsisch in den Entitäten verankert.
  - *Failure Criteria:* Fehlen einer Top-Level-Sektion $\rightarrow$ Rejection (`ERR_MANDATORY_SECTION_MISSING`).

### 4.2 JSON Validation Tests
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
  - *Failure Action / Graceful Recovery:* Verweist eine Kante auf eine nicht existierende ID, triggert dies eine Warnung (`WARN_ORPHAN_EDGE_REMOVED`) und löscht die verwaiste Kante deterministisch aus dem Graphen (Partial Graph Repair), ohne die gesamte Payload zu verwerfen.
- **TEST-02-05 (ID Immutability Verification):**
  - *Objective:* Garantie, dass bei einer Re-Analyse desselben Korpus bekannte IDs nicht überschrieben oder recycelt werden.
  - *Pass Criteria:* Keine historische ID aus Snapshot $T_0$ wird für eine abweichende semantische Entität in $T_1$ wiederverwendet.
  - *Failure Criteria:* ID-Recycling $\rightarrow$ Rejection (`ERR_ID_RECYCLED_VIOLATION`).

### 4.3 Knowledge Model Validation Tests
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

### 4.4 Structural Consistency Validation Tests
- **TEST-04-01 (Cohesion Score Calculation & Bounds):**
  - *Objective:* Prüfung der Kohäsions-Scores.
  - *Pass Criteria:* `overall_cohesion_score` zwischen 0.0 und 1.0; jedes Cluster referenziert eine valide `doc_id`.
  - *Failure Criteria:* Inkonsistentes Cluster-Array $\rightarrow$ Rejection (`ERR_CONSISTENCY_SCHEMA_INVALID`).
- **TEST-04-02 (Outlier Isolation Verification):**
  - *Objective:* Prüfung der automatischen Aussonderung bei Score $< 0.30$.
  - *Pass Criteria:* ID des Outliers ist in `consistency.outlier_doc_ids` enthalten und taucht in keiner Kante einer Fähigkeit auf.
  - *Failure Criteria:* Outlier fließt unmarkiert in Fähigkeits-Rekonstruktion ein $\rightarrow$ Failure (`ERR_OUTLIER_NOT_ISOLATED`).

### 4.5 Semantic & Presentation Invariance Tests
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

### 4.6 Runtime Validation Tests / Integrity Check
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

### 4.7 Presentation & Frontend Validation Tests
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

### 4.8 Human Report Validation Tests
- **TEST-08-01 (GFM Structure and Heading Architecture):**
  - *Objective:* AST-Analyse des Markdown-Verlaufs.
  - *Pass Criteria:* String beginnt mit genau einer `# H1` und enthält alle obligatorischen `## H2` Sektionen.
  - *Failure Criteria:* Fehlende Pflichtsektionen oder Format-Chaos $\rightarrow$ Rejection (`ERR_MARKDOWN_STRUCTURE_INVALID`).
- **TEST-08-02 (Quote Authenticity Against Evidence):**
  - *Objective:* Nachweis, dass im Markdown-Text zitierte Aussagen im Belegkorpus verankert sind.
  - *Pass Criteria:* Jedes Blockquote (`> "..."`) lässt sich zu mindestens 90 % deckungsgleich in einem Evidenz-Objekt des JSON auffinden.
  - *Failure Criteria:* Zitat unauffindbar $\rightarrow$ Rejection (`ERR_HALLUCINATED_REPORT_QUOTE`).

### 4.9 Cross Validation Tests / Parity Check
- **TEST-09-01 (Entity Parity Between Report and JSON):**
  - *Objective:* Mathematischer Beweis, dass Bericht und Wissensmodell dieselbe Analyse abbilden.
  - *Pass Criteria:* $\forall \text{org} \in \text{organizations}: \text{org.identity.name} \text{ existiert als Substring in } \text{report\_markdown}$.
  - *Failure Criteria:* Hoch bewertete Firma (`resonance_score > 0.85`) fehlt im Bericht oder umgekehrt $\rightarrow$ Rejection (`ERR_CROSS_PARITY_MISMATCH`).

### 4.10 Future Compatibility Tests
- **TEST-10-01 (Simulated Protocol v1.1 Upgrade & Graceful Degradation):**
  - *Objective:* Nachweis von Graceful Degradation bei zukünftigen Minor-/Patch-Schema-Erweiterungen.
  - *Input:* Simulierte Payload mit neuem Top-Level-Array (`"salary_trajectories": []`) und `protocol_version = "1.1.0"`.
  - *Pass Criteria:* Da die Major-Version übereinstimmt (`"1"`), überspringt der Validator das unbekannte Array ohne Exception, validiert alle v1.0-Entitäten fehlerfrei und stempelt `validation.status = "PASSED"`.
  - *Failure Criteria:* TypeError oder Rejection der kompletten Analyse wegen unbekannten Keys trotz gleicher Major-Version $\rightarrow$ Failure (`ERR_GRACEFUL_DEGRADATION_FAILED`).

---
*Ende des Master Compendiums SPEC-MASTER-CONDYN-CAP-v1.0. Das System ist hiermit kanonisch, unzerstörbar und vollumfänglich in Charlottenburger Systematik verankert.*
