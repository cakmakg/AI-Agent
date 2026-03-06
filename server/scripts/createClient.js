import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from server root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { Client } from "../src/models/Client.js";
import { TenantConfig } from "../src/models/TenantConfig.js";

async function createClient() {
    try {
        console.log("Bağlanıyor: ", process.env.MONGODB || "YOK");
        if (!process.env.MONGODB) {
            console.error("HATA: MONGODB connection string .env dosyasında bulunamadı.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB);
        console.log("✅ MongoDB bağlantısı başarılı.");

        // Argümanları al
        const args = process.argv.slice(2);
        const nameArgIndex = args.indexOf("--name");
        const sectorArgIndex = args.indexOf("--sector");

        if (nameArgIndex === -1 || !args[nameArgIndex + 1]) {
            console.error("Kullanım: node createClient.js --name \"Şirket Adı\" [--sector sector_name]");
            process.exit(1);
        }

        const name = args[nameArgIndex + 1];
        let sector = "technology";
        if (sectorArgIndex !== -1 && args[sectorArgIndex + 1]) {
            sector = args[sectorArgIndex + 1];
        }

        // Slug oluştur
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

        // Benzersiz API anahtarı üret
        const randomString = crypto.randomBytes(16).toString("hex");
        const apiKey = `sk-${slug}-${randomString}`;

        // Yeni Client oluştur
        const client = new Client({
            name,
            slug,
            apiKey,
            sector,
            language: "tr"
        });

        await client.save();
        console.log(`✅ Müşteri başarıyla oluşturuldu: ${name}`);
        console.log(`🔑 API Key (Lütfen güvenli bir yere kaydedin): ${apiKey}`);

        // Varsayılan Tenant Config oluştur
        const tenantConfig = new TenantConfig({
            clientId: client._id,
            agentPersona: `Sen ${name} şirketinin yapay zeka asistanısın. Müşterilere profesyonelce destek vermelisin.`,
            tone: "Kibar, profesyonel, güven verici",
            companyContext: `${name} şirketi, ${sector} sektöründe hizmet vermektedir.`,
            supportInstructions: "Genel destek taleplerinde iletişim numaramızı paylaşın.",
            enabledSkills: [],
            skillConfigs: {}
        });

        await tenantConfig.save();
        console.log(`✅ Varsayılan Tenant Config ayarlandı.`);

    } catch (error) {
        console.error("❌ Hata oluştu:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB bağlantısı kapatıldı.");
        process.exit(0);
    }
}

createClient();
