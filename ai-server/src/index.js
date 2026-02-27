import "dotenv/config";
import express from "express";
import cors from "cors";
import { StateGraph, START, END } from "@langchain/langgraph";
import { StateAnnotation } from "./state/graphState.js";

// Ajanları İçeri Aktarıyoruz
import { orchestratorNode } from "./agents/orchestrator.js";
import { scraperNode } from "./agents/scraperAgent.js";
import { analyzerNode } from "./agents/analyzerAgent.js"; 
import { writerNode } from "./agents/writerAgent.js";
import { criticNode } from "./agents/criticAgent.js"; // 🎯 YENİ: Eleştirmen Ajan Eklendi
import { fileNode } from "./agents/fileAgent.js";
import { publisherNode } from "./agents/publisherAgent.js";
import { processIncomingMessage } from "./agents/customerBotAgent.js"; // 🎯 YENİ: Kapı Bekçimiz (Ajan 6)
import helmet from "helmet"; // YENİ: Güvenlik kalkanı
import mongoose from "mongoose"; // YENİ: Veritabanı


// 1. Grafiği Başlat ve Düğümleri Ekle
const workflow = new StateGraph(StateAnnotation);

workflow.addNode("orchestrator", orchestratorNode); 
workflow.addNode("scraper", scraperNode);           
workflow.addNode("analyzer", analyzerNode);         
workflow.addNode("writer", writerNode);
workflow.addNode("critic", criticNode);             // 🎯 YENİ: Eleştirmen Düğümü Eklendi
workflow.addNode("fileSaver", fileNode);
workflow.addNode("publisher", publisherNode);

// 2. İletişim Yolları
workflow.addEdge(START, "orchestrator"); 
workflow.addEdge("scraper", "orchestrator");
workflow.addEdge("analyzer", "orchestrator");
workflow.addEdge("writer", "orchestrator");
workflow.addEdge("critic", "orchestrator");         // 🎯 YENİ: Eleştirmen de Şefe Rapor Verir
workflow.addEdge("fileSaver", "orchestrator");
workflow.addEdge("publisher", "orchestrator");

workflow.addConditionalEdges("orchestrator", (state) => {
    if (state.nextAgent === "END") return END;
    return state.nextAgent; 
});

// Sistemi Derle
const app = workflow.compile();

// ---------------------------------------------------------
// EXPRESS.JS SUNUCUSU (REST API)
// ---------------------------------------------------------

const server = express();
server.use(helmet()); // Sunucu başlıklarını (headers) gizler ve korur
server.use(cors());
server.use(express.json());

// 🟢 MONGODB BAĞLANTISI
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("📦 MongoDB Atlas Bağlantısı Başarılı!"))
    .catch(err => console.error("❌ MongoDB Hatası:", err));

// 🛡️ API GÜVENLİK MİDDLEWARE'İ (Kapıdaki Güvenlik Görevlisi)
const requireApiKey = (req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    if (!providedKey || providedKey !== process.env.SECRET_API_KEY) {
        return res.status(403).json({ error: "Erişim Reddedildi: Geçersiz veya eksik API Key!" });
    }
    next(); // Şifre doğruysa içeri al
};

const PORT = process.env.PORT || 3000;

// 🚪 1. KAPI: Manuel Görev Verme Kapısı (Eski kapımız, bozulmasın diye duruyor)
server.post("/api/analyze", async (req, res) => {
    try {
        const userTask = req.body.task;
        if (!userTask) return res.status(400).json({ error: "Lütfen bir 'task' belirtin." });
        
        const initialState = { task: userTask };
        const finalState = await app.invoke(initialState);
        
        res.json({
            success: true,
            fileSaved: finalState.fileSaved,
            finalReport: finalState.finalContent
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🚪 2. KAPI (YENİ): Dış Dünyadan Gelen E-postalar ve Mesajlar (Webhook)
server.post("/api/inbox", async (req, res) => {
    try {
        const customerMessage = req.body.message;
        if (!customerMessage) {
            return res.status(400).json({ error: "Lütfen bir 'message' (mesaj) gönderin." });
        }

        console.log(`\n📧 YENİ MESAJ GELDİ (Gelen Kutusu Webhook'u Tetiklendi)`);
        
        // 1. Aşama: Müşteri Botu (Ajan 6) mesajı okur ve niyetini anlar
        const leadAnalysis = await processIncomingMessage(customerMessage);

        // Eğer mesaj Spam veya sıradan bir Support ise, sistemi yormadan işlemi bitir.
        if (!leadAnalysis.isHotLead) {
            return res.json({
                success: true,
                status: "IGNORED",
                category: leadAnalysis.category,
                reason: leadAnalysis.analysis,
                message: "Mesaj filtrelendi. Orkestra çalıştırılmadı."
            });
        }

        // 2. Aşama: Eğer mesaj HOT LEAD (Sıcak Satış) ise Şefi Uyandır!
        console.log("\n🚀 SICAK MÜŞTERİ ONAYLANDI! ORKESTRA ŞEFİ UYANDIRILIYOR...");
        
        // Ajan 6'nın Şef için hazırladığı Almanca emri hafızaya veriyoruz
        const initialState = { 
            task: leadAnalysis.orchestratorTask 
        };
        
        const finalState = await app.invoke(initialState);
        
        console.log("\n✅ İŞLEM BİTTİ. DÖNGÜ TAMAMLANDI.");

        res.json({
            success: true,
            status: "HOT_LEAD_PROCESSED",
            category: leadAnalysis.category,
            leadAnalysis: leadAnalysis.analysis,
            generatedTask: leadAnalysis.orchestratorTask,
            fileSaved: finalState.fileSaved,
            finalReport: finalState.finalContent
        });

    } catch (error) {
        console.error("❌ Sunucu Hatası:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sunucuyu Başlat
server.listen(PORT, () => {
    console.log(`\n🌐 AI Orkestra Sunucusu Çalışıyor!`);
    console.log(`📡 Dinlenen Port: http://localhost:${PORT}`);
    console.log(`💡 Test için POST isteği bekliyor...`);
});