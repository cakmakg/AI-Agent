import { SKILL_REGISTRY } from "../skills/index.js";

export const getAvailableSkills = (req, res) => {
    try {
        // Drop the getTool function payload for frontend safety and JSON serialization
        const skills = Object.entries(SKILL_REGISTRY).map(([id, skillConfig]) => ({
            id,
            name: skillConfig.name,
            description: skillConfig.description,
            sector: skillConfig.sector,
            configSchema: skillConfig.configSchema
        }));

        res.json({ success: true, skills });
    } catch (err) {
        console.error("❌ /api/skills hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
};
