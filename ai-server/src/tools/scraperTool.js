import axios from "axios";
import * as cheerio from "cheerio";

// Bu fonksiyon, 1. Ajanımızın (Veri Tarayıcı) internete uzanan elidir.
export async function scrapeWebsiteContent(url) {
    console.log(`\n🕵️ [Sistem Aracı] ${url} adresine gidiliyor...`);
    
    try {
        // 1. Web sitesine HTTP isteği atıyoruz
        const response = await axios.get(url);
        
        // 2. Gelen karmaşık HTML kodunu Cheerio ile yüklüyoruz
        const $ = cheerio.load(response.data);
        
        // 3. Sitedeki gereksiz şeyleri (reklamlar, scriptler, menüler) temizliyoruz
        $('script, style, nav, footer, header, aside').remove();
        
        // 4. Sadece ana metni alıp temizliyoruz
        const rawText = $('body').text();
        const cleanText = rawText.replace(/\s+/g, ' ').trim().substring(0, 1500); // Token tasarrufu için ilk 1500 karakter
        
        console.log(`✅ [Sistem Aracı] Veri başarıyla çekildi! (${cleanText.length} karakter)`);
        return cleanText;
        
    } catch (error) {
        console.error(`❌ [Sistem Aracı] Web sitesine ulaşılamadı: ${error.message}`);
        return "Veri çekilemedi. Site engellemiş olabilir.";
    }
}