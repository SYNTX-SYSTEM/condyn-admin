import { AsyncLocalStorage } from "node:async_hooks";
import { requireActiveJobScope } from "../job-scope/context";
import { isIssuedPersonInvestigation, type AnalysisBoundary, type PersonInvestigation } from "./boundary";

/**
 * The person investigation of the claimed job the Career worker is processing (PERSON). PERSON_X_JOB keeps using the
 * job-scope context unchanged. requireActiveAnalysisBoundary answers for both; outside either nothing may run.
 */
const activePerson = new AsyncLocalStorage<PersonInvestigation>();

export function runWithPersonInvestigation<T>(investigation: PersonInvestigation, run: () => Promise<T>): Promise<T> {
  if (!isIssuedPersonInvestigation(investigation)) throw new TypeError("ERR_INVESTIGATION_NOT_ISSUED");
  return activePerson.run(investigation, run);
}

/** The issued boundary of the current job: its person investigation, or else its validated job scope (or refusal). */
export function requireActiveAnalysisBoundary(): AnalysisBoundary {
  return activePerson.getStore() ?? requireActiveJobScope();
}
