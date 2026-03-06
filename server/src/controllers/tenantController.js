import { TenantConfig } from "../models/TenantConfig.js";

export const getTenantConfig = async (req, res) => {
    res.json({ success: true, client: req.tenant?.client, config: req.tenant?.config });
};

export const updateTenantConfig = async (req, res) => {
    try {
        if (!req.tenant?.client) return res.status(401).json({ error: "Unauthorized" });
        const { agentPersona, tone, companyContext, supportInstructions, enabledSkills, skillConfigs } = req.body;

        const updateObj = {};
        if (agentPersona !== undefined) updateObj.agentPersona = agentPersona;
        if (tone !== undefined) updateObj.tone = tone;
        if (companyContext !== undefined) updateObj.companyContext = companyContext;
        if (supportInstructions !== undefined) updateObj.supportInstructions = supportInstructions;
        if (enabledSkills !== undefined) updateObj.enabledSkills = enabledSkills;
        if (skillConfigs !== undefined) updateObj.skillConfigs = skillConfigs;

        const config = await TenantConfig.findOneAndUpdate(
            { clientId: req.tenant.client._id },
            { $set: updateObj },
            { new: true, upsert: true }
        );
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
