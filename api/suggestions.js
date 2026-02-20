import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
  signal: () => AbortSignal.timeout(10000),
});

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [pageUrl, source, medium, campaign] = await Promise.all([
    redis.smembers("suggestions:pageUrl"),
    redis.smembers("suggestions:source"),
    redis.smembers("suggestions:medium"),
    redis.smembers("suggestions:campaign"),
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
}
