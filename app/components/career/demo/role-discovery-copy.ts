import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { RoleLexicalStatus } from "../../../../lib/career/job-pool/pool-role-discovery";
import type { InvestigationStatus, InvestigationTaskStatus } from "../../../../lib/career/ui/semantic-investigation";

/**
 * Copy of the role discovery panel (GELB stage 2, additive, recovery §8), EN and DE. Kept beside its components, like
 * navigation-copy.ts: the shared copy table (lib/career/view-model/sil-language.ts) stays unchanged. Every relation is named as
 * lexical — never "fits", never "semantic"; the semantic state is always stated.
 */
type Count = (n: number) => string;
export interface RoleDiscoveryCopy {
  entry: string;
  entryHint: string;
  title: string;
  header: string;
  close: string;
  poolsTitle: string;
  poolsHint: string;
  poolsLoading: string;
  poolsEmpty: string;
  /** GELB decision on the DLL-full path review, point 2: a real action beside the empty-pools text (an existing field
   *  switch, the same as the SYNTX field selector's own toggle — no new URL parameter). */
  poolsGoToJobField: string;
  poolsNotProvisioned: string;
  poolsFailed: string;
  poolInactive: (status: string) => string;
  poolRoles: Count;
  poolsLimit: (max: number) => string;
  discover: string;
  released: string;
  states: Record<"IDLE" | "LOADING" | "NOT_PERSON" | "PROJECTION_ABSENT" | "ANALYSIS_NOT_FOUND" | "POOLS_REQUIRED" | "POOLS_INVALID" | "NOT_PROVISIONED" | "FAILED", string>;
  boundaryUnresolved: (reason: string) => string;
  poolNotFound: (id: string) => string;
  poolInactiveRead: (id: string) => string;
  failedCode: (code: string) => string;
  /** RI-START O-START-5 / F-RI-1 (PINK §3.76): while no investigation of this release is known, `tail` closes the pre-run
   *  sentence as `notStarted` — never "never ran" globally, only that none is named in this view (O-RI-3). Once one IS known
   *  (stored), the whole line is `stored` / `storedUnknownCache` instead — the plan's own numbers, freshly read after that
   *  investigation (never the pre-run ones), with its real status; "not executed" never stands beside a completed status. */
  semantic: {
    ENGINE_NOT_SPECIFIED: (calls: string, pairs: string, tail: string) => string;
    PLANNED: (cached: string, pairs: string, calls: string, tail: string) => string;
    CACHE_UNAVAILABLE: (issue: string, tail: string) => string;
    CACHE_CORRUPT: (issue: string, tail: string) => string;
    notStarted: string;
    stored: (cached: string, pairs: string, status: string) => string;
    storedUnknownCache: (status: string) => string;
  };
  /** RI-CONTROL: why an explicit start of the semantic check is not offered (the server's start control, or the cache). */
  startUnavailable: Record<"NOT_CONFIGURED" | "PROVIDER_NOT_AUTHORIZED" | "CACHE", string>;
  /** RI-START: the explicit start of the semantic check (stand-in only) and its stored state — never a relation, never a ranking. */
  run: {
    title: string;
    hint: (max: number) => string;
    pick: string;
    selection: (picked: number, max: number, calls: string, pending: string) => string;
    none: string;
    limit: (max: number) => string;
    start: string;
    running: (roles: number, calls: number) => string;
    standIn: string;
    summary: (status: string) => string;
    status: Record<InvestigationStatus, string>;
    replayed: string;
    budget: string;
    task: Record<InvestigationTaskStatus, string>;
    taskCounts: (pairs: number, stored: number) => string;
    relationsHidden: string;
    refused: Record<string, string>;
    refusedOther: string;
    callsChanged: (needed: number, confirmed: number) => string;
    tooMany: (max: number) => string;
    failed: string;
    notFound: string;
    loading: string;
    planAtRead: (cached: string, pairs: string, calls: string) => string;
    reread: string;
    roleTask: (status: string) => string;
  };
  scope: (pools: number, roles: number, requirements: number, proposals: number) => string;
  groups: Record<RoleLexicalStatus, string>;
  groupRoles: Count;
  show: string;
  hide: string;
  roleCounts: (nameRelated: number, requirements: number, weak: number, without: number) => string;
  roleRequired: (required: number, without: number) => string;
  /** RD-DETAIL: the trace of one role, requirement by requirement (requirement → lexical basis → proposal → quote → source). */
  detail: {
    open: string;
    shut: string;
    semantic: string;
    basis: Record<"NAME_EXACT" | "NAME_ALIAS" | "NAME_COMPOSITE_CONSTITUENT" | "WEAK_TOKEN_CONTAINMENT", (constituent: string | null) => string>;
    proposal: string;
    source: string;
    quoteSilent: string;
    noQuote: string;
    openTitle: (count: number) => string;
    openNone: string;
    level: (necessity: string, level: string) => string;
    /** RD-HANDOVER: the role as the job of a PERSON × JOB investigation — no analysis carried over, nothing started. */
    investigate: string;
    investigateHint: string;
  };
}

const n = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const formatCount = n;

export const ROLE_DISCOVERY_COPY: Readonly<Record<SilLocale, RoleDiscoveryCopy>> = {
  en: {
    entry: "DISCOVER JOBS",
    entryHint: "Roles in the job pools you release · name relation, lexical",
    title: "ROLE DISCOVERY · RELEASED POOLS",
    header: "Name relation · lexical · not semantic · not scored · no ranking",
    close: "CLOSE",
    poolsTitle: "JOB POOLS · RELEASE EXPLICITLY",
    poolsHint: "Only the pools you tick are read. Nothing is preselected and there is no “all”.",
    poolsLoading: "Reading the uploaded job pools …",
    poolsEmpty: "No job pool is uploaded. Upload one in the Job Field.",
    poolsGoToJobField: "GO TO JOB FIELD",
    poolsNotProvisioned: "Job pool persistence is not provisioned on this server.",
    poolsFailed: "The uploaded job pools could not be read.",
    poolInactive: status => `${status} · not releasable`,
    poolRoles: count => `${n(count)} roles`,
    poolsLimit: max => `At most ${max} pools per discovery.`,
    discover: "DISCOVER JOBS",
    released: "RELEASED",
    states: {
      IDLE: "No pool released. Tick pools and start DISCOVER JOBS.",
      LOADING: "Reading the role discovery of the released pools …",
      NOT_PERSON: "Role discovery reads PERSON analyses only. This analysis is not a PERSON analysis.",
      PROJECTION_ABSENT: "This analysis has no capability proposal projection; there is nothing to relate.",
      ANALYSIS_NOT_FOUND: "The server knows no analysis with this id.",
      POOLS_REQUIRED: "No pool was named. Release at least one pool.",
      POOLS_INVALID: "The released pool list is not valid.",
      NOT_PROVISIONED: "Job pool persistence is not provisioned on this server.",
      FAILED: "The role discovery could not be read."
    },
    boundaryUnresolved: reason => `The analysis's investigation boundary is not resolved (${reason}).`,
    poolNotFound: id => `The released pool ${id} does not exist.`,
    poolInactiveRead: id => `The released pool ${id} is not ACTIVE.`,
    failedCode: code => `Code: ${code}`,
    semantic: {
      ENGINE_NOT_SPECIFIED: (calls, pairs, tail) => `Semantic check: not executed · would need ${calls} calls for ${pairs} pairs · ${tail}`,
      PLANNED: (cached, pairs, calls, tail) => `Semantic check: not executed · ${cached} of ${pairs} pairs in the relation cache · would need ${calls} calls · ${tail}`,
      CACHE_UNAVAILABLE: (issue, tail) => `Semantic check: not executed · relation cache unavailable (${issue}) · calls unknown · ${tail}`,
      CACHE_CORRUPT: (issue, tail) => `Semantic check: not executed · relation cache corrupt (${issue}) · calls unknown · ${tail}`,
      notStarted: "no investigation named in this view",
      stored: (cached, pairs, status) => `Relation cache: ${cached} of ${pairs} pairs · stand-in check: ${status}`,
      storedUnknownCache: status => `Relation cache: unavailable on this read · stand-in check: ${status}`
    },
    run: {
      title: "SEMANTIC CHECK · START EXPLICITLY",
      hint: max => `Pick the roles yourself, at most ${max}. Nothing is preselected; only this button starts the check.`,
      pick: "pick for the check",
      selection: (picked, max, calls, pending) => `Picked: ${picked} of at most ${max} roles · would need ${calls} calls for ${pending} open pairs`,
      none: "No role picked yet.",
      limit: max => `At most ${max} roles per start.`,
      start: "START SEMANTIC CHECK",
      running: (roles, calls) => `Semantic check running · ${n(roles)} roles · ${n(calls)} confirmed calls`,
      standIn: "Stand-in, no model",
      summary: status => `Semantic check: ${status}`,
      status: { PLANNED: "planned, not run yet", RUNNING: "running (stored state)", COMPLETED: "completed", PARTIAL: "partly completed", INTERRUPTED: "interrupted", FAILED: "failed" },
      replayed: "Same start as before: the stored state, nothing was run again.",
      budget: "Budget exhausted: the remaining roles were cancelled without a call.",
      task: { PENDING: "waiting", RUNNING: "running", SUCCEEDED: "completed", FAILED: "failed", BUDGET_EXHAUSTED: "budget exhausted", INTERRUPTED: "interrupted", CANCELLED: "cancelled, no call", CACHED: "from the relation cache, no call" },
      taskCounts: (pairs, stored) => `${n(pairs)} pairs · ${n(stored)} relations stored`,
      relationsHidden: "The relations themselves are not shown here.",
      refused: {
        ERR_SEMANTIC_ENGINE_NOT_CONFIGURED: "Not started: no check engine is configured on this server.",
        ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED: "Not started: the configured provider is not authorised.",
        ERR_INVESTIGATION_ROLES_INVALID: "Not started: the role choice is not valid.",
        ERR_INVESTIGATION_ROLE_NOT_IN_DISCOVERY: "Not started: a picked role is not part of this release's role discovery.",
        ERR_RELATION_CACHE_UNAVAILABLE: "Not started: the relation cache is not available."
      },
      refusedOther: "Not started.",
      callsChanged: (needed, confirmed) => `Not started: the server now names ${n(needed)} calls instead of the ${n(confirmed)} you confirmed. Re-read the plan and confirm again.`,
      tooMany: max => `Not started: at most ${max} roles per start.`,
      failed: "No readable answer from the server. Whether anything ran is unknown.",
      notFound: "The server knows no such investigation for this analysis.",
      loading: "Reading the stored investigation …",
      planAtRead: (cached, pairs, calls) => `Plan as read: ${cached} of ${pairs} pairs in the relation cache · would need ${calls} calls`,
      reread: "RE-READ PLAN",
      roleTask: status => `Semantic check of this role: ${status} · stand-in, no model`
    },
    startUnavailable: {
      NOT_CONFIGURED: "Start not available: no check engine is configured on this server.",
      PROVIDER_NOT_AUTHORIZED: "Start not available: the configured provider is not authorised.",
      CACHE: "Start not available while the relation cache cannot be read."
    },
    scope: (pools, roles, requirements, proposals) => `${n(pools)} pools · ${n(roles)} roles · ${n(requirements)} requirements · ${n(proposals)} capability proposals`,
    groups: {
      ALL_REQUIREMENTS_NAME_RELATED: "Every requirement with a name relation · lexical",
      PARTIAL_NAME_RELATED: "Some requirements with a name relation · lexical",
      WEAK_LEXICAL_ONLY: "Word matches only (weak)",
      NO_LEXICAL_RELATION: "No name relation",
      NO_REQUIREMENTS: "No requirements"
    },
    groupRoles: count => `${n(count)} roles`,
    show: "SHOW",
    hide: "HIDE",
    roleCounts: (related, requirements, weak, without) => `${n(related)} of ${n(requirements)} requirements with a name relation · ${n(weak)} word matches only (weak) · ${n(without)} open`,
    roleRequired: (required, without) => `required: ${n(required)} · of them open: ${n(without)}`,
    detail: {
      open: "TRACE",
      shut: "HIDE TRACE",
      semantic: "Semantic check of this role: not executed",
      basis: {
        NAME_EXACT: () => "Name relation: exact name · lexical",
        NAME_ALIAS: () => "Name relation: alias · lexical",
        NAME_COMPOSITE_CONSTITUENT: part => `Name relation: constituent “${part ?? "—"}” of a composite proposal · lexical`,
        WEAK_TOKEN_CONTAINMENT: () => "Word match only (weak) · lexical"
      },
      proposal: "Capability proposal",
      source: "Source",
      quoteSilent: "The quote does not name this requirement: the name relation rests on the proposal's name only.",
      noQuote: "No quote delivered.",
      openTitle: count => `OPEN REQUIREMENTS · NO NAME RELATION (${count})`,
      openNone: "None.",
      level: (necessity, level) => level.trim() === "" ? necessity : `${necessity} · level ${level}`,
      investigate: "INVESTIGATE THIS ROLE",
      investigateHint: "Selects this role as the job and switches to PERSON × JOB, without an analysis. Nothing is started: run ANALYZE there yourself or open an existing analysis for this role."
    }
  },
  de: {
    entry: "DISCOVER JOBS",
    entryHint: "Rollen in den Job-Pools, die du freigibst · Namensbezug, lexikalisch",
    title: "ROLLENFINDUNG · FREIGEGEBENE POOLS",
    header: "Namensbezug · lexikalisch · nicht semantisch · nicht bewertet · keine Rangfolge",
    close: "SCHLIESSEN",
    poolsTitle: "JOB-POOLS · AUSDRÜCKLICH FREIGEBEN",
    poolsHint: "Gelesen werden nur die Pools, die du ankreuzt. Nichts ist vorausgewählt, es gibt kein „alle“.",
    poolsLoading: "Die hochgeladenen Job-Pools werden gelesen …",
    poolsEmpty: "Es ist kein Job-Pool hochgeladen. Lade einen im Job Field hoch.",
    poolsGoToJobField: "ZUM JOB-FELD",
    poolsNotProvisioned: "Die Job-Pool-Persistenz ist auf diesem Server nicht eingerichtet.",
    poolsFailed: "Die hochgeladenen Job-Pools konnten nicht gelesen werden.",
    poolInactive: status => `${status} · nicht freigebbar`,
    poolRoles: count => `${n(count)} Rollen`,
    poolsLimit: max => `Höchstens ${max} Pools je Rollenfindung.`,
    discover: "DISCOVER JOBS",
    released: "FREIGEGEBEN",
    states: {
      IDLE: "Kein Pool freigegeben. Kreuze Pools an und starte DISCOVER JOBS.",
      LOADING: "Die Rollenfindung der freigegebenen Pools wird gelesen …",
      NOT_PERSON: "Die Rollenfindung liest nur PERSON-Analysen. Diese Analyse ist keine PERSON-Analyse.",
      PROJECTION_ABSENT: "Diese Analyse hat keine Projektion von Fähigkeitsvorschlägen; es gibt nichts in Bezug zu setzen.",
      ANALYSIS_NOT_FOUND: "Der Server kennt keine Analyse mit dieser ID.",
      POOLS_REQUIRED: "Es wurde kein Pool genannt. Gib mindestens einen Pool frei.",
      POOLS_INVALID: "Die Liste der freigegebenen Pools ist ungültig.",
      NOT_PROVISIONED: "Die Job-Pool-Persistenz ist auf diesem Server nicht eingerichtet.",
      FAILED: "Die Rollenfindung konnte nicht gelesen werden."
    },
    boundaryUnresolved: reason => `Die Untersuchungsgrenze der Analyse ist nicht aufgelöst (${reason}).`,
    poolNotFound: id => `Der freigegebene Pool ${id} existiert nicht.`,
    poolInactiveRead: id => `Der freigegebene Pool ${id} ist nicht ACTIVE.`,
    failedCode: code => `Code: ${code}`,
    semantic: {
      ENGINE_NOT_SPECIFIED: (calls, pairs, tail) => `Semantische Prüfung: nicht ausgeführt · würde ${calls} Aufrufe für ${pairs} Paare benötigen · ${tail}`,
      PLANNED: (cached, pairs, calls, tail) => `Semantische Prüfung: nicht ausgeführt · ${cached} von ${pairs} Paaren im Relationen-Cache · würde ${calls} Aufrufe benötigen · ${tail}`,
      CACHE_UNAVAILABLE: (issue, tail) => `Semantische Prüfung: nicht ausgeführt · Relationen-Cache nicht verfügbar (${issue}) · Aufrufzahl unbekannt · ${tail}`,
      CACHE_CORRUPT: (issue, tail) => `Semantische Prüfung: nicht ausgeführt · Relationen-Cache beschädigt (${issue}) · Aufrufzahl unbekannt · ${tail}`,
      notStarted: "keine Untersuchung in dieser Ansicht benannt",
      stored: (cached, pairs, status) => `Relationen-Cache: ${cached} von ${pairs} Paaren · Stand-in-Prüfung: ${status}`,
      storedUnknownCache: status => `Relationen-Cache: bei diesem Lesen nicht verfügbar · Stand-in-Prüfung: ${status}`
    },
    run: {
      title: "SEMANTISCHE PRÜFUNG · AUSDRÜCKLICH STARTEN",
      hint: max => `Wähle die Rollen selbst aus, höchstens ${max}. Nichts ist vorausgewählt; gestartet wird nur mit diesem Knopf.`,
      pick: "für die Prüfung wählen",
      selection: (picked, max, calls, pending) => `Auswahl: ${picked} von höchstens ${max} Rollen · würde ${calls} Aufrufe für ${pending} offene Paare benötigen`,
      none: "Noch keine Rolle gewählt.",
      limit: max => `Höchstens ${max} Rollen je Start.`,
      start: "SEMANTISCHE PRÜFUNG STARTEN",
      running: (roles, calls) => `Semantische Prüfung läuft · ${n(roles)} Rollen · ${n(calls)} bestätigte Aufrufe`,
      standIn: "Stand-in, kein Modell",
      summary: status => `Semantische Prüfung: ${status}`,
      status: { PLANNED: "geplant, noch nicht gelaufen", RUNNING: "läuft (gespeicherter Stand)", COMPLETED: "abgeschlossen", PARTIAL: "teilweise abgeschlossen", INTERRUPTED: "unterbrochen", FAILED: "fehlgeschlagen" },
      replayed: "Gleicher Start wie zuvor: gespeicherter Stand, nichts neu ausgeführt.",
      budget: "Budget erschöpft: Die übrigen Rollen wurden ohne Aufruf abgebrochen.",
      task: { PENDING: "wartet", RUNNING: "läuft", SUCCEEDED: "abgeschlossen", FAILED: "fehlgeschlagen", BUDGET_EXHAUSTED: "Budget erschöpft", INTERRUPTED: "unterbrochen", CANCELLED: "abgebrochen, kein Aufruf", CACHED: "aus dem Relationen-Cache, kein Aufruf" },
      taskCounts: (pairs, stored) => `${n(pairs)} Paare · ${n(stored)} Relationen gespeichert`,
      relationsHidden: "Die Relationen selbst werden hier nicht angezeigt.",
      refused: {
        ERR_SEMANTIC_ENGINE_NOT_CONFIGURED: "Nicht gestartet: Auf diesem Server ist keine Prüf-Engine konfiguriert.",
        ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED: "Nicht gestartet: Der konfigurierte Anbieter ist nicht freigegeben.",
        ERR_INVESTIGATION_ROLES_INVALID: "Nicht gestartet: Die Rollenauswahl ist ungültig.",
        ERR_INVESTIGATION_ROLE_NOT_IN_DISCOVERY: "Nicht gestartet: Eine gewählte Rolle gehört nicht zur Rollenfindung dieser Freigabe.",
        ERR_RELATION_CACHE_UNAVAILABLE: "Nicht gestartet: Der Relationen-Cache ist nicht verfügbar."
      },
      refusedOther: "Nicht gestartet.",
      callsChanged: (needed, confirmed) => `Nicht gestartet: Der Server nennt jetzt ${n(needed)} Aufrufe statt der bestätigten ${n(confirmed)}. Lies den Plan neu und bestätige erneut.`,
      tooMany: max => `Nicht gestartet: höchstens ${max} Rollen je Start.`,
      failed: "Keine lesbare Antwort des Servers. Ob etwas gelaufen ist, ist unbekannt.",
      notFound: "Der Server kennt diese Untersuchung für diese Analyse nicht.",
      loading: "Die gespeicherte Untersuchung wird gelesen …",
      planAtRead: (cached, pairs, calls) => `Plan beim Lesen: ${cached} von ${pairs} Paaren im Relationen-Cache · würde ${calls} Aufrufe benötigen`,
      reread: "PLAN NEU LESEN",
      roleTask: status => `Semantische Prüfung dieser Rolle: ${status} · Stand-in, kein Modell`
    },
    startUnavailable: {
      NOT_CONFIGURED: "Start nicht verfügbar: Auf diesem Server ist keine Prüf-Engine konfiguriert.",
      PROVIDER_NOT_AUTHORIZED: "Start nicht verfügbar: Der konfigurierte Anbieter ist nicht freigegeben.",
      CACHE: "Start nicht verfügbar, solange der Relationen-Cache nicht gelesen werden kann."
    },
    scope: (pools, roles, requirements, proposals) => `${n(pools)} Pools · ${n(roles)} Rollen · ${n(requirements)} Anforderungen · ${n(proposals)} Fähigkeitsvorschläge`,
    groups: {
      ALL_REQUIREMENTS_NAME_RELATED: "Alle Anforderungen mit Namensbezug · lexikalisch",
      PARTIAL_NAME_RELATED: "Einige Anforderungen mit Namensbezug · lexikalisch",
      WEAK_LEXICAL_ONLY: "Nur Wort-Treffer (schwach)",
      NO_LEXICAL_RELATION: "Ohne Namensbezug",
      NO_REQUIREMENTS: "Ohne Anforderungen"
    },
    groupRoles: count => `${n(count)} Rollen`,
    show: "ANZEIGEN",
    hide: "AUSBLENDEN",
    roleCounts: (related, requirements, weak, without) => `${n(related)} von ${n(requirements)} Anforderungen mit Namensbezug · ${n(weak)} nur Wort-Treffer (schwach) · ${n(without)} offen`,
    roleRequired: (required, without) => `Pflicht: ${n(required)} · davon offen: ${n(without)}`,
    detail: {
      open: "SPUR",
      shut: "SPUR AUSBLENDEN",
      semantic: "Semantische Prüfung dieser Rolle: nicht ausgeführt",
      basis: {
        NAME_EXACT: () => "Namensbezug: exakter Name · lexikalisch",
        NAME_ALIAS: () => "Namensbezug: Alias · lexikalisch",
        NAME_COMPOSITE_CONSTITUENT: part => `Namensbezug: Bestandteil „${part ?? "—"}“ eines zusammengesetzten Vorschlags · lexikalisch`,
        WEAK_TOKEN_CONTAINMENT: () => "Nur Wort-Treffer (schwach) · lexikalisch"
      },
      proposal: "Fähigkeitsvorschlag",
      source: "Quelle",
      quoteSilent: "Das Zitat nennt diese Anforderung nicht: Der Namensbezug ruht nur auf dem Namen des Vorschlags.",
      noQuote: "Kein Zitat geliefert.",
      openTitle: count => `OFFENE ANFORDERUNGEN · KEIN NAMENSBEZUG (${count})`,
      openNone: "Keine.",
      level: (necessity, level) => level.trim() === "" ? necessity : `${necessity} · Stufe ${level}`,
      investigate: "GEZIELT UNTERSUCHEN",
      investigateHint: "Wählt diese Rolle als Job und wechselt zu PERSON × JOB, ohne Analyse. Gestartet wird nichts: ANALYZE startest du dort selbst, oder du öffnest eine vorhandene Analyse zu dieser Rolle."
    }
  }
};
