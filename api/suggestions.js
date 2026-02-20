const UPSTASH_URL = process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

async function redis(command) {
  const r = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Redis error ${r.status}: ${text}`);
  }
  return (await r.json()).result;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [pageUrl, source, medium, campaign] = await Promise.all([
      redis(["SMEMBERS", "suggestions:pageUrl"]),
      redis(["SMEMBERS", "suggestions:source"]),
      redis(["SMEMBERS", "suggestions:medium"]),
      redis(["SMEMBERS", "suggestions:campaign"]),
    ]);

    return res.status(200).json({
      pageUrl: pageUrl || [],
      source: source || [],
      medium: medium || [],
      campaign: campaign || [],
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
