import type { SilLocale } from "../../../../lib/career/view-model/sil-language";

/**
 * Copy of the navigation and recovery closure (owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-2 / N-5), EN and DE. Kept beside its
 * components: the assignment's file boundary leaves the shared copy table (lib/career/view-model/sil-language.ts) unchanged.
 */
export const NAVIGATION_COPY: Readonly<Record<SilLocale, {
  jobNotFoundTitle: string;
  jobNotFound: string;
  jobIdLabel: string;
  stagedNotKept: string;
  /** V-06: closes the banner of a job followed from the URL (no retry, no POST). */
  dismiss: string;
  /** V-08: a source that cannot be read in its format fails the same way again — no RETRY, the way instead. */
  formatFailure: string;
}>> = {
  en: {
    jobNotFoundTitle: "ANALYSIS JOB NOT FOUND",
    jobNotFound: "The server knows no analysis job with this id. Nothing is restarted and nothing is guessed.",
    jobIdLabel: "Analysis job",
    stagedNotKept: "Staged sources live in this page only: reloading, Back or Forward discards them. Nothing is stored.",
    dismiss: "CLOSE",
    formatFailure: "This source cannot be read as a PDF; RETRY would fail the same way. Remove it from the staged sources and add it again as a readable PDF, a .md / .txt file or with ENTER TEXT / MARKDOWN."
  },
  de: {
    jobNotFoundTitle: "ANALYSE-JOB NICHT GEFUNDEN",
    jobNotFound: "Der Server kennt keinen Analyse-Job mit dieser ID. Es wird nichts neu gestartet und nichts geraten.",
    jobIdLabel: "Analyse-Job",
    stagedNotKept: "Vorbereitete Quellen gibt es nur auf dieser Seite: Neuladen, Zurück oder Vor verwirft sie. Gespeichert wird nichts.",
    dismiss: "SCHLIESSEN",
    formatFailure: "Diese Quelle ist als PDF nicht lesbar; RETRY würde genauso scheitern. Entferne sie aus den vorbereiteten Quellen und füge sie als lesbares PDF, als .md-/.txt-Datei oder über TEXT / MARKDOWN EINGEBEN erneut hinzu."
  }
};
