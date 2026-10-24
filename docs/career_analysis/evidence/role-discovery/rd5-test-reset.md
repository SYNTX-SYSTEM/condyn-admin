# RD-5 · test reset under owner D-RD-5 = B (GELB decision: variant (1) + (2))

Owner D-RD-5 = B: under PERSON, role discovery replaces the legacy orbits 03–06. The PERSON capability proposals (02) and the API
stay unchanged; no legacy scoring. GELB chose (1) + (2):

- **(1)** Every field assertion on 03–06 under PERSON becomes an explicit inverse (absence), as under PERSON × JOB.
- **(2)** Every component property checked through the field for 03–06 is now checked on the components themselves. The
  composition is the field's own: `FocusTransitionStageShell` + `SilOrbitEmptyState` + `SilOrbitEmptyStateCopy`, and
  `resolveSilOrbitAttentionState` / `resolveSilFocusedOrbitPresentation` into `OrbitalResonanceBubble`.

No test is deleted and no assertion is loosened. Every assertion outside 03–06 is kept verbatim: EN/DE chrome, dock geometry, 01/02,
empty orbits 01/02, PxJ inverses, VIEW MATCHES on 01/02 under PERSON.

What the legacy orbits carried under PERSON, all from the legacy result through `lib/career/ui-adapter.ts`:

| Orbit | Source |
|---|---|
| 03 | `analysis.organizations` |
| 04 | `analysis.roles` with the legacy fitScore (evaluateAlignment / buildRoleRecommendation) |
| 05 | always `[]` |
| 06 | `analysis.strategies` |

The demo-pool matching sits only behind VIEW MATCHES.

Reason codes: **A** = D-RD-5, 03–06 are no longer part of the PERSON field (inverse). **B** = component check in place of the field
check. **N** = new.

## Field inverses (1): fail on ccc0cc1, pass here

| File | Test | Assertion before | Assertion after | Reason |
|---|---|---|---|---|
| test/career-f12-pulse-alignment.test.tsx | *new* "RD-5 · under PERSON the field renders no Stage 03/04/05/06 shell, also when a focus requests it" (×4) | — | no `focus-transition-stage-shell-` / `empty-copy-foreground-` of 03–06; shells 01, 02 present; `data-focused-stage-id=""` | A, N |
| test/career-sil-empty-orbit-visual-attention.test.tsx | "wires all six empty orbits after SUCCEEDED" → "wires both empty field orbits after SUCCEEDED; no orbit 03–06 under PERSON" | 6 × `EMPTY_PROJECTION_ATTENTION` | 2 × (01, 02); no `orbital-physics-03…06` | A |
| test/career-sil-empty-orbit-visual-attention.test.tsx | "flags only actually empty orbits after SUCCEEDED" | 5 (02 filled) | 1 (01; 02 filled) | A |
| test/career-sil-global-language-wiring.test.tsx | "renders the complete active SIL root chrome in English" | contains RESONANCE ORBITS, ROLE MANIFESTATION, TENSION FIELD, EVOLUTION PATHS | does not contain them; every other line verbatim | A |
| test/career-sil-global-language-wiring.test.tsx | "… in German" | contains RESONANZ-ORBITS, ROLLENMANIFESTATION, SPANNUNGSFELD, ENTWICKLUNGSPFADE | does not contain them; every other line verbatim | A |
| test/career-demo-ui.test.tsx | "should render SemanticCareerIntelligenceField in pure Zero-State without fake fallback data" | contains RESONANCE ORBITS | does not contain it; "0 items", core, CAPABILITY FIELD, no demo data: verbatim | A |
| test/career/hr-decision-loop/dock-ssr.test.tsx | "mounts the dock for an explicit DCTXREV and preserves the complete field geometry" | shells 01–06 present | shells 01, 02 present; 03–06 absent; dock, chrome, order: verbatim | A |
| test/career/pxj-first-screen/first-screen-ssr.test.tsx | "PERSON: all six orbits, the coupling and VIEW MATCHES as on the base; the PERSON result shown" → "PERSON: orbits 01 and 02 only, VIEW MATCHES on them as on the base; no orbit, ray, coupling, inspector node or text of 03 … 06; the PERSON result shown" | shells 01–06; coupling; bubbles 01–06 with hideViewMatches false; ≥ 4 × "1 items" (legacy items) | shells 01, 02; no shell / energy ray 03–06; no coupling; bubbles `[01,false],[02,false]`; no legacy name; inspector without ORG/ROLE/STR; no PxJ first screen; result on 01 (1 item) and 02 (3 items) | A |
| test/career/pxj-first-screen/first-screen-ssr.test.tsx | *new* "a legacy stage requested by focus is not shown under PERSON" | — | focus on 03–06 → `data-focused-stage-id=""`, zoom 0 | A, N |

## Component checks (2): pass on ccc0cc1 and here

| File | Test | Same properties as before |
|---|---|---|
| test/career-f12-pulse-alignment.test.tsx | "renders active empty Stage bubble and empty projection beneath one shared shell (components, Stage 03…06)"; 01/02 stay "(field, …)" | shell holds bubble, underlay, copy, pulse; underlay holds `sil-orbit-empty-state-`; z-index 0/1/3; copy left 50% translateX(-50%); no "NO ACTUAL ITEMS PROJECTED" |
| test/career-f12-pulse-alignment.test.tsx | "uses the Stage 03/04/05 shell—not bubble or empty projection—for asymmetric orbit translation (components)" | shell translate(−x, −y); bubble without left/top; copy without orbit pixel offsets |
| test/career-f12-pulse-alignment.test.tsx | "locates the real Stage 05 empty-projection copy beneath its focus shell (components)" | "EMPTY FIELD // EXPLAINED", "NO GAP PROJECTION AVAILABLE" |
| test/career-f12-pulse-alignment.test.tsx | *new* "each Stage 03…06 component labels its empty projection in English and German" (×4) | empty-field label, the stage's empty title and orbit name per locale; DE without the EN name (GELB condition 3) |
| test/career-sil-empty-orbit-visual-attention.test.tsx | *new* "orbits 03–06 as components: each empty one breathes after SUCCEEDED, none while RUNNING" | 03–06 attention from the field's resolver into the bubble |
| test/career-sil-empty-orbit-visual-attention.test.tsx | *new* "orbits 03–06 as components: only an actually empty one is flagged" | a filled 03 is not flagged; 04–06 are |
| test/career-sil-global-language-wiring.test.tsx | *new* "orbits 03–06 (component) carry their names in the selected locale" | the four EN and DE names from `SIL_COPY`, rendered by the bubble; not the other locale's |
| test/career-demo-ui.test.tsx | *new* "should render orbits 03–06 (component) with 0 items in Zero-State" | stage id, name, "0 items" |

## Proof

- On ccc0cc1, with the six test files of this commit: 12 failed / 71 passed. The 12 failures are exactly the field inverses above.
  All component checks pass there.
- On this commit, the focused suite is 69 files, 568 passed, 1 failed. The failure is T-07 `person-markup.test.tsx`, the byte
  fixture of 49e2bc6. It is re-set in the next commit with its documented delta (rd5-t07-delta.md).
- VIEW MATCHES under PERSON is unchanged on 01/02 (`viewMatchesHidden` = PERSON × JOB only). Open point **O-RD5-VM** for GELB/owner:
  should VIEW MATCHES (demo-pool legacy matching) also leave PERSON? Not changed without a decision.
