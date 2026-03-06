import { app } from "../workflows/graph.js";
import { Report } from "../models/Report.js";
import { runPublishWorkflow, runRevisionWorkflow } from "../workflows/runner.js";

export const handleApproval = async (req, res) => {
    try {
        const { threadId, isApproved, feedback, category } = req.body;
        if (!threadId) return res.status(400).json({ error: "Lütfen threadId belirtin." });

        if (category !== "SUPPORT_BUG" && category !== "SUPPORT_PRICING") {
            const exists = await Report.exists({ threadId, clientId: req.clientId });
            if (!exists) return res.status(403).json({ error: "You don't have permission to approve this thread." });
        }

        if (category === "SUPPORT_BUG" || category === "SUPPORT_PRICING") {
            if (isApproved) {
                console.log(`\n📧 [E-POSTA GÖNDERİLİYOR] → Konu: Destek Talebi Hk.`);
                console.log(`📝 İçerik: ${feedback || "Ajanın hazırladığı taslak başarıyla gönderildi."}`);
                return res.json({ success: true, status: "EMAIL_SENT", message: "Destek cevabı gönderildi!" });
            }
            return res.json({ success: true, status: "REJECTED", message: "Taslak reddedildi." });
        }

        const config = { configurable: { thread_id: threadId } };

        await app.updateState(config, {
            humanApproval: isApproved,
            humanFeedback: feedback || (isApproved ? "Onaylandı." : "Yeniden yaz.")
        });

        if (isApproved) {
            runPublishWorkflow(threadId, feedback).catch(err =>
                console.error("❌ Publish background error:", err.message)
            );
            return res.json({ success: true, status: "PUBLISHED" });
        } else {
            await Report.findOneAndUpdate(
                { threadId },
                { status: "REJECTED", humanFeedback: feedback || "" }
            );
            runRevisionWorkflow(threadId, req.tenant?.config).catch(err =>
                console.error("❌ Revision background error:", err.message)
            );
            return res.json({ success: true, status: "REVISED" });
        }
    } catch (error) {
        console.error("❌ /api/approve hatası:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
