import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ALLOWED_DOMAINS = [
  "asterix.health",
  "asterix.co.uk",
  "asterixgp.co.uk",
  "asterixhealth.co",
  "asterix-health.co.uk",
  "asterixhealth.co.uk",
];

function isAllowedUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }
  const hostname = parsed.hostname.toLowerCase();
  return ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith("." + domain)
  );
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isAllowedUrl(url)) {
    return new Response(
      JSON.stringify({ error: "URL must be under an allowed Asterix domain" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const code = randomBytes(4).toString("hex");
  await redis.set(`short:${code}`, url);

  const host = req.headers.get("host") || "links.asterix.health";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const shortUrl = `${protocol}://${host}/${code}`;

  return new Response(
    JSON.stringify({ code, shortUrl, originalUrl: url }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
