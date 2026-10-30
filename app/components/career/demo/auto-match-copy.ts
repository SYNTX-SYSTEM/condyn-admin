import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { LexicalBasis } from "../../../../lib/career/job-pool/pool-role-discovery";
import type { SemanticRelationState } from "../../../../lib/career/job-pool/relation-cache";
import type { EvidenceClass, Necessity } from "../../../../lib/career/ui/auto-match";
import { formatCount } from "./role-discovery-copy";

/**
 * Copy of the automatic job ranking (owner "SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE", GRÜN), EN and DE, beside its component like
 * role-discovery-copy.ts. The state line speaks the entry line's language (SEMIOTIC_ENTRY_FIX): a path, ONE calm sentence, ONE
 * transition — it orients, never prohibits; no alarm words. The ranking is named as what it is: a ranking, not a decision, its
 * relations unverified model statements (or a name relation) — never "fit for the job", never "recommended".
 */
type Line = { cause: string; way: string };
export interface AutoMatchCopy {
  title: string;
  path: string;
  reading: Line;
  readFailed: Line;
  analysisNotFound: Line;
  notStarted: Line;
  waitedOut: Line;
  running: (evaluated: number, planned: number) => Line;
  completed: (pools: number) => Line;
  partial: Record<"ROLES_BEYOND_BUDGET" | "ROLE_FAILURES" | "DAY_BUDGET_EXHAUSTED", Line>;
  disabled: Line;
  disabledReason: Record<"SEMANTIC_NOT_CONFIGURED" | "PROVIDER_NOT_AUTHORIZED" | "DAY_LIMIT_ZERO" | "NOT_PROVISIONED", string>;
  skipped: Record<"NOT_PERSON" | "NO_ACTIVE_POOLS", Line>;
  failed: Line;
  code: (code: string) => string;
  goToJobField: string;
  budget: (evaluated: number, planned: number, limit: number) => string;
  pools: (names: string) => string;
  evidence: Record<EvidenceClass | "NONE", string>;
  authority: string;
  ranking: {
    title: string;
    states: { LOADING: string; ANALYSIS_NOT_FOUND: string; NOT_PERSON: string; PROJECTION_ABSENT: string; BOUNDARY_UNRESOLVED: (reason: string) => string; NOT_PROVISIONED: string; FAILED: string };
    empty: string;
    poolsDropped: (ids: string) => string;
    tier: Record<"SEMANTIC" | "LEXICAL_ONLY", string>;
    fit: (percent: number) => string;
    noRequirements: string;
    coverage: (evaluated: number, total: number) => string;
    gaps: (n: number) => string;
    why: string;
    whyHide: string;
    formula: string;
    necessity: Record<Necessity, string>;
    source: Record<"SEMANTIC" | "LEXICAL" | "NONE", string>;
    state: Record<SemanticRelationState | LexicalBasis, string>;
    contribution: (weight: number, value: number, contribution: number) => string;
    proposal: (name: string) => string;
    explanation: string;
    limitation: string;
    quote: string;
  };
  manualHint: string;
}

const decimal = (locale: SilLocale) => (value: number) => (Math.round(value * 100) / 100).toString().replace(".", locale === "de" ? "," : ".");

export const AUTO_MATCH_COPY: Readonly<Record<SilLocale, AutoMatchCopy>> = {
  en: {
    title: "JOB RANKING · AUTOMATIC",
    path: "PERSON ⟶ JOB POOLS ⟶ RANKING",
    reading: { cause: "The matching state is being read.", way: "→ the ranking follows" },
    readFailed: { cause: "The matching state is not readable at the moment.", way: "→ it is read again with the next view of this analysis" },
    analysisNotFound: { cause: "This analysis is not on record.", way: "→ an analysis on record is matched by itself" },
    notStarted: { cause: "The analysis is in; the matching against the job pools has not begun yet.", way: "→ it begins by itself" },
    waitedOut: { cause: "No matching run is recorded for this analysis.", way: "→ the ranking below rests on the name relation" },
    running: (evaluated, planned) => ({ cause: `The capabilities are being matched against the job pools · ${formatCount(evaluated)} of ${formatCount(planned)} roles checked.`, way: "→ the ranking follows once the run is done" }),
    completed: pools => ({ cause: `The matching is done across ${formatCount(pools)} ${pools === 1 ? "job pool" : "job pools"}.`, way: "→ the ranked jobs below, each with its reasons" }),
    partial: {
      ROLES_BEYOND_BUDGET: { cause: "The matching checked the roles its budget allows; the others are ranked by name relation.", way: "→ the ranked jobs below, each with its reasons" },
      ROLE_FAILURES: { cause: "The matching is done; some roles could not be checked and are ranked by name relation.", way: "→ the ranked jobs below, each with its reasons" },
      DAY_BUDGET_EXHAUSTED: { cause: "Today's call budget ran out during the matching; the roles not reached are ranked by name relation.", way: "→ the ranked jobs below, each with its reasons" }
    },
    disabled: { cause: "Semantic matching is not switched on here; the jobs are ranked by name relation.", way: "→ the ranked jobs below" },
    disabledReason: { SEMANTIC_NOT_CONFIGURED: "no semantic provider configured", PROVIDER_NOT_AUTHORIZED: "provider not authorised", DAY_LIMIT_ZERO: "no call budget for today", NOT_PROVISIONED: "the match store is not provisioned" },
    skipped: {
      NOT_PERSON: { cause: "This analysis is not a PERSON analysis; it is not matched against the job pools.", way: "→ a PERSON analysis is matched by itself" },
      NO_ACTIVE_POOLS: { cause: "No active job pool was in the field when the analysis finished.", way: "→ job pools enter through the Job Field's intake" }
    },
    failed: { cause: "The matching run stopped; the jobs are ranked by what was matched.", way: "→ the ranked jobs below" },
    code: code => `code ${code}`,
    goToJobField: "GO TO JOB FIELD",
    budget: (evaluated, planned, limit) => `${formatCount(evaluated)} of ${formatCount(planned)} roles checked semantically · call limit ${formatCount(limit)}`,
    pools: names => `Job pools: ${names}`,
    evidence: { STAND_IN: "STAND-IN · labelled, no model", REAL_GEMINI: "GEMINI · model statements", NONE: "NAME RELATION · no model statement" },
    authority: "Authority: none · a ranking from unverified relations, not a decision",
    ranking: {
      title: "RANKED JOBS",
      states: {
        LOADING: "The ranking is being read.",
        ANALYSIS_NOT_FOUND: "This analysis is not on record.",
        NOT_PERSON: "Only a PERSON analysis is ranked against the job pools.",
        PROJECTION_ABSENT: "This analysis has no capability projection; there is nothing to rank.",
        BOUNDARY_UNRESOLVED: reason => `The analysis's boundary is not resolved (${reason}); there is nothing to rank.`,
        NOT_PROVISIONED: "The job pool store is not provisioned here.",
        FAILED: "The ranking is not readable at the moment."
      },
      empty: "No role to rank in the active job pools.",
      poolsDropped: ids => `No longer active, left out: ${ids}`,
      tier: { SEMANTIC: "SEMANTIC", LEXICAL_ONLY: "NAME RELATION ONLY" },
      fit: percent => `fit ${percent} %`,
      noRequirements: "no requirements · not rated",
      coverage: (evaluated, total) => `${formatCount(evaluated)} of ${formatCount(total)} requirements checked semantically`,
      gaps: n => `${formatCount(n)} required without a meeting`,
      why: "WHY",
      whyHide: "HIDE",
      formula: "fit = Σ(weight × value) / Σ weight · required 3 · preferred 2 · optional, unknown 1",
      necessity: { REQUIRED: "required", PREFERRED: "preferred", OPTIONAL: "optional", UNKNOWN: "unknown" },
      source: { SEMANTIC: "semantic", LEXICAL: "name", NONE: "none" },
      state: {
        EQUIVALENT: "equivalent", COVERS: "covers", PARTIAL: "partial", DIFFERENT: "different", UNCLEAR: "unclear",
        NAME_EXACT: "name exact", NAME_ALIAS: "name alias", NAME_COMPOSITE_CONSTITUENT: "name part", WEAK_TOKEN_CONTAINMENT: "weak name token", NONE: "no relation"
      },
      contribution: (weight, value, contribution) => `×${weight} · ${decimal("en")(value)} → ${decimal("en")(contribution)}`,
      proposal: name => `capability: ${name}`,
      explanation: "Statement",
      limitation: "Limitation",
      quote: "Source"
    },
    manualHint: "Manual discovery stays: release pools and check roles yourself."
  },
  de: {
    title: "JOB-RANGFOLGE · AUTOMATISCH",
    path: "PERSON ⟶ JOB-POOLS ⟶ RANGFOLGE",
    reading: { cause: "Der Stand des Abgleichs wird gelesen.", way: "→ die Rangfolge folgt" },
    readFailed: { cause: "Der Stand des Abgleichs ist gerade nicht lesbar.", way: "→ er wird mit der nächsten Ansicht dieser Analyse neu gelesen" },
    analysisNotFound: { cause: "Diese Analyse ist nicht verzeichnet.", way: "→ eine verzeichnete Analyse wird von selbst abgeglichen" },
    notStarted: { cause: "Die Analyse liegt vor; der Abgleich mit den Job-Pools hat noch nicht begonnen.", way: "→ er beginnt von selbst" },
    waitedOut: { cause: "Für diese Analyse ist kein Abgleich verzeichnet.", way: "→ die Rangfolge unten stützt sich auf die Namensrelation" },
    running: (evaluated, planned) => ({ cause: `Die Fähigkeiten werden mit den Job-Pools abgeglichen · ${formatCount(evaluated)} von ${formatCount(planned)} Rollen geprüft.`, way: "→ die Rangfolge folgt, sobald der Lauf fertig ist" }),
    completed: pools => ({ cause: `Der Abgleich ist über ${formatCount(pools)} ${pools === 1 ? "Job-Pool" : "Job-Pools"} fertig.`, way: "→ die gereihten Jobs unten, jeder mit seinen Gründen" }),
    partial: {
      ROLES_BEYOND_BUDGET: { cause: "Der Abgleich hat die Rollen geprüft, die sein Budget zulässt; die übrigen sind nach Namensrelation gereiht.", way: "→ die gereihten Jobs unten, jeder mit seinen Gründen" },
      ROLE_FAILURES: { cause: "Der Abgleich ist fertig; einige Rollen ließen sich nicht prüfen und sind nach Namensrelation gereiht.", way: "→ die gereihten Jobs unten, jeder mit seinen Gründen" },
      DAY_BUDGET_EXHAUSTED: { cause: "Das heutige Aufrufbudget war während des Abgleichs aufgebraucht; die nicht erreichten Rollen sind nach Namensrelation gereiht.", way: "→ die gereihten Jobs unten, jeder mit seinen Gründen" }
    },
    disabled: { cause: "Der semantische Abgleich ist hier nicht eingeschaltet; die Jobs sind nach Namensrelation gereiht.", way: "→ die gereihten Jobs unten" },
    disabledReason: { SEMANTIC_NOT_CONFIGURED: "kein semantischer Provider eingerichtet", PROVIDER_NOT_AUTHORIZED: "Provider nicht freigegeben", DAY_LIMIT_ZERO: "kein Aufrufbudget für heute", NOT_PROVISIONED: "der Abgleichspeicher ist nicht eingerichtet" },
    skipped: {
      NOT_PERSON: { cause: "Diese Analyse ist keine PERSON-Analyse; sie wird nicht mit den Job-Pools abgeglichen.", way: "→ eine PERSON-Analyse wird von selbst abgeglichen" },
      NO_ACTIVE_POOLS: { cause: "Als die Analyse fertig war, lag kein aktiver Job-Pool im Feld.", way: "→ Job-Pools kommen über die Aufnahme im Job-Feld hinein" }
    },
    failed: { cause: "Der Abgleich hat angehalten; die Jobs sind nach dem gereiht, was abgeglichen ist.", way: "→ die gereihten Jobs unten" },
    code: code => `Code ${code}`,
    goToJobField: "ZUM JOB-FELD",
    budget: (evaluated, planned, limit) => `${formatCount(evaluated)} von ${formatCount(planned)} Rollen semantisch geprüft · Aufruflimit ${formatCount(limit)}`,
    pools: names => `Job-Pools: ${names}`,
    evidence: { STAND_IN: "STAND-IN · gekennzeichnet, kein Modell", REAL_GEMINI: "GEMINI · Modellaussagen", NONE: "NAMENSRELATION · keine Modellaussage" },
    authority: "Autorität: keine · eine Rangfolge aus ungeprüften Relationen, keine Entscheidung",
    ranking: {
      title: "GEREIHTE JOBS",
      states: {
        LOADING: "Die Rangfolge wird gelesen.",
        ANALYSIS_NOT_FOUND: "Diese Analyse ist nicht verzeichnet.",
        NOT_PERSON: "Nur eine PERSON-Analyse wird mit den Job-Pools gereiht.",
        PROJECTION_ABSENT: "Diese Analyse hat keine Fähigkeitsprojektion; es gibt nichts zu reihen.",
        BOUNDARY_UNRESOLVED: reason => `Die Grenze der Analyse ist nicht aufgelöst (${reason}); es gibt nichts zu reihen.`,
        NOT_PROVISIONED: "Der Job-Pool-Speicher ist hier nicht eingerichtet.",
        FAILED: "Die Rangfolge ist gerade nicht lesbar."
      },
      empty: "In den aktiven Job-Pools gibt es keine Rolle zu reihen.",
      poolsDropped: ids => `Nicht mehr aktiv, ausgelassen: ${ids}`,
      tier: { SEMANTIC: "SEMANTISCH", LEXICAL_ONLY: "NUR NAMENSRELATION" },
      fit: percent => `Passung ${percent} %`,
      noRequirements: "keine Anforderungen · nicht bewertet",
      coverage: (evaluated, total) => `${formatCount(evaluated)} von ${formatCount(total)} Anforderungen semantisch geprüft`,
      gaps: n => `${formatCount(n)} erforderliche ohne Treffer`,
      why: "WARUM",
      whyHide: "AUSBLENDEN",
      formula: "Passung = Σ(Gewicht × Wert) / Σ Gewicht · erforderlich 3 · bevorzugt 2 · optional, unbekannt 1",
      necessity: { REQUIRED: "erforderlich", PREFERRED: "bevorzugt", OPTIONAL: "optional", UNKNOWN: "unbekannt" },
      source: { SEMANTIC: "semantisch", LEXICAL: "Name", NONE: "keine" },
      state: {
        EQUIVALENT: "gleichwertig", COVERS: "deckt ab", PARTIAL: "teilweise", DIFFERENT: "verschieden", UNCLEAR: "unklar",
        NAME_EXACT: "Name exakt", NAME_ALIAS: "Name Alias", NAME_COMPOSITE_CONSTITUENT: "Namensteil", WEAK_TOKEN_CONTAINMENT: "schwaches Namenswort", NONE: "keine Relation"
      },
      contribution: (weight, value, contribution) => `×${weight} · ${decimal("de")(value)} → ${decimal("de")(contribution)}`,
      proposal: name => `Fähigkeit: ${name}`,
      explanation: "Aussage",
      limitation: "Begrenzung",
      quote: "Quelle"
    },
    manualHint: "Die manuelle Entdeckung bleibt: Pools selbst freigeben, Rollen selbst prüfen."
  }
};
