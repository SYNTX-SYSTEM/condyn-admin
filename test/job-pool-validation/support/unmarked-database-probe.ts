/**
 * Child-process probe for JP-H "no DDL on a non-disposable database": imports the upload route
 * against the DATABASE_URL of the parent and prints the HTTP outcome. Run outside vitest so the
 * route gate takes its own verdict on an unmarked database.
 */
import { validationPool } from "../fixtures/pool";

async function main(): Promise<void> {
  // @ts-ignore -- the v1 routes are owned by GELB and may be absent from this checkout
  const route = await import("../../../app/api/career/job-pools/route");
  const response = await route.POST(new Request("http://local/api/career/job-pools", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validationPool)
  }));
  const text = await response.text();
  let code: string | null = null;
  try { code = JSON.parse(text)?.error?.code ?? null; } catch { code = null; }
  process.stdout.write(`${JSON.stringify({ status: response.status, code })}\n`);
}

main().then(() => process.exit(0), (error) => { process.stdout.write(`${JSON.stringify({ status: null, code: null, thrown: String(error?.message ?? error) })}\n`); process.exit(0); });
