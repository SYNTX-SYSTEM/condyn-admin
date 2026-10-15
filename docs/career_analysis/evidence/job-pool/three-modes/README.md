# Three investigation modes — evidence (owner GO "DEMO FRONTEND", 2026-10-15)

Lab: a disposable database, the real Next server (Result Inspector open with a lab token, exchange archive on) and the real worker
`scripts/run-career-worker.ts` (unchanged) whose Gemini is GRÜN's loopback stand-in on 127.0.0.1 (`scripts/gemini-standin.ts`).
Both processes run under `scripts/net-sentinel.cjs`, which refuses every non-loopback connection. No live Gemini; :3017 and :41831
untouched. The source is the synthetic gold CV `test/gold/case_001_minimal_valid/input/doc1.md` (fictitious person).

| File | Content |
|---|---|
| `walk-results-1600.txt`, `walk-results-1280.txt` | browser walk 38/38 per size (`scripts/walk.mjs <out> <lab state.json> [w h]`) |
| `api-flow-results.txt` | PERSON / PERSON × JOB through the API, B2, inspector, JOB structure (`scripts/api-flow.mjs`) |
| `shell-row-results.txt` | shell row geometry in both fields at 1280 / 1440 / 1600 / 1920 (`scripts/shell-check.mjs`) |
| `network-and-standin.txt` | stand-in requests by kind and scope block; refused non-loopback attempts (0 Gemini hosts) |
| `00`–`08-*.png` | ground state, PERSON analysis, GEMINI OUTPUT original response, B2 coverage, scope text, scope mismatch, JOB structure, PERSON with the job kept |

All scripts run from the repository root (paths relative to `process.cwd()`; the lab's sentinel is the one beside `modes-lab.ts`);
Playwright comes from `CONDYN_PLAYWRIGHT_MODULE`, else from the repository. Lab: `LAB_PORT=… LAB_STATE_FILE=… LAB_DIR=… tsx
docs/career_analysis/evidence/job-pool/three-modes/scripts/modes-lab.ts` with an isolated test-database role in the environment.

The lab token lives only in the lab's 0600 state file; it is in none of these files (the screenshots show the password field masked).
