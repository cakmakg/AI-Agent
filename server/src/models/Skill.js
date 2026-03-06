import mongoose from "mongoose";

const SkillSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        sector: { type: [String], default: [] },
        description: { type: String },
        configSchema: { type: Object, default: {} },
    },
    { timestamps: true }
);

export const Skill = mongoose.model("Skill", SkillSchema);
