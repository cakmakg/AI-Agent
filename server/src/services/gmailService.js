/**
 * Gmail Service — OAuth2 ile mail okuma, gonderme ve isaretleme
 * Gerekli .env degiskenleri:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_ADDRESS
 */

import { google } from "googleapis";

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
 * Inbox'taki okunmamis mailleri ceker (max 15 adet)
 * @returns {{ messageId, gmailThreadId, from, subject, body }[]}
 */
export async function fetchUnreadEmails() {
    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth });

    const listRes = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread in:inbox",
        maxResults: 15,
    });

    const messages = listRes.data.messages || [];
    const emails = [];

    for (const msg of messages) {
        try {
            const detail = await gmail.users.messages.get({
                userId: "me",
                id: msg.id,
                format: "full",
            });

            const headers = detail.data.payload?.headers || [];
            const from    = headers.find(h => h.name === "From")?.value    || "";
            const subject = headers.find(h => h.name === "Subject")?.value || "(no subject)";

            // Plain-text body cikart
            let body = "";
            const parts = detail.data.payload?.parts || [];

            if (parts.length > 0) {
                const textPart = parts.find(p => p.mimeType === "text/plain");
                if (textPart?.body?.data) {
                    body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
                } else {
                    // HTML fallback — HTML tagleri temizle
                    const htmlPart = parts.find(p => p.mimeType === "text/html");
                    if (htmlPart?.body?.data) {
                        body = Buffer.from(htmlPart.body.data, "base64")
                            .toString("utf-8")
                            .replace(/<[^>]+>/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();
                    }
                }
            } else if (detail.data.payload?.body?.data) {
                body = Buffer.from(detail.data.payload.body.data, "base64").toString("utf-8");
            }

            if (!body.trim()) {
                console.warn(`   ⚠️ Gmail: Bos body (messageId: ${msg.id}) — atlaniyor`);
                continue;
            }

            emails.push({
                messageId:    msg.id,
                gmailThreadId: detail.data.threadId,
                from,
                subject,
                body: body.trim().slice(0, 4000), // LLM token limiti icin
            });
        } catch (err) {
            console.warn(`   ⚠️ Gmail mesaj detayi alinamadi (${msg.id}): ${err.message}`);
        }
    }

    return emails;
}

/**
 * Maili okundu olarak isaretler
 * @param {string} messageId
 */
export async function markAsRead(messageId) {
    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: { removeLabelIds: ["UNREAD"] },
    });
}

/**
 * Gmail thread'ine yanit gonderir
 * @param {string} gmailThreadId  - Gmail thread ID (ayni zincirde gozukur)
 * @param {string} to             - Alici email adresi
 * @param {string} subject        - Konu (Re: otomatik eklenir)
 * @param {string} body           - Duzenlu metin icerigi
 */
export async function sendReply(gmailThreadId, to, subject, body) {
    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth });

    const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
    const fromAddress  = process.env.GMAIL_ADDRESS || "me";

    const rawMessage = [
        `From: ${fromAddress}`,
        `To: ${to}`,
        `Subject: ${replySubject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        body,
    ].join("\r\n");

    const encodedMessage = Buffer.from(rawMessage).toString("base64url");

    await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage,
            threadId: gmailThreadId,
        },
    });

    console.log(`   📧 Gmail yanit gonderildi → ${to} | Konu: ${replySubject}`);
}
