# CONDYN Career Analysis Protocol v1.0 — Step 16: Company Pool & Matching Engine Specification

**Spezifikations-Version:** 1.0  
**Architektur-Status:** Implementiert & Verifiziert (TDD — 100% Abdeckung)  
**Datum:** 8. Juli 2026  

---

## 1. Architektonisches Leitbild

Mit Step 16 wechselt CONDYN von einer reinen Analyse-Engine zu einem **deterministischen Empfehlungs- und Matching-System**. Anstatt dass LLMs freie Organisationen oder Stellen halluzinieren, wird jede validierte Analyse (`VerifiedCareerAnalysis`) gegen einen kontrollierten und versionierten Wissensbestand (`CompanyPoolData`) abgeglichen.

### 1.1 Invarianten der Matching Engine (CP-I)

| Invariante | Formale Definition | Verifikationsregel |
| :--- | :--- | :--- |
| **CP-I1: Active Pool Sovereignty** | Die Matching Engine verarbeitet ausschließlich Pools im Status `ACTIVE`. | Jeder Aufruf mit `status !== "ACTIVE"` wirft unverzüglich `ERR_INACTIVE_COMPANY_POOL`. |
| **CP-I2: Deterministische Resonanz** | Das Scoring erfolgt rein mathematisch ohne LLM-Inferenz oder Vektoreinbettungen. | Der Score wird streng auf `[0.0, 1.0]` normiert. |
| **CP-I3: Erklärbarkeit (Explainability)** | Jedes Rollenergebnis liefert explizit `matchedCapabilities[]`, `missingCapabilities[]` und `scoreBreakdown[]`. | Kein Match-Score existiert ohne detaillierten Nachweis der beitragenden/fehlenden Anforderungen. |
| **CP-I4: Gewichtungs-Einfluss** | Höher gewichtete Anforderungen (`weight <= 1.0`) beeinflussen den Gesamt-Resonanzscore stärker als niedriger gewichtete Anforderungen. | TDD verifiziert monotones Verhalten des Scores bei Gewichtungsänderungen. |

---

## 2. Modul-Architektur (`lib/career/matching/`)

```
lib/career/matching/
├── pool.ts          # Zod-Schemas (CompanyPool, PoolOrganization, PoolRole, PoolCapabilityRequirement)
├── scoring.ts       # Erklärbarer deterministischer Resonanz-Algorithmus
├── engine.ts        # matchCareerAnalysisAgainstPool (Governance & Sortierung)
└── demo-pool.ts     # Kuratierter Standard-Pool (Siemens, Helsing, SAP, Bosch, Aleph Alpha)
```

---

## 3. Fehlerkatalog

| Error Code | Auslöser |
| :--- | :--- |
| `ERR_INACTIVE_COMPANY_POOL` | Ein Pool mit Status `DRAFT` oder `ARCHIVED` wird an die Matching Engine übergeben. |
| `ZodError (weight bounds)` | `weight` in `PoolCapabilityRequirement` ist größer als `1.0` oder kleiner als `0.0`. |
