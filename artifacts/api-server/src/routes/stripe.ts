import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VALID_TIERS = ["gold", "red"] as const;
const VALID_BILLING = ["monthly", "yearly"] as const;
type PaidTier = (typeof VALID_TIERS)[number];
type Billing = (typeof VALID_BILLING)[number];

export function lookupKeyFor(tier: PaidTier, billing: Billing): string {
  return `hive_${tier}_${billing}`;
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

// Create a Stripe Checkout session for a Gold/Red membership.
router.post("/stripe/checkout", async (req, res) => {
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

    const stripe = await getUncachableStripeClient();
    const lookupKey = lookupKeyFor(tier as PaidTier, billing as Billing);
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) {
      logger.error({ lookupKey }, "Stripe price not found — run the seed-products script");
      return res.status(503).json({
        error: "Membership prices are not configured yet. Please try again later.",
      });
    }

    const baseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
    // Idempotency key ties retries for the same membership choice to one
    // Checkout Session for 24h, so a network timeout + retry on the client
    // can never create a second charge for the same purchase.
    const idempotencyKey = `hive_checkout_${userId ?? "anon"}_${reference}_${tier}_${billing}_${price.id}`;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${baseUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/api/stripe/checkout/cancel`,
        metadata: {
          tier: tier as string,
          billing: billing as string,
          reference,
          userId: userId ?? "",
        },
      },
      { idempotencyKey },
    );

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "Failed to create Stripe checkout session");
    return res.status(502).json({
      error: "Could not start the card payment. Please try again.",
    });
  }
});

// Poll a checkout session's payment state (app calls this after the browser returns).
router.get("/stripe/checkout-status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "Invalid session id." });
    }
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.json({
      status: session.status,
      paid: session.payment_status === "paid",
      reference: session.metadata?.["reference"] ?? null,
      tier: session.metadata?.["tier"] ?? null,
      billing: session.metadata?.["billing"] ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to retrieve Stripe checkout session");
    return res.status(502).json({ error: "Could not check the payment status." });
  }
});

// Friendly landing pages after Stripe Checkout redirects.
router.get("/stripe/checkout/success", (_req, res) => {
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

router.get("/stripe/checkout/cancel", (_req, res) => {
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
