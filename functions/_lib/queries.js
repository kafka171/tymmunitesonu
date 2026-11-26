import { fields } from "./form.js";

/**
 * URL parametrelerinden yanit filtresi uretir.
 * ders, unite, from, to (YYYY-MM-DD), q (serbest metin).
 * Donus: { clauses: string[], params: any[] }  (bos ise filtre yok)
 */
export function responseFilters(url) {
  const sp = url.searchParams;
  const clauses = [];
  const params = [];

  const ders = (sp.get("ders") || "").trim();
  if (ders) {
    clauses.push('"ders_adi" = ?');
    params.push(ders);
  }

  const unite = (sp.get("unite") || "").trim();
  if (unite) {
    clauses.push('"unite" = ?');
    params.push(unite);
  }

  const from = (sp.get("from") || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    clauses.push('substr("created_at", 1, 10) >= ?');
    params.push(from);
  }

  const to = (sp.get("to") || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    clauses.push('substr("created_at", 1, 10) <= ?');
    params.push(to);
  }

  const q = (sp.get("q") || "").trim();
  if (q) {
    const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
    const like = `%${escaped}%`;
    clauses.push(
      `(${fields.map((f) => `"${f.name}" LIKE ? ESCAPE '\\'`).join(" OR ")})`,
    );
    params.push(...fields.map(() => like));
  }

  return { clauses, params };
}

/** Filtreleri SQL'e baglar. where: " WHERE ..." veya "" */
export function whereOf(filters) {
  if (filters.clauses.length === 0) return { where: "", params: [] };
  return { where: ` WHERE ${filters.clauses.join(" AND ")}`, params: filters.params };
}

/** Filtreler uygulanmis satir sayisi. */
export async function countResponses(env, filters) {
  const { where, params } = whereOf(filters);
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM responses${where}`,
  )
    .bind(...params)
    .first();
  return row?.total ?? 0;
}

/** Filtreler uygulanmis satirlar. */
export async function listResponses(env, filters, limit, offset) {
  const { where, params } = whereOf(filters);
  return env.DB.prepare(
    `SELECT * FROM responses${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();
}
