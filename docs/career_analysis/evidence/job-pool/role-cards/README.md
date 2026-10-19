# Role orbit card refinement — evidence

Owner "SFE — GRÜN | ROLE ORBIT CARD REFINEMENT" (2026-10-19), on `frontend/role-cards` (stacked on the accepted orbit `e6493a7`).
The role cards of the organization cosmos are redrawn; the orbit, its air, motion and navigation stay as accepted.
Documentation: `docs/career_analysis/JOB_FIELD_FRONTEND.md` §13.2.33.

| File | What it holds |
|---|---|
| `after-org_*-{1600,1280}.png` | Kestrel (3 roles), 8 roles, 8 long and 12 short titles at 1600 × 1000 and 1280 × 720 |
| `after-measure-{1600,1280}.json` | per organization: compactness, orbit radii, card boxes, air at rest and over a whole turn; per card: box, title lines, room against content, centring, stated texts, contrast |
| `walk-results-{1600,1280}.txt` | the browser walk, 119/119 at each viewport |
| `scripts/role-card-walk.mjs` | the walk (against GRÜN's isolated three-mode lab; the role orbit walk's orbit checks plus the card checks C-1 … C-6) |

## The card

| Line | Content | Source |
|---|---|---|
| standing | the pool's seniority in its delivered parts (`Senior / L4` → `SENIOR · L4`) between two hairlines; `ROLE` where the pool states none | pool role `seniority` |
| title | the role title, centred, balanced, in the lines the layout counted; a dash stays at the end of its line | canonical mapping |
| domain | the pool's domain focus, one line (drawn-in orbits only) | pool role `domain_focus` |
| requirements | `9 REQUIREMENTS` (`1 REQUIREMENT`) | canonical mapping |
| matching | `NO MATCHING READ` / `MATCHING READ` with a hollow / filled mark | delivered presentation matching |

No score, rank or relation; nothing the pool and the matching do not state.

## Measured (accepted e6493a7 → now)

| Viewport | Organization | Cards (rendered) | Least air to the disc over a turn | Orbit |
|---|---|---|---|---|
| 1600 × 1000 | Kestrel | 195×88, 158×83, 219×88 → 195×100, 158×84, 219×100 | 27 → 22 px (rule: 21) | 251.8 × 190.7, unchanged |
| 1280 × 720 | Kestrel | same | 26 → 22 px | 246.2 × 194.6, unchanged |
| 1600 × 1000 | 8 roles | 219×88, 182×98, 147×83 … → 219×100, 182×100, 147×84 … | 75 → 69 px | 395.3 × 220.5, unchanged |
| 1600 × 1000 | 14 roles (packed) | as packed → at the packing's estimate | 5 → 5 px; between cards 0.1 → 3.2 px | as packed |
| 1280 × 720 | 14 roles (packed) | as packed → at the packing's estimate | 18 → 20 px; −78.1 → −75.9 px (O-RO-PACK-14) | as packed |

Contrast on the card's glass (WCAG ratio, least over every card): title 17.9, standing 10.2, domain 9.6, requirements 12.6,
matching 6.7. Passing under the orientation surface (O-JF-PANEL, card phases over a turn): Kestrel at 1280 3 → 5 of 216, the taller
cards; elsewhere unchanged.
