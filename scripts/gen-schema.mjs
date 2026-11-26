// form.js tek kaynagindan schema.sql uretir.
// Kullanim: node scripts/gen-schema.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { form } from "../functions/_lib/form.js";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "schema.sql");
const consoleTarget = resolve(here, "..", "schema.console.sql");

const quote = (s) => `"${s.replace(/"/g, '""')}"`;
const fields = form.sections.flatMap((s) => s.fields);
const requiredCount = fields.filter((f) => f.required).length;

// Tarih/saat sorulari TEXT degil, semantik SQLite tipleriyle tanimlanir.
const sqlType = (f) => (f.type === "date" ? "DATE" : f.type === "time" ? "TIME" : "TEXT");

// Yorum icermeyen sema (D1 Console'a yapistirilabilir).
const lines = [
  "CREATE TABLE IF NOT EXISTS responses (",
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
  "  created_at DATETIME NOT NULL DEFAULT (datetime('now')),",
  ...fields.map(
    (f, i) =>
      `  ${quote(f.name)} ${sqlType(f)}${f.required ? " NOT NULL" : ""}${
        i === fields.length - 1 ? "" : ","
      }`,
  ),
  ");",
  "",
  "CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses (created_at);",
  "",
];

writeFileSync(target, lines.join("\n"), "utf8");

// Cloudflare panelindeki D1 Console icin: yorumsuz, tek satirlik ifadeler.
// (Konsol yorumlari/satir sonlarini bozunca "incomplete input" hatasi veriyor.)
const columnDefs = [
  "id INTEGER PRIMARY KEY AUTOINCREMENT",
  "created_at DATETIME NOT NULL DEFAULT (datetime('now'))",
  ...fields.map((f) => `${quote(f.name)} ${sqlType(f)}${f.required ? " NOT NULL" : ""}`),
];

const consoleLines = [
  `CREATE TABLE IF NOT EXISTS responses (${columnDefs.join(", ")});`,
  "CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses (created_at);",
];

writeFileSync(consoleTarget, consoleLines.join("\n"), "utf8");

console.log(
  `schema.sql ve schema.console.sql yazildi (${fields.length} soru sutunu, ${requiredCount} zorunlu / ${
    fields.length - requiredCount
  } istege bagli).`,
);
