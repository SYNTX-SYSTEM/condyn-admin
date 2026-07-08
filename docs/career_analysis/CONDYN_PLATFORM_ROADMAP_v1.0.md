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

## 3. Die nächsten Produktbausteine (Steps 17 – 21)

Ab sofort werden keine weiteren Basis-Infrastrukturschichten mehr gebaut. Die Weiterentwicklung erfolgt ausschließlich durch Aufbau auf der fertigen Architektur:

### Step 18: Capability Deep Sweep Prompt System (Priorität 1)
- Einbindung und Aktivierung des spezialisierten Multi-Stage Prompt-Systems (`capability-deep-sweep`, `organization-deep-sweep`, `role-deep-sweep`, etc.) als versionierte, verschlüsselte Artefakte in die Encrypted Prompt Registry.

### Step 17: Company Pool Editor (Priorität 2)
- Admin-UI und Lifecycle-Verwaltung (`DRAFT -> ACTIVE`) zur Pflege von Organisationen, Rollen, Anforderungen und Suchstrategien im Company Pool.

### Step 19: Multi-Source Ingestion
- Erweiterung des Ingestion-Layers um GitHub Repository Loader, Website Loader und LinkedIn/Profile-Adapter.

### Step 20: Recommendation Engine
- Handlungsorientierte Entscheidungsunterstützung: Erklärung von Skill-Gaps, Ableitung konkreter Lern- und Projektschritte zur Erhöhung des Resonanz-Scores.

### Step 21: Semantic Search (pgvector)
- Hybride semantische Vektorsuche zur Flankierung der deterministischen Graphen- und Resonanzanalyse.
