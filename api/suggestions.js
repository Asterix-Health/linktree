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

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [pageUrl, source, medium, campaign] = await Promise.all([
      redis(["SMEMBERS", "suggestions:pageUrl"]),
      redis(["SMEMBERS", "suggestions:source"]),
      redis(["SMEMBERS", "suggestions:medium"]),
      redis(["SMEMBERS", "suggestions:campaign"]),
    ]);

    return new Response(
      JSON.stringify({
        pageUrl: pageUrl || [],
        source: source || [],
        medium: medium || [],
        campaign: campaign || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
