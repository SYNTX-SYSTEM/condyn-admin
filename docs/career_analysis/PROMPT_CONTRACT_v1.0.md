# CONDYN CAREER ANALYSIS PROTOCOL v1.0
## KANONISCHER PROMPT-VERTRAG & INFERENZ-GRENZE (`PC-CONDYN-CAP-v1.0`)
**Dokument-ID:** `PC-CONDYN-CAP-v1.0`  
**Status:** ARCHITECTURE FREEZE v1.0 / INFERENZ-GRENZVERTRAG  
**Zielsystem:** Alle LLM-Inferenzmotoren (Gemini, Claude, GPT, Custom Models)  
**Stil & Diktion:** Charlottenburger Systematik (Höchste normative Strenge, keine prozedurale Toleranz, unbestechliche Präzision)

---

## PRÄAMBEL: DAS SOUVERÄNITÄTS-PRINZIP

Dieses Dokument definiert den **einzigen und verbindlichen Vertrag zwischen der CONDYN-Plattform und dem ausführenden Sprachmodell (LLM)**. Das LLM operiert als zustandslose, mechanische Extraktions- und Transformations-Engine. Jede Inferenzanfrage besteht aus exakt zwei Eingabe-Kapseln (`System Prompt` und `User Prompt`) und erzeugt exakt eine standardisierte Ausgabe-Kapsel (`Output Contract`). 

Abweichungen im Wortlaut, prozedurale Erklärungen oder das Verlassen des spezifizierten JSON-/Markdown-Schemas führen zur sofortigen Verwerfung durch den nachgelagerten **Runtime Integrity Validator**.

---

## 1. SYSTEM PROMPT CONTRACT

Der folgende System Prompt wird bei jeder Inferenzanfrage als unveränderliche Systeminstruktion übergeben. Er darf weder vom User noch vom ausführenden Code zur Laufzeit modifiziert werden.

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

---

## 2. USER PROMPT CONTRACT

Der User Prompt wird zur Laufzeit vom Backend konstruiert und verpackt den unstrukturierten Textkorpus nebst Trilatera-Metadaten in eine genormte Eingabeschale.

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

---

## 3. OUTPUT CONTRACT

Das Modell muss zwingend ein Top-Level-JSON-Objekt mit exakt zwei Hauptfeldern zurückgeben:
1. `report_markdown`: String (Valides GitHub Flavored Markdown für den Menschen).
2. `structured_data`: Objekt (Serialisierter Wissensgraph für Maschine & UI, strikt bifurkiert in `analysis` und `presentation`).

```json
{
  "$schema": "https://schema.condyn.eu/v1.0/career-analysis.json",
  "report_markdown": "# Career Analysis Report: Principal Systems Architect\n\n## 1. Executive Summary\n...",
  "structured_data": {
    "analysis": {
      "metadata": {
        "protocol_version": "1.0.0",
        "schema_version": "1.0.0",
        "prompt_contract_version": "PC-CONDYN-CAP-v1.0",
        "overall_confidence": 0.94,
        "validation_state": "UNVERIFIED"
      },
      "pipeline": { "steps": [ /* 5 objektive Fortschrittsstufen als Zustandsmodell */ ] },
      "documents": [ /* DOC_ IDs */ ],
      "consistency": { "overall_cohesion_score": 0.88, "clusters": [], "outlier_doc_ids": [] },
      "capabilities": [ /* CAP_ IDs gem. Universal Grammar */ ],
      "domains": [ /* DOM_ IDs gem. Universal Grammar */ ],
      "organization_classes": [ /* CLS_ IDs */ ],
      "organizations": [ /* ORG_ IDs mit country_iso und industry_enum */ ],
      "roles": [ /* ROL_ IDs gebunden via ROLE_IN_ORGANIZATION */ ],
      "opportunities": [ /* OPP_ IDs */ ],
      "strategies": [ /* STR_ IDs */ ],
      "search_queries": [ /* QRY_ IDs als echte Entitäten */ ]
    },
    "presentation": {
      "semantic_graph": { "nodes": [], "edges": [] },
      "ui_layout": { "center_node_id": "CAP_001", "concentric_rings": [], "color_tokens": {}, "default_views": {} }
    }
  }
}
```

---

## 4. JSON SCHEMA CONTRACT (UNIVERSAL ENTITY GRAMMAR)

Für jede Entität in `analysis.*` erzwingt der Vertrag folgendes exakte Sub-Schema (Die 7 Kardinaleigenschaften). Numerische Score-Werte liegen in [0.0, 1.0], während Attribute wie Enums oder Ländercodes Zeichenketten sind:

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

---

## 5. MARKDOWN CONTRACT

Der im String `report_markdown` übergebene Bericht muss folgende strukturelle Gesetze erfüllen:
1. **H1 Monopol:** Der Text beginnt mit genau einer `# H1` Überschrift.
2. **Obligatorische H2 Sektionen:** Folgende Überschriften müssen exakt vorkommen:
   - `## 1. Executive Summary`
   - `## 2. Structural Consistency & Cohesion`
   - `## 3. Reconstructed Capability Architecture`
   - `## 4. Target Ecosystem & Organization Resonance`
   - `## 5. Strategic Entry Strategies`
3. **Beweis-Authentizität:** Zitate in Blockquotes (`> "..."`) innerhalb des Berichts müssen verbatim mit den in `structured_data.analysis.*.evidence[].context_quote` abgelegten Beweisen übereinstimmen.

---
*Ende des kanonischen Prompt-Vertrags PC-CONDYN-CAP-v1.0. Das Modell ist hiermit unantastbar und in Charlottenburger Systematik an die 8 Invarianzregeln gebunden.*
