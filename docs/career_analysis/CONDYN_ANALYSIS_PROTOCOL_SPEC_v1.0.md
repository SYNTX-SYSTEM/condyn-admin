# CONDYN CAREER ANALYSIS PROTOCOL v1.0
## ARCHITECTURAL RFC & KNOWLEDGE MODEL SPECIFICATION (`RFC-CONDYN-CAP-v1.0`)
**Dokument-ID:** `RFC-CONDYN-CAP-v1.0`  
**Status:** ARCHITECTURE FREEZE v1.0 / KANONISCHER VERTRAG  
**Gültigkeitsbereich:** LLM-Inferenz, Backend-Pipeline, Runtime Integrity Validator, Frontend Perception Engine  
**Stil & Diktion:** Charlottenburger Systematik (Höchste normative Strenge, keine prozedurale Toleranz, relationale Invarianz, unbestechliche Präzision)

---

## 1. EXECUTIVE SUMMARY & SYSTEMIC MANDATE
Dieses Dokument definiert den kanonischen Vertrag für die Transformation von unstrukturierten Berufs-, Projekt- und Karrieredokumenten in ein hochstrukturiertes, deterministisches **Knowledge Model** innerhalb der CONDYN-Plattform.

Das Ziel des Protokolls ist die vollständige **Entkopplung der Wissensrekonstruktion von spezifischen Sprachmodellen (LLMs)**. Das Protokoll fungiert als alleiniger Souverän (*Sole Sovereign*). Jede Modellgeneration (Gemini, Claude, GPT) muss sich diesem Spezifikationsvertrag unterwerfen. Ab diesem Zeitpunkt gilt das Eiserne Gesetz: **Jede Änderung an der Spezifikation muss durch einen konkreten, fehlgeschlagenen Testfall oder eine harte systemische Anforderung begründet sein.**

---

## 2. CORE ARCHITECTURAL INVARIANTS (DIE 8 KANONISCHEN GRUNDSÄTZE)

### 2.1 Deklarative Reinheit (*Declarative Purity - What, not How*)
Die Analyse rekonfiguriert ausschließlich **Wissen**, keine Erkenntniswege. Das Modell darf niemals prozedurale Narrative (*„Ich habe zuerst Dokument A analysiert...“*), Prompt-Reflexionen oder interne Modellrechtfertigungen ausgeben. Die Ausgabe beschreibt ausschließlich, **was** im Korpus strukturell nachgewiesen wurde. Modell-metadaten wie `gemini_reasoning` oder `claude_internal_chain` sind verboten.

### 2.2 Top-Level-Bifurkation (*Decoupled Truth and Presentation*)
Das zurückgegebene Top-Level-JSON trennt sich in `report_markdown` (für den Menschen) und `structured_data` (für die Maschine). Das Objekt `structured_data` trennt strikt zwischen zwei orthogonalen Welten:
- `analysis`: Die reine, domänenspezifische Wahrheit (Fähigkeiten, Firmen, Kanten, Belege). Enthält exakt null UI-/Styling-Daten.
- `presentation`: Die reine visuelle Projektionsanweisung (Kraftfeld-Ringe, Farb-Tokens, Knoten-Prioritäten). Enthält exakt null fachliche Erklärungen oder Graphen-Reasoning.

### 2.3 Universelle Entitäts-Grammatik (*Universal Entity Grammar*)
Jede Entität des Systems folgt unverbrüchlich den **7 ontologischen Kardinalfeldern**:
$$\text{Entity ID} \longrightarrow \text{Identity} \longrightarrow \text{Properties} \longrightarrow \text{Relationships} \longrightarrow \text{Evidence (inkl. Score)} \longrightarrow \text{Confidence} \longrightarrow \text{Validation}$$
Hierbei gilt die Typen-Strenge: Numerische Score-Attribute (`confidence`, `weight`, `resonance_score`, `cohesion_score`, `evidence_score`) liegen zwingend im geschlossenen Intervall $[0.0, 1.0]$. Textuelle Attribute (wie `country_iso`, `industry_enum`, `title`, `query`) sind valide Zeichenketten oder kanonische Enums.

### 2.4 Immutable ID Gesetz (*ID Immutability & Zero Recycling*)
Entitäts-IDs (`CAP_001`, `ORG_002`, `ROL_001`) sind **absolut immutable**. Einmal vergeben, dürfen sie niemals geändert, niemals überschrieben und niemals recycelt werden. Entfällt eine Entität in einer späteren Re-Analyse, wird ihre ID permanent stillgelegt. Dies ist die zwingende Voraussetzung für fehlerfreie historische Graphen-Diffs und zeitliche Rückverfolgbarkeit.

### 2.5 Kanonische Hierarchie: *Class $\rightarrow$ Organization $\rightarrow$ Role*
Die organisationale Abbildung folgt einer strikten, kanonischen Graphentrajektorie:
$$\text{Organization Class (CLS\_)} \longrightarrow \text{Concrete Organization (ORG\_)} \longrightarrow \text{Role (ROL\_)}$$
Eine Rolle (`ROL_`) existiert niemals im luftleeren Raum, sondern ist relationell über eine Kante des Typs `ROLE_IN_ORGANIZATION` an eine konkrete Firma oder Firmen-Klasse gebunden. Eine konkrete Firma (`ORG_`) ist zwingend über `BELONGS_TO_CLASS` mit einer abstrakten Firmen-Klasse verbunden.

### 2.6 Presentation Read-Only Invarianz & Frontend Dumb Rendering
1. **Presentation Read-Only Rule:** Der Ast `presentation` darf niemals semantische Daten in `analysis` modifizieren, anreichern oder überschreiben. Er besitzt ausschließlich lesenden Zugriff auf die verifizierten IDs des Fachmodells. Dies verhindert architektonische UI-Abkürzungen.
2. **Zero Frontend Inference Rule:** Das Frontend ist eine reine **Perception Engine** (Render-Maschine). Es darf niemals selbst Beziehungen inferieren, Kanten berechnen oder Entitäten außerhalb des gelieferten `ui_layout` gruppieren. Es rendert ausschließlich den vom Backend gelieferten, deterministischen Knowledge Graph.

### 2.7 Embedded Evidence Mandate mit Quantifizierung
Jede primäre Entität (`CAPABILITY`, `CONCRETE_ORGANIZATION`, `ROLE`, `STRATEGY`) muss im Array `evidence` intrinsisch verankert sein. Für jedes Zitat ist zwingend ein numerischer `evidence_score` ($0.0 \le s \le 1.0$) anzugeben, der die Beweiskraft des Belegs quantifiziert.

### 2.8 Search Queries als echte Entität (`QRY_`)
Suchanfragen sind keine einfachen Strings, sondern eigenständige domänenspezifische Entitäten (`QRY_`) mit strukturierten Properties (`title`, `query`, `purpose`, `target`, `priority`) und Kanten auf Fähigkeiten oder Firmen-Klassen.

---

## 3. DAS 8-STUFIGE DATENFLUSS-MODELL

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

---

## 4. DEFINITION DES KNOWLEDGE MODEL SCHEMAS (`analysis`)

Der Ast `analysis` innerhalb von `structured_data` gliedert sich in exakt **12 kanonische Top-Level-Sektionen (3 Objekte, 9 Domänen-Arrays)**:

```json
{
  "$schema": "https://schema.condyn.eu/v1.0/career-analysis.json",
  "report_markdown": "# Career Analysis Report\n\n## 1. Executive Summary\n...",
  "structured_data": {
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
      },
      "documents": [ /* DOC_ IDs */ ],
      "consistency": {
        "overall_cohesion_score": 0.88,
        "summary": "Höchste Kohäsion zwischen Architekturvorschlägen und Incident-Analysen.",
        "clusters": [ /* CLU_ IDs */ ],
        "outlier_doc_ids": [],
        "contradictions": []
      },
      "capabilities": [ /* CAP_ IDs gem. Universal Grammar */ ],
      "domains": [ /* DOM_ IDs gem. Universal Grammar */ ],
      "organization_classes": [ /* CLS_ IDs */ ],
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
      "opportunities": [ /* OPP_ IDs */ ],
      "strategies": [ /* STR_ IDs */ ],
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
    },
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
}
```

---

## 5. RUNTIME VALIDATION RULES & SYSTEMIC GOVERNANCE

### 5.1 Die 12 deterministischen Validierungsregeln
Der **Runtime Integrity Validator** prüft das vom LLM generierte JSON deterministisch und ohne KI:
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

### 5.2 Trilaterale Versionierung & Abwärtskompatibilität
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

### 5.3 Modulare Erweiterbarkeit & Ausfallstufen
- **Plug-and-Play:** Neue fachliche Dimensionen (z. B. `skill_gaps` oder `salary_trajectories`) werden als eigenständige Arrays auf Top-Level unter `analysis` eingehängt.
- **Ausfallstufen (Degradation Matrix):**
  1. *Total Invalidation:* Bei defektem JSON, Syntaxfehlern oder fehlenden Wurzelkreisen bricht die Pipeline mit HTTP 500 ab.
  2. *Partial Graph Repair:* Verweist eine Kante auf eine nicht existierende ID, wird die Kante gelöscht (`WARN_ORPHAN_EDGE_REMOVED`), das Rendering für den restlichen Graphen bleibt intakt (keine komplette Rejection).
  3. *Low Confidence Warning:* Fällt `overall_confidence` unter `0.65`, wird das Modell gerendert, aber mit einem prominenten Warn-Banner im UI versehen.
  4. *Outlier Isolation:* Dokumente mit einem Kohäsions-Score $< 0.30$ werden ins Array `consistency.outlier_doc_ids` verschoben und von der Kanten-Generierung ausgeschlossen.

---
*Ende des kanonischen Protokollvertrags RFC-CONDYN-CAP-v1.0. Das Protokoll ist der alleinige Souverän.*
