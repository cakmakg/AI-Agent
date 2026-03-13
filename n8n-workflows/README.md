# 🤖 N8N Workflow Koleksiyonu — AI Orchestra

Bu klasör, **n8n** platformunda çalışan otomasyonları saklıyor. Tüm workflow'lar senin Node.js AI Beynine (`localhost:4000/api/inbox`) webhook aracılığıyla bağlanıyor.

---

## 📋 Workflow'lar

### ✅ Mevcut

| # | Workflow | Dosya | Node Sayısı | Durum |
|---|----------|-------|-------------|-------|
| 1️⃣ | 📧 Email Sınıflandırıcı | `email-classifier-workflow.json` | 23 | ✅ Canlı |
| 2️⃣ | 🎥 YouTube Yorum Dinleyici | `youtube-listener.json` | ⏳ | Şablon |
| 3️⃣ | 🐦 Twitter Mention Dinleyici | `twitter-listener.json` | ⏳ | Şablon |
| 4️⃣ | 📱 TikTok Yorum Dinleyici | `tiktok-listener.json` | ⏳ | Şablon |
| 5️⃣ | 📲 Instagram DM Dinleyici | `instagram-listener.json` | ⏳ | Şablon |
| 6️⃣ | 💬 Slack Mesaj Dinleyici | `slack-listener.json` | ⏳ | Şablon |

---

## 🚀 Kurulum

### En Hızlı Yol (3 dakika)
```bash
cd n8n-workflows
# 1. N8N'i aç: http://localhost:5678
# 2. Email classifier'ı import et (JSON)
# 3. Gmail OAuth, OpenAI API, Slack Webhook kur
# 4. Test maili gönder
```

**Detaylı Rehber:** `N8N_SETUP_GUIDE.md` oku

---

## 🔗 Webhook Mimarisi

```
┌────────────────┐
│ Dış Kaynak     │ (Gmail, YouTube, Twitter, etc.)
│ (Dinleyici)    │
└────────┬───────┘
         │ (Yeni veri geldi)
         ↓
   ┌──────────────┐
   │ N8N Workflow │ (Parse + AI Sınıflandırma)
   │ (Handler)    │
   └────────┬─────┘
            │ JSON Payload
            ↓
    ┌──────────────────┐
    │ POST /api/inbox  │
    │ localhost:4000   │ ← Senin Node.js Brain'inin
    │ (Gelen Kutusu)   │   Gelen Kutusu
    └────────┬─────────┘
             │
             ↓
      ┌────────────────┐
      │ LangGraph      │ (Orchestrator)
      │ (AI Ajanlar)   │
      └────────┬───────┘
               │
               ↓
      ┌────────────────┐
      │ Command Center │ (Senin Frontend'ı)
      │ (HITL Onay)    │
      └────────────────┘
```

---

## 🧠 Her Workflow Yapısı

### Adım 1: Dinleyici (Trigger)
- **Gmail**: Yeni mail geldi
- **YouTube**: Kanal yorumları izle
- **Twitter**: Mention'ları tara
- **TikTok**: Video yorumları al
- **Instagram**: DM ve yorum webhook
- **Slack**: Kanal mesajları

### Adım 2: Hazırlık (Normalization)
- Veriyi temizle (HTML strip, emojiler vs.)
- Gerekli alanları çıkar (from, subject, body)
- Timestamp ekle

### Adım 3: AI Sınıflandırma (GPT-4o)
Kategori belirle:
- 🔴 **Acil Destek** — SLA 1 saat
- 💰 **Teklif Talebi** — SLA 24 saat
- 📋 **İhtiyaç Analizi** — SLA 48 saat
- 💲 **Fiyat Soruşturması** — SLA 24 saat
- 😤 **Şikayet/İade** — SLA 4 saat
- ℹ️ **Genel Bilgi** — SLA 72 saat

### Adım 4: Branşlama (Switch)
Her kategori için:
- Slack kanal bildirimi
- Brain'e zengin metadata ile POST
- Otomatik yanıt gönder (email/DM/comment)

---

## 📝 Örnek Payload (Brain'e Giden)

```json
{
  "source": "gmail",
  "category": "ACIL_DESTEK",
  "priority": "critical",
  "ai_summary": "Yazılım çökmüş, acil destek lazım",
  "ai_sentiment": "negative",
  "ai_topics": ["yazılım", "bug", "urgent"],
  "ai_confidence": 0.98,
  "sla_target": "1 saat",
  "action_required": true,
  "from": "customer@company.com",
  "subject": "SOS: Yazılım Çöktü!",
  "body": "Sistem offline...",
  "messageId": "gmail_12345",
  "timestamp": "2026-03-13T10:30:00Z"
}
```

---

## 🔐 Environment Variables

N8N Settings → Variables'ta ekle:

```env
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
YOUTUBE_API_KEY=AIza...
TWITTER_BEARER_TOKEN=AAAAA...
TIKTOK_ACCESS_TOKEN=...
INSTAGRAM_ACCESS_TOKEN=...
NODE_JS_BASE_URL=http://localhost:4000
```

---

## 🧪 Test Komutları

### Gmail Test
```bash
# N8N test butonundan yap
# veya cakmak4834@gmail.com'e test maili gönder
```

### Webhook Test
```bash
curl -X POST http://localhost:5678/webhook/email-urgent-support \
  -H "Content-Type: application/json" \
  -d '{"from":"test@test.com","subject":"Test","body":"Test body"}'
```

### Brain /api/inbox Test
```bash
curl -X POST http://localhost:4000/api/inbox \
  -H "Content-Type: application/json" \
  -d '{
    "source": "gmail",
    "category": "ACIL_DESTEK",
    "priority": "high",
    "ai_summary": "Test"
  }'
```

---

## 🐛 Sorun Giderme

| Problem | Çözüm |
|---------|-------|
| Gmail trigger çalışmıyor | OAuth credential kur, 2FA aç |
| GPT-4 hatası | API key doğru mu? Credit var mı? |
| Slack webhook 401 | URL token expire oldu, yeni URL oluştur |
| Brain /api/inbox 404 | Node.js server çalışıyor mu? PORT 4000'de mi? |

---

## 📊 Workflow Performans

| İşlem | Hedef Zaman |
|-------|------------|
| Email Parse | <100ms |
| GPT Classification | <2s |
| Slack Webhook | <500ms |
| Brain /api/inbox Response | <5s |
| **Toplam Latency** | <8s |

---

## 🎯 Sonraki Adımlar (TODO)

- [ ] Email classifier deploy et ve canlı test yap
- [ ] YouTube listener oluştur (aynı mimarı kopyala)
- [ ] Twitter listener oluştur
- [ ] TikTok listener oluştur
- [ ] Instagram listener oluştur
- [ ] Slack listener oluştur
- [ ] Tüm workflow'ları backup et (git'e)
- [ ] Monitoring dashboard kur (N8N executions)

---

**Sorular?** Repo'nun root'undaki `CLAUDE.md`'ye bak veya bana sor!
