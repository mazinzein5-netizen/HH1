import { Router, type IRouter } from "express";
import {
  PRIVACY_POLICY_APP_NAME,
  PRIVACY_POLICY_COMPANY,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
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

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy — ${escapeHtml(PRIVACY_POLICY_APP_NAME)}</title>
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
  footer { margin-top: 36px; font-size: 0.8rem; }
</style>
</head>
<body>
<main>
  <h1>Privacy Policy</h1>
  <p class="muted">${escapeHtml(PRIVACY_POLICY_APP_NAME)} · Last updated: ${escapeHtml(PRIVACY_POLICY_LAST_UPDATED)}</p>
  ${PRIVACY_POLICY_SECTIONS.map(
    (s) => `<section class="card">
    <h2>${escapeHtml(s.heading)}</h2>
    <p>${escapeHtml(s.body)}</p>
  </section>`
  ).join("\n  ")}
  <footer class="muted">&copy; ${escapeHtml(PRIVACY_POLICY_COMPANY)} — This page shows the same privacy policy text that is displayed inside the app.</footer>
</main>
</body>
</html>`;

router.get("/privacy", (_req, res) => {
  res.type("html").send(page);
});

export default router;
