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

const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found — Asterix</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .logo { width: min(60vw, 320px); margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 400; opacity: 0.7; }
  </style>
</head>
<body>
  <img src="/assets/logo.png" alt="Asterix" class="logo">
  <h1>Link not found</h1>
</body>
</html>`;

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code || !/^[a-f0-9]{8}$/.test(code)) {
    return res.status(404).setHeader("Content-Type", "text/html").send(notFoundHtml);
  }

  const target = await redis(["GET", `short:${code}`]);

  if (!target) {
    return res.status(404).setHeader("Content-Type", "text/html").send(notFoundHtml);
  }

  return res.redirect(302, target);
}
