import { ChatBedrockConverse } from "@langchain/aws";
import { z } from "zod";

// Eleştirmen Ajan (Ajan 5) için daha zeki bir model kullanıyoruz (Sonnet veya Opus mantıklı olur)
const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0", // Kalite kontrol için zeki model şart
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Eleştirmenin döneceği Zod Şeması (Sadece Evet/Hayır ve Gerekçe)
const criticSchema = z.object({
    isApproved: z.boolean().describe("Metin yayınlanmaya uygun mu? Kusursuzsa true, hatası varsa false."),
    criticFeedback: z.string().describe("Eğer onaylanmadıysa (false), yazarın tam olarak neyi düzeltmesi gerektiği. Onaylandıysa boş bırakılabilir.")
});

const llmWithStructuredOutput = llm.withStructuredOutput(criticSchema, {
    name: "evaluate_content",
});

export async function criticNode(state) {
    console.log("🧐 Eleştirmen Ajan (Ajan 5) devrede. Metin denetleniyor...");

    // Acımasız Alman Kalite Kontrolcü Promptu
    const prompt = `Sie sind ein strenger und detailorientierter Quality Assurance Manager (Qualitätsprüfer) für ein deutsches Technologieunternehmen.
    Ihre Aufgabe ist es, den von unserem Copywriter erstellten strategischen Bericht zu prüfen, bevor er an die Geschäftsführung gesendet wird.

    Prüfen Sie den folgenden Text nach diesen strikten Kriterien:
    1. Ist die Sprache ein makelloses, professionelles Business-Deutsch (formelle Anrede "Sie", korrekte Grammatik und Rechtschreibung)?
    2. Wurde das Markdown-Format (.md) korrekt verwendet (Überschriften, Listen, fette Texte)?
    3. Gibt es eine formelle Begrüßung (z.B. "Sehr geehrte Geschäftsführung") und eine professionelle Verabschiedung?
    4. Ist der Tonfall sachlich, strategisch und für Top-Manager angemessen?

    Wenn ALLE Kriterien perfekt erfüllt sind, geben Sie isApproved: true zurück.
    Wenn AUCH NUR EIN Kriterium nicht erfüllt ist (z.B. ein Grammatikfehler, ein falscher Tonfall oder ein fehlendes Markdown-Element), geben Sie isApproved: false zurück UND schreiben Sie in 'criticFeedback' exakt, was der Copywriter korrigieren muss (auf Deutsch). Seien Sie kritisch!

    Hier ist der zu prüfende Text:
    ---
    ${state.finalContent}
    ---
    `;

    const response = await llmWithStructuredOutput.invoke(prompt);

    if (response.isApproved) {
        console.log("✅ Eleştirmen: Metin KUSURSUZ! Onay verildi.");
    } else {
        console.log(`❌ Eleştirmen: Metin REDDEDİLDİ! Hata bulundu.`);
        console.log(`   -> Geri Bildirim: ${response.criticFeedback}`);
    }

    // Sistemin hafızasını Eleştirmenin kararıyla güncelliyoruz
    return { 
        isApproved: response.isApproved, 
        criticFeedback: response.criticFeedback 
    };
}