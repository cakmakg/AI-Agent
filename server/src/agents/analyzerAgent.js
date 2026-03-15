import { ChatBedrockConverse } from "@langchain/aws";
import { trackLLMCost } from "../services/costTracker.js";

// Ajan 2'nin Beyni (Yine Claude veya ileride değiştirebileceğimiz bir model)
const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export async function analyzerNode(state) {
    console.log("🧠 Analiz Motoru (Ajan 2) devrede. Gelen veri işleniyor...");

    // Analiz için Prompt (Sistem Yönergesi)
    const prompt = `Du bist ein erfahrener Senior-Strategie-Analyst.
    Unten stehen Rohdaten, die aus dem Internet gesammelt wurden. Lies sie und erstelle daraus einen kurzen, strategischen 3-Punkte-Aktionsplan für das Management.
    Antworte ausschliesslich auf Deutsch.

    Rohdaten:
    ${state.scrapedData}
    `;

    // Bedrock'a bağlanıp analizi istiyoruz
    const response = await llm.invoke(prompt);

    // 💰 CFO: Analyzer maliyetini kaydet
    trackLLMCost(
        response.usage_metadata?.input_tokens || 0,
        response.usage_metadata?.output_tokens || 0,
        "ANALYZER", state.threadId || "SYSTEM", "default",
        "eu.anthropic.claude-sonnet-4-5-20250929-v1:0"
    ).catch(() => { });

    console.log("✅ Analiz Motoru: Rapor hazırlandı!");

    // Çıkan sonucu sistem hafızasındaki (State) 'analysisReport' değişkenine kaydediyoruz
    return { analysisReport: response.content };
}