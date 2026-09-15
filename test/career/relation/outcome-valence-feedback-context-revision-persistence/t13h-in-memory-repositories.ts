type UnknownRecord = Record<string, unknown>;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") return Object.fromEntries(
    Object.keys(value as UnknownRecord).sort().map(key => [key, canonical((value as UnknownRecord)[key])]),
  );
  return value;
}

export function stableT13H(value: unknown): string {
  return JSON.stringify(canonical(value));
}

type Scripted = unknown | Error | null;

/** Test-only observable heterogeneous repositories; this is not production persistence authority. */
export class T13HInMemoryRepositories {
  readonly decisionContextReads: string[] = [];
  readonly feedbackRevisionReads: string[] = [];
  readonly feedbackRevisionWrites: unknown[] = [];
  readonly decisionContexts = new Map<string, unknown>();
  readonly feedbackRevisions = new Map<string, unknown>();
  readonly #decisionContextScripts = new Map<string, Scripted[]>();
  readonly #feedbackRevisionScripts = new Map<string, Scripted[]>();
  writeFailure: Error | null = null;

  seedDecisionContext(value: UnknownRecord): void {
    this.decisionContexts.set(value.careerDecisionContextRevisionId as string, structuredClone(value));
  }

  seedFeedbackRevision(value: UnknownRecord): void {
    this.feedbackRevisions.set(value.careerOutcomeValenceFeedbackContextRevisionId as string, structuredClone(value));
  }

  scriptDecisionContextRead(id: string, ...responses: Scripted[]): void {
    this.#decisionContextScripts.set(id, responses);
  }

  scriptFeedbackRevisionRead(id: string, ...responses: Scripted[]): void {
    this.#feedbackRevisionScripts.set(id, responses);
  }

  readonly getCareerDecisionContextRevisionById = async (id: string): Promise<any | null> => {
    this.decisionContextReads.push(id);
    return this.#read(this.#decisionContextScripts, this.decisionContexts, id);
  };

  readonly getCareerOutcomeValenceFeedbackContextRevisionById = async (id: string): Promise<any | null> => {
    this.feedbackRevisionReads.push(id);
    return this.#read(this.#feedbackRevisionScripts, this.feedbackRevisions, id);
  };

  readonly writeCareerOutcomeValenceFeedbackContextRevision = async (value: any): Promise<void> => {
    this.feedbackRevisionWrites.push(structuredClone(value));
    if (this.writeFailure !== null) throw this.writeFailure;
    const id = value.careerOutcomeValenceFeedbackContextRevisionId as string;
    const existing = this.feedbackRevisions.get(id);
    if (existing !== undefined && stableT13H(existing) !== stableT13H(value)) {
      throw new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_IMMUTABLE_CONFLICT");
    }
    if (existing === undefined) this.feedbackRevisions.set(id, structuredClone(value));
  };

  dependencies() {
    return {
      getCareerDecisionContextRevisionById: this.getCareerDecisionContextRevisionById,
      getCareerOutcomeValenceFeedbackContextRevisionById:
        this.getCareerOutcomeValenceFeedbackContextRevisionById,
      writeCareerOutcomeValenceFeedbackContextRevision:
        this.writeCareerOutcomeValenceFeedbackContextRevision,
    };
  }

  #read(scripts: Map<string, Scripted[]>, values: Map<string, unknown>, id: string): any | null {
    const scripted = scripts.get(id)?.shift();
    if (scripted instanceof Error) throw scripted;
    if (scripted !== undefined) return scripted === null ? null : structuredClone(scripted);
    const value = values.get(id);
    return value === undefined ? null : structuredClone(value);
  }
}
