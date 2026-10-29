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
      /** F-G1-MD: a file the dock does not stage, and why. */
      fileRefused: { TYPE: (name: string) => `Not added: ${name} — only PDF, Markdown (.md, .markdown) or text (.txt) files. Other text: ENTER TEXT / MARKDOWN.`, EMPTY: (name: string) => `Not added: ${name} is empty.` },
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
      jobScopeTitle: "NO VALID JOB SCOPE",
      investigationTitle: "NO CLEAR INVESTIGATION BOUNDARY",
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
      collapse: "← CAPABILITY FIELD",
      fieldSubtitle: "THE JOB POOL AS ITS OWN FIELD · PERSISTED UPLOADS · EXPLICIT SELECTION · AUTHORITY NONE",
      orbit: "PERSISTED UPLOADS ON THE RING · THE SELECTED ONE AT THE CORE",
      coreEmpty: "NO UPLOAD AT THE CORE",
      coreHint: "select an upload on the ring; it moves to the core",
      structure: "POOL STRUCTURE (LAYER C)",
      structureHint: "organisations as arcs · roles on the inner ring · light only from a delivered matching",
      structureRole: "POOL ROLE",
      requirements: "REQUIREMENTS",
      revealRequirements: "REVEAL REQUIREMENTS",
      hideRequirements: "HIDE REQUIREMENTS",
      revealRole: "REVEAL RELATIONS",
      hideRole: "HIDE RELATIONS",
      enterJobField: "ENTER JOB FIELD →",
      intake: "INTAKE",
      allRoles: "ALL ROLES",
      layerC: "LAYER C DETAILS",
      layerCHide: "HIDE LAYER C",
      aggregates: "ORGANISATION AGGREGATES",
      aggregatesHide: "HIDE AGGREGATES",
      matchingDetails: "MATCHING DETAILS",
      matchingDetailsHide: "HIDE MATCHING DETAILS",
      intakeOpen: "+ INTAKE",
      intakeHide: "HIDE INTAKE",
      readingsHint: "click a lit role on the inner ring for its reading",
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
      uploadNotSelected: "UPLOADED ≠ OPENED · open it in the list below",
      /** UX-07: three words, one meaning each — UPLOADED (persisted, in this list), OPENED (shown in the Job Field: a pool, an
       *  organisation, a role), SELECTED (the one job, at the shell). */
      pools: "UPLOADED JOB POOLS",
      poolsLoading: "READING JOB POOL UPLOADS...",
      poolsEmpty: "NO JOB POOL UPLOADED YET · upload one via + INTAKE",
      poolsFailed: "JOB POOL UPLOADS COULD NOT BE READ",
      notProvisioned: "JOB POOL PERSISTENCE NOT PROVISIONED (no verified disposable database)",
      select: "OPEN",
      selected: "OPENED",
      selectedPool: "OPENED POOL",
      selectionNone: "NO POOL OPENED (explicit choice only, never a latest pool)",
      selectionNotListed: "SELECTED UPLOAD ID IS NOT AMONG THE PERSISTED UPLOADS",
      viewLoading: "READING EXACT UPLOAD...",
      viewNotFound: "NO PERSISTED UPLOAD WITH THIS EXACT ID",
      viewFailed: "UPLOAD COULD NOT BE READ",
      canonicalMapping: "CANONICAL MAPPING (LAYER C)",
      canonicalMappingBoundary: "Target revisions are PROPOSAL_ONLY with authority NONE. The Capability-Requirement Relation is NOT EVALUATED: no PHASE4_VERIFIED capability snapshot exists (HIA-1).",
      analysis: "ANALYSIS FOR MATCHING",
      analysisNone: "NO ANALYSIS: select a role as the job, then open an existing investigation or run ANALYZE",
      /** UX-03 with a valid selected job: its two ways, without asking for a job that is already selected. */
      analysisNoneWithJob: "NO ANALYSIS: open the selected job's role to choose an existing investigation, or run ANALYZE",
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
      boundaryPresentation: "PRESENTATION · AUTHORITY BOUNDARY",
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
      capabilityField: "◈ CAPABILITY",
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
        UNSCORED_COVERAGE: "UNSCORED SWEEP COVERAGE",
        NO_EVIDENCE_DELIVERED: "NO EVIDENCE DELIVERED"
      },
      canonicalReason: "Capability-Requirement Relation: NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT. A canonical evaluation requires an owner decision (HIA-1/2); nothing in this field evaluates, proves or decides it.",
      none: "NONE",
      nonClaims: "NEAREST != CHOSEN · PENDING != MISSING CAPABILITY · COVERED != SCORED · DISTANCE != TRUTH · POOL ROLE != INFERRED ROLE",
      legendToggle: "LEGEND",
      legendHide: "HIDE LEGEND",
      motion: "Light and breath = pool resonance (presentation) · still and unlit = no scored match delivered · waver = weak evidence · circulating dashes = covered by the sweep, unscored · faint gap = no evidence delivered · flowing ray = nearest presented role, not a choice · orbiting rings = what is pending toward the focused role",
      reveal: "REVEAL EVIDENCE",
      hide: "HIDE EVIDENCE",
      revealAll: "REVEAL ALL EVIDENCE",
      hideAll: "HIDE ALL EVIDENCE",
      ids: "IDS",
      composition: "REQUIREMENT COMPOSITION",
      hoverHint: "hover a role for its pending field · click to open it",
      reading: "{title} at {organization}: pool resonance {resonance} (presentation). {matched} of {total} requirements matched with scored evidence, {unresolved} unresolved, {covered} covered by the sweep without a score, {none} without delivered evidence.",
      why: "WHY PENDING",
      whyHide: "HIDE",
      galaxy: "nebula = one pool organisation (its colour is identity only) · its light = delivered organisation resonance (presentation) · thread from the core = scored evidence, brighter with more pool resonance; no thread = no scored match · moons around a role = its requirements, one body each, in state order",
      details: "DETAILS",
      detailsHide: "HIDE DETAILS"
    },

    syntx: {
      title: "JOB FIELD",
      toggle: "⬡ JOB FIELD",
      /** The field selector of the application shell: two equal fields of one system. */
      selector: { group: "SYNTX FIELD", capability: "◈ CAPABILITY FIELD", capabilityGated: "PERSON needs no job: choose it above. PERSON × JOB needs a valid role selected as the job — open one in the Job Field, then SELECT AS JOB" },
      /** UX-04: why the Capability Field is closed and the way to open it, visible at the shell (the gate itself is unchanged). */
      gate: {
        label: "CAPABILITY FIELD CLOSED",
        reason: {
          NONE: "PERSON × JOB needs a valid role selected as the job: none is selected",
          CHECKING: "PERSON × JOB needs a valid role selected as the job: the selected job is still being checked",
          INVALID: "PERSON × JOB needs a valid role selected as the job: the selected job is not valid",
          JOB: "JOB investigates the job only: no person field in this mode"
        },
        way: {
          NONE: "Way: PERSON needs no job — choose it above; PERSON × JOB needs a role opened in the Job Field, then SELECT AS JOB",
          CHECKING: "Way: wait for the check; it opens once the job is valid",
          INVALID: "Way: open a valid role in the Job Field, then SELECT AS JOB",
          JOB: "Way: choose PERSON or PERSON × JOB as the investigation boundary"
        }
      },
      exit: "← CAPABILITY FIELD",
      observation: { FIELD: "FIELD", ORGANIZATION: "ORGANIZATION", ROLE: "ROLE", REQUIREMENT: "REQUIREMENT" },
      returnLabel: "RETURN",
      keys: "Esc returns · Enter selects · Tab moves between carriers",
      pools: "POOLS",
      poolsHide: "HIDE POOLS",
      /** The selected job scope (SFE invariant): shown at the application shell in both fields; ANALYZE needs a VALID one. */
      jobScope: {
        label: "SELECTED JOB",
        /** Under PERSON the job is not used: the shell keeps its plain label (PERSON first screen unchanged). */
        labelUnused: "JOB",
        none: "NO JOB SELECTED",
        checking: "CHECKING THE JOB …",
        invalid: "JOB NOT VALID",
        select: "◎ SELECT AS JOB",
        selected: "✓ SELECTED JOB",
        clear: "× REMOVE JOB",
        clearHint: "Remove the selected job: ANALYZE is blocked until a job is selected again (sources and analyses stay)",
        open: "Open the selected job in the Job Field",
        choose: "Choose a job in the Job Field (open a role, then SELECT AS JOB)",
        /** UX-02: at the pool and the organisation level, where the job is chosen. */
        openRoleHint: "Open a role to select it as the job.",
        /** UX-07: the opened role, and whether it is the selected job. */
        roleOpened: "OPENED ROLE · not the selected job",
        roleOpenedSelected: "OPENED ROLE · the selected job"
      },
      /** UX-01: the level of the observation point, as text in the panel. */
      levelLine: { label: "LEVEL", names: { FIELD: "POOL", ORGANIZATION: "ORGANIZATION", ROLE: "ROLE", REQUIREMENT: "REQUIREMENT" } },
      /** UX-02: the legacy box below the job action collapses; open by default. */
      legacyToggle: { hide: "HIDE", show: "SHOW" },
      /** The investigation boundary (owner GO "DEMO FRONTEND", 2026-10-15): three explicit modes, one shell control in both fields. */
      investigation: {
        group: "INVESTIGATION BOUNDARY",
        modes: { PERSON: "PERSON", PERSON_X_JOB: "PERSON × JOB", JOB: "JOB" },
        hints: {
          PERSON: "The person and their capabilities, independent of any job: candidate documents only, no job scope",
          PERSON_X_JOB: "The person inside the scope of the selected job: needs a selected job",
          JOB: "The selected job itself, independent of any person: read from the pool source, no analysis, no Gemini"
        },
        personScope: "NO JOB SCOPE · PERSON",
        personScopeKept: "selected job not used: ",
        jobNotAnalyzable: "JOB reads the job itself: no document analysis in this mode.",
        capabilityGatedJob: "JOB investigates the job only: the Capability Field holds no person in this mode",
        state: { PERSON: "PERSON · NO JOB COMPARISON", JOB: "JOB · STRUCTURE FROM THE POOL SOURCE" },
        field: {
          PERSON: "PERSON investigates the person without a job scope: the pools stay readable, no analysis is compared with a job.",
          JOB: "JOB investigates the selected job itself: open it and read its structure (no person, no Gemini)."
        },
        result: { PERSON: "PERSON · WITHOUT A JOB SCOPE", PERSON_X_JOB: "PERSON × JOB" },
        /** Why an analysis on view is not compared in PERSON × JOB (URL BOUNDARY CLOSURE): read from its persisted boundary, never guessed. */
        withheld: {
          RESOLVING: "READING THE ANALYSIS BOUNDARY · NO COMPARISON YET",
          PERSON: "This analysis is a PERSON analysis: no job comparison.",
          UNRESOLVED: "The investigation boundary of this analysis cannot be resolved: no job comparison.",
          OTHER_POOL: "No comparison across job scopes: this analysis was investigated in the pool"
        },
        openAnalysisPool: "⬡ OPEN THE ANALYSIS'S POOL"
      },
      /** B2 · the selected role's coverage by this analysis's capability proposals (SELECTED_ROLE_COVERAGE_V1). */
      coverage: {
        toggle: "◎ B2 COVERAGE",
        hide: "HIDE B2 COVERAGE",
        title: "B2 · SELECTED ROLE COVERAGE",
        orientation: "Unconfirmed name coverage of the selected role by the capability proposals of this analysis: counts, never a score.",
        binding: "BINDING",
        requirements: "REQUIREMENTS OF THE ROLE",
        proposals: "CAPABILITY PROPOSALS",
        authority: "AUTHORITY",
        covered: "COVERED",
        notCovered: "NOT COVERED",
        weak: "WEAK · HEURISTIC",
        basis: { EXACT: "exact name", ALIAS: "alias", COMPOSITE_CONSTITUENT: "composite constituent", TOKEN_CONTAINMENT: "token containment (heuristic)" },
        by: "by",
        covers: "covers",
        coversNothing: "covers no requirement of this role",
        evidence: "verbatim from the candidate documents",
        counts: { requirements: "requirements", covered: "covered", notCovered: "not covered", proposals: "proposals" },
        notCoveredStatement: "Not covered is no judgement: no capability proposal of this analysis names this requirement.",
        countsStatement: "Counts, not a score: no ranking, no confirmed capability-requirement relation (NOT_EVALUATED).",
        states: {
          LOADING: "READING B2 COVERAGE …",
          NO_ANALYSIS: "No analysis on view: choose an existing investigation of this role above, or add a source in the Capability Field and run ANALYZE.",
          NOT_SCOPED: "This analysis is a PERSON analysis: no job comparison.",
          SCOPE_MISMATCH: "Analysis belongs to another job.",
          SCOPE_DRIFT: "The selected job has changed since this analysis (scope drift): no comparison.",
          SCOPE_UNAVAILABLE: "The job of this analysis is no longer available (pool not ACTIVE or role not resolvable).",
          LINEAGE_INVALID: "The lineage of this analysis does not hold (reference, runs and job disagree): no comparison.",
          NOT_FOUND: "This analysis has no capability proposals to compare (no sweep reference).",
          NOT_PROVISIONED: "Job pool persistence is not provisioned on this database.",
          FAILED: "B2 coverage could not be read."
        }
      },
      /** JOB · the selected job itself (JOB_STRUCTURE_V1): no person, no Gemini. */
      structure: {
        toggle: "⬡ JOB STRUCTURE",
        hide: "HIDE JOB STRUCTURE",
        title: "JOB · STRUCTURE",
        orientation: "The selected job as declared in the pool source: independent of any person, without Gemini.",
        role: "ROLE",
        requirements: "REQUIREMENTS",
        findings: "STRUCTURAL FINDINGS",
        authority: "AUTHORITY",
        responsibility: "responsibility",
        notDeclared: "NOT DECLARED",
        declared: "declared",
        typeDefault: "type not declared · canonical default",
        source: "pool source",
        findingsStatement: "Findings are facts of the declaration, not an assessment.",
        noFindings: "No structural findings in this declaration.",
        authorityStatement: "Read from the declared pool fields and their canonical validation: no interpretation, no person, no Gemini.",
        findingCodes: {
          ROLE_DESCRIPTION_MISSING: "role description missing",
          ROLE_SENIORITY_UNDECLARED: "seniority not declared",
          ROLE_DOMAIN_FOCUS_UNDECLARED: "domain focus not declared",
          ROLE_RESPONSIBILITY_NOT_DECLARED: "responsibility not declared",
          ROLE_WITHOUT_REQUIRED_REQUIREMENT: "no REQUIRED requirement",
          REQUIREMENT_NECESSITY_UNDECLARED: "necessity not declared",
          REQUIREMENT_LEVEL_UNRESOLVED: "level not resolved",
          REQUIREMENT_MATCHING_INELIGIBLE: "not eligible for matching",
          REQUIREMENT_MATCHING_ELIGIBILITY_UNKNOWN: "matching eligibility unknown",
          REQUIREMENT_TYPE_UNDECLARED: "type not declared",
          REQUIREMENT_ZERO_WEIGHT: "weight zero",
          REQUIREMENT_DOMAIN_UNDECLARED: "domain not declared",
          REQUIREMENT_NAME_COLLISION: "name collision"
        },
        states: {
          LOADING: "READING THE JOB STRUCTURE …",
          UNAVAILABLE: "The job structure is not available (unknown pool, a role outside it, or a pool that is not ACTIVE).",
          LINEAGE_INVALID: "The lineage of this job does not hold: no structure.",
          NOT_PROVISIONED: "Job pool persistence is not provisioned on this database.",
          FAILED: "The job structure could not be read."
        }
      },
      /** GEMINI OUTPUT · the read-only Result Inspector beside BOUNDARY (engineering builds only). */
      gemini: {
        toggle: "GEMINI OUTPUT",
        hide: "HIDE GEMINI OUTPUT",
        title: "GEMINI OUTPUT",
        orientation: "Read-only inspector of the stored Gemini exchange of this analysis: nothing is started, nothing is stored.",
        token: "INSPECTOR TOKEN",
        tokenHint: "Held in memory for this panel only and sent per read; discarded when the panel closes.",
        read: "READ",
        reading: "READING …",
        analysis: "analysis",
        job: "job",
        views: { SCOPE: "INVESTIGATION SCOPE", ORIGINAL: "ORIGINAL RESPONSE", PROCESSING: "PARSER · VERIFICATION · CONVERGENCE", PROJECTION: "PROJECTION", EXCHANGES: "EXCHANGES OF THE JOB" },
        mode: "mode",
        scopeText: "scope text (system prompt only, never evidence)",
        unscoped: "UNSCOPED · no investigation scope in this run",
        scopeNotRetained: "scope text NOT_RETAINED · hash only",
        notRetained: "NOT_RETAINED",
        notRetainedStatement: "The original response was not retained (never stored, expired or deleted). No processed result is shown in its place.",
        verbatim: "verbatim as received",
        parser: "parser result (parsed and schema-checked, not the original text)",
        verification: "evidence verification",
        convergence: "convergence",
        projection: "projection (the read model of the Capability Field)",
        noProjection: "no projection",
        exchangesEmpty: "No archived exchange for this job.",
        reused: "RUN REUSED",
        reusedStatement: "The Discovery run is older than this job: it was reused, this job made no new Gemini call. The response shown is the one the run was made from.",
        attemptOf: "received for job",
        readExchanges: "READ EXCHANGES",
        states: {
          CLOSED: "Inspector closed: switched off, not configured, or the token is wrong.",
          NOT_FOUND: "No sweep reference for this analysis: nothing to inspect.",
          LINEAGE_INVALID: "The stored exchange does not belong to this run (lineage invalid): nothing is shown.",
          FAILED: "The inspection could not be read."
        },
        noGemini: "No Gemini call in this mode.",
        noAnalysis: "No analysis to inspect: run ANALYZE first."
      },
      /** NO_POOL at the field: no explicit selection (a persisted upload may exist); not an error, a failed upload or a judgement. */
      noPool: {
        status: "JOB FIELD // UNBOUND",
        title: "NO JOB POOL OPENED",
        reason: "This field awaits an explicitly opened job pool.",
        /** UX-06: the uploaded pools first (no upload is needed to reach an existing investigation); the upload after them. */
        orientation: "Open an uploaded pool in POOLS · or upload one via + INTAKE",
        orientationEmpty: "No pool uploaded yet · upload one via + INTAKE"
      },
      support: {
        SUPPORTED: "SUPPORTED (SCORED EVIDENCE)",
        WEAK: "WEAK SUPPORT (SCORED, THIN)",
        SWEEP_ONLY: "COVERED BY THE SWEEP (UNSCORED)",
        OPEN: "NO DELIVERED SUPPORT (OPEN)",
        UNREAD: "NO MATCHING READ"
      },
      relation: {
        contains: "contains",
        requires: "requires",
        supports: "supports",
        weakly_supports: "weakly supports",
        covers_unscored: "covers (unscored)",
        missing_support: "no delivered support",
        pending_evaluation: "pending canonical evaluation"
      },
      source: "SOURCE",
      sourceUnresolved: "SOURCE TITLE NOT RESOLVED IN THIS ANALYSIS",
      sourceNotRead: "ANALYSIS SOURCES NOT READ",
      quote: "QUOTE",
      capabilityReference: "CAPABILITY REFERENCE",
      constituent: "constituent",
      basis: "basis",
      contribution: "contribution",
      confidence: "confidence",
      weight: "weight",
      level: "level",
      necessity: "necessity",
      location: "location",
      hint: "hint",
      sweepStatus: "unscored · source-match verified · not canonically evaluated",
      inspect: "INSPECT",
      close: "CLOSE",
      texts: {
        scored: "Scored evidence supports this requirement within the delivered presentation matching; it is not a certification.",
        weak: "Evidence exists but contributes limited matching support.",
        sweep: "A capability sweep proposal covers this requirement with a source-verified quote; it is not scored and not canonically evaluated.",
        missing: "No delivered support is available for this requirement in the current analysis.",
        pending: "Authoritative evaluation has not occurred for this relation."
      },
      authority: "presentation · authority NONE · not a canonical evaluation · not a decision · not an HR recommendation",
      resonance: "POOL RESONANCE (PRESENTATION)",
      rank: "delivered rank",
      requirements: "REQUIREMENTS",
      roles: "ROLES",
      organizations: "ORGANIZATIONS",
      boundary: "BOUNDARY",
      boundaryOrientation: "Marks the governance, authority and evaluation boundaries of this field state.",
      boundaryHide: "HIDE BOUNDARY",
      matching: "PRESENTATION MATCHING",
      manifest: {
        pool: "JOB POOL",
        organization: "ORGANIZATION",
        organizationCosmos: "ORGANIZATION COSMOS",
        focusOrganization: "Click to focus this organization",
        role: "ROLE",
        roleCosmos: "ROLE COSMOS",
        requirement: "REQUIREMENT",
        nucleus: "REQUIREMENT NUCLEUS",
        returnToField: "RETURN TO THE JOB POOL",
        returnToOrganization: "RETURN TO THE ORGANIZATION COSMOS",
        returnToRole: "RETURN TO THE ROLE COSMOS",
        evidence: "EVIDENCE",
        relations: "EVIDENCE RELATIONS",
        document: "DOCUMENT",
        scored: "SCORED",
        unscored: "UNSCORED · SWEEP PROPOSAL",
        matchingRead: "MATCHING READ",
        matchingNotRead: "NO MATCHING READ",
        evidenceCount: "EVIDENCE"
      },
      summary: {
        field: "Job pool {poolName}, version {poolVersion}, {poolStatus}: {organizationCount} {organizations} containing {roleCount} {roles}. {matching}",
        organization: "Organization {organizationName} contains {roleCount} {roles}: {roleTitles}.",
        role: "Role {roleTitle} at {organizationName} requires {requirementCount} {requirements}: {supported} with scored support, {weak} with weak support, {sweepOnly} covered only by an unscored sweep proposal, {open} without delivered support, {unread} without a matching read. {pending}",
        requirement: "Requirement {requirementName} of role {roleTitle}: {support}; {traceCount} {traces} from {sourceCount} {sources}. {aperture}",
        support: {
          SUPPORTED: "supported by scored evidence",
          WEAK: "weakly supported by scored evidence",
          SWEEP_ONLY: "covered only by an unscored sweep proposal",
          OPEN: "without delivered support",
          UNREAD: "without a matching read"
        },
        pendingEvaluation: "Canonical evaluation is pending for every requirement of this role.",
        apertureOpen: "An inspection aperture is open.",
        matchingRead: "A presentation matching was read for this pool.",
        matchingNotRead: "No presentation matching was read.",
        nouns: {
          organizations: { one: "organization", other: "organizations" },
          roles: { one: "role", other: "roles" },
          requirements: { one: "requirement", other: "requirements" },
          traces: { one: "evidence trace", other: "evidence traces" },
          sources: { one: "source", other: "sources" }
        }
      },
      stale: {
        ORGANIZATION: "ORGANIZATION ID NOT IN THIS POOL",
        ROLE: "ROLE ID NOT IN THIS POOL",
        REQUIREMENT: "REQUIREMENT ID NOT IN THIS ROLE"
      },
      /** The role level's legacy presentation under PERSON × JOB (owner G1 Q4): its source and limits disclosed, its behaviour unchanged. */
      legacyDisclosure: {
        title: "LEGACY PRESENTATION · NOT B2",
        source: "Source: presentation matching JOB_POOL_PRESENTATION_MATCHING_V1 · first the legacy analysis without job scope (not deterministic), then sweep proposals.",
        reach: "Reach: the whole pool.",
        limits: "Limits: presentation · no authority · not B2 · no capability → requirement relation · no decision."
      },
      nonClaims: "PRESENTED != EVALUATED · UPLOADED != SELECTED · RANKED != RECOMMENDED · MISSING != GAP DECISION · COVERED != SCORED · PENDING != MISSING CAPABILITY · POOL ROLE != INFERRED ROLE"
    },
    /** PERSON × JOB · the first screen (owner G1, 2026-10-22): B2 is the only relation source; every state names itself. */
    pxjFirst: {
      title: "B2 · REQUIREMENT COVERAGE",
      orientation: "The selected role's requirements in pool order, each with the capability proposal of this analysis that names it.",
      boundary: ["Name coverage by a capability proposal", "not scored", "relation NOT_EVALUATED", "not a competence verification", "not a hiring decision"],
      binding: "BINDING",
      analysis: "analysis",
      requirements: "REQUIREMENTS · POOL ORDER",
      proposals: "CAPABILITY PROPOSALS OF THIS ANALYSIS",
      covered: "COVERED",
      notCovered: "NOT COVERED",
      weak: "WEAK · HEURISTIC",
      basis: { EXACT: "exact name", ALIAS: "alias", COMPOSITE_CONSTITUENT: "composite constituent", TOKEN_CONTAINMENT: "token containment (heuristic)" },
      by: "by",
      notCoveredStatement: "No capability proposal of this analysis names this requirement.",
      counts: { requirements: "requirements", covered: "covered", notCovered: "not covered" },
      quoteVerified: "source-match verified · not a competence verification",
      quoteNotInProjection: "quote not in projection",
      proposalNotInProjection: "proposal not in this projection",
      sourceNotResolved: "source not resolved",
      titleNotDelivered: "title not delivered",
      hashNotDelivered: "hash not delivered",
      switchMode: "SWITCH TO",
      selectRole: "◎ SELECT THIS ROLE",
      lineage: {
        "L-1": "its binding is not this analysis, the selected job and the analysis's own job",
        "L-2": "its discovery run is not the one of this analysis",
        "L-3": "its scope hash is not the one of this analysis",
        "L-4": "its proposals are not the proposals of this analysis"
      },
      states: {
        NO_ANALYSIS: "No analysis of the selected job on view yet. Two ways lead to one:",
        RESULT_LOADING: "READING THE PERSISTED RESULT …",
        RESULT_NOT_FOUND: "Analysis not found: no result, no demo data.",
        RESULT_FAILED: "The result of this analysis cannot be read: nothing is shown.",
        BOUNDARY_RESOLVING: "READING THE INVESTIGATION BOUNDARY …",
        BOUNDARY_UNRESOLVED: "The investigation boundary of this analysis cannot be resolved: no proposals, no coverage.",
        BOUNDARY_NOT_FOUND: "No investigation boundary is recorded for this analysis: no proposals, no coverage.",
        BOUNDARY_FAILED: "The investigation boundary of this analysis cannot be read: no proposals, no coverage.",
        MODE_MISMATCH: "This analysis ran in another investigation mode: nothing is shown, nothing switches by itself.",
        ROLE_MISMATCH: "This analysis belongs to another job than the selected one: neither its proposals nor coverage are shown.",
        ROLE_NONE: "No job is selected: this analysis belongs to the job below.",
        JOB_CHECKING: "CHECKING THE SELECTED JOB …",
        JOB_INVALID: "The selected job is not valid: neither proposals nor coverage of this analysis are shown.",
        PERSON_RESULT: "PERSON · without a job scope.",
        NO_PROJECTION: "This analysis has no capability proposals: no coverage.",
        COVERAGE_LOADING: "READING B2 COVERAGE …",
        COVERAGE_NOT_SCOPED: "This analysis has no job scope: no coverage.",
        COVERAGE_SCOPE_MISMATCH: "The analysis belongs to another job: no coverage.",
        COVERAGE_SCOPE_DRIFT: "The selected job has changed since this analysis (scope drift): no coverage.",
        COVERAGE_SCOPE_UNAVAILABLE: "The job of this analysis is no longer available: no coverage.",
        COVERAGE_LINEAGE_INVALID: "The lineage of this analysis does not hold: no coverage.",
        COVERAGE_NOT_FOUND: "No proposal reference for this analysis: no coverage.",
        COVERAGE_NOT_PROVISIONED: "Job pool persistence is not provisioned on this database: no coverage.",
        COVERAGE_FAILED: "B2 coverage cannot be read: no coverage.",
        LINEAGE_MISMATCH: "The coverage does not belong to this analysis: proposals shown, no coverage.",
        AVAILABLE: "B2 coverage of the selected role"
      },
      modeAnalysis: "ran in",
      modeInterface: "interface",
      jobOfAnalysis: "job of this analysis",
      reason: "reason",
      selectedJob: "selected job",
      /** UX-03: the two ways out of NO_ANALYSIS. */
      ways: { existing: "(a) Choose an existing investigation of this role:", analyze: "(b) Add a source under INGEST KNOWLEDGE (left) and run ANALYZE." },
      /** D-PICK (UX-05): an existing investigation of the selected role, chosen explicitly (GET only, nothing chosen by itself). */
      picker: {
        open: "◎ CHOOSE AN EXISTING INVESTIGATION OF THIS ROLE",
        close: "HIDE EXISTING INVESTIGATIONS",
        title: "EXISTING INVESTIGATIONS · THIS ROLE · PERSON × JOB",
        loading: "READING THE EXISTING ANALYSES AND THEIR BOUNDARIES …",
        failed: "The list of analyses cannot be read: nothing is offered.",
        empty: "No existing investigation of this role in PERSON × JOB.",
        scope: (considered: number, listed: number, unreadable: number) => `Checked: the newest ${considered} of ${listed} analyses${unreadable > 0 ? ` · ${unreadable} with an unreadable boundary, not offered` : ""}. Offered only with the same mode and exactly this job.`,
        id: "analysis",
        time: "created",
        validation: "validation",
        mode: "mode",
        job: "bound job",
        binding: "binding",
        choose: "OPEN",
        onView: "ON VIEW",
        utc: "UTC"
      }
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
      fileRefused: { TYPE: (name: string) => `Nicht hinzugefügt: ${name} — nur PDF-, Markdown- (.md, .markdown) oder Textdateien (.txt). Anderer Text: TEXT / MARKDOWN EINGEBEN.`, EMPTY: (name: string) => `Nicht hinzugefügt: ${name} ist leer.` },
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
      jobScopeTitle: "KEIN GÜLTIGER JOB-SCOPE",
      investigationTitle: "KEINE EINDEUTIGE UNTERSUCHUNGSGRENZE",
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
      collapse: "← CAPABILITY-FELD",
      fieldSubtitle: "DER JOB-POOL ALS EIGENES FELD · PERSISTIERTE UPLOADS · EXPLIZITE AUSWAHL · AUTORITÄT NONE",
      orbit: "PERSISTIERTE UPLOADS AUF DEM RING · DER AUSGEWÄHLTE IM KERN",
      coreEmpty: "KEIN UPLOAD IM KERN",
      coreHint: "einen Upload auf dem Ring auswählen; er wandert in den Kern",
      structure: "POOL-STRUKTUR (LAYER C)",
      structureHint: "Organisationen als Bögen · Rollen auf dem inneren Ring · Licht nur aus einem gelieferten Matching",
      structureRole: "POOL-ROLLE",
      requirements: "ANFORDERUNGEN",
      revealRequirements: "ANFORDERUNGEN ZEIGEN",
      hideRequirements: "ANFORDERUNGEN AUSBLENDEN",
      revealRole: "RELATIONEN ZEIGEN",
      hideRole: "RELATIONEN AUSBLENDEN",
      enterJobField: "JOB-FELD BETRETEN →",
      intake: "AUFNAHME",
      allRoles: "ALLE ROLLEN",
      layerC: "LAYER-C-DETAILS",
      layerCHide: "LAYER C AUSBLENDEN",
      aggregates: "ORGANISATIONSAGGREGATE",
      aggregatesHide: "AGGREGATE AUSBLENDEN",
      matchingDetails: "MATCHING-DETAILS",
      matchingDetailsHide: "MATCHING-DETAILS AUSBLENDEN",
      intakeOpen: "+ AUFNAHME",
      intakeHide: "AUFNAHME AUSBLENDEN",
      readingsHint: "eine beleuchtete Rolle auf dem inneren Ring anklicken für ihre Lesung",
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
      uploadNotSelected: "HOCHGELADEN ≠ GEÖFFNET · in der Liste unten öffnen",
      pools: "HOCHGELADENE JOB-POOLS",
      poolsLoading: "JOB-POOL-UPLOADS WERDEN GELESEN...",
      poolsEmpty: "NOCH KEIN JOB-POOL HOCHGELADEN · über + AUFNAHME hochladen",
      poolsFailed: "JOB-POOL-UPLOADS KONNTEN NICHT GELESEN WERDEN",
      notProvisioned: "JOB-POOL-PERSISTENZ NICHT BEREITGESTELLT (keine verifizierte Wegwerf-Datenbank)",
      select: "ÖFFNEN",
      selected: "GEÖFFNET",
      selectedPool: "GEÖFFNETER POOL",
      selectionNone: "KEIN POOL GEÖFFNET (nur explizite Wahl, nie ein neuester Pool)",
      selectionNotListed: "AUSGEWÄHLTE UPLOAD-ID IST NICHT UNTER DEN PERSISTIERTEN UPLOADS",
      viewLoading: "EXAKTER UPLOAD WIRD GELESEN...",
      viewNotFound: "KEIN PERSISTIERTER UPLOAD MIT DIESER EXAKTEN ID",
      viewFailed: "UPLOAD KONNTE NICHT GELESEN WERDEN",
      canonicalMapping: "KANONISCHE ABBILDUNG (SCHICHT C)",
      canonicalMappingBoundary: "Zielrevisionen sind PROPOSAL_ONLY mit Autorität NONE. Die Capability-Requirement-Relation ist NOT EVALUATED: kein PHASE4_VERIFIED-Capability-Snapshot existiert (HIA-1).",
      analysis: "ANALYSE FÜR DAS MATCHING",
      analysisNone: "KEINE ANALYSE: eine Rolle als Job wählen, dann eine vorhandene Untersuchung öffnen oder ANALYZE ausführen",
      analysisNoneWithJob: "KEINE ANALYSE: die Rolle des gewählten Jobs öffnen und eine vorhandene Untersuchung wählen oder ANALYZE ausführen",
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
      boundaryPresentation: "PRÄSENTATION · AUTORITÄTSGRENZE",
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
      capabilityField: "◈ CAPABILITY",
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
        UNSCORED_COVERAGE: "UNBEWERTETE SWEEP-ABDECKUNG",
        NO_EVIDENCE_DELIVERED: "KEINE EVIDENZ GELIEFERT"
      },
      canonicalReason: "Capability-Requirement-Relation: NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT. Eine kanonische Bewertung erfordert eine Eigentümerentscheidung (HIA-1/2); nichts in diesem Feld bewertet, beweist oder entscheidet sie.",
      none: "KEINE",
      nonClaims: "NÄCHSTE != GEWÄHLT · AUSSTEHEND != FEHLENDE CAPABILITY · ABGEDECKT != BEWERTET · ABSTAND != WAHRHEIT · POOL-ROLLE != INFERIERTE ROLLE",
      legendToggle: "LEGENDE",
      legendHide: "LEGENDE AUSBLENDEN",
      motion: "Licht und Atmen = Pool-Resonanz (Präsentation) · still und unbeleuchtet = kein bewerteter Match geliefert · Flackern = schwache Evidenz · kreisende Striche = durch den Sweep abgedeckt, unbewertet · blasse Lücke = keine Evidenz geliefert · fließender Strahl = nächste präsentierte Rolle, keine Wahl · kreisende Ringe = was für die fokussierte Rolle aussteht",
      reveal: "EVIDENZ ZEIGEN",
      hide: "EVIDENZ AUSBLENDEN",
      revealAll: "ALLE EVIDENZ ZEIGEN",
      hideAll: "ALLE EVIDENZ AUSBLENDEN",
      ids: "IDS",
      composition: "ANFORDERUNGSZUSAMMENSETZUNG",
      hoverHint: "Rolle überfahren für ihr Ausstehend-Feld · klicken zum Öffnen",
      reading: "{title} bei {organization}: Pool-Resonanz {resonance} (Präsentation). {matched} von {total} Anforderungen mit bewerteter Evidenz erfüllt, {unresolved} ungelöst, {covered} durch den Sweep abgedeckt ohne Bewertung, {none} ohne gelieferte Evidenz.",
      why: "WARUM AUSSTEHEND",
      whyHide: "AUSBLENDEN",
      galaxy: "Nebel = eine Pool-Organisation (Farbe nur Identität) · sein Licht = gelieferte Organisationsresonanz (Präsentation) · Faden vom Kern = bewertete Evidenz, heller bei mehr Pool-Resonanz; kein Faden = kein bewerteter Match · Monde um eine Rolle = ihre Anforderungen, ein Körper je Anforderung, in Zustandsreihenfolge",
      details: "DETAILS",
      detailsHide: "DETAILS AUSBLENDEN"
    },

    syntx: {
      title: "JOB-FELD",
      toggle: "⬡ JOB-FELD",
      selector: { group: "SYNTX-FELD", capability: "◈ CAPABILITY-FELD", capabilityGated: "PERSON braucht keinen Job: wähle ihn oben. PERSON × JOB braucht eine gültige Rolle als gewählten Job — öffne eine im Job-Feld, dann ALS JOB WÄHLEN" },
      gate: {
        label: "CAPABILITY-FELD GESCHLOSSEN",
        reason: {
          NONE: "PERSON × JOB braucht eine gültige Rolle als gewählten Job: keine ist gewählt",
          CHECKING: "PERSON × JOB braucht eine gültige Rolle als gewählten Job: der gewählte Job wird noch geprüft",
          INVALID: "PERSON × JOB braucht eine gültige Rolle als gewählten Job: der gewählte Job ist nicht gültig",
          JOB: "JOB untersucht nur den Job: kein Personenfeld in diesem Modus"
        },
        way: {
          NONE: "Weg: PERSON braucht keinen Job — oben wählen; PERSON × JOB braucht eine im Job-Feld geöffnete Rolle, dann ALS JOB WÄHLEN",
          CHECKING: "Weg: die Prüfung abwarten; es öffnet sich, sobald der Job gültig ist",
          INVALID: "Weg: im Job-Feld eine gültige Rolle öffnen, dann ALS JOB WÄHLEN",
          JOB: "Weg: PERSON oder PERSON × JOB als Untersuchungsgrenze wählen"
        }
      },
      exit: "← CAPABILITY-FELD",
      observation: { FIELD: "FELD", ORGANIZATION: "ORGANISATION", ROLE: "ROLLE", REQUIREMENT: "ANFORDERUNG" },
      returnLabel: "ZURÜCK",
      keys: "Esc kehrt zurück · Enter wählt · Tab wechselt zwischen Trägern",
      pools: "POOLS",
      poolsHide: "POOLS VERBERGEN",
      jobScope: {
        label: "GEWÄHLTER JOB",
        labelUnused: "JOB",
        none: "KEIN JOB GEWÄHLT",
        checking: "JOB WIRD GEPRÜFT …",
        invalid: "JOB UNGÜLTIG",
        select: "◎ ALS JOB WÄHLEN",
        selected: "✓ GEWÄHLTER JOB",
        clear: "× JOB ENTFERNEN",
        clearHint: "Gewählten Job entfernen: ANALYZE ist gesperrt, bis wieder ein Job gewählt ist (Quellen und Analysen bleiben)",
        open: "Den gewählten Job im Job-Feld öffnen",
        choose: "Einen Job im Job-Feld wählen (Rolle öffnen, dann ALS JOB WÄHLEN)",
        openRoleHint: "Öffne eine Rolle, um sie als Job zu wählen.",
        roleOpened: "GEÖFFNETE ROLLE · nicht der gewählte Job",
        roleOpenedSelected: "GEÖFFNETE ROLLE · der gewählte Job"
      },
      levelLine: { label: "EBENE", names: { FIELD: "POOL", ORGANIZATION: "ORGANISATION", ROLE: "ROLLE", REQUIREMENT: "ANFORDERUNG" } },
      legacyToggle: { hide: "AUSBLENDEN", show: "EINBLENDEN" },
      investigation: {
        group: "UNTERSUCHUNGSGRENZE",
        modes: { PERSON: "PERSON", PERSON_X_JOB: "PERSON × JOB", JOB: "JOB" },
        hints: {
          PERSON: "Die Person und ihre Fähigkeiten, unabhängig von einer Stelle: nur die Kandidatendokumente, kein Job-Scope",
          PERSON_X_JOB: "Die Person im Scope des gewählten Jobs: braucht einen gewählten Job",
          JOB: "Der gewählte Job selbst, unabhängig von einer Person: aus der Pool-Quelle gelesen, keine Analyse, kein Gemini"
        },
        personScope: "KEIN JOB-SCOPE · PERSON",
        personScopeKept: "gewählter Job nicht verwendet: ",
        jobNotAnalyzable: "JOB liest den Job selbst: in diesem Modus gibt es keine Dokumentanalyse.",
        capabilityGatedJob: "JOB untersucht nur den Job: das Capability-Feld enthält in diesem Modus keine Person",
        state: { PERSON: "PERSON · KEIN JOBVERGLEICH", JOB: "JOB · STRUKTUR AUS DER POOL-QUELLE" },
        field: {
          PERSON: "PERSON untersucht die Person ohne Job-Scope: die Pools bleiben lesbar, keine Analyse wird mit einem Job verglichen.",
          JOB: "JOB untersucht den gewählten Job selbst: öffne ihn und lies seine Struktur (keine Person, kein Gemini)."
        },
        result: { PERSON: "PERSON · OHNE JOB-SCOPE", PERSON_X_JOB: "PERSON × JOB" },
        withheld: {
          RESOLVING: "UNTERSUCHUNGSGRENZE DER ANALYSE WIRD GELESEN · NOCH KEIN VERGLEICH",
          PERSON: "Diese Analyse ist eine PERSON-Analyse: kein Jobvergleich.",
          UNRESOLVED: "Untersuchungsgrenze dieser Analyse nicht auflösbar: kein Jobvergleich.",
          OTHER_POOL: "Kein Vergleich über Job-Scopes hinweg: diese Analyse wurde untersucht im Pool"
        },
        openAnalysisPool: "⬡ POOL DER ANALYSE ÖFFNEN"
      },
      coverage: {
        toggle: "◎ B2-ABDECKUNG",
        hide: "B2-ABDECKUNG VERBERGEN",
        title: "B2 · ABDECKUNG DER GEWÄHLTEN ROLLE",
        orientation: "Unbestätigte Namensabdeckung der gewählten Rolle durch die Capability-Vorschläge dieser Analyse: Zählungen, nie ein Score.",
        binding: "BINDUNG",
        requirements: "ANFORDERUNGEN DER ROLLE",
        proposals: "CAPABILITY-VORSCHLÄGE",
        authority: "AUTORITÄT",
        covered: "ABGEDECKT",
        notCovered: "NICHT ABGEDECKT",
        weak: "SCHWACH · HEURISTIK",
        basis: { EXACT: "exakter Name", ALIAS: "Alias", COMPOSITE_CONSTITUENT: "Bestandteil eines Komposits", TOKEN_CONTAINMENT: "Token-Enthaltensein (Heuristik)" },
        by: "durch",
        covers: "deckt ab",
        coversNothing: "deckt keine Anforderung dieser Rolle ab",
        evidence: "wörtlich aus den Kandidatendokumenten",
        counts: { requirements: "Anforderungen", covered: "abgedeckt", notCovered: "nicht abgedeckt", proposals: "Vorschläge" },
        notCoveredStatement: "Nicht abgedeckt ist kein Urteil: kein Capability-Vorschlag dieser Analyse nennt diese Anforderung.",
        countsStatement: "Zählungen, kein Score: kein Ranking, keine bestätigte Capability-Requirement-Relation (NOT_EVALUATED).",
        states: {
          LOADING: "B2-ABDECKUNG WIRD GELESEN …",
          NO_ANALYSIS: "Keine Analyse auf Sicht: oben eine vorhandene Untersuchung dieser Rolle wählen oder im Capability-Feld eine Quelle hinzufügen und ANALYZE ausführen.",
          NOT_SCOPED: "Diese Analyse ist eine PERSON-Analyse: kein Jobvergleich.",
          SCOPE_MISMATCH: "Analyse gehört zu einem anderen Job",
          SCOPE_DRIFT: "Der gewählte Job hat sich seit dieser Analyse verändert (Scope-Drift): kein Vergleich.",
          SCOPE_UNAVAILABLE: "Der Job dieser Analyse ist nicht mehr verfügbar (Pool nicht ACTIVE oder Rolle nicht auflösbar).",
          LINEAGE_INVALID: "Die Herkunftskette dieser Analyse hält nicht (Referenz, Läufe und Auftrag passen nicht zusammen): kein Vergleich.",
          NOT_FOUND: "Diese Analyse hat keine Capability-Vorschläge zum Vergleich (keine Sweep-Referenz).",
          NOT_PROVISIONED: "Die Job-Pool-Persistenz ist auf dieser Datenbank nicht eingerichtet.",
          FAILED: "Die B2-Abdeckung konnte nicht gelesen werden."
        }
      },
      structure: {
        toggle: "⬡ JOB-STRUKTUR",
        hide: "JOB-STRUKTUR VERBERGEN",
        title: "JOB · STRUKTUR",
        orientation: "Der gewählte Job, wie ihn die Pool-Quelle deklariert: unabhängig von einer Person, ohne Gemini.",
        role: "ROLLE",
        requirements: "ANFORDERUNGEN",
        findings: "STRUKTURBEFUNDE",
        authority: "AUTORITÄT",
        responsibility: "Verantwortung",
        notDeclared: "NICHT DEKLARIERT",
        declared: "deklariert",
        typeDefault: "Typ nicht deklariert · kanonische Vorgabe",
        source: "Pool-Quelle",
        findingsStatement: "Befunde sind Tatsachen der Deklaration, keine Bewertung.",
        noFindings: "Keine Strukturbefunde in dieser Deklaration.",
        authorityStatement: "Gelesen aus den deklarierten Pool-Feldern und ihrer kanonischen Validierung: keine Interpretation, keine Person, kein Gemini.",
        findingCodes: {
          ROLE_DESCRIPTION_MISSING: "Rollenbeschreibung fehlt",
          ROLE_SENIORITY_UNDECLARED: "Seniorität nicht deklariert",
          ROLE_DOMAIN_FOCUS_UNDECLARED: "Domänenfokus nicht deklariert",
          ROLE_RESPONSIBILITY_NOT_DECLARED: "Verantwortung nicht deklariert",
          ROLE_WITHOUT_REQUIRED_REQUIREMENT: "keine REQUIRED-Anforderung",
          REQUIREMENT_NECESSITY_UNDECLARED: "Notwendigkeit nicht deklariert",
          REQUIREMENT_LEVEL_UNRESOLVED: "Level nicht aufgelöst",
          REQUIREMENT_MATCHING_INELIGIBLE: "nicht für den Abgleich geeignet",
          REQUIREMENT_MATCHING_ELIGIBILITY_UNKNOWN: "Eignung für den Abgleich unbekannt",
          REQUIREMENT_TYPE_UNDECLARED: "Typ nicht deklariert",
          REQUIREMENT_ZERO_WEIGHT: "Gewicht null",
          REQUIREMENT_DOMAIN_UNDECLARED: "Domäne nicht deklariert",
          REQUIREMENT_NAME_COLLISION: "Namenskollision"
        },
        states: {
          LOADING: "JOB-STRUKTUR WIRD GELESEN …",
          UNAVAILABLE: "Die Job-Struktur ist nicht verfügbar (unbekannter Pool, fremde Rolle oder Pool nicht ACTIVE).",
          LINEAGE_INVALID: "Die Herkunftskette dieses Jobs hält nicht: keine Struktur.",
          NOT_PROVISIONED: "Die Job-Pool-Persistenz ist auf dieser Datenbank nicht eingerichtet.",
          FAILED: "Die Job-Struktur konnte nicht gelesen werden."
        }
      },
      gemini: {
        toggle: "GEMINI OUTPUT",
        hide: "GEMINI OUTPUT VERBERGEN",
        title: "GEMINI OUTPUT",
        orientation: "Lesender Inspector des gespeicherten Gemini-Austauschs dieser Analyse: nichts wird gestartet, nichts gespeichert.",
        token: "INSPECTOR-TOKEN",
        tokenHint: "Nur für dieses Panel im Speicher und pro Lesezugriff gesendet; beim Schließen verworfen.",
        read: "LESEN",
        reading: "WIRD GELESEN …",
        analysis: "Analyse",
        job: "Auftrag",
        views: { SCOPE: "UNTERSUCHUNGS-SCOPE", ORIGINAL: "ORIGINALANTWORT", PROCESSING: "PARSER · VERIFIKATION · CONVERGENCE", PROJECTION: "PROJEKTION", EXCHANGES: "AUSTAUSCHE DES AUFTRAGS" },
        mode: "Modus",
        scopeText: "Scope-Text (nur im System-Prompt, nie Evidence)",
        unscoped: "UNSCOPED · kein Untersuchungs-Scope in diesem Lauf",
        scopeNotRetained: "Scope-Text NOT_RETAINED · nur Hash",
        notRetained: "NOT_RETAINED",
        notRetainedStatement: "Die Originalantwort wurde nicht aufbewahrt (nie gespeichert, abgelaufen oder gelöscht). An ihrer Stelle wird kein verarbeitetes Ergebnis gezeigt.",
        verbatim: "unverändert wie empfangen",
        parser: "Parser-Ergebnis (geparst und schemageprüft, nicht der Originaltext)",
        verification: "Evidence-Verifikation",
        convergence: "Convergence",
        projection: "Projektion (das Lesemodell des Capability-Felds)",
        noProjection: "keine Projektion",
        exchangesEmpty: "Kein archivierter Austausch für diesen Auftrag.",
        reused: "LAUF WIEDERVERWENDET",
        reusedStatement: "Der Discovery-Lauf ist älter als dieser Auftrag: er wurde wiederverwendet, dieser Auftrag hat Gemini nicht neu aufgerufen. Gezeigt wird die Antwort, aus der der Lauf entstand.",
        attemptOf: "empfangen für Auftrag",
        readExchanges: "AUSTAUSCHE LESEN",
        states: {
          CLOSED: "Inspector geschlossen: ausgeschaltet, nicht konfiguriert oder das Token ist falsch.",
          NOT_FOUND: "Keine Sweep-Referenz zu dieser Analyse: nichts zu inspizieren.",
          LINEAGE_INVALID: "Der gespeicherte Austausch gehört nicht zu diesem Lauf (Herkunft ungültig): es wird nichts gezeigt.",
          FAILED: "Die Inspektion konnte nicht gelesen werden."
        },
        noGemini: "Kein Gemini-Aufruf in diesem Modus.",
        noAnalysis: "Keine Analyse zum Inspizieren: zuerst ANALYZE ausführen."
      },
      noPool: {
        status: "JOB-FELD // UNGEBUNDEN",
        title: "KEIN JOB-POOL GEÖFFNET",
        reason: "Dieses Feld wartet auf einen ausdrücklich geöffneten Job-Pool.",
        orientation: "Einen hochgeladenen Pool in POOLS öffnen · oder einen über + AUFNAHME hochladen",
        orientationEmpty: "Noch kein Pool hochgeladen · einen über + AUFNAHME hochladen"
      },
      support: {
        SUPPORTED: "GESTÜTZT (BEWERTETE EVIDENZ)",
        WEAK: "SCHWACHE STÜTZUNG (BEWERTET, DÜNN)",
        SWEEP_ONLY: "VOM SWEEP ABGEDECKT (UNBEWERTET)",
        OPEN: "KEINE GELIEFERTE STÜTZUNG (OFFEN)",
        UNREAD: "KEIN MATCHING GELESEN"
      },
      relation: {
        contains: "enthält",
        requires: "erfordert",
        supports: "stützt",
        weakly_supports: "stützt schwach",
        covers_unscored: "deckt ab (unbewertet)",
        missing_support: "keine gelieferte Stützung",
        pending_evaluation: "kanonische Bewertung ausstehend"
      },
      source: "QUELLE",
      sourceUnresolved: "QUELLENTITEL IN DIESER ANALYSE NICHT AUFGELÖST",
      sourceNotRead: "ANALYSEQUELLEN NICHT GELESEN",
      quote: "ZITAT",
      capabilityReference: "FÄHIGKEITSREFERENZ",
      constituent: "Bestandteil",
      basis: "Basis",
      contribution: "Beitrag",
      confidence: "Konfidenz",
      weight: "Gewicht",
      level: "Niveau",
      necessity: "Notwendigkeit",
      location: "Fundstelle",
      hint: "Hinweis",
      sweepStatus: "unbewertet · Quellenabgleich verifiziert · nicht kanonisch bewertet",
      inspect: "PRÜFEN",
      close: "SCHLIESSEN",
      texts: {
        scored: "Bewertete Evidenz stützt diese Anforderung innerhalb des gelieferten Präsentations-Matchings; sie ist keine Zertifizierung.",
        weak: "Evidenz existiert, trägt aber nur begrenzt zur Matching-Stützung bei.",
        sweep: "Ein Capability-Sweep-Vorschlag deckt diese Anforderung mit einem quellenverifizierten Zitat ab; er ist nicht bewertet und nicht kanonisch evaluiert.",
        missing: "Für diese Anforderung ist in der aktuellen Analyse keine gelieferte Stützung verfügbar.",
        pending: "Eine autoritative Bewertung dieser Relation hat nicht stattgefunden."
      },
      authority: "Präsentation · Autorität NONE · keine kanonische Bewertung · keine Entscheidung · keine HR-Empfehlung",
      resonance: "POOL-RESONANZ (PRÄSENTATION)",
      rank: "gelieferter Rang",
      requirements: "ANFORDERUNGEN",
      roles: "ROLLEN",
      organizations: "ORGANISATIONEN",
      boundary: "GRENZE",
      boundaryOrientation: "Markiert die Governance-, Autoritäts- und Bewertungsgrenzen dieses Feldzustands.",
      boundaryHide: "GRENZE VERBERGEN",
      matching: "PRÄSENTATIONS-MATCHING",
      manifest: {
        pool: "JOBPOOL",
        organization: "ORGANISATION",
        organizationCosmos: "ORGANISATIONS-KOSMOS",
        focusOrganization: "Klicken, um diese Organisation zu fokussieren",
        role: "ROLLE",
        roleCosmos: "ROLLEN-KOSMOS",
        requirement: "ANFORDERUNG",
        nucleus: "ANFORDERUNGS-KERN",
        returnToField: "ZURÜCK ZUM JOBPOOL",
        returnToOrganization: "ZURÜCK ZUM ORGANISATIONS-KOSMOS",
        returnToRole: "ZURÜCK ZUM ROLLEN-KOSMOS",
        evidence: "EVIDENZ",
        relations: "EVIDENZRELATIONEN",
        document: "DOKUMENT",
        scored: "BEWERTET",
        unscored: "UNBEWERTET · SWEEP-VORSCHLAG",
        matchingRead: "MATCHING GELESEN",
        matchingNotRead: "KEIN MATCHING GELESEN",
        evidenceCount: "EVIDENZ"
      },
      summary: {
        field: "Job-Pool {poolName}, Version {poolVersion}, {poolStatus}: {organizationCount} {organizations} mit {roleCount} {roles}. {matching}",
        organization: "Organisation {organizationName} enthält {roleCount} {roles}: {roleTitles}.",
        role: "Rolle {roleTitle} bei {organizationName} erfordert {requirementCount} {requirements}: {supported} mit bewerteter Stützung, {weak} mit schwacher Stützung, {sweepOnly} nur durch einen unbewerteten Sweep-Vorschlag abgedeckt, {open} ohne gelieferte Stützung, {unread} ohne gelesenes Matching. {pending}",
        requirement: "Anforderung {requirementName} der Rolle {roleTitle}: {support}; {traceCount} {traces} aus {sourceCount} {sources}. {aperture}",
        support: {
          SUPPORTED: "durch bewertete Evidenz gestützt",
          WEAK: "durch bewertete Evidenz schwach gestützt",
          SWEEP_ONLY: "nur durch einen unbewerteten Sweep-Vorschlag abgedeckt",
          OPEN: "ohne gelieferte Stützung",
          UNREAD: "ohne gelesenes Matching"
        },
        pendingEvaluation: "Die kanonische Bewertung ist für jede Anforderung dieser Rolle ausstehend.",
        apertureOpen: "Eine Prüfapertur ist geöffnet.",
        matchingRead: "Für diesen Pool wurde ein Präsentations-Matching gelesen.",
        matchingNotRead: "Es wurde kein Präsentations-Matching gelesen.",
        nouns: {
          organizations: { one: "Organisation", other: "Organisationen" },
          roles: { one: "Rolle", other: "Rollen" },
          requirements: { one: "Anforderung", other: "Anforderungen" },
          traces: { one: "Evidenzspur", other: "Evidenzspuren" },
          sources: { one: "Quelle", other: "Quellen" }
        }
      },
      stale: {
        ORGANIZATION: "ORGANISATIONS-ID NICHT IN DIESEM POOL",
        ROLE: "ROLLEN-ID NICHT IN DIESEM POOL",
        REQUIREMENT: "ANFORDERUNGS-ID NICHT IN DIESER ROLLE"
      },
      legacyDisclosure: {
        title: "LEGACY-PRÄSENTATION · NICHT B2",
        source: "Quelle: Präsentations-Matching JOB_POOL_PRESENTATION_MATCHING_V1 · zuerst die Legacy-Analyse ohne Job-Scope (nicht deterministisch), danach Sweep-Vorschläge.",
        reach: "Reichweite: der ganze Pool.",
        limits: "Grenzen: Präsentation · keine Autorität · nicht B2 · keine Relation Fähigkeit → Anforderung · keine Entscheidung."
      },
      nonClaims: "PRESENTED != EVALUATED · UPLOADED != SELECTED · RANKED != RECOMMENDED · MISSING != GAP DECISION · COVERED != SCORED · PENDING != MISSING CAPABILITY · POOL ROLE != INFERRED ROLE"
    },
    pxjFirst: {
      title: "B2 · ANFORDERUNGSABDECKUNG",
      orientation: "Die Anforderungen der gewählten Rolle in Pool-Reihenfolge, jeweils mit dem Fähigkeitsvorschlag dieser Analyse, der sie nennt.",
      boundary: ["Namensabdeckung durch einen Fähigkeitsvorschlag", "nicht bewertet", "Relation NICHT BEWERTET", "keine Kompetenzprüfung", "keine Einstellungsentscheidung"],
      binding: "BINDUNG",
      analysis: "Analyse",
      requirements: "ANFORDERUNGEN · POOL-REIHENFOLGE",
      proposals: "FÄHIGKEITSVORSCHLÄGE DIESER ANALYSE",
      covered: "ABGEDECKT",
      notCovered: "NICHT ABGEDECKT",
      weak: "SCHWACH · HEURISTIK",
      basis: { EXACT: "exakter Name", ALIAS: "Alias", COMPOSITE_CONSTITUENT: "Bestandteil eines Komposits", TOKEN_CONTAINMENT: "Token-Enthaltensein (Heuristik)" },
      by: "durch",
      notCoveredStatement: "Kein Fähigkeitsvorschlag dieser Analyse nennt diese Anforderung.",
      counts: { requirements: "Anforderungen", covered: "abgedeckt", notCovered: "nicht abgedeckt" },
      quoteVerified: "Quellabgleich verifiziert · keine Kompetenzprüfung",
      quoteNotInProjection: "Zitat nicht in der Projektion",
      proposalNotInProjection: "Vorschlag nicht in dieser Projektion",
      sourceNotResolved: "Quelle nicht aufgelöst",
      titleNotDelivered: "Titel nicht geliefert",
      hashNotDelivered: "Hash nicht geliefert",
      switchMode: "WECHSELN ZU",
      selectRole: "◎ DIESE ROLLE WÄHLEN",
      lineage: {
        "L-1": "ihre Bindung ist nicht diese Analyse, der gewählte Job und der eigene Job der Analyse",
        "L-2": "ihr Discovery-Run ist nicht der dieser Analyse",
        "L-3": "ihr Scope-Hash ist nicht der dieser Analyse",
        "L-4": "ihre Vorschläge sind nicht die Vorschläge dieser Analyse"
      },
      states: {
        NO_ANALYSIS: "Für den gewählten Job ist noch keine Analyse auf Sicht. Zwei Wege führen zu einer:",
        RESULT_LOADING: "PERSISTIERTES ERGEBNIS WIRD GELESEN …",
        RESULT_NOT_FOUND: "Analyse nicht gefunden: kein Ergebnis, keine Demo-Daten.",
        RESULT_FAILED: "Das Ergebnis dieser Analyse ist nicht lesbar: nichts wird gezeigt.",
        BOUNDARY_RESOLVING: "UNTERSUCHUNGSGRENZE WIRD GELESEN …",
        BOUNDARY_UNRESOLVED: "Die Untersuchungsgrenze dieser Analyse ist nicht auflösbar: keine Vorschläge, keine Abdeckung.",
        BOUNDARY_NOT_FOUND: "Für diese Analyse ist keine Untersuchungsgrenze verzeichnet: keine Vorschläge, keine Abdeckung.",
        BOUNDARY_FAILED: "Die Untersuchungsgrenze dieser Analyse ist nicht lesbar: keine Vorschläge, keine Abdeckung.",
        MODE_MISMATCH: "Diese Analyse lief in einem anderen Untersuchungsmodus: nichts wird gezeigt, nichts schaltet von selbst um.",
        ROLE_MISMATCH: "Diese Analyse gehört zu einem anderen Job als dem gewählten: weder ihre Vorschläge noch eine Abdeckung werden gezeigt.",
        ROLE_NONE: "Kein Job gewählt: Diese Analyse gehört zum Job unten.",
        JOB_CHECKING: "GEWÄHLTER JOB WIRD GEPRÜFT …",
        JOB_INVALID: "Der gewählte Job ist ungültig: weder Vorschläge noch Abdeckung dieser Analyse werden gezeigt.",
        PERSON_RESULT: "PERSON · ohne Job-Scope.",
        NO_PROJECTION: "Diese Analyse hat keine Fähigkeitsvorschläge: keine Abdeckung.",
        COVERAGE_LOADING: "B2-ABDECKUNG WIRD GELESEN …",
        COVERAGE_NOT_SCOPED: "Diese Analyse hat keinen Job-Scope: keine Abdeckung.",
        COVERAGE_SCOPE_MISMATCH: "Die Analyse gehört zu einem anderen Job: keine Abdeckung.",
        COVERAGE_SCOPE_DRIFT: "Der gewählte Job hat sich seit dieser Analyse geändert (Scope-Drift): keine Abdeckung.",
        COVERAGE_SCOPE_UNAVAILABLE: "Der Job dieser Analyse ist nicht mehr verfügbar: keine Abdeckung.",
        COVERAGE_LINEAGE_INVALID: "Die Abstammung dieser Analyse hält nicht: keine Abdeckung.",
        COVERAGE_NOT_FOUND: "Für diese Analyse gibt es keine Vorschlagsreferenz: keine Abdeckung.",
        COVERAGE_NOT_PROVISIONED: "Die Job-Pool-Persistenz ist auf dieser Datenbank nicht eingerichtet: keine Abdeckung.",
        COVERAGE_FAILED: "Die B2-Abdeckung ist nicht lesbar: keine Abdeckung.",
        LINEAGE_MISMATCH: "Die Abdeckung gehört nicht zu dieser Analyse: Vorschläge sichtbar, keine Abdeckung.",
        AVAILABLE: "B2-Abdeckung der gewählten Rolle"
      },
      modeAnalysis: "lief in",
      modeInterface: "Oberfläche",
      jobOfAnalysis: "Job dieser Analyse",
      reason: "Grund",
      selectedJob: "gewählter Job",
      ways: { existing: "(a) Eine vorhandene Untersuchung dieser Rolle wählen:", analyze: "(b) Unter WISSEN EINSPEISEN (links) eine Quelle hinzufügen und ANALYZE ausführen." },
      picker: {
        open: "◎ VORHANDENE UNTERSUCHUNG DIESER ROLLE WÄHLEN",
        close: "VORHANDENE UNTERSUCHUNGEN AUSBLENDEN",
        title: "VORHANDENE UNTERSUCHUNGEN · DIESE ROLLE · PERSON × JOB",
        loading: "LESE DIE VORHANDENEN ANALYSEN UND IHRE GRENZEN …",
        failed: "Die Liste der Analysen ist nicht lesbar: nichts wird angeboten.",
        empty: "Keine vorhandene Untersuchung dieser Rolle in PERSON × JOB.",
        scope: (considered: number, listed: number, unreadable: number) => `Geprüft: die neuesten ${considered} von ${listed} Analysen${unreadable > 0 ? ` · ${unreadable} mit nicht lesbarer Grenze, nicht angeboten` : ""}. Angeboten nur mit gleichem Modus und genau diesem Job.`,
        id: "Analyse",
        time: "erstellt",
        validation: "Validierung",
        mode: "Modus",
        job: "gebundener Job",
        binding: "Bindung",
        choose: "ÖFFNEN",
        onView: "AUF SICHT",
        utc: "UTC"
      }
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
