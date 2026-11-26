import { authStatus, json } from "../_lib/http.js";

const NOT_CONFIGURED =
  "Sunucuda ADMIN_KEY tanımlı değil. Cloudflare Pages → Settings → Variables and Secrets bölümünden Production ortamına ADMIN_KEY ekleyip yeniden deploy edin.";

async function all(env, sql, params = []) {
  const result = await env.DB.prepare(sql)
    .bind(...params)
    .all();
  return result.results ?? [];
}

export async function onRequestGet({ request, env }) {
  const status = authStatus(request, env);
  if (status === "not_configured") {
    return json({ ok: false, code: "admin_key_missing", error: NOT_CONFIGURED }, 503);
  }
  if (status !== "ok") {
    return json(
      { ok: false, code: "unauthorized", error: "Yetkisiz. Yönetici anahtarı gerekli." },
      401,
    );
  }

  try {
    const [totalRow, byDers, byUnite, byDay, topOkul] = await Promise.all([
      env.DB.prepare(
        `SELECT COUNT(*) AS total,
                COUNT(DISTINCT "okul_adi") AS okul,
                COUNT(DISTINCT "ogretmen_kodu") AS ogretmen
         FROM responses`,
      ).first(),
      all(
        env,
        `SELECT "ders_adi" AS name, COUNT(*) AS count
         FROM responses GROUP BY "ders_adi" ORDER BY count DESC, name ASC`,
      ),
      all(
        env,
        `SELECT "unite" AS name, COUNT(*) AS count
         FROM responses GROUP BY "unite" ORDER BY count DESC, name ASC`,
      ),
      all(
        env,
        `SELECT substr("created_at", 1, 10) AS day, COUNT(*) AS count
         FROM responses
         GROUP BY day ORDER BY day ASC`,
      ),
      all(
        env,
        `SELECT "okul_adi" AS name, COUNT(*) AS count
         FROM responses
         WHERE "okul_adi" <> ''
         GROUP BY "okul_adi" ORDER BY count DESC, name ASC LIMIT 10`,
      ),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const last7day = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    return json({
      ok: true,
      total: totalRow?.total ?? 0,
      okulSayisi: totalRow?.okul ?? 0,
      ogretmenSayisi: totalRow?.ogretmen ?? 0,
      bugun: byDay.find((d) => d.day === today)?.count ?? 0,
      son7gun: byDay.filter((d) => d.day >= last7day).reduce((a, d) => a + d.count, 0),
      byDers,
      byUnite,
      byDay,
      topOkul,
    });
  } catch (err) {
    console.error("stats error", err);
    return json(
      {
        ok: false,
        code: "db_error",
        error: "İstatistikler okunamadı. D1 tablosu oluşturulmuş mu? (şema: schema.console.sql)",
      },
      500,
    );
  }
}
