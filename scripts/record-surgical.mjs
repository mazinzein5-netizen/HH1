// Records one full loop of the promo video artifact to JPEG frames + a concat
// manifest, using CDP screencast. First navigation warms the cache (fonts,
// background clip); the page is then reloaded and capture begins exactly when
// the fresh mount calls window.startRecording, so frame 0 = scene 1 start.
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const CHROME =
  "/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome";
const URL = "http://localhost:80/surgical-video/";
const TOTAL_MS = 6200 + 5600 + 5000 + 4400 + 5000; // SCENE_DURATIONS sum
const OUT_DIR = "/tmp/surgical-frames";
const WIDTH = 1280;
const HEIGHT = 720;

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
