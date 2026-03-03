import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
    {
        threadId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        task: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["AWAITING_APPROVAL", "APPROVED", "REJECTED", "PUBLISHED"],
            default: "AWAITING_APPROVAL",
        },
        humanFeedback: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true, // createdAt, updatedAt otomatik eklenir
    }
);

export const Report = mongoose.model("Report", ReportSchema);
