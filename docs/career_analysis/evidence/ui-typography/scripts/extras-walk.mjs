// Surfaces the video walk does not show: onboarding, system codex (EN/DE), semantic guide, the German field, the scale and dense pools.
// argv: <lab state.json> <out dir> <W> <H>. Run after the video walk on the same lab (the engineering pool is uploaded by it).
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { inventory } from "./inventory.mjs";
import { scalePool } from "../../job-pool/role-orbit/scripts/scale-pool.mjs";
import { densePool } from "../../job-pool/role-cards/scripts/dense-pool.mjs";
const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [STATE, OUT, W = "1920", H = "1080"] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8")); const BASE = st.base;
const POOL = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const suffix = String(st.database ?? "lab").slice(-8);
const post = async body => { const r = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_TYPO_LAB" }, body: JSON.stringify(body) })).json(); return r.jobPoolUploadId ?? r.upload?.jobPoolUploadId; };
// The engineering pool (uploaded by the video walk; identical upload when it is there already), the scale and the dense pool.
await post(JSON.parse(readFileSync(new URL("../../../../examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json", import.meta.url), "utf8")));
const SP = await post(scalePool(suffix)); const DP = await post(densePool(suffix));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(W), height: Number(H) } });
const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(String(e)));
const t = id => page.getByTestId(id);
let n = 0;
const snap = async name => { n += 1; await page.waitForTimeout(900); const tag = `x${String(n).padStart(2, "0")}-${name}-${W}`; await page.screenshot({ path: `${OUT}/${tag}.png` }); writeFileSync(`${OUT}/${tag}.inv.json`, JSON.stringify(await inventory(page))); console.log("SNAP", tag); };
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log("FAIL", name, String(e).split("\n")[0]); } };
await page.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" });
await step("onboarding", async () => { await t("guided-onboarding-overlay").waitFor({ timeout: 30000 }); await snap("onboarding"); await t("onboarding-close-btn").click(); });
await step("codex", async () => { await t("open-system-codex-btn").click(); await t("system-codex-modal").waitFor(); await snap("codex-en"); await t("switch-lang-de").click(); await snap("codex-de"); await t("system-codex-close").click(); });
await step("guide", async () => { await t("semantic-guide-drawer-toggle").click(); await page.waitForTimeout(600); const box = await t("semantic-guide-drawer").boundingBox(); console.log("GUIDE box", JSON.stringify(box)); await snap("guide-de"); await t("semantic-guide-drawer").locator("button").first().dispatchEvent("click"); });
// The locale lives in the page's state only: after every navigation it is chosen again through the system codex.
let LANG = "de";
const chooseLang = async () => { await t("open-system-codex-btn").click(); await t(`switch-lang-${LANG}`).click(); await t("system-codex-close").click(); await page.waitForTimeout(300); };
const field = async (q, org, name) => {
  await page.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${q}`, { waitUntil: "networkidle" }); await t("syntx-field").waitFor({ timeout: 60000 }); await chooseLang();
  if (!org) return snap(name);
  await t(`syntx-organization-${org}`).waitFor({ timeout: 60000 }); await t(`syntx-organization-${org}`).dispatchEvent("click");
  await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor(); await page.waitForTimeout(1200); await snap(name);
};
await step("de-field", () => field(POOL, null, "de-pool-field"));
await step("de-kestrel", () => field(POOL, "org_kestrel", "de-kestrel"));
await step("de-role", async () => { await page.locator('[data-testid="syntx-role-role_kestrel_fullstack"]').dispatchEvent("click"); await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor(); await page.waitForTimeout(1200); await snap("de-role"); });
await step("de-req", async () => { const r = page.locator('[data-testid^="syntx-requirement-"]').first(); await r.dispatchEvent("click"); await page.waitForTimeout(1500); await snap("de-requirement"); });
await step("de-cap", async () => { await page.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500); await chooseLang(); await snap("de-capability-field"); });
await step("scale-14", () => field(SP, "org_orbit_14", "de-orbit-14"));
await step("scale-long", () => field(SP, "org_orbit_long_8", "de-orbit-long-8"));
await step("dense", () => field(DP, "org_cards_dense", "de-cards-dense"));
await step("narrow", () => field(DP, "org_cards_narrow", "de-cards-narrow"));
LANG = "en";
await step("en-scale-14", () => field(SP, "org_orbit_14", "en-orbit-14"));
await step("en-dense", () => field(DP, "org_cards_dense", "en-cards-dense"));
console.log(errors.length ? "FAIL page errors " + JSON.stringify(errors).slice(0, 300) : "PASS no page error");
await browser.close();
