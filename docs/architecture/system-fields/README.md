# System Fields

This registry consolidates the repository into three executable semantic
fields. A field is defined by the authority and information relation it closes,
not by a directory, package, API endpoint, persistence adapter, or component.
Internal work units are execution checkpoints only; they are not approval
boundaries.

| Order | Field | Depends on | Egress |
| --- | --- | --- | --- |
| 01 | [Repository and Canonical Foundation](FIELD_01_REPOSITORY_AND_CANONICAL_FOUNDATION.md) | Existing sealed and preserved WIP | coherent canonical type/persistence/startup foundation |
| 02 | [Canonical Career End-to-End Runtime](FIELD_02_CANONICAL_CAREER_END_TO_END_RUNTIME.md) | Field 01 | canonical six-orbit Career product driven by exact persisted identities |
| 03 | [Post-Decision Feedback Loop Closure](FIELD_03_POST_DECISION_FEEDBACK_LOOP_CLOSURE.md) | Field 01 | exact persisted and replayable feedback-context revision history |

Fields 02 and 03 are siblings after Field 01. Neither acquires authority from
the other. They may run in either order once Field 01 has established their
shared foundation.

## Global laws

`ENTITY != REVISION`, `CONTENT != TRANSITION`, `TRANSITION != REVISION`, and
`REVISION != PERSISTENCE`. Persistence, replay, projection, transport, and
rendering do not create truth, authority, acceptance, currentness, learning,
causality, or a preferred branch. There is no semantic `current`, `latest`,
`head`, timestamp, row-order, or hash selector.

Every meaningful repair follows RED → earliest relation → GREEN → predecessor
and successor regression → persistence/replay/composition/runtime/API/SIL/UI
regression where applicable. A failure rebounds to its earliest owning layer.
Host capability, provider trust, human authority, product choice, and an
unreconciled preserved overlay are explicit boundaries, never implementation
shortcuts.
