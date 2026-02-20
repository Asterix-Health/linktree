export default async function handler(req) {
  const start = Date.now();
  const logs = [];

  logs.push(`[${Date.now() - start}ms] handler start`);
  logs.push(`KV_REST_API_URL set: ${!!process.env.KV_REST_API_URL}`);
  logs.push(`KV_REST_API_URL value: ${process.env.KV_REST_API_URL?.slice(0, 30)}...`);

  try {
    logs.push(`[${Date.now() - start}ms] starting fetch`);
    const res = await Promise.race([
      fetch(`${process.env.KV_REST_API_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["PING"]),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("fetch timed out after 5s")), 5000)
      ),
    ]);
    logs.push(`[${Date.now() - start}ms] fetch done, status: ${res.status}`);
    const body = await res.text();
    logs.push(`[${Date.now() - start}ms] body: ${body}`);
  } catch (err) {
    logs.push(`[${Date.now() - start}ms] ERROR: ${err.message}`);
  }

  return new Response(JSON.stringify({ logs }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
