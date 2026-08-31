export type SilLocale = "en" | "de";
export type SilOrbitStageId = "01" | "02" | "03" | "04" | "05" | "06";

type SilOrbitCopy = {
  name: string;
  subtitle: string;
};

type SilEmptyStateCopy = {
  title: string;
  reason: string;
};

export const SIL_COPY = {
  defaultLocale: "en" as SilLocale,

  en: {
    emptyFieldLabel: "EMPTY FIELD // EXPLAINED",

    orbits: {
      "01": {
        name: "IDENTITY CORE",
        subtitle: "Unaltered identity core"
      },
      "02": {
        name: "CAPABILITY FIELD",
        subtitle: "Semantic capability core"
      },
      "03": {
        name: "RESONANCE ORBITS",
        subtitle: "Organisations in the field"
      },
      "04": {
        name: "ROLE MANIFESTATION",
        subtitle: "Concrete role manifestations"
      },
      "05": {
        name: "TENSION FIELD",
        subtitle: "Capability-gap projection"
      },
      "06": {
        name: "EVOLUTION PATHS",
        subtitle: "Evolution pathways"
      }
    } satisfies Record<SilOrbitStageId, SilOrbitCopy>,

    sourceDock: {
      title: "INGEST KNOWLEDGE",
      description: "Add documents, repositories, URLs, or text for analysis.",
      uploadPdf: "UPLOAD PDF DOCUMENT",
      githubUrl: "GITHUB URL",
      websiteUrl: "WEBSITE URL",
      enterText: "ENTER TEXT / MARKDOWN",
      repositoryUrl: "GITHUB REPOSITORY URL",
      websitePortfolioUrl: "WEBSITE / PORTFOLIO URL",
      textMarkdownInput: "TEXT / MARKDOWN INPUT",
      optionalTitle: "Title (optional)",
      textPlaceholder: "Enter text or Markdown here...",
      cancel: "CANCEL",
      add: "ADD",
      stagedSources: "STAGED SOURCES",
      noSources: "No sources selected.",
      removeSource: "Remove source",
      startAnalysis: "START ANALYSIS",
      analysisRunning: "ANALYSIS RUNNING...",
      manualTextTitle: "Manual Text Input"
    },

    analysis: {
      successTitle: "ANALYSIS COMPLETED SUCCESSFULLY",
      successSubtitle: "IDENTITY CORE & ORBITS MANIFESTED",
      failed: "ANALYSIS FAILED",
      retry: "RETRY",
      providerTruncation:
        "The model exceeded the available output boundary or the provider could not complete the request. Structured extraction was stopped.",
      semanticBoundary:
        "Model output violated the canonical semantic contract and was rejected before entering the validated state."
    },

    zoom: {
      planetarium: "PLANETARIUM",
      cluster: "CLUSTER",
      evidence: "EVIDENCE",
      source: "SOURCE",
      original: "ORIGINAL"
    },

    focus: {
      emptyProjectionState: "EMPTY PROJECTION",
      noneProjectedEvidence: "NONE PROJECTED",
      activeFocus: "ACTIVE FOCUS",
      state: "STATE",
      evidence: "EVIDENCE",
      reset: "RESET FOCUS"
    },

    hud: {
      hologram: "HOLOGRAM HUD",
      activeObjects: "Active Objects",
      confidence: "CONFIDENCE",
      evidenceDensity: "EVIDENCE DENSITY",
      sourcesGrounding: "SOURCES // SEMIOTIC GROUNDING",
      topItems: "TOP ITEMS",
      openEvidence: "OPEN EVIDENCE",
      inspectSources: "INSPECT SOURCES",
      viewMatches: "VIEW MATCHES",
      clickToFocus: "Click to focus this field"
    },

    inspector: {
      title: "DECISION GRAPH INSPECTOR",
      idle:
        "Hover or select any node in the Planetarium to inspect its bidirectional Decision Graph focus.",
      focusNode: "FOCUS NODE",
      decisionState: "DECISION STATE",
      evidenceQuality: "EVIDENCE QUALITY",
      traceabilityFlow: "TRACEABILITY FLOW",
      upstream: "UPSTREAM",
      downstream: "DOWNSTREAM",
      noUpstream: "No upstream proof items",
      noDownstream: "No downstream decision items"
    },

    runtime: {
      title: "RUNTIME TELEMETRY",
      inferenceCascade: "INFERENCE CASCADE",
      currentOperation: "CURRENT OPERATION",
      attempt: "ATTEMPT",
      unreported: "UNREPORTED",
      active: "ACTIVE",
      evaluatingCascade: "EVALUATING CASCADE..."
    },

    guide: {
      title: "THE 6-STAGE FLOW",
      stages: {
        "01": "Who are you? Your sources form the unaltered identity core.",
        "02": "Which capabilities form your semantic capability core?",
        "03": "Which organisations resonate with your capabilities?",
        "04": "Which concrete roles fit this resonance field?",
        "05": "Where are capabilities or experience missing? Where does tension emerge?",
        "06": "Which paths lead to greater resonance and opportunity?"
      }
    },

    onboarding: {
      title: "CONDYN ONBOARDING",
      step: "STEP",
      of: "OF",
      previous: "BACK",
      next: "NEXT",
      finish: "FINISH TOUR",
      openManual: "OPEN MANUAL",
      steps: [
        {
          title: "1. IDENTITY CORE",
          description: "This is the Identity Core at the center of the Planetarium. Analysis is formed here from your sources."
        },
        {
          title: "2. INGEST KNOWLEDGE",
          description: "Use the SourceDock on the left to ingest PDF documents, GitHub repositories, websites, or text."
        },
        {
          title: "3. THE 6 RESONANCE ORBITS",
          description: "Six semantic fields orbit the core, spanning capabilities, organisations, roles, tension, and evolution paths."
        },
        {
          title: "4. SEMANTIC ZOOM",
          description: "Select an orbit in the Planetarium to enter L1 clusters and L2 evidence."
        },
        {
          title: "5. DECISION GRAPH INSPECTOR",
          description: "The Inspector exposes the current evidence-graph focus and its traceability."
        },
        {
          title: "6. TRUST & TRACEABILITY",
          description: "The trust questions and System Codex explain how the result traces back to evidence."
        }
      ]
    },

    field: {
      items: "items",
      clusterNode: "CLUSTER NODE",
      evidences: "Evidence items",
      noEvidence: "NO EVIDENCE"
    },

    controls: {
      howThisWorks: "HOW THIS WORKS",
      systemCodex: "SYSTEM CODEX"
    },

    emptyStates: {
      "01": {
        title: "NO SOURCES PROJECTED",
        reason: "No sources are available in the current analysis state."
      },
      "02": {
        title: "NO CAPABILITIES PROJECTED",
        reason: "The validated analysis contains no projectable capability entities."
      },
      "03": {
        title: "NO ORGANISATIONS PROJECTED",
        reason: "The validated analysis contains no organisation entities."
      },
      "04": {
        title: "NO ROLES PROJECTED",
        reason: "The validated analysis contains no role entities."
      },
      "05": {
        title: "NO GAP PROJECTION AVAILABLE",
        reason: "This analysis path currently provides no capability-gap projection to SIL."
      },
      "06": {
        title: "NO EVOLUTION PATHS PROJECTED",
        reason: "The validated analysis contains no strategy or evolution-path entities."
      }
    } satisfies Record<SilOrbitStageId, SilEmptyStateCopy>
  },

  de: {
    emptyFieldLabel: "LEERES FELD // BEGRÜNDET",

    orbits: {
      "01": {
        name: "IDENTITÄTSKERN",
        subtitle: "Unverfälschter Identitätskern"
      },
      "02": {
        name: "FÄHIGKEITSFELD",
        subtitle: "Semantischer Fähigkeitskern"
      },
      "03": {
        name: "RESONANZ-ORBITS",
        subtitle: "Organisationen im Feld"
      },
      "04": {
        name: "ROLLENMANIFESTATION",
        subtitle: "Konkrete Rollenmanifestationen"
      },
      "05": {
        name: "SPANNUNGSFELD",
        subtitle: "Fähigkeitslücken-Projektion"
      },
      "06": {
        name: "ENTWICKLUNGSPFADE",
        subtitle: "Entwicklungspfade"
      }
    } satisfies Record<SilOrbitStageId, SilOrbitCopy>,

    sourceDock: {
      title: "WISSEN EINSPEISEN",
      description: "Fügen Sie Dokumente, Repositories, URLs oder Text zur Analyse hinzu.",
      uploadPdf: "PDF-DOKUMENT HOCHLADEN",
      githubUrl: "GITHUB-URL",
      websiteUrl: "WEBSITE-URL",
      enterText: "TEXT / MARKDOWN EINGEBEN",
      repositoryUrl: "GITHUB-REPOSITORY-URL",
      websitePortfolioUrl: "WEBSITE / PORTFOLIO-URL",
      textMarkdownInput: "TEXT / MARKDOWN-EINGABE",
      optionalTitle: "Bezeichnung (optional)",
      textPlaceholder: "Fügen Sie hier Text oder Markdown ein...",
      cancel: "ABBRECHEN",
      add: "HINZUFÜGEN",
      stagedSources: "BEREITGESTELLTE QUELLEN",
      noSources: "Keine Quellen ausgewählt.",
      removeSource: "Quelle entfernen",
      startAnalysis: "ANALYSE STARTEN",
      analysisRunning: "ANALYSE LÄUFT...",
      manualTextTitle: "Manuelle Texteingabe"
    },

    analysis: {
      successTitle: "ANALYSE ERFOLGREICH ABGESCHLOSSEN",
      successSubtitle: "IDENTITÄTSKERN & ORBITS MANIFESTIERT",
      failed: "ANALYSE FEHLGESCHLAGEN",
      retry: "NEU VERSUCHEN",
      providerTruncation:
        "Das Modell hat die verfügbare Ausgabegrenze überschritten oder der Provider konnte die Anfrage nicht abschließen. Die strukturierte Extraktion wurde beendet.",
      semanticBoundary:
        "Die Modellausgabe verletzte den kanonischen semantischen Vertrag und wurde vor Eintritt in den validierten Zustand verworfen."
    },

    zoom: {
      planetarium: "PLANETARIUM",
      cluster: "CLUSTER",
      evidence: "EVIDENZ",
      source: "QUELLE",
      original: "ORIGINAL"
    },

    focus: {
      emptyProjectionState: "LEERE PROJEKTION",
      noneProjectedEvidence: "NICHTS PROJIZIERT",
      activeFocus: "AKTIVER FOKUS",
      state: "ZUSTAND",
      evidence: "EVIDENZ",
      reset: "FOKUS ZURÜCKSETZEN"
    },

    hud: {
      hologram: "HOLOGRAMM-HUD",
      activeObjects: "Aktive Objekte",
      confidence: "KONFIDENZ",
      evidenceDensity: "EVIDENZDICHTE",
      sourcesGrounding: "QUELLEN // SEMANTISCHE GRUNDIERUNG",
      topItems: "TOP-ELEMENTE",
      openEvidence: "EVIDENZ ÖFFNEN",
      inspectSources: "QUELLEN PRÜFEN",
      viewMatches: "PASSUNGEN ANZEIGEN",
      clickToFocus: "Klicken, um dieses Feld zu fokussieren"
    },

    inspector: {
      title: "ENTSCHEIDUNGSGRAPH-INSPEKTOR",
      idle:
        "Bewegen Sie den Zeiger über einen Knoten oder wählen Sie ihn aus, um seinen bidirektionalen Graphfokus zu prüfen.",
      focusNode: "FOKUSKNOTEN",
      decisionState: "ENTSCHEIDUNGSZUSTAND",
      evidenceQuality: "EVIDENZQUALITÄT",
      traceabilityFlow: "NACHVOLLZIEHBARKEITSFLUSS",
      upstream: "AUFWÄRTS",
      downstream: "ABWÄRTS",
      noUpstream: "Keine vorgelagerten Beweiselemente",
      noDownstream: "Keine nachgelagerten Entscheidungselemente"
    },

    runtime: {
      title: "LAUFZEIT-TELEMETRIE",
      inferenceCascade: "INFERENZKASKADE",
      currentOperation: "AKTUELLE OPERATION",
      attempt: "VERSUCH",
      unreported: "NICHT GEMELDET",
      active: "AKTIV",
      evaluatingCascade: "INFERENZKASKADE WIRD AUSGEWERTET..."
    },

    guide: {
      title: "DER 6-STUFIGE FLUSS",
      stages: {
        "01": "Wer sind Sie? Ihre Quellen bilden den unverfälschten Identitätskern.",
        "02": "Welche Fähigkeiten bilden Ihren semantischen Fähigkeitskern?",
        "03": "Mit welchen Organisationen resonieren Ihre Fähigkeiten?",
        "04": "Welche konkreten Rollen passen zu diesem Resonanzfeld?",
        "05": "Wo fehlen Fähigkeiten oder Erfahrung? Wo entsteht Spannung?",
        "06": "Welche Pfade führen zu mehr Resonanz und Möglichkeiten?"
      }
    },

    onboarding: {
      title: "CONDYN-EINFÜHRUNG",
      step: "SCHRITT",
      of: "VON",
      previous: "ZURÜCK",
      next: "WEITER",
      finish: "TOUR BEENDEN",
      openManual: "HANDBUCH ÖFFNEN",
      steps: [
        {
          title: "1. IDENTITÄTSKERN",
          description: "Dies ist der Identitätskern im Zentrum des Planetariums. Hier entsteht die Analyse aus Ihren Quellen."
        },
        {
          title: "2. WISSEN EINSPEISEN",
          description: "Im SourceDock links speisen Sie PDF-Dokumente, GitHub-Repositories, Webseiten oder Text ein."
        },
        {
          title: "3. DIE 6 RESONANZ-ORBITS",
          description: "Sechs semantische Felder kreisen um den Kern: Fähigkeiten, Organisationen, Rollen, Spannung und Entwicklungspfade."
        },
        {
          title: "4. SEMANTISCHER ZOOM",
          description: "Wählen Sie einen Orbit im Planetarium, um L1-Cluster und L2-Evidenz zu öffnen."
        },
        {
          title: "5. ENTSCHEIDUNGSGRAPH-INSPEKTOR",
          description: "Der Inspektor zeigt den aktuellen Evidenzgraph-Fokus und seine Nachvollziehbarkeit."
        },
        {
          title: "6. VERTRAUEN & NACHVOLLZIEHBARKEIT",
          description: "Die Vertrauensfragen und der System-Codex zeigen, wie das Ergebnis auf Evidenz zurückgeführt wird."
        }
      ]
    },

    field: {
      items: "Elemente",
      clusterNode: "CLUSTER-KNOTEN",
      evidences: "Evidenzelemente",
      noEvidence: "KEINE EVIDENZ"
    },

    controls: {
      howThisWorks: "SO FUNKTIONIERT ES",
      systemCodex: "SYSTEM-CODEX"
    },

    emptyStates: {
      "01": {
        title: "KEINE QUELLEN PROJIZIERT",
        reason: "Im aktuellen Analysezustand sind keine Quellen verfügbar."
      },
      "02": {
        title: "KEINE FÄHIGKEITEN PROJIZIERT",
        reason: "Die validierte Analyse enthält keine projizierbaren Fähigkeitsentitäten."
      },
      "03": {
        title: "KEINE ORGANISATIONEN PROJIZIERT",
        reason: "Die validierte Analyse enthält keine Organisationsentitäten."
      },
      "04": {
        title: "KEINE ROLLEN PROJIZIERT",
        reason: "Die validierte Analyse enthält keine Rollenentitäten."
      },
      "05": {
        title: "KEINE LÜCKENPROJEKTION VERFÜGBAR",
        reason: "Dieser Analysepfad stellt SIL aktuell keine Fähigkeitslücken-Projektion bereit."
      },
      "06": {
        title: "KEINE ENTWICKLUNGSPFADE PROJIZIERT",
        reason: "Die validierte Analyse enthält keine Strategie- oder Entwicklungspfadentitäten."
      }
    } satisfies Record<SilOrbitStageId, SilEmptyStateCopy>
  }
} as const;
