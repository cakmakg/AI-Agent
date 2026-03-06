import { Report } from "../models/Report.js";

export const getLatestArtifact = async (req, res) => {
    try {
        const report = await Report.findOne({ status: "AWAITING_APPROVAL" }).sort({ createdAt: -1 });
        if (!report) return res.status(404).json({ success: false, error: "No pending reports found." });
        res.json({ success: true, content: report.content, status: report.status, task: report.task, threadId: report.threadId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getArtifactByThreadId = async (req, res) => {
    try {
        const report = await Report.findOne({ threadId: req.params.threadId });
        if (!report) return res.status(404).json({ error: "Report not found." });
        res.json({ success: true, content: report.content, status: report.status, task: report.task, threadId: report.threadId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
