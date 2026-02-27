import { ChatBedrockConverse } from "@langchain/aws";
import { z } from "zod";

// Ajan 6: Müşteri İlişkileri ve Gelen Kutusu Yöneticisi
const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0", // Dili ve niyeti iyi anlaması için Sonnet kullanıyoruz
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Ajan 6'nın döneceği Zod Şeması (Sıcak müşteri mi, değil mi?)
const leadSchema = z.object({
    category: z.enum(["SPAM", "SUPPORT", "HOT_LEAD", "OTHER"])
               .describe("Gelen mesajın kategorisi."),
    isHotLead: z.boolean()
                .describe("Bu müşteri şirkete para kazandıracak potansiyel bir müşteri mi?"),
    analysis: z.string()
               .describe("Müşterinin niyetinin Almanca kısa bir analizi."),
    orchestratorTask: z.string()
                       .describe("Eğer HOT_LEAD ise, Orkestra Şefine (Ajan 7) verilecek olan 'Araştırma ve Teklif Yazma' görevi (Almanca). Değilse boş bırak.")
});

const llmWithStructuredOutput = llm.withStructuredOutput(leadSchema, {
    name: "analyze_incoming_message",
});

export async function processIncomingMessage(customerMessage) {
    console.log("🕵️ Müşteri İlişkileri Botu (Ajan 6) Gelen Kutusunu İnceliyor...");

    const prompt = `Sie sind der Lead Qualification Manager (Ajan 6) für ein deutsches IT- und KI-Beratungsunternehmen.
    Sie haben eine neue Nachricht (E-Mail/DM) von einer externen Person erhalten.
    
    Ihre Aufgabe ist es, diese Nachricht zu analysieren:
    1. Ist es SPAM?
    2. Ist es eine normale Support-Anfrage (SUPPORT)?
    3. Oder ist es ein potenzieller, zahlender Neukunde, der eine Dienstleistung oder Beratung sucht (HOT_LEAD)?

    Wenn es ein HOT_LEAD ist, generieren Sie in 'orchestratorTask' einen Befehl für unseren Orchestrator-Agenten (Ajan 7). 
    Der Befehl sollte in etwa so lauten: "Analysieren Sie das Unternehmen/die Branche des Kunden bezüglich [Thema der E-Mail] und erstellen Sie ein strategisches Beratungsangebot."

    Hier ist die eingehende Nachricht:
    ---
    ${customerMessage}
    ---
    `;

    const response = await llmWithStructuredOutput.invoke(prompt);

    console.log(`   -> Kategori: ${response.category}`);
    console.log(`   -> Analiz: ${response.analysis}`);
    
    if(response.isHotLead) {
        console.log(`🔥 SICAK MÜŞTERİ TESPİT EDİLDİ! Şef'e Görev Çıkarılıyor: ${response.orchestratorTask}`);
    } else {
        console.log("🛑 Müşteri pas geçildi. Orkestra yorulmayacak.");
    }

    return response;
}