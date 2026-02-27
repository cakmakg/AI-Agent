import { ChatBedrockConverse } from "@langchain/aws";

// Ajan 1'in Beyni
const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0", // Sektörel bilgisi yüksek model
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export async function scraperNode(state) {
    console.log("🕵️‍♂️ Veri Tarayıcı (Ajan 1) devrede. Görev için sektörel veri toplanıyor...");

    // Sabit bir siteye gitmek yerine, LLM'e derinlemesine pazar araştırması yaptırıyoruz!
    const prompt = `Sie sind ein hochqualifizierter B2B Data Researcher und IT-Analyst.
    Ihre Aufgabe ist es, für die folgende Kundenanforderung die wichtigsten technologischen Fakten, Best Practices, Cloud-Architekturen und Marktdaten zu recherchieren.

    Kundenanforderung / Aufgabe des Orchestrators:
    ---
    ${state.task}
    ---

    Bitte erstellen Sie ein detailliertes 'Forschungsdossier' (Research Dossier) über die aktuelle Marktsituation, technologische Herausforderungen in dieser spezifischen Branche (z.B. Maschinenbau) und bewährte Cloud/KI-Lösungen. Dieses Dossier wird an unseren System-Analysten weitergegeben.`;

    const response = await llm.invoke(prompt);
    
    console.log("✅ Veri Tarayıcı: Sektörel araştırmalar ve teknik veriler başarıyla toplandı!");

    // Toplanan veriyi hafızaya (scrapedData) yazıyoruz
    return { scrapedData: response.content };
}