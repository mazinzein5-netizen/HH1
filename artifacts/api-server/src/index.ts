import app from "./app";
import { logger } from "./lib/logger";
import { hydratePracStores, flushPracStores } from "./routes/practitioner";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Initialize the Stripe schema, managed webhook and data sync.
 * Non-fatal: the rest of the API keeps working until Stripe is connected.
 */
async function initStripe() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — Stripe payments disabled");
    return;
  }
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl });
    const { getStripeSync } = await import("./stripeClient");
    const stripeSync = await getStripeSync();
    const webhookBaseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");
    stripeSync
      .syncBackfill()
      .then(() => logger.info("Stripe data synced"))
      .catch((err) => logger.error({ err }, "Error syncing Stripe data"));
  } catch (err) {
    logger.warn(
      { err },
      "Stripe not initialized (connect the Stripe integration to enable card payments)",
    );
  }
}

await initStripe();

try {
  await hydratePracStores();
} catch (err) {
  logger.error({ err }, "Failed to hydrate practitioner stores from database");
  process.exit(1);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Graceful shutdown: let in-flight practitioner store writes land first.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    void flushPracStores().finally(() => process.exit(0));
  });
}
