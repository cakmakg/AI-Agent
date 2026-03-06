/**
 * One-time script: Gmail OAuth2 refresh token alma
 * Kullanim: node scripts/get-gmail-token.js
 * Cikti:    GOOGLE_REFRESH_TOKEN=...   (bunu .env dosyasina ekle)
 */

import "dotenv/config";
import { google } from "googleapis";
import http from "http";
import { URL } from "url";


const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
];

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
});

console.log("\n=== Gmail OAuth2 Token Alma ===\n");
console.log("1. Su URL'yi tarayicinizda acin:\n");
console.log(authUrl);
console.log("\n2. Google hesabinizla giris yapin ve izin verin.");
console.log("3. Token otomatik alinacak...\n");

const server = http.createServer(async (req, res) => {
    try {
        const urlObj = new URL(req.url, "http://localhost:3000");
        if (urlObj.pathname !== "/oauth2callback") {
            res.writeHead(200);
            res.end("OAuth server hazir. Yetkilendirme bekleniyor...");
            return;
        }
        const code = urlObj.searchParams.get("code");
        if (!code) {
            res.writeHead(400);
            res.end("Kod alinamadi. Tekrar deneyin.");
            return;
        }

        const { tokens } = await oauth2Client.getToken(code);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>Token alindi! Bu pencereyi kapatabilirsiniz.</h1>");

        console.log("\n=== TOKEN ALINDI ===");
        console.log(".env dosyaniza su satiri ekleyin:\n");
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("\nAyrica Gmail adresinizi de ekleyin:");
        console.log("GMAIL_ADDRESS=senin@gmail.com\n");

        server.close();
        process.exit(0);
    } catch (err) {
        res.writeHead(500);
        res.end(`Hata: ${err.message}`);
        console.error("Token alma hatasi:", err.message);
        server.close();
        process.exit(1);
    }
});

server.listen(3000, () => {
    console.log("Yetkilendirme bekleniyor (http://localhost:3000/oauth2callback)...");
});
