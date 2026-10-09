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

    decisionLoop: {
      title: "HR DECISION LOOP",
      toggleOpen: "⟲ HR DECISION LOOP",
      collapse: "COLLAPSE",
      loading: "READING EXACT DECISION CONTEXT...",
      notFound: "NO PERSISTED DECISION CONTEXT WITH THIS EXACT ID",
      readFailed: "DECISION CONTEXT COULD NOT BE RECONSTRUCTED",
      context: "DECISION CONTEXT (DCTXREV)",
      authority: "AUTHORITY GRANT (DAR)",
      proposal: "RECOMMENDATION PROPOSAL (RCP)",
      subjects: "EXACT DECISION SUBJECTS",
      subjectOrdinal: "ITEM",
      authorizedActor: "AUTHORIZED ACTOR",
      grantor: "GRANTOR",
      window: "APPLICABILITY WINDOW",
      openEnded: "OPEN-ENDED",
      permittedClasses: "PERMITTED DECLARATION CLASSES",
      declare: "DECLARE HUMAN DECISION",
      declarant: "DECLARANT ACTOR ID",
      declarationClass: "DECLARATION CLASS",
      evidenceRefs: "DECLARATION EVIDENCE REFS (ONE PER LINE)",
      submit: "DECLARE",
      submitting: "DECLARING...",
      declared: "HUMAN DECISION RECORD PERSISTED",
      rejected: "DECLARATION REJECTED",
      conflict: "IMMUTABLE RECORD WITH THIS IDENTITY ALREADY EXISTS",
      unauthenticated: "NO ADMITTED PRINCIPAL",
      principalMismatch: "PRINCIPAL IS NOT THE NAMED DECLARANT",
      chain: "DECLARATION / ACTION / OUTCOME / FEEDBACK STATES",
      regionStates: {
        AVAILABLE: "PERSISTED",
        EMPTY: "NONE PERSISTED",
        NOT_PROVISIONED: "PERSISTENCE NOT PROVISIONED",
        FAILED: "REREAD FAILED CLOSED"
      },
      regions: {
        decisions: "HUMAN DECISION (DCR)",
        actionIntents: "ACTION INTENT (DAINT)",
        commitments: "HUMAN COMMITMENT (HCOM)",
        executionAuthorityGrants: "EXECUTION AUTHORITY (EAGR)",
        executionContexts: "EXECUTION CONTEXT (ECTXREV)",
        actionOccurrences: "ACTION OCCURRENCE (AOC)",
        stateChanges: "STATE CHANGE (SCD)",
        associations: "ACTION-STATE ASSOCIATION (ASCAD)",
        outcomeRoles: "OUTCOME ROLE (CORD)",
        outcomeValences: "OUTCOME VALENCE (COVD)",
        feedbackAdmissions: "FEEDBACK ADMISSION (COVFAD)",
        feedbackTargets: "FEEDBACK TARGET (COVFTD)",
        feedbackTargetBindings: "TARGET REVISION BINDING (COVFTRB)",
        feedbackContextRevisions: "FEEDBACK CONTEXT REVISION (COVFCR)"
      },
      nextContext: "RECONSTRUCTED NEXT DECISION CONTEXT (DREV)",
      nextContextHint: "Exact G2 revision id; the lineage is walked by previousRevisionId only.",
      nextContextInput: "DREV_ REVISION ID",
      nextContextLoad: "READ EXACT REVISION",
      nextContextLoading: "READING...",
      nextContextNotFound: "NO PERSISTED REVISION WITH THIS EXACT ID",
      nextContextFailed: "REVISION COULD NOT BE READ",
      lineage: "EXACT LINEAGE",
      rootReached: "ROOT REACHED (previousRevisionId = null)",
      predecessorNotFound: "PREDECESSOR NOT FOUND",
      predecessorUndecodable: "PREDECESSOR NOT DECODABLE",
      depthBound: "DEPTH BOUND REACHED",
      items: "CONTEXT ITEMS",
      sourceReferences: "SOURCE STATE REFERENCES",
      bindingBoundary: "DCTXREV ↔ DREV binding (R4) is not implemented in this field; the next context is read by explicit exact id.",
      nonClaims: "PERSISTED != TRUE · DECLARED != DONE · RETURN != NEW DECISION · ROOT != HEAD != LATEST"
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

    decisionLoop: {
      title: "HR-ENTSCHEIDUNGSSCHLEIFE",
      toggleOpen: "⟲ HR-ENTSCHEIDUNGSSCHLEIFE",
      collapse: "EINKLAPPEN",
      loading: "EXAKTER ENTSCHEIDUNGSKONTEXT WIRD GELESEN...",
      notFound: "KEIN PERSISTIERTER ENTSCHEIDUNGSKONTEXT MIT DIESER EXAKTEN ID",
      readFailed: "ENTSCHEIDUNGSKONTEXT KONNTE NICHT REKONSTRUIERT WERDEN",
      context: "ENTSCHEIDUNGSKONTEXT (DCTXREV)",
      authority: "AUTORITÄTSGEWÄHRUNG (DAR)",
      proposal: "EMPFEHLUNGSVORSCHLAG (RCP)",
      subjects: "EXAKTE ENTSCHEIDUNGSGEGENSTÄNDE",
      subjectOrdinal: "ELEMENT",
      authorizedActor: "AUTORISIERTER AKTEUR",
      grantor: "GEWÄHRENDER",
      window: "GELTUNGSFENSTER",
      openEnded: "OFFEN",
      permittedClasses: "ZULÄSSIGE ERKLÄRUNGSKLASSEN",
      declare: "MENSCHLICHE ENTSCHEIDUNG ERKLÄREN",
      declarant: "ERKLÄRENDER AKTEUR (ID)",
      declarationClass: "ERKLÄRUNGSKLASSE",
      evidenceRefs: "EVIDENZREFERENZEN DER ERKLÄRUNG (EINE PRO ZEILE)",
      submit: "ERKLÄREN",
      submitting: "WIRD ERKLÄRT...",
      declared: "MENSCHLICHE ENTSCHEIDUNG PERSISTIERT",
      rejected: "ERKLÄRUNG ABGELEHNT",
      conflict: "UNVERÄNDERLICHER DATENSATZ MIT DIESER IDENTITÄT EXISTIERT BEREITS",
      unauthenticated: "KEIN ZUGELASSENES PRINZIPAL",
      principalMismatch: "PRINZIPAL IST NICHT DER BENANNTE ERKLÄRENDE",
      chain: "ERKLÄRUNGS- / HANDLUNGS- / ERGEBNIS- / FEEDBACK-ZUSTÄNDE",
      regionStates: {
        AVAILABLE: "PERSISTIERT",
        EMPTY: "NICHTS PERSISTIERT",
        NOT_PROVISIONED: "PERSISTENZ NICHT BEREITGESTELLT",
        FAILED: "ERNEUTES LESEN FEHLGESCHLAGEN"
      },
      regions: {
        decisions: "MENSCHLICHE ENTSCHEIDUNG (DCR)",
        actionIntents: "HANDLUNGSABSICHT (DAINT)",
        commitments: "MENSCHLICHE VERPFLICHTUNG (HCOM)",
        executionAuthorityGrants: "AUSFÜHRUNGSAUTORITÄT (EAGR)",
        executionContexts: "AUSFÜHRUNGSKONTEXT (ECTXREV)",
        actionOccurrences: "HANDLUNGSEREIGNIS (AOC)",
        stateChanges: "ZUSTANDSÄNDERUNG (SCD)",
        associations: "HANDLUNGS-ZUSTANDS-ASSOZIATION (ASCAD)",
        outcomeRoles: "ERGEBNISROLLE (CORD)",
        outcomeValences: "ERGEBNISVALENZ (COVD)",
        feedbackAdmissions: "FEEDBACK-ZULASSUNG (COVFAD)",
        feedbackTargets: "FEEDBACK-ZIEL (COVFTD)",
        feedbackTargetBindings: "ZIELREVISIONSBINDUNG (COVFTRB)",
        feedbackContextRevisions: "FEEDBACK-KONTEXTREVISION (COVFCR)"
      },
      nextContext: "REKONSTRUIERTER NÄCHSTER ENTSCHEIDUNGSKONTEXT (DREV)",
      nextContextHint: "Exakte G2-Revisions-ID; die Linie wird ausschließlich über previousRevisionId verfolgt.",
      nextContextInput: "DREV_ REVISIONS-ID",
      nextContextLoad: "EXAKTE REVISION LESEN",
      nextContextLoading: "WIRD GELESEN...",
      nextContextNotFound: "KEINE PERSISTIERTE REVISION MIT DIESER EXAKTEN ID",
      nextContextFailed: "REVISION KONNTE NICHT GELESEN WERDEN",
      lineage: "EXAKTE LINIE",
      rootReached: "WURZEL ERREICHT (previousRevisionId = null)",
      predecessorNotFound: "VORGÄNGER NICHT GEFUNDEN",
      predecessorUndecodable: "VORGÄNGER NICHT DEKODIERBAR",
      depthBound: "TIEFENGRENZE ERREICHT",
      items: "KONTEXTELEMENTE",
      sourceReferences: "QUELLZUSTANDSREFERENZEN",
      bindingBoundary: "Die DCTXREV ↔ DREV-Bindung (R4) ist in diesem Feld nicht implementiert; der nächste Kontext wird über eine explizite exakte ID gelesen.",
      nonClaims: "PERSISTIERT != WAHR · ERKLÄRT != ERLEDIGT · RÜCKKEHR != NEUE ENTSCHEIDUNG · WURZEL != HEAD != LATEST"
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
