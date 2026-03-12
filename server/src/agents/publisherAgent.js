// ── Publisher Agent (Dağıtım Koordinatörü — Ajan 9) ──
// Onaylanan içeriği n8n'in dispatch webhook'una tek bir JSON olarak iletir.
// Hangi kanala gideceğine (Slack, Telegram, YouTube, vb.) n8n karar verir.

export async function publisherNode(state) {
    console.log("🚀 Dağıtım Koordinatörü (Ajan 9): n8n dispatch webhook'u tetikleniyor...");

    const webhookUrl = process.env.N8N_PUBLISH_WEBHOOK;
    if (!webhookUrl) {
        console.warn("⚠️ N8N_PUBLISH_WEBHOOK env eksik — yayın atlandı.");
        return { isPublished: false };
    }

    const payload = {
        type:          "publish",
        threadId:      state.threadId || "",
        task:          state.task || "",
        content:       state.finalContent || "",
        humanFeedback: state.humanFeedback || "Onaylandı ✓",
        fileSaved:     state.fileSaved || false,
    };

    try {
        const res = await fetch(webhookUrl, {
            method:  "POST",
            headers: {
                "Content-Type":    "application/json",
                "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET || "",
                "X-Source":        "ai-orchestra",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000),
        });

        if (res.ok) {
            console.log("✅ n8n: Yayın webhook'u başarıyla tetiklendi.");
            return { isPublished: true };
        } else {
            const errText = await res.text();
            console.error(`❌ n8n publish hatası (HTTP ${res.status}): ${errText}`);
            return { isPublished: false };
        }
    } catch (err) {
        console.error("❌ n8n publish bağlantı hatası:", err.message);
        return { isPublished: false };
    }
}
