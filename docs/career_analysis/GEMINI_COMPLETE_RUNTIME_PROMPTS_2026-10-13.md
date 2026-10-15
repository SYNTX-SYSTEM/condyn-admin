# GEMINI COMPLETE RUNTIME PROMPTS — 2026-10-13

Vollständige, tatsächlich wirksame Gemini-Prompts, Schemas, Laufzeitparameter und gespeicherte Ausgaben der Decision-Loop-Labs-Fähigkeitsrekonstruktion aus einem hochgeladenen PDF.
Grundlage: die beiden echten Worker-Läufe des E2E-Sweeps vom 2026-10-13 (Bericht `JOB_FIELD_E2E_SWEEP_2026-10-13.md`), ausschließlich synthetische Testdaten.

## Kennzeichnung

- **ORIGINAL**: persistiertes Laufzeitartefakt, byte-identisch aus der E2E-Wegwerf-Datenbank.
- **RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS**: Die Prompt-Requests selbst werden zur Laufzeit nicht gespeichert. Sie wurden hier erzeugt, indem die unveränderten Builder-Funktionen des Commits `0a8a57dab1cff11107c1a12044fd9c7286112ade` (genau der Stand, auf dem der Worker lief) mit den persistierten Eingaben aufgerufen wurden. Die Treue ist kryptografisch gegen die gespeicherten Run-IDs und Hashes geprüft (Teil 4.5).
- **RAW RESPONSE NOT AVAILABLE**: Der rohe Antworttext von Gemini wird in keiner Stufe persistiert. Gezeigt werden stattdessen die vollständigen tatsächlich gespeicherten Artefakte.
- Keine neuen Gemini-Aufrufe, keine Codeänderung, keine Datenbankänderung (Zugriff nur in einer `READ ONLY`-Transaktion), keine Schlüssel.

## Laufzeitkette beim PDF-Upload (top-down)

1. `POST /api/career/analyze` (`app/api/career/analyze/route.ts`) legt nur einen Job in `career_analysis_jobs` an (PDF als Base64). **Kein Gemini-Aufruf.**
2. Der Worker `scripts/run-career-worker.ts` übernimmt den Job → `createCareerAnalysisJobProcessor` (`lib/career/orchestration/career-analysis-job-processor.ts`):
   1. `RECOVERY_CHECK`;
   2. `SOURCE_PREPARATION`: `prepareDocuments` → PDF-Textextraktion lokal, **kein Gemini**; `loadedAt` wird auf die Job-Zeit fixiert;
   3. Candidate Source Bundle `CSB_<jobId>` wird persistiert;
   4. **Gemini-Aufruf 1 — Capability Discovery** (`runCapabilityDiscovery`, Kernel `capability-discovery-v1`);
   5. **Gemini-Aufruf 2 — Capability Convergence** (`runCapabilityConvergence`, Kernel `capability-convergence-v1`; nur wenn mindestens ein Kandidat `EVIDENCE_PASSED` ist);
   6. **Gemini-Aufruf 3 — Legacy Career Analysis** (`executeCareerAnalysisPipeline`, `buildCareerAnalysisPrompt`);
   7. `PERSISTENCE` der kanonischen Analyse, Projektionsreferenz Analyse ⇄ Discovery-/Convergence-Run.
3. Pro PDF also genau **drei** Gemini-Inferenzschritte. Die Reihenfolge ist Discovery → Convergence → Legacy; die Gliederung unten folgt der vorgegebenen Struktur (Legacy zuerst).

## Vorhanden, aber zur Laufzeit NICHT ausgeführt

- **Prompt Registry `capability-deep-sweep`** und sechs weitere „Deep Sweep“-Vorlagen (`lib/career/prompts/system.ts`):
  - Der Worker übergibt `executeCareerAnalysisPipeline` keinen `promptResolver`. `buildCareerAnalysisPromptWithResolver` gibt deshalb nur das Basis-Bundle zurück; der Registry-Text wird nicht vorangestellt (`promptMetadata` bleibt leer).
  - `seedPromptSystem` wird im Worker nicht aufgerufen.
  - Volltext in Anhang A, zur Abgrenzung.
- **Verification-Stufe:** Der Worker führt sie nicht aus. Der Eintrag `VFY_C5AE2A99D96FA284C20A38EC` in der Datenbank sowie `RUN_140FC22A39FFC0713C50349E` und `CONV_06A958246213B4129DD88A83` sind Fixture-Daten der Laborwelt (Provider `provider`, Modell `discovery-model`), keine Gemini-Läufe.
- **Embeddings (`lib/career/embeddings/gemini.ts`):** werden im PDF-Pfad nicht aufgerufen.
- **Job-Pool-Matching:** rein deterministisch, ohne Modell (`presentation-matching.ts`, CP-I2).

## Synthetische Testanalysen

| Kürzel | Job | Analyse | Quelle (PDF im Repo) | Discovery-Run | Convergence-Run |
|---|---|---|---|---|---|
| A1 | `JOB_1791904911180_388` | `ANL_1791904911180_388` | ENGINEERING-Lebenslauf: `docs/examples/cv.synthetic.pdf` | `RUN_AD78E73E4C84D315317E8156` | `CONV_9029DF3D5ECD901B04CD95FD` |
| A2 | `JOB_1791905099818_748` | `ANL_1791905099818_748` | AI-&-DATA-Lebenslauf: `docs/career_analysis/evidence/job-pool/e2e-sweep-2026-10-13/testdata/cv-ai-data.synthetic.pdf` | `RUN_640B00F97E1A1476178527E4` | `CONV_E66D9CFFAC0EF1F52B36052E` |

Die System-Prompts und Schemas sind für beide Analysen identisch. Die User-Prompts unterscheiden sich nur im Quelldokument und werden für A1 und A2 jeweils vollständig wiedergegeben.

## Exakter Request-Aufbau (alle drei Stufen)

Alle drei Stufen rufen `@google/genai` 2.10.0 → `ai.models.generateContent({ model, contents, config })` auf.
- **`contents`:** ein einzelner String, nämlich `systemPrompt + "\n\n" + userPrompt`.
- **Nicht gesetzt:** `systemInstruction`, Rollenstruktur, `safetySettings`, `topP`, `topK`, `seed`, `thinkingConfig`, `candidateCount` und `stopSequences`; es gelten die Gemini-Defaults.
- Die getrennte Darstellung von System- und User-Prompt unten entspricht damit den beiden Hälften dieses einen Strings.

---

# PART 1 — LEGACY CAREER ANALYSIS

Builder: `buildCareerAnalysisPrompt` (`lib/career/adapter.ts`), über `buildCareerAnalysisPromptWithResolver(documents, undefined)` aus `executeCareerAnalysisPipeline` (`lib/career/pipeline.ts`). Provider: `GeminiProvider` (`lib/career/providers/gemini.ts`).

## 1.A Complete System Prompt

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — statischer Text im Code, ohne Laufzeitanteile; für A1 und A2 identisch**

```
CONDYN CAREER ANALYSIS PROTOCOL v1.0 - SYSTEM INSTRUCTIONS

You are a deterministic, enterprise-grade AI analysis engine for career and capability mapping.
You MUST adhere strictly to the following 8 canonical Invariance Rules:

1. Invariance Rule 1: No external assumptions / hallucination. Only derive entities, relationships, and evidence directly from the provided document corpus. Everything must be grounded in verbatim evidence.
2. Invariance Rule 2: Evidence Constraints. EVERY emitted semantic entity MUST contain at least one grounded evidence item from the supplied source documents. context_quote MUST be verbatim source text exceeding 10 characters. If no grounded evidence exists, OMIT THE ENTITY. Never emit an unsupported semantic entity.
3. Invariance Rule 3: Normalized score bounds exactly within closed interval [0.0, 1.0].
4. Invariance Rule 4: Universal Entity Grammar enforcement across all domain entities. Use only canonical relationship semantics ("SUPPORTS", "REQUIRES", "RESONATES_WITH", "CONFLICTS_WITH", "DERIVED_FROM", "BELONGS_TO_CLASS", "ROLE_IN_ORGANIZATION").
5. Invariance Rule 5: ROLE EXTRACTION RULE: A Role may only be emitted when the source contains sufficient evidence for both the Role itself AND the Organization context in which that Role exists.
   - If a Role is emitted, the referenced Organization MUST exist in the "entities" array.
   - The Role MUST contain a "ROLE_IN_ORGANIZATION" relationship where "target_id" references that existing Organization entity.
   - Both Role and relationship MUST be grounded in source evidence.
   - DO NOT invent or create a placeholder Organization.
   - DO NOT emit an orphan Role.
   - DO retain any independently grounded capabilities normally.
6. Invariance Rule 6: Schema Compliance. Return only the exact JSON inference data required by the schema. Do not generate pipeline stats, topological mappings, or timestamps.
7. Invariance Rule 7: Produce a concise analytical report_markdown based only on the evidence.
8. Invariance Rule 8: Strict JSON syntax & Universal Entity Grammar compliance. Output MUST be valid parseable JSON strictly adhering to the schema.
   - ALL entities must be emitted in the single "entities" array, discriminated by "entity_kind".
   - Inject required specialized canonical properties directly into the generic "properties" object of that entity.
   - If values cannot be grounded from evidence, DO NOT fabricate them. Omit the entity instead.
   - ORGANIZATION: properties MUST contain "country_iso", "industry_enum", and "resonance_score".
   - ORGANIZATION.country_iso MUST be ISO-3166-1 alpha-2: exactly 2 uppercase ASCII letters (examples: DE, US, CH). Country names are forbidden; alpha-3 codes are forbidden; lowercase is forbidden. If the country cannot be grounded from evidence, do not fabricate it; omit the ORGANIZATION entity.
   - ROLE: properties MUST contain "seniority" and "domain_focus".
   - SEARCH_QUERY: properties MUST contain "title", "query", "purpose", "target", and "priority".
   - Other entity kinds may use arbitrary grounded key/value properties through the generic catchall.
```

Zeichen: 3129 · SHA-256 (UTF-8): `49ab01d3ed6a6860874c6b393a0bcd7d4b1014bd260653afc0cbce760de3e68b` (hier berechnet; die Legacy-Stufe speichert keine Prompt-Checksumme).

## 1.B Complete User Prompt

### 1.B.1 A1 — ENGINEERING-Lebenslauf (`ANL_1791904911180_388`)

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — Builder-Code plus persistierter Quelltext; Quelltext hash-gleich mit Candidate Source Bundle und Discovery-Run**

````
PROMPT CONTRACT: PC-CONDYN-CAP-v1.0
Protocol Version: v1.0
Schema Version: v1.0
Prompt Contract Version: PC-CONDYN-CAP-v1.0
Document Count: 1

AVAILABLE SOURCE DOCUMENTS:
- DOC_001: cv.synthetic.pdf
Evidence must reference ONLY these exact IDs.

=== INPUT CORPUS ===
--- DOCUMENT METADATA (ID: DOC_001, Title: cv.synthetic.pdf) ---
Alex Example — Curriculum Vitae
Synthetic test profile for the CONDYN manual workflow. Not a real person.
Profile
Senior software engineer with eight years of experience building web platforms and data pipelines
in logistics. Focus on TypeScript, React and Node.js, relational databases and automated testing.
Experience
Senior Software Engineer, Nordwind Logistics GmbH, Hamburg — 2020 to 2026
• Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to
strict TypeScript.
• Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against
WCAG 2.1.
• Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting
queries.
• Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%.
• Set up CI/CD pipelines with GitHub Actions and built Docker images for every service.
• Led a team of four engineers and ran the weekly architecture review.
Software Developer, Datenwerk AG, Berlin — 2017 to 2020
• Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.
• Modelled the dimensional data model for monthly carrier reports.
• Deployed services to a Kubernetes test cluster and maintained Linux build agents.

-- 1 of 2 --

Education
B.Sc. Computer Science, Technische Universität Berlin, 2017. Thesis: event stream processing for
parcel tracking.
Skills
TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, SQL, Python, Apache Kafka,
Docker, GitHub Actions, Jest, Kubernetes (basic), Linux.
Languages
German (native), English (C1).
Certifications
None listed.

-- 2 of 2 --
====================

EXECUTION INSTRUCTIONS:
Analyze the input corpus above and generate the canonical Career Analysis Report according to PC-CONDYN-CAP-v1.0.
WICHTIG: Bitte ausschließlich valides JSON als Ausgabe liefern. Kein Markdown Code-Wrapper!
DO NOT wrap the output in ```json or any markdown block. Return ONLY the raw JSON object string starting with { and ending with }.
````

Zeichen: 2362 · SHA-256: `1fe709030790dca8563e6e795150ec6856b146ebf8cc4db004895974b33ffceb` · gesendeter `contents`-String (System + `\n\n` + User): 5493 Zeichen, SHA-256 `b9e5f3e319119600cd022b1338bb7ba4f2fe5b403e6f44951ada9e94ee6f4902`.

### 1.B.2 A2 — AI-&-DATA-Lebenslauf (`ANL_1791905099818_748`)

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — Builder-Code plus persistierter Quelltext; Quelltext hash-gleich mit Candidate Source Bundle und Discovery-Run**

````
PROMPT CONTRACT: PC-CONDYN-CAP-v1.0
Protocol Version: v1.0
Schema Version: v1.0
Prompt Contract Version: PC-CONDYN-CAP-v1.0
Document Count: 1

AVAILABLE SOURCE DOCUMENTS:
- DOC_001: cv-ai-data.synthetic.pdf
Evidence must reference ONLY these exact IDs.

=== INPUT CORPUS ===
--- DOCUMENT METADATA (ID: DOC_001, Title: cv-ai-data.synthetic.pdf) ---
Mira Feldmann — Curriculum Vitae
Synthetic test profile for the CONDYN end-to-end test. Not a real person.
Profile
Data and machine learning engineer with seven years of experience in streaming data platforms, MLOps and
applied large language model systems in the energy sector. Focus on Python, Apache Kafka, Apache Flink,
Kubernetes and retrieval-augmented generation.
Experience
Senior Data Engineer, Stromnetz Nord Analytics GmbH, Bremen — 2021 to 2026
Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000
smart meter readings per second.
Introduced Avro schemas with a schema registry and managed backward-compatible schema evolution
across 25 topics.
Implemented data quality checks with Great Expectations and reduced faulty billing records by 60%.
Set up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models.
Ran ML pipelines on Kubernetes with Argo Workflows and provisioned the infrastructure with Terraform.
Built model monitoring dashboards that detect drift in load forecasts and trigger retraining.
Machine Learning Engineer, Wattwerk AI GmbH, Hamburg — 2019 to 2021
Developed time series forecasting models for grid load in Python with PyTorch and LightGBM.
Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an
LLM, vector search and structured JSON output; reduced hallucinated answers through citation checks.
Fine-tuned a small language model with LoRA for classifying maintenance tickets.
Modelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for
duplicate equipment records.
Education
M.Sc. Data Science, Universität Hamburg, 2019. Thesis: probabilistic load forecasting.
Skills
Python, SQL, Apache Kafka, Apache Flink, Avro, Great Expectations, MLflow, Argo Workflows, Kubernetes,
Terraform, Docker, PyTorch, LightGBM, Neo4j, LangChain, vector databases.
Languages
German (native), English (C1).
Certifications
Certified Kubernetes Application Developer (CKAD), 2022.

-- 1 of 1 --
====================

EXECUTION INSTRUCTIONS:
Analyze the input corpus above and generate the canonical Career Analysis Report according to PC-CONDYN-CAP-v1.0.
WICHTIG: Bitte ausschließlich valides JSON als Ausgabe liefern. Kein Markdown Code-Wrapper!
DO NOT wrap the output in ```json or any markdown block. Return ONLY the raw JSON object string starting with { and ending with }.
````

Zeichen: 2802 · SHA-256: `3e39d9e553542abc0a74b501a752a5979ea0a508fc881c5f6413f33f8b89e04f` · gesendeter `contents`-String (System + `\n\n` + User): 5933 Zeichen, SHA-256 `7e0b440332f4439c61efe1174754775e127b0e0da8676385904e2af13f206f58`.

## 1.C Complete Response Schema

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — `getGeminiCareerResponseJsonSchema(allowedDocIds)` (`lib/career/schema-projector.ts`), Zod → JSON Schema 2019-09, Root-`$ref` aufgelöst, bereinigt, `doc_id`-Enum injiziert; für A1 und A2 identisch (`allowedDocIds = ["DOC_001"]`)**

```json
{
  "type": "object",
  "properties": {
    "report_markdown": {
      "type": "string"
    },
    "consistency": {
      "type": "object",
      "properties": {
        "overall_cohesion_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "summary": {
          "type": "string"
        },
        "clusters": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "cluster_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "cohesion_score": {
                "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
              },
              "doc_ids": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "description": {
                "type": "string"
              },
              "dominant_concept": {
                "type": "string"
              }
            },
            "required": [
              "cluster_id",
              "name",
              "cohesion_score",
              "doc_ids"
            ],
            "additionalProperties": false
          }
        },
        "outlier_doc_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "contradictions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "overall_cohesion_score"
      ],
      "additionalProperties": false
    },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "entity_kind": {
            "type": "string",
            "enum": [
              "CAPABILITY",
              "DOMAIN",
              "ORGANIZATION_CLASS",
              "ORGANIZATION",
              "ROLE",
              "OPPORTUNITY",
              "STRATEGY",
              "SEARCH_QUERY"
            ]
          },
          "entity_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "properties": {
            "type": "object",
            "properties": {
              "country_iso": {
                "type": "string"
              },
              "industry_enum": {
                "type": "string"
              },
              "resonance_score": {
                "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
              },
              "seniority": {
                "type": "string"
              },
              "domain_focus": {
                "type": "string"
              },
              "title": {
                "type": "string"
              },
              "query": {
                "type": "string"
              },
              "purpose": {
                "type": "string"
              },
              "target": {
                "type": "string"
              },
              "priority": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "number"
                },
                {
                  "type": "boolean"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              ]
            }
          },
          "relationships": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "target_id": {
                  "type": "string"
                },
                "relation_type": {
                  "type": "string",
                  "enum": [
                    "SUPPORTS",
                    "REQUIRES",
                    "RESONATES_WITH",
                    "CONFLICTS_WITH",
                    "DERIVED_FROM",
                    "BELONGS_TO_CLASS",
                    "ROLE_IN_ORGANIZATION"
                  ]
                },
                "weight": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 1
                }
              },
              "required": [
                "target_id",
                "relation_type"
              ],
              "additionalProperties": false
            }
          },
          "evidence": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "doc_id": {
                  "type": "string",
                  "enum": [
                    "DOC_001"
                  ]
                },
                "location": {
                  "type": "string"
                },
                "context_quote": {
                  "type": "string"
                },
                "evidence_score": {
                  "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
                },
                "significance_explanation": {
                  "type": "string"
                }
              },
              "required": [
                "doc_id",
                "location",
                "context_quote"
              ],
              "additionalProperties": false
            },
            "minItems": 1
          },
          "confidence": {
            "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
          }
        },
        "required": [
          "entity_kind",
          "entity_id",
          "name",
          "properties",
          "evidence",
          "confidence"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "report_markdown",
    "consistency"
  ],
  "additionalProperties": false,
  "$defs": {
    "GeminiCareerInference": {
      "type": "object",
      "properties": {
        "report_markdown": {
          "type": "string"
        },
        "consistency": {
          "type": "object",
          "properties": {
            "overall_cohesion_score": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "summary": {
              "type": "string"
            },
            "clusters": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "cluster_id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "cohesion_score": {
                    "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
                  },
                  "doc_ids": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "description": {
                    "type": "string"
                  },
                  "dominant_concept": {
                    "type": "string"
                  }
                },
                "required": [
                  "cluster_id",
                  "name",
                  "cohesion_score",
                  "doc_ids"
                ],
                "additionalProperties": false
              }
            },
            "outlier_doc_ids": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "contradictions": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "overall_cohesion_score"
          ],
          "additionalProperties": false
        },
        "entities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "entity_kind": {
                "type": "string",
                "enum": [
                  "CAPABILITY",
                  "DOMAIN",
                  "ORGANIZATION_CLASS",
                  "ORGANIZATION",
                  "ROLE",
                  "OPPORTUNITY",
                  "STRATEGY",
                  "SEARCH_QUERY"
                ]
              },
              "entity_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "code": {
                "type": "string"
              },
              "properties": {
                "type": "object",
                "properties": {
                  "country_iso": {
                    "type": "string"
                  },
                  "industry_enum": {
                    "type": "string"
                  },
                  "resonance_score": {
                    "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
                  },
                  "seniority": {
                    "type": "string"
                  },
                  "domain_focus": {
                    "type": "string"
                  },
                  "title": {
                    "type": "string"
                  },
                  "query": {
                    "type": "string"
                  },
                  "purpose": {
                    "type": "string"
                  },
                  "target": {
                    "type": "string"
                  },
                  "priority": {
                    "type": "string"
                  }
                },
                "additionalProperties": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "boolean"
                    },
                    {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    }
                  ]
                }
              },
              "relationships": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "target_id": {
                      "type": "string"
                    },
                    "relation_type": {
                      "type": "string",
                      "enum": [
                        "SUPPORTS",
                        "REQUIRES",
                        "RESONATES_WITH",
                        "CONFLICTS_WITH",
                        "DERIVED_FROM",
                        "BELONGS_TO_CLASS",
                        "ROLE_IN_ORGANIZATION"
                      ]
                    },
                    "weight": {
                      "type": "number",
                      "minimum": 0,
                      "maximum": 1
                    }
                  },
                  "required": [
                    "target_id",
                    "relation_type"
                  ],
                  "additionalProperties": false
                }
              },
              "evidence": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "doc_id": {
                      "type": "string",
                      "enum": [
                        "DOC_001"
                      ]
                    },
                    "location": {
                      "type": "string"
                    },
                    "context_quote": {
                      "type": "string"
                    },
                    "evidence_score": {
                      "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
                    },
                    "significance_explanation": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "doc_id",
                    "location",
                    "context_quote"
                  ],
                  "additionalProperties": false
                },
                "minItems": 1
              },
              "confidence": {
                "$ref": "#/$defs/GeminiCareerInference/properties/consistency/properties/overall_cohesion_score"
              }
            },
            "required": [
              "entity_kind",
              "entity_id",
              "name",
              "properties",
              "evidence",
              "confidence"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "report_markdown",
        "consistency"
      ],
      "additionalProperties": false
    }
  }
}
```

SHA-256 (kompakte JSON-Serialisierung): `cac805b52b62cc2c9038fc4d1e1123f96072cfaf7cdb178c5c5020dbab39c23e`.

## 1.D Runtime Configuration

| Parameter | Wert |
|---|---|
| Modell (tatsächlich) | `gemini-3.1-pro-preview`. `GEMINI_MODEL` stand laut Worker-Log auf diesem Wert. Das Modell wird nicht persistiert: Kein `GEMINI REQUEST FAILURE`-Eintrag im Worker-Log bedeutet, dass es keinen Fallback gab. |
| Modell-Kaskade (Fallback nur bei 429/503/Überlast) | `gemini-3.1-pro-preview` → `gemini-2.0-flash` → `gemini-2.5-flash` → `gemini-1.5-pro` → `gemini-1.5-flash` |
| API | `ai.models.generateContent` (`@google/genai` 2.10.0) |
| `contents` | ein String: System-Prompt + `\n\n` + User-Prompt (keine `systemInstruction`) |
| `config.responseMimeType` | `application/json` |
| `config.responseJsonSchema` | Schema aus 1.C |
| `config.temperature` | `0.1` |
| `config.maxOutputTokens` | `65536` (`GEMINI_MAX_OUTPUT_TOKENS` nicht gesetzt) |
| Strukturierte Neuversuche | bis zu 2 vollständige Neugenerierungen bei `finishReason = MAX_TOKENS`, danach `ERR_PROVIDER_STRUCTURED_OUTPUT_TRUNCATED`; keine Fortsetzung |
| Prompt-Version | Prompt Contract `PC-CONDYN-CAP-v1.0`, Protocol `v1.0`, Schema `v1.0` (nur als Text im Prompt) |
| Prompt-Registry-Metadaten | keine (`promptMetadata = null`, kein Registry-Slug, keine Versions-ID, keine gespeicherte Checksumme) |
| Nachverarbeitung | `processLlmOutput` → JSON-Reparatur bei Abschneidung, Validierung und Zusammenbau der kanonischen Analyse (`analysis_id = ANL_<job>`) |
| Gemessene Dauer bis nach der Inferenz | A1 38 730 ms · A2 44 426 ms (`metadata.execution_duration_ms`) |

## 1.E Available Full Output

**Status: RAW RESPONSE NOT AVAILABLE — der Legacy-Pfad speichert weder Rohtext noch Telemetrie (Tokens, finishReason, Neuversuche)**

Stattdessen folgt der vollständige persistierte Datensatz aus `career_analyses`, Status **ORIGINAL**. Das ist die kanonische Analyse **nach** `processLlmOutput`: zusammengebaut, validiert und mit ID, Zeiten und Dokumentliste gestempelt. Sie ist nicht das originale Modellresultat.

### 1.E.1 A1 — `career_analyses` `ANL_1791904911180_388`

```json
{
  "analysis_id": "ANL_1791904911180_388",
  "created_at": "2026-10-13T15:23:32.882Z",
  "validation_state": "VERIFIED",
  "overall_confidence": null,
  "payload": {
    "report_markdown": "# Career Analysis Report: Alex Example\n\n## Overview\nAlex Example is a Senior Software Engineer with eight years of professional experience, specializing in web platforms and data pipelines within the logistics sector. The profile demonstrates a clear progression from data-focused software development to senior full-stack and backend engineering with leadership responsibilities.\n\n## Career Progression\n- **Datenwerk AG (2017 - 2020)**: Started as a Software Developer focusing on data engineering, specifically building Python ETL jobs, modeling dimensional data, and working with Apache Kafka and Kubernetes.\n- **Nordwind Logistics GmbH (2020 - 2026)**: Advanced to a Senior Software Engineer role. Key achievements include migrating services to strict TypeScript, implementing WCAG 2.1 compliant React dashboards, designing PostgreSQL schemas, and introducing test-driven development (TDD) with Jest. Demonstrated leadership by managing a team of four engineers and leading architecture reviews.\n\n## Core Capabilities\n- **Languages & Frameworks**: TypeScript, JavaScript, React, Node.js, Python.\n- **Data & Infrastructure**: PostgreSQL, Apache Kafka, Docker, Kubernetes, GitHub Actions.\n- **Practices**: Test-Driven Development (TDD), CI/CD, Accessibility (WCAG 2.1), Team Leadership.",
    "structured_data": {
      "analysis": {
        "roles": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Senior Software Engineer, Nordwind Logistics GmbH, Hamburg — 2020 to 2026",
                "evidence_score": 1,
                "significance_explanation": "Establishes the senior engineering role held at Nordwind Logistics."
              }
            ],
            "identity": {
              "code": "SSE",
              "name": "Senior Software Engineer",
              "type": "ROLE"
            },
            "entity_id": "ROL_001",
            "confidence": 1,
            "properties": {
              "seniority": "Senior",
              "domain_focus": "Web Platforms and Logistics"
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 1,
                "target_id": "ORG_001",
                "relation_type": "ROLE_IN_ORGANIZATION"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Software Developer, Datenwerk AG, Berlin — 2017 to 2020",
                "evidence_score": 1,
                "significance_explanation": "Establishes the software developer role held at Datenwerk AG."
              }
            ],
            "identity": {
              "code": "SD",
              "name": "Software Developer",
              "type": "ROLE"
            },
            "entity_id": "ROL_002",
            "confidence": 1,
            "properties": {
              "seniority": "Mid-Level",
              "domain_focus": "Data Engineering"
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 1,
                "target_id": "ORG_002",
                "relation_type": "ROLE_IN_ORGANIZATION"
              }
            ]
          }
        ],
        "domains": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Profile Section",
                "context_quote": "building web platforms and data pipelines in logistics.",
                "evidence_score": 0.9,
                "significance_explanation": "Explicitly states the industry domain focus of the candidate's experience."
              }
            ],
            "identity": {
              "code": "LOGISTICS",
              "name": "Logistics and Shipment Tracking",
              "type": "DOMAIN"
            },
            "entity_id": "DOM_001",
            "confidence": 0.95,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.9,
                "target_id": "ORG_001",
                "relation_type": "RESONATES_WITH"
              }
            ]
          }
        ],
        "metadata": {
          "analysis_id": "ANL_1791904911180_388",
          "document_count": 1,
          "schema_version": "1.0",
          "protocol_version": "1.0",
          "validation_state": "VERIFIED",
          "execution_duration_ms": 38730,
          "prompt_contract_version": "1.0"
        },
        "pipeline": {
          "steps": []
        },
        "documents": [
          {
            "evidence": [],
            "identity": {
              "name": "cv.synthetic.pdf",
              "type": "DOCUMENT"
            },
            "entity_id": "DOC_001",
            "confidence": 1,
            "properties": {
              "raw_word_count": 247
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": []
          }
        ],
        "strategies": [],
        "consistency": {
          "summary": "The candidate's career shows a highly cohesive trajectory from data engineering to senior software engineering, with consistent use of modern development practices and a clear focus on the logistics domain.",
          "clusters": [
            {
              "name": "Web Platforms & Backend Engineering",
              "doc_ids": [
                "DOC_001"
              ],
              "cluster_id": "CLU_001",
              "cohesion_score": 0.92
            },
            {
              "name": "Data Engineering & Pipelines",
              "doc_ids": [
                "DOC_001"
              ],
              "cluster_id": "CLU_002",
              "cohesion_score": 0.88
            }
          ],
          "contradictions": [],
          "outlier_doc_ids": [],
          "overall_cohesion_score": 0.95
        },
        "capabilities": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Nordwind",
                "context_quote": "Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to strict TypeScript.",
                "evidence_score": 0.95,
                "significance_explanation": "Demonstrates strong capability in backend development and large-scale migration using TypeScript and Node.js."
              }
            ],
            "identity": {
              "code": "TS_NODE",
              "name": "TypeScript and Node.js Development",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_001",
            "confidence": 0.95,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.95,
                "target_id": "ROL_001",
                "relation_type": "SUPPORTS"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Nordwind",
                "context_quote": "Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against WCAG 2.1.",
                "evidence_score": 0.9,
                "significance_explanation": "Shows frontend capability with React and knowledge of accessibility standards."
              }
            ],
            "identity": {
              "code": "REACT_DEV",
              "name": "React Dashboard Development",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_002",
            "confidence": 0.9,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.9,
                "target_id": "ROL_001",
                "relation_type": "SUPPORTS"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Nordwind",
                "context_quote": "Led a team of four engineers and ran the weekly architecture review.",
                "evidence_score": 0.9,
                "significance_explanation": "Highlights leadership, mentoring, and architectural design capabilities."
              }
            ],
            "identity": {
              "code": "TEAM_LEAD",
              "name": "Engineering Team Leadership",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_003",
            "confidence": 0.9,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.85,
                "target_id": "ROL_001",
                "relation_type": "SUPPORTS"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Datenwerk",
                "context_quote": "Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.",
                "evidence_score": 0.95,
                "significance_explanation": "Demonstrates data engineering skills using Python and Kafka."
              }
            ],
            "identity": {
              "code": "PY_ETL",
              "name": "Python ETL and Data Pipelines",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_004",
            "confidence": 0.95,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.9,
                "target_id": "ROL_002",
                "relation_type": "SUPPORTS"
              }
            ]
          }
        ],
        "requirements": [],
        "opportunities": [],
        "organizations": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Senior Software Engineer, Nordwind Logistics GmbH, Hamburg — 2020 to 2026",
                "evidence_score": 1,
                "significance_explanation": "Identifies the primary recent employer, its location in Germany, and the duration of employment."
              }
            ],
            "identity": {
              "code": "NORDWIND",
              "name": "Nordwind Logistics GmbH",
              "type": "ORGANIZATION"
            },
            "entity_id": "ORG_001",
            "confidence": 1,
            "properties": {
              "country_iso": "DE",
              "industry_enum": "Logistics",
              "resonance_score": 0.95
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": []
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Software Developer, Datenwerk AG, Berlin — 2017 to 2020",
                "evidence_score": 1,
                "significance_explanation": "Identifies the previous employer, its location in Germany, and the duration of employment."
              }
            ],
            "identity": {
              "code": "DATENWERK",
              "name": "Datenwerk AG",
              "type": "ORGANIZATION"
            },
            "entity_id": "ORG_002",
            "confidence": 1,
            "properties": {
              "country_iso": "DE",
              "industry_enum": "Information Technology",
              "resonance_score": 0.85
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": []
          }
        ],
        "search_queries": [],
        "organization_classes": []
      },
      "presentation": {
        "ui_layout": {
          "color_tokens": {},
          "center_node_id": "DOC_001",
          "concentric_rings": []
        },
        "semantic_graph": {
          "edges": [],
          "nodes": []
        }
      }
    }
  }
}
```

### 1.E.2 A2 — `career_analyses` `ANL_1791905099818_748`

```json
{
  "analysis_id": "ANL_1791905099818_748",
  "created_at": "2026-10-13T15:26:49.281Z",
  "validation_state": "VERIFIED",
  "overall_confidence": null,
  "payload": {
    "report_markdown": "# Career Analysis Report: Mira Feldmann\n\n## Executive Summary\nMira Feldmann is a highly capable Data and Machine Learning Engineer with 7 years of applied experience, primarily focused on the energy sector. Her profile demonstrates a robust intersection of high-throughput data engineering and advanced machine learning operations (MLOps).\n\n## Key Capabilities\n*   **Streaming Data Platforms:** Proven expertise in building real-time stream processing pipelines using Apache Kafka and Apache Flink, capable of handling 40,000 events per second.\n*   **MLOps & Infrastructure:** Strong background in deploying and monitoring machine learning models using Kubernetes, Argo Workflows, Terraform, and MLflow.\n*   **Applied LLM Systems:** Demonstrated success in building Retrieval-Augmented Generation (RAG) assistants and fine-tuning Small Language Models (SLMs) using LoRA for domain-specific tasks.\n\n## Domain Expertise\nHer experience is deeply rooted in the **Energy Sector**, evidenced by her work on smart meter readings, grid load time series forecasting, and technical maintenance documentation.",
    "structured_data": {
      "analysis": {
        "roles": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Senior Data Engineer, Stromnetz Nord Analytics GmbH, Bremen — 2021 to 2026",
                "evidence_score": 0.95,
                "significance_explanation": "Confirms the specific job title, seniority, and tenure at the organization."
              }
            ],
            "identity": {
              "code": "SDE",
              "name": "Senior Data Engineer",
              "type": "ROLE"
            },
            "entity_id": "ROL_001",
            "confidence": 0.95,
            "properties": {
              "seniority": "Senior",
              "domain_focus": "Data Engineering"
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 1,
                "target_id": "ORG_001",
                "relation_type": "ROLE_IN_ORGANIZATION"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Machine Learning Engineer, Wattwerk AI GmbH, Hamburg — 2019 to 2021",
                "evidence_score": 0.95,
                "significance_explanation": "Confirms the specific job title and tenure at the organization."
              }
            ],
            "identity": {
              "code": "MLE",
              "name": "Machine Learning Engineer",
              "type": "ROLE"
            },
            "entity_id": "ROL_002",
            "confidence": 0.95,
            "properties": {
              "seniority": "Mid-Level",
              "domain_focus": "Machine Learning"
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 1,
                "target_id": "ORG_002",
                "relation_type": "ROLE_IN_ORGANIZATION"
              }
            ]
          }
        ],
        "domains": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Profile Section",
                "context_quote": "applied large language model systems in the energy sector.",
                "evidence_score": 0.9,
                "significance_explanation": "Explicitly defines the primary industry domain where the candidate's skills have been applied."
              }
            ],
            "identity": {
              "code": "ENERGY_SECTOR",
              "name": "Energy Sector",
              "type": "DOMAIN"
            },
            "entity_id": "DOM_001",
            "confidence": 0.95,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.9,
                "target_id": "ROL_001",
                "relation_type": "RESONATES_WITH"
              },
              {
                "weight": 0.85,
                "target_id": "ROL_002",
                "relation_type": "RESONATES_WITH"
              }
            ]
          }
        ],
        "metadata": {
          "analysis_id": "ANL_1791905099818_748",
          "document_count": 1,
          "schema_version": "1.0",
          "protocol_version": "1.0",
          "validation_state": "VERIFIED",
          "execution_duration_ms": 44426,
          "prompt_contract_version": "1.0"
        },
        "pipeline": {
          "steps": []
        },
        "documents": [
          {
            "evidence": [],
            "identity": {
              "name": "cv-ai-data.synthetic.pdf",
              "type": "DOCUMENT"
            },
            "entity_id": "DOC_001",
            "confidence": 1,
            "properties": {
              "raw_word_count": 286
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": []
          }
        ],
        "strategies": [],
        "consistency": {
          "summary": "The candidate's profile exhibits exceptional internal consistency. The stated skills in the profile section are perfectly corroborated by specific, quantifiable achievements in the experience section. There is a clear and logical career progression from Machine Learning Engineer to Senior Data Engineer.",
          "clusters": [
            {
              "name": "Data Engineering & Streaming",
              "doc_ids": [
                "DOC_001"
              ],
              "cluster_id": "CLU_001",
              "cohesion_score": 0.92
            },
            {
              "name": "Machine Learning & MLOps",
              "doc_ids": [
                "DOC_001"
              ],
              "cluster_id": "CLU_002",
              "cohesion_score": 0.94
            }
          ],
          "contradictions": [],
          "outlier_doc_ids": [],
          "overall_cohesion_score": 0.95
        },
        "capabilities": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Stromnetz Nord",
                "context_quote": "Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000 smart meter readings per second.",
                "evidence_score": 0.95,
                "significance_explanation": "Demonstrates hands-on, high-scale engineering capability with industry-standard streaming technologies."
              }
            ],
            "identity": {
              "code": "STREAMING_DATA",
              "name": "Streaming Data Platforms",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_001",
            "confidence": 0.95,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.95,
                "target_id": "ROL_001",
                "relation_type": "SUPPORTS"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Stromnetz Nord",
                "context_quote": "Ran ML pipelines on Kubernetes with Argo Workflows and provisioned the infrastructure with Terraform.",
                "evidence_score": 0.9,
                "significance_explanation": "Validates practical experience with modern cloud-native infrastructure and machine learning operationalization."
              }
            ],
            "identity": {
              "code": "MLOPS",
              "name": "MLOps & Infrastructure",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_002",
            "confidence": 0.9,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.9,
                "target_id": "ROL_001",
                "relation_type": "SUPPORTS"
              }
            ]
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section - Wattwerk AI",
                "context_quote": "Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an LLM, vector search and structured JSON output",
                "evidence_score": 0.95,
                "significance_explanation": "Shows advanced capability in building practical generative AI applications using RAG architectures."
              }
            ],
            "identity": {
              "code": "APPLIED_LLM",
              "name": "Applied LLM Systems",
              "type": "CAPABILITY"
            },
            "entity_id": "CAP_003",
            "confidence": 0.95,
            "properties": {},
            "validation": {
              "status": "PASSED"
            },
            "relationships": [
              {
                "weight": 0.9,
                "target_id": "ROL_002",
                "relation_type": "SUPPORTS"
              }
            ]
          }
        ],
        "requirements": [],
        "opportunities": [],
        "organizations": [
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Senior Data Engineer, Stromnetz Nord Analytics GmbH, Bremen — 2021 to 2026",
                "evidence_score": 0.95,
                "significance_explanation": "Identifies the most recent employer, establishing the organizational context for the senior data engineering role."
              }
            ],
            "identity": {
              "code": "STROMNETZ_NORD",
              "name": "Stromnetz Nord Analytics GmbH",
              "type": "ORGANIZATION"
            },
            "entity_id": "ORG_001",
            "confidence": 0.95,
            "properties": {
              "country_iso": "DE",
              "industry_enum": "ENERGY",
              "resonance_score": 0.9
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": []
          },
          {
            "evidence": [
              {
                "doc_id": "DOC_001",
                "location": "Experience Section",
                "context_quote": "Machine Learning Engineer, Wattwerk AI GmbH, Hamburg — 2019 to 2021",
                "evidence_score": 0.95,
                "significance_explanation": "Identifies the previous employer, establishing the organizational context for the machine learning role."
              }
            ],
            "identity": {
              "code": "WATTWERK_AI",
              "name": "Wattwerk AI GmbH",
              "type": "ORGANIZATION"
            },
            "entity_id": "ORG_002",
            "confidence": 0.95,
            "properties": {
              "country_iso": "DE",
              "industry_enum": "ARTIFICIAL_INTELLIGENCE",
              "resonance_score": 0.85
            },
            "validation": {
              "status": "PASSED"
            },
            "relationships": []
          }
        ],
        "search_queries": [],
        "organization_classes": []
      },
      "presentation": {
        "ui_layout": {
          "color_tokens": {},
          "center_node_id": "DOC_001",
          "concentric_rings": []
        },
        "semantic_graph": {
          "edges": [],
          "nodes": []
        }
      }
    }
  }
}
```

---

# PART 2 — CAPABILITY DISCOVERY

Builder: `buildCapabilityDiscoveryPrompt` (`lib/career/capability-core/discovery/prompt-builder.ts`). Kernel: `capability-discovery-v1` aus `bootstrapCapabilityProposalKernels` (`lib/career/capability-core/runtime/kernel-bootstrap.ts`), AES-256-GCM-verschlüsselt in einem In-Memory-Prompt-Repository, aufgelöst durch `ActivePromptResolver` mit SHA-256-Prüfung. Provider: `GeminiCapabilityDiscoveryProvider`.

## 2.A Complete System Prompt

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — entschlüsselter ACTIVE-Kernel plus vom Builder angehängter Identitätsvertrag; Kernel-Checksumme gleich der in beiden Discovery-Runs gespeicherten `prompt.checksum`**

```
You produce capability proposals from the supplied SourceDocuments.
MODEL OUTPUT = PROPOSAL, not verified capability truth.
Return output compatible with CapabilityKernelOutputSchema: kernel_version, an exhaustive capability inventory, ATOMIC or COMPOSITE scope, canonical_name, structural_definition, primary_domain, demonstrated_capability_level where supported, model_confidence where supported, evidence_mode, evidence claims with source document references, declared locations, exact quotes, and coverage_audit.
Evidence claims must originate only in the supplied SourceDocuments. Do not assert semantic truth, authority, publication, or human decision outcomes.

Output identity contract:
"kernel_version" MUST equal exactly "discovery-v1".
Do not substitute the prompt slug, schema version, model version, semantic version shorthand, or any other value.
```

Kernel-Inhalt allein: SHA-256 `5a79a8798521b21959281f7e665d99de8084a7eda65cf55176f913fbba41b882` (= gespeicherte Prompt-Checksumme). Gesamter System-Prompt: 860 Zeichen, SHA-256 `6d9a182f29c083f92a5bce337cba1b5c533d4d96a6f6c96754cad0b5c448d1d4`.

## 2.B Complete User Prompt

### 2.B.1 A1 — ENGINEERING-Lebenslauf (Run `RUN_AD78E73E4C84D315317E8156`)

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — Quelltext hash-gleich mit `sourceBundleHash` des Runs; Run-ID aus Quell-Hash, Prompt-Checksumme und Modell exakt nachgerechnet**

```
CONDYN CAPABILITY DISCOVERY SOURCE CORPUS
SOURCE_DOCUMENT_COUNT: 1

<SOURCE_DOCUMENT>
DOC_ID: DOC_001
TITLE: cv.synthetic.pdf
MIME_TYPE: 
Alex Example — Curriculum Vitae
Synthetic test profile for the CONDYN manual workflow. Not a real person.
Profile
Senior software engineer with eight years of experience building web platforms and data pipelines
in logistics. Focus on TypeScript, React and Node.js, relational databases and automated testing.
Experience
Senior Software Engineer, Nordwind Logistics GmbH, Hamburg — 2020 to 2026
• Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to
strict TypeScript.
• Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against
WCAG 2.1.
• Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting
queries.
• Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%.
• Set up CI/CD pipelines with GitHub Actions and built Docker images for every service.
• Led a team of four engineers and ran the weekly architecture review.
Software Developer, Datenwerk AG, Berlin — 2017 to 2020
• Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.
• Modelled the dimensional data model for monthly carrier reports.
• Deployed services to a Kubernetes test cluster and maintained Linux build agents.

-- 1 of 2 --

Education
B.Sc. Computer Science, Technische Universität Berlin, 2017. Thesis: event stream processing for
parcel tracking.
Skills
TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, SQL, Python, Apache Kafka,
Docker, GitHub Actions, Jest, Kubernetes (basic), Linux.
Languages
German (native), English (C1).
Certifications
None listed.

-- 2 of 2 --
</SOURCE_DOCUMENT>
```

Zeichen: 1804 · SHA-256: `abee71355f05659994c65b29b767396533a8da1ca421985b84d38ddfc58d45e8` · gesendeter `contents`-String: 2666 Zeichen, SHA-256 `f7df37aed0a6525dafc8b6c9a783c0b2646efe5b12f5db569f7095be9bca5768`.

### 2.B.2 A2 — AI-&-DATA-Lebenslauf (Run `RUN_640B00F97E1A1476178527E4`)

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — Quelltext hash-gleich mit `sourceBundleHash` des Runs; Run-ID aus Quell-Hash, Prompt-Checksumme und Modell exakt nachgerechnet**

```
CONDYN CAPABILITY DISCOVERY SOURCE CORPUS
SOURCE_DOCUMENT_COUNT: 1

<SOURCE_DOCUMENT>
DOC_ID: DOC_001
TITLE: cv-ai-data.synthetic.pdf
MIME_TYPE: 
Mira Feldmann — Curriculum Vitae
Synthetic test profile for the CONDYN end-to-end test. Not a real person.
Profile
Data and machine learning engineer with seven years of experience in streaming data platforms, MLOps and
applied large language model systems in the energy sector. Focus on Python, Apache Kafka, Apache Flink,
Kubernetes and retrieval-augmented generation.
Experience
Senior Data Engineer, Stromnetz Nord Analytics GmbH, Bremen — 2021 to 2026
Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000
smart meter readings per second.
Introduced Avro schemas with a schema registry and managed backward-compatible schema evolution
across 25 topics.
Implemented data quality checks with Great Expectations and reduced faulty billing records by 60%.
Set up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models.
Ran ML pipelines on Kubernetes with Argo Workflows and provisioned the infrastructure with Terraform.
Built model monitoring dashboards that detect drift in load forecasts and trigger retraining.
Machine Learning Engineer, Wattwerk AI GmbH, Hamburg — 2019 to 2021
Developed time series forecasting models for grid load in Python with PyTorch and LightGBM.
Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an
LLM, vector search and structured JSON output; reduced hallucinated answers through citation checks.
Fine-tuned a small language model with LoRA for classifying maintenance tickets.
Modelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for
duplicate equipment records.
Education
M.Sc. Data Science, Universität Hamburg, 2019. Thesis: probabilistic load forecasting.
Skills
Python, SQL, Apache Kafka, Apache Flink, Avro, Great Expectations, MLflow, Argo Workflows, Kubernetes,
Terraform, Docker, PyTorch, LightGBM, Neo4j, LangChain, vector databases.
Languages
German (native), English (C1).
Certifications
Certified Kubernetes Application Developer (CKAD), 2022.

-- 1 of 1 --
</SOURCE_DOCUMENT>
```

Zeichen: 2236 · SHA-256: `9488cfbad47c33076c2b68fb48466fc14dea621d4bb467ab0bcf1d1ce15ca82b` · gesendeter `contents`-String: 3098 Zeichen, SHA-256 `f710d315d9774935d337cf6ce5de264a730394f43dca667f7cfc834280d0235f`.

Hinweis: Die Career-Quelle hat keine Seitendarstellung (`pages: undefined`). Der Builder setzt deshalb den gesamten `normalizedText` ohne `<PAGE>`-Blöcke ein.

## 2.C Complete Response Schema

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — `getGeminiCapabilityKernelResponseJsonSchema()` (`discovery/gemini-schema-projector.ts`), Zod `CapabilityKernelOutputSchema` → JSON Schema 2019-09, bereinigt um `$schema`, `minLength`, `pattern` und `default`**

```json
{
  "type": "object",
  "properties": {
    "kernel_version": {
      "type": "string"
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "canonical_name": {
            "type": "string"
          },
          "capability_scope": {
            "type": "string",
            "enum": [
              "ATOMIC",
              "COMPOSITE"
            ]
          },
          "structural_definition": {
            "type": "string"
          },
          "primary_domain": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "demonstrated_capability_level": {
            "anyOf": [
              {
                "type": "string",
                "enum": [
                  "L1",
                  "L2",
                  "L3",
                  "L4",
                  "L5",
                  "L6"
                ]
              },
              {
                "type": "null"
              }
            ]
          },
          "model_confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "evidence_mode": {
            "type": "string",
            "enum": [
              "EXPLICIT",
              "STRUCTURALLY_DEMONSTRATED"
            ]
          },
          "evidence": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "source_document": {
                  "type": "string"
                },
                "location": {
                  "type": "string"
                },
                "exact_quote": {
                  "type": "string"
                }
              },
              "required": [
                "source_document",
                "location",
                "exact_quote"
              ],
              "additionalProperties": false
            },
            "minItems": 1
          }
        },
        "required": [
          "canonical_name",
          "capability_scope",
          "structural_definition",
          "primary_domain",
          "demonstrated_capability_level",
          "model_confidence",
          "evidence_mode",
          "evidence"
        ],
        "additionalProperties": false
      }
    },
    "coverage_audit": {
      "type": "object",
      "properties": {
        "source_documents_examined": {
          "type": "integer",
          "minimum": 0
        },
        "capability_count": {
          "type": "integer",
          "minimum": 0
        },
        "atomic_capability_count": {
          "type": "integer",
          "minimum": 0
        },
        "composite_capability_count": {
          "type": "integer",
          "minimum": 0
        },
        "attribution_pass_completed": {
          "type": "boolean"
        },
        "target_state_ownership_pass_completed": {
          "type": "boolean"
        },
        "atomic_extraction_pass_completed": {
          "type": "boolean"
        },
        "method_capability_pass_completed": {
          "type": "boolean"
        },
        "composite_reconstruction_pass_completed": {
          "type": "boolean"
        },
        "global_convergence_pass_completed": {
          "type": "boolean"
        },
        "inventory_reconciliation_pass_completed": {
          "type": "boolean"
        },
        "final_reconciliation_produced_new_capabilities": {
          "type": "boolean"
        },
        "unresolved_target_operations": {
          "type": "integer",
          "minimum": 0
        },
        "segments_classified_as_external_source_content": {
          "type": "integer",
          "minimum": 0
        },
        "segments_classified_as_target_subject_operation": {
          "type": "integer",
          "minimum": 0
        },
        "segments_classified_as_target_subject_designed_target_state": {
          "type": "integer",
          "minimum": 0
        },
        "segments_classified_as_target_organization_capability": {
          "type": "integer",
          "minimum": 0
        },
        "segments_excluded_due_to_attribution_ambiguity": {
          "type": "integer",
          "minimum": 0
        }
      },
      "required": [
        "source_documents_examined",
        "capability_count",
        "atomic_capability_count",
        "composite_capability_count",
        "attribution_pass_completed",
        "target_state_ownership_pass_completed",
        "atomic_extraction_pass_completed",
        "method_capability_pass_completed",
        "composite_reconstruction_pass_completed",
        "global_convergence_pass_completed",
        "inventory_reconciliation_pass_completed",
        "final_reconciliation_produced_new_capabilities",
        "unresolved_target_operations",
        "segments_classified_as_external_source_content",
        "segments_classified_as_target_subject_operation",
        "segments_classified_as_target_subject_designed_target_state",
        "segments_classified_as_target_organization_capability",
        "segments_excluded_due_to_attribution_ambiguity"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "kernel_version",
    "capabilities",
    "coverage_audit"
  ],
  "additionalProperties": false,
  "$defs": {
    "CapabilityKernelOutput": {
      "type": "object",
      "properties": {
        "kernel_version": {
          "type": "string"
        },
        "capabilities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "canonical_name": {
                "type": "string"
              },
              "capability_scope": {
                "type": "string",
                "enum": [
                  "ATOMIC",
                  "COMPOSITE"
                ]
              },
              "structural_definition": {
                "type": "string"
              },
              "primary_domain": {
                "anyOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "demonstrated_capability_level": {
                "anyOf": [
                  {
                    "type": "string",
                    "enum": [
                      "L1",
                      "L2",
                      "L3",
                      "L4",
                      "L5",
                      "L6"
                    ]
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "model_confidence": {
                "type": "number",
                "minimum": 0,
                "maximum": 1
              },
              "evidence_mode": {
                "type": "string",
                "enum": [
                  "EXPLICIT",
                  "STRUCTURALLY_DEMONSTRATED"
                ]
              },
              "evidence": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "source_document": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "exact_quote": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "source_document",
                    "location",
                    "exact_quote"
                  ],
                  "additionalProperties": false
                },
                "minItems": 1
              }
            },
            "required": [
              "canonical_name",
              "capability_scope",
              "structural_definition",
              "primary_domain",
              "demonstrated_capability_level",
              "model_confidence",
              "evidence_mode",
              "evidence"
            ],
            "additionalProperties": false
          }
        },
        "coverage_audit": {
          "type": "object",
          "properties": {
            "source_documents_examined": {
              "type": "integer",
              "minimum": 0
            },
            "capability_count": {
              "type": "integer",
              "minimum": 0
            },
            "atomic_capability_count": {
              "type": "integer",
              "minimum": 0
            },
            "composite_capability_count": {
              "type": "integer",
              "minimum": 0
            },
            "attribution_pass_completed": {
              "type": "boolean"
            },
            "target_state_ownership_pass_completed": {
              "type": "boolean"
            },
            "atomic_extraction_pass_completed": {
              "type": "boolean"
            },
            "method_capability_pass_completed": {
              "type": "boolean"
            },
            "composite_reconstruction_pass_completed": {
              "type": "boolean"
            },
            "global_convergence_pass_completed": {
              "type": "boolean"
            },
            "inventory_reconciliation_pass_completed": {
              "type": "boolean"
            },
            "final_reconciliation_produced_new_capabilities": {
              "type": "boolean"
            },
            "unresolved_target_operations": {
              "type": "integer",
              "minimum": 0
            },
            "segments_classified_as_external_source_content": {
              "type": "integer",
              "minimum": 0
            },
            "segments_classified_as_target_subject_operation": {
              "type": "integer",
              "minimum": 0
            },
            "segments_classified_as_target_subject_designed_target_state": {
              "type": "integer",
              "minimum": 0
            },
            "segments_classified_as_target_organization_capability": {
              "type": "integer",
              "minimum": 0
            },
            "segments_excluded_due_to_attribution_ambiguity": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "source_documents_examined",
            "capability_count",
            "atomic_capability_count",
            "composite_capability_count",
            "attribution_pass_completed",
            "target_state_ownership_pass_completed",
            "atomic_extraction_pass_completed",
            "method_capability_pass_completed",
            "composite_reconstruction_pass_completed",
            "global_convergence_pass_completed",
            "inventory_reconciliation_pass_completed",
            "final_reconciliation_produced_new_capabilities",
            "unresolved_target_operations",
            "segments_classified_as_external_source_content",
            "segments_classified_as_target_subject_operation",
            "segments_classified_as_target_subject_designed_target_state",
            "segments_classified_as_target_organization_capability",
            "segments_excluded_due_to_attribution_ambiguity"
          ],
          "additionalProperties": false
        }
      },
      "required": [
        "kernel_version",
        "capabilities",
        "coverage_audit"
      ],
      "additionalProperties": false
    }
  }
}
```

Nach der Antwort wird zusätzlich mit dem unbereinigten Zod-Schema geprüft: `.strict()`, `min(1)`, Konfidenz in [0, 1], mindestens ein Evidenzeintrag. Danach folgen die Prüfungen `assertCapabilityCoverageAudit` (Zählerabgleich) und `verifyCandidateEvidence` (wörtliches Zitat im Quelldokument).

## 2.D Runtime Configuration

| Parameter | Wert |
|---|---|
| Modell (tatsächlich, persistiert) | `gemini-3.1-pro-preview` (`inference.model` in beiden Runs); keine Kaskade, ein Versuch |
| API / `contents` | `ai.models.generateContent`; ein String System + `\n\n` + User |
| `config.responseMimeType` | `application/json` |
| `config.responseJsonSchema` | Schema aus 2.C |
| `config.temperature` | `0.1` |
| `config.maxOutputTokens` | `32768` |
| Abbruchregel | `finishReason` ≠ `STOP` → `ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID` (kein Neuversuch) |
| Kernel-Version (Identität) | `discovery-v1` |
| Schema-Version | `discovery-schema-v1` |
| Prompt-Template / Version | `tpl_capability-discovery-v1` / `ver_capability-discovery-v1_v1` (Version 1, ACTIVE) |
| Prompt-Checksumme | `5a79a8798521b21959281f7e665d99de8084a7eda65cf55176f913fbba41b882` |
| Run-ID-Formel | `RUN_` + erste 24 Hex-Zeichen von SHA-256(JSON[sourceBundleHash, kernelVersion, promptChecksum, provider, model, schemaVersion]), groß geschrieben |
| Wiederverwendung | Ein vorhandener `VERIFIED`-Snapshot oder ein abgeschlossener Run mit gleicher Identität wird ohne Gemini-Aufruf wiederverwendet. In beiden Läufen wurde neu ausgeführt. |

## 2.E Available Full Output

**Status: RAW RESPONSE NOT AVAILABLE — gespeichert wird das geparste Modellobjekt `kernelOutput`, nicht der Antworttext**

Das Schema ist durchgehend `.strict()`. Ein unbekanntes Feld hätte den Lauf abgebrochen, statt verworfen zu werden. `kernelOutput` enthält daher jedes Feld und jeden Wert der Modellantwort. Nicht erhalten sind nur Leerraum und Schlüsselreihenfolge des Rohtexts.
Die Integrität ist geprüft: SHA-256 der stabilen Serialisierung = gespeicherter `rawOutputHash`.

### 2.E.1 A1 — Discovery-Run `RUN_AD78E73E4C84D315317E8156`

**Status: ORIGINAL (persistiertes Laufzeitartefakt, byte-identisch aus der E2E-Wegwerf-Datenbank)**

#### Run-Metadaten

```json
{
  "runId": "RUN_AD78E73E4C84D315317E8156",
  "prompt": {
    "checksum": "5a79a8798521b21959281f7e665d99de8084a7eda65cf55176f913fbba41b882",
    "versionId": "ver_capability-discovery-v1_v1",
    "templateId": "tpl_capability-discovery-v1"
  },
  "status": "COMPLETED",
  "createdAt": "2026-10-13T15:22:27.971Z",
  "inference": {
    "model": "gemini-3.1-pro-preview",
    "provider": "gemini"
  },
  "completedAt": "2026-10-13T15:22:27.971Z",
  "kernelVersion": "discovery-v1",
  "rawOutputHash": "02937103cc406a66b7a634c6b5ec83bbf2dfd1d361fb79883067e760539041a0",
  "schemaVersion": "discovery-schema-v1",
  "sourceBundleHash": "5a1998013aa063db166328b4c94ffb630a36e9913a465500fa9cba53fe6c637d"
}
```

#### Discovery Output (`payload.kernelOutput`, vollständiges geparstes Modellobjekt)

```json
{
  "capabilities": [
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Nordwind Logistics GmbH",
          "exact_quote": "Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to strict TypeScript.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "TypeScript and Node.js Backend Development",
      "primary_domain": "Software Engineering",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Ability to build backend platforms and migrate existing services to strict TypeScript using Node.js and Express.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Nordwind Logistics GmbH",
          "exact_quote": "Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against WCAG 2.1.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "React Frontend Development",
      "primary_domain": "Software Engineering",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Ability to implement user interfaces and dashboards using React, including ensuring accessibility compliance with WCAG 2.1.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Nordwind Logistics GmbH",
          "exact_quote": "Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting queries.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Relational Database Design and SQL Reporting",
      "primary_domain": "Data Engineering",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Ability to design PostgreSQL database schemas for business entities and write complex SQL queries for reporting purposes.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Nordwind Logistics GmbH",
          "exact_quote": "Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Test-Driven Development (TDD)",
      "primary_domain": "Software Engineering",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Ability to introduce test-driven development methodologies and significantly increase unit test coverage using testing frameworks like Jest.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Nordwind Logistics GmbH",
          "exact_quote": "Set up CI/CD pipelines with GitHub Actions and built Docker images for every service.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "CI/CD Pipeline and Containerization Engineering",
      "primary_domain": "DevOps",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Ability to set up continuous integration and continuous deployment pipelines using GitHub Actions and build Docker container images for software services.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Nordwind Logistics GmbH",
          "exact_quote": "Led a team of four engineers and ran the weekly architecture review.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Engineering Team Leadership",
      "primary_domain": "Engineering Management",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.9,
      "structural_definition": "Ability to lead a team of software engineers and facilitate weekly architecture reviews.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Datenwerk AG",
          "exact_quote": "Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Python ETL Pipeline Development",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Ability to write Python-based Extract, Transform, Load (ETL) jobs to move event data from message brokers like Apache Kafka into data warehouses.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Datenwerk AG",
          "exact_quote": "Modelled the dimensional data model for monthly carrier reports.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Dimensional Data Modeling",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Ability to design and model dimensional data structures for business reporting and analytics.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 1, Experience, Datenwerk AG",
          "exact_quote": "Deployed services to a Kubernetes test cluster and maintained Linux build agents.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Kubernetes Deployment and Linux Administration",
      "primary_domain": "DevOps",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.9,
      "structural_definition": "Ability to deploy software services to Kubernetes clusters and maintain Linux-based build agents.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Page 2, Education",
          "exact_quote": "Thesis: event stream processing for parcel tracking.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Event Stream Processing",
      "primary_domain": "Computer Science",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.85,
      "structural_definition": "Knowledge and application of event stream processing techniques, specifically applied to tracking systems.",
      "demonstrated_capability_level": null
    }
  ],
  "coverage_audit": {
    "capability_count": 10,
    "atomic_capability_count": 5,
    "source_documents_examined": 1,
    "attribution_pass_completed": true,
    "composite_capability_count": 5,
    "unresolved_target_operations": 0,
    "atomic_extraction_pass_completed": true,
    "method_capability_pass_completed": true,
    "global_convergence_pass_completed": true,
    "target_state_ownership_pass_completed": true,
    "composite_reconstruction_pass_completed": true,
    "inventory_reconciliation_pass_completed": true,
    "final_reconciliation_produced_new_capabilities": false,
    "segments_classified_as_external_source_content": 0,
    "segments_excluded_due_to_attribution_ambiguity": 0,
    "segments_classified_as_target_subject_operation": 10,
    "segments_classified_as_target_organization_capability": 0,
    "segments_classified_as_target_subject_designed_target_state": 0
  },
  "kernel_version": "discovery-v1"
}
```

#### Coverage Audit (`kernelOutput.coverage_audit`) und Coverage-Validierung

```json
{
  "coverage_audit": {
    "capability_count": 10,
    "atomic_capability_count": 5,
    "source_documents_examined": 1,
    "attribution_pass_completed": true,
    "composite_capability_count": 5,
    "unresolved_target_operations": 0,
    "atomic_extraction_pass_completed": true,
    "method_capability_pass_completed": true,
    "global_convergence_pass_completed": true,
    "target_state_ownership_pass_completed": true,
    "composite_reconstruction_pass_completed": true,
    "inventory_reconciliation_pass_completed": true,
    "final_reconciliation_produced_new_capabilities": false,
    "segments_classified_as_external_source_content": 0,
    "segments_excluded_due_to_attribution_ambiguity": 0,
    "segments_classified_as_target_subject_operation": 10,
    "segments_classified_as_target_organization_capability": 0,
    "segments_classified_as_target_subject_designed_target_state": 0
  },
  "coverageValidation": {
    "status": "PASSED"
  }
}
```

#### Capability-Kandidaten mit verifizierten Evidence Claims (`payload.candidates`)

```json
[
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_D4E38FFF8209CD0B68CCB3A6",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_73165519F8B3F94E33A8CE61",
        "exactQuote": "Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to strict TypeScript.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 515,
          "sourceSpanStart": 397,
          "matchedNormalizedQuote": "Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to strict TypeScript."
        },
        "declaredLocation": "Page 1, Experience, Nordwind Logistics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to build backend platforms and migrate existing services to strict TypeScript using Node.js and Express.",
    "proposedCanonicalName": "TypeScript and Node.js Backend Development",
    "proposedPrimaryDomain": "Software Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_6D039E51D9510D0858982BB7",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_C040D9EE928900630A2D1176",
        "exactQuote": "Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against WCAG 2.1.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 622,
          "sourceSpanStart": 518,
          "matchedNormalizedQuote": "Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against WCAG 2.1."
        },
        "declaredLocation": "Page 1, Experience, Nordwind Logistics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to implement user interfaces and dashboards using React, including ensuring accessibility compliance with WCAG 2.1.",
    "proposedCanonicalName": "React Frontend Development",
    "proposedPrimaryDomain": "Software Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_5409F00F6F320E186AED06AC",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_2C1F07E787CFD69D6F2035F6",
        "exactQuote": "Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting queries.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 720,
          "sourceSpanStart": 625,
          "matchedNormalizedQuote": "Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting queries."
        },
        "declaredLocation": "Page 1, Experience, Nordwind Logistics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to design PostgreSQL database schemas for business entities and write complex SQL queries for reporting purposes.",
    "proposedCanonicalName": "Relational Database Design and SQL Reporting",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_92B0B8C6BBB93BC2C0B70D01",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_2836DCCF5BFD1A0C1D0E4C60",
        "exactQuote": "Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 814,
          "sourceSpanStart": 723,
          "matchedNormalizedQuote": "Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%."
        },
        "declaredLocation": "Page 1, Experience, Nordwind Logistics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to introduce test-driven development methodologies and significantly increase unit test coverage using testing frameworks like Jest.",
    "proposedCanonicalName": "Test-Driven Development (TDD)",
    "proposedPrimaryDomain": "Software Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_BF4F013691D2968B329252A4",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_44DAF038937868690DC58968",
        "exactQuote": "Set up CI/CD pipelines with GitHub Actions and built Docker images for every service.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 902,
          "sourceSpanStart": 817,
          "matchedNormalizedQuote": "Set up CI/CD pipelines with GitHub Actions and built Docker images for every service."
        },
        "declaredLocation": "Page 1, Experience, Nordwind Logistics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to set up continuous integration and continuous deployment pipelines using GitHub Actions and build Docker container images for software services.",
    "proposedCanonicalName": "CI/CD Pipeline and Containerization Engineering",
    "proposedPrimaryDomain": "DevOps",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_7C2AF22EED2A1C10303678B1",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_28FCC73613D63CE949194DF7",
        "exactQuote": "Led a team of four engineers and ran the weekly architecture review.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 973,
          "sourceSpanStart": 905,
          "matchedNormalizedQuote": "Led a team of four engineers and ran the weekly architecture review."
        },
        "declaredLocation": "Page 1, Experience, Nordwind Logistics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.9,
    "structuralDefinition": "Ability to lead a team of software engineers and facilitate weekly architecture reviews.",
    "proposedCanonicalName": "Engineering Team Leadership",
    "proposedPrimaryDomain": "Engineering Management",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_AF91B0EE67E451C92679A2E8",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_D8BDF36BA2650CE113EE903F",
        "exactQuote": "Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1122,
          "sourceSpanStart": 1032,
          "matchedNormalizedQuote": "Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse."
        },
        "declaredLocation": "Page 1, Experience, Datenwerk AG",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to write Python-based Extract, Transform, Load (ETL) jobs to move event data from message brokers like Apache Kafka into data warehouses.",
    "proposedCanonicalName": "Python ETL Pipeline Development",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_442D9C3D06C7E87612714007",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_8643028469EA9E5AA68086D1",
        "exactQuote": "Modelled the dimensional data model for monthly carrier reports.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1189,
          "sourceSpanStart": 1125,
          "matchedNormalizedQuote": "Modelled the dimensional data model for monthly carrier reports."
        },
        "declaredLocation": "Page 1, Experience, Datenwerk AG",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Ability to design and model dimensional data structures for business reporting and analytics.",
    "proposedCanonicalName": "Dimensional Data Modeling",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_2FB4BF075E46DCBCEE6908C4",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_BC958D42EE3228294C638914",
        "exactQuote": "Deployed services to a Kubernetes test cluster and maintained Linux build agents.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1273,
          "sourceSpanStart": 1192,
          "matchedNormalizedQuote": "Deployed services to a Kubernetes test cluster and maintained Linux build agents."
        },
        "declaredLocation": "Page 1, Experience, Datenwerk AG",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.9,
    "structuralDefinition": "Ability to deploy software services to Kubernetes clusters and maintain Linux-based build agents.",
    "proposedCanonicalName": "Kubernetes Deployment and Linux Administration",
    "proposedPrimaryDomain": "DevOps",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_AD78E73E4C84D315317E8156",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_2FA89B96A2ADDE6C39A85720",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_65D5C6589C09E03E921C246D",
        "exactQuote": "Thesis: event stream processing for parcel tracking.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1410,
          "sourceSpanStart": 1358,
          "matchedNormalizedQuote": "Thesis: event stream processing for parcel tracking."
        },
        "declaredLocation": "Page 2, Education",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.85,
    "structuralDefinition": "Knowledge and application of event stream processing techniques, specifically applied to tracking systems.",
    "proposedCanonicalName": "Event Stream Processing",
    "proposedPrimaryDomain": "Computer Science",
    "proposedDemonstratedLevel": null
  }
]
```

#### Atomare und zusammengesetzte Fähigkeiten (aus `payload.candidates` tabelliert, keine neue Information)

| Kandidat | Name | Scope | Level | Konfidenz | Modus | Status | Claims verifiziert / gesamt |
|---|---|---|---|---|---|---|---|
| `CAND_D4E38FFF8209CD0B68CCB3A6` | TypeScript and Node.js Backend Development | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_6D039E51D9510D0858982BB7` | React Frontend Development | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_5409F00F6F320E186AED06AC` | Relational Database Design and SQL Reporting | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_92B0B8C6BBB93BC2C0B70D01` | Test-Driven Development (TDD) | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_BF4F013691D2968B329252A4` | CI/CD Pipeline and Containerization Engineering | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_7C2AF22EED2A1C10303678B1` | Engineering Team Leadership | COMPOSITE | None | 0.9 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_AF91B0EE67E451C92679A2E8` | Python ETL Pipeline Development | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_442D9C3D06C7E87612714007` | Dimensional Data Modeling | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_2FB4BF075E46DCBCEE6908C4` | Kubernetes Deployment and Linux Administration | COMPOSITE | None | 0.9 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_2FA89B96A2ADDE6C39A85720` | Event Stream Processing | ATOMIC | None | 0.85 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |

### 2.E.2 A2 — Discovery-Run `RUN_640B00F97E1A1476178527E4`

**Status: ORIGINAL (persistiertes Laufzeitartefakt, byte-identisch aus der E2E-Wegwerf-Datenbank)**

#### Run-Metadaten

```json
{
  "runId": "RUN_640B00F97E1A1476178527E4",
  "prompt": {
    "checksum": "5a79a8798521b21959281f7e665d99de8084a7eda65cf55176f913fbba41b882",
    "versionId": "ver_capability-discovery-v1_v1",
    "templateId": "tpl_capability-discovery-v1"
  },
  "status": "COMPLETED",
  "createdAt": "2026-10-13T15:25:32.798Z",
  "inference": {
    "model": "gemini-3.1-pro-preview",
    "provider": "gemini"
  },
  "completedAt": "2026-10-13T15:25:32.798Z",
  "kernelVersion": "discovery-v1",
  "rawOutputHash": "f2f0ea4cdb4c0bb6b7f2fa04d66832d207fff208c340f0eb70b4f622f8e26c7c",
  "schemaVersion": "discovery-schema-v1",
  "sourceBundleHash": "246cd6ea00c5c7276fc56e80f9cfe3dd9da1ef07dff970321aed31f5521193cd"
}
```

#### Discovery Output (`payload.kernelOutput`, vollständiges geparstes Modellobjekt)

```json
{
  "capabilities": [
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000 smart meter readings per second.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Real-Time Stream Processing Pipeline Engineering",
      "primary_domain": "Data Engineering",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Designing and building high-throughput data ingestion and processing pipelines using distributed streaming platforms.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "Introduced Avro schemas with a schema registry and managed backward-compatible schema evolution across 25 topics.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Data Schema Management and Evolution",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Implementing and managing data schemas and backward-compatible evolution using schema registries.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "Implemented data quality checks with Great Expectations and reduced faulty billing records by 60%.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Automated Data Quality Validation",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Implementing automated data quality checks to identify and reduce faulty records in data pipelines.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "Set up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Machine Learning Lifecycle Management",
      "primary_domain": "MLOps",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Setting up experiment tracking, model registries, and lineage tracking for machine learning models.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "Ran ML pipelines on Kubernetes with Argo Workflows",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Machine Learning Pipeline Orchestration",
      "primary_domain": "MLOps",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Running and orchestrating machine learning pipelines on containerized infrastructure.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "provisioned the infrastructure with Terraform.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Infrastructure Provisioning",
      "primary_domain": "DevOps",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Provisioning and managing infrastructure using infrastructure-as-code tools.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Stromnetz Nord Analytics GmbH",
          "exact_quote": "Built model monitoring dashboards that detect drift in load forecasts and trigger retraining.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Machine Learning Model Monitoring",
      "primary_domain": "MLOps",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Building monitoring dashboards to detect data and model drift and trigger automated retraining.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Wattwerk AI GmbH",
          "exact_quote": "Developed time series forecasting models for grid load in Python with PyTorch and LightGBM.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Time Series Forecasting Modeling",
      "primary_domain": "Machine Learning",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Developing predictive models for time series data using deep learning and gradient boosting frameworks.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Wattwerk AI GmbH",
          "exact_quote": "Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an LLM, vector search and structured JSON output; reduced hallucinated answers through citation checks.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Retrieval-Augmented Generation System Engineering",
      "primary_domain": "Artificial Intelligence",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Building RAG assistants utilizing large language models, vector search, structured outputs, and citation checks to minimize hallucinations.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Wattwerk AI GmbH",
          "exact_quote": "Fine-tuned a small language model with LoRA for classifying maintenance tickets.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Language Model Fine-Tuning",
      "primary_domain": "Artificial Intelligence",
      "capability_scope": "ATOMIC",
      "model_confidence": 0.95,
      "structural_definition": "Fine-tuning small language models using parameter-efficient techniques for specific classification tasks.",
      "demonstrated_capability_level": null
    },
    {
      "evidence": [
        {
          "location": "Experience section, Wattwerk AI GmbH",
          "exact_quote": "Modelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for duplicate equipment records.",
          "source_document": "DOC_001"
        }
      ],
      "evidence_mode": "EXPLICIT",
      "canonical_name": "Knowledge Graph Modeling and Entity Resolution",
      "primary_domain": "Data Engineering",
      "capability_scope": "COMPOSITE",
      "model_confidence": 0.95,
      "structural_definition": "Modeling complex relationships as knowledge graphs and implementing entity resolution for deduplication.",
      "demonstrated_capability_level": null
    }
  ],
  "coverage_audit": {
    "capability_count": 11,
    "atomic_capability_count": 5,
    "source_documents_examined": 1,
    "attribution_pass_completed": true,
    "composite_capability_count": 6,
    "unresolved_target_operations": 0,
    "atomic_extraction_pass_completed": true,
    "method_capability_pass_completed": true,
    "global_convergence_pass_completed": true,
    "target_state_ownership_pass_completed": true,
    "composite_reconstruction_pass_completed": true,
    "inventory_reconciliation_pass_completed": true,
    "final_reconciliation_produced_new_capabilities": false,
    "segments_classified_as_external_source_content": 0,
    "segments_excluded_due_to_attribution_ambiguity": 0,
    "segments_classified_as_target_subject_operation": 11,
    "segments_classified_as_target_organization_capability": 0,
    "segments_classified_as_target_subject_designed_target_state": 0
  },
  "kernel_version": "discovery-v1"
}
```

#### Coverage Audit (`kernelOutput.coverage_audit`) und Coverage-Validierung

```json
{
  "coverage_audit": {
    "capability_count": 11,
    "atomic_capability_count": 5,
    "source_documents_examined": 1,
    "attribution_pass_completed": true,
    "composite_capability_count": 6,
    "unresolved_target_operations": 0,
    "atomic_extraction_pass_completed": true,
    "method_capability_pass_completed": true,
    "global_convergence_pass_completed": true,
    "target_state_ownership_pass_completed": true,
    "composite_reconstruction_pass_completed": true,
    "inventory_reconciliation_pass_completed": true,
    "final_reconciliation_produced_new_capabilities": false,
    "segments_classified_as_external_source_content": 0,
    "segments_excluded_due_to_attribution_ambiguity": 0,
    "segments_classified_as_target_subject_operation": 11,
    "segments_classified_as_target_organization_capability": 0,
    "segments_classified_as_target_subject_designed_target_state": 0
  },
  "coverageValidation": {
    "status": "PASSED"
  }
}
```

#### Capability-Kandidaten mit verifizierten Evidence Claims (`payload.candidates`)

```json
[
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_1CE53DE1A9FD6BE7DB6A59C8",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_DD251A5511E1ECB3ACBB6EBC",
        "exactQuote": "Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000 smart meter readings per second.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 587,
          "sourceSpanStart": 457,
          "matchedNormalizedQuote": "Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000 smart meter readings per second."
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Designing and building high-throughput data ingestion and processing pipelines using distributed streaming platforms.",
    "proposedCanonicalName": "Real-Time Stream Processing Pipeline Engineering",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_B53F29AE234E5061D17AB30C",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_252D3E87A80A33137F1476E6",
        "exactQuote": "Introduced Avro schemas with a schema registry and managed backward-compatible schema evolution across 25 topics.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 701,
          "sourceSpanStart": 588,
          "matchedNormalizedQuote": "Introduced Avro schemas with a schema registry and managed backward-compatible schema evolution across 25 topics."
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Implementing and managing data schemas and backward-compatible evolution using schema registries.",
    "proposedCanonicalName": "Data Schema Management and Evolution",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_4B77E04ED420901F69508499",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_467CA4AD67E56D17BE2DC1AE",
        "exactQuote": "Implemented data quality checks with Great Expectations and reduced faulty billing records by 60%.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 800,
          "sourceSpanStart": 702,
          "matchedNormalizedQuote": "Implemented data quality checks with Great Expectations and reduced faulty billing records by 60%."
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Implementing automated data quality checks to identify and reduce faulty records in data pipelines.",
    "proposedCanonicalName": "Automated Data Quality Validation",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_D43035DDC47C8F751030FB1F",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_B4DDAA940B279F0FBEC3AE34",
        "exactQuote": "Set up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 899,
          "sourceSpanStart": 801,
          "matchedNormalizedQuote": "Set up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models."
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Setting up experiment tracking, model registries, and lineage tracking for machine learning models.",
    "proposedCanonicalName": "Machine Learning Lifecycle Management",
    "proposedPrimaryDomain": "MLOps",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_B2BA89C176A9D34247541E04",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_43F3B8DC0B29B5A8F0FC1B18",
        "exactQuote": "Ran ML pipelines on Kubernetes with Argo Workflows",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 950,
          "sourceSpanStart": 900,
          "matchedNormalizedQuote": "Ran ML pipelines on Kubernetes with Argo Workflows"
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Running and orchestrating machine learning pipelines on containerized infrastructure.",
    "proposedCanonicalName": "Machine Learning Pipeline Orchestration",
    "proposedPrimaryDomain": "MLOps",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_94A8E4E6DC568974ACB10C57",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_DC25E6D8707BD8996271ED5C",
        "exactQuote": "provisioned the infrastructure with Terraform.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1001,
          "sourceSpanStart": 955,
          "matchedNormalizedQuote": "provisioned the infrastructure with Terraform."
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Provisioning and managing infrastructure using infrastructure-as-code tools.",
    "proposedCanonicalName": "Infrastructure Provisioning",
    "proposedPrimaryDomain": "DevOps",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_D9C314E1E6550EA826182441",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_B3362D06C87161E6905BF986",
        "exactQuote": "Built model monitoring dashboards that detect drift in load forecasts and trigger retraining.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1095,
          "sourceSpanStart": 1002,
          "matchedNormalizedQuote": "Built model monitoring dashboards that detect drift in load forecasts and trigger retraining."
        },
        "declaredLocation": "Experience section, Stromnetz Nord Analytics GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Building monitoring dashboards to detect data and model drift and trigger automated retraining.",
    "proposedCanonicalName": "Machine Learning Model Monitoring",
    "proposedPrimaryDomain": "MLOps",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_A05036355EC1DCBC93EB4F71",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_5EF9956C8EEEE367296D23A3",
        "exactQuote": "Developed time series forecasting models for grid load in Python with PyTorch and LightGBM.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1255,
          "sourceSpanStart": 1164,
          "matchedNormalizedQuote": "Developed time series forecasting models for grid load in Python with PyTorch and LightGBM."
        },
        "declaredLocation": "Experience section, Wattwerk AI GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Developing predictive models for time series data using deep learning and gradient boosting frameworks.",
    "proposedCanonicalName": "Time Series Forecasting Modeling",
    "proposedPrimaryDomain": "Machine Learning",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_685647F8AD86BDAF6FBBB34D",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_BCFACB211AB66AAD411F5624",
        "exactQuote": "Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an LLM, vector search and structured JSON output; reduced hallucinated answers through citation checks.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1456,
          "sourceSpanStart": 1256,
          "matchedNormalizedQuote": "Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an LLM, vector search and structured JSON output; reduced hallucinated answers through citation checks."
        },
        "declaredLocation": "Experience section, Wattwerk AI GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Building RAG assistants utilizing large language models, vector search, structured outputs, and citation checks to minimize hallucinations.",
    "proposedCanonicalName": "Retrieval-Augmented Generation System Engineering",
    "proposedPrimaryDomain": "Artificial Intelligence",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_AC3C31E7D5D79526B47E424B",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "ATOMIC",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_ECCE018BD6CBF018F8AB5E23",
        "exactQuote": "Fine-tuned a small language model with LoRA for classifying maintenance tickets.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1537,
          "sourceSpanStart": 1457,
          "matchedNormalizedQuote": "Fine-tuned a small language model with LoRA for classifying maintenance tickets."
        },
        "declaredLocation": "Experience section, Wattwerk AI GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Fine-tuning small language models using parameter-efficient techniques for specific classification tasks.",
    "proposedCanonicalName": "Language Model Fine-Tuning",
    "proposedPrimaryDomain": "Artificial Intelligence",
    "proposedDemonstratedLevel": null
  },
  {
    "runId": "RUN_640B00F97E1A1476178527E4",
    "status": "EVIDENCE_PASSED",
    "candidateId": "CAND_6A925D64D403A18273F0F788",
    "evidenceMode": "EXPLICIT",
    "proposedScope": "COMPOSITE",
    "evidenceClaims": [
      {
        "evidenceId": "EVD_683AC55666F4EE6B0514BED1",
        "exactQuote": "Modelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for duplicate equipment records.",
        "verification": {
          "status": "VERIFIED",
          "matchedDocId": "DOC_001",
          "sourceSpanEnd": 1663,
          "sourceSpanStart": 1538,
          "matchedNormalizedQuote": "Modelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for duplicate equipment records."
        },
        "declaredLocation": "Experience section, Wattwerk AI GmbH",
        "sourceDocumentRef": "DOC_001"
      }
    ],
    "modelConfidence": 0.95,
    "structuralDefinition": "Modeling complex relationships as knowledge graphs and implementing entity resolution for deduplication.",
    "proposedCanonicalName": "Knowledge Graph Modeling and Entity Resolution",
    "proposedPrimaryDomain": "Data Engineering",
    "proposedDemonstratedLevel": null
  }
]
```

#### Atomare und zusammengesetzte Fähigkeiten (aus `payload.candidates` tabelliert, keine neue Information)

| Kandidat | Name | Scope | Level | Konfidenz | Modus | Status | Claims verifiziert / gesamt |
|---|---|---|---|---|---|---|---|
| `CAND_1CE53DE1A9FD6BE7DB6A59C8` | Real-Time Stream Processing Pipeline Engineering | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_B53F29AE234E5061D17AB30C` | Data Schema Management and Evolution | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_4B77E04ED420901F69508499` | Automated Data Quality Validation | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_D43035DDC47C8F751030FB1F` | Machine Learning Lifecycle Management | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_B2BA89C176A9D34247541E04` | Machine Learning Pipeline Orchestration | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_94A8E4E6DC568974ACB10C57` | Infrastructure Provisioning | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_D9C314E1E6550EA826182441` | Machine Learning Model Monitoring | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_A05036355EC1DCBC93EB4F71` | Time Series Forecasting Modeling | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_685647F8AD86BDAF6FBBB34D` | Retrieval-Augmented Generation System Engineering | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_AC3C31E7D5D79526B47E424B` | Language Model Fine-Tuning | ATOMIC | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |
| `CAND_6A925D64D403A18273F0F788` | Knowledge Graph Modeling and Entity Resolution | COMPOSITE | None | 0.95 | EXPLICIT | EVIDENCE_PASSED | 1 / 1 |

---

# PART 3 — CAPABILITY CONVERGENCE

Builder: `buildCapabilityConvergencePrompt` (`lib/career/capability-core/convergence/prompt-builder.ts`). Kernel: `capability-convergence-v1` (gleicher Bootstrap). Provider: `GeminiCapabilityConvergenceProvider`.
Eingabe sind nur Discovery-Kandidaten mit Status `EVIDENCE_PASSED` und davon nur Claims mit `VERIFIED`, sortiert nach Kandidaten- und Evidenz-ID.

## 3.A Complete System Prompt

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — entschlüsselter ACTIVE-Kernel plus Identitätsvertrag; Kernel-Checksumme gleich der in beiden Convergence-Runs gespeicherten `prompt.checksum`**

```
You reconcile evidence-passed capability candidates into semantic proposals.
CONVERGENCE = SEMANTIC PROPOSAL, not verified capability truth.
Return output compatible with CapabilityConvergenceOutputSchema: groups with exact candidate membership, canonical capability naming, ATOMIC or COMPOSITE scope, structural definition, primary domain, proposed cross-capability relations, and reconciliation audit.
Do not claim final relation verification, authority, publication, or human decision outcomes.

Output identity contract:
"convergence_version" MUST equal exactly "convergence-v1".
Do not substitute the prompt slug, schema version, model version, semantic version shorthand, or any other value.
```

Kernel-Inhalt allein: SHA-256 `14a2c552dffac5bd0623ed97ec541833ad04bf44e785d80bcb672a5488b26f84` (= gespeicherte Prompt-Checksumme). Gesamter System-Prompt: 697 Zeichen, SHA-256 `c2d9629c78012db2c146f83c341efcc55c6b67c25ddd6b5cbf96140567d21593`.

## 3.B Complete User Prompt

### 3.B.1 A1 — ENGINEERING-Lebenslauf (Run `CONV_9029DF3D5ECD901B04CD95FD`)

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — aus den persistierten Discovery-Kandidaten; Kandidatenliste gleich `eligibleCandidateIds`; Run-ID exakt nachgerechnet**

Der Prompt enthält das Kandidaten-JSON als eine einzige Zeile, so wie gesendet:

```
CONDYN CAPABILITY CONVERGENCE INPUT
ELIGIBLE_CANDIDATE_COUNT: 10

[{"candidate_id":"CAND_2FA89B96A2ADDE6C39A85720","canonical_name":"Event Stream Processing","capability_scope":"ATOMIC","structural_definition":"Knowledge and application of event stream processing techniques, specifically applied to tracking systems.","primary_domain":"Computer Science","verified_evidence":[{"evidence_id":"EVD_65D5C6589C09E03E921C246D","source_document_id":"DOC_001","location":"Page 2, Education","exact_quote":"Thesis: event stream processing for parcel tracking."}]},{"candidate_id":"CAND_2FB4BF075E46DCBCEE6908C4","canonical_name":"Kubernetes Deployment and Linux Administration","capability_scope":"COMPOSITE","structural_definition":"Ability to deploy software services to Kubernetes clusters and maintain Linux-based build agents.","primary_domain":"DevOps","verified_evidence":[{"evidence_id":"EVD_BC958D42EE3228294C638914","source_document_id":"DOC_001","location":"Page 1, Experience, Datenwerk AG","exact_quote":"Deployed services to a Kubernetes test cluster and maintained Linux build agents."}]},{"candidate_id":"CAND_442D9C3D06C7E87612714007","canonical_name":"Dimensional Data Modeling","capability_scope":"ATOMIC","structural_definition":"Ability to design and model dimensional data structures for business reporting and analytics.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_8643028469EA9E5AA68086D1","source_document_id":"DOC_001","location":"Page 1, Experience, Datenwerk AG","exact_quote":"Modelled the dimensional data model for monthly carrier reports."}]},{"candidate_id":"CAND_5409F00F6F320E186AED06AC","canonical_name":"Relational Database Design and SQL Reporting","capability_scope":"COMPOSITE","structural_definition":"Ability to design PostgreSQL database schemas for business entities and write complex SQL queries for reporting purposes.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_2C1F07E787CFD69D6F2035F6","source_document_id":"DOC_001","location":"Page 1, Experience, Nordwind Logistics GmbH","exact_quote":"Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting queries."}]},{"candidate_id":"CAND_6D039E51D9510D0858982BB7","canonical_name":"React Frontend Development","capability_scope":"ATOMIC","structural_definition":"Ability to implement user interfaces and dashboards using React, including ensuring accessibility compliance with WCAG 2.1.","primary_domain":"Software Engineering","verified_evidence":[{"evidence_id":"EVD_C040D9EE928900630A2D1176","source_document_id":"DOC_001","location":"Page 1, Experience, Nordwind Logistics GmbH","exact_quote":"Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against WCAG 2.1."}]},{"candidate_id":"CAND_7C2AF22EED2A1C10303678B1","canonical_name":"Engineering Team Leadership","capability_scope":"COMPOSITE","structural_definition":"Ability to lead a team of software engineers and facilitate weekly architecture reviews.","primary_domain":"Engineering Management","verified_evidence":[{"evidence_id":"EVD_28FCC73613D63CE949194DF7","source_document_id":"DOC_001","location":"Page 1, Experience, Nordwind Logistics GmbH","exact_quote":"Led a team of four engineers and ran the weekly architecture review."}]},{"candidate_id":"CAND_92B0B8C6BBB93BC2C0B70D01","canonical_name":"Test-Driven Development (TDD)","capability_scope":"ATOMIC","structural_definition":"Ability to introduce test-driven development methodologies and significantly increase unit test coverage using testing frameworks like Jest.","primary_domain":"Software Engineering","verified_evidence":[{"evidence_id":"EVD_2836DCCF5BFD1A0C1D0E4C60","source_document_id":"DOC_001","location":"Page 1, Experience, Nordwind Logistics GmbH","exact_quote":"Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%."}]},{"candidate_id":"CAND_AF91B0EE67E451C92679A2E8","canonical_name":"Python ETL Pipeline Development","capability_scope":"ATOMIC","structural_definition":"Ability to write Python-based Extract, Transform, Load (ETL) jobs to move event data from message brokers like Apache Kafka into data warehouses.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_D8BDF36BA2650CE113EE903F","source_document_id":"DOC_001","location":"Page 1, Experience, Datenwerk AG","exact_quote":"Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse."}]},{"candidate_id":"CAND_BF4F013691D2968B329252A4","canonical_name":"CI/CD Pipeline and Containerization Engineering","capability_scope":"COMPOSITE","structural_definition":"Ability to set up continuous integration and continuous deployment pipelines using GitHub Actions and build Docker container images for software services.","primary_domain":"DevOps","verified_evidence":[{"evidence_id":"EVD_44DAF038937868690DC58968","source_document_id":"DOC_001","location":"Page 1, Experience, Nordwind Logistics GmbH","exact_quote":"Set up CI/CD pipelines with GitHub Actions and built Docker images for every service."}]},{"candidate_id":"CAND_D4E38FFF8209CD0B68CCB3A6","canonical_name":"TypeScript and Node.js Backend Development","capability_scope":"COMPOSITE","structural_definition":"Ability to build backend platforms and migrate existing services to strict TypeScript using Node.js and Express.","primary_domain":"Software Engineering","verified_evidence":[{"evidence_id":"EVD_73165519F8B3F94E33A8CE61","source_document_id":"DOC_001","location":"Page 1, Experience, Nordwind Logistics GmbH","exact_quote":"Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to strict TypeScript."}]}]
```

Zeichen: 5728 · SHA-256: `520a03c20d27504fbf7917df7a127eb91c62d8c33b4ba51944b3d94fb72e8c1e` · gesendeter `contents`-String: 6427 Zeichen, SHA-256 `3098cac21e4c083fc1f10becb9a9ec5acb05eb091045099a8a1b7266d7a9b916`.

### 3.B.2 A2 — AI-&-DATA-Lebenslauf (Run `CONV_E66D9CFFAC0EF1F52B36052E`)

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — aus den persistierten Discovery-Kandidaten; Kandidatenliste gleich `eligibleCandidateIds`; Run-ID exakt nachgerechnet**

Der Prompt enthält das Kandidaten-JSON als eine einzige Zeile, so wie gesendet:

```
CONDYN CAPABILITY CONVERGENCE INPUT
ELIGIBLE_CANDIDATE_COUNT: 11

[{"candidate_id":"CAND_1CE53DE1A9FD6BE7DB6A59C8","canonical_name":"Real-Time Stream Processing Pipeline Engineering","capability_scope":"COMPOSITE","structural_definition":"Designing and building high-throughput data ingestion and processing pipelines using distributed streaming platforms.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_DD251A5511E1ECB3ACBB6EBC","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"Built real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000 smart meter readings per second."}]},{"candidate_id":"CAND_4B77E04ED420901F69508499","canonical_name":"Automated Data Quality Validation","capability_scope":"ATOMIC","structural_definition":"Implementing automated data quality checks to identify and reduce faulty records in data pipelines.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_467CA4AD67E56D17BE2DC1AE","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"Implemented data quality checks with Great Expectations and reduced faulty billing records by 60%."}]},{"candidate_id":"CAND_685647F8AD86BDAF6FBBB34D","canonical_name":"Retrieval-Augmented Generation System Engineering","capability_scope":"COMPOSITE","structural_definition":"Building RAG assistants utilizing large language models, vector search, structured outputs, and citation checks to minimize hallucinations.","primary_domain":"Artificial Intelligence","verified_evidence":[{"evidence_id":"EVD_BCFACB211AB66AAD411F5624","source_document_id":"DOC_001","location":"Experience section, Wattwerk AI GmbH","exact_quote":"Built a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an LLM, vector search and structured JSON output; reduced hallucinated answers through citation checks."}]},{"candidate_id":"CAND_6A925D64D403A18273F0F788","canonical_name":"Knowledge Graph Modeling and Entity Resolution","capability_scope":"COMPOSITE","structural_definition":"Modeling complex relationships as knowledge graphs and implementing entity resolution for deduplication.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_683AC55666F4EE6B0514BED1","source_document_id":"DOC_001","location":"Experience section, Wattwerk AI GmbH","exact_quote":"Modelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for duplicate equipment records."}]},{"candidate_id":"CAND_94A8E4E6DC568974ACB10C57","canonical_name":"Infrastructure Provisioning","capability_scope":"ATOMIC","structural_definition":"Provisioning and managing infrastructure using infrastructure-as-code tools.","primary_domain":"DevOps","verified_evidence":[{"evidence_id":"EVD_DC25E6D8707BD8996271ED5C","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"provisioned the infrastructure with Terraform."}]},{"candidate_id":"CAND_A05036355EC1DCBC93EB4F71","canonical_name":"Time Series Forecasting Modeling","capability_scope":"COMPOSITE","structural_definition":"Developing predictive models for time series data using deep learning and gradient boosting frameworks.","primary_domain":"Machine Learning","verified_evidence":[{"evidence_id":"EVD_5EF9956C8EEEE367296D23A3","source_document_id":"DOC_001","location":"Experience section, Wattwerk AI GmbH","exact_quote":"Developed time series forecasting models for grid load in Python with PyTorch and LightGBM."}]},{"candidate_id":"CAND_AC3C31E7D5D79526B47E424B","canonical_name":"Language Model Fine-Tuning","capability_scope":"ATOMIC","structural_definition":"Fine-tuning small language models using parameter-efficient techniques for specific classification tasks.","primary_domain":"Artificial Intelligence","verified_evidence":[{"evidence_id":"EVD_ECCE018BD6CBF018F8AB5E23","source_document_id":"DOC_001","location":"Experience section, Wattwerk AI GmbH","exact_quote":"Fine-tuned a small language model with LoRA for classifying maintenance tickets."}]},{"candidate_id":"CAND_B2BA89C176A9D34247541E04","canonical_name":"Machine Learning Pipeline Orchestration","capability_scope":"COMPOSITE","structural_definition":"Running and orchestrating machine learning pipelines on containerized infrastructure.","primary_domain":"MLOps","verified_evidence":[{"evidence_id":"EVD_43F3B8DC0B29B5A8F0FC1B18","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"Ran ML pipelines on Kubernetes with Argo Workflows"}]},{"candidate_id":"CAND_B53F29AE234E5061D17AB30C","canonical_name":"Data Schema Management and Evolution","capability_scope":"ATOMIC","structural_definition":"Implementing and managing data schemas and backward-compatible evolution using schema registries.","primary_domain":"Data Engineering","verified_evidence":[{"evidence_id":"EVD_252D3E87A80A33137F1476E6","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"Introduced Avro schemas with a schema registry and managed backward-compatible schema evolution across 25 topics."}]},{"candidate_id":"CAND_D43035DDC47C8F751030FB1F","canonical_name":"Machine Learning Lifecycle Management","capability_scope":"COMPOSITE","structural_definition":"Setting up experiment tracking, model registries, and lineage tracking for machine learning models.","primary_domain":"MLOps","verified_evidence":[{"evidence_id":"EVD_B4DDAA940B279F0FBEC3AE34","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"Set up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models."}]},{"candidate_id":"CAND_D9C314E1E6550EA826182441","canonical_name":"Machine Learning Model Monitoring","capability_scope":"ATOMIC","structural_definition":"Building monitoring dashboards to detect data and model drift and trigger automated retraining.","primary_domain":"MLOps","verified_evidence":[{"evidence_id":"EVD_B3362D06C87161E6905BF986","source_document_id":"DOC_001","location":"Experience section, Stromnetz Nord Analytics GmbH","exact_quote":"Built model monitoring dashboards that detect drift in load forecasts and trigger retraining."}]}]
```

Zeichen: 6393 · SHA-256: `f5ff679b96c87ab08c191fadb9089fa139e3a164e7c805b5b461b0580ec4631c` · gesendeter `contents`-String: 7092 Zeichen, SHA-256 `11a1b736e27245bf32e45717613631e4828ba8876c5c839ba803fafe4506886e`.

## 3.C Complete Response Schema

**Status: RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS — `getGeminiCapabilityConvergenceResponseJsonSchema()` (`convergence/gemini-schema-projector.ts`), Zod `CapabilityConvergenceOutputSchema` → JSON Schema 2019-09, gleiche Bereinigung**

```json
{
  "type": "object",
  "properties": {
    "convergence_version": {
      "type": "string"
    },
    "groups": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "group_key": {
            "type": "string"
          },
          "member_candidate_ids": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "minItems": 1
          },
          "canonical_name": {
            "type": "string"
          },
          "capability_scope": {
            "type": "string",
            "enum": [
              "ATOMIC",
              "COMPOSITE"
            ]
          },
          "structural_definition": {
            "type": "string"
          },
          "primary_domain": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "group_key",
          "member_candidate_ids",
          "canonical_name",
          "capability_scope",
          "structural_definition",
          "primary_domain"
        ],
        "additionalProperties": false
      }
    },
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "source_group_key": {
            "type": "string"
          },
          "target_group_key": {
            "type": "string"
          },
          "relation_type": {
            "type": "string",
            "enum": [
              "PARENT_CHILD",
              "RELATED_CAPABILITY",
              "DISTINCT_CAPABILITY",
              "UNRESOLVED"
            ]
          },
          "reason": {
            "type": "string"
          }
        },
        "required": [
          "source_group_key",
          "target_group_key",
          "relation_type",
          "reason"
        ],
        "additionalProperties": false
      }
    },
    "reconciliation_audit": {
      "type": "object",
      "properties": {
        "input_candidate_count": {
          "type": "integer",
          "minimum": 0
        },
        "grouped_candidate_count": {
          "type": "integer",
          "minimum": 0
        },
        "group_count": {
          "type": "integer",
          "minimum": 0
        },
        "same_capability_merge_count": {
          "type": "integer",
          "minimum": 0
        },
        "unresolved_relation_count": {
          "type": "integer",
          "minimum": 0
        },
        "reconciliation_pass_completed": {
          "type": "boolean"
        }
      },
      "required": [
        "input_candidate_count",
        "grouped_candidate_count",
        "group_count",
        "same_capability_merge_count",
        "unresolved_relation_count",
        "reconciliation_pass_completed"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "convergence_version",
    "groups",
    "relations",
    "reconciliation_audit"
  ],
  "additionalProperties": false,
  "$defs": {
    "CapabilityConvergenceOutput": {
      "type": "object",
      "properties": {
        "convergence_version": {
          "type": "string"
        },
        "groups": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "group_key": {
                "type": "string"
              },
              "member_candidate_ids": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "minItems": 1
              },
              "canonical_name": {
                "type": "string"
              },
              "capability_scope": {
                "type": "string",
                "enum": [
                  "ATOMIC",
                  "COMPOSITE"
                ]
              },
              "structural_definition": {
                "type": "string"
              },
              "primary_domain": {
                "anyOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            },
            "required": [
              "group_key",
              "member_candidate_ids",
              "canonical_name",
              "capability_scope",
              "structural_definition",
              "primary_domain"
            ],
            "additionalProperties": false
          }
        },
        "relations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source_group_key": {
                "type": "string"
              },
              "target_group_key": {
                "type": "string"
              },
              "relation_type": {
                "type": "string",
                "enum": [
                  "PARENT_CHILD",
                  "RELATED_CAPABILITY",
                  "DISTINCT_CAPABILITY",
                  "UNRESOLVED"
                ]
              },
              "reason": {
                "type": "string"
              }
            },
            "required": [
              "source_group_key",
              "target_group_key",
              "relation_type",
              "reason"
            ],
            "additionalProperties": false
          }
        },
        "reconciliation_audit": {
          "type": "object",
          "properties": {
            "input_candidate_count": {
              "type": "integer",
              "minimum": 0
            },
            "grouped_candidate_count": {
              "type": "integer",
              "minimum": 0
            },
            "group_count": {
              "type": "integer",
              "minimum": 0
            },
            "same_capability_merge_count": {
              "type": "integer",
              "minimum": 0
            },
            "unresolved_relation_count": {
              "type": "integer",
              "minimum": 0
            },
            "reconciliation_pass_completed": {
              "type": "boolean"
            }
          },
          "required": [
            "input_candidate_count",
            "grouped_candidate_count",
            "group_count",
            "same_capability_merge_count",
            "unresolved_relation_count",
            "reconciliation_pass_completed"
          ],
          "additionalProperties": false
        }
      },
      "required": [
        "convergence_version",
        "groups",
        "relations",
        "reconciliation_audit"
      ],
      "additionalProperties": false
    }
  }
}
```

Nach der Antwort folgen weitere Prüfungen:
- Zod `.strict()` und `convergence_version` = `convergence-v1`;
- `validateCapabilityConvergenceOutput`: jede berechtigte Kandidaten-ID genau einmal, keine abgelehnten oder unbekannten IDs, eindeutige Gruppenschlüssel, keine Selbst- oder Doppelrelation, Audit-Zähler exakt;
- danach `canonicalizeCapabilityConvergence` (provisorische Capability-IDs, Relationen `PROPOSED`).

## 3.D Runtime Configuration

| Parameter | Wert |
|---|---|
| Modell (tatsächlich, persistiert) | `gemini-3.1-pro-preview`; keine Kaskade, ein Versuch |
| API / `contents` | `ai.models.generateContent`; ein String System + `\n\n` + User |
| `config.responseMimeType` | `application/json` |
| `config.responseJsonSchema` | Schema aus 3.C |
| `config.temperature` | `0.1` |
| `config.maxOutputTokens` | `32768` |
| Abbruchregel | `finishReason` ≠ `STOP` → `ERR_CAPABILITY_CONVERGENCE_STRUCTURED_OUTPUT_INVALID` |
| Kernel-Version / Schema / Algorithmus | `convergence-v1` / `convergence-schema-v1` / `algorithm-v1` |
| Prompt-Template / Version | `tpl_capability-convergence-v1` / `ver_capability-convergence-v1_v1` (Version 1, ACTIVE) |
| Prompt-Checksumme | `14a2c552dffac5bd0623ed97ec541833ad04bf44e785d80bcb672a5488b26f84` |
| Run-ID-Formel | `CONV_` + erste 24 Hex-Zeichen von SHA-256(stabiles JSON[discoveryRunId, discoveryRawOutputHash, kernelVersion, promptChecksum, provider, model, schemaVersion, algorithmVersion]) |
| Kein Aufruf | Ohne berechtigte Kandidaten wird ein leeres Ergebnis ohne Gemini erzeugt (hier nicht eingetreten) |

## 3.E Available Full Output

**Status: RAW RESPONSE NOT AVAILABLE — gespeichert wird das geparste, validierte Modellobjekt `convergenceOutput`**

Integrität: SHA-256 der stabilen Serialisierung = gespeicherter `rawOutputHash`.

### 3.E.1 A1 — Convergence-Run `CONV_9029DF3D5ECD901B04CD95FD`

**Status: ORIGINAL (persistiertes Laufzeitartefakt, byte-identisch aus der E2E-Wegwerf-Datenbank)**

#### Run-Metadaten

```json
{
  "prompt": {
    "checksum": "14a2c552dffac5bd0623ed97ec541833ad04bf44e785d80bcb672a5488b26f84",
    "versionId": "ver_capability-convergence-v1_v1",
    "templateId": "tpl_capability-convergence-v1"
  },
  "status": "COMPLETED",
  "runKind": "CAPABILITY_CONVERGENCE",
  "createdAt": "2026-10-13T15:22:54.100Z",
  "inference": {
    "model": "gemini-3.1-pro-preview",
    "provider": "gemini"
  },
  "completedAt": "2026-10-13T15:22:54.100Z",
  "kernelVersion": "convergence-v1",
  "rawOutputHash": "11558e32ebdde887c33406f2551e1e9c31205d98b56835f3ffd08fe08387cd67",
  "schemaVersion": "convergence-schema-v1",
  "discoveryRunId": "RUN_AD78E73E4C84D315317E8156",
  "algorithmVersion": "algorithm-v1",
  "convergenceRunId": "CONV_9029DF3D5ECD901B04CD95FD",
  "sourceBundleHash": "5a1998013aa063db166328b4c94ffb630a36e9913a465500fa9cba53fe6c637d",
  "discoveryRawOutputHash": "02937103cc406a66b7a634c6b5ec83bbf2dfd1d361fb79883067e760539041a0"
}
```

#### Convergence Output (`payload.convergenceOutput`, vollständiges geparstes Modellobjekt)

```json
{
  "groups": [
    {
      "group_key": "GRP_EVENT_STREAM",
      "canonical_name": "Event Stream Processing",
      "primary_domain": "Computer Science",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_2FA89B96A2ADDE6C39A85720"
      ],
      "structural_definition": "Knowledge and application of event stream processing techniques, specifically applied to tracking systems."
    },
    {
      "group_key": "GRP_K8S_LINUX",
      "canonical_name": "Kubernetes Deployment and Linux Administration",
      "primary_domain": "DevOps",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_2FB4BF075E46DCBCEE6908C4"
      ],
      "structural_definition": "Ability to deploy software services to Kubernetes clusters and maintain Linux-based build agents."
    },
    {
      "group_key": "GRP_DIM_DATA_MODEL",
      "canonical_name": "Dimensional Data Modeling",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_442D9C3D06C7E87612714007"
      ],
      "structural_definition": "Ability to design and model dimensional data structures for business reporting and analytics."
    },
    {
      "group_key": "GRP_RDBMS_SQL",
      "canonical_name": "Relational Database Design and SQL Reporting",
      "primary_domain": "Data Engineering",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_5409F00F6F320E186AED06AC"
      ],
      "structural_definition": "Ability to design PostgreSQL database schemas for business entities and write complex SQL queries for reporting purposes."
    },
    {
      "group_key": "GRP_REACT_FRONTEND",
      "canonical_name": "React Frontend Development",
      "primary_domain": "Software Engineering",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_6D039E51D9510D0858982BB7"
      ],
      "structural_definition": "Ability to implement user interfaces and dashboards using React, including ensuring accessibility compliance with WCAG 2.1."
    },
    {
      "group_key": "GRP_ENG_LEADERSHIP",
      "canonical_name": "Engineering Team Leadership",
      "primary_domain": "Engineering Management",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_7C2AF22EED2A1C10303678B1"
      ],
      "structural_definition": "Ability to lead a team of software engineers and facilitate weekly architecture reviews."
    },
    {
      "group_key": "GRP_TDD",
      "canonical_name": "Test-Driven Development (TDD)",
      "primary_domain": "Software Engineering",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_92B0B8C6BBB93BC2C0B70D01"
      ],
      "structural_definition": "Ability to introduce test-driven development methodologies and significantly increase unit test coverage using testing frameworks like Jest."
    },
    {
      "group_key": "GRP_PYTHON_ETL",
      "canonical_name": "Python ETL Pipeline Development",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_AF91B0EE67E451C92679A2E8"
      ],
      "structural_definition": "Ability to write Python-based Extract, Transform, Load (ETL) jobs to move event data from message brokers like Apache Kafka into data warehouses."
    },
    {
      "group_key": "GRP_CICD_CONTAINERS",
      "canonical_name": "CI/CD Pipeline and Containerization Engineering",
      "primary_domain": "DevOps",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_BF4F013691D2968B329252A4"
      ],
      "structural_definition": "Ability to set up continuous integration and continuous deployment pipelines using GitHub Actions and build Docker container images for software services."
    },
    {
      "group_key": "GRP_TS_NODE_BACKEND",
      "canonical_name": "TypeScript and Node.js Backend Development",
      "primary_domain": "Software Engineering",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_D4E38FFF8209CD0B68CCB3A6"
      ],
      "structural_definition": "Ability to build backend platforms and migrate existing services to strict TypeScript using Node.js and Express."
    }
  ],
  "relations": [
    {
      "reason": "CI/CD pipelines are frequently used to build the container images that are subsequently deployed to Kubernetes clusters.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_CICD_CONTAINERS",
      "target_group_key": "GRP_K8S_LINUX"
    },
    {
      "reason": "ETL pipelines and event stream processing both handle data ingestion, transformation, and movement across data infrastructure.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_PYTHON_ETL",
      "target_group_key": "GRP_EVENT_STREAM"
    },
    {
      "reason": "Dimensional data modeling and relational database design are complementary data engineering skills used to structure data for reporting.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_DIM_DATA_MODEL",
      "target_group_key": "GRP_RDBMS_SQL"
    },
    {
      "reason": "Backend TypeScript/Node.js development and Frontend React development together form a complete full-stack web development capability set.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_TS_NODE_BACKEND",
      "target_group_key": "GRP_REACT_FRONTEND"
    },
    {
      "reason": "Test-Driven Development is a methodology directly applied to software engineering practices such as backend development to ensure code quality.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_TDD",
      "target_group_key": "GRP_TS_NODE_BACKEND"
    }
  ],
  "convergence_version": "convergence-v1",
  "reconciliation_audit": {
    "group_count": 10,
    "input_candidate_count": 10,
    "grouped_candidate_count": 10,
    "unresolved_relation_count": 0,
    "same_capability_merge_count": 0,
    "reconciliation_pass_completed": true
  }
}
```

#### Convergence Audit (`convergenceOutput.reconciliation_audit`) und Reconciliation-Status

```json
{
  "reconciliation_audit": {
    "group_count": 10,
    "input_candidate_count": 10,
    "grouped_candidate_count": 10,
    "unresolved_relation_count": 0,
    "same_capability_merge_count": 0,
    "reconciliation_pass_completed": true
  },
  "reconciliation": {
    "status": "PASSED"
  },
  "eligibleCandidateIds": [
    "CAND_2FA89B96A2ADDE6C39A85720",
    "CAND_2FB4BF075E46DCBCEE6908C4",
    "CAND_442D9C3D06C7E87612714007",
    "CAND_5409F00F6F320E186AED06AC",
    "CAND_6D039E51D9510D0858982BB7",
    "CAND_7C2AF22EED2A1C10303678B1",
    "CAND_92B0B8C6BBB93BC2C0B70D01",
    "CAND_AF91B0EE67E451C92679A2E8",
    "CAND_BF4F013691D2968B329252A4",
    "CAND_D4E38FFF8209CD0B68CCB3A6"
  ],
  "excludedCandidateIds": []
}
```

#### Kanonische Capability-Entwürfe (`payload.canonicalDrafts`)

```json
[
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_2FA89B96A2ADDE6C39A85720"
      ]
    },
    "evidenceIds": [
      "EVD_65D5C6589C09E03E921C246D"
    ],
    "canonicalName": "Event Stream Processing",
    "primaryDomain": "Computer Science",
    "structuralDefinition": "Knowledge and application of event stream processing techniques, specifically applied to tracking systems.",
    "provisionalCapabilityId": "PCAP_47D7DB2BF5447A84BCD063C9",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_2FB4BF075E46DCBCEE6908C4"
      ]
    },
    "evidenceIds": [
      "EVD_BC958D42EE3228294C638914"
    ],
    "canonicalName": "Kubernetes Deployment and Linux Administration",
    "primaryDomain": "DevOps",
    "structuralDefinition": "Ability to deploy software services to Kubernetes clusters and maintain Linux-based build agents.",
    "provisionalCapabilityId": "PCAP_05576694BDEA8D9706239257",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_442D9C3D06C7E87612714007"
      ]
    },
    "evidenceIds": [
      "EVD_8643028469EA9E5AA68086D1"
    ],
    "canonicalName": "Dimensional Data Modeling",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Ability to design and model dimensional data structures for business reporting and analytics.",
    "provisionalCapabilityId": "PCAP_C37223EE2DCC92DE03376CAB",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_5409F00F6F320E186AED06AC"
      ]
    },
    "evidenceIds": [
      "EVD_2C1F07E787CFD69D6F2035F6"
    ],
    "canonicalName": "Relational Database Design and SQL Reporting",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Ability to design PostgreSQL database schemas for business entities and write complex SQL queries for reporting purposes.",
    "provisionalCapabilityId": "PCAP_56B8361DB4A0A0F607A1E289",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_6D039E51D9510D0858982BB7"
      ]
    },
    "evidenceIds": [
      "EVD_C040D9EE928900630A2D1176"
    ],
    "canonicalName": "React Frontend Development",
    "primaryDomain": "Software Engineering",
    "structuralDefinition": "Ability to implement user interfaces and dashboards using React, including ensuring accessibility compliance with WCAG 2.1.",
    "provisionalCapabilityId": "PCAP_2F1AAD08A1223C52A75F4B03",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_7C2AF22EED2A1C10303678B1"
      ]
    },
    "evidenceIds": [
      "EVD_28FCC73613D63CE949194DF7"
    ],
    "canonicalName": "Engineering Team Leadership",
    "primaryDomain": "Engineering Management",
    "structuralDefinition": "Ability to lead a team of software engineers and facilitate weekly architecture reviews.",
    "provisionalCapabilityId": "PCAP_9939772E2CD63A834448E88D",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_92B0B8C6BBB93BC2C0B70D01"
      ]
    },
    "evidenceIds": [
      "EVD_2836DCCF5BFD1A0C1D0E4C60"
    ],
    "canonicalName": "Test-Driven Development (TDD)",
    "primaryDomain": "Software Engineering",
    "structuralDefinition": "Ability to introduce test-driven development methodologies and significantly increase unit test coverage using testing frameworks like Jest.",
    "provisionalCapabilityId": "PCAP_4BA2D34C76787FE70CFC2735",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_AF91B0EE67E451C92679A2E8"
      ]
    },
    "evidenceIds": [
      "EVD_D8BDF36BA2650CE113EE903F"
    ],
    "canonicalName": "Python ETL Pipeline Development",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Ability to write Python-based Extract, Transform, Load (ETL) jobs to move event data from message brokers like Apache Kafka into data warehouses.",
    "provisionalCapabilityId": "PCAP_3ACC97F1552310354AEE8CD6",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_BF4F013691D2968B329252A4"
      ]
    },
    "evidenceIds": [
      "EVD_44DAF038937868690DC58968"
    ],
    "canonicalName": "CI/CD Pipeline and Containerization Engineering",
    "primaryDomain": "DevOps",
    "structuralDefinition": "Ability to set up continuous integration and continuous deployment pipelines using GitHub Actions and build Docker container images for software services.",
    "provisionalCapabilityId": "PCAP_8A15DD076CD3C5AE8CC09092",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_D4E38FFF8209CD0B68CCB3A6"
      ]
    },
    "evidenceIds": [
      "EVD_73165519F8B3F94E33A8CE61"
    ],
    "canonicalName": "TypeScript and Node.js Backend Development",
    "primaryDomain": "Software Engineering",
    "structuralDefinition": "Ability to build backend platforms and migrate existing services to strict TypeScript using Node.js and Express.",
    "provisionalCapabilityId": "PCAP_80A427545CE375CD8DF61CE1",
    "semanticDefinitionStatus": "NOT_RUN"
  }
]
```

#### Vorgeschlagene Relationen (`payload.proposedRelations`)

```json
[
  {
    "reason": "CI/CD pipelines are frequently used to build the container images that are subsequently deployed to Kubernetes clusters.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:22:54.100Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_20083298479473FA1E05FDD7",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_8A15DD076CD3C5AE8CC09092",
    "targetCapabilityRef": "PCAP_05576694BDEA8D9706239257"
  },
  {
    "reason": "ETL pipelines and event stream processing both handle data ingestion, transformation, and movement across data infrastructure.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:22:54.100Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_D5ED12D7A628CE2F9EDE6E34",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_3ACC97F1552310354AEE8CD6",
    "targetCapabilityRef": "PCAP_47D7DB2BF5447A84BCD063C9"
  },
  {
    "reason": "Dimensional data modeling and relational database design are complementary data engineering skills used to structure data for reporting.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:22:54.100Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_E17763354E3BDE1CAB9230F6",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_C37223EE2DCC92DE03376CAB",
    "targetCapabilityRef": "PCAP_56B8361DB4A0A0F607A1E289"
  },
  {
    "reason": "Backend TypeScript/Node.js development and Frontend React development together form a complete full-stack web development capability set.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:22:54.100Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_F0783BE5F12BB2A481AFB662",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_80A427545CE375CD8DF61CE1",
    "targetCapabilityRef": "PCAP_2F1AAD08A1223C52A75F4B03"
  },
  {
    "reason": "Test-Driven Development is a methodology directly applied to software engineering practices such as backend development to ensure code quality.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:22:54.100Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_DEC590E0ADEEFB7490D93AB5",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_4BA2D34C76787FE70CFC2735",
    "targetCapabilityRef": "PCAP_80A427545CE375CD8DF61CE1"
  }
]
```

### 3.E.2 A2 — Convergence-Run `CONV_E66D9CFFAC0EF1F52B36052E`

**Status: ORIGINAL (persistiertes Laufzeitartefakt, byte-identisch aus der E2E-Wegwerf-Datenbank)**

#### Run-Metadaten

```json
{
  "prompt": {
    "checksum": "14a2c552dffac5bd0623ed97ec541833ad04bf44e785d80bcb672a5488b26f84",
    "versionId": "ver_capability-convergence-v1_v1",
    "templateId": "tpl_capability-convergence-v1"
  },
  "status": "COMPLETED",
  "runKind": "CAPABILITY_CONVERGENCE",
  "createdAt": "2026-10-13T15:26:04.807Z",
  "inference": {
    "model": "gemini-3.1-pro-preview",
    "provider": "gemini"
  },
  "completedAt": "2026-10-13T15:26:04.807Z",
  "kernelVersion": "convergence-v1",
  "rawOutputHash": "cdc5c598e1159a388ff60a766e7102a0b065ab1d9b7d03dc43afe4791cba3b5b",
  "schemaVersion": "convergence-schema-v1",
  "discoveryRunId": "RUN_640B00F97E1A1476178527E4",
  "algorithmVersion": "algorithm-v1",
  "convergenceRunId": "CONV_E66D9CFFAC0EF1F52B36052E",
  "sourceBundleHash": "246cd6ea00c5c7276fc56e80f9cfe3dd9da1ef07dff970321aed31f5521193cd",
  "discoveryRawOutputHash": "f2f0ea4cdb4c0bb6b7f2fa04d66832d207fff208c340f0eb70b4f622f8e26c7c"
}
```

#### Convergence Output (`payload.convergenceOutput`, vollständiges geparstes Modellobjekt)

```json
{
  "groups": [
    {
      "group_key": "GRP_STREAM_PROCESSING",
      "canonical_name": "Real-Time Stream Processing Pipeline Engineering",
      "primary_domain": "Data Engineering",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_1CE53DE1A9FD6BE7DB6A59C8"
      ],
      "structural_definition": "Designing and building high-throughput data ingestion and processing pipelines using distributed streaming platforms."
    },
    {
      "group_key": "GRP_DATA_QUALITY",
      "canonical_name": "Automated Data Quality Validation",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_4B77E04ED420901F69508499"
      ],
      "structural_definition": "Implementing automated data quality checks to identify and reduce faulty records in data pipelines."
    },
    {
      "group_key": "GRP_RAG_ENGINEERING",
      "canonical_name": "Retrieval-Augmented Generation System Engineering",
      "primary_domain": "Artificial Intelligence",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_685647F8AD86BDAF6FBBB34D"
      ],
      "structural_definition": "Building RAG assistants utilizing large language models, vector search, structured outputs, and citation checks to minimize hallucinations."
    },
    {
      "group_key": "GRP_KNOWLEDGE_GRAPH",
      "canonical_name": "Knowledge Graph Modeling and Entity Resolution",
      "primary_domain": "Data Engineering",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_6A925D64D403A18273F0F788"
      ],
      "structural_definition": "Modeling complex relationships as knowledge graphs and implementing entity resolution for deduplication."
    },
    {
      "group_key": "GRP_INFRA_PROVISIONING",
      "canonical_name": "Infrastructure Provisioning",
      "primary_domain": "DevOps",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_94A8E4E6DC568974ACB10C57"
      ],
      "structural_definition": "Provisioning and managing infrastructure using infrastructure-as-code tools."
    },
    {
      "group_key": "GRP_TS_FORECASTING",
      "canonical_name": "Time Series Forecasting Modeling",
      "primary_domain": "Machine Learning",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_A05036355EC1DCBC93EB4F71"
      ],
      "structural_definition": "Developing predictive models for time series data using deep learning and gradient boosting frameworks."
    },
    {
      "group_key": "GRP_LLM_FINETUNING",
      "canonical_name": "Language Model Fine-Tuning",
      "primary_domain": "Artificial Intelligence",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_AC3C31E7D5D79526B47E424B"
      ],
      "structural_definition": "Fine-tuning small language models using parameter-efficient techniques for specific classification tasks."
    },
    {
      "group_key": "GRP_ML_ORCHESTRATION",
      "canonical_name": "Machine Learning Pipeline Orchestration",
      "primary_domain": "MLOps",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_B2BA89C176A9D34247541E04"
      ],
      "structural_definition": "Running and orchestrating machine learning pipelines on containerized infrastructure."
    },
    {
      "group_key": "GRP_SCHEMA_MANAGEMENT",
      "canonical_name": "Data Schema Management and Evolution",
      "primary_domain": "Data Engineering",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_B53F29AE234E5061D17AB30C"
      ],
      "structural_definition": "Implementing and managing data schemas and backward-compatible evolution using schema registries."
    },
    {
      "group_key": "GRP_ML_LIFECYCLE",
      "canonical_name": "Machine Learning Lifecycle Management",
      "primary_domain": "MLOps",
      "capability_scope": "COMPOSITE",
      "member_candidate_ids": [
        "CAND_D43035DDC47C8F751030FB1F"
      ],
      "structural_definition": "Setting up experiment tracking, model registries, and lineage tracking for machine learning models."
    },
    {
      "group_key": "GRP_ML_MONITORING",
      "canonical_name": "Machine Learning Model Monitoring",
      "primary_domain": "MLOps",
      "capability_scope": "ATOMIC",
      "member_candidate_ids": [
        "CAND_D9C314E1E6550EA826182441"
      ],
      "structural_definition": "Building monitoring dashboards to detect data and model drift and trigger automated retraining."
    }
  ],
  "relations": [
    {
      "reason": "Stream processing pipelines frequently utilize schema registries to enforce data contracts and manage evolution.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_STREAM_PROCESSING",
      "target_group_key": "GRP_SCHEMA_MANAGEMENT"
    },
    {
      "reason": "Data quality validation is applied within data pipelines to ensure the integrity of processed records.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_STREAM_PROCESSING",
      "target_group_key": "GRP_DATA_QUALITY"
    },
    {
      "reason": "Orchestrated ML pipelines integrate with lifecycle management tools to track experiments and register models.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_ML_ORCHESTRATION",
      "target_group_key": "GRP_ML_LIFECYCLE"
    },
    {
      "reason": "Model monitoring systems detect drift and trigger orchestrated pipelines for automated retraining.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_ML_MONITORING",
      "target_group_key": "GRP_ML_ORCHESTRATION"
    },
    {
      "reason": "Time series forecasting models are tracked, versioned, and registered within the ML lifecycle system.",
      "relation_type": "RELATED_CAPABILITY",
      "source_group_key": "GRP_TS_FORECASTING",
      "target_group_key": "GRP_ML_LIFECYCLE"
    },
    {
      "reason": "Both involve large language models but represent distinct AI engineering approaches (retrieval vs. parameter updates).",
      "relation_type": "DISTINCT_CAPABILITY",
      "source_group_key": "GRP_RAG_ENGINEERING",
      "target_group_key": "GRP_LLM_FINETUNING"
    }
  ],
  "convergence_version": "convergence-v1",
  "reconciliation_audit": {
    "group_count": 11,
    "input_candidate_count": 11,
    "grouped_candidate_count": 11,
    "unresolved_relation_count": 0,
    "same_capability_merge_count": 0,
    "reconciliation_pass_completed": true
  }
}
```

#### Convergence Audit (`convergenceOutput.reconciliation_audit`) und Reconciliation-Status

```json
{
  "reconciliation_audit": {
    "group_count": 11,
    "input_candidate_count": 11,
    "grouped_candidate_count": 11,
    "unresolved_relation_count": 0,
    "same_capability_merge_count": 0,
    "reconciliation_pass_completed": true
  },
  "reconciliation": {
    "status": "PASSED"
  },
  "eligibleCandidateIds": [
    "CAND_1CE53DE1A9FD6BE7DB6A59C8",
    "CAND_4B77E04ED420901F69508499",
    "CAND_685647F8AD86BDAF6FBBB34D",
    "CAND_6A925D64D403A18273F0F788",
    "CAND_94A8E4E6DC568974ACB10C57",
    "CAND_A05036355EC1DCBC93EB4F71",
    "CAND_AC3C31E7D5D79526B47E424B",
    "CAND_B2BA89C176A9D34247541E04",
    "CAND_B53F29AE234E5061D17AB30C",
    "CAND_D43035DDC47C8F751030FB1F",
    "CAND_D9C314E1E6550EA826182441"
  ],
  "excludedCandidateIds": []
}
```

#### Kanonische Capability-Entwürfe (`payload.canonicalDrafts`)

```json
[
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_1CE53DE1A9FD6BE7DB6A59C8"
      ]
    },
    "evidenceIds": [
      "EVD_DD251A5511E1ECB3ACBB6EBC"
    ],
    "canonicalName": "Real-Time Stream Processing Pipeline Engineering",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Designing and building high-throughput data ingestion and processing pipelines using distributed streaming platforms.",
    "provisionalCapabilityId": "PCAP_1BBB0A30DBB03510C8F1FAEC",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_4B77E04ED420901F69508499"
      ]
    },
    "evidenceIds": [
      "EVD_467CA4AD67E56D17BE2DC1AE"
    ],
    "canonicalName": "Automated Data Quality Validation",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Implementing automated data quality checks to identify and reduce faulty records in data pipelines.",
    "provisionalCapabilityId": "PCAP_390CE312EFF080145E111CAF",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_685647F8AD86BDAF6FBBB34D"
      ]
    },
    "evidenceIds": [
      "EVD_BCFACB211AB66AAD411F5624"
    ],
    "canonicalName": "Retrieval-Augmented Generation System Engineering",
    "primaryDomain": "Artificial Intelligence",
    "structuralDefinition": "Building RAG assistants utilizing large language models, vector search, structured outputs, and citation checks to minimize hallucinations.",
    "provisionalCapabilityId": "PCAP_9D051964E0D5D0D524AEF018",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_6A925D64D403A18273F0F788"
      ]
    },
    "evidenceIds": [
      "EVD_683AC55666F4EE6B0514BED1"
    ],
    "canonicalName": "Knowledge Graph Modeling and Entity Resolution",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Modeling complex relationships as knowledge graphs and implementing entity resolution for deduplication.",
    "provisionalCapabilityId": "PCAP_F288E81D549A09B62DD0C13D",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_94A8E4E6DC568974ACB10C57"
      ]
    },
    "evidenceIds": [
      "EVD_DC25E6D8707BD8996271ED5C"
    ],
    "canonicalName": "Infrastructure Provisioning",
    "primaryDomain": "DevOps",
    "structuralDefinition": "Provisioning and managing infrastructure using infrastructure-as-code tools.",
    "provisionalCapabilityId": "PCAP_2C0CE9274BE156DA3190D66B",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_A05036355EC1DCBC93EB4F71"
      ]
    },
    "evidenceIds": [
      "EVD_5EF9956C8EEEE367296D23A3"
    ],
    "canonicalName": "Time Series Forecasting Modeling",
    "primaryDomain": "Machine Learning",
    "structuralDefinition": "Developing predictive models for time series data using deep learning and gradient boosting frameworks.",
    "provisionalCapabilityId": "PCAP_9B0E2F7D72EE80155E7743F9",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_AC3C31E7D5D79526B47E424B"
      ]
    },
    "evidenceIds": [
      "EVD_ECCE018BD6CBF018F8AB5E23"
    ],
    "canonicalName": "Language Model Fine-Tuning",
    "primaryDomain": "Artificial Intelligence",
    "structuralDefinition": "Fine-tuning small language models using parameter-efficient techniques for specific classification tasks.",
    "provisionalCapabilityId": "PCAP_B3B8B1585F9B41BD407EB4ED",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_B2BA89C176A9D34247541E04"
      ]
    },
    "evidenceIds": [
      "EVD_43F3B8DC0B29B5A8F0FC1B18"
    ],
    "canonicalName": "Machine Learning Pipeline Orchestration",
    "primaryDomain": "MLOps",
    "structuralDefinition": "Running and orchestrating machine learning pipelines on containerized infrastructure.",
    "provisionalCapabilityId": "PCAP_D9AE2F169B7AEB866F159610",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_B53F29AE234E5061D17AB30C"
      ]
    },
    "evidenceIds": [
      "EVD_252D3E87A80A33137F1476E6"
    ],
    "canonicalName": "Data Schema Management and Evolution",
    "primaryDomain": "Data Engineering",
    "structuralDefinition": "Implementing and managing data schemas and backward-compatible evolution using schema registries.",
    "provisionalCapabilityId": "PCAP_D96A28D04E94825A373B3021",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "COMPOSITE",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_D43035DDC47C8F751030FB1F"
      ]
    },
    "evidenceIds": [
      "EVD_B4DDAA940B279F0FBEC3AE34"
    ],
    "canonicalName": "Machine Learning Lifecycle Management",
    "primaryDomain": "MLOps",
    "structuralDefinition": "Setting up experiment tracking, model registries, and lineage tracking for machine learning models.",
    "provisionalCapabilityId": "PCAP_A6720EA603D12D33FC9268B5",
    "semanticDefinitionStatus": "NOT_RUN"
  },
  {
    "scope": "ATOMIC",
    "provenance": {
      "sourceDocumentIds": [
        "DOC_001"
      ],
      "sourceCandidateIds": [
        "CAND_D9C314E1E6550EA826182441"
      ]
    },
    "evidenceIds": [
      "EVD_B3362D06C87161E6905BF986"
    ],
    "canonicalName": "Machine Learning Model Monitoring",
    "primaryDomain": "MLOps",
    "structuralDefinition": "Building monitoring dashboards to detect data and model drift and trigger automated retraining.",
    "provisionalCapabilityId": "PCAP_88B463F4B5D446ADEF46A8B1",
    "semanticDefinitionStatus": "NOT_RUN"
  }
]
```

#### Vorgeschlagene Relationen (`payload.proposedRelations`)

```json
[
  {
    "reason": "Stream processing pipelines frequently utilize schema registries to enforce data contracts and manage evolution.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:26:04.807Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_E74C08D52046D85F64BD55F6",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_1BBB0A30DBB03510C8F1FAEC",
    "targetCapabilityRef": "PCAP_D96A28D04E94825A373B3021"
  },
  {
    "reason": "Data quality validation is applied within data pipelines to ensure the integrity of processed records.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:26:04.807Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_9437DA4D185DF0E8BD6E315D",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_1BBB0A30DBB03510C8F1FAEC",
    "targetCapabilityRef": "PCAP_390CE312EFF080145E111CAF"
  },
  {
    "reason": "Orchestrated ML pipelines integrate with lifecycle management tools to track experiments and register models.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:26:04.807Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_826B39500F3C892D9CB340AE",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_D9AE2F169B7AEB866F159610",
    "targetCapabilityRef": "PCAP_A6720EA603D12D33FC9268B5"
  },
  {
    "reason": "Model monitoring systems detect drift and trigger orchestrated pipelines for automated retraining.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:26:04.807Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_1A38085D5465E0F284BC5D9C",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_88B463F4B5D446ADEF46A8B1",
    "targetCapabilityRef": "PCAP_D9AE2F169B7AEB866F159610"
  },
  {
    "reason": "Time series forecasting models are tracked, versioned, and registered within the ML lifecycle system.",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:26:04.807Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_644B74D8CEB6B6D133400E63",
    "relationType": "RELATED_CAPABILITY",
    "sourceCapabilityRef": "PCAP_9B0E2F7D72EE80155E7743F9",
    "targetCapabilityRef": "PCAP_A6720EA603D12D33FC9268B5"
  },
  {
    "reason": "Both involve large language models but represent distinct AI engineering approaches (retrieval vs. parameter updates).",
    "status": "PROPOSED",
    "createdAt": "2026-10-13T15:26:04.807Z",
    "createdBy": "SEMANTIC_RESOLVER",
    "relationId": "REL_2E2F012E0966F4A691FB814D",
    "relationType": "DISTINCT_CAPABILITY",
    "sourceCapabilityRef": "PCAP_9D051964E0D5D0D524AEF018",
    "targetCapabilityRef": "PCAP_B3B8B1585F9B41BD407EB4ED"
  }
]
```

---

# PART 4 — PROMPT LINEAGE

## 4.1 Aktive Prompt-Versionen und Checksummen

| Stufe | Quelle des Prompttexts | Template / Version | Laufzeit-Identität | Prompt-Checksumme (SHA-256) |
|---|---|---|---|---|
| Legacy Career Analysis | statisch in `lib/career/adapter.ts` | keine Registry | `PC-CONDYN-CAP-v1.0` (Text) | `49ab01d3ed6a6860874c6b393a0bcd7d4b1014bd260653afc0cbce760de3e68b` (System-Prompt, hier berechnet, zur Laufzeit nicht gespeichert) |
| Capability Discovery | Registry-Kernel aus `kernel-bootstrap.ts` | `tpl_capability-discovery-v1` / `ver_capability-discovery-v1_v1` | `discovery-v1` | `5a79a8798521b21959281f7e665d99de8084a7eda65cf55176f913fbba41b882` (gespeichert) |
| Capability Convergence | Registry-Kernel aus `kernel-bootstrap.ts` | `tpl_capability-convergence-v1` / `ver_capability-convergence-v1_v1` | `convergence-v1` | `14a2c552dffac5bd0623ed97ec541833ad04bf44e785d80bcb672a5488b26f84` (gespeichert) |
| (nicht ausgeführt) Deep Sweep | `lib/career/prompts/system.ts` | `tpl_capability-deep-sweep` / `ver_capability-deep-sweep_v1` | — | `98f479ebc105cd64b14794f804ead5785856f948443f8b0f48f13cede129cfad` |

Der `PROMPT_ENCRYPTION_KEY` wird bei jedem Worker-Start neu erzeugt und ist nicht Teil dieses Dokuments. Klartext und Checksumme der Kernel hängen nicht von ihm ab.

## 4.2 Tatsächlich ausgeführte Reihenfolge (persistierte Zeitstempel)

| Analyse | Job angelegt | Job gestartet | Discovery abgeschlossen | Convergence abgeschlossen | Legacy-Analyse gespeichert | Job abgeschlossen | Versuche |
|---|---|---|---|---|---|---|---|
| A1 | 2026-10-13T15:21:51.180Z | 2026-10-13T15:21:51.874Z | 2026-10-13T15:22:27.971Z | 2026-10-13T15:22:54.100Z | 2026-10-13T15:23:32.882Z | 2026-10-13T15:23:32.908Z | 1 |
| A2 | 2026-10-13T15:24:59.818Z | 2026-10-13T15:25:01.115Z | 2026-10-13T15:25:32.798Z | 2026-10-13T15:26:04.807Z | 2026-10-13T15:26:49.281Z | 2026-10-13T15:26:49.304Z | 1 |

## 4.3 Verwendete synthetische Testanalysen: Eingaben

### 4.3.1 A1 — ENGINEERING-Lebenslauf

PDF im Repository: `docs/examples/cv.synthetic.pdf`. SHA-256 des Base64-Inhalts im Job = SHA-256 von `base64 -w0` dieser Datei (geprüft).
Job-Datensatz: Das Base64-PDF ist durch Länge und Hash ersetzt, weil es in keinen Prompt eingeht; in die Prompts geht nur der extrahierte Text.

```json
{
  "job_id": "JOB_1791904911180_388",
  "status": "SUCCEEDED",
  "attempt_count": 1,
  "created_at": "2026-10-13T15:21:51.180Z",
  "started_at": "2026-10-13T15:21:51.874Z",
  "completed_at": "2026-10-13T15:23:32.908Z",
  "result_analysis_id": "ANL_1791904911180_388",
  "input_ref": {
    "sourceData": {
      "documents": [
        {
          "type": "pdf",
          "docId": "doc_pdf_1791904892680",
          "title": "cv.synthetic.pdf",
          "content": "<base64 PDF, 4812 chars, sha256 8e621abd8c9523571406284bfeff69b33e542c05027f947c2ba3d895708c0aa1>"
        }
      ]
    },
    "sourceType": "BATCH"
  }
}
```

Candidate Source Bundle `CSB_JOB_1791904911180_388` (ORIGINAL, enthält den vollständigen extrahierten Quelltext):

```json
{
  "candidate_source_bundle_id": "CSB_JOB_1791904911180_388",
  "source_bundle_hash": "5a1998013aa063db166328b4c94ffb630a36e9913a465500fa9cba53fe6c637d",
  "payload": {
    "createdAt": "2026-10-13T15:21:51.180Z",
    "documents": [
      {
        "docId": "DOC_001",
        "title": "cv.synthetic.pdf",
        "metadata": {
          "loadedAt": "2026-10-13T15:21:51.180Z",
          "sourceKind": "PDF",
          "contentHash": "3cde24511c9eb0ebe5568c10147f01a17178f13dbda39af1e70a4aaf480a5e34",
          "sourceTitle": "cv.synthetic.pdf"
        },
        "normalizedText": "Alex Example — Curriculum Vitae\nSynthetic test profile for the CONDYN manual workflow. Not a real person.\nProfile\nSenior software engineer with eight years of experience building web platforms and data pipelines\nin logistics. Focus on TypeScript, React and Node.js, relational databases and automated testing.\nExperience\nSenior Software Engineer, Nordwind Logistics GmbH, Hamburg — 2020 to 2026\n• Built the customer billing platform in TypeScript and Node.js with Express; migrated 40 services to\nstrict TypeScript.\n• Implemented the React dashboard used by 300 dispatchers, including accessibility fixes against\nWCAG 2.1.\n• Designed the PostgreSQL schema for orders and invoices and wrote complex SQL reporting\nqueries.\n• Introduced test-driven development with Jest and raised unit test coverage from 35% to 80%.\n• Set up CI/CD pipelines with GitHub Actions and built Docker images for every service.\n• Led a team of four engineers and ran the weekly architecture review.\nSoftware Developer, Datenwerk AG, Berlin — 2017 to 2020\n• Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse.\n• Modelled the dimensional data model for monthly carrier reports.\n• Deployed services to a Kubernetes test cluster and maintained Linux build agents.\n\n-- 1 of 2 --\n\nEducation\nB.Sc. Computer Science, Technische Universität Berlin, 2017. Thesis: event stream processing for\nparcel tracking.\nSkills\nTypeScript, JavaScript, React, Node.js, Express, PostgreSQL, SQL, Python, Apache Kafka,\nDocker, GitHub Actions, Jest, Kubernetes (basic), Linux.\nLanguages\nGerman (native), English (C1).\nCertifications\nNone listed.\n\n-- 2 of 2 --",
        "rawContentHash": "3cde24511c9eb0ebe5568c10147f01a17178f13dbda39af1e70a4aaf480a5e34",
        "normalizedTextHash": "3cde24511c9eb0ebe5568c10147f01a17178f13dbda39af1e70a4aaf480a5e34"
      }
    ],
    "schemaVersion": "CANDIDATE_SOURCE_BUNDLE_V1",
    "sourceBundleHash": "5a1998013aa063db166328b4c94ffb630a36e9913a465500fa9cba53fe6c637d",
    "candidateSourceBundleId": "CSB_JOB_1791904911180_388"
  }
}
```

Projektionsreferenz Analyse ⇄ Discovery ⇄ Convergence:

```json
{
  "analysis_id": "ANL_1791904911180_388",
  "job_id": "JOB_1791904911180_388",
  "discovery_run_id": "RUN_AD78E73E4C84D315317E8156",
  "convergence_run_id": "CONV_9029DF3D5ECD901B04CD95FD",
  "candidate_source_bundle_id": "CSB_JOB_1791904911180_388",
  "source_bundle_hash": "5a1998013aa063db166328b4c94ffb630a36e9913a465500fa9cba53fe6c637d",
  "created_at": "2026-10-13T15:22:54.100Z"
}
```

### 4.3.2 A2 — AI-&-DATA-Lebenslauf

PDF im Repository: `docs/career_analysis/evidence/job-pool/e2e-sweep-2026-10-13/testdata/cv-ai-data.synthetic.pdf`. SHA-256 des Base64-Inhalts im Job = SHA-256 von `base64 -w0` dieser Datei (geprüft).
Job-Datensatz: Das Base64-PDF ist durch Länge und Hash ersetzt, weil es in keinen Prompt eingeht; in die Prompts geht nur der extrahierte Text.

```json
{
  "job_id": "JOB_1791905099818_748",
  "status": "SUCCEEDED",
  "attempt_count": 1,
  "created_at": "2026-10-13T15:24:59.818Z",
  "started_at": "2026-10-13T15:25:01.115Z",
  "completed_at": "2026-10-13T15:26:49.304Z",
  "result_analysis_id": "ANL_1791905099818_748",
  "input_ref": {
    "sourceData": {
      "documents": [
        {
          "type": "pdf",
          "docId": "doc_pdf_1791905096690",
          "title": "cv-ai-data.synthetic.pdf",
          "content": "<base64 PDF, 43492 chars, sha256 4c194d282e431d47b488bb325b425d18a9e73142a00c0314717abd031101cf57>"
        }
      ]
    },
    "sourceType": "BATCH"
  }
}
```

Candidate Source Bundle `CSB_JOB_1791905099818_748` (ORIGINAL, enthält den vollständigen extrahierten Quelltext):

```json
{
  "candidate_source_bundle_id": "CSB_JOB_1791905099818_748",
  "source_bundle_hash": "246cd6ea00c5c7276fc56e80f9cfe3dd9da1ef07dff970321aed31f5521193cd",
  "payload": {
    "createdAt": "2026-10-13T15:24:59.818Z",
    "documents": [
      {
        "docId": "DOC_001",
        "title": "cv-ai-data.synthetic.pdf",
        "metadata": {
          "loadedAt": "2026-10-13T15:24:59.818Z",
          "sourceKind": "PDF",
          "contentHash": "27c81360539346ef5154dcc10725732a9c69f0fde72f77193bde1cb49fbc39f3",
          "sourceTitle": "cv-ai-data.synthetic.pdf"
        },
        "normalizedText": "Mira Feldmann — Curriculum Vitae\nSynthetic test profile for the CONDYN end-to-end test. Not a real person.\nProfile\nData and machine learning engineer with seven years of experience in streaming data platforms, MLOps and\napplied large language model systems in the energy sector. Focus on Python, Apache Kafka, Apache Flink,\nKubernetes and retrieval-augmented generation.\nExperience\nSenior Data Engineer, Stromnetz Nord Analytics GmbH, Bremen — 2021 to 2026\nBuilt real-time stream processing pipelines with Apache Kafka and Apache Flink that ingest 40,000\nsmart meter readings per second.\nIntroduced Avro schemas with a schema registry and managed backward-compatible schema evolution\nacross 25 topics.\nImplemented data quality checks with Great Expectations and reduced faulty billing records by 60%.\nSet up MLflow for experiment tracking and a model registry with lineage for 12 forecasting models.\nRan ML pipelines on Kubernetes with Argo Workflows and provisioned the infrastructure with Terraform.\nBuilt model monitoring dashboards that detect drift in load forecasts and trigger retraining.\nMachine Learning Engineer, Wattwerk AI GmbH, Hamburg — 2019 to 2021\nDeveloped time series forecasting models for grid load in Python with PyTorch and LightGBM.\nBuilt a retrieval-augmented generation assistant over 8,000 technical maintenance documents with an\nLLM, vector search and structured JSON output; reduced hallucinated answers through citation checks.\nFine-tuned a small language model with LoRA for classifying maintenance tickets.\nModelled asset relationships as a knowledge graph in Neo4j and implemented entity resolution for\nduplicate equipment records.\nEducation\nM.Sc. Data Science, Universität Hamburg, 2019. Thesis: probabilistic load forecasting.\nSkills\nPython, SQL, Apache Kafka, Apache Flink, Avro, Great Expectations, MLflow, Argo Workflows, Kubernetes,\nTerraform, Docker, PyTorch, LightGBM, Neo4j, LangChain, vector databases.\nLanguages\nGerman (native), English (C1).\nCertifications\nCertified Kubernetes Application Developer (CKAD), 2022.\n\n-- 1 of 1 --",
        "rawContentHash": "27c81360539346ef5154dcc10725732a9c69f0fde72f77193bde1cb49fbc39f3",
        "normalizedTextHash": "27c81360539346ef5154dcc10725732a9c69f0fde72f77193bde1cb49fbc39f3"
      }
    ],
    "schemaVersion": "CANDIDATE_SOURCE_BUNDLE_V1",
    "sourceBundleHash": "246cd6ea00c5c7276fc56e80f9cfe3dd9da1ef07dff970321aed31f5521193cd",
    "candidateSourceBundleId": "CSB_JOB_1791905099818_748"
  }
}
```

Projektionsreferenz Analyse ⇄ Discovery ⇄ Convergence:

```json
{
  "analysis_id": "ANL_1791905099818_748",
  "job_id": "JOB_1791905099818_748",
  "discovery_run_id": "RUN_640B00F97E1A1476178527E4",
  "convergence_run_id": "CONV_E66D9CFFAC0EF1F52B36052E",
  "candidate_source_bundle_id": "CSB_JOB_1791905099818_748",
  "source_bundle_hash": "246cd6ea00c5c7276fc56e80f9cfe3dd9da1ef07dff970321aed31f5521193cd",
  "created_at": "2026-10-13T15:26:04.807Z"
}
```

## 4.4 Kennzeichnung Original / Rekonstruktion

| Bestandteil | Status |
|---|---|
| System-Prompts (alle drei Stufen) | RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS |
| User-Prompts (alle drei Stufen, A1 und A2) | RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS |
| Response-Schemas (alle drei Stufen) | RECONSTRUCTED FROM VERIFIED RUNTIME COMPONENTS (deterministisch aus dem Code erzeugt) |
| Laufzeitparameter | Code des Commits `0a8a57d` und Worker-Log; Modell für Discovery und Convergence persistiert, für Legacy aus dem Log abgeleitet |
| Legacy-Ausgabe | RAW RESPONSE NOT AVAILABLE; kanonische Analyse ORIGINAL |
| Discovery-Ausgabe | RAW RESPONSE NOT AVAILABLE; geparstes Modellobjekt, Kandidaten und Coverage Audit ORIGINAL |
| Convergence-Ausgabe | RAW RESPONSE NOT AVAILABLE; geparstes Modellobjekt, Entwürfe, Relationen und Audit ORIGINAL |
| Quelltexte, Jobs, Bundles, Referenzen | ORIGINAL |

## 4.5 Verifikation der Rekonstruktion

Jede Zeile wurde gegen die Wegwerf-Datenbank `condyn_test_0d1a8d08dcf3ada4` geprüft, nur lesend:

| Prüfung | A1 | A2 |
|---|---|---|
| PDF lokal neu extrahiert → Source-Bundle-Hash = gespeichertes Bundle | ✅ | ✅ |
| PDF lokal neu extrahiert → Source-Bundle-Hash = `sourceBundleHash` des Discovery-Runs | ✅ | ✅ |
| Extrahierter Text = gespeicherter `normalizedText` | ✅ | ✅ |
| Legacy-Dokumentinhalt = Discovery-Quelltext | ✅ | ✅ |
| Discovery-Kernel-Checksumme = gespeicherte `prompt.checksum` | ✅ | ✅ |
| Discovery-Run-ID aus Quell-Hash, Checksumme und Modell nachgerechnet = gespeicherte Run-ID | ✅ | ✅ |
| Hash des gespeicherten `kernelOutput` = `rawOutputHash` | ✅ | ✅ |
| Convergence-Kernel-Checksumme = gespeicherte `prompt.checksum` | ✅ | ✅ |
| Convergence-Run-ID nachgerechnet = gespeicherte Run-ID | ✅ | ✅ |
| Hash des gespeicherten `convergenceOutput` = `rawOutputHash` | ✅ | ✅ |
| Kandidaten im User-Prompt = gespeicherte `eligibleCandidateIds` | ✅ | ✅ |

Die Discovery-Run-ID bindet den Kernel-Text über die Checksumme sowie den Quelltext und das Modell. Die Convergence-Run-ID bindet zusätzlich den Discovery-Output. Weil beide IDs exakt reproduziert sind, sind Kernel, Quelltext und Modell dieser Stufen nachweislich die der echten Läufe.
Die Legacy-Stufe hat keine solche Bindung. Ihr Prompt ist durch den unveränderten Code (Worktree sauber auf `0a8a57d`, auf dem der Worker lief) und den hash-geprüften Quelltext rekonstruiert.

## 4.6 Nicht rekonstruierbare Bestandteile

- **Rohtexte:** die rohen Gemini-Antworttexte aller drei Stufen (Leerraum, Schlüsselreihenfolge; bei Legacy auch der Inhalt vor `processLlmOutput`).
- **Legacy-Telemetrie:** Tokenzahlen (Eingabe und Ausgabe), `finishReason`, Zahl der strukturierten Neuversuche und Latenz je Versuch. `lastTelemetry` existiert nur im Prozessspeicher.
- **Discovery/Convergence:** Tokenzahlen, `finishReason` (zwingend `STOP`, sonst wäre der Lauf gescheitert) und die genaue Latenz je Aufruf (nur aus den Zeitstempeln in 4.2 eingrenzbar).
- **Serverseitig:** Antwort-Metadaten wie `modelVersion`, `responseId` und Safety-Ratings werden nicht gespeichert.
- **Verschlüsselung:** der damals verwendete `PROMPT_ENCRYPTION_KEY` und der damalige Chiffretext der Kernel; beide wurden nach Worker-Ende verworfen und sind für den Klartext ohne Bedeutung.

---

# ANHANG A — Prompt-Registry „Deep Sweep“ (vorhanden, zur Laufzeit NICHT ausgeführt)

Quelle: `CANONICAL_DEEP_SWEEP_PROMPTS` in `lib/career/prompts/system.ts`. Die Texte werden nur über `seedPromptSystem` in eine Registry geschrieben und nur mit einem `promptResolver` vor den Legacy-System-Prompt gesetzt. Beides geschieht im Worker-Pfad nicht.

## capability-deep-sweep — Capability Deep Sweep Extraction Prompt

Domain `career_analysis` · Beschreibung: Exhaustive extraction of technical capabilities, domain proficiency, confidence, and concrete evidence pointers. · SHA-256 `98f479ebc105cd64b14794f804ead5785856f948443f8b0f48f13cede129cfad`

```
You are an expert systems & career ontology extractor for the CONDYN Career Analysis Protocol v1.0.
Analyze the provided career documents and extract an exhaustive list of capabilities.
For each capability, reconstruct:
- Canonical capability name
- Primary domain classification
- Proficiency level (L1 to L6)
- Confidence score strictly normalized to [0.0, 1.0]
- Direct evidence text citation from source document.
```

## organization-deep-sweep — Organization Deep Sweep Extraction Prompt

Domain `career_analysis` · Beschreibung: Reconstruction of organizational scale, industry classification, enterprise hierarchy, and affiliations. · SHA-256 `f81edeccdace67cb2dc0b9e97375558937f868a29435204d8043c6caff4787cb`

```
Analyze the provided career documents and reconstruct all organizational affiliations.
For each organization identify:
- Canonical organization name
- Industry focus & market sector
- Scale & operational footprint
- Institutional role & strategic relationship.
```

## role-deep-sweep — Role Deep Sweep Extraction Prompt

Domain `career_analysis` · Beschreibung: Extraction of explicit and implicit career roles, seniority levels, tenure, and structural impact. · SHA-256 `ec39b88a66f19becd1c271ba6bff341040bfa31db37d2aaf04dd0da2f802049d`

```
Analyze the provided career documents and reconstruct all professional roles and appointments.
For each role identify:
- Formal job title & seniority level
- Associated organization ID
- Domain focus & architectural scope
- Primary impact & system deliverables.
```

## opportunity-deep-sweep — Opportunity Deep Sweep Analysis Prompt

Domain `career_analysis` · Beschreibung: Identification of latent growth vectors, adjacent technical domains, and career expansion opportunities. · SHA-256 `8bd736ccdd6cd54ce8fa7c9d89ab286cc0b1ba3028e83355dab56c7ace337cc9`

```
Analyze the canonical career graph and identify latent technical & leadership opportunities.
Synthesize actionable career opportunities based on capability adjacency and high-resonance industrial domains.
```

## strategy-deep-sweep — Strategy Deep Sweep Positioning Prompt

Domain `career_analysis` · Beschreibung: Formulation of long-term career positioning and strategic capability investment priorities. · SHA-256 `baa73debd4117e827045a30398c572cc78cdfaa40ccf077e284c2799a37390de`

```
Formulate a coherent career strategy based on current capability density and organizational trajectory.
Highlight high-leverage capabilities requiring consolidation or expansion.
```

## search-query-generation — Search Query Generation Prompt

Domain `career_analysis` · Beschreibung: Synthesis of high-intent search queries targeting specific industry pool roles and organizations. · SHA-256 `61f496f8aea9a9f4ab38007400e4abeaeb2a0d3d4d3468e51b3435379075b9bc`

```
Generate targeted search queries designed to match the candidate against controlled industrial company pools.
Output queries ranked by resonance priority.
```

## recommendation-generation — Recommendation Generation Prompt

Domain `career_analysis` · Beschreibung: Synthesis of explainable career recommendations based on capability gaps and pool requirements. · SHA-256 `cbc0ea4d677e88ac150a106777404db9614ef71fea3292c5d0a34b0b31a09b13`

```
Analyze missing capabilities from company pool role matching and generate concrete action recommendations.
Explain why each recommendation increases candidate resonance.
```

---

# ANHANG B — Reproduktion der Extraktion

- **Werkzeug:** Skripte im Session-Scratchpad (`prompts/ro.ts`, `prompts/extract.ts`, `prompts/render.py`).
- **Ablauf:** Die echten Builder des E2E-Worktrees `condyn-admin-e2e` (Commit `0a8a57d`) werden mit den persistierten Eingaben aufgerufen. Die Datenbank wird in einer `READ ONLY`-Transaktion gelesen. Für den Kernel-Bootstrap dient ein frischer Wegwerf-Schlüssel.
- **Ausgeschlossen:** kein Netzwerkaufruf an Gemini.
