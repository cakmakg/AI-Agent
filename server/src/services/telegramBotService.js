// ── Telegram Bot Service — 2-Way Chat ──
// Kullanicidan Telegram mesaji alir, AI Orchestra'ya isler, sonucu gonderir.

import { v4 as uuidv4 } from "uuid";
import { runHotLeadWorkflow, agentEventBus } from "../workflows/runner.js";

const getBaseUrl = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ── Mesaj gonder ──
async function sendMessage(chatId, text, extra = {}) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.includes("BURAYA")) return;

    try {
        await fetch(`${getBaseUrl()}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: text.substring(0, 4096), // Telegram limit
                parse_mode: "Markdown",
                ...extra,
            }),
        });
    } catch (err) {
        console.error("❌ Telegram mesaj gonderme hatasi:", err.message);
    }
}

// ── Workflow başlat ve sonucu Telegram'a gönder ──
async function launchWorkflowAndNotify(chatId, threadId, task) {
    runHotLeadWorkflow(threadId, task, null)
        .catch(err => console.error("❌ Telegram workflow hatasi:", err.message));

    let settled = false;
    const timeout = setTimeout(() => {
        if (!settled) {
            settled = true;
            agentEventBus.removeAllListeners(threadId);
            sendMessage(chatId, `⏱️ Workflow sürüyor — Cyber-Nexus UI üzerinden takip edebilirsiniz.`);
        }
    }, 8 * 60 * 1000);

    const listener = async (event) => {
        if (settled) return;

        if (event.type === "workflow_complete") {
            settled = true;
            clearTimeout(timeout);
            agentEventBus.removeListener(threadId, listener);
            const content = event.pendingContent || "";
            await sendMessage(chatId,
                `✅ *Workflow Tamamlandı!*\n\n` +
                `${content.substring(0, 1800) || "Rapor hazır."}\n\n` +
                `_HITL onayı için Inbox'ı kontrol edin._`
            );
        }

        if (event.type === "error") {
            settled = true;
            clearTimeout(timeout);
            agentEventBus.removeListener(threadId, listener);
            await sendMessage(chatId, `❌ *Workflow Hatası*\n\n${event.message || "Bilinmeyen hata."}`);
        }
    };

    agentEventBus.on(threadId, listener);
}

// ── Gelen mesaji isle ──
async function handleMessage(message) {
    const chatId = String(message.chat.id);
    const allowedChatId = String(process.env.TELEGRAM_CHAT_ID ?? "").trim();

    // Sadece yetkili chat'e cevap ver
    if (!allowedChatId || chatId !== allowedChatId) {
        console.log(`⚠️ Telegram Bot: Yetkisiz chat ID — ${chatId} (beklenen: ${allowedChatId})`);
        await sendMessage(chatId, "⛔ Bu bot yetkisiz erişime kapalıdır.");
        return;
    }

    const text = (message.text || "").trim();
    if (!text) return;

    console.log(`\n📱 Telegram Bot: Patron komutu alindi — "${text.substring(0, 80)}"`);

    // ── /start veya /help ──
    if (text === "/start" || text === "/help") {
        await sendMessage(chatId,
            `🤖 *AI Orchestra — Patron Modu*\n\n` +
            `Herhangi bir görevi yaz, AI ekibi devreye girer:\n\n` +
            `Örnekler:\n` +
            `• _"SaaS startup için pazar giriş stratejisi"_\n` +
            `• _"Next.js e-commerce mimarisi çiz"_\n` +
            `• _"Rakip analizi raporu hazırla"_\n\n` +
            `Komutlar:\n` +
            `/status — Sistem durumu\n` +
            `/rnd — R&D / İnovasyon Radar başlat\n` +
            `/help — Bu yardım mesajı`
        );
        return;
    }

    // ── /status ──
    if (text === "/status") {
        await sendMessage(chatId,
            `✅ *AI Orchestra Aktif*\n\n` +
            `• Sunucu: ONLINE\n` +
            `• Ajan Sayısı: 11\n` +
            `• HITL Gate: ARMED\n` +
            `• Kanal: Telegram (${chatId})`
        );
        return;
    }

    // ── /rnd — R&D Radar ──
    if (text === "/rnd") {
        const threadId = uuidv4();
        const rndTask = "INNOVATION_RADAR: Scan the latest updates from Anthropic (Claude) and OpenAI for developers. Create a Master Blueprint (.md) showing how to integrate these new AI features into our existing architecture.";
        await sendMessage(chatId,
            `🔬 *R&D Radar Başlatıldı!*\n\n` +
            `Thread: \`${threadId.substring(0, 8)}...\`\n` +
            `Anthropic & OpenAI feed'leri taranıyor...`
        );
        await launchWorkflowAndNotify(chatId, threadId, rndTask);
        return;
    }

    // ── Görev komutu — doğrudan HOT_LEAD olarak işle ──
    // (customerBotAgent bypass edilir — Patron yetkilendirilmiş tek kullanıcıdır)
    const threadId = uuidv4();
    await sendMessage(chatId,
        `🚀 *Görev Alındı!*\n\n` +
        `📋 _${text.substring(0, 300)}_\n\n` +
        `Thread: \`${threadId.substring(0, 8)}...\`\n` +
        `Ajan ekibi devreye alınıyor...`
    );

    console.log(`🔥 Telegram Patron Görevi → HOT_LEAD: "${text.substring(0, 80)}"`);
    await launchWorkflowAndNotify(chatId, threadId, text);
}

// ── Long Polling Loop ──
let pollingOffset = 0;
let isPolling = false;

async function pollOnce() {
    try {
        const res = await fetch(
            `${getBaseUrl()}/getUpdates?offset=${pollingOffset}&timeout=25&allowed_updates=["message"]`,
            { signal: AbortSignal.timeout(30_000) }
        );

        if (!res.ok) {
            console.error(`❌ Telegram polling HTTP ${res.status}`);
            return;
        }

        const data = await res.json();
        if (!data.ok) {
            console.error("❌ Telegram API hatasi:", data.description);
            return;
        }

        for (const update of data.result ?? []) {
            pollingOffset = update.update_id + 1;
            if (update.message) {
                // Mesajlari sirali isle (await)
                await handleMessage(update.message).catch(err =>
                    console.error("❌ Telegram mesaj isleme hatasi:", err.message)
                );
            }
        }
    } catch (err) {
        if (err.name !== "AbortError") {
            console.error("❌ Telegram polling hatasi:", err.message);
        }
    }
}

export async function startTelegramBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || token.includes("BURAYA") || !chatId || chatId.includes("BURAYA")) {
        console.log("⚠️ Telegram Bot: .env ayarlari eksik (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID) — bot baslatilmadi.");
        return;
    }

    if (isPolling) return;
    isPolling = true;

    console.log(`\n📱 Telegram Bot: 2-way chat baslatildi (Chat ID: ${chatId})`);

    // Bildirim gonder
    await sendMessage(chatId, `🟢 *AI Orchestra Bot Aktif*\n\nSistem hazır. Bir görev girmek için mesaj yaz.\n\n/help — Kullanım kılavuzu`).catch(() => {});

    // Polling loop
    const loop = async () => {
        if (!isPolling) return;
        await pollOnce();
        // Kisa bir gecikmeyle tekrar dene
        setTimeout(loop, 1000);
    };

    loop();
}

export function stopTelegramBot() {
    isPolling = false;
}
