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

const routingSchema = z.object({
   nextAgent: z.enum(["scraper", "analyzer", "writer", "critic", "fileSaver", "human_approval", "publisher", "architect", "END"])
                .describe("Welcher Agent als Nächstes aufgerufen wird oder ob der Prozess beendet wird (END)."),
   reason: z.string().describe("Eine kurze Erklärung auf Deutsch.")
});

const llmWithStructuredOutput = llm.withStructuredOutput(routingSchema, { name: "route_task" });

export async function orchestratorNode(state) {
    console.log(`👨‍💼 Orkestra Şefi (Ajan 7) düşünüyor... (Deneme Sayısı: ${state.revisionCount})`); 

    // ==========================================
    // 🛑 1. SERT MÜHENDİSLİK FRENLERİ (Sonsuz Döngü Kırıcılar)
    // Bu kurallar LLM'den önce çalışır ve inatlaşmayı kesin olarak önler.
    // ==========================================
    
    // FREN 1: Eğer CTO (Architect) planı yazıp kaydettiyse ve yargıç henüz bakmadıysa, doğrudan yargıca git!
    if (state.fileSaved && state.finalContent && state.finalContent.includes("Architektur-Blueprint") && state.humanApproval === null) {
        console.log("   -> ⚡ SİSTEM MÜDAHALESİ: Blueprint başarıyla diske yazıldı. Doğrudan Yargıca gidiliyor.");
        return { nextAgent: "human_approval" };
    }

    // FREN 2: Genel Döngü Sınırı (Sistem 5 kereden fazla kendi içinde dönerse fişi çek ve yargıca sor)
    if (state.revisionCount >= 5) {
        console.log("   -> ⚡ SİSTEM MÜDAHALESİ: Maksimum deneme sınırına ulaşıldı! Yargıç onayına zorlanıyor.");
        return { nextAgent: "human_approval" };
    }


    // ==========================================
    // 🧠 2. LLM YÖNLENDİRMESİ (Normal Akış)
    // ==========================================
    const kritikerStatus = state.isApproved ? "FREIGEGEBEN" : (state.criticFeedback ? "ABGELEHNT_MIT_FEEDBACK" : "NOCH_NICHT_GEPRÜFT");
    const richterStatus = state.humanApproval === true ? "FREIGEGEBEN" : (state.humanApproval === false ? "ABGELEHNT_MIT_FEEDBACK" : "NOCH_NICHT_GEPRÜFT");

    const prompt = `Sie sind ein deterministischer State-Machine-Router für ein KI-Agenten-Team.
    Sie müssen Aufgaben AUSSCHLIESSLICH in der folgenden REIHENFOLGE ausführen.
    
    Aktueller Status (STATE):
    - Aufgabe (Task): "${state.task}"
    - Scraping-Daten vorhanden: ${state.scrapedData ? "JA" : "NEIN"}
    - Analysebericht vorhanden: ${state.analysisReport ? "JA" : "NEIN"}
    - Autorentext (Final Content) vorhanden: ${state.finalContent ? "JA" : "NEIN"}
    - Kritiker-Status: ${kritikerStatus}
    - Revisions-Zähler (Versuche): ${state.revisionCount}
    - Datei gespeichert: ${state.fileSaved ? "JA" : "NEIN"}
    - Richter-Status: ${richterStatus}
    - An Kanal gesendet: ${state.isPublished ? "JA" : "NEIN"}

    STRIKTE ROUTING-REGELN (Gehen Sie diese von oben nach unten durch!):

    // 🔬 ROUTE 0: AR-GE / İNOVASYON DEPARTMANI (R&D Track)
    Regel 0.1: Wenn die Aufgabe das Wort "INNOVATION_RADAR" enthält UND Scraping-Daten "NEIN" sind -> wähle "scraper". (Zuerst News suchen!)
    Regel 0.2: Wenn die Aufgabe das Wort "INNOVATION_RADAR" enthält UND Scraping-Daten "JA" sind UND Autorentext "NEIN" ist -> wähle "architect". (Dann Blueprint aus den News machen!)
    
    // 🎯 ROUTE 1: SOFTWARE & CODING (CTO-Track)
    Regel 1: WENN in der Aufgabe Wörter wie "Code", "Dashboard", "Software", "App", "Blueprint" oder "Next.js" vorkommen UND der Autorentext (Final Content) "NEIN" ist UND es KEIN "INNOVATION_RADAR" ist -> WÄHLEN SIE ZWINGEND "architect".
    
    // 📊 ROUTE 2: RECHERCHE & BERICHTE (Research-Track)
    Regel 2: Wenn es KEIN Software-Projekt ist UND Scraping-Daten "NEIN" sind -> wählen Sie "scraper".
    Regel 3: Wenn Scraping-Daten "JA" sind, aber Analysebericht "NEIN" ist -> wählen Sie "analyzer".
    Regel 4: Wenn Analysebericht "JA" ist und Autorentext "NEIN" ist -> wählen Sie "writer".
    
    // 🛑 GEMEINSAME REGELN (Eskalation, Speichern, Richter)
    Regel 5: Wenn Autorentext "JA" ist, Revisions-Zähler >= 3 und Datei gespeichert "NEIN" -> wählen Sie "fileSaver".
    Regel 6: Wenn Autorentext "JA" ist, Revisions-Zähler < 3, Kritiker-Status "NOCH_NICHT_GEPRÜFT" und Datei gespeichert "NEIN" -> wählen Sie "critic".
    Regel 7: Wenn Autorentext "JA" ist, Revisions-Zähler < 3, Kritiker-Status "ABGELEHNT_MIT_FEEDBACK" und Datei gespeichert "NEIN" -> wählen Sie "writer".
    Regel 8: Wenn Autorentext "JA" ist, Kritiker-Status "FREIGEGEBEN" und Datei gespeichert "NEIN" -> wählen Sie "fileSaver".
    Regel 9: Wenn Datei gespeichert "JA" und Richter-Status "NOCH_NICHT_GEPRÜFT" -> wählen Sie "human_approval".
    Regel 10: Wenn Datei gespeichert "JA" und Richter-Status "ABGELEHNT_MIT_FEEDBACK" -> wählen Sie "writer".
    Regel 11: Wenn Datei gespeichert "JA", Richter-Status "FREIGEGEBEN" und An Kanal gesendet "NEIN" -> wählen Sie "publisher".
    Regel 12: NUR WENN An Kanal gesendet "JA" ist -> wählen Sie "END".`;
    
    const response = await llmWithStructuredOutput.invoke(prompt);

    console.log(`   -> Şefin Kararı: ${response.nextAgent}`);
    if (response.reason) console.log(`   -> Gerekçe: ${response.reason}\n`);

    return { nextAgent: response.nextAgent };
}