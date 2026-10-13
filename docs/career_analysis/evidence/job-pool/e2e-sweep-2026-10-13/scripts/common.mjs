import { appendFileSync, mkdirSync } from "node:fs";
export const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
export const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:41821";
export const DIR = "/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/e2e";
export const RESULTS = `${DIR}/results.jsonl`;
mkdirSync(`${DIR}/shots`, { recursive: true });
/** One check: step (1-10), id, pass, detail, kind REAL (real worker / real upload path) | FIXTURE | DERIVED */
export const rec = (step, id, pass, detail = "", kind = "REAL") => { const row = { at: new Date().toISOString(), step, id, pass: pass === true ? "PASS" : pass === false ? "FAIL" : pass, kind, detail: typeof detail === "string" ? detail : JSON.stringify(detail) }; appendFileSync(RESULTS, JSON.stringify(row) + "\n"); console.log(`${row.pass} [${step}] ${id} ${row.detail.slice(0, 220)}`); return row; };
export const closeOnboarding = async (page) => { try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 20000 }); await page.getByTestId("onboarding-close-btn").click(); await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 15000 }); } catch {} };
export const shot = (page, name) => page.screenshot({ path: `${DIR}/shots/${name}.png` });
export const getJson = async (path) => { const r = await fetch(`${BASE}${path}`); let body = null; try { body = await r.json(); } catch {} return { status: r.status, body }; };
