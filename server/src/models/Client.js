import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        apiKey: { type: String, required: true, unique: true },
        sector: { type: String },
        language: { type: String, default: "tr" },
        plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    },
    { timestamps: true }
);

export const Client = mongoose.model("Client", ClientSchema);
