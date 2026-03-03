import { Report } from "../models/Report.js";

export async function fileNode(state, config) {
    const threadId = config?.configurable?.thread_id;
    console.log(`💾 Dosya Ajanı (Ajan 4) devrede. İçerik MongoDB'ye kaydediliyor... (threadId: ${threadId})`);

    try {
        await Report.findOneAndUpdate(
            { threadId },
            {
                threadId,
                task: state.task,
                content: state.finalContent,
                status: "AWAITING_APPROVAL",
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Dosya Ajanı: İçerik MongoDB'ye kaydedildi (threadId: ${threadId})`);
        return { fileSaved: true };

    } catch (error) {
        console.error(`❌ Dosya Ajanı Hatası: MongoDB kaydı başarısız! Detay: ${error.message}`);
        return { fileSaved: false };
    }
}
