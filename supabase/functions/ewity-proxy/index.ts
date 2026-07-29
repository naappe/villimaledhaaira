import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EWITY_BASE_URL = "https://api.ewitypos.com/platform-v1/";
const ALLOWED_ORIGINS = new Set([
  "https://naappe.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
]);

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://naappe.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-ewity-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

  try {
    const payload = await request.json();
    const endpoint = String(payload.endpoint ?? "").trim().replace(/^\/+/, "");
    const method = String(payload.method ?? "GET").toUpperCase();
    if (!["GET", "POST"].includes(method)) return json({ error: "Only GET and POST are supported" }, 400, origin);
    if (endpoint.includes("..") || endpoint.includes("://")) return json({ error: "Invalid endpoint path" }, 400, origin);

    const apiKey = Deno.env.get("EWITY_API_KEY") || request.headers.get("x-ewity-key") || "";
    if (!apiKey.startsWith("plt_")) return json({ error: "Ewity API key is missing" }, 400, origin);

    const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
    const options: RequestInit = { method, headers };
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload.body ?? {});
    }

    const startedAt = performance.now();
    const upstream = await fetch(EWITY_BASE_URL + endpoint, options);
    const responseText = await upstream.text();
    let data: unknown = responseText || null;
    try { data = responseText ? JSON.parse(responseText) : null; } catch { /* preserve text */ }

    return json({ ok: upstream.ok, status: upstream.status, statusText: upstream.statusText, elapsedMs: Math.round(performance.now() - startedAt), data }, upstream.status, origin);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected proxy error" }, 500, origin);
  }
});
