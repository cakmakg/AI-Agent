// ── Publisher Agent (Dağıtım Koordinatörü — Ajan 9) ──
// Kanallar: Telegram (özet + .md eki) · WhatsApp (Twilio) · Discord Webhook
import path from "path";

// ── Yardımcı: Proje adını finalContent'ten çıkar ──
function projeAdiniCikar(finalContent) {
    const match = finalContent?.match(/^#.*?Blueprint:?\s*(.+)/im);
    return match ? match[1].trim() : "AI_Blueprint_Report";
}

// ── Yardımcı: 3 satırlık yönetici özeti ──
function yoneticiOzeti(state) {
    const projeAdi = projeAdiniCikar(state.finalContent);
    const gorev = (state.task || "").substring(0, 180);
    const not = state.humanFeedback || "Onaylandı ✓";

    // finalContent içinden ilk anlamlı paragrafı bul (özet olarak kullan)
    const ozet = state.finalContent
        ?.split("\n")
        .filter(l => l.trim().length > 60 && !l.startsWith("#"))
        .slice(0, 2)
        .join(" ")
        .substring(0, 300) || "Detaylar ekteki dosyada.";

    return { projeAdi, gorev, ozet, not };
}

// ── Telegram: Özet mesaj + .md dosya eki ──
async function sendToTelegram(state) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || token.includes("BURAYA") || !chatId || chatId.includes("BURAYA")) {
        console.log("⚠️ Telegram: .env ayarları eksik — atlandı.");
        return;
    }

    const { projeAdi, gorev, ozet, not } = yoneticiOzeti(state);

    // 1. ADIM: Kısa yönetici özeti (sohbet balonu)
    const kisaMesaj =
        `🚨 *YENİ AR\\-GE RAPORU ONAYLANDI\\!*

🎯 *Proje:* ${projeAdi.replace(/[_*[\]()~>#+=|{}.!-]/g, "\\$&")}
📋 *Görev:* ${gorev.replace(/[_*[\]()~>#+=|{}.!-]/g, "\\$&")}
👨‍⚖️ *Yargıç Notu:* ${not}

💡 *Özet:* ${ozet.replace(/[_*[\]()~>#+=|{}.!-]/g, "\\$&")}

🔗 Detaylar ekteki _\\.md_ dosyasındadır\\.`;

    const msgRes = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: kisaMesaj,
                parse_mode: "MarkdownV2",
            }),
        }
    );
    if (!msgRes.ok) {
        const err = await msgRes.text();
        console.error("❌ Telegram mesaj hatası:", err);
    } else {
        console.log("✅ Telegram: Özet mesaj iletildi.");
    }

    // 2. ADIM: Tam raporu .md dosyası olarak gönder
    const safeFileName = projeAdi.replace(/[^a-z0-9_-]/gi, "_").substring(0, 60) + "_blueprint.md";
    const fileContent = state.finalContent || "# İçerik bulunamadı.";

    const form = new FormData();
    form.append("chat_id", chatId);
    form.append(
        "document",
        new Blob([fileContent], { type: "text/markdown; charset=utf-8" }),
        safeFileName
    );
    form.append("caption", `📄 ${projeAdi} — Tam Blueprint Dosyası`);

    const docRes = await fetch(
        `https://api.telegram.org/bot${token}/sendDocument`,
        { method: "POST", body: form }
    );

    if (docRes.ok) console.log(`✅ Telegram: ${safeFileName} dosyası gönderildi.`);
    else console.error("❌ Telegram dosya hatası:", await docRes.text());
}

// ── WhatsApp (Twilio) ──
async function sendToWhatsApp(state) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    const to = process.env.TWILIO_WHATSAPP_TO;

    if (!accountSid || accountSid.includes("BURAYA") || !authToken || !from || !to) {
        console.log("⚠️ WhatsApp (Twilio): .env ayarları eksik — atlandı.");
        return;
    }

    const { projeAdi, gorev, ozet, not } = yoneticiOzeti(state);

    // WhatsApp 1600 karakter sınırı — sadece özet
    const body =
        `🚨 YENİ AR-GE RAPORU ONAYLANDI!

🎯 Proje: ${projeAdi}
📋 Görev: ${gorev.substring(0, 150)}
👨‍⚖️ Yargıç Notu: ${not}

💡 Özet: ${ozet.substring(0, 400)}

🔗 Tam rapor Cyber-Nexus UI / Telegram üzerinden erişilebilir.`;

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const form = new URLSearchParams({ From: from, To: to, Body: body });

    const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString(),
        }
    );

    if (res.ok) console.log("✅ WhatsApp: Özet mesaj iletildi.");
    else console.error("❌ WhatsApp hatası:", await res.text());
}

// ── Discord / Slack Webhook ──
async function sendToDiscord(state) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("BURAYA")) {
        console.log("⚠️ Discord: Webhook URL yok — atlandı.");
        return;
    }

    const { projeAdi, gorev, ozet, not } = yoneticiOzeti(state);
    const snippet = (state.finalContent || "").substring(0, 1800) + "\n\n*[...devamı MongoDB'de]*";

    const embed = {
        title: `🚀 ${projeAdi}`,
        description: snippet,
        color: 0x39ff14,
        fields: [
            { name: "📋 Görev", value: gorev.substring(0, 256), inline: false },
            { name: "👨‍⚖️ Yargıç Notu", value: not.substring(0, 256), inline: false },
            { name: "💡 Özet", value: ozet.substring(0, 256), inline: false },
        ],
        footer: { text: "AI Orchestra v2.0 · HITL Approved" },
    };

    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
    });

    if (res.ok) console.log("✅ Discord: Embed rapor gönderildi.");
    else console.error("❌ Discord hatası:", await res.text());
}

// ── Ana Publisher Node ──
export async function publisherNode(state) {
    console.log("🚀 Dağıtım Koordinatörü (Ajan 9): Rapor tüm kanallara yayılıyor...");
    console.log(`   📄 Proje: ${projeAdiniCikar(state.finalContent)}`);

    const results = await Promise.allSettled([
        sendToTelegram(state),
        sendToWhatsApp(state),
        sendToDiscord(state),
    ]);

    results.forEach((r, i) => {
        if (r.status === "rejected") {
            const kanal = ["Telegram", "WhatsApp", "Discord"][i];
            console.error(`❌ ${kanal} — ${r.reason?.message || r.reason}`);
        }
    });

    const anySuccess = results.some(r => r.status === "fulfilled");
    console.log(anySuccess
        ? "✅ Dağıtım tamamlandı — en az bir kanal başarılı."
        : "⚠️ Tüm kanallar başarısız. Logları kontrol edin."
    );

    return { isPublished: anySuccess };
}