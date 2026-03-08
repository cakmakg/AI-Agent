// ── Telegram Bot Service — 2-Way Chat ──
// Kullanicidan Telegram mesaji alir, AI Orchestra'ya isler, sonucu gonderir.

import { v4 as uuidv4 } from "uuid";
import { processIncomingMessage } from "../agents/customerBotAgent.js";
import { runHotLeadWorkflow } from "../workflows/runner.js";
import { agentEventBus } from "../workflows/runner.js";

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

    console.log(`\n📱 Telegram Bot: Mesaj alindi — "${text.substring(0, 80)}"`);

    // ── Komutlar ──
    if (text === "/start" || text === "/help") {
        await sendMessage(chatId,
            `🤖 *AI Orchestra Bot*\n\n` +
            `Herhangi bir mesaj gönder, AI Orchestra işlesin:\n\n` +
            `• *HOT LEAD* mesajları → Tam ajan workflow'u başlatır\n` +
            `• *Destek/fiyat* soruları → Taslak yanıt hazırlar\n` +
            `• Diğer → Filtrelenir\n\n` +
            `Komutlar:\n` +
            `/status — Sistem durumu\n` +
            `/help — Bu yardım mesajı`
        );
        return;
    }

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

    // ── Mesaji AI Orchestra'ya gonder ──
    await sendMessage(chatId, `⚡ Mesajınız alındı, analiz ediliyor...`);

    try {
        const analysis = await processIncomingMessage(text, "default", null);

        // SPAM / OTHER
        if (analysis.category === "SPAM" || analysis.category === "OTHER") {
            await sendMessage(chatId,
                `🚫 *Filtrelendi*\n\nMesaj SPAM veya genel içerik olarak değerlendirildi.\n\nBir iş görevi ya da destek talebi ile tekrar deneyin.`
            );
            return;
        }

        // DESTEK TALEBİ
        if (analysis.category === "SUPPORT_PRICING" || analysis.category === "SUPPORT_BUG") {
            const label = analysis.category === "SUPPORT_PRICING" ? "Fiyatlandırma" : "Hata Raporu";
            const draft = analysis.draftResponse || "Taslak yanıt oluşturulamadı.";

            await sendMessage(chatId,
                `📧 *${label} Talebi Tespit Edildi*\n\n` +
                `*Taslak Yanıt:*\n${draft.substring(0, 1500)}\n\n` +
                `_Onay için Cyber-Nexus Inbox'ı kontrol edin._`
            );
            return;
        }

        // HOT LEAD — workflow baslat
        if (analysis.category === "HOT_LEAD") {
            const threadId = uuidv4();
            await sendMessage(chatId,
                `🚀 *HOT LEAD Tespit Edildi!*\n\n` +
                `Görev: ${(analysis.orchestratorTask || text).substring(0, 300)}\n\n` +
                `Thread: \`${threadId.substring(0, 8)}...\`\n` +
                `Ajan ekibi devreye alınıyor...`
            );

            // Workflow'u arka planda baslat
            runHotLeadWorkflow(threadId, analysis.orchestratorTask, null)
                .catch(err => console.error("❌ Telegram HOT_LEAD workflow hatasi:", err.message));

            // Sonucu bekle ve gonder
            let settled = false;
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    agentEventBus.removeAllListeners(threadId);
                    sendMessage(chatId, `⏱️ Workflow tamamlanıyor, Cyber-Nexus UI üzerinden takip edebilirsiniz.`);
                }
            }, 8 * 60 * 1000); // 8 dakika timeout

            const listener = async (event) => {
                if (settled) return;

                if (event.type === "workflow_complete") {
                    settled = true;
                    clearTimeout(timeout);
                    agentEventBus.removeListener(threadId, listener);

                    const content = event.pendingContent || "";
                    const preview = content.substring(0, 1800);

                    await sendMessage(chatId,
                        `✅ *Workflow Tamamlandı!*\n\n` +
                        `${preview || "Rapor hazır — Cyber-Nexus Inbox'tan onaylayın."}\n\n` +
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
            return;
        }

        // Beklenmeyen kategori
        await sendMessage(chatId, `⚠️ Beklenmeyen analiz sonucu. Lütfen tekrar deneyin.`);

    } catch (err) {
        console.error("❌ Telegram Bot mesaj isleme hatasi:", err.message);
        await sendMessage(chatId, `❌ *İşlem Hatası*\n\n${err.message}\n\nSunucu loglarını kontrol edin.`);
    }
}

// ── Long Polling Loop ──
let pollingOffset = 0;
let isPolling = false;

async function pollOnce() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
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
