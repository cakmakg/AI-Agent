// ── /api/classify-email — Manuel email sınıflandırma tetikleyicisi ──
// n8n, her yeni maili buraya gönderebilir; backend customerBotAgent ile analiz eder.
// n8n'nin kendi AI sınıflandırıcısı yetersiz kalırsa fallback olarak kullanılır.

import { processIncomingMessage } from "../agents/customerBotAgent.js";

export const classifyEmail = async (req, res) => {
    try {
        const { content, message, subject = "", from = "", clientId } = req.body;
        const messageText = (content || message || "").trim();

        if (!messageText) return res.status(400).json({ error: "'content' veya 'message' alanı gerekli." });

        const fullMessage = subject ? `Konu: ${subject}\nGönderen: ${from}\n\n${messageText}` : messageText;
        const resolvedClientId = clientId || req.clientId || "default";

        console.log(`\n🔍 /api/classify-email — clientId: ${resolvedClientId}`);
        const analysis = await processIncomingMessage(fullMessage, resolvedClientId, req.tenant?.config);

        return res.json({
            success: true,
            category:       analysis.category,
            isHotLead:      analysis.isHotLead,
            analysis:       analysis.analysis,
            draftResponse:  analysis.draftResponse || null,
            orchestratorTask: analysis.orchestratorTask || null,
            ragSources:     analysis.ragSources || [],
        });
    } catch (err) {
        console.error("❌ /api/classify-email hatası:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
