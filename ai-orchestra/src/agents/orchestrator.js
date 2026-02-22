import { ChatBedrockConverse } from "@langchain/aws";
import { z } from "zod";

const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Zod Şeması da Almanca düşünüyor
const routingSchema = z.object({
   nextAgent: z.enum(["scraper", "analyzer", "writer", "critic", "fileSaver", "publisher", "END"])
                .describe("Welcher Agent als Nächstes aufgerufen wird oder ob der Prozess beendet wird (END)."),
    reason: z.string()
             .describe("Eine kurze Erklärung auf Deutsch, warum diese Entscheidung getroffen wurde.")
});

const llmWithStructuredOutput = llm.withStructuredOutput(routingSchema, {
    name: "route_task",
});

export async function orchestratorNode(state) {
    // Biz terminali okurken anlayalım diye burası Türkçe kalıyor
    console.log("👨‍💼 Orkestra Şefi (Ajan 7) düşünüyor..."); 

    // ŞEFİN ALMANCA BEYNİ (Prompt)
    const prompt = `Sie sind ein deterministischer State-Machine-Router.
    Sie müssen Aufgaben AUSSCHLIESSLICH in der folgenden REIHENFOLGE ausführen. Es ist STRENGSTENS UNTERSAGT, Schritte eigenmächtig zu überspringen.
    
    Aufgabe des Benutzers: ${state.task}

    Aktueller Status (State):
    - Scraping-Daten (scrapedData): ${state.scrapedData ? "VORHANDEN" : "FEHLT"}
    - Analysebericht (analysisReport): ${state.analysisReport ? "VORHANDEN" : "FEHLT"}
    - Autorentext (finalContent): ${state.finalContent ? "VORHANDEN" : "FEHLT"}
    - Kritiker-Freigabe (isApproved): ${state.isApproved ? "JA" : "NEIN"}
    - Kritiker-Feedback (criticFeedback): ${state.criticFeedback ? "VORHANDEN" : "FEHLT"}
    - Datei gespeichert (fileSaved): ${state.fileSaved ? "JA" : "NEIN"}
    - An Kanal gesendet (isPublished): ${state.isPublished ? "JA" : "NEIN"}

    STRIKTE ROUTING-REGELN (Prüfen Sie der Reihe nach und wenden Sie die erste zutreffende Regel an):
    Regel 1: Wenn Scraping-Daten "FEHLT" -> wählen Sie "scraper".
    Regel 2: Wenn Scraping-Daten "VORHANDEN", aber Analysebericht "FEHLT" -> wählen Sie "analyzer".
    Regel 3: Wenn Analysebericht "VORHANDEN" und Autorentext "FEHLT" -> wählen Sie "writer".
    Regel 4: Wenn Autorentext "VORHANDEN", Kritiker-Freigabe "NEIN" und Kritiker-Feedback "FEHLT" -> wählen Sie "critic".
    Regel 5: Wenn Autorentext "VORHANDEN", Kritiker-Freigabe "NEIN" und Kritiker-Feedback "VORHANDEN" -> wählen Sie "writer". (Kritiker hat abgelehnt, Autor muss korrigieren!)
    Regel 6: Wenn Autorentext "VORHANDEN", Kritiker-Freigabe "JA" und Datei gespeichert "NEIN" -> wählen Sie "fileSaver".
    Regel 7: Wenn Datei gespeichert "JA" und An Kanal gesendet "NEIN" -> wählen Sie "publisher".
    Regel 8: NUR WENN An Kanal gesendet "JA" ist -> wählen Sie "END".

    WICHTIGE WARNUNG: Um den Prozess zu beenden (END), MUSS der Publisher-Agent zwingend ausgeführt worden sein und der Wert 'isPublished' auf JA stehen.`;

    const response = await llmWithStructuredOutput.invoke(prompt);

    console.log(`   -> Şefin Kararı: ${response.nextAgent}`);
    console.log(`   -> Şefin Gerekçesi (Almanca): ${response.reason}\n`);

    return { nextAgent: response.nextAgent };
}