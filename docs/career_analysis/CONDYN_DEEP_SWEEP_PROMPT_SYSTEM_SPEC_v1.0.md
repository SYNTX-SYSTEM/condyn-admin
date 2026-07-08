# CONDYN Career Analysis Protocol v1.0 — Step 18a: Capability Deep Sweep Prompt System Specification

**Spezifikations-Version:** 1.0  
**Architektur-Status:** Implementiert & Verifiziert (TDD — 100% Abdeckung)  
**Datum:** 8. Juli 2026  

---

## 1. Das 7-stufige Deep Sweep Prompt System

Um die Extraktions-, Matching- und Empfehlungsqualität der CONDYN-Plattform formal sicherzustellen, arbeitet die Architektur mit einem **7-stufigen spezialisierten Prompt-System**, das per AES-256-GCM verschlüsselt und per SHA-256 integritätsgesichert in der Prompt Registry verankert ist.

### 1.1 Kanonische Slugs (`DEEP_SWEEP_PROMPT_SLUGS`)

| # | Slug | Zweck |
| :--- | :--- | :--- |
| **1** | `capability-deep-sweep` | Extraktion technischer Fähigkeiten, Domänenzugehörigkeit, Konfidenz und Quell-Evidenzen. |
| **2** | `organization-deep-sweep` | Rekonstruktion von Unternehmensstrukturen, Branchen und Skaleneinstufung. |
| **3** | `role-deep-sweep` | Identifikation expliziter und impliziter Karriererollen, Senioritäten und Wirkungskreise. |
| **4** | `opportunity-deep-sweep` | Analyse latenter Wachstumspotenziale und technischer Übergangspfade. |
| **5** | `strategy-deep-sweep` | Formulierungen zur langfristigen strategischen Positionierung. |
| **6** | `search-query-generation` | Synthese gezielter Suchabfragen für das Company-Pool-Matching. |
| **7** | `recommendation-generation` | Erzeugung erklärbarer Handlungsempfehlungen bei erkannten Skill-Gaps. |

---

## 2. Invarianten & Seeding-Vertrag (`seedPromptSystem`)

- Jedes Template wird mit `domain: "career_analysis"` initialisiert.
- Jede Version wird als `status: "ACTIVE"` mit Zero-Plaintext im Repository (`encrypted_content` + `content_checksum`) abgelegt.
- Die Auflösung zur Laufzeit über den `ActivePromptResolver` liefert ausschließlich integre Klartexte nach erfolgreicher Checksummenprüfung.
