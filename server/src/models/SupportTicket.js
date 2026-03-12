import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
    {
        // ── n8n: Platform bağımsız tekil kimlik (idempotency) ──
        platform_id: {
            type: String,
            sparse: true,
            unique: true,
            index: true,
        },
        // ── n8n: Kaynak platform (gmail|youtube|slack|instagram|twitter|tiktok) ──
        platform: {
            type: String,
            default: "gmail",
        },
        // ── n8n: Gönderen görünen adı ──
        author: {
            type: String,
            default: "",
        },
        // ── n8n: Orijinal n8n kategori etiketi ──
        n8nCategory: {
            type: String,
            default: "",
        },
        // ── n8n: AI özeti ──
        aiSummary: {
            type: String,
            default: "",
        },
        // ── Öncelik seviyesi ──
        priority: {
            type: String,
            enum: ["critical", "high", "medium", "low"],
            default: "medium",
        },
        // ── Gmail uyumluluğu (opsiyonel, sadece gmail için) ──
        emailMessageId: {
            type: String,
            sparse: true,
            unique: true,
            index: true,
        },
        gmailThreadId: {
            type: String,
            default: "",
        },
        clientId: {
            type: String,
            default: "default",
            index: true
        },
        from: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            default: "(no subject)",
        },
        body: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["SUPPORT_PRICING", "SUPPORT_BUG", "HOT_LEAD", "OTHER", "SPAM"],
            default: "OTHER",
        },
        draftResponse: {
            type: String,
            default: "",
        },
        ragSources: {
            type: [{ title: String, score: Number }],
            default: [],
        },
        status: {
            type: String,
            enum: ["AWAITING_APPROVAL", "SENT", "REJECTED", "ESCALATED"],
            default: "AWAITING_APPROVAL",
        },
        humanFeedback: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export const SupportTicket = mongoose.model("SupportTicket", SupportTicketSchema);
