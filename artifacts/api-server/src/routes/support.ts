import { Router, type IRouter } from "express";
import {
  PRIVACY_POLICY_APP_NAME,
  PRIVACY_POLICY_COMPANY,
} from "@workspace/privacy-policy";

const router: IRouter = Router();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SUPPORT_EMAIL = "support@ibncena.com";

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Support — ${escapeHtml(PRIVACY_POLICY_APP_NAME)}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0; padding: 0; background: #faf8f4; color: #1c1a15; line-height: 1.6;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #12100c; color: #ece8df; }
    .card { background: #1c1913 !important; border-color: #2e2a20 !important; }
    .muted { color: #a89f8d !important; }
  }
  main { max-width: 720px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-size: 1.7rem; letter-spacing: -0.02em; margin-bottom: 4px; }
  .muted { color: #6f6a5e; font-size: 0.85rem; }
  .card {
    background: #fff; border: 1px solid #e7e2d6; border-radius: 14px;
    padding: 20px 22px; margin-top: 18px;
  }
  h2 { font-size: 1.05rem; margin: 0 0 6px; }
  p { margin: 0; font-size: 0.95rem; }
  a { color: inherit; }
  footer { margin-top: 36px; font-size: 0.8rem; }
</style>
</head>
<body>
<main>
  <h1>Support</h1>
  <p class="muted">${escapeHtml(PRIVACY_POLICY_APP_NAME)} · ${escapeHtml(PRIVACY_POLICY_COMPANY)}</p>
  <section class="card">
    <h2>Contact us</h2>
    <p>For help with ${escapeHtml(PRIVACY_POLICY_APP_NAME)}, email us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. We aim to respond within 24 hours.</p>
  </section>
  <section class="card">
    <h2>In-app help</h2>
    <p>You can also reach us from inside the app via Settings &rarr; Help &amp; Support, which uses the same contact address.</p>
  </section>
  <section class="card">
    <h2>Privacy</h2>
    <p>Our privacy policy is available at <a href="/api/privacy">/api/privacy</a>. Your health data is stored only on your device; deleting the app or using "Delete all my data" in Settings removes it.</p>
  </section>
  <footer class="muted">&copy; ${escapeHtml(PRIVACY_POLICY_COMPANY)}</footer>
</main>
</body>
</html>`;

router.get("/support", (_req, res) => {
  res.type("html").send(page);
});

export default router;
