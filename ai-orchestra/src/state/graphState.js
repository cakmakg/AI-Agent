import { Annotation } from "@langchain/langgraph";

// Sistemin Merkezi Hafızası (State)
export const StateAnnotation = Annotation.Root({
    
    // 1. Şefin sisteme verdiği ilk görev
    task: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => "",
    }),
    
    // 2. Veri Tarayıcının (Ajan 1) internetten çekip buraya yazacağı ham veri
    scrapedData: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => null,
    }),
    
    // 3. Analiz Motorunun (Ajan 2) ham veriyi işleyip çıkaracağı sonuç raporu
    analysisReport: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => null,
    }),
    
    // 4. İçerik Üreticinin (Ajan 3) raporu dönüştüreceği son metin
    finalContent: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => null,
    }),

    // 🎯 YENİ: 5. Güvence Katmanı - Eleştirmen metni onayladı mı?
    isApproved: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => false, // Varsayılan olarak onaysız başlar
    }),

    // 🎯 YENİ: 6. Güvence Katmanı - Eleştirmenin düzeltme talepleri
criticFeedback: Annotation({
        reducer: (current, update) => update !== undefined ? update : current,
        default: () => null,
    }),
    
    // 7. Dosya kaydedildi mi?
    fileSaved: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => false,
    }),

    // 🎯 YENİ: 8. Dağıtım Koordinatörü raporu kanala gönderdi mi?
    isPublished: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => false,
    }),
    
    // 9. Şefin yönlendirme kararı
    nextAgent: Annotation({
        reducer: (current, update) => update ?? current,
        default: () => "orchestrator", 
    })
    
});