// Warns when the hosted surgical MP4 on the website is older than the surgical
// animation source, meaning the export has gone stale and should be re-run
// with: pnpm --filter @workspace/scripts run export:surgical
//
// Exits 1 when stale so it can be used as a validation/CI check.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MP4 = join(
  ROOT,
  "artifacts/website/public/videos/hive-surgical-assistant.mp4"
);
const POSTER = join(
  ROOT,
  "artifacts/website/public/videos/hive-surgical-assistant-poster.jpg"
);
// Everything that affects the rendered surgical video: the animation source,
// its public assets, the ambient audio bed, and the recorder itself.
const SOURCES = [
  join(ROOT, "artifacts/surgical-video/src"),
  join(ROOT, "artifacts/surgical-video/public"),
  join(ROOT, "artifacts/website/public/audio/surgical-ambient.mp3"),
  join(ROOT, "scripts/record-surgical.mjs"),
];

function newestFile(path) {
  const st = statSync(path);
  if (!st.isDirectory()) return { file: path, mtime: st.mtimeMs };
  let newest = { file: null, mtime: -Infinity };
  for (const entry of readdirSync(path)) {
    const child = newestFile(join(path, entry));
    if (child.mtime > newest.mtime) newest = child;
  }
  return newest;
}

for (const out of [MP4, POSTER]) {
  if (!existsSync(out)) {
    console.error(`STALE: missing export ${relative(ROOT, out)}`);
    console.error(
      "Re-export with: pnpm --filter @workspace/scripts run export:surgical"
    );
    process.exit(1);
  }
}

const exportedAt = Math.min(statSync(MP4).mtimeMs, statSync(POSTER).mtimeMs);
let newest = { file: null, mtime: -Infinity };
for (const src of SOURCES) {
  if (!existsSync(src)) continue;
  const candidate = newestFile(src);
  if (candidate.mtime > newest.mtime) newest = candidate;
}

if (newest.mtime > exportedAt) {
  const ageMin = ((newest.mtime - exportedAt) / 60000).toFixed(1);
  console.error(
    `STALE: surgical source ${relative(ROOT, newest.file)} is newer than the exported MP4 (by ${ageMin} min).`
  );
  console.error(
    "Re-export with: pnpm --filter @workspace/scripts run export:surgical"
  );
  process.exit(1);
}

console.log("Surgical export is up to date with the animation source.");
