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

const SITE_URL = "https://healthhive.ie";
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
      "Health HIVE is an Irish digital health platform for the safe, auditable digitisation of patient files — GDPR-first records for patients, GPs and hospitals.",
    ogTitle: "Health HIVE — Safe, Auditable Digital Patient Records for Ireland",
    ogDescription:
      "Safe, auditable digital patient records for Ireland — GDPR-first, built for patients, GPs and hospital teams.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Health HIVE",
        legalName: "HIVE HEALTH ECOSYSTEM Ltd",
        url: "https://healthhive.ie",
        logo: "https://healthhive.ie/favicon.png",
        email: "info@ibnceena.ie",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dublin",
          addressCountry: "IE",
        },
        description:
          "Irish digital health platform for the safe, auditable digitisation of patient files in primary and secondary care.",
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "HIVE Companion",
        operatingSystem: "Android",
        applicationCategory: "HealthApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        description:
          "Patient-held digital health record app — organised records, prescriptions, standardised questionnaires and an emergency health card, with all personal data stored on the device.",
        url: "https://healthhive.app/",
        publisher: { "@type": "Organization", name: "Health HIVE" },
      },
    ],
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
    match: (p) => p === "/portal",
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

/**
 * Client-side routes that exist in the SPA but are gated, role-specific
 * utility flows — not public landing pages. They are served (so direct
 * entry still works for signed-in users) but marked noindex so crawlers
 * do not treat them as public content.
 */
const GATED_PORTAL_ROUTES = new Set([
  "/portal/emergency",
  "/portal/caretaker",
  "/portal/supportive",
  "/portal/responder",
  "/portal/practitioner",
]);

function isGatedRoute(p) {
  return GATED_PORTAL_ROUTES.has(p) || p.startsWith("/portal/practitioner/");
}

const GATED_META = {
  path: "/portal",
  title: "HIVE Portal | Health HIVE",
  description: "Sign in required. This HIVE Portal area is for verified account holders.",
  ogTitle: "HIVE Portal — Sign In Required",
  ogDescription: "This HIVE Portal area is for verified account holders.",
  body: `<main><h1>HIVE Portal</h1><p>This area requires a verified HIVE Portal account. <a href="/portal/login">Log in</a> or <a href="/portal">return to the portal landing page</a>.</p></main>`,
};

const NOT_FOUND_META = {
  path: "/",
  title: "Page Not Found | Health HIVE",
  description: "The page you are looking for does not exist on Health HIVE.",
  ogTitle: "Page Not Found — Health HIVE",
  ogDescription: "The page you are looking for does not exist on Health HIVE.",
  body: `<main><h1>Page Not Found</h1><p>The page you are looking for does not exist. <a href="/">Return to Health HIVE</a>.</p></main>`,
};

function normalizePath(urlPath) {
  const stripped = basePath && urlPath.startsWith(basePath)
    ? urlPath.slice(basePath.length) || "/"
    : urlPath;
  let clean = (stripped.split("?")[0].split("#")[0]) || "/";
  // Trailing-slash variants resolve to their canonical no-slash route.
  while (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  return clean || "/";
}

/**
 * Resolve a request path to { meta, status, robots }:
 *  - explicit public routes  → 200, index
 *  - gated portal utilities  → 200, noindex (SPA still loads for users)
 *  - anything else           → 404, noindex
 */
function resolveRoute(urlPath) {
  const clean = normalizePath(urlPath);
  const meta = ROUTE_META.find((r) => r.match(clean));
  if (meta) return { meta, status: 200, robots: "index, follow" };
  if (isGatedRoute(clean)) return { meta: GATED_META, status: 200, robots: "noindex, nofollow" };
  return { meta: NOT_FOUND_META, status: 404, robots: "noindex, nofollow" };
}

// ─── Injectors ────────────────────────────────────────────────────────────────

function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaBlock(meta, robots = "index, follow") {
  const canonical = `${SITE_URL}${meta.path}`;
  const indexable = robots.startsWith("index");
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    // Canonical + og:url only make sense on indexable pages.
    ...(indexable ? [`<link rel="canonical" href="${canonical}" />`] : []),
    `<meta property="og:site_name" content="Health HIVE" />`,
    `<meta property="og:locale" content="en_IE" />`,
    `<meta property="og:title" content="${esc(meta.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(meta.ogDescription)}" />`,
    `<meta property="og:type" content="website" />`,
    ...(indexable ? [`<meta property="og:url" content="${canonical}" />`] : []),
    `<meta property="og:image" content="${DEFAULT_IMAGE}" />`,
    `<meta property="og:image:alt" content="${esc(IMAGE_ALT)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${esc(IMAGE_ALT)}" />`,
    // Structured data must be in the initial HTML for non-rendering crawlers.
    ...(meta.jsonLd ?? []).map(
      (schema) =>
        `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`
    ),
  ].join("\n    ");
}

/**
 * Replace only the two named placeholders — all other head content
 * (Vite-injected CSS, preload tags, module scripts) is untouched.
 */
function injectMeta(html, meta, robots) {
  return html
    .replace("<!-- @ROUTE_META@ -->", buildMetaBlock(meta, robots))
    .replace("<!-- @ROUTE_BODY@ -->", meta.body ?? "");
}

/**
 * 301-redirect trailing-slash variants (e.g. /book/ → /book) so each public
 * route has exactly one canonical URL. Returns true if a redirect was sent.
 */
function redirectTrailingSlash(req, res) {
  if (req.path.length > 1 && req.path.endsWith("/")) {
    const target = req.path.replace(/\/+$/, "") || "/";
    const query = req.originalUrl.includes("?")
      ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
      : "";
    res.redirect(301, target + query);
    return true;
  }
  return false;
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

if (isProd) {
  const distDir = path.resolve(__dirname, "dist/public");

  app.use(basePath || "/", express.static(distDir, { index: false }));

  app.use((req, res) => {
    if (redirectTrailingSlash(req, res)) return;
    const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
    const { meta, status, robots } = resolveRoute(req.path);
    const html = injectMeta(template, meta, robots);
    res.status(status).set("Content-Type", "text/html").end(html);
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
      if (redirectTrailingSlash(req, res)) return;
      const url = req.originalUrl;
      const templatePath = path.resolve(__dirname, "index.html");
      let template = fs.readFileSync(templatePath, "utf-8");
      // Let Vite inject its dev-server tags (@vite/client, HMR, etc.)
      template = await vite.transformIndexHtml(url, template);
      const { meta, status, robots } = resolveRoute(req.path);
      const html = injectMeta(template, meta, robots);
      res.status(status).set("Content-Type", "text/html").end(html);
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
