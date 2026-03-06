import mongoose from "mongoose";

const TenantConfigSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
            unique: true,
        },
        agentPersona: { type: String, default: "You are a professional AI assistant." },
        tone: { type: String, default: "Kibar, profesyonel, güven verici" },
        companyContext: { type: String, default: "" },
        supportInstructions: { type: String, default: "" },
        enabledSkills: { type: [String], default: [] },
        skillConfigs: { type: Object, default: {} },
    },
    { timestamps: true }
);

export const TenantConfig = mongoose.model("TenantConfig", TenantConfigSchema);
