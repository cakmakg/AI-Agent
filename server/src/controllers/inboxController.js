import { v4 as uuidv4 } from "uuid";
import { processIncomingMessage } from "../agents/customerBotAgent.js";
import { runHotLeadWorkflow } from "../workflows/runner.js";

export const handleInbox = async (req, res) => {
    try {
        if (!req.body.message) return res.status(400).json({ error: "Lütfen 'message' gönderin." });
        console.log(`\n📧 YENİ MESAJ GELDİ (Webhook)`);

        const leadAnalysis = await processIncomingMessage(req.body.message, req.clientId, req.tenant?.config);

        if (leadAnalysis.category === "SPAM" || leadAnalysis.category === "OTHER") {
            return res.json({ status: "IGNORED", message: "Mesaj filtrelendi (SPAM/OTHER)." });
        }

        if (leadAnalysis.category === "SUPPORT_PRICING" || leadAnalysis.category === "SUPPORT_BUG") {
            console.log("🛑 SİSTEM DURDU: Destek talebi için Yargıç Onayı Bekleniyor!");
            const threadId = uuidv4();
            return res.json({
                success: true,
                status: "AWAITING_HUMAN_APPROVAL_SUPPORT",
                threadId,
                category: leadAnalysis.category,
                message: "Destek talebi geldi. Taslak cevap Yargıç onayında.",
                pendingContent: leadAnalysis.draftResponse
            });
        }

        if (leadAnalysis.category === "HOT_LEAD") {
            const threadId = uuidv4();
            runHotLeadWorkflow(threadId, leadAnalysis.orchestratorTask, req.tenant?.config).catch((err) =>
                console.error("❌ HOT_LEAD workflow başlatma hatası:", err.message)
            );
            return res.json({ success: true, status: "PROCESSING", threadId });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
