import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { CouplingClass } from "../../../../lib/career/mapping/signs";
import type { EvidenceClass, Necessity, RankedRequirement } from "../../../../lib/career/ui/auto-match";

/**
 * Copy of the PERSON × JOB mapping field (phase D, L0 to L3, its own stage), EN and DE, beside its component. The field is named as
 * what it is: the ranking drawn as a field. Distance from the person follows the ranking, a position is approximate, and the
 * figures stand in the list. An open arc says "not evidenced", never "you lack this"; the field speaks about the reading, never about
 * the person's abilities.
 * Never "fit for the job", "recommended", "qualified", "suitable"; no alarm words; one calm sentence per state.
 */
type CouplingState = RankedRequirement["state"];
/** Why the field draws nothing (§3), each in its own sentence. */
export type MappingEmptyReason = "NO_RANKING" | "NO_ROLES" | "NOT_PERSON" | "PROJECTION_ABSENT" | "BOUNDARY_UNRESOLVED" | "NOT_PROVISIONED" | "ANALYSIS_NOT_FOUND";
/** Why the MAPPING option of the field selector is closed (C-10), first match wins in this order. */
export type MappingGateReason = "NOT_PERSON" | "NO_ANALYSIS" | "NO_RANKING" | "NO_POOL";

export interface MappingFieldCopy {
  title: string;
  /** The field selector's MAPPING option (C-4) and its closed gate's reason and way (C-10, C-11). */
  selector: string;
  gate: Record<MappingGateReason, { reason: string; way: string }>;
  /** The field as an image, for assistive technology: pools, drawn bodies, not drawn ones. */
  label: (pools: number, drawn: number, notDrawn: number) => string;
  authority: string;
  evidence: Record<EvidenceClass | "NONE", string>;
  /** D-Q1: the reading's provenance while no requirement in it was checked by a model. */
  namesOnly: string;
  empty: Record<MappingEmptyReason, string>;
  legend: Record<CouplingClass, string>;
  legendArcs: string;
  /** The honesty line: what position means and what it does not. */
  position: string;
  horizon: string;
  person: string;
  personMore: (n: number) => string;
  notDrawn: (n: number) => string;
  pools: string;
  pool: (name: string, roles: number) => string;
  up: string;
  upToPool: string;
  upToRole: string;
  openPool: (name: string) => string;
  levelL1: (name: string, roles: number) => string;
  roleMeta: (rank: number, organization: string, pool: string, requirements: number) => string;
  marked: (rank: number, title: string, organization: string, pool: string) => string;
  markedRequirement: (text: string, state: string) => string;
  bodyLabel: (rank: number, title: string, organization: string, cls: string, requirements: number) => string;
  arcLabel: (text: string, state: string, capability: string | null) => string;
  capabilityLabel: (name: string) => string;
  more: (n: number) => string;
  collarHidden: (n: number) => string;
  layoutShifts: (n: number) => string;
  displaced: string;
  beamsUndrawn: (n: number) => string;
  reverse: (capability: string, roles: number) => string;
  clear: string;
  notInPerson: (capability: string) => string;
  keyAbsent: string;
  capability: (name: string) => string;
  requirement: string;
  requirementMeta: (necessity: string, weight: number) => string;
  necessity: Record<Necessity, string>;
  state: Record<CouplingState, string>;
  source: Record<RankedRequirement["source"], string>;
  limitation: string;
  quoteSource: (documentId: string) => string;
  noQuote: string;
  /** STALLED: the field rests, a still sentence beside it — never an alarm. */
  still: string;
  stillResume: string;
  resumePending: string;
  pending: string;
  /** Phase E · E-6: what the outer ring's slow breath means, and that its stillness means pending. */
  breath: string;
  /** Phase E · E-7: bodies drawn at the legible minimum, where size stops being proportional. */
  sizeFloor: (n: number) => string;
  /** Phase E · E-9: the roles whose own evidence changed since the previous reading (each lit briefly, where it now stands). */
  evidenceChanged: (n: number) => string;
  /** Phase E · A-4: the phase lock has no static form in the sign table; its absence is stated, never left to an attribute. */
  phaseLockStill: string;
  /** Phase E · E-2: bodies whose strongest relation starts at no capability of the person (not in it, or no key) draw no line. */
  primaryUndrawn: (n: number) => string;
}

export const MAPPING_FIELD_COPY: Readonly<Record<SilLocale, MappingFieldCopy>> = {
  en: {
    title: "PERSON × JOB · MAPPING",
    selector: "◇ MAPPING",
    gate: {
      NOT_PERSON: { reason: "MAPPING reads a PERSON analysis against all pools.", way: "→ choose PERSON" },
      NO_ANALYSIS: { reason: "No PERSON analysis is on view.", way: "→ open or start a PERSON analysis" },
      NO_RANKING: { reason: "The automatic ranking of this analysis is not read yet.", way: "→ it follows the PERSON analysis by itself" },
      NO_POOL: { reason: "The ranking holds no job pool.", way: "→ upload a job pool in the Job Field" }
    },
    label: (pools, drawn, notDrawn) => `The ranking as a field: ${pools} ${pools === 1 ? "pool" : "pools"}, ${drawn} ${drawn === 1 ? "job" : "jobs"} drawn${notDrawn > 0 ? `, ${notDrawn} not drawn` : ""}.`,
    authority: "A ranking, not a decision · authority: none",
    evidence: { STAND_IN: "STAND-IN · labelled, no model", REAL_GEMINI: "GEMINI · model statements", NONE: "NAME RELATION · no model statement" },
    namesOnly: "No semantic check took place in this reading; every relation shown rests on names only.",
    empty: {
      NO_RANKING: "No ranking is read for this analysis yet.",
      NO_ROLES: "The ranking holds no job.",
      NOT_PERSON: "This analysis is not a PERSON analysis; only a PERSON analysis is ranked against the pools.",
      PROJECTION_ABSENT: "The analysis names no capability proposals, so nothing is ranked.",
      BOUNDARY_UNRESOLVED: "The analysis's investigation boundary could not be read.",
      NOT_PROVISIONED: "The job pools are not provisioned on this system.",
      ANALYSIS_NOT_FOUND: "The analysis was not found."
    },
    legend: { SEMANTIC: "solid · checked by the model", LEXICAL: "dotted · name relation only", NONE: "open · no relation found" },
    legendArcs: "Ticks and arcs: one per requirement · solid checked · dotted a name · broken unclear · two ends only: not evidenced · a cross mark: judged different",
    position: "Nearer the person = higher in the ranking. Positions are approximate; the figures stand in the list.",
    horizon: "horizon · beyond it name relations only",
    person: "the person's capability proposals",
    personMore: n => `+${n} more proposals`,
    notDrawn: n => `+${n} not drawn · in the list`,
    pools: "Pools",
    pool: (name, roles) => `${name} · ${roles}`,
    up: "↑ whole field",
    upToPool: "↑ pool",
    upToRole: "↑ job",
    openPool: name => `Open pool ${name}`,
    levelL1: (name, roles) => `${name} · ${roles} ${roles === 1 ? "job" : "jobs"}`,
    roleMeta: (rank, organization, pool, requirements) => `rank ${rank} · ${organization} · ${pool} · ${requirements} ${requirements === 1 ? "requirement" : "requirements"}`,
    marked: (rank, title, organization, pool) => `${rank} · ${title} · ${organization} · ${pool}`,
    markedRequirement: (text, state) => `${text} · ${state}`,
    bodyLabel: (rank, title, organization, cls, requirements) => `Rank ${rank}: ${title}, ${organization} — ${cls} · ${requirements} ${requirements === 1 ? "requirement" : "requirements"}`,
    arcLabel: (text, state, capability) => `${text} — ${state}${capability === null ? "" : ` · ${capability}`}`,
    capabilityLabel: name => `Capability proposal ${name}: show every job it relates to`,
    more: n => `+${n}`,
    collarHidden: n => `+${n} requirements on small bodies are counted, not drawn (the lightest).`,
    layoutShifts: n => `${n} ${n === 1 ? "body took a new place" : "bodies took a new place"} without their own evidence changing.`,
    displaced: "◇ place approximate — quantities come from the data.",
    beamsUndrawn: n => `${n} ${n === 1 ? "relation is" : "relations are"} not drawn as a line: the capability stands beyond the constellation.`,
    reverse: (capability, roles) => `${capability} · relates to ${roles} ${roles === 1 ? "job" : "jobs"} across all pools`,
    clear: "× clear",
    notInPerson: capability => `${capability} · not in the person`,
    keyAbsent: "the capability's key is absent in this reading — not the relation",
    capability: name => `capability proposal · ${name}`,
    requirement: "Requirement",
    requirementMeta: (necessity, weight) => `${necessity} · weight ${weight}`,
    necessity: { REQUIRED: "required", PREFERRED: "preferred", OPTIONAL: "optional", UNKNOWN: "necessity unknown" },
    state: {
      EQUIVALENT: "equivalent (checked)", COVERS: "covered (checked)", PARTIAL: "in part (checked)", DIFFERENT: "judged different (checked)", UNCLEAR: "could not be told (checked)",
      NAME_EXACT: "same name", NAME_ALIAS: "an alias of the name", NAME_COMPOSITE_CONSTITUENT: "a part of the name", WEAK_TOKEN_CONTAINMENT: "a word in common", NONE: "not evidenced"
    },
    source: { SEMANTIC: "a model statement", LEXICAL: "a name relation, nothing checked", NONE: "no relation in this reading" },
    limitation: "Limitation",
    quoteSource: id => `source ${id}`,
    noQuote: "No verbatim quote stands with this requirement.",
    still: "The run rests; the field holds still.",
    stillResume: "The run rests; it is taken up again by itself.",
    resumePending: "Its continuation is due; the field waits for it.",
    pending: "Being worked on: jobs beyond the horizon may still move.",
    breath: "The outer ring breathes slowly while the field is live and nothing is pending; while something is pending, it stands still.",
    sizeFloor: n => `${n} ${n === 1 ? "body is" : "bodies are"} drawn at the legible minimum ◦ — smaller in the data than drawn.`,
    evidenceChanged: n => `${n} ${n === 1 ? "role's own evidence changed" : "roles' own evidence changed"} since the previous reading; each lit up once where it now stands.`,
    phaseLockStill: "The phase lock of checked couplings to their capability has no still sign in the sign table; it is not drawn here.",
    primaryUndrawn: n => `${n} ${n === 1 ? "job's strongest relation starts" : "jobs' strongest relations start"} at no capability of the person; no line is drawn for ${n === 1 ? "it" : "them"}.`
  },
  de: {
    title: "PERSON × JOB · MAPPING",
    selector: "◇ MAPPING",
    gate: {
      NOT_PERSON: { reason: "MAPPING liest eine PERSON-Analyse gegen alle Pools.", way: "→ PERSON wählen" },
      NO_ANALYSIS: { reason: "Keine PERSON-Analyse im Blick.", way: "→ eine PERSON-Analyse öffnen oder starten" },
      NO_RANKING: { reason: "Die automatische Rangfolge dieser Analyse ist noch nicht gelesen.", way: "→ sie folgt der PERSON-Analyse von selbst" },
      NO_POOL: { reason: "Die Rangfolge enthält keinen Job-Pool.", way: "→ im Job-Feld einen Job-Pool hochladen" }
    },
    label: (pools, drawn, notDrawn) => `Die Rangfolge als Feld: ${pools} ${pools === 1 ? "Pool" : "Pools"}, ${drawn} ${drawn === 1 ? "Job" : "Jobs"} gezeichnet${notDrawn > 0 ? `, ${notDrawn} nicht gezeichnet` : ""}.`,
    authority: "Eine Rangfolge, keine Entscheidung · Autorität: keine",
    evidence: { STAND_IN: "STAND-IN · gekennzeichnet, kein Modell", REAL_GEMINI: "GEMINI · Modellaussagen", NONE: "NAMENSRELATION · keine Modellaussage" },
    namesOnly: "In dieser Lesung fand keine semantische Prüfung statt; jede gezeigte Beziehung beruht nur auf Namen.",
    empty: {
      NO_RANKING: "Für diese Analyse ist noch keine Rangfolge gelesen.",
      NO_ROLES: "Die Rangfolge enthält keinen Job.",
      NOT_PERSON: "Diese Analyse ist keine PERSON-Analyse; nur eine PERSON-Analyse wird gegen die Pools gereiht.",
      PROJECTION_ABSENT: "Die Analyse nennt keine Fähigkeitsvorschläge, deshalb wird nichts gereiht.",
      BOUNDARY_UNRESOLVED: "Die Untersuchungsgrenze der Analyse war nicht lesbar.",
      NOT_PROVISIONED: "Die Job-Pools sind auf diesem System nicht eingerichtet.",
      ANALYSIS_NOT_FOUND: "Die Analyse wurde nicht gefunden."
    },
    legend: { SEMANTIC: "durchgezogen · vom Modell geprüft", LEXICAL: "gepunktet · nur Namensrelation", NONE: "offen · keine Relation gefunden" },
    legendArcs: "Striche und Bögen: einer je Anforderung · durchgezogen geprüft · gepunktet ein Name · unterbrochen unklar · nur zwei Enden: nicht belegt · ein Kreuzstrich: als verschieden beurteilt",
    position: "Näher an der Person = weiter oben in der Rangfolge. Positionen sind ungefähr; die Zahlen stehen in der Liste.",
    horizon: "Horizont · dahinter nur Namensrelationen",
    person: "die Fähigkeitsvorschläge der Person",
    personMore: n => `+${n} weitere Vorschläge`,
    notDrawn: n => `+${n} nicht gezeichnet · in der Liste`,
    pools: "Pools",
    pool: (name, roles) => `${name} · ${roles}`,
    up: "↑ ganzes Feld",
    upToPool: "↑ Pool",
    upToRole: "↑ Job",
    openPool: name => `Pool ${name} öffnen`,
    levelL1: (name, roles) => `${name} · ${roles} ${roles === 1 ? "Job" : "Jobs"}`,
    roleMeta: (rank, organization, pool, requirements) => `Rang ${rank} · ${organization} · ${pool} · ${requirements} ${requirements === 1 ? "Anforderung" : "Anforderungen"}`,
    marked: (rank, title, organization, pool) => `${rank} · ${title} · ${organization} · ${pool}`,
    markedRequirement: (text, state) => `${text} · ${state}`,
    bodyLabel: (rank, title, organization, cls, requirements) => `Rang ${rank}: ${title}, ${organization} — ${cls} · ${requirements} ${requirements === 1 ? "Anforderung" : "Anforderungen"}`,
    arcLabel: (text, state, capability) => `${text} — ${state}${capability === null ? "" : ` · ${capability}`}`,
    capabilityLabel: name => `Fähigkeitsvorschlag ${name}: jeden Job zeigen, auf den er sich bezieht`,
    more: n => `+${n}`,
    collarHidden: n => `+${n} Anforderungen kleiner Körper sind gezählt, nicht gezeichnet (die leichtesten).`,
    layoutShifts: n => `${n} ${n === 1 ? "Körper hat" : "Körper haben"} einen neuen Platz eingenommen, ohne dass sich ihre eigene Evidenz geändert hat.`,
    displaced: "◇ Platz ungefähr — die Zahlen kommen aus den Daten.",
    beamsUndrawn: n => `${n} ${n === 1 ? "Beziehung ist" : "Beziehungen sind"} nicht als Linie gezeichnet: die Fähigkeit steht jenseits der Konstellation.`,
    reverse: (capability, roles) => `${capability} · bezieht sich auf ${roles} ${roles === 1 ? "Job" : "Jobs"} in allen Pools`,
    clear: "× aufheben",
    notInPerson: capability => `${capability} · nicht in der Person`,
    keyAbsent: "der Schlüssel der Fähigkeit fehlt in dieser Lesung — nicht die Beziehung",
    capability: name => `Fähigkeitsvorschlag · ${name}`,
    requirement: "Anforderung",
    requirementMeta: (necessity, weight) => `${necessity} · Gewicht ${weight}`,
    necessity: { REQUIRED: "erforderlich", PREFERRED: "bevorzugt", OPTIONAL: "optional", UNKNOWN: "Notwendigkeit unbekannt" },
    state: {
      EQUIVALENT: "gleichwertig (geprüft)", COVERS: "abgedeckt (geprüft)", PARTIAL: "teilweise (geprüft)", DIFFERENT: "als verschieden beurteilt (geprüft)", UNCLEAR: "nicht zu entscheiden (geprüft)",
      NAME_EXACT: "gleicher Name", NAME_ALIAS: "ein Alias des Namens", NAME_COMPOSITE_CONSTITUENT: "ein Teil des Namens", WEAK_TOKEN_CONTAINMENT: "ein gemeinsames Wort", NONE: "nicht belegt"
    },
    source: { SEMANTIC: "eine Modellaussage", LEXICAL: "eine Namensrelation, nichts geprüft", NONE: "keine Relation in dieser Lesung" },
    limitation: "Grenze",
    quoteSource: id => `Quelle ${id}`,
    noQuote: "Zu dieser Anforderung steht kein wörtliches Zitat.",
    still: "Der Lauf ruht; das Feld steht still.",
    stillResume: "Der Lauf ruht; er wird von selbst wieder aufgenommen.",
    resumePending: "Seine Fortsetzung steht an; das Feld wartet darauf.",
    pending: "In Arbeit: Jobs jenseits des Horizonts können sich noch bewegen.",
    breath: "Der äußere Ring atmet langsam, solange das Feld lebt und nichts aussteht; steht etwas aus, steht er still.",
    sizeFloor: n => `${n} ${n === 1 ? "Körper ist" : "Körper sind"} in der lesbaren Mindestgröße gezeichnet ◦ — in den Daten kleiner als gezeichnet.`,
    evidenceChanged: n => `Bei ${n} ${n === 1 ? "Rolle hat" : "Rollen hat"} sich seit der vorigen Lesung die eigene Evidenz geändert; ${n === 1 ? "sie leuchtete" : "jede leuchtete"} einmal dort auf, wo sie jetzt steht.`,
    phaseLockStill: "Die Phasenbindung geprüfter Kopplungen an ihre Fähigkeit hat in der Zeichentabelle kein stilles Zeichen; sie wird hier nicht gezeichnet.",
    primaryUndrawn: n => `Bei ${n} ${n === 1 ? "Job beginnt die stärkste Beziehung" : "Jobs beginnt die stärkste Beziehung"} an keiner Fähigkeit der Person; dafür wird keine Linie gezeichnet.`
  }
};
