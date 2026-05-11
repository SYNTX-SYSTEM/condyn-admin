# RRFA
# Runtime Separation

---

## Architectural Position

RRFA separates:
all major runtime operations.

---

## Runtime Layers

The runtime separates:

- transformation
- primitive activation
- memory persistence
- field aggregation
- drift propagation
- projection
- rendering

---

## Separation Principle

No runtime layer may:

- bypass lower layers
- inject ontology
- directly modify unrelated states

---

## Structural Constraints

The mapper may NOT:

- access field topology
- access renderer state
- access semantic interpretation

The renderer may NOT:

- access raw events
- generate primitives
- rewrite drift states

---

## Purpose

Runtime separation prevents:

- recursive conflation
- semantic leakage
- uncontrolled coupling

---

## Final Statement

Runtime separation preserves:
bounded recursive organisation
across all operational layers.
