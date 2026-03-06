import { Client } from "../models/Client.js";
import { TenantConfig } from "../models/TenantConfig.js";

// Her request'te tenant (müşteri) context'ini yükler
export async function tenantMiddleware(req, res, next) {
    try {
        // ID'yi alıyoruz (x-api-key header'ı, body veya query üzerinden)
        const requestApiKey = req.headers["x-api-key"] || req.body?.clientId || req.query?.clientId || "default";

        // Müşteriyi bul veya default oluştur (test ortamı için kolaylık sağlıyor)
        let client = await Client.findOne({
            $or: [{ apiKey: requestApiKey }, { slug: requestApiKey }]
        });

        if (!client) {
            console.warn(`⚠️ ClientId / API Key '${requestApiKey}' bulunamadı. Auto-creating fallback tenant...`);
            client = await Client.create({
                name: "Test Tenant",
                slug: requestApiKey,
                apiKey: requestApiKey,
                sector: "general"
            });
        }

        // Müşteri bulundu, konfigürasyonunu (TenantConfig) al
        let config = await TenantConfig.findOne({ clientId: client._id });

        if (!config) {
            config = await TenantConfig.create({
                clientId: client._id,
                agentPersona: "Sen yardımcı, profesyonel bir şirket asistanısın. Müşteriye en doğru bilgiyi vermeye odaklan.",
                tone: "Kibar, profesyonel, güven verici",
                enabledSkills: []
            });
        }

        // Context injection
        req.tenant = { client, config };

        // RAG Service vs için kolay bulunabilirlik
        req.clientId = client.slug; // veya client._id kullanabiliriz ama RAG slug veya default ile çalışıyor

        next();
    } catch (err) {
        console.error("❌ tenantMiddleware Hatası:", err.message);
        res.status(500).json({ error: "Tenant processing failed." });
    }
}
