/**
 * Google Sheets CRM Service
 * HOT_LEAD'leri otomatik olarak bir Google Sheet'e kaydeder.
 *
 * Gerekli .env değişkenleri:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (Gmail ile aynı OAuth2)
 *   GOOGLE_SHEETS_ID  — Sheet URL'sindeki spreadsheetId
 *
 * Sheet sütun düzeni (ilk satır başlık olmalı):
 *   Tarih | Saat | Kaynak | Kimden | Konu | Özet | Thread ID | Durum
 */

import { google } from "googleapis";

const SHEET_NAME = "HOT_LEADS";

function getOAuth2Client() {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:3000/oauth2callback"
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return client;
}

/**
 * HOT_LEAD verisini Google Sheet'e yeni satır olarak ekler.
 *
 * @param {Object} lead
 * @param {string} lead.source     - Kaynak: "gmail" | "n8n" | "operator" | "telegram"
 * @param {string} lead.from       - Gönderen (email veya kullanıcı adı)
 * @param {string} lead.subject    - Konu / görev özeti
 * @param {string} lead.summary    - AI analiz özeti
 * @param {string} lead.threadId   - LangGraph thread ID
 */
export async function appendHotLead({ source = "", from = "", subject = "", summary = "", threadId = "" }) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
        console.warn("   ⚠️ [Sheets] GOOGLE_SHEETS_ID tanımlı değil — HOT_LEAD kaydedilmedi.");
        return;
    }

    try {
        const auth = getOAuth2Client();
        const sheets = google.sheets({ version: "v4", auth });

        const now = new Date();
        const date = now.toLocaleDateString("tr-TR");
        const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

        const row = [date, time, source, from, subject.slice(0, 200), summary.slice(0, 500), threadId, "YENİ"];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${SHEET_NAME}!A:H`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: [row] },
        });

        console.log(`   📊 [Sheets] HOT_LEAD kaydedildi → ${from} | threadId: ${threadId}`);
    } catch (err) {
        console.error(`   ❌ [Sheets] Kayıt hatası: ${err.message}`);
    }
}
