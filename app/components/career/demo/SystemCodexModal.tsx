"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";

export interface SystemCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLang?: "de" | "en";
}

/**
 * CONDYN / SYNTX — System Codex & Complete Operating Manual (DE/EN)
 * Comprehensive manual explaining the Decision Operating System, 6 Orbits, Semantic Zoom, and 5 Trust Questions.
 */
export function SystemCodexModal({
  isOpen,
  onClose,
  initialLang = "de"
}: SystemCodexModalProps) {
  const [lang, setLang] = useState<"de" | "en">(initialLang);
  const [activeChapter, setActiveChapter] = useState<number>(0);

  if (!isOpen) return null;

  const content = {
    de: {
      title: "CONDYN / SYNTX — SYSTEM CODEX & BEDIENHANDBUCH",
      subtitle: "DAS WISSENSCHAFTLICHE ENTSCHEIDUNGSINSTRUMENT",
      close: "SCHLIESSEN",
      chapters: [
        {
          id: "what-is-condyn",
          title: "1. WAS IST CONDYN?",
          body: (
            <div>
              <p>
                <strong>CONDYN / SYNTX</strong> ist kein herkömmliches Dashboard und kein Black-Box-Algorithmus. Es ist ein <strong>wissenschaftliches Entscheidungs-Betriebssystem (Decision Operating System)</strong>, das unstrukturierte Quellen (z. B. PDFs, GitHub-Repositories, Webseiten) in einen mathematisch verifizierbaren Graphen überführt.
              </p>
              <p>
                Ziel ist es, berufliche und strategische Entscheidungen nicht auf Meinungen, sondern auf lückenlos nachvollziehbaren Beweisketten zu gründen.
              </p>
            </div>
          )
        },
        {
          id: "laws-and-invariants",
          title: "2. DIE 2 GRUNDGESETZE & 8 INVARIANTS",
          body: (
            <div>
              <p>Jede Berechnung in CONDYN unterliegt zwei unumstößlichen Grundgesetzen:</p>
              <ul>
                <li><strong>Law 1:</strong> <em>Everything is evidence until it becomes a decision.</em> (Alles ist Beweis, bis es zur Entscheidung wird.)</li>
                <li><strong>Law 2:</strong> <em>Nothing becomes knowledge until it has survived validation.</em> (Nichts wird Wissen, ohne die Validierung zu bestehen.)</li>
              </ul>
              <p>Darüber hinaus sichern <strong>8 Canonical Invariants</strong> die Plattform ab, u. a. dass die Benutzeroberfläche niemals selbst Graphtraversierungen berechnet und jede Empfehlung bis zur Rohdatei zurückverfolgbar ist.</p>
            </div>
          )
        },
        {
          id: "identity-core-and-orbits",
          title: "3. DER IDENTITY CORE & DIE 6 ORBITS",
          body: (
            <div>
              <p>Im Zentrum des Planetariums steht der <strong>Identity Core</strong> (der unverfälschte Identitätskern aus Ihren Quellen). Um ihn kreisen 6 Resonanz-Orbits:</p>
              <ul>
                <li><strong>01 IDENTITY CORE:</strong> Rohvermessung Ihrer professionellen Identität.</li>
                <li><strong>02 CAPABILITY FIELD:</strong> Verifizierte Fähigkeiten und Cluster.</li>
                <li><strong>03 RESONANCE ORBITS:</strong> Schnittmengen mit Organisationen und Marktsegmenten.</li>
                <li><strong>04 ROLE MANIFESTATION:</strong> Konkrete Rollen und Positionen.</li>
                <li><strong>05 TENSION FIELD:</strong> Lückenanalyse, fehlende Evidenzen und Reibungspunkte.</li>
                <li><strong>06 EVOLUTION PATHS:</strong> Optimierungspfade für maximalen Fit.</li>
              </ul>
            </div>
          )
        },
        {
          id: "semantic-zoom",
          title: "4. SEMANTISCHER ZOOM L0–L4",
          body: (
            <div>
              <p>Die Oberfläche erlaubt es, stufenlos zwischen Abstraktion und Grundwahrheit zu navigieren:</p>
              <ul>
                <li><strong>L0 PLANETARIUM:</strong> Makro-Überblick über alle 6 Orbits.</li>
                <li><strong>L1 CLUSTER:</strong> Aggregierte Themencluster und Passungswerte (z. B. 98%).</li>
                <li><strong>L2 EVIDENCE:</strong> Verifizierte Beweiskarten mit Quellenangabe.</li>
                <li><strong>L3 SOURCE:</strong> Metadaten der eingespeisten Quelle.</li>
                <li><strong>L4 ORIGINAL:</strong> Exakte Zeilennummern oder Zitate aus dem Originaldokument.</li>
              </ul>
            </div>
          )
        },
        {
          id: "decision-graph-states",
          title: "5. DECISION GRAPH: SUPPORTED & BLOCKED",
          body: (
            <div>
              <p>Im <strong>Decision Graph Inspector</strong> hat jede Entscheidung einen klaren Zustand:</p>
              <ul>
                <li><strong style={{ color: "#38e5ff" }}>SUPPORTED:</strong> Die Anforderung wird durch starke Evidenz untermauert.</li>
                <li><strong style={{ color: "#ff5555" }}>BLOCKED:</strong> Es fehlt an Evidenz (MISSING EVIDENCE) oder die Quellenkonfidenz ist zu niedrig (WEAK EVIDENCE).</li>
              </ul>
            </div>
          )
        },
        {
          id: "ontology",
          title: "6. ONTOLOGIE: KNOTEN & KANTEN",
          body: (
            <div>
              <p>Der gerichtete Evidenzgraph verbindet 6 Knotentypen in einer klaren Hierarchie:</p>
              <p><code>Source ━━━━▶ Evidence ━━━━▶ Capability ━━━━▶ Requirement ━━━━▶ Job ━━━━▶ Organisation</code></p>
            </div>
          )
        },
        {
          id: "trust-questions",
          title: "7. DIE 5 TRUST-FRAGEN",
          body: (
            <div>
              <p>CONDYN beantwortet für jede Aussage 5 fundamentale Vertrauensfragen:</p>
              <ol>
                <li><strong>Woher stammt diese Aussage?</strong> (Quellen-Zitat im Inspector).</li>
                <li><strong>Warum wurde diese Entscheidung getroffen?</strong> (Erklärbare Beweiskette).</li>
                <li><strong>Warum fehlt etwas?</strong> (Diagnose bei BLOCKED).</li>
                <li><strong>Wie sicher ist das System?</strong> (Konfidenz-Tokens wie #38e5ff).</li>
                <li><strong>Wie kann ich das Ergebnis verbessern?</strong> (Wissen im SourceDock nachladen).</li>
              </ol>
            </div>
          )
        },
        {
          id: "step-by-step",
          title: "8. SCHRITT-FÜR-SCHRITT BEDIENUNG",
          body: (
            <div>
              <p>So nutzen Sie CONDYN in unter 30 Sekunden:</p>
              <ol>
                <li><strong>Wissen einspeisen:</strong> Links im SourceDock ein PDF, GitHub-Repo oder Text hinzufügen.</li>
                <li><strong>Analyse starten:</strong> Auf <em>ANALYSE STARTEN</em> klicken.</li>
                <li><strong>Orbits erkunden:</strong> Einen Orbit im Planetarium anklicken, um in L1/L2 einzutauchen.</li>
                <li><strong>Beweise prüfen:</strong> Im Inspector rechts unten die exakten Quellen und die 5 Trust-Fragen nachverfolgen.</li>
              </ol>
            </div>
          )
        }
      ]
    },
    en: {
      title: "CONDYN / SYNTX — SYSTEM CODEX & OPERATING MANUAL",
      subtitle: "THE SCIENTIFIC DECISION INSTRUMENT",
      close: "CLOSE",
      chapters: [
        {
          id: "what-is-condyn",
          title: "1. WHAT IS CONDYN?",
          body: (
            <div>
              <p>
                <strong>CONDYN / SYNTX</strong> is not a generic dashboard or a black-box algorithm. It is a <strong>scientific Decision Operating System</strong> that transforms unstructured sources (PDFs, GitHub repositories, websites) into a mathematically verifiable directed graph.
              </p>
              <p>
                Its mission is to ground high-stakes decisions on transparent, traceable evidence chains rather than intuition or abstraction.
              </p>
            </div>
          )
        },
        {
          id: "laws-and-invariants",
          title: "2. THE 2 CORE LAWS & 8 INVARIANTS",
          body: (
            <div>
              <p>Every operation in CONDYN obeys two immutable laws:</p>
              <ul>
                <li><strong>Law 1:</strong> <em>Everything is evidence until it becomes a decision.</em></li>
                <li><strong>Law 2:</strong> <em>Nothing becomes knowledge until it has survived validation.</em></li>
              </ul>
              <p>Additionally, <strong>8 Canonical Invariants</strong> guarantee that the UI never traverses the graph itself and that every recommendation traces back to exact source excerpts.</p>
            </div>
          )
        },
        {
          id: "identity-core-and-orbits",
          title: "3. IDENTITY CORE & THE 6 ORBITS",
          body: (
            <div>
              <p>At the center of the Planetarium sits the <strong>Identity Core</strong>. Orbiting around it are 6 semantic resonance fields:</p>
              <ul>
                <li><strong>01 IDENTITY CORE:</strong> Raw measurement of professional identity.</li>
                <li><strong>02 CAPABILITY FIELD:</strong> Verified capability clusters.</li>
                <li><strong>03 RESONANCE ORBITS:</strong> Intersections with organizations and market domains.</li>
                <li><strong>04 ROLE MANIFESTATION:</strong> Concrete roles and positions.</li>
                <li><strong>05 TENSION FIELD:</strong> Missing capabilities and diagnostic friction.</li>
                <li><strong>06 EVOLUTION PATHS:</strong> Actionable pathways to elevate fit.</li>
              </ul>
            </div>
          )
        },
        {
          id: "semantic-zoom",
          title: "4. SEMANTIC ZOOM L0–L4",
          body: (
            <div>
              <p>The interface lets you zoom seamlessly from macro synthesis to raw truth:</p>
              <ul>
                <li><strong>L0 PLANETARIUM:</strong> Full planetary field view.</li>
                <li><strong>L1 CLUSTER:</strong> Aggregated clusters and fit scores (e.g., 98%).</li>
                <li><strong>L2 EVIDENCE:</strong> Grounded evidence cards with excerpts.</li>
                <li><strong>L3 SOURCE:</strong> Source document metadata.</li>
                <li><strong>L4 ORIGINAL:</strong> Exact lines of code or PDF text passages.</li>
              </ul>
            </div>
          )
        },
        {
          id: "decision-graph-states",
          title: "5. DECISION GRAPH: SUPPORTED & BLOCKED",
          body: (
            <div>
              <p>In the <strong>Decision Graph Inspector</strong>, every decision node has an audit state:</p>
              <ul>
                <li><strong style={{ color: "#38e5ff" }}>SUPPORTED:</strong> Fully backed by verified evidence and high confidence.</li>
                <li><strong style={{ color: "#ff5555" }}>BLOCKED:</strong> Missing evidence or low source weight triggers explicit blockage diagnosis.</li>
              </ul>
            </div>
          )
        },
        {
          id: "ontology",
          title: "6. ONTOLOGY: NODES & EDGES",
          body: (
            <div>
              <p>The Directed Evidence Graph connects 6 node types in rigorous causal order:</p>
              <p><code>Source ━━━━▶ Evidence ━━━━▶ Capability ━━━━▶ Requirement ━━━━▶ Job ━━━━▶ Organisation</code></p>
            </div>
          )
        },
        {
          id: "trust-questions",
          title: "7. THE 5 TRUST QUESTIONS",
          body: (
            <div>
              <p>CONDYN answers 5 foundational trust questions for every decision:</p>
              <ol>
                <li><strong>Where does this statement originate?</strong> (Source citation & excerpt).</li>
                <li><strong>Why was this decision made?</strong> (Explainable chain & score).</li>
                <li><strong>Why is something blocked?</strong> (MISSING / WEAK evidence diagnosis).</li>
                <li><strong>How confident is the system?</strong> (Deterministic tokens & physics).</li>
                <li><strong>How can I improve the result?</strong> (Actionable ingestion trigger).</li>
              </ol>
            </div>
          )
        },
        {
          id: "step-by-step",
          title: "8. STEP-BY-STEP OPERATING GUIDE",
          body: (
            <div>
              <p>How to operate CONDYN in under 30 seconds:</p>
              <ol>
                <li><strong>Ingest Knowledge:</strong> Add a PDF, GitHub repo, or text in the left SourceDock.</li>
                <li><strong>Run Analysis:</strong> Click <em>START ANALYSIS</em>.</li>
                <li><strong>Explore Orbits:</strong> Click any orbit in the Planetarium to enter L1/L2 zoom.</li>
                <li><strong>Inspect Traceability:</strong> View the bottom-right Inspector to inspect grounded proof chains.</li>
              </ol>
            </div>
          )
        }
      ]
    }
  };

  const t = content[lang];
  const currentChapter = t.chapters[activeChapter] || t.chapters[0];

  return (
    <div
      data-testid="system-codex-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "rgba(6, 10, 16, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
      onClick={onClose}
    >
      <div
        data-testid="system-codex-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "920px",
          maxWidth: "95vw",
          maxHeight: "88vh",
          backgroundColor: SIL_TOKENS.colors.surface,
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          borderRadius: "16px",
          boxShadow: `0 0 32px rgba(56, 229, 255, 0.28)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: SIL_TOKENS.typography.mono,
          color: SIL_TOKENS.colors.textPrimary
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(8, 14, 22, 0.95)"
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "14px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
              {t.title}
            </h2>
            <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.textMuted, marginTop: "2px" }}>
              {t.subtitle}
            </div>
          </div>

          {/* Bilingual Switcher + Close Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              data-testid="bilingual-switcher"
              style={{
                display: "flex",
                backgroundColor: "rgba(3, 6, 10, 0.8)",
                border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "6px",
                overflow: "hidden"
              }}
            >
              <button
                data-testid="switch-lang-de"
                onClick={() => setLang("de")}
                style={{
                  padding: "5px 10px",
                  backgroundColor: lang === "de" ? SIL_TOKENS.colors.cyanActive : "transparent",
                  color: lang === "de" ? "#060a10" : SIL_TOKENS.colors.textPrimary,
                  border: "none",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🇩🇪 DEUTSCH
              </button>
              <button
                data-testid="switch-lang-en"
                onClick={() => setLang("en")}
                style={{
                  padding: "5px 10px",
                  backgroundColor: lang === "en" ? SIL_TOKENS.colors.cyanActive : "transparent",
                  color: lang === "en" ? "#060a10" : SIL_TOKENS.colors.textPrimary,
                  border: "none",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🇬🇧 ENGLISH
              </button>
            </div>

            <button
              data-testid="system-codex-close"
              onClick={onClose}
              style={{
                padding: "6px 14px",
                backgroundColor: "transparent",
                border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                borderRadius: "6px",
                color: SIL_TOKENS.colors.cyanActive,
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              ✕ {t.close}
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Chapters + Chapter Detail */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Chapter Navigation Sidebar */}
          <div
            style={{
              width: "260px",
              borderRight: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              backgroundColor: "rgba(4, 8, 14, 0.7)"
            }}
          >
            {t.chapters.map((ch, idx) => {
              const isSelected = activeChapter === idx;
              return (
                <button
                  key={ch.id}
                  data-testid={`codex-chapter-${ch.id}`}
                  onClick={() => setActiveChapter(idx)}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    backgroundColor: isSelected ? "rgba(56, 229, 255, 0.15)" : "transparent",
                    border: isSelected
                      ? `1px solid ${SIL_TOKENS.colors.cyanActive}`
                      : `1px solid transparent`,
                    borderRadius: "6px",
                    color: isSelected ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textPrimary,
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {ch.title}
                </button>
              );
            })}
          </div>

          {/* Chapter Main Content Area */}
          <div
            style={{
              flex: 1,
              padding: "24px 32px",
              overflowY: "auto",
              lineHeight: 1.6,
              fontSize: "12px"
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "16px", color: SIL_TOKENS.colors.cyanActive }}>
              {currentChapter.title}
            </h3>
            <div data-testid="codex-chapter-content" style={{ marginTop: "16px" }}>
              {currentChapter.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
