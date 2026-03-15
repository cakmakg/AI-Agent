/**
 * Ajan 11 — "The Visionary" (Yaratıcı / Şeytanın Avukatı)
 *
 * Görev: Analyzer'ın "mantıklı" 3 aksiyonunu okur ve herkesin gözden
 * kaçırdığı, riskli ama 10x getirili 4. çılgın yolu üretir.
 * Aykırı düşünce, Writer'ın raporuna "Vizyoner Alternatif" bölümü olarak eklenir.
 *
 * Akış: analyzer → innovator → writer
 */

import { ChatBedrockConverse } from "@langchain/aws";
import { trackLLMCost } from "../services/costTracker.js";

const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export async function innovatorNode(state) {
    console.log("💡 Vizyoner (Ajan 11) sahneye çıkıyor — kuralları yıkıyor...");

    const prompt = `Du bist "The Visionary" — ein Devil's Advocate, Querdenker und Entdecker verborgener Chancen.

Deine Aufgabe: Lies die 3 sicheren, "vernünftigen" Aktionen der Standard-Analyse unten. LEHNE SIE AB.
Entwickle dann den 4. Weg — den, den ein gewöhnlicher Berater niemals vorschlagen würde.

REGELN:
1. Wiederhole nicht die Wege des Analysten. Bezeichne sie als "vorhersehbar" und geh weiter.
2. Identifiziere die ECHTE verborgene Chance oder das übersehene Risiko im Kontext.
3. Denk umgekehrt: "Alle machen A. Was passiert, wenn wir stattdessen Z machen?"
4. Sei konkret — kein vages "disruptives Denken", sondern 1 mutiger, umsetzbarer Schritt.
5. Maximal 4 Absätze. Scharf, prägnant, pointiert.
6. Beende mit einer einzigen "10x-Wette": Warum ist dieser unkonventionelle Weg wertvoller als die anderen?
7. Antworte ausschliesslich auf Deutsch.

Aufgabenkontext:
${state.task}

Die 3 Wege des Standard-Analysten:
${state.analysisReport}`;

    const response = await llm.invoke(prompt);

    trackLLMCost(
        response.usage_metadata?.input_tokens || 0,
        response.usage_metadata?.output_tokens || 0,
        "INNOVATOR", state.threadId || "SYSTEM", "default",
        "eu.anthropic.claude-sonnet-4-5-20250929-v1:0"
    ).catch(() => {});

    console.log("🔥 Vizyoner: Aykırı alternatif üretildi — Writer bekliyor.");

    return { innovatorInsight: response.content };
}
