// Records the DDL that the registration path would issue, against a stub client. No database contact.
const R = process.argv[2];
const stmts: { src: string; text: string }[] = [];
let src = "";
const rec = (text: string) => { stmts.push({ src, text: text.replace(/\s+/g, " ").trim() }); return Promise.resolve([] as any); };
const tag: any = (strings: TemplateStringsArray, ...vals: unknown[]) => rec(strings.reduce((a, s, i) => a + s + (i < vals.length ? String(vals[i]) : ""), ""));
tag.unsafe = (t: string) => rec(t);
tag.begin = async (fn: (tx: any) => Promise<unknown>) => fn(tag);
tag.end = async () => undefined;
const drz: any = { execute: (q: any) => rec((q.queryChunks ?? []).map((c: any) => (c.value ?? []).join?.("") ?? "").join("")) };
(async () => {
  process.env.DATABASE_URL = "postgresql://stub.invalid:5432/stub";
  const { applyCareerDbSchema } = await import(`${R}/lib/career/db/client.ts`);
  const { initPostDecisionChainSchema } = await import(`${R}/lib/persistence/post-decision-chain-schema.ts`);
  const { ensureDecisionRuntimePostgresSchema } = await import(`${R}/lib/decision-runtime/composition/index.ts`);
  const { initCareerDecisionContextDecisionRevisionBindingSchema } = await import(`${R}/lib/career/relation-adapters/decision-context-decision-revision-binding-persistence/schema-registration.ts`);
  const { registerJobPoolPersistenceSchema } = await import(`${R}/lib/career/job-pool/persistence-schema.ts`);
  const { registerRelationCacheSchema } = await import(`${R}/lib/career/job-pool/relation-cache-repository.ts`);
  const { registerProviderCallRegisterSchema } = await import(`${R}/lib/career/provider-calls/register-schema.ts`);
  const steps: [string, () => Promise<unknown>][] = [
    ["applyCareerDbSchema(+T11,+SIL)", () => applyCareerDbSchema(tag)],
    ["initPostDecisionChainSchema", () => initPostDecisionChainSchema(tag)],
    ["ensureDecisionRuntimePostgresSchema", () => ensureDecisionRuntimePostgresSchema(drz)],
    ["initCareerDecisionContextDecisionRevisionBindingSchema", () => initCareerDecisionContextDecisionRevisionBindingSchema(tag)],
    ["registerJobPoolPersistenceSchema", () => registerJobPoolPersistenceSchema(tag)],
    ["registerRelationCacheSchema", () => registerRelationCacheSchema(tag).catch(e => console.log("  (expected stub verify failure:", String(e.message).slice(0, 40), ")"))],
    ["registerProviderCallRegisterSchema", () => registerProviderCallRegisterSchema(tag).catch(e => console.log("  (expected stub verify failure:", String(e.message).slice(0, 60), ")"))],
  ];
  for (const [name, run] of steps) { src = name; await run(); }
  const all = new Map<string, string>();
  for (const { src, text } of stmts) { const m = /CREATE TABLE IF NOT EXISTS "?([a-z0-9_]+)"?/i.exec(text) ?? /CREATE TABLE "?([a-z0-9_]+)"?/i.exec(text); if (m && !all.has(m[1])) all.set(m[1], src); }
  const by = new Map<string, number>(); for (const s of all.values()) by.set(s, (by.get(s) ?? 0) + 1);
  for (const [s, n] of by) console.log(`${String(n).padStart(4)}  ${s}`);
  console.log(`${String(all.size).padStart(4)}  DISTINCT TABLES`);
  const noIfNot = stmts.filter(s => /CREATE TABLE/i.test(s.text) && !/IF NOT EXISTS/i.test(s.text)); console.log("CREATE TABLE without IF NOT EXISTS:", noIfNot.length);
  const destructive = stmts.filter(s => /\b(DROP|DELETE|TRUNCATE|RENAME)\b|^UPDATE\b|ALTER TABLE/i.test(s.text));
  console.log("statements with DROP/DELETE/TRUNCATE/RENAME/UPDATE/ALTER TABLE:");
  for (const d of destructive) console.log("  [" + d.src + "] " + d.text.slice(0, 170));
  require("fs").writeFileSync(process.argv[3], JSON.stringify({ tables: [...all.entries()], stmts }, null, 1));
})().catch(e => { console.error("FAIL", e); process.exit(1); });
