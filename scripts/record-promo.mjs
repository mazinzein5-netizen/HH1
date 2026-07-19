// One-command promo export: records one full loop of the promo video artifact
// via CDP screencast, encodes it to MP4 (with the website's ambient audio bed),
// extracts a poster frame, and writes both into artifacts/website/public/videos.
//
// The total duration is parsed from SCENE_DURATIONS in the promo source, so a
// re-paced animation can never be truncated by a stale hardcoded constant.
//
// Alignment: first navigation warms the cache (fonts, background clip); the
// page is then reloaded and capture begins exactly when the fresh mount calls
// window.startRecording, so frame 0 = scene 1 start.
//
// Usage: node scripts/record-promo.mjs   (promo-video workflow must be running)
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = join(
  ROOT,
  "artifacts/promo-video/src/components/video/VideoTemplate.tsx"
);
const AMBIENT = join(ROOT, "artifacts/website/public/audio/promo-ambient.mp3");
const OUT_MP4 = join(ROOT, "artifacts/website/public/videos/hive-companion-promo.mp4");
const OUT_POSTER = join(
  ROOT,
  "artifacts/website/public/videos/hive-companion-promo-poster.jpg"
);

const CHROME =
  "/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome";
const URL = "http://localhost:80/promo-video/";
const OUT_DIR = "/tmp/promo-frames";
const WIDTH = 1280;
const HEIGHT = 720;

// Read SCENE_DURATIONS from the promo source of truth.
function readTotalMs() {
  const src = readFileSync(TEMPLATE, "utf8");
  const block = src.match(/export const SCENE_DURATIONS\s*=\s*\{([^}]*)\}/);
  if (!block) {
    throw new Error(`Could not find SCENE_DURATIONS in ${TEMPLATE}`);
  }
  const entries = [...block[1].matchAll(/(\w+)\s*:\s*(\d+)/g)];
  if (entries.length === 0) {
    throw new Error("SCENE_DURATIONS parsed but contained no numeric entries");
  }
  const total = entries.reduce((sum, m) => sum + Number(m[2]), 0);
  console.log(
    `SCENE_DURATIONS: ${entries.map((m) => `${m[1]}=${m[2]}`).join(", ")} → total ${total}ms`
  );
  return total;
}

const TOTAL_MS = readTotalMs();

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required",
    `--window-size=${WIDTH},${HEIGHT}`,
    "--force-device-scale-factor=1",
    "--hide-scrollbars",
  ],
  defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  const cdp = await page.createCDPSession();

  let capturing = false;
  let captureArmed = false;
  let captureDone;
  const captureFinished = new Promise((res) => (captureDone = res));

  await page.exposeFunction("startRecording", async () => {
    if (!captureArmed || capturing) return;
    capturing = true;
    console.log("startRecording fired — capturing one full pass...");
    setTimeout(() => {
      capturing = false;
      captureDone();
    }, TOTAL_MS);
  });
  await page.exposeFunction("stopRecording", () => {});

  const frames = []; // { file, ts }
  let frameIndex = 0;
  cdp.on("Page.screencastFrame", async (ev) => {
    try {
      if (capturing) {
        const file = join(OUT_DIR, `f${String(frameIndex++).padStart(5, "0")}.jpg`);
        writeFileSync(file, Buffer.from(ev.data, "base64"));
        frames.push({ file, ts: ev.metadata.timestamp });
      }
      await cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId });
    } catch {
      /* session may already be closed */
    }
  });

  console.log("Warm-up load...");
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((res) => setTimeout(res, 3000));

  console.log("Starting screencast and reloading for aligned capture...");
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 90,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
    everyNthFrame: 1,
  });
  captureArmed = true;
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });

  await Promise.race([
    captureFinished,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error("capture never started/finished")), TOTAL_MS + 60000)
    ),
  ]);
  await cdp.send("Page.stopScreencast");
  await new Promise((res) => setTimeout(res, 500));

  if (frames.length < 50) throw new Error(`captured too few frames: ${frames.length}`);

  // Build concat manifest with real inter-frame durations.
  const t0 = frames[0].ts;
  const end = frames[frames.length - 1].ts;
  let manifest = "";
  for (let i = 0; i < frames.length; i++) {
    const dur =
      i < frames.length - 1
        ? frames[i + 1].ts - frames[i].ts
        : Math.max(TOTAL_MS / 1000 - (end - t0), 1 / 30);
    manifest += `file '${frames[i].file}'\nduration ${dur.toFixed(6)}\n`;
  }
  manifest += `file '${frames[frames.length - 1].file}'\n`;
  writeFileSync(join(OUT_DIR, "list.txt"), manifest);

  const effFps = frames.length / (end - t0);
  console.log(
    `Captured ${frames.length} frames over ${(end - t0).toFixed(2)}s (~${effFps.toFixed(1)} fps)`
  );
} finally {
  await browser.close();
}

// Encode MP4 (video from frames, ambient audio bed trimmed + faded to length).
const totalSec = TOTAL_MS / 1000;
const fadeStart = Math.max(totalSec - 2, 0);
console.log("Encoding MP4 with ffmpeg...");
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", join(OUT_DIR, "list.txt"),
    "-i", AMBIENT,
    "-filter_complex",
    `[0:v]fps=30,format=yuv420p[v];[1:a]atrim=0:${totalSec},afade=t=out:st=${fadeStart}:d=2[a]`,
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-crf", "20",
    "-c:a", "aac",
    "-b:a", "128k",
    "-t", `${totalSec}`,
    "-movflags", "+faststart",
    OUT_MP4,
  ],
  { stdio: "inherit" }
);

console.log("Extracting poster frame...");
execFileSync(
  "ffmpeg",
  ["-y", "-ss", "1", "-i", OUT_MP4, "-frames:v", "1", "-q:v", "3", OUT_POSTER],
  { stdio: "inherit" }
);

const encoded = execFileSync("ffprobe", [
  "-v", "error",
  "-show_entries", "format=duration",
  "-of", "csv=p=0",
  OUT_MP4,
]).toString().trim();
console.log(
  `Done. Exported ${OUT_MP4} (${encoded}s, expected ${totalSec}s) and poster ${OUT_POSTER}`
);
if (Math.abs(Number(encoded) - totalSec) > 0.5) {
  throw new Error(
    `Encoded duration ${encoded}s differs from expected ${totalSec}s by more than 0.5s`
  );
}
