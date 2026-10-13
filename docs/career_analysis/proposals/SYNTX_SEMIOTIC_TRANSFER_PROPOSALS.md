# SYNTX semiotic transfer — proposals for GELB and PINK

Owner mandate "GRÜN — SYNTX SEMIOTIC TRANSFER" (GO for variant A, 2026-10-12). GRÜN implemented the transfer on
`frontend/job-field` (on 5898def = 9e86d44 + plan 1.9.0) and changed no ruling, no binding and no PINK proof. This
document states, as **proposals only**, what GELB (R10, R15/R15a) and PINK (Q-01 … Q-12, the read-only walk) would record
or rebind if the owner approves the visual result. Nothing here is in force before that. Implementation reference:
`JOB_FIELD_FRONTEND.md` §13.2.3.

## P-1 · R10a — Capability Field: shared manifestation components (GELB)

R10 says "Capability Field out of scope: no chrome, orbit copy or sealed contract changes". Variant A touched Capability
files, but only to move code into shared components:

- moved: the resonance body, the HUD surface, the core organism, the planetarium backdrop and energy ray, the focus
  transformation shell, the cosmos shell and the deep-focus shell (`app/components/career/demo/manifestation/`);
  `OrbitalResonanceBubble`, `IdentityCoreDropZone`, `SemanticCareerIntelligenceField`, `CapabilityCosmosView`,
  `OrbitalCosmosView`, `CapabilityDeepFocusView` and `OrbitalDeepFocusView` now call them;
- unchanged: copy, orbit copy (B-ORBIT-COPY), chrome, sealed contracts, every test id, every style value, every animation;
- proof: 374 server renders of every touched Capability component captured before the move and compared after each step,
  byte for byte: 374 / 374 identical, sha256 `7d0e5c9147a9252a34cc2ac1818a212f6a0dda8bc950634ecdbf30e97bdc18b2` before and after;
  the sealed SIL language suites and every Capability test green unchanged (batch 40 files / 230 tests);
- the optional props added for the Job Field (`keyframes`, `pulseKeyframes`, `renderMoon`, `moonCount`, `gradientId`, slots; since the
  finishing pass the tone props `tone`, `orbitStroke`, `stars`, `spokeStroke`) default to the Capability Field's behaviour (render
  identity re-proven after the finishing pass: 374 / 374).

**Proposed wording (binding §4):** "R10a — The Capability Field and the Job Field share the SYNTX manifestation
components. Moving Capability code into these components is admitted when its server rendering stays byte-identical
(render-identity proof per change). R10 holds otherwise."

## P-2 · R15b — motion of the transferred field (GELB)

R15 / R15a bound the Job Field's own motion names. The transfer uses the Capability Field's motion instead. The proposed
closed list (LIVE only; REDUCED total — no CSS animation, no SMIL photon, the rAF clock never starts):

| Motion | Where | Kind |
|---|---|---|
| `orbitFloatPhase2` (25 s) | every organization body | infinite (Capability L0) |
| `moonOrbit` (160 s) | the role moons of an organization body (not on the focus anchor) | infinite |
| `atmosphereGlow` (3 s), `ringPulse` (2.4 s, second 1.2 s behind) | a highlighted organization body: hovered at JOB POOL, the focus anchor below it | infinite |
| `atmosphereGlow` (11 s, phased per body) | the atmosphere halo of every organization body (finishing pass) | infinite |
| `hologramFloat` (6 s) | the hover HUD of an organization body (not the inspection aperture, which holds still) | infinite |
| `focusTransitionPulse` (1.6 s) | the hovered body at JOB POOL, the focus anchor at ORGANIZATION | infinite |
| `coreBreathe`, `plasmaRotateCw`, `plasmaRotateCcw`, `plasmaFlarePulse`, `waveExpand`, `particleIn`, `corePulseCommunicate` (hover) | the pool core | infinite |
| `rotateClockwise` (120 s) | the planetarium's resonance ring | infinite |
| SMIL photon streams | planetarium rays (pool → organization) and every evidence trace | infinite |
| cosmos satellites (rAF, periods 130 s + 35 s per orbit) | the roles of the observed organization | continuous, shared clock |
| role cosmos rotation (rAF, 160 s, all orbits together) | requirements, source documents and their traces (recomputed every frame; `data-orbital-motion-*` on each source body) | continuous, shared clock |
| `sxSuspend` (48 s dash drift) | the one suspended boundary | infinite (as R15) |
| `sxApertureBreathe` (9 s, opacity of the glow layer only) | the open inspection aperture (the surface itself holds still) | infinite |
| `sxEnter`, `sxRise`, `sxUnfold`, `sxTraceDraw`, `sxSuspendEnter`, `sxNucleusSettle`, `sxSatelliteSettle` | level entry, requirement unfold, trace rise, deep-focus settle | finite |

No longer emitted: `sxOrbit`, `sxBreathe`, `sxMoonOrbit`, `sxAtmosphere`, `sxRingPulse`, `sxSettle`, `sxRecenter`,
`sxCoreSettle`, the 14 × 9 / 60 s carrier ellipse of R15a (the documents now ride the role cosmos). Receded levels keep their
motion, as in the Capability Field. No parameter derives from a score, rank, contribution or confidence (R4, R14).

## P-3 · PINK — `test/job-pool-validation/syntx-walk.e2e.test.ts` (Q-01 … Q-11, Q-06, carried states)

The walk as it stands fails on the transfer at three places, all representational. The first failing assertion in each test:

- Q-01: role carriers are buttons at FIELD;
- Q-06: the camera transition;
- the carried-states test: the focus tag `g#syntx-organization-…`.

The proposed rebinding is in `docs/career_analysis/proposals/syntx-walk.semiotic-transfer.patch` (66 changed lines; applies
cleanly to the file at 5898def). With it the walk passes **3 / 3** against the transfer, run on a disposable database. No
fachliche assertion is weakened or removed:

| Where | Today | Proposed | Why it is not weaker |
|---|---|---|---|
| Q-01 roles at FIELD | `role="button"`, `tabindex 0` | `data-manifestation-form="moon"`, interaction `none`, no role, `tabindex -1`; proofs, title, containment (moon inside its organization's region, screen space) unchanged | owner ruling "organizations first"; every role stays a carrier with its proofs (binding §2.1) |
| Q-01 / Q-02 / Q-03 / Q-04 camera | scale 1 / > 1 / 1.8 / 2.4 | `data-depth` 0 / 1 / 2 / 3 and the planetarium anchor scale 1 / 1.12 / 1.12 / 1.12 | the zoom no longer exists; the depth names the same observation level |
| Q-03 / Q-04 / Q-05 clicks on roles, requirements, open boundaries | `locator.click()` | pointer at the element's current centre after asserting `elementFromPoint` ownership | satellites move on the orbital clock (never "stable" for Playwright); ownership is a stronger check than actionability |
| Q-04 attribution | `sxAtmosphere` / `sxRingPulse` on the inspectable carrier only | kept, and `atmosphereGlow` / `ringPulse` only on organization bodies | R15b |
| Q-06 LIVE names, ROLE infinite set, FIELD ambient set | R15 / R15a names | R15b names; `moonOrbit` only on role moons | R15b |
| Q-06 camera transition / REDUCED camera `0s` | `[data-sx-camera]` | the focus shell: `transform, opacity, filter` over `0.78s, 0.62s, 0.62s`; REDUCED `0s` | the focus transformation replaces the camera |
| Q-08 buttons at FIELD | organizations + roles | organizations | organizations first; roles become buttons when their organization is observed |
| carried states focus tag | `g#syntx-organization-…` | `div#syntx-organization-…` | the organization sign is an HTML resonance body now |

Unchanged and green: GET-only (0 non-GET), the bodies byte-identical after the walk, every sign equal to the bodies and every
proof resolving (Q-10), the unsupported list (Q-07), no number before the pending aperture (Q-09), R2 one suspended boundary,
R3 neutral missing support, R5 / R6 texts, Escape at every level with focus kept inside the field (Q-08, F-SX-1), the
Capability Field round trip (Q-11), and R15a's coupling checks at ROLE (every trace a quadratic arc ending on its moving source
body, two photons per trace, every trace owning a pointer point in two frames 1.5 s apart, the bodies moving between them).

## P-4 · PINK — `test/job-pool-validation/support/syntx-readonly-walk.mjs` (GET-only walk on :3017)

The same rebinding at the same places (not run by GRÜN: it needs the owner-shaped analyses):

- line 107 `AMBIENT_NAMES`;
- lines 112 / 131 `ECOLOGY_NAMES` and `ecologyFrameOk` (R15b names, `moonOrbit` on role moons);
- line 213: the role click becomes organization → pointer at the role satellite;
- line 264: the requirement click becomes the pointer at the anchor;
- line 265: "camera 2.4" becomes `data-depth` 3;
- line 313: "camera 1" stays valid; add `data-depth` 0;
- lines 324 / 326: REDUCED `camera` becomes the focus shell `0s`.

Expected after rebinding: the same 149 checks.

## P-5 · GELB — governance (`syntx-field-governance.test.ts`)

Unchanged and green (10 / 10). `SyntxField.camera` now names the planetarium's focus anchor (the observed organization's body
at 1.12, the core at 1 at FIELD); the invariance test over FIELD / ORGANIZATION geometry (organizations' `x, y, radius`, roles'
`x, y, radius`, camera) still holds and now covers the planetarium orbits and the moon orbit. Optional: add `field.depth` to that
geometry.

## P-6 · R10b — the field selector in the application shell (GELB; owner mandate 2026-10-13)

The owner ordered the two small field buttons replaced by a SYNTX field selector with exclusive fields. The selector and the
exclusivity rule live in the Capability shell (`SemanticCareerIntelligenceField`), which R10 otherwise keeps unchanged. Proof:
of the 374 Capability renders, 366 are byte-identical; the 8 shell renders differ only by the selector subtree, the
`data-sx-shell` markers and the one exclusivity rule (identical after removing them). The Capability manifestation (planetarium,
cosmos, deep focus, HUDs, core) is untouched. The selector keeps the strip contract (`field-focus-strip`, two buttons,
`field-focus-capability-btn`, `job-pool-panel-toggle`, `data-field-focus-active`, `aria-pressed`); behaviour change: selecting the
active field no longer toggles back to CAPABILITY. New finite shell motion: `syntxFieldVeil` (.42 s, outside the field root, none
in REDUCED) — proposed for the R15b list as a shell transition.

**Proposed wording:** "R10b — The application shell carries the SYNTX field selector (two equal fields, exactly one visible).
Changes to the shell are admitted when every Capability manifestation render stays byte-identical and the shell renders differ only
by the selector and its shell markers."

## Owner decisions

None beyond the visual approval. After it, GELB records P-1 and P-2, and PINK applies P-3 / P-4 and validates. The move of
:3017 follows only on the owner's direct GO to GELB.
