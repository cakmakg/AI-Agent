export async function publisherNode(state) {
    console.log("🚀 Dağıtım Koordinatörü (Ajan 8) devrede. Rapor dünyaya açılıyor...");

    // .env dosyasından URL'yi çekiyoruz
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes("SENIN_URL")) {
        console.log("⚠️ Webhook URL bulunamadı. Lütfen .env dosyasını kontrol edin. Yayın atlandı.");
        return { isPublished: false };
    }

    try {
        // İlk 1500 karakter — daha fazlası Discord'da kesilir
        const snippet = state.finalContent
            ? state.finalContent.substring(0, 1500) + "\n\n*[...devamı MongoDB'de saklandı]*"
            : "İçerik bulunamadı.";

        const feedback = state.humanFeedback || "Onaylandı";

        const notificationText = `🚀 **YENİ BİR İŞ BAŞARIYLA TAMAMLANDI!**\n\n` +
            `**Müşteri Talebi:** ${state.task}\n` +
            `👨‍⚖️ **Yargıç Notu:** ${feedback}\n\n` +
            `**--- ÇIKTI ÖZETİ ---**\n${snippet}\n`;

        // Hem Discord ("content") hem de Slack ("text") için uyumlu payload
        const payload = {
            content: notificationText,
            text: notificationText
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("✅ Dağıtım Koordinatörü: Bildirim başarıyla Webhook'a fırlatıldı!");
            return { isPublished: true };
        } else {
            const errorText = await response.text();
            console.error(`❌ Dağıtım Koordinatörü: Webhook başarısız. HTTP ${response.status}: ${errorText}`);
            return { isPublished: false };
        }
    } catch (error) {
        console.error("❌ Webhook Ağ Hatası:", error.message);
        return { isPublished: false };
    }
}