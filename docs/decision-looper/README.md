# CONDYN Decision Looper

The **Decision Looper** is the core operational feedback loop of the CONDYN Decision Operating System. It bridges the gap between semantic extraction (understanding a candidate or job) and real-world outcomes (what actually happened when a decision was made).

## Purpose
While the wider `condyn-admin` serves as a container for prompt testing, infrastructure, and topological analysis, the Decision Looper is a self-contained bounded context responsible for:
- Deriving Recommendations from Canonical Data.
- Tracking the transition from Recommendation to Action.
- Gathering real-world Feedback and Attribution.
- Using historic loops to rigorously test and promote new Decision Policies.

## Documentation Map

- [ARCHITECTURE.md](./ARCHITECTURE.md) - How the Decision Looper is structured.
- [INVARIANTS.md](./INVARIANTS.md) - The unbreakable mathematical and domain laws of the looper.
- [TEST_LEDGER.md](./TEST_LEDGER.md) - The regression ledger of all resolved system bugs and architectural discoveries.
- [PERSISTENCE.md](./PERSISTENCE.md) - Immutable lifecycle storage rules.
- [DECISION_LIFECYCLE.md](./DECISION_LIFECYCLE.md) - The seven stages of the decision artifact lifecycle.
- [ROADMAP.md](./ROADMAP.md) - The strategic path toward full automation and event queueing.

## Separation of Concerns
The Decision Looper codebase currently lives within `condyn-admin` (`lib/career/`, `test/career-*`), but its architecture is fundamentally decoupled. It shares infrastructure (PostgreSQL, Vitest, basic API types) with the admin shell, but its invariants and domain logic exist entirely within this bounded context, paving the way for future repository extraction.
