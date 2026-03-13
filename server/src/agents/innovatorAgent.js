/**
 * Ajan 11 — "The Visionary" (Yaratıcı / Şeytanın Avukatı)
 *
 * Görev: Analyzer'ın "mantıklı" 3 aksiyonunu okur ve herkesin gözden
 * kaçırdığı, riskli ama 10x getirili 4. çılgın yolu üretir.
 * Aykırı düşünce, Writer'ın raporuna "Vizyoner Alternatif" bölümü olarak eklenir.
 *
 * Akış: analyzer → innovator → writer
 */

import { ChatBedrockConverse } from "@langchain/aws";
import { trackLLMCost } from "../services/costTracker.js";

const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export async function innovatorNode(state) {
    console.log("💡 Vizyoner (Ajan 11) sahneye çıkıyor — kuralları yıkıyor...");

    const prompt = `Sen "The Visionary" — bir şeytanın avukatı, aykırı düşünür ve gizli fırsat avcısısın.

Görevin: Aşağıdaki standart analizin 3 güvenli, "mantıklı" aksiyonunu oku. Onları REDDET.
Ardından herkesin gözden kaçırdığı, sıradan bir danışmanın önermeyeceği 4. Çılgın Yol'u üret.

KURALLAR:
1. Analistin yazdığı yolları tekrar etme. Onları "sıkıcı" bul ve geç.
2. Bağlamın GERÇEK gizli fırsatını veya görmezden gelinen tehlikesini tespit et.
3. Ters köşe düşün: "Herkes A yapıyor. Peki ya B'nin tam tersi olan Z'yi yapsak ne olur?"
4. Somut ol — muğlak "disruptive fikirler" değil, uygulanabilir 1 cesur adım öner.
5. Maksimum 4 paragraf. Sert, vurucu, esprili bir dil kullan.
6. Sonunda tek cümlelik "10x Bahsi" ile bitir: Neden bu çılgın yol diğerlerinden daha değerli?

Görev Bağlamı:
${state.task}

Standart Analistin Ürettiği 3 Yol:
${state.analysisReport}`;

    const response = await llm.invoke(prompt);

    trackLLMCost(
        response.usage_metadata?.input_tokens || 0,
        response.usage_metadata?.output_tokens || 0,
        "INNOVATOR", state.threadId || "SYSTEM", "default",
        "eu.anthropic.claude-sonnet-4-5-20250929-v1:0"
    ).catch(() => {});

    console.log("🔥 Vizyoner: Aykırı alternatif üretildi — Writer bekliyor.");

    return { innovatorInsight: response.content };
}
