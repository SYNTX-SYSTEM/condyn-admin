# CONDYN Career Analysis Platform — Master Architecture & Platform Roadmap v1.0

**Architektur-Status:** Backend Core & Matching System vollständig implementiert und verifiziert (125 Tests — 100% Abdeckung)  
**Datum:** 8. Juli 2026  

---

## 1. Das Produktziel: Von der Analyse-Engine zur Entscheidungs-Plattform

CONDYN ist keine reine PDF-Parsing-App und kein generisches LLM-Frontend. CONDYN ist eine **semantische Karriere-, Governance- und Entscheidungsunterstützungs-Plattform**.

```text
Sources (PDF, GitHub, Web, CV, LinkedIn)
                 │
                 ▼
          Ingestion Layer
                 │
                 ▼
      CanonicalCareerAnalysis
                 │
                 ▼
     Company Pool Matching Engine
                 │
                 ▼
   Recommendation & Decision System
```

---

## 2. Abgeschlossener Core-Stack (Steps 1 – 16) ✅

Der gesamte Server- und Architektur-Kern ist formal abgeschlossen, verifiziert und nach dem **Dumb Consumer** Prinzip entkoppelt:

- **1. Schema & Grammar Layer (`lib/career/schema.ts`)**: Universal Entity Grammar & Zod-Verträge.
- **2. Types Layer (`lib/career/types.ts`)**: Lifecycle-Typen (`VerifiedCareerAnalysis`).
- **3. Validator Layer (`lib/career/validator.ts`)**: DAG-, Orphan-, Duplikat- und Evidenzprüfung.
- **4. Adapter & Provider Layer (`lib/career/providers/gemini.ts`)**: Server-side LLM Inferenzverträge.
- **5. Pipeline & Ingestion Layer (`lib/career/pipeline.ts`, `loaders/`)**: PDF, Text, Markdown & Batch Pipeline.
- **6. Persistence Repository (`lib/career/repository.ts`)**: JSONB Roundtrip & PostgreSQL/Drizzle-Kopplung.
- **7. Perception, ViewModel & Layout (`lib/career/view-model.ts`, `layout.ts`)**: Engine-neutrale topologische Projektion.
- **8. SVL v2.0 Presentation UI (`app/components/career/`)**: Semantisches CAD-Analyseinstrument mit Tangenten-Beschriftung und optischer Skalierung.
- **9. Encrypted Prompt Registry (`lib/career/prompts/`)**: Versionierte, per AES-256-GCM verschlüsselte und per SHA-256 integre Runtime-Prompts (Step 15).
- **10. Company Pool & Matching Engine (`lib/career/matching/`)**: Deterministische Resonanzberechnung gegen kontrollierte Wissensbestände (Step 16).

---

## 3. Die nächsten Produktbausteine (Steps 21 – 24)

Ab sofort werden keine weiteren Basis-Infrastrukturschichten mehr gebaut. Die Weiterentwicklung erfolgt ausschließlich durch Ausbau zum **Career Intelligence System**:

### Abgeschlossene Meilensteine (17 – 23) ✅
- **Step 18: Capability Deep Sweep Prompt System**: Versionierte, verschlüsselte und über den ActivePromptResolver auflösbare Runtime-Prompts.
- **Step 19: Multi-Source Ingestion Pipeline**: Serverseitige Ingestion für PDF, Website, GitHub Repository, Markdown und Text in einen einheitlichen `DocumentInput[]`-Strom inkl. Source Normalization Metadata.
- **Step 20: Recommendation Engine (Career Advisor)**: Deterministische Capability Gap Analysis, Evidence Enhancement und Next Actions direkt integriert in `POST /api/career/analyze` und `GET /api/career/analyses/[analysisId]`.
- **Step 21: Semantic Search (pgvector)**: Hybride semantische Vektorsuche (In-Memory + PgVectorStore) und EmbeddingProvider für Entitäten & Rollen.
- **Step 22: Career Intelligence Demo UI & SIL v3.0**: Hochmodernes wissenschaftliches Instrumenten-Dashboard unter `/career/demo` mit strikter Client-/Dumb-Consumer-Trennung, Continuous Semantic Space & Mini-HUD.
- **Step 23: Capability-to-Job Mapping Engine**: Deterministische Mapping-Engine (`lib/career/matching/job-mapping.ts`) mit feingranularer Evidenzdifferenzierung (Matched, Weak Evidence, Missing), Alias-/Domain-Matching und Explainability.

---

## 4. Die nächsten analytischen Kernschritte (Steps 24 – 27)

Ab sofort liegt der Fokus ausschließlich auf der Vertiefung der analytischen Wertschöpfung und Begründbarkeit:

### Step 24: Evidence Graph Engine ⭐⭐⭐⭐⭐
- **Ziel**: Nachvollziehbare Rückverfolgung von Rollenanforderungen bis zur Ursprungsquelle im Graphen:
  `Job Requirement -> Capability -> Evidence -> Original Source -> Line / Commit / Paragraph`
- **Wert**: Jeder Fit Score wird durch konkrete Textstellen, Commits oder Dokumente begründbar. Basis für L2 → L4 im Semantic Zoom.

### Step 25: Company Pool Ranking
- **Ziel**: Erweiterung der Mapping-Hierarchie von `Capabilities -> Jobs` auf `Capabilities -> Jobs -> Companies -> Markets`.
- **Wert**: Beantwortet strukturell, welche Organisationen und Märkte ganzheitlich zum Profil passen.

### Step 26: Career Gap Simulator
- **Ziel**: Simulations-Engine zur Berechnung von Score-Deltas bei hypothetischem Nachweis neuer Quellen oder Fähigkeiten (z. B. *"Wenn GitHub ergänzt wird: Fit = 0.82"*).
- **Wert**: Quantitative Priorisierung der wirksamsten Maßnahmen zur Schließung von Lücken.

### Step 27: Confidence Propagation
- **Ziel**: Ausbreitung von Evidenzdichte im semantischen Netz (z. B. 20 Kubernetes-Projekte erhöhen die Glaubwürdigkeit benachbarter Cloud-/DevOps-Knoten).
- **Wert**: Organisches Graphen-Verhalten statt isolierter Einzelbewertungen.

