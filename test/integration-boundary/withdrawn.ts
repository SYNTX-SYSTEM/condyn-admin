/**
 * THE WITHDRAWAL MARK — one definition, because four guards kept re-deriving it and one of them re-armed
 * itself against the evidence of its own finding.
 *
 * This record's discipline is to correct in place and NEVER delete the original sentence: a withdrawn claim
 * stays readable so a later reader can see what was believed and when it stopped being true. *** BUT A
 * GUARD THAT SCANS TEXT IS INSIDE ITS OWN POPULATION, SO THE QUOTATION OF A DEFECT IS INDISTINGUISHABLE
 * FROM THE DEFECT. *** It happened four times in a single sitting, each time in a different shape:
 *
 *   1. `dependency-claim-currency` flagged the two docstrings that correctly quote their own withdrawn
 *      sentence, and then flagged ITS OWN docstring for quoting the defect it was written to catch;
 *   2. a Python comment kept a dead machine-local path alive merely by naming it, making a repaired file
 *      indistinguishable from an unrepaired one;
 *   3. `instrument-portability`'s F-R13 limb flagged `gelb-paths.mjs` for the withdrawn identity anchor
 *      quoted in the very comment that records its correction.
 *
 * So the mark is ATTRIBUTABLE AND DATED, on the claim's own line, and a BARE mark silences nothing: an
 * unmarked or badly marked line falls back to being a LIVE claim and dies on the live limb. That is the
 * AUTHORISED_CROSSINGS shape applied to prose — an exemption must name who granted it and when, or it is
 * not an exemption at all.
 *
 *   [WITHDRAWN <finding-id> <YYYY-MM-DD>] "<the sentence, verbatim>"
 *
 * `<finding-id>` is a finding (`F-R13`, `PF-2`) or an amendment (`A-G494`). The date is the day it lapsed,
 * not the day it was written.
 */

/** Matches an attributable, dated withdrawal mark anywhere on a line. */
export const WITHDRAWAL = /\[WITHDRAWN (F-[A-Z0-9-]+|[A-Z]+-[A-Z0-9]+-?\d*|[A-Z]-G\d+) (20\d\d-\d\d-\d\d)\]/;

/** The finding id and date, or null when the line carries no valid mark — including a bare `[WITHDRAWN]`. */
export function withdrawalOn(line: string): string | null {
  const mark = line.match(WITHDRAWAL);
  return mark === null ? null : `${mark[1]} ${mark[2]}`;
}
