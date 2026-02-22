import { ChatBedrockConverse } from "@langchain/aws";

// Ajan 2'nin Beyni (Yine Claude veya ileride değiştirebileceğimiz bir model)
const llm = new ChatBedrockConverse({
    model: "anthropic.claude-3-haiku-20240307-v1:0", // Şef kadar zeki olmasına gerek yok, Haiku yeterli
    region: process.env.AWS_DEFAULT_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export async function analyzerNode(state) {
    console.log("🧠 Analiz Motoru (Ajan 2) devrede. Gelen veri işleniyor...");

    // Analiz için Prompt (Sistem Yönergesi)
    const prompt = `Sen kıdemli bir Strateji Analistisin. 
    Aşağıda internetten toplanmış ham bir veri var. Bu veriyi oku ve yönetici için 3 maddelik kısa, stratejik bir aksiyon planı çıkar.
    
    Ham Veri: 
    ${state.scrapedData}
    `;

    // Bedrock'a bağlanıp analizi istiyoruz
    const response = await llm.invoke(prompt);

    console.log("✅ Analiz Motoru: Rapor hazırlandı!");
    
    // Çıkan sonucu sistem hafızasındaki (State) 'analysisReport' değişkenine kaydediyoruz
    return { analysisReport: response.content };
}