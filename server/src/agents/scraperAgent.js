import { ChatBedrockConverse } from "@langchain/aws";
import { z } from "zod";

// Ajan 1: Otonom Araştırmacı (Bağımsız Native Fetch Mimarisi)
const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// 🎯 LLM'den en iyi arama kelimesini üretmesini istiyoruz
const searchSchema = z.object({
    searchQuery: z.string().describe("Die beste Suchanfrage (auf Englisch oder Deutsch) für eine Suchmaschine, um die Aufgabe des Benutzers optimal zu erfüllen. Sei spezifisch!"),
    reasoning: z.string().describe("Eine kurze Erklärung, warum genau dieser Suchbegriff gewählt wurde.")
});

const llmWithStructuredOutput = llm.withStructuredOutput(searchSchema, { name: "generate_search_query" });

export async function scraperNode(state) {
    console.log("🔍 Araştırmacı Ajan (Ajan 1) internete bağlanıyor...");

    // Adım 1: Görevi anlayıp en iyi arama sorgusunu (Query) oluştur
    const prompt = `Sie sind ein hochprofessioneller IT-Researcher (Ajan 1) für ein Beratungsunternehmen.
    Der Orchestrator hat Ihnen eine Aufgabe zugewiesen.
    
    Aufgabe: ${state.task}
    
    Analysieren Sie die Aufgabe und generieren Sie die perfekte Suchanfrage (searchQuery), um die aktuellsten und relevantesten Informationen aus dem Internet (Stand heute) zu finden.`;

    const queryResponse = await llmWithStructuredOutput.invoke(prompt);
    console.log(`   -> Strateji: ${queryResponse.reasoning}`);
    console.log(`   -> İnternette Aranan Kelime: "${queryResponse.searchQuery}"`);

    // Adım 2: Native Fetch ile doğrudan Tavily API'sine bağlan! (Paketsiz, sorunsuz)
    console.log("   -> Tavily AI API'sine doğrudan istek atılıyor...");
    
    let searchResults = "";
    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: queryResponse.searchQuery,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Hata Kodu: ${response.status}`);
        }

        const data = await response.json();
        
        // Gelen veriyi Analiz Ajanı (Ajan 2) için güzelce formatlıyoruz
        searchResults = `Tavily AI Yapay Zeka Özeti:\n${data.answer || ''}\n\nDetaylı Kaynaklar:\n`;
        data.results.forEach((res, index) => {
            searchResults += `\n[${index + 1}] Kaynak: ${res.url}\nİçerik: ${res.content}\n`;
        });

        console.log("✅ Web taraması tamamlandı! Canlı veriler başarıyla çekildi.");
    } catch (error) {
        console.error("❌ Arama sırasında hata oluştu:", error.message);
        searchResults = "Fehler bei der Websuche. Bitte basierend auf internem Wissen fortfahren.";
    }

    // Adım 3: Gerçek internet verilerini hafızaya kaydet
    return {
        scrapedData: searchResults
    };
}