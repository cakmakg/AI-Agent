// ── Publisher Agent (Dağıtım Koordinatörü) ──
// Kanallar: Discord Webhook · Telegram Bot · WhatsApp (Twilio)

// ── Telegram ──
async function sendToTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || token.includes("SENIN") || !chatId || chatId.includes("SENIN")) {
        console.log("⚠️ Telegram: .env ayarları eksik — atlandı.");
        return;
    }

    // Telegram limit: 4096 karakter
    const text = message.length > 4000
        ? message.substring(0, 4000) + "\n\n_[...devamı MongoDB'de saklandı]_"
        : message;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
    });

    if (res.ok) console.log("✅ Telegram: Mesaj iletildi!");
    else console.error("❌ Telegram hata:", await res.text());
}

// ── WhatsApp (Twilio) ──
async function sendToWhatsApp(message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM; // whatsapp:+14155238886
    const to = process.env.TWILIO_WHATSAPP_TO;   // whatsapp:+905xxxxxxxxx

    if (!accountSid || accountSid.includes("SENIN") || !authToken || !from || !to) {
        console.log("⚠️ WhatsApp (Twilio): .env ayarları eksik — atlandı.");
        return;
    }

    // WhatsApp limit: ~1600 karakter
    const body = message.length > 1500
        ? message.substring(0, 1500) + "\n\n[...devamı MongoDB'de saklandı]"
        : message;

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const form = new URLSearchParams({ From: from, To: to, Body: body });

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString()
    });

    if (res.ok) console.log("✅ WhatsApp: Mesaj iletildi!");
    else console.error("❌ WhatsApp hata:", await res.text());
}

// ── Discord / Slack Webhook ──
async function sendToDiscord(webhookUrl, message) {
    if (!webhookUrl || webhookUrl.includes("SENIN_URL")) {
        console.log("⚠️ Discord: Webhook URL yok — atlandı.");
        return;
    }

    const snippet = message.length > 1500
        ? message.substring(0, 1500) + "\n\n*[...devamı MongoDB'de saklandı]*"
        : message;

    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: snippet, text: snippet })
    });

    if (res.ok) console.log("✅ Discord: Webhook başarılı!");
    else console.error("❌ Discord hata:", await res.text());
}

// ── Ana Publisher Node ──
export async function publisherNode(state) {
    console.log("🚀 Dağıtım Koordinatörü (Ajan 9) devrede. Rapor tüm kanallara yayılıyor...");

    const content = state.finalContent || "İçerik bulunamadı.";
    const feedback = state.humanFeedback || "Onaylandı";

    const telegramMsg =
        `🤖 *AI ORCHESTRA — YENİ RAPOR ONAYLANDI!*

📋 *Görev:* ${(state.task || "").substring(0, 200)}
👨‍⚖️ *Yargıç Notu:* ${feedback}

${content}`;

    const whatsappMsg =
        `🤖 AI ORCHESTRA — YENİ RAPOR ONAYLANDI!

📋 Görev: ${(state.task || "").substring(0, 150)}
👨‍⚖️ Yargıç Notu: ${feedback}

${content}`;

    // Tüm kanallar paralel çalışır — biri başarısız olsa diğerleri devam eder
    const results = await Promise.allSettled([
        sendToTelegram(telegramMsg),
        sendToWhatsApp(whatsappMsg),
        sendToDiscord(process.env.DISCORD_WEBHOOK_URL, telegramMsg),
    ]);

    const anySuccess = results.some(r => r.status === "fulfilled");

    if (anySuccess) {
        console.log("✅ Dağıtım Koordinatörü: En az bir kanal başarılı — yayın tamamlandı.");
        return { isPublished: true };
    } else {
        console.warn("⚠️ Dağıtım Koordinatörü: Tüm kanallar başarısız. Logları kontrol edin.");
        return { isPublished: false };
    }
}