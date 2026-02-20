import { kv } from "@vercel/kv";

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [pageUrl, source, medium, campaign] = await Promise.all([
    kv.smembers("suggestions:pageUrl"),
    kv.smembers("suggestions:source"),
    kv.smembers("suggestions:medium"),
    kv.smembers("suggestions:campaign"),
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
