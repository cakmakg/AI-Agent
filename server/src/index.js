
import cron from "node-cron";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { StateAnnotation } from "./state/graphState.js";

// 📡 SSE Event Bus — her threadId için agent geçişlerini yayar
const agentEventBus = new EventEmitter();
agentEventBus.setMaxListeners(50);

// 🗄️ Event Buffer — SSE bağlantısı kurulmadan önce gelen eventleri saklar
const eventBuffers = new Map(); // threadId → event[]

function emitToThread(threadId, event) {
    if (agentEventBus.listenerCount(threadId) === 0) {
        // Henüz dinleyici yok — buffer'a ekle
        if (!eventBuffers.has(threadId)) eventBuffers.set(threadId, []);
        eventBuffers.get(threadId).push(event);
    } else {
        agentEventBus.emit(threadId, event);
    }
    // Buffer 5 dakikadan uzun yaşamasın (bellek sızıntısı önlemi)
    setTimeout(() => eventBuffers.delete(threadId), 5 * 60 * 1000);
}

// Backend node adı → Frontend agent ID eşlemesi
const AGENT_UI_MAP = {
    orchestrator: "ceo",
    scraper: "scraper",
    analyzer: "analyst",
    writer: "writer",
    critic: "qa",
    fileSaver: null,
    human_approval: "hitl",
    publisher: "publisher",
    architect: "cto",
    __interrupt__: "hitl",   // LangGraph interrupt → HITL
};

import { Report } from "./models/Report.js";

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
const humanNode = () => {
    console.log("👨‍⚖️ Yargıç kararı bekleniyor... Sistem uykuya geçiyor.");
    return {};
};

// 🔄 HOT_LEAD workflow'unu arka planda çalıştır ve SSE ile olayları yay
async function runHotLeadWorkflow(threadId, task) {
    const config = { configurable: { thread_id: threadId }, recursionLimit: 100 };
    let interruptDetected = false;

    try {
        for await (const chunk of await app.stream({ task }, config)) {
            const nodeName = Object.keys(chunk)[0];
            const agentId = AGENT_UI_MAP[nodeName];
            console.log(`   📡 SSE → node: ${nodeName}, agentId: ${agentId ?? "none"}`);
            if (agentId) {
                emitToThread(threadId, { type: "agent_active", agent: agentId });
            }
            if (nodeName === "__interrupt__") {
                console.log(`   🛑 INTERRUPT detected — breaking stream loop`);
                interruptDetected = true;
                break;
            }
        }

        // --- Durum kontrolü ---
        const currentState = await app.getState(config);
        console.log(`   🔍 getState → next: [${currentState.next.join(", ")}], tasks: ${currentState.tasks?.length ?? 0}`);

        const awaitingHITL =
            interruptDetected ||
            currentState.next.includes("human_approval") ||
            currentState.next.length === 0 ||           // Interrupt sonrası next=[] olabilir
            currentState.tasks?.some(t => t.interrupts?.length > 0);

        console.log(`   🔍 awaitingHITL = ${awaitingHITL}`);

        if (awaitingHITL) {
            let pendingContent = currentState.values?.finalContent || "";

            // MongoDB fallback (CTO/architect blueprint akışları)
            if (!pendingContent) {
                try {
                    const report = await Report.findOne({ threadId }).sort({ createdAt: -1 });
                    if (report?.content) {
                        pendingContent = report.content;
                        console.log(`   📦 pendingContent MongoDB'den alındı (${pendingContent.length} chars)`);
                    }
                } catch (dbErr) {
                    console.warn("   ⚠️ MongoDB fallback başarısız:", dbErr.message);
                }
            }

            // Son çare: state'deki diğer alanlara bak
            if (!pendingContent) {
                pendingContent =
                    currentState.values?.blueprintContent ||
                    currentState.values?.blueprint ||
                    currentState.values?.draftReport ||
                    "*(Rapor hazır — 'Pull Latest Intel' butonuna tıklayın)*";
            }

            // ── MongoDB'ye kaydet (fileAgent çağrılmasa bile garantile) ──
            try {
                await Report.findOneAndUpdate(
                    { threadId },
                    {
                        threadId,
                        task: currentState.values?.task || task,
                        content: pendingContent,
                        status: "AWAITING_APPROVAL",
                    },
                    { upsert: true, new: true }
                );
                console.log(`   💾 MongoDB upsert OK — threadId: ${threadId}`);
            } catch (dbErr) {
                console.warn("   ⚠️ MongoDB upsert başarısız:", dbErr.message);
            }

            emitToThread(threadId, {
                type: "workflow_complete",
                status: "AWAITING_HUMAN_APPROVAL",
                pendingContent,
            });
            console.log(`   ✅ workflow_complete emitted (${pendingContent.length} chars)`);
        } else {
            console.log(`   ℹ️ Workflow tamamlandı (HITL değil)`);
        }
    } catch (err) {
        console.error("❌ runHotLeadWorkflow hatası:", err.message);
        emitToThread(threadId, { type: "error", message: err.message });
    }
}
// 📤 Publisher workflow’u — AUTHORIZE sonrası arka planda çalışır
async function runPublishWorkflow(threadId, feedbackNote) {
    const config = { configurable: { thread_id: threadId }, recursionLimit: 100 };
    try {
        console.log(`   📤 Publisher başladı — threadId: ${threadId}`);
        await app.invoke(null, config);
        await Report.findOneAndUpdate(
            { threadId },
            { status: "PUBLISHED", humanFeedback: feedbackNote || "" }
        );
        console.log(`   ✅ PUBLISHED — threadId: ${threadId}`);
    } catch (err) {
        console.error("❌ runPublishWorkflow hatası:", err.message);
        // Yine de MongoDB'yi güncelle
        await Report.findOneAndUpdate({ threadId }, { status: "PUBLISHED" }).catch(() => { });
    }
}

// ♻️ Revizyon workflow'u — OVERRIDE sonrası arka planda graph'ı devam ettirir
async function runRevisionWorkflow(threadId) {
    const config = { configurable: { thread_id: threadId }, recursionLimit: 100 };
    let interruptDetected = false;

    try {
        console.log(`   ♻️ Revizyon başladı — threadId: ${threadId}`);
        for await (const chunk of await app.stream(null, config)) {
            const nodeName = Object.keys(chunk)[0];
            const agentId = AGENT_UI_MAP[nodeName];
            console.log(`   📡 REV SSE → node: ${nodeName}, agentId: ${agentId ?? "none"}`);
            if (agentId) {
                emitToThread(threadId, { type: "agent_active", agent: agentId });
            }
            if (nodeName === "__interrupt__") {
                console.log(`   🛑 REV INTERRUPT — yeni revizyon hazır`);
                interruptDetected = true;
                break;
            }
        }

        const currentState = await app.getState(config);
        const awaitingHITL =
            interruptDetected ||
            currentState.next.includes("human_approval") ||
            currentState.tasks?.some(t => t.interrupts?.length > 0);

        if (awaitingHITL) {
            let pendingContent = currentState.values?.finalContent || "";
            if (!pendingContent) {
                const report = await Report.findOne({ threadId }).sort({ createdAt: -1 });
                if (report?.content) pendingContent = report.content;
            }
            if (!pendingContent) pendingContent = "*(Revizyon hazır — Pull Intel ile yükleyin)*";

            await Report.findOneAndUpdate(
                { threadId },
                { content: pendingContent, status: "AWAITING_APPROVAL" },
                { upsert: true, new: true }
            );

            emitToThread(threadId, {
                type: "workflow_complete",
                status: "AWAITING_HUMAN_APPROVAL",
                pendingContent,
            });
            console.log(`   ✅ REV workflow_complete emitted (${pendingContent.length} chars)`);
        }
    } catch (err) {
        console.error("❌ runRevisionWorkflow hatası:", err.message);
        emitToThread(threadId, { type: "error", message: "Revision failed: " + err.message });
    }
}

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

// 🚪 KAPI 0: SSE — Agent Durum Akışı
server.get("/api/events/:threadId", (req, res) => {
    const { threadId } = req.params;
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.write("\n"); // headers'ı flush et

    // Buffer'da bekleyen eventleri önce gönder
    const buffered = eventBuffers.get(threadId) || [];
    eventBuffers.delete(threadId);
    for (const event of buffered) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        // workflow_complete veya error buffer'da varsa bağlantıyı kapat
        if (event.type === "workflow_complete" || event.type === "error") {
            res.end();
            return;
        }
    }

    const listener = (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === "workflow_complete" || event.type === "error") {
            agentEventBus.removeListener(threadId, listener);
            res.end();
        }
    };

    agentEventBus.on(threadId, listener);
    req.on("close", () => agentEventBus.removeListener(threadId, listener));
});

// 🚪 KAPI 0.5a: En Son Bekleyen Raporu Çek (threadId bilmeden)
server.get("/api/artifact/latest", async (req, res) => {
    try {
        const report = await Report.findOne({ status: "AWAITING_APPROVAL" }).sort({ createdAt: -1 });
        if (!report) return res.status(404).json({ success: false, error: "No pending reports found." });
        res.json({ success: true, content: report.content, status: report.status, task: report.task, threadId: report.threadId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🚪 KAPI 0.5b: ThreadId ile Belirli Raporu Çek
server.get("/api/artifact/:threadId", async (req, res) => {
    try {
        const report = await Report.findOne({ threadId: req.params.threadId });
        if (!report) return res.status(404).json({ error: "Report not found." });
        res.json({ success: true, content: report.content, status: report.status, task: report.task, threadId: report.threadId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🚪 KAPI 0.7: Ar-Ge Radarı — Doğrudan INNOVATION_RADAR Tetikleyici
server.post("/api/rnd", (req, res) => {
    const threadId = "RND-" + uuidv4();
    const rndTask = "INNOVATION_RADAR: Recherchiere die allerneuesten Updates von Anthropic (Claude) und OpenAI für Entwickler von heute. Erstelle basierend auf diesen neuen Technologien einen Master Blueprint (.md), der erklärt, wie wir diese neuen KI-Features in unsere bestehende Architektur integrieren können.";
    runHotLeadWorkflow(threadId, rndTask).catch((err) =>
        console.error("❌ R&D API Hatası:", err.message)
    );
    return res.json({ success: true, status: "PROCESSING", threadId, source: "RND_TRIGGER" });
});

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

        // 🚀 SICAK SATIŞ DURUMU — workflow arka planda başlar, SSE ile takip edilir
        if (leadAnalysis.category === "HOT_LEAD") {
            const threadId = uuidv4();
            // Workflow'u fire-and-forget olarak başlat (await etme)
            runHotLeadWorkflow(threadId, leadAnalysis.orchestratorTask).catch((err) =>
                console.error("❌ HOT_LEAD workflow başlatma hatası:", err.message)
            );
            // threadId'yi hemen dön; ajanların durumu SSE üzerinden akar
            return res.json({ success: true, status: "PROCESSING", threadId });
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

        // 🎯 1. DURUM: DESTEK TALEBİ
        if (category === "SUPPORT_BUG" || category === "SUPPORT_PRICING") {
            if (isApproved) {
                console.log(`\n📧 [E-POSTA GÖNDERİLİYOR] → Konu: Destek Talebi Hk.`);
                console.log(`📝 İçerik: ${feedback || "Ajanın hazırladığı taslak başarıyla gönderildi."}`);
                return res.json({ success: true, status: "EMAIL_SENT", message: "Destek cevabı gönderildi!" });
            }
            return res.json({ success: true, status: "REJECTED", message: "Taslak reddedildi." });
        }

        // 🚀 2. DURUM: SATIŞ (HOT_LEAD) AKIŞİ
        const config = { configurable: { thread_id: threadId } };

        await app.updateState(config, {
            humanApproval: isApproved,
            humanFeedback: feedback || (isApproved ? "Onaylandı." : "Yeniden yaz.")
        });

        if (isApproved) {
            // AUTHORIZE: Hemen yanıt ver, publisher arka planda çalışsın
            runPublishWorkflow(threadId, feedback).catch(err =>
                console.error("❌ Publish background error:", err.message)
            );
            return res.json({ success: true, status: "PUBLISHED" });
        } else {
            // OVERRIDE: Hemen yanıt ver, revizyon arka planda çalışsın
            await Report.findOneAndUpdate(
                { threadId },
                { status: "REJECTED", humanFeedback: feedback || "" }
            );
            runRevisionWorkflow(threadId).catch(err =>
                console.error("❌ Revision background error:", err.message)
            );
            return res.json({ success: true, status: "REVISED" });
        }

    } catch (error) {
        console.error("❌ /api/approve hatası:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

server.listen(PORT, () => {
    console.log(`\n🌐 AI Orkestra Sunucusu Çalışıyor!`);
    console.log(`📡 Port: http://localhost:${PORT}`);
});
// ==========================================
// 🔬 AR-GE (R&D) DEPARTMANI — PROAKTİF MOTOR
// ==========================================
// Üretim: "0 8 * * *"  → Her sabah 08:00'de çalışır
// Test   : "*/2 * * * *" → Her 2 dakikada bir çalışır
cron.schedule("0 8 * * *", () => {
    const threadId = "RND-" + Date.now();
    console.log(`\n⏰ [AR-GE ALARMI ÇALDI] Teknoloji Radarı uyandı! threadId: ${threadId}`);
    console.log("🕵️‍♂️ İnternetteki en yeni yapay zeka gelişmeleri taranıyor...\n");

    const rndTask = "INNOVATION_RADAR: Recherchiere die allerneuesten Updates von Anthropic (Claude) und OpenAI für Entwickler von heute. Erstelle basierend auf diesen neuen Technologien einen Master Blueprint (.md), der erklärt, wie wir diese neuen KI-Features in unsere bestehende Architektur integrieren können.";

    runHotLeadWorkflow(threadId, rndTask).catch((err) =>
        console.error("❌ R&D Cron Hatası:", err.message)
    );
});