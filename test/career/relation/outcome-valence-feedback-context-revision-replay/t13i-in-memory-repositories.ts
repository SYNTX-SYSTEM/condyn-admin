type Scripted = unknown | Error | null;

/** Test-only read observability; replay has no writer or persistence authority. */
export class T13IInMemoryReaders {
  readonly decisionContextReads: string[] = [];
  readonly feedbackRevisionReads: string[] = [];
  readonly decisionContexts = new Map<string, unknown>();
  readonly feedbackRevisions = new Map<string, unknown>();
  readonly #decisionContextScripts = new Map<string, Scripted[]>();
  readonly #feedbackRevisionScripts = new Map<string, Scripted[]>();

  seedDecisionContext(value: Record<string, unknown>): void {
    this.decisionContexts.set(value.careerDecisionContextRevisionId as string, structuredClone(value));
  }

  seedFeedbackRevision(value: Record<string, unknown>): void {
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

  dependencies() {
    return {
      getCareerDecisionContextRevisionById: this.getCareerDecisionContextRevisionById,
      getCareerOutcomeValenceFeedbackContextRevisionById:
        this.getCareerOutcomeValenceFeedbackContextRevisionById,
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
