import { fields } from "../_lib/form.js";
import { authStatus } from "../_lib/http.js";
import { responseFilters, whereOf } from "../_lib/queries.js";
import { buildXlsx } from "../_lib/xlsx.js";

const oneLine = (text) => String(text ?? "").replace(/\s*\n\s*/g, " ").trim();

function csvCell(value) {
  const s = String(value ?? "");
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchAllRows(env, filters) {
  const { where, params } = whereOf(filters);
  const result = await env.DB.prepare(`SELECT * FROM responses${where} ORDER BY id ASC`)
    .bind(...params)
    .all();
  return result.results ?? [];
}

export async function onRequestGet({ request, env }) {
  const status = authStatus(request, env);
  if (status !== "ok") {
    const message =
      status === "not_configured"
        ? "Sunucuda ADMIN_KEY tanımlı değil. Cloudflare Pages → Settings → Variables and Secrets bölümünden Production ortamına ADMIN_KEY ekleyip yeniden deploy edin."
        : "Yetkisiz. Yönetici anahtarı gerekli.";
    return new Response(message, {
      status: status === "not_configured" ? 503 : 401,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const url = new URL(request.url);
  const filters = responseFilters(url);
  const format = (url.searchParams.get("format") || "csv").toLowerCase();
  const stamp = new Date().toISOString().slice(0, 10);

  let rows;
  try {
    rows = await fetchAllRows(env, filters);
  } catch (err) {
    console.error("export error", err);
    return new Response("Yanıtlar okunamadı. D1 tablosu oluşturulmuş mu?", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const headers = ["No", "Kayıt Zamanı", ...fields.map((f) => oneLine(f.label))];
  const table = [headers];
  for (const row of rows) {
    table.push([row.id, row.created_at, ...fields.map((f) => row[f.name] ?? "")]);
  }

  if (format === "xlsx") {
    const bytes = buildXlsx("Yanıtlar", table);
    return new Response(bytes, {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="gorusme-formu-yanitlari-${stamp}.xlsx"`,
        "cache-control": "no-store",
      },
    });
  }

  // Varsayilan: CSV (Excel icin BOM + CRLF).
  const lines = [headers.map(csvCell).join(";")];
  for (const row of rows) {
    lines.push(
      [row.id, row.created_at, ...fields.map((f) => row[f.name] ?? "")]
        .map(csvCell)
        .join(";"),
    );
  }
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="gorusme-formu-yanitlari-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
