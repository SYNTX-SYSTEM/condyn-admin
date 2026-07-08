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

## 3. Die nächsten Produktbausteine (Steps 20 – 22)

Ab sofort werden keine weiteren Basis-Infrastrukturschichten mehr gebaut. Die Weiterentwicklung erfolgt ausschließlich durch Aufbau auf der fertigen Architektur:

### Abgeschlossene Meilensteine (17 – 19) ✅
- **Step 18: Capability Deep Sweep Prompt System**: Versionierte, verschlüsselte und über den ActivePromptResolver auflösbare Runtime-Prompts.
- **Step 19: Multi-Source Ingestion Pipeline**: Serverseitige Ingestion für PDF, Website, GitHub Repository, Markdown und Text in einen einheitlichen `DocumentInput[]`-Strom inkl. Source Normalization Metadata.

---

### Step 20: Recommendation Engine (Career Advisor) — Nächster Fokus
- **Ziel**: Transformation vom reinen Matcher zum proaktiven Career Advisor.
- **Funktionsumfang**:
  - Welche Capability fehlt oder ist schwach?
  - Welche Organisation und Rolle passt deshalb am besten?
  - Welche Evidenz fehlt im Profil?
  - Welche Dokumente oder Nachweise würden die Confidence gezielt erhöhen?

### Step 21: Semantic Search (pgvector)
- **Ziel**: Hybride semantische Vektorsuche für alle Entitäten (Capabilities, Roles, Strategies, Organizations, Opportunities).
- **Funktionsumfang**:
  - Embedding-Generierung für Entitäten.
  - Semantisches Matching („Zeige mir Organisationen, die semantisch zu meinem Profil passen, auch ohne identische Capability-Namen“).

### Step 22: Company Pool Editor (Admin Management)
- **Ziel**: Administratives Verwaltungssystem für Wissensbestände.
- **Funktionsumfang**:
  - Pools anlegen, Rollen und Capability Requirements pflegen.
  - Versionierung und Lifecycle-Steuerung (`DRAFT -> ACTIVE -> ARCHIVED`).
