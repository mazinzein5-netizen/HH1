/**
 * Development and production server for the Health HIVE website.
 *
 * For every HTML request the server:
 *  1. Replaces the <!-- @ROUTE_META@ --> placeholder with route-specific
 *     <head> SEO tags (title, description, canonical, og:*, twitter:*).
 *  2. Replaces the <!-- @ROUTE_BODY@ --> placeholder inside <div id="root">
 *     with a static HTML summary of the route so search engines, social bots,
 *     and AI crawlers receive meaningful body content before JavaScript runs.
 *
 * This approach is safe in both dev and production because it only touches
 * the named placeholders — Vite-injected CSS links, preload hints, and module
 * tags that Vite appends to <head> are preserved intact.
 *
 * In development: Vite runs as Express middleware (HMR works normally).
 * In production:  serves the Vite-built static files from dist/public.
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT);
const basePath = (process.env.BASE_PATH ?? "/").replace(/\/$/, "");

if (!port || Number.isNaN(port)) {
  throw new Error("PORT environment variable is required.");
}

// ─── Route metadata & static body content ────────────────────────────────────

const SITE_URL = "https://healthhive.app";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;
const IMAGE_ALT =
  "Health HIVE — safe, auditable digitisation of patient files for primary and secondary care in Ireland";

/**
 * Each entry covers one public route.
 * `match` is a function so more-specific routes can be listed first and
 * checked before their prefix siblings (e.g. /portal/login before /portal).
 * `body` is a static HTML string inserted into <div id="root"> — this is what
 * crawlers without JS see. React replaces it on mount (createRoot, not hydrate).
 */
const ROUTE_META = [
  {
    match: (p) => p === "/" || p === "",
    path: "/",
    title: "Safe Digitisation of Patient Files in Ireland | Health HIVE",
    description:
      "Health HIVE is an Irish digital health platform for the safe, auditable digitisation of patient files in primary and secondary care — patient-held records, streamlined clinical documentation and GDPR-first data protection, aligned with Digital for Care 2024–2030 and the Sláintecare direction.",
    ogTitle: "Health HIVE — Safe, Auditable Digital Patient Records for Ireland",
    ogDescription:
      "Irish digital health platform for the safe digitisation of patient files across primary and secondary care. Audit-ready records, GDPR-first, aligned with Ireland's Digital for Care framework.",
    body: `
      <header>
        <h1>Health HIVE — Safe Digitisation of Patient Files in Ireland</h1>
        <p>An Irish digital health platform for the safe, auditable digitisation of patient files in primary and secondary care — patient-held records, streamlined clinical documentation and GDPR-first data protection.</p>
      </header>
      <main>
        <section>
          <h2>For Patients</h2>
          <p>Keep your health records organised, share them securely with clinicians in emergencies, and stay in control of your data at all times.</p>
        </section>
        <section>
          <h2>For GPs, Hospitals &amp; Clinicians</h2>
          <p>Streamlined, audit-ready clinical documentation with instant access to patient-approved records, emergency shares, and biometric-secured portal access — less paperwork in primary and secondary care.</p>
        </section>
        <section>
          <h2>Aligned with Ireland's Digital Health Direction</h2>
          <p>Designed in step with Digital for Care 2024–2030, the Sláintecare direction, HIQA's information-management standards, the Health Information Act, GDPR and the Irish Data Protection Act 2018. Alignment reflects design goals, not endorsement or certification by any public body.</p>
        </section>
        <section>
          <h2>The HIVE Ecosystem</h2>
          <p>A connected platform built in Dublin, Ireland that spans patient health records, clinical decision support, encrypted data exchange, and emergency care co-ordination.</p>
        </section>
        <nav>
          <a href="/book">Book a Consultation</a>
          <a href="/portal">Clinician Portal</a>
          <a href="/portal/pricing">Partner Plans</a>
          <a href="/portal/privacy">Privacy</a>
        </nav>
      </main>`,
  },
  {
    match: (p) => p === "/book",
    path: "/book",
    title: "Book a HIVE Consultation | Health HIVE",
    description:
      "Browse verified HIVE practitioners with open video and audio consultation slots. Book your connected health appointment online.",
    ogTitle: "Book a HIVE Consultation",
    ogDescription:
      "Browse verified HIVE practitioners with open video and audio slots and book your connected health appointment online.",
    body: `
      <main>
        <h1>Book a HIVE Consultation</h1>
        <p>Browse practitioners in the HIVE pilot programme with open video and audio consultation slots and book your appointment online.</p>
        <p>All consultations are conducted with HIVE-verified practitioners who have completed biometric identity verification.</p>
        <a href="/">Back to Health HIVE</a>
      </main>`,
  },
  {
    match: (p) => p === "/portal/login",
    path: "/portal/login",
    title: "Log In to HIVE Portal | Health HIVE",
    description:
      "Log in to your HIVE Portal account. Secure password and biometric second-factor authentication for verified healthcare partners.",
    ogTitle: "Log In — HIVE Portal",
    ogDescription:
      "Secure login for verified HIVE healthcare partners. Password plus mandatory biometric second factor.",
    body: `
      <main>
        <h1>Log In to HIVE Portal</h1>
        <p>Sign in to your HIVE healthcare partner account using your password and biometric second factor.</p>
        <p><a href="/portal/signup">Create an account</a> | <a href="/portal">Back to Portal</a></p>
      </main>`,
  },
  {
    match: (p) => p === "/portal/signup",
    path: "/portal/signup",
    title: "Create Your HIVE Portal Account | Health HIVE",
    description:
      "Sign up for a HIVE Portal account as a healthcare professional or caretaker. Join Ireland's connected health network with verified, biometric-secured access.",
    ogTitle: "Create Your HIVE Portal Account",
    ogDescription:
      "Sign up as a verified healthcare professional or caretaker. Biometric-secured access to Ireland's connected health network.",
    body: `
      <main>
        <h1>Create Your HIVE Portal Account</h1>
        <p>Join the HIVE Emergency Portal as a verified healthcare professional or caretaker. Accounts require biometric identity verification.</p>
        <p><a href="/portal/login">Already have an account? Log in</a> | <a href="/portal">Back to Portal</a></p>
      </main>`,
  },
  {
    match: (p) => p === "/portal/pricing",
    path: "/portal/pricing",
    title: "Partner Subscription Plans | Health HIVE",
    description:
      "Flexible monthly and annual subscription plans for HIVE Portal partners — verified access, emergency viewer, caretaker dashboard, and biometric 2FA.",
    ogTitle: "HIVE Portal — Partner Subscription Plans",
    ogDescription:
      "Monthly and annual subscriptions for verified practitioners. Includes emergency viewer, caretaker dashboard, and biometric 2FA.",
    body: `
      <main>
        <h1>Partner Subscription Plans</h1>
        <p>Flexible plans for verified HIVE healthcare partners.</p>
        <section>
          <h2>Monthly Plan — €25/month</h2>
          <ul>
            <li>Verified professional access</li>
            <li>Emergency viewer</li>
            <li>Caretaker dashboard</li>
            <li>Biometric 2FA</li>
          </ul>
        </section>
        <section>
          <h2>Annual Plan — €99/year</h2>
          <ul>
            <li>Everything in Monthly</li>
            <li>Best value — save vs monthly</li>
            <li>Priority verification</li>
            <li>Biometric 2FA</li>
          </ul>
        </section>
        <p>Demo mode always stays free. <a href="/portal">Back to Portal</a></p>
      </main>`,
  },
  {
    match: (p) => p === "/portal/privacy",
    path: "/portal/privacy",
    title: "Privacy Policy | Health HIVE",
    description:
      "Plain-language disclosures on how the HIVE Emergency Portal handles data — patient-approved access only, no central storage, automatic share expiry.",
    ogTitle: "Privacy Policy — Health HIVE",
    ogDescription:
      "Patient-approved access only, no central patient database, automatic share expiry, and on-device verification images. Privacy by design.",
    body: `
      <main>
        <h1>Privacy Policy</h1>
        <p>Plain-language disclosures about how the HIVE Emergency Portal handles data.</p>
        <section>
          <h2>Patient-approved access only</h2>
          <p>A patient's data is only ever visible through an emergency share that the patient themselves approved on their own device. There is no back door and no way to browse patient records.</p>
        </section>
        <section>
          <h2>Nothing stored centrally without consent</h2>
          <p>We do not keep a central database of patient records. Emergency shares are transient — they live only as a temporary relay and are never written to disk.</p>
        </section>
        <section>
          <h2>Shares expire automatically</h2>
          <p>Every emergency share is time-limited and expires on its own. Once expired, the code stops working immediately and the data is gone.</p>
        </section>
        <section>
          <h2>Caretaker sharing is opt-in and revocable</h2>
          <p>Location and vitals only appear while the patient has actively opted in. The moment they revoke, sharing stops and the link goes dead.</p>
        </section>
        <section>
          <h2>Verification images stay on your device</h2>
          <p>In this pilot, any selfie, photo ID or certification you capture for verification stays on your own device. These images are never uploaded to any server.</p>
        </section>
        <a href="/portal">Back to Portal</a>
      </main>`,
  },
  {
    match: (p) => p === "/portal" || p.startsWith("/portal/"),
    path: "/portal",
    title: "HIVE Emergency Portal | Health HIVE",
    description:
      "The HIVE Emergency Portal gives verified clinicians instant, patient-approved access to critical health records in life-saving situations.",
    ogTitle: "HIVE Emergency Portal — Clinician Access",
    ogDescription:
      "Instant, patient-approved access to critical health records for verified clinicians. Built for life-saving, last-minute situations.",
    body: `
      <main>
        <h1>HIVE Emergency Portal</h1>
        <p>For life-saving, last-minute situations. Gives verified clinicians instant, patient-approved access to critical health records.</p>
        <section>
          <h2>Emergency access</h2>
          <p>Use a patient-issued emergency share code to view critical health information instantly at the point of care.</p>
        </section>
        <nav>
          <a href="/portal/login">Log In</a>
          <a href="/portal/signup">Create Account</a>
          <a href="/portal/pricing">Partner Plans</a>
          <a href="/portal/privacy">Privacy</a>
        </nav>
      </main>`,
  },
];

const DEFAULT_META = {
  path: "/",
  title: "Health HIVE Ecosystem | Connected Health Platform Ireland",
  description:
    "A connected health platform from Ireland. Patients keep their records organised; clinicians stay supported on call.",
  ogTitle: "Health HIVE Ecosystem",
  ogDescription:
    "A connected health platform from Ireland. Patients keep their records organised; clinicians stay supported on call.",
  body: `<main><h1>Health HIVE Ecosystem</h1><p>A connected health platform from Ireland.</p></main>`,
};

function resolveMeta(urlPath) {
  const stripped = basePath && urlPath.startsWith(basePath)
    ? urlPath.slice(basePath.length) || "/"
    : urlPath;
  const clean = (stripped.split("?")[0].split("#")[0]) || "/";
  return ROUTE_META.find((r) => r.match(clean)) ?? DEFAULT_META;
}

// ─── Injectors ────────────────────────────────────────────────────────────────

function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaBlock(meta) {
  const canonical = `${SITE_URL}${meta.path}`;
  return [
    `<meta charset="UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${esc(meta.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(meta.ogDescription)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${DEFAULT_IMAGE}" />`,
    `<meta property="og:image:alt" content="${esc(IMAGE_ALT)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${esc(IMAGE_ALT)}" />`,
  ].join("\n    ");
}

/**
 * Replace only the two named placeholders — all other head content
 * (Vite-injected CSS, preload tags, module scripts) is untouched.
 */
function injectMeta(html, meta) {
  return html
    .replace("<!-- @ROUTE_META@ -->", buildMetaBlock(meta))
    .replace("<!-- @ROUTE_BODY@ -->", meta.body ?? "");
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

if (isProd) {
  const distDir = path.resolve(__dirname, "dist/public");

  app.use(basePath || "/", express.static(distDir, { index: false }));

  app.use((req, res) => {
    const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
    const meta = resolveMeta(req.path);
    const html = injectMeta(template, meta);
    res.status(200).set("Content-Type", "text/html").end(html);
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const templatePath = path.resolve(__dirname, "index.html");
      let template = fs.readFileSync(templatePath, "utf-8");
      // Let Vite inject its dev-server tags (@vite/client, HMR, etc.)
      template = await vite.transformIndexHtml(url, template);
      const meta = resolveMeta(req.path);
      const html = injectMeta(template, meta);
      res.status(200).set("Content-Type", "text/html").end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(
    `Health HIVE website server running on port ${port} (${isProd ? "production" : "development"})`,
  );
});
