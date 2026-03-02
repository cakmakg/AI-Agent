export async function publisherNode(state) {
    console.log("🚀 Dağıtım Koordinatörü (Ajan 5) devrede. Rapor dünyaya açılıyor...");

    // .env dosyasından URL'yi çekiyoruz
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes("SENIN_URL")) {
        console.log("⚠️ Webhook URL bulunamadı. Lütfen .env dosyasını kontrol edin.");
        return { isPublished: true }; 
    }

    try {
        // Üretilen şaheserin (Blueprint veya Rapor) ilk 500 karakterini özet olarak alalım
        const snippet = state.finalContent ? state.finalContent.substring(0, 500) + "...\n\n*[Metnin devamı bilgisayarınızdaki 'output' klasöründedir]*" : "İçerik bulunamadı.";
        
        // Yargıcın (Senin) Postman'den gönderdiğin onay notunu alıyoruz
        const feedback = state.humanFeedback || "Onaylandı";

        // Gelişmiş, dinamik bildirim metni
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

        if(response.ok) {
            console.log("✅ Dağıtım Koordinatörü: Bildirim başarıyla dış dünyaya (Webhook) fırlatıldı!");
        } else {
            const errorText = await response.text();
            console.log(`❌ Dağıtım Koordinatörü: Gönderim başarısız oldu. Durum: ${response.status}`);
            console.log(`   -> Hata Detayı: ${errorText}`);
        }
    } catch (error) {
         console.error("❌ Webhook Ağ Hatası:", error.message);
    }

    return { isPublished: true };
}