import mongoose from "mongoose";

const KnowledgeSchema = new mongoose.Schema(
    {
        clientId: {
            type: String,
            required: true,
            index: true, // Kritik: başka müşterinin verisini başkası görmesin
        },
        title: {
            type: String,
            required: true, // Örn: "Diş Kliniği Fiyat Listesi"
        },
        content: {
            type: String,
            required: true, // İlgili paragrafın orijinal metin hali
        },
        embedding: {
            type: [Number], // Metnin 1536 boyutlu yapay zeka vektör karşılığı
            required: true,
        },
        metadata: {
            type: Object, // Hangi dosya, sayfa numarası vb. ek bilgiler
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

export const Knowledge = mongoose.model("Knowledge", KnowledgeSchema);
