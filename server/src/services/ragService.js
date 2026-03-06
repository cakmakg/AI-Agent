import { OpenAIEmbeddings } from "@langchain/openai";
import { Knowledge } from "../models/Knowledge.js";
import * as cheerio from "cheerio";
import https from "https";
import http from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// OpenAI'ın en yeni, en ucuz ve en akıllı embedding modeli
const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
});

// ── 1. Text Chunking ──────────────────────────────────────────────────────────
/**
 * Büyük metni 500 kelimelik örtüşen parçalara böler.
 * Örtüşme (overlap): sonraki chunk 50 kelime geri adım atar → bağlam kaybı önlenir.
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks = [];
    let i = 0;
    while (i < words.length) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
        i += chunkSize - overlap;
    }
    return chunks;
}

// ── 2. Core: Tek chunk'ı vektörleştirip kaydet ───────────────────────────────
async function saveChunk(clientId, title, text, metadata = {}) {
    const vector = await embeddings.embedQuery(text);
    const doc = new Knowledge({
        clientId,
        title,
        content: text,
        embedding: vector,
        metadata: { wordCount: text.split(/\s+/).length, ...metadata },
    });
    await doc.save();
    return doc;
}

// ── 3. Manuel Metin → Chunk → Kaydet ─────────────────────────────────────────
/**
 * Kısa metin (< 500 kelime): tek chunk.
 * Uzun metin: otomatik chunking.
 */
export async function addKnowledgeToDB(clientId, title, textContent) {
    console.log(`🧠 [RAG] "${title}" işleniyor...`);
    const words = textContent.split(/\s+/).length;
    let saved = 0;

    if (words <= 500) {
        await saveChunk(clientId, title, textContent);
        saved = 1;
    } else {
        const chunks = chunkText(textContent);
        for (let i = 0; i < chunks.length; i++) {
            await saveChunk(clientId, `${title} (${i + 1}/${chunks.length})`, chunks[i], { chunkIndex: i });
        }
        saved = chunks.length;
    }

    console.log(`✅ [RAG] ${saved} chunk kaydedildi — clientId: "${clientId}"`);
    return { saved };
}

// ── 4. PDF Upload → Parse → Chunk → Kaydet ───────────────────────────────────
/**
 * @param {Buffer} fileBuffer - multer'dan gelen buffer
 * @param {string} fileName - orijinal dosya adı
 * @param {string} clientId
 */
export async function addPdfToKnowledge(clientId, fileName, fileBuffer) {
    console.log(`📄 [RAG] PDF işleniyor: "${fileName}"`);

    const parsed = await pdfParse(fileBuffer);
    const rawText = parsed.text.replace(/\s+/g, " ").trim();

    if (!rawText) throw new Error("PDF'den metin çıkarılamadı.");

    console.log(`   📝 ${rawText.split(/\s+/).length} kelime çıkarıldı.`);

    const chunks = chunkText(rawText);
    for (let i = 0; i < chunks.length; i++) {
        await saveChunk(
            clientId,
            `${fileName} (${i + 1}/${chunks.length})`,
            chunks[i],
            { sourceFile: fileName, chunkIndex: i, pageCount: parsed.numpages }
        );
    }

    console.log(`✅ [RAG] PDF → ${chunks.length} chunk kaydedildi.`);
    return { saved: chunks.length, pages: parsed.numpages, words: rawText.split(/\s+/).length };
}

// ── 5. URL Scrape → Parse → Chunk → Kaydet ───────────────────────────────────
/**
 * @param {string} url - Taranacak web sitesi
 * @param {string} clientId
 */
export async function addUrlToKnowledge(clientId, url) {
    console.log(`🌐 [RAG] URL taraniyor: "${url}"`);

    const html = await fetchUrl(url);
    const $ = cheerio.load(html);

    // Gereksiz elemanları kaldır
    $("script, style, nav, footer, header, iframe, noscript, [aria-hidden='true']").remove();

    // Ana içerik alanlarını hedef al, yoksa body
    const mainText = ($("main, article, .content, #content, .post-content").first().text() || $("body").text())
        .replace(/\s+/g, " ")
        .trim();

    if (!mainText || mainText.length < 100) {
        throw new Error("URL'den yeterli metin çıkarılamadı.");
    }

    const domain = new URL(url).hostname;
    console.log(`   📝 ${mainText.split(/\s+/).length} kelime çıkarıldı (${domain})`);

    const chunks = chunkText(mainText);
    for (let i = 0; i < chunks.length; i++) {
        await saveChunk(
            clientId,
            `${domain} (${i + 1}/${chunks.length})`,
            chunks[i],
            { sourceUrl: url, chunkIndex: i }
        );
    }

    console.log(`✅ [RAG] URL → ${chunks.length} chunk kaydedildi.`);
    return { saved: chunks.length, words: mainText.split(/\s+/).length, domain };
}

// ── 6. Semantic Search (MongoDB Atlas Vector Search) ─────────────────────────
/**
 * Müşterinin sorusuna en uygun bilgileri Vektör Veritabanından (RAG) bulup getirir.
 * @param {string} clientId - Hangi müşterinin verisinde arama yapılacak? (Veri sızıntısını önler)
 * @param {string} query - Ajanın aradığı soru (Örn: "Kanal tedavisi fiyatı nedir?")
 * @returns {string} - Bulunan bilgilerin birleştirilmiş metin hali
 */
export async function searchKnowledge(clientId, query) {
    try {
        console.log(`🔍 [RAG] "${clientId}" için şu soru aranıyor: "${query}"`);

        // 1. Ajanın sorusunu Vektöre (Matematiğe) çevir
        const queryVector = await embeddings.embedQuery(query);

        // 2. MongoDB'de o meşhur "vector_index" gözlüğü ile arama yap!
        const results = await Knowledge.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // Atlas'ta az önce yarattığın ismin aynısı!
                    path: "embedding",     // Vektörlerin olduğu sütun
                    queryVector: queryVector,
                    numCandidates: 100,    // MongoDB'nin tarayacağı aday sayısı
                    limit: 3,              // En alakalı ilk 3 paragrafı getir
                    filter: { clientId: clientId } // ⚠️ GÜVENLİK DUVARI: Sadece bu müşterinin verilerini ara!
                }
            },
            {
                // Sadece işimize yarayan kısımları al (Vektör sayılarını geri indirme, çok yer kaplar)
                $project: {
                    title: 1,
                    content: 1,
                    score: { $meta: "vectorSearchScore" } // Alakalılık puanı (Örn: %95 eşleşme)
                }
            }
        ]);

        if (results.length === 0) {
            return "Bu konu hakkında bilgi tabanında (Knowledge Base) kayıtlı bir veri bulunamadı.";
        }

        // Bulunan sonuçları tek bir metin halinde birleştir ve ajana ver
        const combinedKnowledge = results.map(r => `[Kaynak: ${r.title}] ${r.content}`).join("\n\n");

        console.log(`✅ [RAG] ${results.length} adet alakalı bilgi bulundu!`);
        return combinedKnowledge;

    } catch (error) {
        console.error("❌ [RAG] Arama sırasında hata:", error.message);
        return "Bilgi tabanına şu an ulaşılamıyor.";
    }
}

// ── 7. List & Delete ──────────────────────────────────────────────────────────
export async function listKnowledge(clientId) {
    return Knowledge.find({ clientId }, { embedding: 0 }).sort({ createdAt: -1 }).lean();
}

export async function deleteKnowledge(id, clientId) {
    return Knowledge.deleteOne({ _id: id, clientId });
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;
        client.get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RAG-Bot/1.0)" } }, (res) => {
            // Redirect takibi
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
            }
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => resolve(data));
        }).on("error", reject);
    });
}
