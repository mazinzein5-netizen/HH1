import { handleRequest } from "./seo.mjs";

export default function handler(req, res) {
  const result = handleRequest(req);
  res.statusCode = result.statusCode;
  for (const [key, value] of Object.entries(result.headers || {})) {
    res.setHeader(key, value);
  }
  res.end(result.body);
}
