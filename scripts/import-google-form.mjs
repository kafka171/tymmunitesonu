// Google Forms formunu okuyup functions/_lib/form.js dosyasini uretir.
// Kullanim: node scripts/import-google-form.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf6vBuiPprQKBfsazDFkfSoqdgpYuJ9BZJt7n8ZHp73aYMJxw/viewform";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "functions", "_lib", "form.js");

// Ilk bolumdeki alanlar icin sabit (anlamli) sutun adlari.
const KNOWN_NAMES = new Map([
  ["Ders:", "ders_adi"],
  ["Ünite:", "unite"],
  ["Okul Adı:", "okul_adi"],
  ["Görüşme Tarihi ve Saati:", "gorusme_tarihi_saati"],
  ["Görüşme Süresi:", "gorusme_suresi"],
  ["Saha Araştırmacısı: (İsim ve Kod)", "saha_arastirmacisi"],
  ["Öğretmen: (Kod)", "ogretmen_kodu"],
]);

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decode(text) {
  return String(text ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

function clean(text) {
  return decode(String(text ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const response = await fetch(FORM_URL, {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  },
});

if (!response.ok) {
  throw new Error(`Form indirilemedi: HTTP ${response.status}`);
}

const html = await response.text();
const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/);
if (!match) {
  throw new Error("FB_PUBLIC_LOAD_DATA_ bulunamadi (form herkese acik mi?).");
}

const data = JSON.parse(match[1]);
const info = data[1];
const items = info[1];
const title = clean((html.match(/<title>([^<]*)<\/title>/) ?? [])[1] || "Gorusme Formu");
const description = clean(info[0] ?? "");

const sections = [{ id: "genel", title: "Genel Bilgiler", fields: [] }];
let current = sections[0];
let sectionNo = 0;

for (const item of items) {
  const [, rawTitle, rawDesc, type, answers] = item;
  const a = Array.isArray(answers) ? answers[0] : null;
  const label = clean(rawTitle);

  if (type === 8) {
    sectionNo += 1;
    current = { id: `s${sectionNo}`, title: label, fields: [] };
    const desc = clean(rawDesc);
    if (desc) current.description = desc;
    sections.push(current);
    continue;
  }

  if (!label) continue;

  const required = a ? Number(a[2]) === 1 : false;
  const sqlType =
    type === 0 ? "text" : type === 1 ? "textarea" : type === 9 ? "date" : type === 10 ? "time" : type === 2 || type === 3 ? "radio" : "textarea";

  const field = {
    name: KNOWN_NAMES.get(label) ?? `s${sectionNo}_q${current.fields.length + 1}`,
    label,
    type: sqlType,
    required,
  };

  if (Array.isArray(a?.[1])) {
    field.options = a[1].map((opt) => clean(opt[0])).filter(Boolean);
  }

  const desc = clean(rawDesc);
  if (desc) field.help = desc;

  current.fields.push(field);
}

// Ayni isim iki kez olmasin.
const seen = new Set();
for (const section of sections) {
  for (const field of section.fields) {
    let name = field.name;
    let i = 2;
    while (seen.has(name)) name = `${field.name}_${i++}`;
    field.name = name;
    seen.add(name);
  }
}

const q = JSON.stringify;
const lines = [];
lines.push("// Tek kaynak: form tanimi. Hem API (dogrulama) hem on yuz (render) bunu kullanir.");
lines.push(`// Kaynak: ${FORM_URL}`);
lines.push("// Yeniden uretmek icin: npm run import-form");
lines.push("");
lines.push("export const form = {");
lines.push(`  title: ${q(title)},`);
lines.push(`  description: ${q(description)},`);
lines.push("  sections: [");
for (const section of sections) {
  lines.push("    {");
  lines.push(`      id: ${q(section.id)},`);
  lines.push(`      title: ${q(section.title)},`);
  if (section.description) lines.push(`      description: ${q(section.description)},`);
  lines.push("      fields: [");
  for (const field of section.fields) {
    const parts = [
      `name: ${q(field.name)}`,
      `label: ${q(field.label)}`,
      `type: ${q(field.type)}`,
      `required: ${field.required ? "true" : "false"}`,
    ];
    if (field.options) parts.push(`options: [${field.options.map(q).join(", ")}]`);
    if (field.help) parts.push(`help: ${q(field.help)}`);
    lines.push(`        { ${parts.join(", ")} },`);
  }
  lines.push("      ],");
  lines.push("    },");
}
lines.push("  ],");
lines.push("};");
lines.push("");
lines.push("/** Tum soru alanlari (sirayla, duz liste). */");
lines.push("export const fields = form.sections.flatMap((s) => s.fields);");
lines.push("");
lines.push("/** DB sutun adlari: id, created_at + soru alanlari. */");
lines.push("export const answerColumns = fields.map((f) => f.name);");
lines.push("");
lines.push("export const MAX_TEXT = 500;");
lines.push("export const MAX_TEXTAREA = 30000;");
lines.push("");

writeFileSync(target, lines.join("\n"), "utf8");

const questionCount = sections.reduce((n, s) => n + s.fields.length, 0);
const requiredCount = sections
  .flatMap((s) => s.fields)
  .filter((f) => f.required).length;

console.log(
  `form.js yazildi: ${sections.length} bolum, ${questionCount} soru, ${requiredCount} zorunlu.`,
);
