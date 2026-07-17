import { Router, type IRouter } from "express";
import { getWhopClient } from "../whopClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VALID_TIERS = ["gold", "red"] as const;
const VALID_BILLING = ["monthly", "yearly"] as const;
type PaidTier = (typeof VALID_TIERS)[number];
type Billing = (typeof VALID_BILLING)[number];

function planIdFor(tier: PaidTier, billing: Billing): string | undefined {
  const key = `WHOP_PLAN_${tier.toUpperCase()}_${billing.toUpperCase()}`;
  return process.env[key];
}

function resultPage(title: string, body: string, ok: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0B1220;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{max-width:420px;text-align:center;background:#111827;border:1px solid #1F2937;border-radius:20px;padding:36px 28px}
.icon{font-size:44px}.h{font-size:22px;font-weight:700;margin:14px 0 8px}.p{font-size:14.5px;line-height:1.6;color:#9CA3AF}
.badge{display:inline-block;margin-top:18px;padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;
background:${ok ? "#F5C51822" : "#ef444422"};color:${ok ? "#F5C518" : "#f87171"};border:1px solid ${ok ? "#F5C51855" : "#ef444455"}}</style></head>
<body><div class="card"><div class="icon">${ok ? "✅" : "↩️"}</div><div class="h">${title}</div><div class="p">${body}</div>
<div class="badge">Return to the HIVE COMPANION app</div></div></body></html>`;
}

/* Server-side idempotency: retries for the same membership choice reuse the
 * SAME Whop checkout configuration for 24h, so a network timeout + retry on
 * the client can never open two live payment pages for one purchase. The map
 * is in-memory; the client's own pending-checkout store is the durable guard. */
const pendingConfigs = new Map<string, { id: string; url: string; createdAt: number }>();
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

function prunePendingConfigs(): void {
  const now = Date.now();
  for (const [k, v] of pendingConfigs) {
    if (now - v.createdAt > PENDING_TTL_MS) pendingConfigs.delete(k);
  }
}

// Create a Whop hosted-checkout configuration for a Gold/Red membership.
router.post("/whop/checkout", async (req, res) => {
  try {
    const { tier, billing, reference, userId } = (req.body ?? {}) as {
      tier?: string;
      billing?: string;
      reference?: string;
      userId?: string;
    };

    if (!VALID_TIERS.includes(tier as PaidTier) || !VALID_BILLING.includes(billing as Billing)) {
      return res.status(400).json({ error: "Invalid tier or billing cycle." });
    }
    if (!reference || typeof reference !== "string") {
      return res.status(400).json({ error: "A payment reference is required." });
    }

    const planId = planIdFor(tier as PaidTier, billing as Billing);
    if (!planId) {
      logger.error({ tier, billing }, "Whop plan id not configured");
      return res.status(503).json({
        error: "Membership prices are not configured yet. Please try again later.",
      });
    }

    prunePendingConfigs();
    const idemKey = `${userId ?? "anon"}_${reference}_${tier}_${billing}`;
    const cached = pendingConfigs.get(idemKey);
    if (cached) {
      return res.json({ url: cached.url, sessionId: cached.id });
    }

    const whop = await getWhopClient();
    const baseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
    const config = await whop.checkoutConfigurations.create({
      plan_id: planId,
      redirect_url: `${baseUrl}/api/whop/checkout/success`,
      metadata: {
        tier,
        billing,
        reference,
        userId: userId ?? "",
      },
    });

    if (!config?.id || !config.purchase_url) {
      logger.error({ config }, "Whop checkout configuration missing id or purchase_url");
      return res.status(502).json({
        error: "Could not start the card payment. Please try again.",
      });
    }

    pendingConfigs.set(idemKey, {
      id: config.id,
      url: config.purchase_url,
      createdAt: Date.now(),
    });

    return res.json({ url: config.purchase_url, sessionId: config.id });
  } catch (err) {
    logger.error({ err }, "Failed to create Whop checkout configuration");
    return res.status(502).json({
      error: "Could not start the card payment. Please try again.",
    });
  }
});

// Poll a checkout configuration's payment state (app calls this after the
// browser returns). Payment truth lives on Whop — never the client.
router.get("/whop/checkout-status/:configId", async (req, res) => {
  try {
    const { configId } = req.params;
    if (!configId || !configId.startsWith("ch_")) {
      return res.status(400).json({ error: "Invalid checkout id." });
    }
    const whop = await getWhopClient();
    const page = await whop.payments.list({
      company_id: process.env["WHOP_COMPANY_ID"],
      checkout_configuration_ids: [configId],
    });

    const paidPayment = (page.data ?? []).find(
      (p) =>
        !p.refunded_at &&
        ["paid", "succeeded", "completed"].includes(String(p.status ?? "").toLowerCase()),
    );

    const meta = (paidPayment?.metadata ?? {}) as Record<string, unknown>;
    const metaStr = (key: string): string | null =>
      typeof meta[key] === "string" ? (meta[key] as string) : null;

    return res.json({
      status: paidPayment ? "complete" : "open",
      paid: Boolean(paidPayment),
      reference: metaStr("reference"),
      tier: metaStr("tier"),
      billing: metaStr("billing"),
    });
  } catch (err) {
    logger.error({ err }, "Failed to check Whop payment status");
    return res.status(502).json({ error: "Could not check the payment status." });
  }
});

// Friendly landing pages after Whop hosted checkout redirects.
router.get("/whop/checkout/success", (_req, res) => {
  res
    .status(200)
    .type("html")
    .send(
      resultPage(
        "Payment complete",
        "Thank you — your HIVE membership payment went through. You can close this page and return to the app; your card will activate automatically.",
        true,
      ),
    );
});

router.get("/whop/checkout/cancel", (_req, res) => {
  res
    .status(200)
    .type("html")
    .send(
      resultPage(
        "Payment not completed",
        "No charge was made. You can close this page, return to the app and try again — or choose to pay at a HIVE node instead.",
        false,
      ),
    );
});

export default router;
