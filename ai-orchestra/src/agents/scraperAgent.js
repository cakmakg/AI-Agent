import { scrapeWebsiteContent } from "../tools/scraperTool.js";

export async function scraperNode(state) {
    console.log("🕵️ Veri Tarayıcı (Ajan 1) sahneye çıkıyor...");
    
    // Test için Hacker News veya kendi siteni verebilirsin
    const targetUrl = "https://news.ycombinator.com/"; 
    
    // Yazdığımız aracı (Tool) çağırıp internete bağlanıyoruz
    const rawData = await scrapeWebsiteContent(targetUrl);
    
    console.log("🕵️ Veri Tarayıcı: Veriyi aldım ve sistem hafızasına (State) kaydediyorum.");
    
    // LangGraph hafızasına veriyi yazıyoruz
    return { scrapedData: rawData };
}