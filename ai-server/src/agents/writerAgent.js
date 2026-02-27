import { ChatBedrockConverse } from "@langchain/aws";

// Ajan 3'ün Beyni (Kalite için Sonnet kullanıyoruz)
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
        
        prompt = `Sie sind ein erfahrener Senior IT Consultant und Pre-Sales Architect. 
        Ihr vorheriger Entwurf eines IT-Consulting-Pitches wurde vom Quality Assurance Manager (Qualitätsprüfer) abgelehnt.
        
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
        1. Verwenden Sie ein sehr professionelles B2B Business-Deutsch.
        2. Behalten Sie zwingend die strukturierte IT-Consulting-Form bei (Management Summary, IST-Analyse, SOLL-Konzept, Roadmap).
        3. Nutzen Sie Markdown-Formatierungen.
        4. Fügen Sie eine formelle Begrüßung (z.B. "Sehr geehrte Damen und Herren,") und Verabschiedung hinzu.
        5. Geben Sie NUR den endgültigen, korrigierten Bericht aus. Keine Erklärungen.`;

    } 
    // EĞER İLK YAZIM AŞAMASIYSA (HENÜZ ELEŞTİRİ YOKSA):
    else {
        console.log("✍️ İçerik Üretici (Ajan 3) devrede. Rapor ilk kez B2B IT formatında Almanca metne dökülüyor...");
        
        prompt = `Sie sind ein erfahrener Senior IT Consultant und Pre-Sales Architect in Deutschland. 
        Unten finden Sie einen strategischen Bericht, der von unserem Datenanalysten erstellt wurde. 
        Ihre Aufgabe ist es, diesen Bericht in ein hochprofessionelles, strukturiertes IT-Consulting-Angebot (B2B Pitch) im Markdown-Format (.md) umzuwandeln.

        Regeln:
        1. Verwenden Sie ein sehr professionelles B2B Business-Deutsch (formelle Anrede "Sie").
        2. Strukturieren Sie den Bericht zwingend wie folgt (typischer deutscher IT-Consulting-Standard):
           - **Management Summary** (Kurze Zusammenfassung des Wertversprechens)
           - **IST-Analyse** (Aktuelle Situation & Herausforderungen des Kunden)
           - **SOLL-Konzept** (Zielzustand & technologischer Lösungsansatz)
           - **Architektur & Roadmap** (Schritte zur technischen Umsetzung)
           - **Business Value / ROI** (Warum sich diese Investition lohnt)
        3. Nutzen Sie Markdown-Formatierungen (Überschriften # und ##, Aufzählungen, fette Texte), um das Lesen zu erleichtern.
        4. Fügen Sie eine formelle Begrüßung (z.B. "Sehr geehrte Damen und Herren,") und eine professionelle Verabschiedung (z.B. "Mit freundlichen Grüßen,") hinzu.
        5. Geben Sie NUR den endgültigen Bericht aus. Keine einleitenden Sätze oder Erklärungen.

        Hier ist der Analysebericht:
        ${state.analysisReport}`;
    }

    // AWS Bedrock'a metni yazdırıyoruz
    const response = await llm.invoke(prompt);

    console.log("✅ İçerik Üretici: Deutscher IT-Pitch ist fertig! (Almanca IT Teklifi hazır!)");
    
    // YENİ DÖNGÜ KURALI: 
    // Metni güncelliyoruz VE eleştiri notunu 'null' (boş) yapıyoruz ki Şef metni tekrar Eleştirmene yollasın!
    return { 
        finalContent: response.content,
        criticFeedback: null 
    };
}