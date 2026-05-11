# RRFA
# Memory Kernels

---

## Architectural Position

The memory layer preserves:
temporal continuity
without infinite accumulation.

---

## Kernel Definition

K(Δt) = e^(-λΔt)

with:

λ > 0

---

## Effective Primitive State

Ṕᵢ(t) =
Σₖ Pᵢ(sₖ)e^(-λ(t)(t-tₖ))

---

## Constraints

The memory kernel prevents:
- hard deletion
- infinite persistence
- recursive poisoning

---

## Adaptive Lambda

λ(t) =
λ₀ + β · Turbulence(t)

---

## Final Statement

Memory kernels preserve:
recursive temporal continuity
through controlled decay.
