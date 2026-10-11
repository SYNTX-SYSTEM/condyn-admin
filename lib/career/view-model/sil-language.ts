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
        subtitle: "Inferred organisations (analysis) · not pool resonance"
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
        feedbackContextRevisions: "FEEDBACK CONTEXT REVISION (COVFCR)",
        decisionRevisionBindings: "DECISION CONTEXT BINDING (DCDRB)"
      },
      nextContext: "GENERIC DECISION CONTEXT REVISION (DREV) · EXACT READ",
      nextContextHint: "The lineage is reconstructed by previousRevisionId only. An id from the URL or the input is an explicit assumption; an id from a DCDRB binding is a persisted witness of this context.",
      entryLabel: "ENTRY",
      entryUrl: "EXPLICIT ID FROM URL (ASSUMED, NOT BOUND)",
      entryInput: "EXPLICIT ID FROM INPUT (ASSUMED, NOT BOUND)",
      entryBinding: "DCDRB BINDING OF THIS CONTEXT",
      boundRevisionsNotProvisioned: "BINDING PERSISTENCE NOT PROVISIONED · BOUND STATE UNKNOWN",
      boundRevisionsFailed: "BINDING REREAD FAILED CLOSED · BOUND STATE UNKNOWN",
      revisionRoot: "ROOT REVISION",
      revisionChild: "CHILD REVISION",
      boundToThisContext: "BOUND TO THIS CONTEXT",
      notBoundToThisContext: "NOT BOUND TO THIS CONTEXT",
      bindingStateUnknown: "BOUND STATE UNKNOWN (BINDING REGION NOT AVAILABLE)",
      inventoryUnchanged: "INVENTORY UNCHANGED FROM PREDECESSOR · compatible with a governed 8D return; governance is not established by this read",
      inventoryExtended: "INVENTORY EXTENDED BEYOND PREDECESSOR · formed outside the governed 8D return (D2 shape, boundary B-8D5)",
      predecessorNotRead: "PREDECESSOR NOT READ · return character not derivable",
      addedReferences: "REFERENCES NOT IN PREDECESSOR",
      addedItems: "ITEMS NOT IN PREDECESSOR",
      predecessorReadFailed: "PREDECESSOR READ FAILED",
      openContext: "OPEN EXACT CONTEXT",
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
      boundRevisions: "BOUND GENERIC CONTEXT REVISIONS (DCDRB)",
      boundRevisionsNone: "NO PERSISTED BINDING FOR THIS CONTEXT",
      bindingBoundary: "A DCDRB binding is a persisted structural witness only: not current, not accepted, not a governed 8D return. Each bound DREV is read by its exact id.",
      nonClaims: "PERSISTED != TRUE · DECLARED != DONE · RETURN != NEW DECISION · ROOT != HEAD != LATEST"
    },

    jobPool: {
      title: "JOB POOL CONNECTION",
      toggleOpen: "⬡ JOB POOL",
      collapse: "COLLAPSE",
      upload: "UPLOAD JOB POOL (JSON)",
      uploader: "UPLOADER ACTOR ID (SELF-DECLARED, NOT AUTHENTICATED)",
      chooseFile: "CHOOSE JSON FILE",
      noFile: "NO FILE CHOSEN",
      submit: "UPLOAD",
      submitting: "UPLOADING...",
      uploadCreated: "UPLOAD PERSISTED (NEW)",
      uploadIdentical: "IDENTICAL UPLOAD ALREADY PERSISTED",
      uploadRejected: "UPLOAD REJECTED",
      uploadFailed: "UPLOAD FAILED",
      uploadNotSelected: "UPLOADED != SELECTED · select it in the list below",
      pools: "PERSISTED JOB POOL UPLOADS",
      poolsLoading: "READING JOB POOL UPLOADS...",
      poolsEmpty: "NO JOB POOL UPLOAD PERSISTED",
      poolsFailed: "JOB POOL UPLOADS COULD NOT BE READ",
      notProvisioned: "JOB POOL PERSISTENCE NOT PROVISIONED (no verified disposable database)",
      select: "SELECT",
      selected: "SELECTED",
      selectedPool: "SELECTED UPLOAD",
      selectionNone: "NO UPLOAD SELECTED (explicit selection only, never a latest pool)",
      selectionNotListed: "SELECTED UPLOAD ID IS NOT AMONG THE PERSISTED UPLOADS",
      viewLoading: "READING EXACT UPLOAD...",
      viewNotFound: "NO PERSISTED UPLOAD WITH THIS EXACT ID",
      viewFailed: "UPLOAD COULD NOT BE READ",
      canonicalMapping: "CANONICAL MAPPING (LAYER C)",
      canonicalMappingBoundary: "Target revisions are PROPOSAL_ONLY with authority NONE. The Capability-Requirement Relation is NOT EVALUATED: no PHASE4_VERIFIED capability snapshot exists (HIA-1).",
      analysis: "ANALYSIS FOR MATCHING",
      analysisNone: "NO ANALYSIS: run the capability sweep (identity core) or open the page with an exact analysisId",
      analysisFromJob: "FROM THIS SESSION'S SUCCEEDED CAPABILITY SWEEP",
      analysisFromUrl: "FROM THE URL (EXACT ID, ASSUMED PERSISTED)",
      matches: "ROLE MATCHES (LAYER P)",
      matchesIdle: "SELECT AN UPLOAD AND PROVIDE AN ANALYSIS TO READ MATCHES",
      matchesLoading: "READING PRESENTATION MATCHING...",
      matchesNotFound: "POOL OR ANALYSIS NOT FOUND",
      matchesInactive: "POOL IS NOT ACTIVE: no matching for DRAFT or ARCHIVED pools",
      matchesFailed: "MATCHING COULD NOT BE READ",
      labels: {
        DETERMINISTIC_PRESENTATION: "DETERMINISTIC PRESENTATION",
        NOT_A_CANONICAL_EVALUATION: "NOT A CANONICAL EVALUATION",
        NOT_A_DECISION: "NOT A DECISION"
      },
      ranking: {
        MONOTONE_BY_RESONANCE: "RANKED BY resonanceScore AS DELIVERED",
        DELIVERED_ORDER_NOT_MONOTONE: "DELIVERED ORDER IS NOT MONOTONE BY resonanceScore (shown unchanged)",
        EMPTY: "NO ROLES IN THIS POOL"
      },
      resonance: "RESONANCE",
      candidateCapabilities: "CANDIDATE CAPABILITIES",
      weakThreshold: "WEAK-EVIDENCE THRESHOLD",
      matched: "MATCHED REQUIREMENTS",
      weakEvidence: "WEAK-EVIDENCE REQUIREMENTS",
      missing: "MISSING REQUIREMENTS",
      none: "NONE",
      basis: "BASIS",
      via: "VIA",
      constituent: "CONSTITUENT",
      evidence: "EVIDENCE",
      noEvidence: "NO EVIDENCE QUOTE DELIVERED",
      hint: "HINT",
      weight: "WEIGHT",
      level: "LEVEL",
      canonicalState: "CANONICAL STATE (LAYER C)",
      roleProfile: "TRPREV",
      requirementRevisions: "TRQREV",
      relation: "CAPABILITY-REQUIREMENT RELATION",
      organizations: "ORGANIZATION AGGREGATES (PRESENTATION)",
      missingBoundary: "Missing requirements are the delivered presentation gaps of this pool. They are not recommendations, not a decision and not an input to the HR Decision Loop.",
      sweep: "CAPABILITY SWEEP COVERAGE (UNSCORED)",
      sweepStates: {
        AVAILABLE: "SWEEP PROPOSALS READ",
        NOT_PRODUCED: "NO SWEEP PROPOSALS RECORDED FOR THIS ANALYSIS",
        FAILED: "SWEEP PROJECTION COULD NOT BE READ (LINEAGE INVALID)"
      },
      sweepProposals: "PROPOSALS",
      sweepBoundary: "Coverage by a Gemini Capability Sweep proposal is shown with its source-verified quote. It is unscored proposal coverage: not a score, it changes no resonanceScore, not a canonical evaluation, not a decision.",
      sweepCovered: "COVERED BY THE CAPABILITY SWEEP",
      sweepOnlyCoverage: "MISSING REQUIREMENTS COVERED BY THE SWEEP (UNSCORED)",
      unscored: "UNSCORED",
      nonClaims: "PRESENTED != EVALUATED · UPLOADED != SELECTED · RANKED != RECOMMENDED · MISSING != GAP DECISION · COVERED != SCORED"
    },

    jobField: {
      title: "JOB FIELD",
      subtitle: "THE JOB POOL AS THE CENTRAL FIELD · PRESENTATION · AUTHORITY NONE",
      enter: "◉ JOB",
      exit: "← CAPABILITY FIELD",
      states: {
        NO_POOL: "NO JOB POOL UPLOAD SELECTED: select one persisted upload (explicit selection only)",
        NO_ANALYSIS: "NO ANALYSIS: run the capability sweep (identity core) or open the page with an exact analysisId",
        LOADING: "READING PRESENTATION MATCHING...",
        AVAILABLE: "PRESENTATION MATCHING READ",
        NOT_FOUND: "POOL OR ANALYSIS NOT FOUND",
        INACTIVE_POOL: "POOL IS NOT ACTIVE: no matching for DRAFT or ARCHIVED pools",
        NOT_PROVISIONED: "JOB POOL PERSISTENCE NOT PROVISIONED (no verified disposable database)",
        FAILED: "MATCHING COULD NOT BE READ"
      },
      select: "SELECT",
      core: "CANDIDATE",
      coreCapabilities: "ANALYSIS CAPABILITIES (SCORED SOURCE)",
      coreSweep: "SWEEP PROPOSALS (UNSCORED)",
      resonance: "POOL RESONANCE (PRESENTATION)",
      legend: "Distance from the core = 1 − POOL RESONANCE (PRESENTATION): presentation geometry, not a canonical metric. Roles without a scored match stay visible on the outer ring. Roles are grouped by POOL organization only; no pool role or organization is joined with an inferred one. No evidence delivered is not absence of capability: absence of evidence is not absence of capability.",
      ranking: {
        MONOTONE_BY_RESONANCE: "ORDER AS DELIVERED (monotone by pool resonance)",
        DELIVERED_ORDER_NOT_MONOTONE: "ORDER AS DELIVERED (not monotone by pool resonance; shown unchanged)",
        EMPTY: "NO ROLES IN THIS POOL"
      },
      nearest: "NEAREST PRESENTED ROLE",
      nearestLabel: "presentation · authority NONE · not a role relation (RRL) · not a recommendation (RCP) · not a decision",
      noNearest: "NO SCORED MATCH DELIVERED FOR ANY ROLE",
      noScoredMatch: "NO SCORED MATCH",
      rank: "DELIVERED RANK",
      open: "OPEN ROLE",
      back: "ALL ROLES",
      relations: "REQUIREMENT RELATIONS (PRESENTATION)",
      requirementStates: {
        MATCHED: "MATCHED (SCORED)",
        UNRESOLVED: "UNRESOLVED (WEAK EVIDENCE)",
        COVERED_UNSCORED: "COVERED BY THE CAPABILITY SWEEP (UNSCORED)",
        NO_EVIDENCE_DELIVERED: "NO EVIDENCE DELIVERED"
      },
      provenance: {
        ANALYSIS_CAPABILITY: "analysis capability (scored)",
        SWEEP_PROPOSAL: "capability sweep proposal (unscored, source-verified quote)",
        NONE: "no evidence delivered · absence of evidence is not absence of capability"
      },
      confidence: "confidence",
      basis: "basis",
      constituent: "constituent",
      pending: "PENDING TOWARD THIS ROLE",
      pendingKinds: {
        UNPROVEN_CANONICAL: "UNPROVEN (CANONICAL)",
        UNRESOLVED_EVIDENCE: "UNRESOLVED (WEAK EVIDENCE)",
        UNSCORED_COVERAGE: "UNSCORED (SWEEP COVERAGE ONLY)",
        NO_EVIDENCE_DELIVERED: "NO EVIDENCE DELIVERED"
      },
      canonicalReason: "Capability-Requirement Relation: NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT. A canonical evaluation requires an owner decision (HIA-1/2); nothing in this field evaluates, proves or decides it.",
      none: "NONE",
      nonClaims: "NEAREST != CHOSEN · PENDING != MISSING CAPABILITY · COVERED != SCORED · DISTANCE != TRUTH · POOL ROLE != INFERRED ROLE"
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
        subtitle: "Inferierte Organisationen (Analyse) · keine Pool-Resonanz"
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
        feedbackContextRevisions: "FEEDBACK-KONTEXTREVISION (COVFCR)",
        decisionRevisionBindings: "ENTSCHEIDUNGSKONTEXT-BINDUNG (DCDRB)"
      },
      nextContext: "GENERISCHE ENTSCHEIDUNGSKONTEXT-REVISION (DREV) · EXAKTES LESEN",
      nextContextHint: "Die Linie wird ausschließlich über previousRevisionId rekonstruiert. Eine ID aus URL oder Eingabe ist eine explizite Annahme; eine ID aus einer DCDRB-Bindung ist ein persistierter Zeuge dieses Kontexts.",
      entryLabel: "EINSTIEG",
      entryUrl: "EXPLIZITE ID AUS URL (ANGENOMMEN, NICHT GEBUNDEN)",
      entryInput: "EXPLIZITE ID AUS EINGABE (ANGENOMMEN, NICHT GEBUNDEN)",
      entryBinding: "DCDRB-BINDUNG DIESES KONTEXTS",
      boundRevisionsNotProvisioned: "BINDUNGSPERSISTENZ NICHT BEREITGESTELLT · BINDUNGSZUSTAND UNBEKANNT",
      boundRevisionsFailed: "BINDUNG ERNEUT LESEN FEHLGESCHLAGEN · BINDUNGSZUSTAND UNBEKANNT",
      revisionRoot: "WURZELREVISION",
      revisionChild: "KINDREVISION",
      boundToThisContext: "AN DIESEN KONTEXT GEBUNDEN",
      notBoundToThisContext: "NICHT AN DIESEN KONTEXT GEBUNDEN",
      bindingStateUnknown: "BINDUNGSZUSTAND UNBEKANNT (BINDUNGSREGION NICHT VERFÜGBAR)",
      inventoryUnchanged: "INVENTAR GEGENÜBER VORGÄNGER UNVERÄNDERT · mit einer governten 8D-Rückkehr vereinbar; Governance wird durch dieses Lesen nicht festgestellt",
      inventoryExtended: "INVENTAR GEGENÜBER VORGÄNGER ERWEITERT · außerhalb der governten 8D-Rückkehr gebildet (D2-Form, Grenze B-8D5)",
      predecessorNotRead: "VORGÄNGER NICHT GELESEN · Rückkehrcharakter nicht ableitbar",
      addedReferences: "REFERENZEN NICHT IM VORGÄNGER",
      addedItems: "ELEMENTE NICHT IM VORGÄNGER",
      predecessorReadFailed: "VORGÄNGER LESEN FEHLGESCHLAGEN",
      openContext: "EXAKTEN KONTEXT ÖFFNEN",
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
      boundRevisions: "GEBUNDENE GENERISCHE KONTEXTREVISIONEN (DCDRB)",
      boundRevisionsNone: "KEINE PERSISTIERTE BINDUNG FÜR DIESEN KONTEXT",
      bindingBoundary: "Eine DCDRB-Bindung ist nur ein persistierter struktureller Zeuge: nicht aktuell, nicht akzeptiert, keine governte 8D-Rückkehr. Jede gebundene DREV wird über ihre exakte ID gelesen.",
      nonClaims: "PERSISTIERT != WAHR · ERKLÄRT != ERLEDIGT · RÜCKKEHR != NEUE ENTSCHEIDUNG · WURZEL != HEAD != LATEST"
    },

    jobPool: {
      title: "JOB-POOL-VERBINDUNG",
      toggleOpen: "⬡ JOB-POOL",
      collapse: "EINKLAPPEN",
      upload: "JOB-POOL HOCHLADEN (JSON)",
      uploader: "HOCHLADENDE AKTEUR-ID (SELBSTDEKLARIERT, NICHT AUTHENTIFIZIERT)",
      chooseFile: "JSON-DATEI WÄHLEN",
      noFile: "KEINE DATEI GEWÄHLT",
      submit: "HOCHLADEN",
      submitting: "WIRD HOCHGELADEN...",
      uploadCreated: "UPLOAD PERSISTIERT (NEU)",
      uploadIdentical: "IDENTISCHER UPLOAD BEREITS PERSISTIERT",
      uploadRejected: "UPLOAD ABGELEHNT",
      uploadFailed: "UPLOAD FEHLGESCHLAGEN",
      uploadNotSelected: "HOCHGELADEN != AUSGEWÄHLT · in der Liste unten auswählen",
      pools: "PERSISTIERTE JOB-POOL-UPLOADS",
      poolsLoading: "JOB-POOL-UPLOADS WERDEN GELESEN...",
      poolsEmpty: "KEIN JOB-POOL-UPLOAD PERSISTIERT",
      poolsFailed: "JOB-POOL-UPLOADS KONNTEN NICHT GELESEN WERDEN",
      notProvisioned: "JOB-POOL-PERSISTENZ NICHT BEREITGESTELLT (keine verifizierte Wegwerf-Datenbank)",
      select: "AUSWÄHLEN",
      selected: "AUSGEWÄHLT",
      selectedPool: "AUSGEWÄHLTER UPLOAD",
      selectionNone: "KEIN UPLOAD AUSGEWÄHLT (nur explizite Auswahl, nie ein neuester Pool)",
      selectionNotListed: "AUSGEWÄHLTE UPLOAD-ID IST NICHT UNTER DEN PERSISTIERTEN UPLOADS",
      viewLoading: "EXAKTER UPLOAD WIRD GELESEN...",
      viewNotFound: "KEIN PERSISTIERTER UPLOAD MIT DIESER EXAKTEN ID",
      viewFailed: "UPLOAD KONNTE NICHT GELESEN WERDEN",
      canonicalMapping: "KANONISCHE ABBILDUNG (SCHICHT C)",
      canonicalMappingBoundary: "Zielrevisionen sind PROPOSAL_ONLY mit Autorität NONE. Die Capability-Requirement-Relation ist NOT EVALUATED: kein PHASE4_VERIFIED-Capability-Snapshot existiert (HIA-1).",
      analysis: "ANALYSE FÜR DAS MATCHING",
      analysisNone: "KEINE ANALYSE: Capability-Sweep starten (Identitätskern) oder Seite mit exakter analysisId öffnen",
      analysisFromJob: "AUS DEM ERFOLGREICHEN CAPABILITY-SWEEP DIESER SITZUNG",
      analysisFromUrl: "AUS DER URL (EXAKTE ID, ALS PERSISTIERT ANGENOMMEN)",
      matches: "ROLLEN-MATCHES (SCHICHT P)",
      matchesIdle: "UPLOAD AUSWÄHLEN UND ANALYSE BEREITSTELLEN, UM MATCHES ZU LESEN",
      matchesLoading: "PRÄSENTATIONS-MATCHING WIRD GELESEN...",
      matchesNotFound: "POOL ODER ANALYSE NICHT GEFUNDEN",
      matchesInactive: "POOL IST NICHT AKTIV: kein Matching für DRAFT- oder ARCHIVED-Pools",
      matchesFailed: "MATCHING KONNTE NICHT GELESEN WERDEN",
      labels: {
        DETERMINISTIC_PRESENTATION: "DETERMINISTISCHE PRÄSENTATION",
        NOT_A_CANONICAL_EVALUATION: "KEINE KANONISCHE BEWERTUNG",
        NOT_A_DECISION: "KEINE ENTSCHEIDUNG"
      },
      ranking: {
        MONOTONE_BY_RESONANCE: "NACH resonanceScore GEREIHT, WIE GELIEFERT",
        DELIVERED_ORDER_NOT_MONOTONE: "GELIEFERTE REIHENFOLGE IST NICHT MONOTON NACH resonanceScore (unverändert gezeigt)",
        EMPTY: "KEINE ROLLEN IN DIESEM POOL"
      },
      resonance: "RESONANZ",
      candidateCapabilities: "KANDIDATEN-CAPABILITIES",
      weakThreshold: "SCHWELLE SCHWACHER EVIDENZ",
      matched: "ERFÜLLTE ANFORDERUNGEN",
      weakEvidence: "ANFORDERUNGEN MIT SCHWACHER EVIDENZ",
      missing: "FEHLENDE ANFORDERUNGEN",
      none: "KEINE",
      basis: "BASIS",
      via: "ÜBER",
      constituent: "BESTANDTEIL",
      evidence: "EVIDENZ",
      noEvidence: "KEIN EVIDENZZITAT GELIEFERT",
      hint: "HINWEIS",
      weight: "GEWICHT",
      level: "STUFE",
      canonicalState: "KANONISCHER ZUSTAND (SCHICHT C)",
      roleProfile: "TRPREV",
      requirementRevisions: "TRQREV",
      relation: "CAPABILITY-REQUIREMENT-RELATION",
      organizations: "ORGANISATIONS-AGGREGATE (PRÄSENTATION)",
      missingBoundary: "Fehlende Anforderungen sind die gelieferten Präsentationslücken dieses Pools. Sie sind keine Empfehlungen, keine Entscheidung und kein Input für die HR-Entscheidungsschleife.",
      sweep: "CAPABILITY-SWEEP-ABDECKUNG (UNBEWERTET)",
      sweepStates: {
        AVAILABLE: "SWEEP-VORSCHLÄGE GELESEN",
        NOT_PRODUCED: "KEINE SWEEP-VORSCHLÄGE FÜR DIESE ANALYSE AUFGEZEICHNET",
        FAILED: "SWEEP-PROJEKTION KONNTE NICHT GELESEN WERDEN (LINIE UNGÜLTIG)"
      },
      sweepProposals: "VORSCHLÄGE",
      sweepBoundary: "Abdeckung durch einen Gemini-Capability-Sweep-Vorschlag wird mit dem quellverifizierten Zitat gezeigt. Sie ist unbewertete Vorschlagsabdeckung: kein Score, ändert keinen resonanceScore, keine kanonische Bewertung, keine Entscheidung.",
      sweepCovered: "DURCH DEN CAPABILITY-SWEEP ABGEDECKT",
      sweepOnlyCoverage: "FEHLENDE ANFORDERUNGEN, DIE DER SWEEP ABDECKT (UNBEWERTET)",
      unscored: "UNBEWERTET",
      nonClaims: "PRÄSENTIERT != BEWERTET · HOCHGELADEN != AUSGEWÄHLT · GEREIHT != EMPFOHLEN · FEHLEND != LÜCKENENTSCHEIDUNG · ABGEDECKT != BEWERTET"
    },

    jobField: {
      title: "JOB-FELD",
      subtitle: "DER JOB-POOL ALS ZENTRALES FELD · PRÄSENTATION · AUTORITÄT NONE",
      enter: "◉ JOB",
      exit: "← CAPABILITY-FELD",
      states: {
        NO_POOL: "KEIN JOB-POOL-UPLOAD AUSGEWÄHLT: einen persistierten Upload auswählen (nur explizite Auswahl)",
        NO_ANALYSIS: "KEINE ANALYSE: Capability-Sweep starten (Identitätskern) oder Seite mit exakter analysisId öffnen",
        LOADING: "PRÄSENTATIONS-MATCHING WIRD GELESEN...",
        AVAILABLE: "PRÄSENTATIONS-MATCHING GELESEN",
        NOT_FOUND: "POOL ODER ANALYSE NICHT GEFUNDEN",
        INACTIVE_POOL: "POOL IST NICHT AKTIV: kein Matching für DRAFT- oder ARCHIVED-Pools",
        NOT_PROVISIONED: "JOB-POOL-PERSISTENZ NICHT BEREITGESTELLT (keine verifizierte Wegwerf-Datenbank)",
        FAILED: "MATCHING KONNTE NICHT GELESEN WERDEN"
      },
      select: "AUSWÄHLEN",
      core: "KANDIDAT:IN",
      coreCapabilities: "ANALYSE-CAPABILITIES (BEWERTETE QUELLE)",
      coreSweep: "SWEEP-VORSCHLÄGE (UNBEWERTET)",
      resonance: "POOL-RESONANZ (PRÄSENTATION)",
      legend: "Abstand vom Kern = 1 − POOL-RESONANZ (PRÄSENTATION): Präsentationsgeometrie, keine kanonische Metrik. Rollen ohne bewerteten Match bleiben am äußeren Ring sichtbar. Rollen sind nur nach POOL-Organisation gruppiert; keine Pool-Rolle oder -Organisation wird mit einer inferierten verbunden. Keine gelieferte Evidenz ist keine fehlende Capability.",
      ranking: {
        MONOTONE_BY_RESONANCE: "REIHENFOLGE WIE GELIEFERT (monoton nach Pool-Resonanz)",
        DELIVERED_ORDER_NOT_MONOTONE: "REIHENFOLGE WIE GELIEFERT (nicht monoton nach Pool-Resonanz; unverändert gezeigt)",
        EMPTY: "KEINE ROLLEN IN DIESEM POOL"
      },
      nearest: "NÄCHSTE PRÄSENTIERTE ROLLE",
      nearestLabel: "Präsentation · Autorität NONE · keine Rollenrelation (RRL) · keine Empfehlung (RCP) · keine Entscheidung",
      noNearest: "FÜR KEINE ROLLE EIN BEWERTETER MATCH GELIEFERT",
      noScoredMatch: "KEIN BEWERTETER MATCH",
      rank: "GELIEFERTER RANG",
      open: "ROLLE ÖFFNEN",
      back: "ALLE ROLLEN",
      relations: "ANFORDERUNGSRELATIONEN (PRÄSENTATION)",
      requirementStates: {
        MATCHED: "ERFÜLLT (BEWERTET)",
        UNRESOLVED: "UNGELÖST (SCHWACHE EVIDENZ)",
        COVERED_UNSCORED: "DURCH DEN CAPABILITY-SWEEP ABGEDECKT (UNBEWERTET)",
        NO_EVIDENCE_DELIVERED: "KEINE EVIDENZ GELIEFERT"
      },
      provenance: {
        ANALYSIS_CAPABILITY: "Analyse-Capability (bewertet)",
        SWEEP_PROPOSAL: "Capability-Sweep-Vorschlag (unbewertet, quellverifiziertes Zitat)",
        NONE: "keine Evidenz geliefert · fehlende Evidenz ist keine fehlende Capability"
      },
      confidence: "Konfidenz",
      basis: "Basis",
      constituent: "Bestandteil",
      pending: "AUSSTEHEND FÜR DIESE ROLLE",
      pendingKinds: {
        UNPROVEN_CANONICAL: "UNBEWIESEN (KANONISCH)",
        UNRESOLVED_EVIDENCE: "UNGELÖST (SCHWACHE EVIDENZ)",
        UNSCORED_COVERAGE: "UNBEWERTET (NUR SWEEP-ABDECKUNG)",
        NO_EVIDENCE_DELIVERED: "KEINE EVIDENZ GELIEFERT"
      },
      canonicalReason: "Capability-Requirement-Relation: NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT. Eine kanonische Bewertung erfordert eine Eigentümerentscheidung (HIA-1/2); nichts in diesem Feld bewertet, beweist oder entscheidet sie.",
      none: "KEINE",
      nonClaims: "NÄCHSTE != GEWÄHLT · AUSSTEHEND != FEHLENDE CAPABILITY · ABGEDECKT != BEWERTET · ABSTAND != WAHRHEIT · POOL-ROLLE != INFERIERTE ROLLE"
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
