import fs from 'fs/promises';
import path from 'path';

export async function fileNode(state) {
    console.log("💾 Dosya Ajanı (Ajan 4) devrede. İçerik diske kaydediliyor...");

    try {
        // Proje ana dizininde 'output' adında bir klasör yolu belirliyoruz
        const outputDir = "output";
        
        // Klasör yoksa Node.js bizim için otomatik oluşturacak
        await fs.mkdir(outputDir, { recursive: true });

        // Dosya çakışmasını önlemek için ismin sonuna zaman damgası (timestamp) ekliyoruz
        const fileName = `strateji_raporu_${Date.now()}.md`;
        const filePath = path.join(outputDir, fileName);

        // Ajan 3'ün ürettiği 'finalContent'i Markdown (.md) dosyası olarak kaydediyoruz
        await fs.writeFile(filePath, state.finalContent, 'utf-8');

        console.log(`✅ Dosya Ajanı: Şaheser başarıyla '${filePath}' konumuna kaydedildi!`);

        // Sisteme (Şefe) dosyanın başarıyla kaydedildiğini bildiriyoruz
        return { fileSaved: true };

    } catch (error) {
        console.error(`❌ Dosya Ajanı Hatası: Kayıt yapılamadı! Detay: ${error.message}`);
        return { fileSaved: false };
    }
}