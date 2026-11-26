// Cloudflare Worker surumu: Pages Functions yerine tek Worker + static assets.
// Pages yapisi (functions/, wrangler.toml) oldugu gibi kalir; bu dosya ayri config ile calisir.
import { onRequestGet as getForm } from "../functions/api/form.js";
import { onRequest as submitResponse } from "../functions/api/submit.js";
import {
  onRequestGet as listResponses,
  onRequestDelete as deleteResponse,
} from "../functions/api/responses.js";
import { onRequestGet as exportCsv } from "../functions/api/export.js";
import { onRequestGet as health } from "../functions/api/health.js";
import { onRequestGet as stats } from "../functions/api/stats.js";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

function secure(response) {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", CSP);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function methodNotAllowed(allow) {
  return new Response(JSON.stringify({ ok: false, error: "Yöntem desteklenmiyor." }), {
    status: 405,
    headers: { "content-type": "application/json; charset=utf-8", allow },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    let response;

    switch (path) {
      case "/api/form":
        response = method === "GET" ? await getForm() : methodNotAllowed("GET");
        break;

      case "/api/submit":
        response = await submitResponse({ request, env });
        break;

      case "/api/responses":
        if (method === "GET") response = await listResponses({ request, env });
        else if (method === "DELETE") response = await deleteResponse({ request, env });
        else response = methodNotAllowed("GET, DELETE");
        break;

      case "/api/export":
        response = method === "GET" ? await exportCsv({ request, env }) : methodNotAllowed("GET");
        break;

      case "/api/health":
        response = method === "GET" ? await health({ request, env }) : methodNotAllowed("GET");
        break;

      case "/api/stats":
        response = method === "GET" ? await stats({ request, env }) : methodNotAllowed("GET");
        break;

      default: {
        // html_handling = "none" oldugu icin uzantili dosyalari kendimiz eslestiriyoruz.
        let assetPath = path;
        if (path === "/") assetPath = "/index.html";
        else if (path === "/admin") assetPath = "/admin.html";

        const assetUrl = new URL(assetPath, url);
        response = await env.ASSETS.fetch(new Request(assetUrl, request));
      }
    }

    return secure(response);
  },
};
