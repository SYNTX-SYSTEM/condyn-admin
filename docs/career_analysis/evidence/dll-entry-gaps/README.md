# frontend/dll-entry-gaps — STANDIN production walk

GELB's three decisions on GRÜN's DLL-full path review (integration/dll-full 29ae2d7), implemented on
`frontend/dll-entry-gaps`:

- `73dd9ce` point 1 — the closed Capability Field's text names both ways in (PERSON needs no job; PERSON × JOB needs
  one), EN+DE, instead of only "Select a job in the Job Field first".
- `4cf4e90` point 2 — the discovery panel's empty-pools dead end gets a real action, GO TO JOB FIELD (the existing
  field switch, no new URL parameter).
- `504947f` point 3 — a file dropped on the identity core reaches SourceDock's real intake (same validation as the
  file button, via a forwardRef handle) instead of a hardcoded no-op.

## Proofs

- Each point: one commit, a regression test that fails on its direct predecessor, an inverse that holds.
- Focused suite + e2e: 88 files, 743 passed, 4 skipped. tsc: 0 errors on every commit.
- Production build (`next build --webpack`, no flag): clean.
- STANDIN walk (`scripts/gaps-walk.mjs`), lab on :41883, production build of 504947f, real server + real worker,
  loopback stand-in: all 6 required viewports (1920×1080, 1600×900, 1440×900, 1280×720, 960×540@2, 640×360@2) —
  - the gate's tooltip and visible banner both name PERSON (no job) and PERSON × JOB (needs one);
  - switching investigation mode to PERSON opens the Capability Field gate with no job at all;
  - a real `drop` event (a genuine `DataTransfer`/`File`, not a click) on the identity core stages the file under
    SourceDock's own intake — the page shows the dropped file's real name;
  - the discovery panel still opens normally with the lab's two uploaded pools (point 2's actual empty-pools
    button is covered by the dedicated unit test — this lab always has pools uploaded at boot, so the walk only
    sanity-checks that opening it is unaffected).
- Net sentinel log (`net.jsonl`) was never created — nothing reached it, no live Gemini call anywhere.
- Six-orbit / T-07 / F12 suites unaffected (none of the three fixes touch PERSON markup, the legacy orbits, or the
  pulse-alignment surfaces GELB named as untouchable).

## Not touched, per GELB's instruction

The legacy orbits' label (D-RD-5, owner decision still open) and the known 960×540 / 1920×1080 layout findings.

Lab stopped (own PID, checked `/proc/<pid>/cwd` first), database torn down with it.
