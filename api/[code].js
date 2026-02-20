import { kv } from "@vercel/kv";

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

export default async function handler(req) {
  const url = new URL(req.url, "http://localhost");
  const code = url.pathname.replace("/api/", "");

  if (!code || !/^[a-f0-9]{8}$/.test(code)) {
    return new Response(notFoundHtml, {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  const target = await kv.get(`short:${code}`);

  if (!target) {
    return new Response(notFoundHtml, {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target },
  });
}
