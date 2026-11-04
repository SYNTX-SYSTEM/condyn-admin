import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { CouplingClass } from "../../../../lib/career/mapping/signs";
import type { EvidenceClass } from "../../../../lib/career/ui/auto-match";

/**
 * Copy of the PERSON × JOB mapping field (phase C, L0/L1), EN and DE, beside its component like auto-match-copy.ts. The field is named
 * as what it is: the ranking drawn as a field — distance from the person follows the ranking, a position is approximate, the figures
 * stand in the list. Never "fit for the job", "recommended", "qualified", "suitable"; no alarm words; one calm sentence per state.
 */
export interface MappingFieldCopy {
  title: string;
  /** The field as an image, for assistive technology: pools, drawn bodies, not drawn ones. */
  label: (pools: number, drawn: number, notDrawn: number) => string;
  authority: string;
  evidence: Record<EvidenceClass | "NONE", string>;
  legend: Record<CouplingClass, string>;
  /** The honesty line: what position means and what it does not. */
  position: string;
  horizon: string;
  person: string;
  personMore: (n: number) => string;
  notDrawn: (n: number) => string;
  pools: string;
  pool: (name: string, roles: number) => string;
  up: string;
  openPool: (name: string) => string;
  levelL1: (name: string, roles: number) => string;
  marked: (rank: number, title: string, organization: string, pool: string) => string;
  bodyLabel: (rank: number, title: string, organization: string, cls: string) => string;
  /** STALLED: the field rests, a still sentence beside it — never an alarm. */
  still: string;
  stillResume: string;
  resumePending: string;
  pending: string;
}

export const MAPPING_FIELD_COPY: Readonly<Record<SilLocale, MappingFieldCopy>> = {
  en: {
    title: "PERSON × JOB · FIELD",
    label: (pools, drawn, notDrawn) => `The ranking as a field: ${pools} ${pools === 1 ? "pool" : "pools"}, ${drawn} ${drawn === 1 ? "job" : "jobs"} drawn${notDrawn > 0 ? `, ${notDrawn} not drawn` : ""}.`,
    authority: "A ranking, not a decision · authority: none",
    evidence: { STAND_IN: "STAND-IN · labelled, no model", REAL_GEMINI: "GEMINI · model statements", NONE: "NAME RELATION · no model statement" },
    legend: { SEMANTIC: "solid · checked by the model", LEXICAL: "dotted · name relation only", NONE: "open · no relation found" },
    position: "Nearer the person = higher in the ranking. Positions are approximate; the figures stand in the list below.",
    horizon: "horizon · beyond it name relations only",
    person: "the person's capability proposals",
    personMore: n => `+${n} more proposals`,
    notDrawn: n => `+${n} not drawn · in the list`,
    pools: "Pools",
    pool: (name, roles) => `${name} · ${roles}`,
    up: "↑ whole field",
    openPool: name => `Open pool ${name}`,
    levelL1: (name, roles) => `${name} · ${roles} ${roles === 1 ? "job" : "jobs"}`,
    marked: (rank, title, organization, pool) => `${rank} · ${title} · ${organization} · ${pool}`,
    bodyLabel: (rank, title, organization, cls) => `Rank ${rank}: ${title}, ${organization} — ${cls}`,
    still: "The run rests; the field holds still.",
    stillResume: "The run rests; it is taken up again by itself.",
    resumePending: "Its continuation is due; the field waits for it.",
    pending: "Being worked on: jobs beyond the horizon may still move."
  },
  de: {
    title: "PERSON × JOB · FELD",
    label: (pools, drawn, notDrawn) => `Die Rangfolge als Feld: ${pools} ${pools === 1 ? "Pool" : "Pools"}, ${drawn} ${drawn === 1 ? "Job" : "Jobs"} gezeichnet${notDrawn > 0 ? `, ${notDrawn} nicht gezeichnet` : ""}.`,
    authority: "Eine Rangfolge, keine Entscheidung · Autorität: keine",
    evidence: { STAND_IN: "STAND-IN · gekennzeichnet, kein Modell", REAL_GEMINI: "GEMINI · Modellaussagen", NONE: "NAMENSRELATION · keine Modellaussage" },
    legend: { SEMANTIC: "durchgezogen · vom Modell geprüft", LEXICAL: "gepunktet · nur Namensrelation", NONE: "offen · keine Relation gefunden" },
    position: "Näher an der Person = weiter oben in der Rangfolge. Positionen sind ungefähr; die Zahlen stehen in der Liste darunter.",
    horizon: "Horizont · dahinter nur Namensrelationen",
    person: "die Fähigkeitsvorschläge der Person",
    personMore: n => `+${n} weitere Vorschläge`,
    notDrawn: n => `+${n} nicht gezeichnet · in der Liste`,
    pools: "Pools",
    pool: (name, roles) => `${name} · ${roles}`,
    up: "↑ ganzes Feld",
    openPool: name => `Pool ${name} öffnen`,
    levelL1: (name, roles) => `${name} · ${roles} ${roles === 1 ? "Job" : "Jobs"}`,
    marked: (rank, title, organization, pool) => `${rank} · ${title} · ${organization} · ${pool}`,
    bodyLabel: (rank, title, organization, cls) => `Rang ${rank}: ${title}, ${organization} — ${cls}`,
    still: "Der Lauf ruht; das Feld steht still.",
    stillResume: "Der Lauf ruht; er wird von selbst wieder aufgenommen.",
    resumePending: "Seine Fortsetzung steht an; das Feld wartet darauf.",
    pending: "In Arbeit: Jobs jenseits des Horizonts können sich noch bewegen."
  }
};
