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
