import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import privacyRouter from "./routes/privacy";
import supportRouter from "./routes/support";
import { logger } from "./lib/logger";

const app: Express = express();

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
// Large JSON bodies are only needed for voice transcription (base64 audio);
// every other route keeps the small default limit.
const jsonDefault = express.json();
const jsonLarge = express.json({ limit: "25mb" });
app.use((req, res, next) =>
  req.path === "/api/ai/transcribe" ? jsonLarge(req, res, next) : jsonDefault(req, res, next)
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/", privacyRouter);
app.use("/", supportRouter);

export default app;
