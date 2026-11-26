# TYMM Ünite/Tema Sonu Görüşme Formu

Türkiye Yüzyılı Maarif Modeli (TYMM) Öğretim Programları İzleme ve Değerlendirme
Çalışmaları kapsamındaki **Din Kültürü ve Ahlak Bilgisi** ünite/tema sonu görüşme formunun
Cloudflare üzerinde çalışan sürümü.

- Google Forms'taki formla aynı sorular: **16 bölüm, 46 soru (40 zorunlu)**
- Yanıtlar **D1 (SQLite)** veritabanına yazılır; tüm soru sütunları `TEXT`'tir
- Bölüm bölüm ilerleme, taslak kaydetme, zorunlu alan doğrulaması
- `/admin` panelinde: yanıt listesi, **filtreleme + sayfalama**, **istatistik grafikleri**,
  detay görünümü, silme, **CSV** ve **Excel (.xlsx)** indirme

## Klasör yapısı

```
public/                 Statik ön yüz (Pages)
  index.html            Form
  admin.html            Yönetim paneli (/admin)
  app.js, admin.js      Form ve panel mantığı
  styles.css, admin.css, stats.css
functions/
  _lib/form.js          TEK KAYNAK: tüm sorular (Google Forms'tan üretilir)
  _lib/queries.js       Filtre SQL üreteci
  _lib/xlsx.js          Bağımlılıksız XLSX üreteci
  _lib/http.js          Yetki ve JSON yardımcıları
  api/form.js           GET  /api/form
  api/submit.js         POST /api/submit
  api/responses.js      GET/DELETE /api/responses (yönetici)
  api/stats.js          GET  /api/stats (yönetici)
  api/export.js         GET  /api/export (CSV / XLSX)
  api/health.js         GET  /api/health
  _middleware.js        Güvenlik başlıkları (CSP vb.)
worker/index.js         Workers sürümü (workers.dev)
schema.sql              D1 tablosu (sorular TEXT, tarih/saat tipleri)
schema.console.sql      D1 Console için yorumsuz sürüm
scripts/gen-schema.mjs  form.js'ten şemayı üretir
scripts/import-google-form.mjs  Google Forms'tan form.js üretir
```

## Yerel geliştirme

```bash
npm install
npm run db:init:local      # yerel SQLite tablosu
npm run dev                # http://localhost:8787
```

Yönetici anahtarı `.dev.vars` içindedir (`tymmunitesonu-yerel-anahtar`).

Formu Google Forms'tan yeniden içe aktarmak için:

```bash
npm run import-form   # functions/_lib/form.js yeniden üretilir
npm run schema        # schema.sql + schema.console.sql yeniden üretilir
```

## Cloudflare'e kurulum

1. **D1 veritabanı oluşturun**

   ```bash
   npx wrangler login
   npx wrangler d1 create tymmunitesonu
   ```

   Çıktıdaki `database_id` değerini `wrangler.toml` (ve `wrangler.worker.toml`) içine yazın.

2. **Tabloyu oluşturun**

   ```bash
   npm run db:init
   ```

   **Panelden:** D1 → **Console**'da `schema.console.sql` dosyasındaki iki satırı ayrı ayrı
   çalıştırın (yorumlar panelde "incomplete input" hatasına yol açabilir).

3. **Yönetici anahtarı**

   ```bash
   npx wrangler pages secret put ADMIN_KEY --project-name tymmunitesonu
   ```

4. **Yayınlayın**

   ```bash
   npx wrangler pages project create tymmunitesonu
   npm run deploy
   ```

## Workers (workers.dev) ile yayınlama

```bash
npm run worker:deploy
npm run worker:secret
```

Panelden (Workers Builds) yayınlarken **Deploy command** alanına:

```bash
npx wrangler deploy --config wrangler.worker.toml
```

## Yönetim paneli

- Adres: `https://<proje>.pages.dev/admin`
- Giriş: `ADMIN_KEY` (yalnızca o sekme için `sessionStorage`'da tutulur)
- **Yanıtlar:** Ders, Ünite, tarih aralığı ve serbest metin filtreleri; sayfa başına 50 kayıt;
  CSV / Excel indirme (filtreler uygulanır)
- **İstatistikler:** toplam/bugün/son 7 gün, farklı okul ve öğretmen sayıları; ders, ünite,
  okul dağılımları ve günlük yanıt grafiği
- Giriş ekranındaki **Sunucu durumunu kontrol et** düğmesi `ADMIN_KEY` ve D1 durumunu gösterir

## Veritabanı

Tablo: `responses` — `id`, `created_at` ve 46 soru sütunu.

- Zorunlu sorular `TEXT NOT NULL`
- İsteğe bağlı sorular `TEXT` (boş bırakılırsa `NULL`)
- Tarih/saat tipi sorular `DATE`/`TIME` (bu formda tarih-saat alanları metin olarak tanımlı)

Yedek:

```bash
npm run db:export
```
