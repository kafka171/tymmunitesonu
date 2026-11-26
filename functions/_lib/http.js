import { form } from "./form.js";

export const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });

export function adminKeyFrom(request) {
  const url = new URL(request.url);
  const raw = request.headers.get("x-admin-key") || url.searchParams.get("key") || "";
  return raw.trim();
}

/** Sabit zamanli karsilastirma (anahtar uzunlugu sizdirmaz). */
export function safeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

/**
 * "ok" | "not_configured" | "missing" | "invalid"
 * Kenar bosluklar temizlenir; panelden kopyalanan degerlerdeki
 * gorunmez bosluk/yeni satir sorun cikarmaz.
 */
export function authStatus(request, env) {
  const expected = String(env.ADMIN_KEY ?? "").trim();
  if (!expected) return "not_configured";

  const provided = adminKeyFrom(request);
  if (!provided) return "missing";

  return safeEqual(provided, expected) ? "ok" : "invalid";
}

export function isAuthorized(request, env) {
  return authStatus(request, env) === "ok";
}

export const formFields = form.sections.flatMap((s) => s.fields);
