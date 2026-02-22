import { ChatBedrockConverse } from "@langchain/aws";

// Ajan 3'ün Beyni (Maliyet optimizasyonu için Haiku kullanıyoruz)
const llm = new ChatBedrockConverse({
    model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0", 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export async function writerNode(state) {
    let prompt = "";

    // EĞER ELEŞTİRMENDEN BİR FIRÇA (GERİ BİLDİRİM) GELDİYSE:
    if (state.criticFeedback) {
        console.log("✍️ İçerik Üretici (Ajan 3): Eleştirmenden red yedik! Metin geri bildirime göre düzeltiliyor...");
        
        prompt = `Sie sind ein erfahrener Corporate Communications Specialist. 
        Ihr vorheriger Entwurf wurde vom Quality Assurance Manager (Qualitätsprüfer) abgelehnt.
        
        Hier ist das Feedback des Managers (Was Sie zwingend korrigieren müssen):
        ---
        ${state.criticFeedback}
        ---
        
        Hier ist Ihr vorheriger fehlerhafter Entwurf:
        ---
        ${state.finalContent}
        ---
        
        Bitte überarbeiten und korrigieren Sie den Text basierend auf dem Feedback.
        
        Regeln:
        1. Verwenden Sie ein sehr professionelles Business-Deutsch.
        2. Nutzen Sie Markdown-Formatierungen.
        3. Fügen Sie eine formelle Begrüßung ("Sehr geehrte Geschäftsführung,") und Verabschiedung hinzu.
        4. Geben Sie NUR den endgültigen, korrigierten Bericht aus. Keine Erklärungen.`;

    } 
    // EĞER İLK YAZIM AŞAMASIYSA (HENÜZ ELEŞTİRİ YOKSA):
    else {
        console.log("✍️ İçerik Üretici (Ajan 3) devrede. Rapor ilk kez Almanca metne dökülüyor...");
        
        prompt = `Sie sind ein erfahrener Corporate Communications Specialist und Copywriter. 
        Unten finden Sie einen strategischen Bericht, der von unserem Datenanalysten erstellt wurde. 
        Ihre Aufgabe ist es, diesen Bericht in einen professionellen, eleganten Newsletter / eine E-Mail im Markdown-Format (.md) für das Top-Management des Unternehmens umzuwandeln.

        Regeln:
        1. Verwenden Sie ein sehr professionelles Business-Deutsch (formelle Anrede "Sie").
        2. Nutzen Sie Markdown-Formatierungen (Überschriften, Aufzählungen, fette Texte), um das Lesen zu erleichtern.
        3. Fügen Sie eine formelle Begrüßung (z.B. "Sehr geehrte Geschäftsführung,") und eine professionelle Verabschiedung hinzu.
        4. Geben Sie NUR den endgültigen Bericht aus. Keine einleitenden Sätze oder Erklärungen.

        Hier ist der Analysebericht:
        ${state.analysisReport}`;
    }

    // AWS Bedrock'a (Haiku) metni yazdırıyoruz
    const response = await llm.invoke(prompt);

    console.log("✅ İçerik Üretici: Deutscher Text ist fertig! (Almanca metin hazır!)");
    
    // YENİ DÖNGÜ KURALI: 
    // Metni güncelliyoruz VE eleştiri notunu 'null' (boş) yapıyoruz ki Şef metni tekrar Eleştirmene yollasın!
    return { 
        finalContent: response.content,
        criticFeedback: null 
    };
}