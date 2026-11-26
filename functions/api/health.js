import { json } from "../_lib/http.js";

// Kurulum teshisi: gizli deger dondurmez, yalnizca yapilandirma durumunu soyler.
export async function onRequestGet({ env }) {
  let tableExists = false;
  let dbOk = false;

  try {
    const row = await env.DB.prepare(
      "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'responses'",
    ).first();
    dbOk = true;
    tableExists = !!row;
  } catch {
    dbOk = false;
  }

  return json({
    ok: true,
    adminKeyConfigured: String(env.ADMIN_KEY ?? "").trim().length > 0,
    dbBound: !!env.DB,
    dbOk,
    tableExists,
    commit: env.CF_PAGES_COMMIT_SHA ? String(env.CF_PAGES_COMMIT_SHA).slice(0, 7) : null,
    branch: env.CF_PAGES_BRANCH ?? null,
  });
}
