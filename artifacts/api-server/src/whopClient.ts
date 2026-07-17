// Whop integration client (Replit Whop connector).
// Credentials are fetched lazily from the Replit connection API — never
// hardcode the API key. Server-side only: never import this from app code.
import Whop from "@whop/sdk";

let clientPromise: Promise<Whop> | null = null;

async function initWhopClient(): Promise<Whop> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Missing Replit environment variables. " +
        "Ensure the Whop integration is connected via the Integrations tab.",
    );
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_name=whop`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!resp.ok) {
    throw new Error(`Failed to fetch Whop credentials: ${resp.status} ${resp.statusText}`);
  }

  const data = (await resp.json()) as {
    items?: { connector_name?: string; settings?: { api_key?: string } }[];
  };
  // The proxy can return every connection regardless of the filter param, so
  // select the Whop item explicitly instead of trusting items[0].
  const whopItem = data.items?.find((i) => i.connector_name === "whop");
  const apiKey = whopItem?.settings?.api_key;

  if (!apiKey) {
    throw new Error(
      "Whop integration not connected or missing credentials. " +
        "Connect Whop via the Integrations tab first.",
    );
  }

  return new Whop({ apiKey });
}

export function getWhopClient(): Promise<Whop> {
  if (!clientPromise) {
    clientPromise = initWhopClient().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}
