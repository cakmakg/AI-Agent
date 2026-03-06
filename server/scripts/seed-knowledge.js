import mongoose from "mongoose";
import "dotenv/config";
import { addKnowledgeToDB } from "../src/services/ragService.js";

async function runTest() {
    try {
        console.log("🔌 MongoDB'ye baglaniliyor...");
        await mongoose.connect(process.env.MONGODB);
        console.log("🟢 Baglanti Basarili!");

        console.log("🧠 Test verisi vektorlestiriliyor...");

        // Ajan 6 icin ornek tenantId: "test-klinik-123"
        await addKnowledgeToDB(
            "test-klinik-123",
            "Gulus Dis Klinigi Fiyat Listesi ve Kurallar",
            "Gulus Dis Klinigi calisma saatleri: Hafta ici 09:00 - 18:00 arasidir. Hafta sonlari (Cumartesi ve Pazar) kesinlikle kapaliyiz. 2024 Guncel Fiyat Listesi: Kanal tedavisi 3000 TL, Dis beyazlatma 1500 TL, Implant 8000 TL'dir. Musteri cok israr ederse maksimum %10 indirim yapma yetkiniz vardir."
        );

        console.log("✅ GOREV TAMAM! Veri basariyla yapay zekanin beynine kazindi.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Hata:", error.message);
        process.exit(1);
    }
}

runTest();
