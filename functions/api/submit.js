import { fields, MAX_TEXT, MAX_TEXTAREA } from "../_lib/form.js";

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });

async function handleSubmit(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz istek gövdesi." }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ ok: false, error: "Geçersiz istek gövdesi." }, 400);
  }

  const errors = {};
  const values = {};

  for (const field of fields) {
    const raw = payload[field.name];
    let value = raw === undefined || raw === null ? "" : String(raw);
    value = value.replace(/\r\n/g, "\n").trim();

    const limit = field.type === "textarea" ? MAX_TEXTAREA : MAX_TEXT;
    if (value.length > limit) {
      errors[field.name] = `En fazla ${limit} karakter girilebilir.`;
      continue;
    }

    if (field.required && value === "") {
      errors[field.name] = "Bu soru zorunludur.";
      continue;
    }

    if (field.options && value !== "" && !field.options.includes(value)) {
      errors[field.name] = "Geçersiz seçenek.";
      continue;
    }

    if (field.type === "date" && value !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      errors[field.name] = "Geçersiz tarih.";
      continue;
    }

    if (field.type === "time" && value !== "" && !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      errors[field.name] = "Geçersiz saat.";
      continue;
    }

    values[field.name] = value === "" && !field.required ? null : value;
  }

  if (Object.keys(errors).length > 0) {
    return json({ ok: false, error: "Lütfen zorunlu alanları doldurun.", errors }, 422);
  }

  const columns = ["created_at", ...Object.keys(values)];
  const placeholders = columns.map(() => "?").join(", ");
  const params = [new Date().toISOString(), ...Object.values(values)];

  try {
    const result = await env.DB.prepare(
      `INSERT INTO responses (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`,
    )
      .bind(...params)
      .run();

    return json({ ok: true, id: result.meta?.last_row_id ?? null }, 201);
  } catch (err) {
    console.error("submit error", err);
    return json({ ok: false, error: "Yanıt kaydedilemedi. Lütfen tekrar deneyin." }, 500);
  }
}

export async function onRequest({ request, env }) {
  if (request.method === "POST") return handleSubmit(request, env);

  return json({ ok: false, error: "Yöntem desteklenmiyor." }, 405, {
    allow: "POST",
  });
}
