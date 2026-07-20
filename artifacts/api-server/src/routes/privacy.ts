import { Router, type Request, type IRouter } from "express";
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

const APP_NAME = escapeHtml(PRIVACY_POLICY_APP_NAME);
const COMPANY = escapeHtml(PRIVACY_POLICY_COMPANY);
const LAST_UPDATED = escapeHtml(PRIVACY_POLICY_LAST_UPDATED);
const DESCRIPTION = `Read the ${APP_NAME} privacy policy to understand how we handle your health data, what information we collect, and your rights as a user.`;
const SECTIONS_HTML = PRIVACY_POLICY_SECTIONS.map(
  (s) => `<section class="card">
    <h2>${escapeHtml(s.heading)}</h2>
    <p>${escapeHtml(s.body)}</p>
  </section>`
).join("\n  ");

function buildPage(canonicalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy — ${APP_NAME}</title>
<meta name="description" content="${DESCRIPTION}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:type" content="website">
<meta property="og:title" content="Privacy Policy — ${APP_NAME}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:url" content="${canonicalUrl}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Privacy Policy — ${APP_NAME}">
<meta name="twitter:description" content="${DESCRIPTION}">
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
  <p class="muted">${APP_NAME} · Last updated: ${LAST_UPDATED}</p>
  ${SECTIONS_HTML}
  <footer class="muted">&copy; ${COMPANY} — This page shows the same privacy policy text that is displayed inside the app.</footer>
</main>
</body>
</html>`;
}

function canonicalUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.hostname;
  return `${proto}://${host}/privacy`;
}

router.get("/privacy", (req, res) => {
  res.type("html").send(buildPage(canonicalUrl(req)));
});

export default router;
