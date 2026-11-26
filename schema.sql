-- Cloudflare D1 (SQLite) semasi.
-- Uretim: node scripts/gen-schema.mjs (kaynak: functions/_lib/form.js)
--
-- Soru alanlari: metin/secenek sorulari TEXT, tarih sorulari DATE, saat sorulari TIME.
-- NOT NULL : formda zorunlu (*) alanlar - deger NULL olamaz (bosluk denetimi sunucuda).
-- NULL     : formda istege bagli alanlar - yanit verilmezse NULL yazilir.
-- Zorunlu: 40 / 46 alan

CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Kayit zamani (ISO-8601)
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  "ders_adi" TEXT NOT NULL,  -- zorunlu
  "unite" TEXT NOT NULL,  -- zorunlu
  "okul_adi" TEXT NOT NULL,  -- zorunlu
  "gorusme_tarihi_saati" TEXT NOT NULL,  -- zorunlu
  "gorusme_suresi" TEXT NOT NULL,  -- zorunlu
  "saha_arastirmacisi" TEXT NOT NULL,  -- zorunlu
  "ogretmen_kodu" TEXT NOT NULL,  -- zorunlu
  "s1_q1" TEXT NOT NULL,  -- zorunlu
  "s1_q2" TEXT NOT NULL,  -- zorunlu
  "s1_q3" TEXT NOT NULL,  -- zorunlu
  "s2_q1" TEXT,  -- istege bagli
  "s2_q2" TEXT,  -- istege bagli
  "s3_q1" TEXT NOT NULL,  -- zorunlu
  "s3_q2" TEXT NOT NULL,  -- zorunlu
  "s4_q1" TEXT NOT NULL,  -- zorunlu
  "s4_q2" TEXT NOT NULL,  -- zorunlu
  "s5_q1" TEXT NOT NULL,  -- zorunlu
  "s5_q2" TEXT NOT NULL,  -- zorunlu
  "s5_q3" TEXT NOT NULL,  -- zorunlu
  "s5_q4" TEXT NOT NULL,  -- zorunlu
  "s5_q5" TEXT NOT NULL,  -- zorunlu
  "s5_q6" TEXT NOT NULL,  -- zorunlu
  "s6_q1" TEXT,  -- istege bagli
  "s6_q2" TEXT,  -- istege bagli
  "s6_q3" TEXT,  -- istege bagli
  "s6_q4" TEXT,  -- istege bagli
  "s7_q1" TEXT NOT NULL,  -- zorunlu
  "s7_q2" TEXT NOT NULL,  -- zorunlu
  "s8_q1" TEXT NOT NULL,  -- zorunlu
  "s9_q1" TEXT NOT NULL,  -- zorunlu
  "s9_q2" TEXT NOT NULL,  -- zorunlu
  "s9_q3" TEXT NOT NULL,  -- zorunlu
  "s9_q4" TEXT NOT NULL,  -- zorunlu
  "s10_q1" TEXT NOT NULL,  -- zorunlu
  "s10_q2" TEXT NOT NULL,  -- zorunlu
  "s10_q3" TEXT NOT NULL,  -- zorunlu
  "s11_q1" TEXT NOT NULL,  -- zorunlu
  "s11_q2" TEXT NOT NULL,  -- zorunlu
  "s12_q1" TEXT NOT NULL,  -- zorunlu
  "s12_q2" TEXT NOT NULL,  -- zorunlu
  "s13_q1" TEXT NOT NULL,  -- zorunlu
  "s13_q2" TEXT NOT NULL,  -- zorunlu
  "s14_q1" TEXT NOT NULL,  -- zorunlu
  "s14_q2" TEXT NOT NULL,  -- zorunlu
  "s15_q1" TEXT NOT NULL,  -- zorunlu
  "s15_q2" TEXT NOT NULL  -- zorunlu
);

CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses (created_at);
