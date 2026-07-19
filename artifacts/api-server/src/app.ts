import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import privacyRouter from "./routes/privacy";
import supportRouter from "./routes/support";
import { logger } from "./lib/logger";

const app: Express = express();

// Stripe webhook must be registered BEFORE express.json() — it needs the raw Buffer.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0]! : signature;
      if (!Buffer.isBuffer(req.body)) {
        logger.error("Stripe webhook: req.body is not a Buffer — check middleware order");
        return res.status(500).json({ error: "Webhook processing error" });
      }
      const { WebhookHandlers } = await import("./webhookHandlers");
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      return res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ err: error }, "Stripe webhook error");
      return res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(
  (pinoHttp as any)({
    logger,
    serializers: {
      req(req:any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res:any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Large JSON bodies are only needed for voice transcription (base64 audio)
// and patient-file attachment uploads; every other route keeps the default.
const jsonDefault = express.json();
const jsonLarge = express.json({ limit: "25mb" });
const largeBodyPath = (path: string): boolean =>
  path === "/api/ai/transcribe" ||
  /^\/api\/portal\/practitioner\/patients\/[^/]+\/attachments$/.test(path);
app.use((req, res, next) =>
  largeBodyPath(req.path) ? jsonLarge(req, res, next) : jsonDefault(req, res, next)
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/", privacyRouter);
app.use("/", supportRouter);

export default app;
