# CONDYN / SYNTX — Backend-Architektur & Systemstand (Executive & Technical Summary v1.0)

> **"We are no longer building a career app. The career product is the first vertical. Underneath, ConDyn is already becoming decision infrastructure."**

CONDYN ist eine **Evidence-driven Decision Infrastructure**. Der Career-Use-Case ist der erste sichtbare vertikale Anwendungsfall.

Der Kernfluss lautet:
```text
Source
  ↓
Evidence
  ↓
Capability / Fact
  ↓
Requirement / Constraint
  ↓
Job / Role / Organization / Decision
  ↓
Explanation / Traceable Proof Chain
```

---

## 1. Was das Backend implementiert hat (Stand: >190 Tests, 100% grün)

### 1. Multi-Source Ingestion
- Unterstützte Quellen: `PDF`, `Text`, `Markdown`, `Website URL`, `GitHub Repository`, `Mixed Batches`.
- Alle Quellen werden in das kanonische Format `DocumentInput[]` mit strukturierter `SourceMetadata` überführt (inkl. SHA-256 Hashes, URI und Zeitstempel).

### 2. PDF & Website & GitHub Server-Side Processing
- **PDF**: Serverseitige Buffer-Verarbeitung via `pdf-parse`, Abweisung leerer/korrupter Dateien via `ERR_PDF_PARSE_FAILURE`.
- **Website**: Validierung der URL, Abruf und Bereinigung von HTML-Skeletten, Normalisierung auf `DocumentInput`.
- **GitHub**: Serverseitige Extraktion von `README.md`, `package.json` und `/docs/*.md` in einheitliche `DocumentInput[]`.

### 3. Encrypted Prompt Registry & Verification Harness
- Prompts sind verschlüsselte (`AES-256-GCM`), versionierte Runtime-Artefakte mit SHA-256 Checksummenprüfung.
- Der `ActivePromptResolver` erzwingt, dass zur Laufzeit ausschließlich `ACTIVE` zertifizierte Versionen geladen werden.
- Der `Prompt Verification Harness` prüft alle Prompts automatisiert gegen die `UniversalEntitySchema`-Verträge.

### 4. Resilient LLM Inference & Multi-Model Failover Cascade (Step 27)
- **InferenceProviderRouter**: Bietet autonome Ausfallsicherheit via Modell-Kaskade (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-pro` → `gemini-1.5-flash`).
- **Auditierbare Telemetrie**: Jeder Kaskadenversuch protokolliert Latenz, Status (`SUCCESS`, `RATE_LIMITED`, `FAILED`) und Fehlergründe via `InferenceTelemetry`.
- **Identischer Output-Vertrag**: Jede Modell-Antwort muss ausnahmslos denselben Zod Runtime Validator passieren – kein Fallback umgeht die Validierung (`VERIFIED`).

### 5. Canonical Analysis Core & Runtime Validator
- **CanonicalCareerAnalysis**: Einheitliches, streng validiertes Datenmodell mit Universeller Entitäts-Grammatik (`entity_id`, `identity`, `properties`, `relationships`, `evidence`, `confidence`).
- **Runtime Validator**: Prüft JSON-Struktur, Referenz-Integrität, Zyklenfreiheit im DAG, Wertebereiche und vergibt das Gütesiegel `VERIFIED`.

### 6. Graph Engine & Semantic Interface Language (SIL v3.0)
- **Perception & ViewModel Layer**: Transformiert verifizierte Analysen in entkoppelte Graphen für `ReactFlow` und `D3`.
- **Continuous Semantic Space**: L0–L4 Planetarium-Interface mit Live-Telemetrie-HUDs unten rechts (`InferenceTelemetryHUD`) und oben links (`SourceDock`).
- **Capability-to-Job Mapping Engine**: Deterministisches Mapping von Fähigkeiten auf Anforderungsprofile mit erklärbarem `fitScore`, `missingCapabilities` und `weakEvidence`.

---

## 2. Kurzfassung für Executive Review

CONDYN verbindet:
1. **Verifizierbare Quellen-Ingestion**
2. **Kaskadierende, resiliente KI-Inferenz mit striktem Datenvertrag**
3. **Erklärbare Graphen-Entscheidungen (Evidence-driven Decision Infrastructure)**

Überall dort, wo eine Entscheidung auditierbar begründet werden muss – ob Karriere, Underwriting, Procurement oder Compliance – liefert CONDYN die Antwort auf:
> **"Show me the evidence."**
