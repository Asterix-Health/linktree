import { randomBytes } from "crypto";

const UPSTASH_URL = process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

async function redis(command) {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis error ${res.status}: ${text}`);
  }
  return (await res.json()).result;
}

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

  try {
    const code = randomBytes(4).toString("hex");
    await redis(["SET", `short:${code}`, url]);

    // Save suggestions for combobox auto-populate
    const parsed = new URL(url);
    const baseUrl = parsed.origin + parsed.pathname;
    const saves = [redis(["SADD", "suggestions:pageUrl", baseUrl])];
    const source = parsed.searchParams.get("utm_source");
    const medium = parsed.searchParams.get("utm_medium");
    const campaign = parsed.searchParams.get("utm_campaign");
    if (source) saves.push(redis(["SADD", "suggestions:source", source]));
    if (medium) saves.push(redis(["SADD", "suggestions:medium", medium]));
    if (campaign) saves.push(redis(["SADD", "suggestions:campaign", campaign]));
    await Promise.all(saves);

    const host = req.headers.get("host") || "links.asterix.health";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const shortUrl = `${protocol}://${host}/${code}`;

    return new Response(
      JSON.stringify({ code, shortUrl, originalUrl: url }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
