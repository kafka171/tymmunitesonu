import { form } from "../_lib/form.js";
import { json } from "../_lib/http.js";

export async function onRequestGet() {
  return json({ ok: true, form }, 200, {
    "cache-control": "public, max-age=300",
  });
}
