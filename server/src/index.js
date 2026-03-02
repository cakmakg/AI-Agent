
import cron from "node-cron";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { StateAnnotation } from "./state/graphState.js";

// Ajanları İçeri Aktarıyoruz
import { orchestratorNode } from "./agents/orchestrator.js";
import { scraperNode } from "./agents/scraperAgent.js";
import { analyzerNode } from "./agents/analyzerAgent.js";
import { writerNode } from "./agents/writerAgent.js";
import { criticNode } from "./agents/criticAgent.js"; 
import { fileNode } from "./agents/fileAgent.js";
import { publisherNode } from "./agents/publisherAgent.js";
import { processIncomingMessage } from "./agents/customerBotAgent.js"; 
import { architectNode } from "./agents/architectAgent.js";

// 🎯 Yargıç Gölge Düğümü
const humanNode = (state) => {
    console.log("👨‍⚖️ Yargıç kararı bekleniyor... Sistem uykuya geçiyor.");
    return {}; 
};

// ---------------------------------------------------------
// 1. LANGGRAPH İŞ AKIŞI VE HAFIZA KURULUMU
// ---------------------------------------------------------
const workflow = new StateGraph(StateAnnotation)
    .addNode("orchestrator", orchestratorNode)
    .addNode("scraper", scraperNode)
    .addNode("analyzer", analyzerNode)
    .addNode("writer", writerNode)
    .addNode("critic", criticNode)
    .addNode("fileSaver", fileNode)
    .addNode("publisher", publisherNode)
    .addNode("human_approval", humanNode)
    .addNode("architect", architectNode)
    .addEdge(START, "orchestrator")
    .addEdge("scraper", "orchestrator")
    .addEdge("analyzer", "orchestrator")
    .addEdge("writer", "orchestrator")
    .addEdge("critic", "orchestrator")
    .addEdge("fileSaver", "orchestrator")
    .addEdge("publisher", "orchestrator")
    .addEdge("human_approval", "orchestrator")
    .addEdge("architect", "orchestrator")
    .addConditionalEdges("orchestrator", (state) => state.nextAgent === "END" ? END : state.nextAgent);

const checkpointer = new MemorySaver();
const app = workflow.compile({
    checkpointer,
    interruptBefore: ["human_approval"] 
});

// ---------------------------------------------------------
// 2. EXPRESS.JS SUNUCUSU
// ---------------------------------------------------------
const server = express();
server.use(helmet());
server.use(cors());
server.use(express.json());

mongoose.connect(process.env.MONGODB)
    .then(() => console.log("📦 MongoDB Atlas Bağlantısı Başarılı!"))
    .catch(err => console.error("❌ MongoDB Hatası:", err));

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------
// 3. API UÇLARI (ENDPOINTS)
// ---------------------------------------------------------

// 🚪 KAPI 1: Manuel Görev Verme
server.post("/api/analyze", async (req, res) => {
    try {
        if (!req.body.task) return res.status(400).json({ error: "Lütfen 'task' belirtin." });
        const finalState = await app.invoke({ task: req.body.task });
        res.json({ success: true, fileSaved: finalState.fileSaved, finalReport: finalState.finalContent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🚪 KAPI 2: Gelen Kutusu (Triyaj)
server.post("/api/inbox", async (req, res) => {
    try {
        if (!req.body.message) return res.status(400).json({ error: "Lütfen 'message' gönderin." });
        console.log(`\n📧 YENİ MESAJ GELDİ (Webhook)`);

        const leadAnalysis = await processIncomingMessage(req.body.message);

        if (leadAnalysis.category === "SPAM" || leadAnalysis.category === "OTHER") {
            return res.json({ status: "IGNORED", message: "Mesaj filtrelendi (SPAM/OTHER)." });
        }

        // 🎯 DESTEK TALEBİ DURUMU
        if (leadAnalysis.category === "SUPPORT_PRICING" || leadAnalysis.category === "SUPPORT_BUG") {
            console.log("🛑 SİSTEM DURDU: Destek talebi için Yargıç Onayı Bekleniyor!");
            const threadId = uuidv4(); 
            return res.json({
                success: true,
                status: "AWAITING_HUMAN_APPROVAL_SUPPORT",
                threadId,
                category: leadAnalysis.category,
                message: "Destek talebi geldi. Taslak cevap Yargıç onayında.",
                pendingContent: leadAnalysis.draftResponse 
            });
        }

        // 🚀 SICAK SATIŞ DURUMU
        if (leadAnalysis.category === "HOT_LEAD") {
            const threadId = uuidv4(); 
            const config = { configurable: { thread_id: threadId }, recursionLimit: 100 };
            for await (const chunk of await app.stream({ task: leadAnalysis.orchestratorTask }, config)) {}
            const currentState = await app.getState(config);

            if (currentState.next.includes("human_approval")) {
                return res.json({
                    success: true,
                    status: "AWAITING_HUMAN_APPROVAL",
                    threadId, 
                    pendingContent: currentState.values.finalContent 
                });
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🚪 KAPI 3: Yargıç Karar Merkezi (Onay/Red)
server.post("/api/approve", async (req, res) => {
    try {
        const { threadId, isApproved, feedback, category } = req.body;
        if (!threadId) return res.status(400).json({ error: "Lütfen threadId belirtin." });

        // 🎯 1. DURUM: DESTEK TALEBİ ONAYI
        if (category === "SUPPORT_BUG" || category === "SUPPORT_PRICING") {
            if (isApproved) {
                console.log(`\n📧 [E-POSTA GÖNDERİLİYOR] -> Konu: Destek Talebi Hk.`);
                console.log(`📝 İçerik: ${feedback || "Ajanın hazırladığı taslak başarıyla gönderildi."}`);
                return res.json({ success: true, status: "EMAIL_SENT", message: "Destek cevabı gönderildi!" });
            }
            return res.json({ success: true, status: "REJECTED", message: "Taslak reddedildi." });
        }

        // 🚀 2. DURUM: SATIŞ (ORKESTRA) AKIŞI DEVAM ETTİRME
        const config = { configurable: { thread_id: threadId } };
        await app.updateState(config, {
            humanApproval: isApproved,
            humanFeedback: feedback || (isApproved ? "Onaylandı." : "Yeniden yaz.")
        });

        await app.invoke(null, config); 
        return res.json({ success: true, status: isApproved ? "PUBLISHED" : "REVISED" });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

server.listen(PORT, () => {
    console.log(`\n🌐 AI Orkestra Sunucusu Çalışıyor!`);
    console.log(`📡 Port: http://localhost:${PORT}`);
});
// ==========================================
// 🔬 SPRINT 5: AR-GE (R&D) DEPARTMANI CRON JOB
// ==========================================
// Normalde "0 8 * * *" ile her sabah 08:00'de çalışır.
// Ancak bizim testi canlı görebilmemiz için "*/2 * * * *" (Her 2 dakikada bir) olarak ayarladık.
cron.schedule("*/2 * * * *", async () => {
    console.log("\n⏰ [AR-GE ALARMI ÇALDI] Teknoloji Radarı uyandı!");
    console.log("🕵️‍♂️ İnternetteki en yeni yapay zeka gelişmeleri taranıyor...\n");

    const threadId = "RND-" + Date.now();
    const config = { configurable: { thread_id: threadId } };
    
    // Şef'e gönderilecek gizli Ar-Ge görevi (Prompt)
    const rndTask = "INNOVATION_RADAR: Recherchiere die allerneuesten Updates von Anthropic (Claude) und OpenAI für Entwickler von heute. Erstelle basierend auf diesen neuen Technologien einen Master Blueprint (.md), der erklärt, wie wir diese neuen KI-Features in unsere bestehende Architektur integrieren können.";

    try {
        // Not: Eğer LangGraph'ı derlediğin değişkenin adı "app" ise app.invoke() kullan.
        // Eğer farklı bir isimde derlediysen (örn: const myGraph = workflow.compile()), myGraph.invoke() yap.
        // Genelde index.js içinde "app" olarak tanımlanır.
        await app.invoke({
            task: rndTask,
            revisionCount: 0,
            fileSaved: false,
            humanApproval: null,
            isPublished: false
        }, config);
        
    } catch (error) {
        console.error("❌ Ar-Ge departmanı çalışırken bir hata oluştu:", error);
    }
});