import { ChatBedrockConverse } from "@langchain/aws";
import { z } from "zod";
import { trackLLMCostFromStrings } from "../services/costTracker.js";
import { getEnabledTools } from "../skills/index.js";

const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const routingSchema = z.object({
    nextAgent: z.enum(["scraper", "analyzer", "innovator", "writer", "critic", "fileSaver", "human_approval", "publisher", "architect", "END"])
        .describe("Welcher Agent als Nächstes aufgerufen wird oder ob der Prozess beendet wird (END)."),
    reason: z.string().describe("Eine kurze Erklärung auf Deutsch.")
});

export async function orchestratorNode(state, config) {
    const tenantConfig = config?.configurable?.tenantConfig;
    const tools = getEnabledTools(tenantConfig);
    const agentWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;
    const llmWithStructuredOutput = agentWithTools.withStructuredOutput(routingSchema, { name: "route_task" });

    console.log(`👨‍💼 Orkestra Şefi (Ajan 7) düşünüyor... (Deneme Sayısı: ${state.revisionCount}) [Aktif Araç Sayısı: ${tools.length}]`);

    // ==========================================
    // 🛑 1. SERT MÜHENDİSLİK FRENLERİ (Sonsuz Döngü Kırıcılar)
    // Bu kurallar LLM'den önce çalışır ve inatlaşmayı kesin olarak önler.
    // ==========================================

    // FREN 1: Yayın tamamlandıysa → END (tekrar döngüye girmesin)
    if (state.isPublished === true) {
        console.log("   -> ⚡ SİSTEM MÜDAHALESİ: Yayın tamamlandı → END.");
        return { nextAgent: "END" };
    }

    // FREN 2: Dosya kaydedildi ve yargıç henüz bakmadı → doğrudan HITL'e git (LLM'e bırakma!)
    if (state.fileSaved === true && (state.humanApproval === null || state.humanApproval === undefined)) {
        console.log("   -> ⚡ SİSTEM MÜDAHALESİ: Dosya kaydedildi → doğrudan Yargıca gidiliyor.");
        return { nextAgent: "human_approval" };
    }

    // FREN 3: Genel Döngü Sınırı (Writer↔Critic döngüsü 5 kez dönerse fişi çek)
    if (state.revisionCount >= 5) {
        console.log("   -> ⚡ SİSTEM MÜDAHALESİ: Maksimum deneme sınırına ulaşıldı! Yargıç onayına zorlanıyor.");
        return { nextAgent: "human_approval" };
    }

    // ==========================================
    // 🛑 FREN 4 & 5: Research-Track Döngü Kırıcı
    // LLM bazen gerekçesinde "writer" der ama structured output olarak "analyzer" döner.
    // Bu deterministik kurallar LLM tutarsızlığını tamamen engeller.
    // ==========================================
    const taskText = state.task || "";
    const isInnovationRadar = /INNOVATION_RADAR/i.test(taskText);
    const isSocialMedia    = /TWITTER|LINKEDIN/i.test(taskText);
    const isCodingProject  = /\b(Code|Dashboard|Software|App|Blueprint|Next\.js)\b/i.test(taskText);
    const isResearchTrack  = !isInnovationRadar && !isSocialMedia && !isCodingProject;

    // FREN 4a: Analiz tamamlandı, Vizyoner henüz çalışmadı → Innovator'a
    if (isResearchTrack && state.analysisReport && !state.innovatorInsight && !state.finalContent && !state.fileSaved) {
        console.log("   -> ⚡ FREN 4a: Analiz tamam, Vizyoner bekliyor → Innovator'a.");
        return { nextAgent: "innovator" };
    }

    // FREN 4b: Hem analiz hem vizyoner tamam, içerik henüz yok → Writer'a
    if (isResearchTrack && state.analysisReport && state.innovatorInsight && !state.finalContent && !state.fileSaved) {
        console.log("   -> ⚡ FREN 4b: Analiz + Vizyoner tamam, içerik yok → doğrudan Writer'a.");
        return { nextAgent: "writer" };
    }

    // FREN 5: Scraping tamamlandı, analiz eksik, içerik yok → doğrudan Analyzer
    if (isResearchTrack && state.scrapedData && !state.analysisReport && !state.finalContent) {
        console.log("   -> ⚡ FREN 5: Scraping tamam, analiz eksik → doğrudan Analyzer'a.");
        return { nextAgent: "analyzer" };
    }

    // FREN 6: Revisions sınırı — Critic reddi bile olsa revisionCount >= 3 ise fileSaver
    if (state.finalContent && state.revisionCount >= 3 && !state.fileSaved) {
        console.log("   -> ⚡ FREN 6: Revizyon sınırına ulaşıldı (>= 3) → fileSaver'a zorlanıyor.");
        return { nextAgent: "fileSaver" };
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
    - Visionäre Alternative (Innovator) vorhanden: ${state.innovatorInsight ? "JA" : "NEIN"}
    - Autorentext (Final Content) vorhanden: ${state.finalContent ? "JA" : "NEIN"}
    - Kritiker-Status: ${kritikerStatus}
    - Revisions-Zähler (Versuche): ${state.revisionCount}
    - Datei gespeichert: ${state.fileSaved ? "JA" : "NEIN"}
    - Richter-Status: ${richterStatus}
    - An Kanal gesendet: ${state.isPublished ? "JA" : "NEIN"}

    STRIKTE ROUTING-REGELN (Gehen Sie diese von oben nach unten durch!):

    // 🔬 ROUTE 0: F&E / INNOVATION (R&D-Track)
    Regel 0.1: Wenn die Aufgabe das Wort "INNOVATION_RADAR" enthält UND Scraping-Daten "NEIN" sind -> wähle "scraper". (Zuerst News suchen!)
    Regel 0.2: Wenn die Aufgabe das Wort "INNOVATION_RADAR" enthält UND Scraping-Daten "JA" sind UND Autorentext "NEIN" ist -> wähle "architect". (Dann Blueprint aus den News erstellen!)

    // 📣 ROUTE 0.3: SOCIAL MEDIA / WACHSTUM (Twitter & LinkedIn Track)
    Regel 0.3: Wenn die Aufgabe das Wort "TWITTER" oder "LINKEDIN" enthält UND Scraping-Daten "NEIN" sind -> wähle "scraper". (Erst aktuelle Daten für Social-Media-Inhalte sammeln!)
    Regel 0.4: Wenn die Aufgabe das Wort "TWITTER" oder "LINKEDIN" enthält UND Scraping-Daten "JA" sind UND Autorentext "NEIN" ist -> wähle "writer". (Direkt zum Writer! Kein Analyzer für Social-Media-Content nötig.)
    
    // 🎯 ROUTE 1: SOFTWARE & CODING (CTO-Track)
    Regel 1: WENN in der Aufgabe Wörter wie "Code", "Dashboard", "Software", "App", "Blueprint" oder "Next.js" vorkommen UND der Autorentext (Final Content) "NEIN" ist UND es KEIN "INNOVATION_RADAR" ist -> WÄHLEN SIE ZWINGEND "architect".
    
    // 📊 ROUTE 2: RECHERCHE & BERICHTE (Research-Track)
    Regel 2: Wenn es KEIN Software-Projekt ist UND Scraping-Daten "NEIN" sind -> wählen Sie "scraper".
    Regel 3: Wenn Scraping-Daten "JA" sind, aber Analysebericht "NEIN" ist -> wählen Sie "analyzer".
    Regel 3.5: Wenn Analysebericht "JA" ist UND Visionäre Alternative "NEIN" ist UND Autorentext "NEIN" ist -> wählen Sie "innovator". (Der Visionary muss IMMER nach dem Analyzer kommen!)
    Regel 4: Wenn Analysebericht "JA" ist UND Visionäre Alternative "JA" ist UND Autorentext "NEIN" ist -> wählen Sie "writer".
    
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

    // 💰 CFO'ya maliyeti bildir
    trackLLMCostFromStrings(prompt, JSON.stringify(response), "ORCHESTRATOR", state.threadId || "SYSTEM", config?.configurable?.tenantConfig?.clientId || "default").catch(() => { });

    console.log(`   -> Şefin Kararı: ${response.nextAgent}`);
    if (response.reason) console.log(`   -> Gerekçe: ${response.reason}\n`);

    return { nextAgent: response.nextAgent };
}