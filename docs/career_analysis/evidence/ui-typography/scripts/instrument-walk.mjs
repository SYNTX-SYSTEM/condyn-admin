// Writes an instrumented copy of GELB's END-TO-END VIDEO WALK (../../video-readiness/scripts/video-walk.mjs, unchanged): every
// screenshot the walk takes also writes the text inventory of that frame (./inventory.mjs) beside it. The walk's checks stay as they are.
// argv: <out file>. Run from the repository root.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const [OUT] = process.argv.slice(2);
let source = readFileSync(resolve(here, "../../video-readiness/scripts/video-walk.mjs"), "utf8");
const shot = 'await page.screenshot({ path: `${OUT}/${String(shotNo).padStart(2, "0")}-${name}-${W}.png` }); };';
if (!source.includes(shot)) throw new Error("video-walk.mjs: the screenshot line changed; the instrument needs an update");
source = source.replace('import { pathToFileURL } from "node:url";', `import { pathToFileURL } from "node:url";\nimport { inventory } from ${JSON.stringify(resolve(here, "inventory.mjs"))};`);
source = source.replace(shot, 'await page.screenshot({ path: `${OUT}/${String(shotNo).padStart(2, "0")}-${name}-${W}.png` }); writeFileSync(`${OUT}/${String(shotNo).padStart(2, "0")}-${name}-${W}.inv.json`, JSON.stringify(await inventory(page))); };');
writeFileSync(OUT, source);
