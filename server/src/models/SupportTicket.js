import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
    {
        emailMessageId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        gmailThreadId: {
            type: String,
            required: true,
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
