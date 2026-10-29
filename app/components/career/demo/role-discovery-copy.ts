import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { RoleLexicalStatus } from "../../../../lib/career/job-pool/pool-role-discovery";

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
  semantic: {
    ENGINE_NOT_SPECIFIED: (calls: string, pairs: string) => string;
    PLANNED: (cached: string, pairs: string, calls: string) => string;
    CACHE_UNAVAILABLE: (issue: string) => string;
    CACHE_CORRUPT: (issue: string) => string;
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
      ENGINE_NOT_SPECIFIED: (calls, pairs) => `Semantic check: not executed · would need ${calls} calls for ${pairs} pairs · not started`,
      PLANNED: (cached, pairs, calls) => `Semantic check: not executed · ${cached} of ${pairs} pairs in the relation cache · would need ${calls} calls · not started`,
      CACHE_UNAVAILABLE: issue => `Semantic check: not executed · relation cache unavailable (${issue}) · calls unknown · not started`,
      CACHE_CORRUPT: issue => `Semantic check: not executed · relation cache corrupt (${issue}) · calls unknown · not started`
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
      level: (necessity, level) => `${necessity} · level ${level}`
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
      ENGINE_NOT_SPECIFIED: (calls, pairs) => `Semantische Prüfung: nicht ausgeführt · würde ${calls} Aufrufe für ${pairs} Paare benötigen · nicht gestartet`,
      PLANNED: (cached, pairs, calls) => `Semantische Prüfung: nicht ausgeführt · ${cached} von ${pairs} Paaren im Relationen-Cache · würde ${calls} Aufrufe benötigen · nicht gestartet`,
      CACHE_UNAVAILABLE: issue => `Semantische Prüfung: nicht ausgeführt · Relationen-Cache nicht verfügbar (${issue}) · Aufrufzahl unbekannt · nicht gestartet`,
      CACHE_CORRUPT: issue => `Semantische Prüfung: nicht ausgeführt · Relationen-Cache beschädigt (${issue}) · Aufrufzahl unbekannt · nicht gestartet`
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
      level: (necessity, level) => `${necessity} · Stufe ${level}`
    }
  }
};
