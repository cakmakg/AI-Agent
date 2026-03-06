import { v4 as uuidv4 } from "uuid";
import { SupportTicket } from "../models/SupportTicket.js";
import { sendReply } from "../services/gmailService.js";
import { runHotLeadWorkflow } from "../workflows/runner.js";

export const getPendingTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket
            .find({ status: "AWAITING_APPROVAL", clientId: req.clientId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ tickets });
    } catch (err) {
        console.error("❌ /api/support/pending hatasi:", err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
};

export const approveTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { isApproved, feedback } = req.body;

        const ticket = await SupportTicket.findOne({ _id: ticketId, clientId: req.clientId });
        if (!ticket) return res.status(404).json({ error: "Ticket bulunamadi veya yetkiniz yok." });

        if (isApproved) {
            const replyBody = feedback || ticket.draftResponse;
            if (!replyBody) {
                return res.status(400).json({ error: "Gonderilecek yanit icerigi bos." });
            }

            if (process.env.GOOGLE_REFRESH_TOKEN) {
                await sendReply(ticket.gmailThreadId, ticket.from, ticket.subject, replyBody);
            } else {
                console.warn("   ⚠️ GOOGLE_REFRESH_TOKEN eksik — mail gonderimi simule edildi.");
                console.log(`   [SIMULATED SEND] To: ${ticket.from} | ${replyBody.slice(0, 120)}`);
            }

            await SupportTicket.findByIdAndUpdate(ticketId, {
                status: "SENT",
                humanFeedback: feedback || "",
            });
            return res.json({ success: true, status: "SENT" });

        } else {
            if (ticket.category === "SUPPORT_BUG") {
                const bugThreadId = uuidv4();
                const bugTask = `BUG_REPORT: Musteriden gelen hata bildirimi. Gonderen: ${ticket.from}. Konu: ${ticket.subject}. Detay: ${ticket.body.slice(0, 500)}`;
                runHotLeadWorkflow(bugThreadId, bugTask, req.tenant?.config).catch(err =>
                    console.error("Bug escalation hatasi:", err.message)
                );
                await SupportTicket.findByIdAndUpdate(ticketId, {
                    status: "ESCALATED",
                    humanFeedback: feedback || "CTO'ya iletildi.",
                });
                return res.json({ success: true, status: "ESCALATED", bugThreadId });
            }

            await SupportTicket.findByIdAndUpdate(ticketId, {
                status: "REJECTED",
                humanFeedback: feedback || "",
            });
            return res.json({ success: true, status: "REJECTED" });
        }
    } catch (err) {
        console.error("❌ /api/support approve hatasi:", err.message);
        res.status(500).json({ error: err.message });
    }
};
