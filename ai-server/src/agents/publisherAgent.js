export async function publisherNode(state) {
    console.log("🚀 Dağıtım Koordinatörü (Ajan 5) devrede. Rapor dünyaya açılıyor...");

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes("SENIN_URL")) {
        console.log("⚠️ Webhook URL bulunamadı. Lütfen .env dosyasını kontrol edin.");
        return { isPublished: true }; 
    }

    try {
        // Rapor çok uzun olabileceği için sadece kısa bir bildirim metni hazırlıyoruz
        const notificationText = `🤖 **YENİ STRATEJİ RAPORU ONAYLANDI! (QA PASSED)**\n\n` +
            `Kalite kontrol aşamasından başarıyla geçen yeni bir rapor diske kaydedildi.\n` +
            `**Görev:** ${state.task}\n\n` +
            `*Lütfen sistemdeki 'output' klasörünü kontrol edin.*`;

        // Hem Discord ("content") hem de Slack ("text") için uyumlu payload hazırlıyoruz
        const payload = {
            content: notificationText, // Discord için
            text: notificationText     // Slack için
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if(response.ok) {
            console.log("✅ Dağıtım Koordinatörü: Bildirim başarıyla kanala fırlatıldı!");
        } else {
            // Hata detayını terminale daha net basıyoruz ki sorunu anlayalım
            const errorText = await response.text();
            console.log(`❌ Dağıtım Koordinatörü: Gönderim başarısız oldu. Durum: ${response.status}`);
            console.log(`   -> Hata Detayı: ${errorText}`);
        }
    } catch (error) {
         console.error("❌ Webhook Ağ Hatası:", error);
    }

    return { isPublished: true };
}