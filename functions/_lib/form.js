// Tek kaynak: form tanimi. Hem API (dogrulama) hem on yuz (render) bunu kullanir.
// Kaynak: https://docs.google.com/forms/d/e/1FAIpQLSf6vBuiPprQKBfsazDFkfSoqdgpYuJ9BZJt7n8ZHp73aYMJxw/viewform
// Yeniden uretmek icin: npm run import-form

export const form = {
  title: "Türkiye Yüzyılı Maarif Modeli Ünite/Tema Sonu Görüşme Formu",
  description: "Değerli Öğretmenimiz,\nBu görüşme, Türkiye Yüzyılı Maarif Modeli (TYMM) Öğretim Programları İzleme ve Değerlendirme Çalışmaları kapsamında Din Kültürü ve Ahlak Bilgisi Dersi Öğretim Programı’nın sahadaki uygulanabilirliğini ve geliştirilmesi gereken yönleri hakkında görüşlerinizi almak amacıyla düzenlenmiştir. Değerli görüşleriniz, programın gelecekteki uygulamalarının geliştirilmesine önemli katkılar sağlayacaktır. Paylaşacağınız yanıtlar, eğitim sürecinin daha etkili ve verimli bir şekilde yürütülmesine ışık tutacaktır.\nGörüşme kapsamında vereceğiniz cevapların üçüncü kişilerle paylaşılmayacağını belirtir, değerli katkılarınız için şimdiden teşekkür ederiz.",
  sections: [
    {
      id: "genel",
      title: "Genel Bilgiler",
      fields: [
        { name: "ders_adi", label: "Ders:", type: "radio", required: true, options: ["Din Kültürü ve Ahlak Bilgisi 7", "Din Kültürü ve Ahlak Bilgisi 11", "Temel Dini Bilgiler Ortaokul", "Temel Dini Bilgiler Lise", "Kur'an-ı Kerim", "Hitabet ve Mesleki Uygulama", "Tefsir", "Akaid", "Mesleki Arapça"] },
        { name: "unite", label: "Ünite:", type: "radio", required: true, options: ["1.Ünite", "2.Ünite", "3.Ünite", "4.Ünite", "5. Ünite"] },
        { name: "okul_adi", label: "Okul Adı:", type: "text", required: true },
        { name: "gorusme_tarihi_saati", label: "Görüşme Tarihi ve Saati:", type: "text", required: true },
        { name: "gorusme_suresi", label: "Görüşme Süresi:", type: "text", required: true },
        { name: "saha_arastirmacisi", label: "Saha Araştırmacısı: (İsim ve Kod)", type: "text", required: true },
        { name: "ogretmen_kodu", label: "Öğretmen: (Kod)", type: "text", required: true },
      ],
    },
    {
      id: "s1",
      title: "1. ZAMAN YÖNETİMİ",
      fields: [
        { name: "s1_q1", label: "Ünite/tema için ayrılan süre: ……………… ders saati", type: "text", required: true },
        { name: "s1_q2", label: "Öğretim programında ünite için verilen yukarıdaki toplam ders süresini yeterli buldunuz mu? Detaylandırınız.", type: "textarea", required: true },
        { name: "s1_q3", label: "Önerilen sürenin daha verimli kullanılabilmesi için ne gibi değişiklikler yapılması gerektiğini düşünüyorsunuz?", type: "textarea", required: true },
      ],
    },
    {
      id: "s2",
      title: "2. KAVRAMSAL BECERİLER",
      fields: [
        { name: "s2_q1", label: "Kavramsal beceriler:", type: "textarea", required: false },
        { name: "s2_q2", label: "Öğretim programında ünite için verilen yukarıdaki kavramsal becerilerin ders sürecinde kazanılmasına dair görüş ve değerlendirmeleriniz nedir? Bu becerilerin kazanımında öğrencilerin zorlandıkları veya başarılı oldukları bileşenleri açıklar mısınız?", type: "textarea", required: false },
      ],
    },
    {
      id: "s3",
      title: "3. ALAN BECERİLERİ",
      fields: [
        { name: "s3_q1", label: "Alan becerileri:", type: "textarea", required: true },
        { name: "s3_q2", label: "Öğretim programında ünite için verilen yukarıdaki alan becerilerinin ders sürecinde kazanılmasına dair görüş ve değerlendirmeleriniz nedir? Bu becerilerin kazanımında öğrencilerin zorlandıkları veya başarılı oldukları bileşenleri açıklar mısınız?", type: "textarea", required: true },
      ],
    },
    {
      id: "s4",
      title: "4. EĞİLİMLER",
      fields: [
        { name: "s4_q1", label: "Eğilimler:", type: "textarea", required: true },
        { name: "s4_q2", label: "Öğretim programında yer verilen yukarıdaki eğilimlerin öğrencilerde ortaya çıkması veya geliştirilmesi konusunda ne düşünüyorsunuz? Bu konudaki deneyimlerinizi paylaşabilir misiniz?", type: "textarea", required: true },
      ],
    },
    {
      id: "s5",
      title: "5. PROGRAMLAR ARASI BİLEŞENLER",
      fields: [
        { name: "s5_q1", label: "Sosyal-duygusal öğrenme becerileri:", type: "textarea", required: true },
        { name: "s5_q2", label: "Öğretim programında yer alan yukarıdaki sosyal-duygusal öğrenme becerilerinin ders sürecinde kazanılmasına dair gözlem, deneyim ve değerlendirmeleriniz nedir?", type: "textarea", required: true },
        { name: "s5_q3", label: "Değerler:", type: "textarea", required: true },
        { name: "s5_q4", label: "Öğretim programında yer verilen yukarıdaki değerlerin öğrencilerin tutum ve davranışlarına yansımalarına dair gözlem ve deneyimlerinizi paylaşabilir misiniz?", type: "textarea", required: true },
        { name: "s5_q5", label: "Okuryazarlık becerileri:", type: "textarea", required: true },
        { name: "s5_q6", label: "Öğretim programında yer alan yukarıdaki okuryazarlık becerilerinin ders sürecinde kazanılmasına dair gözlem, deneyim ve değerlendirmeleriniz nedir?", type: "textarea", required: true },
      ],
    },
    {
      id: "s6",
      title: "6. DİSİPLİNLER ARASI VE BECERİLER ARASI İLİŞKİLER",
      fields: [
        { name: "s6_q1", label: "İlişkilendirilen disiplinler:", type: "textarea", required: false },
        { name: "s6_q2", label: "Öğretim programı kapsamında verilen disiplinler arası ilişkiyi öğrenme-öğretme yaşantıları sürecinde kurabildiniz mi? Bu ilişkileri nasıl somutlaştırdınız?", type: "textarea", required: false },
        { name: "s6_q3", label: "Beceriler arası ilişkiler:", type: "textarea", required: false },
        { name: "s6_q4", label: "Öğretim programında ünite ile ilişkilendirilen yukarıdaki becerilerin, beceriler arası ilişkiler çerçevesinde gerçekleşme seviyesi yeterli midir? Bu husustaki görüş ve değerlendirmelerinizi paylaşabilir misiniz?", type: "textarea", required: false },
      ],
    },
    {
      id: "s7",
      title: "7. ÖĞRENME ÇIKTILARI",
      fields: [
        { name: "s7_q1", label: "Öğrenme Çıktısı:", type: "textarea", required: true },
        { name: "s7_q2", label: "Öğretim programında yer alan öğrenme çıktılarını uygulanabilir buluyor musunuz? Bu çıktı ve bileşenlerine dair karşılaştığınız kolaylıklar, güçlükler veya sınırlılıklar nelerdir?", type: "textarea", required: true },
      ],
    },
    {
      id: "s8",
      title: "8. İÇERİK ÇERÇEVESİ",
      fields: [
        { name: "s8_q1", label: "Öğretim programında yer alan içerik çerçevesinin uygulanabilirliğine dair görüş ve değerlendirmeleriniz nedir?", type: "textarea", required: true },
      ],
    },
    {
      id: "s9",
      title: "9. ÖĞRENME KANITLARI (ÖLÇME VE DEĞERLENDİRME)",
      fields: [
        { name: "s9_q1", label: "Öğretim programında önerilen ölçme ve değerlendirme araç/teknikleri:", type: "textarea", required: true },
        { name: "s9_q2", label: "Öğretim programında/kitapta yer alan yukarıdaki ölçme ve değerlendirme araçlarının uygulama süreçleri hakkındaki görüş ve deneyimlerinizi paylaşabilir misiniz?", type: "textarea", required: true },
        { name: "s9_q3", label: "Hangi ölçme ve değerlendirme araçlarını kullandınız? Bu kapsamda karşılaştığınız güçlükler veya sınırlılıklar nelerdir?", type: "textarea", required: true },
        { name: "s9_q4", label: "Programda önerilen ölçme ve değerlendirme araçlarından farklı olarak kullandığınız bir ölçme ve değerlendirme aracı varsa belirtiniz.", type: "textarea", required: true },
      ],
    },
    {
      id: "s10",
      title: "10. ÖĞRENME-ÖĞRETME YAŞANTILARI (Temel Kabuller, Ön Değerlendirme, Köprü Kurma, Öğrenme-Öğretme Uygulamaları)",
      fields: [
        { name: "s10_q1", label: "Temel kabuller-Ön değerlendirme: \nÖnceki öğrenme-öğretme süreçlerinde edinilen bilgi ve becerilerin (temel kabuller) öğrencilerde mevcut olup olmadığını ön değerlendirme yaparak belirleyebildiniz mi? Ön değerlendirme sürecini nasıl uyguladınız?", type: "textarea", required: true },
        { name: "s10_q2", label: "Köprü kurma: \nÖğretim programında verilen köprü kurma sürecini nasıl gerçekleştirdiniz?", type: "textarea", required: true },
        { name: "s10_q3", label: "Öğrenme-öğretme uygulamaları: \nÖğretim programında verilen öğrenme-öğretme uygulamalarını nasıl gerçekleştirdiniz? Öğrenme-öğretme uygulamaları kapsamında hangi öğrenme yaklaşımlarını (yöntem ve tekniklerini) kullandınız?", type: "textarea", required: true },
      ],
    },
    {
      id: "s11",
      title: "11. FARKLILAŞTIRMA (Zenginleştirme ve Destekleme)",
      fields: [
        { name: "s11_q1", label: "Zenginleştirme:\nÖğretim programında zenginleştirme bölümünde yer alan öneri niteliğindeki etkinlikleri uygulanabilir buldunuz mu? Uyguladığınız zenginleştirme etkinlikleri nelerdir?", type: "textarea", required: true },
        { name: "s11_q2", label: "Destekleme: \nÖğretim programında destekleme bölümünde yer alan öneri niteliğindeki etkinlikleri uygulanabilir buldunuz mu? Uyguladığınız destekleme etkinlikleri nelerdir?", type: "textarea", required: true },
      ],
    },
    {
      id: "s12",
      title: "12. OKUL TEMELLİ PLANLAMA",
      fields: [
        { name: "s12_q1", label: "Okul temelli planlamanın öğretim sürecine katkısını nasıl değerlendiriyorsunuz?", type: "textarea", required: true },
        { name: "s12_q2", label: "Okul temelli planlama kapsamında ne tür çalışmalar gerçekleştirdiniz? Bu çalışmaların uygulanmasında yaşadığınız deneyimleri paylaşabilir misiniz?", type: "textarea", required: true },
      ],
    },
    {
      id: "s13",
      title: "13. DESTEK VE KAYNAK",
      fields: [
        { name: "s13_q1", label: "Ders kitabını kullanılan dil ve görseller bakımından nasıl değerlendiriyorsunuz?", type: "textarea", required: true },
        { name: "s13_q2", label: "Ders kitabında verilen e-içerik (video, animasyon, ölçme-değerlendirme) uygulamalarını kullandınız mı? Kullandığınız e-içerik uygulamaları nelerdir?", type: "textarea", required: true },
      ],
    },
    {
      id: "s14",
      title: "14. FİZİKİ KOŞULLAR VE DONANIM",
      fields: [
        { name: "s14_q1", label: "Okulun fiziki koşul ve donanımının (sınıf ortamı, atölye, mescit, teknolojik donanım ve altyapı vb.) programın uygulanması açısından yeterliliği hakkında ne düşünüyorsunuz?", type: "textarea", required: true },
        { name: "s14_q2", label: "Programın uygulanması için hangi öğrenme ortamlarına ihtiyaç duydunuz? Deneyimleriniz nedir?", type: "textarea", required: true },
      ],
    },
    {
      id: "s15",
      title: "15. ÖĞRETMEN YANSITMALARI",
      fields: [
        { name: "s15_q1", label: "Öğretim programında yer alan öğretmen yansıtmalarını gerçekleştiriyor musunuz? Bu uygulamaya sahada ihtiyaç olduğunu düşünüyor musunuz?", type: "textarea", required: true },
        { name: "s15_q2", label: "Bu uygulamayı kullanırken herhangi bir güçlükle karşılaşıyor musunuz ? Söz konusu uygulamanın geliştirilmesine yönelik teklif ve önerileriniz var mı?", type: "textarea", required: true },
      ],
    },
  ],
};

/** Tum soru alanlari (sirayla, duz liste). */
export const fields = form.sections.flatMap((s) => s.fields);

/** DB sutun adlari: id, created_at + soru alanlari. */
export const answerColumns = fields.map((f) => f.name);

export const MAX_TEXT = 500;
export const MAX_TEXTAREA = 30000;
