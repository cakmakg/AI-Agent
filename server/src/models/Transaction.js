import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["EXPENSE", "REVENUE"],
        required: true,
        index: true,
    },
    category: {
        type: String,
        enum: ["LLM_COST", "STRIPE_PAYMENT", "MANUAL"],
        required: true,
    },
    clientId: { type: String, default: "default" },
    agentName: { type: String, default: "SYSTEM" },
    threadId: { type: String, default: "SYSTEM" },
    amount: { type: Number, required: true },   // USD
    currency: { type: String, default: "USD" },
    metadata: {
        model: { type: String, default: "" },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        description: { type: String, default: "" },
    },
}, { timestamps: true });

// Aylık sorguları hızlandır
TransactionSchema.index({ type: 1, createdAt: -1 });
TransactionSchema.index({ agentName: 1, createdAt: -1 });

export default mongoose.model("Transaction", TransactionSchema);
