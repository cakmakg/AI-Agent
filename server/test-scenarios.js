/**
 * AI Orchestra — Kapsamlı Test Senaryoları
 * ==========================================
 * Çalıştır: node test-scenarios.js
 * Sunucu   : http://localhost:3000 (PORT env'e göre değişir)
 *
 * Senaryo Listesi (12 adet):
 *  1.  HOT_LEAD — SaaS yazılım teklifi (Operator UI)
 *  2.  HOT_LEAD — E-ticaret danışmanlık (Operator UI)
 *  3.  HOT_LEAD — n8n webhook / TEKLIF_TALEBI formatı
 *  4.  HOT_LEAD — n8n webhook / IHTIYAC_ANALIZI formatı
 *  5.  HOT_LEAD — Innovator testi: radikal mimari fikir
 *  6.  SUPPORT_BUG — Teknik hata bildirim ticket'ı
 *  7.  SUPPORT_PRICING — Fiyat & lisans sorusu ticket'ı
 *  8.  SPAM — İş ilanı maili (filtre testi)
 *  9.  SPAM — Newsletter (filtre testi)
 * 10.  HOT_LEAD — Sağlık sektörü dijital dönüşüm
 * 11.  HOT_LEAD — Enerji şirketi AI entegrasyonu
 * 12.  HOT_LEAD — R&D / İnovasyon araştırma görevi
 */

const BASE_URL = "http://localhost:3000";
const DELAY_MS  = 3000; // Senaryolar arası bekleme (sunucuyu boğmamak için)

// ── HTTP POST helper (Node.js 18+ global fetch) ──────────────────────────────
async function post(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, body: data };
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function log(n, title, res) {
    const icon = res.status === 200 ? "✅" : "❌";
    console.log(`\n${icon} [${n}/12] ${title}`);
    console.log(`   HTTP ${res.status} → status: ${res.body?.status ?? "?"}, threadId: ${res.body?.threadId ?? res.body?.ticketId ?? "—"}`);
    if (res.body?.category) console.log(`   Kategori: ${res.body.category}`);
}

// ── SENARYOLAR ───────────────────────────────────────────────────────────────
const scenarios = [

    // ── 1. HOT_LEAD: SaaS Yazılım Teklifi (Operator UI) ─────────────────────
    {
        title: "HOT_LEAD — SaaS Yazılım Teklifi (Operator UI)",
        path: "/api/inbox",
        body: {
            source:  "operator",
            content: "Merhaba, 500 çalışanlı bir lojistik firması için özel bir SaaS çözümü arıyoruz. Filo takibi, rota optimizasyonu ve müşteri portalı içermeli. Bütçemiz yıllık 150.000 € civarında. Bir demo ve proje planı alabilir miyiz?",
        },
    },

    // ── 2. HOT_LEAD: E-ticaret Danışmanlığı (Operator UI) ───────────────────
    {
        title: "HOT_LEAD — E-Ticaret AI Danışmanlığı (Operator UI)",
        path: "/api/inbox",
        body: {
            source:  "operator",
            content: "Mevcut Shopify mağazamıza AI destekli kişiselleştirme motoru entegre etmek istiyoruz. Aylık 80.000 ziyaretçimiz var. Ürün öneri algoritması ve dinamik fiyatlandırma için teklif istiyoruz. Ne kadar sürer, maliyeti ne olur?",
        },
    },

    // ── 3. HOT_LEAD: n8n Webhook — TEKLIF_TALEBI ────────────────────────────
    {
        title: "HOT_LEAD — n8n Webhook / TEKLIF_TALEBI",
        path: "/api/inbox",
        body: {
            category:     "TEKLIF_TALEBI",
            platform:     "gmail",
            platform_id:  `test-lead-${Date.now()}-001`,
            author:       "Klaus Müller",
            author_email: "k.mueller@bautech-gmbh.de",
            subject:      "Anfrage: KI-Integration für Bauplanung",
            content:      "Guten Tag, wir sind ein mittelständisches Bauunternehmen aus München mit 200 Mitarbeitern. Wir suchen eine KI-Lösung zur automatischen Erkennung von Planungsfehlern in CAD-Dateien. Könnten Sie uns ein Angebot erstellen? Budget ca. 80.000 EUR.",
            ai_summary:   "German construction firm seeking AI-powered CAD error detection, budget €80k",
            priority:     "high",
        },
    },

    // ── 4. HOT_LEAD: n8n Webhook — IHTIYAC_ANALIZI ──────────────────────────
    {
        title: "HOT_LEAD — n8n Webhook / IHTIYAC_ANALIZI",
        path: "/api/inbox",
        body: {
            category:     "IHTIYAC_ANALIZI",
            platform:     "telegram",
            platform_id:  `test-lead-${Date.now()}-002`,
            author:       "Sofia Rossi",
            author_email: "sofia.rossi@medtech-italia.it",
            subject:      "AI per diagnostica medica",
            content:      "Buongiorno, siamo una startup medtech di Milano. Stiamo sviluppando un sistema di supporto alla diagnosi per radiologi. Cerchiamo un partner tecnologico per integrare modelli LLM nella nostra piattaforma. Quando possiamo parlare?",
            ai_summary:   "Italian medtech startup needs LLM integration for radiology diagnostic support",
            priority:     "medium",
        },
    },

    // ── 5. HOT_LEAD: Innovator Testi — Radikal Mimari Fikri ─────────────────
    {
        title: "HOT_LEAD — Innovator Agent Testi (Aykırı Düşünür)",
        path: "/api/inbox",
        body: {
            source:  "operator",
            content: "Rakiplerimizden tamamen farklı bir ürün geliştirme süreci istiyoruz. Standart Agile/Scrum metodolojilerini reddediyoruz. Piyasadaki hiç kimsenin yapmadığı, çılgın ama işe yarayan bir geliştirme ve lansmanstrateji öner. Bütçe kısıtı yok, zaman kısıtı yok — sadece mükemmel olsun.",
        },
    },

    // ── 6. SUPPORT_BUG: Teknik Hata Ticket'ı ────────────────────────────────
    {
        title: "SUPPORT_BUG — Teknik Hata Bildirimi",
        path: "/api/inbox",
        body: {
            category:     "ACIL_DESTEK",
            platform:     "gmail",
            platform_id:  `test-bug-${Date.now()}-001`,
            author:       "Ahmet Yıldız",
            author_email: "ahmet@startup-xyz.com",
            subject:      "ACIL: API Gateway 502 hatası — prod ortamı çöktü",
            content:      "Merhaba ekip, bu sabahtan itibaren prod ortamımızda tüm API çağrıları 502 Bad Gateway hatası veriyor. Müşterilerimiz sisteme giremiyor, ciddi gelir kaybı yaşıyoruz. Hemen destek gerekiyor! Error logs ektedir. Müşteri ID: CUS-7821",
            ai_summary:   "Critical production outage — API Gateway 502, immediate support required",
            priority:     "critical",
        },
    },

    // ── 7. SUPPORT_PRICING: Fiyat Sorusu Ticket'ı ───────────────────────────
    {
        title: "SUPPORT_PRICING — Fiyat & Lisans Sorusu",
        path: "/api/inbox",
        body: {
            category:     "FIYAT_SORUSTURMASI",
            platform:     "gmail",
            platform_id:  `test-price-${Date.now()}-001`,
            author:       "Emma Schmidt",
            author_email: "e.schmidt@konzern-ag.de",
            subject:      "Enterprise Lizenzmodell — Preisanfrage",
            content:      "Sehr geehrtes Team, wir interessieren uns für Ihre Enterprise-Lösung für 50 Nutzerkonten. Welche Lizenzmodelle bieten Sie an? Gibt es Rabatte für Non-Profit-Organisationen? Wir benötigen auch DSGVO-konforme Datenverarbeitung in der EU.",
            ai_summary:   "Enterprise license inquiry, 50 users, GDPR compliance required",
            priority:     "medium",
        },
    },

    // ── 8. SPAM: İş İlanı Filtre Testi ──────────────────────────────────────
    {
        title: "SPAM — İş İlanı (Filtre Testi)",
        path: "/api/inbox",
        body: {
            platform:     "gmail",
            platform_id:  `test-spam-${Date.now()}-001`,
            author:       "LinkedIn Jobs",
            author_email: "jobs-noreply@linkedin.com",
            subject:      "10 yeni iş ilanı sizi bekliyor — Senior Developer pozisyonları",
            content:      "Merhaba! Bu hafta profilinize uygun 10 yeni iş ilanı var. Google, Amazon, Microsoft gibi şirketler Senior Full Stack Developer arıyor. Hemen başvurun! Maaş aralığı: 120.000-180.000 TL/ay. Tıklayın: linkedin.com/jobs/...",
        },
    },

    // ── 9. SPAM: Newsletter Filtre Testi ────────────────────────────────────
    {
        title: "SPAM — Newsletter (Filtre Testi)",
        path: "/api/inbox",
        body: {
            platform:     "gmail",
            platform_id:  `test-spam-${Date.now()}-002`,
            author:       "TechCrunch Newsletter",
            author_email: "newsletter@techcrunch.com",
            subject:      "This Week in Tech: OpenAI drops GPT-5, Apple Vision Pro sales, more",
            content:      "Welcome to this week's TechCrunch digest! TOP STORIES: 1) OpenAI announces GPT-5 with 1M context window 2) Apple Vision Pro sells 500k units in Q1 3) EU AI Act enforcement begins. Read more at techcrunch.com. Unsubscribe | Privacy Policy",
        },
    },

    // ── 10. HOT_LEAD: Sağlık Sektörü Dijital Dönüşüm ───────────────────────
    {
        title: "HOT_LEAD — Sağlık Sektörü Dijital Dönüşüm",
        path: "/api/inbox",
        body: {
            source:  "operator",
            content: "500 yataklı bir özel hastane zinciri için dijital dönüşüm roadmap'i istiyoruz. Öncelikler: hasta deneyimi iyileştirme (mobil uygulama), doktor-asistan AI (klinik karar destek), ve back-office otomasyonu (faturalama, stok). 3 yıllık plan ve MVP scope'u tanımla.",
        },
    },

    // ── 11. HOT_LEAD: Enerji Şirketi AI Entegrasyonu ────────────────────────
    {
        title: "HOT_LEAD — Enerji Şirketi AI Entegrasyonu",
        path: "/api/inbox",
        body: {
            source:  "operator",
            content: "Yenilenebilir enerji santrallerimiz (5 rüzgar, 3 güneş) için predictive maintenance sistemi kurmak istiyoruz. Sensör verisi IoT ile geliyor, arıza tahminleri için ML modeli lazım. Ayrıca enerji üretim optimizasyonu için AI agent düşünüyoruz. Teknik mimari ve POC planı hazırla.",
        },
    },

    // ── 12. HOT_LEAD: R&D / İnovasyon Araştırma Görevi ──────────────────────
    {
        title: "HOT_LEAD — R&D Araştırma / Teknoloji Radarı",
        path: "/api/inbox",
        body: {
            source:  "operator",
            content: "INNOVATION_RADAR: 2025 yılının en kritik yapay zeka trendlerini araştır. Özellikle: (1) Agentic AI sistemlerin enterprise benimsenmesi, (2) Multimodal LLM'lerin sektörel uygulamaları, (3) AI güvenliği ve hallucination azaltma teknikleri. Bu trendleri bizim mevcut ürün portföyümüze nasıl entegre edebileceğimizi anlatan bir strateji belgesi oluştur.",
        },
    },
];

// ── ÇALIŞTIRICI ───────────────────────────────────────────────────────────────
async function runAll() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  🤖 AI Orchestra — 12 Senaryo Test Koşusu Başlıyor");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Sunucu  : ${BASE_URL}`);
    console.log(`  Tarih   : ${new Date().toLocaleString("tr-TR")}`);
    console.log("═══════════════════════════════════════════════════════\n");

    const results = { success: 0, fail: 0, spam: 0 };

    for (let i = 0; i < scenarios.length; i++) {
        const { title, path, body } = scenarios[i];
        try {
            const res = await post(path, body);
            log(i + 1, title, res);

            if (res.status === 200) {
                if (res.body?.status === "IGNORED") results.spam++;
                else results.success++;
            } else {
                results.fail++;
            }
        } catch (err) {
            console.log(`\n❌ [${i + 1}/12] ${title}`);
            console.log(`   HATA: ${err.message} — Sunucu çalışıyor mu?`);
            results.fail++;
        }

        if (i < scenarios.length - 1) {
            process.stdout.write(`   ⏳ ${DELAY_MS / 1000}s bekleniyor...\r`);
            await sleep(DELAY_MS);
        }
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  📊 TEST SONUÇLARI");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  ✅ Başarılı (workflow/ticket): ${results.success}`);
    console.log(`  🗑️  Filtrelendi (SPAM/OTHER) : ${results.spam}`);
    console.log(`  ❌ Başarısız                : ${results.fail}`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n  💡 Frontend'de canlı agent aktivasyonlarını izlemek için");
    console.log("     http://localhost:3002 adresini aç.\n");
}

runAll().catch(console.error);
