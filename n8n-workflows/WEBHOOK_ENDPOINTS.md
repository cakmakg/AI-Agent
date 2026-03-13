# 🔗 Webhook Endpoints — N8N ↔ Node.js Brain

## Backend Endpoints (Node.js)

Tüm webhook'lar `localhost:4000` altında çalışıyor.

### 1️⃣ Gelen Kutusu (Inbox)
```
POST /api/inbox
Content-Type: application/json

Payload:
{
  "source": "gmail" | "youtube" | "twitter" | "tiktok" | "instagram" | "slack",
  "category": "ACIL_DESTEK" | "TEKLIF_TALEBI" | "IHTIYAC_ANALIZI" | "FIYAT_SORUSTU" | "SIKAYET_IADE" | "GENEL_BILGI",
  "priority": "low" | "medium" | "high" | "critical",
  "ai_summary": "Konunun özeti",
  "ai_sentiment": "negative" | "neutral" | "positive",
  "ai_topics": ["topic1", "topic2"],
  "ai_confidence": 0.95,
  "sla_target": "24 saat",
  "action_required": true,
  "from": "customer@example.com",
  "subject": "Email konusu",
  "body": "Email içeriği",
  "messageId": "unique_id",
  "timestamp": "2026-03-13T10:30:00Z"
}

Response:
{
  "success": true,
  "threadId": "thread_abc123",
  "status": "PROCESSING",
  "message": "Inbox'a eklendi, AI Beyin tarafından işleniyor"
}
```

### 2️⃣ Onay/Red (Approval Gate)
```
POST /api/approve
Content-Type: application/json

Payload:
{
  "threadId": "thread_abc123",
  "approved": true | false,
  "notes": "Opsiyonel: Onaylayan kişinin notları"
}

Response:
{
  "success": true,
  "threadId": "thread_abc123",
  "action": "APPROVED" | "REJECTED",
  "message": "Onay kaydedildi, Publisher çalışıyor..."
}
```

### 3️⃣ Sonuç Okuma (Artifact)
```
GET /api/artifact/:threadId

Response:
{
  "success": true,
  "threadId": "thread_abc123",
  "content": "# Markdown Format Report",
  "status": "COMPLETED",
  "workflowPhase": "PUBLISHED",
  "timestamp": "2026-03-13T10:35:00Z"
}
```

---

## N8N Webhook Endpoints (N8N → External)

N8N workflow'lar, dış sistemlere (Slack, Email, YouTube, vb.) veri göndermek için bu endpoint'leri çağırır.

### 1️⃣ Slack Bildirim
```
N8N HTTP Node:

POST https://hooks.slack.com/services/T123/B456/XXX
Content-Type: application/json

{
  "text": "🔴 Acil Destek",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Email İçeri Geldi"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Kategori:*\n{{$json.category}}"},
        {"type": "mrkdwn", "text": "*Öncelik:*\n{{$json.priority}}"},
        {"type": "mrkdwn", "text": "*Gönderen:*\n{{$json.from}}"},
        {"type": "mrkdwn", "text": "*SLA:*\n{{$json.sla_hours}}s"}
      ]
    }
  ]
}
```

### 2️⃣ Email Otomatik Yanıt
```
N8N Email Node:

To: {{$json.from}}
Subject: ✅ E-mailiniz alınmıştır - {{$json.category}}

Body:
Sayın Müşteri,

E-mailiniz başarıyla alınmış ve {{$json.category}} olarak sınıflandırılmıştır.

SLA Süresi: {{$json.sla_hours}} saat içinde cevap vereceğiz.

Teşekkür ederiz.

---
AI Orchestra Inbox Sistem
```

### 3️⃣ Node.js Brain'e POST
```
N8N HTTP Node:

POST http://localhost:4000/api/inbox
Content-Type: application/json

{
  "source": "{{$json.source}}",
  "category": "{{$json.category}}",
  "priority": "{{$json.priority}}",
  "ai_summary": "{{$json.summary}}",
  "ai_sentiment": "{{$json.sentiment}}",
  "ai_topics": {{$json.topics}},
  "ai_confidence": {{$json.confidence}},
  "sla_target": "{{$json.sla_hours}} saat",
  "action_required": true,
  "from": "{{$json.from}}",
  "subject": "{{$json.subject}}",
  "body": "{{$json.body}}",
  "messageId": "{{$json.messageId}}",
  "timestamp": "{{$json.timestamp}}"
}
```

---

## Platform-Spesifik Webhook'lar

### 🎥 YouTube Yorum Geri Döndür
```
N8N HTTP Node:

POST https://www.googleapis.com/youtube/v3/comments/reply
Authorization: Bearer {{$env.YOUTUBE_ACCESS_TOKEN}}

{
  "snippet": {
    "parentId": "{{$json.commentId}}",
    "textOriginal": "{{$json.ai_generated_reply}}"
  }
}
```

### 🐦 Twitter/X Reply
```
N8N HTTP Node:

POST https://api.twitter.com/2/tweets
Authorization: Bearer {{$env.TWITTER_BEARER_TOKEN}}

{
  "text": "{{$json.ai_generated_reply}}",
  "reply": {
    "in_reply_to_tweet_id": "{{$json.tweetId}}"
  }
}
```

### 📱 TikTok Yorum (N8N Webhook)
```
TikTok API hızlı değişiyor, en güncel versiyonu kontrol et:
https://developer.tiktok.com/doc/
```

### 📲 Instagram DM
```
N8N HTTP Node:

POST https://graph.instagram.com/v18.0/me/messages
Authorization: Bearer {{$env.INSTAGRAM_ACCESS_TOKEN}}

{
  "recipient": {
    "id": "{{$json.senderId}}"
  },
  "message": {
    "text": "{{$json.ai_generated_reply}}"
  }
}
```

### 💬 Slack Reply
```
N8N HTTP Node:

POST https://slack.com/api/chat.postMessage
Authorization: Bearer {{$env.SLACK_BOT_TOKEN}}

{
  "channel": "{{$json.channelId}}",
  "text": "{{$json.ai_generated_reply}}",
  "thread_ts": "{{$json.messageTimestamp}}"
}
```

---

## 🔒 Security Best Practices

### 1️⃣ N8N Webhook Authentication
```
N8N Settings → Webhook → Require Authentication

Frontend'dan gelen requests için:
Authorization: Bearer {{WEBHOOK_SECRET}}
```

### 2️⃣ Node.js Middleware (Tenant Check)
```javascript
// server/src/middleware/tenant.js

app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({error: 'No API key'});

  // DB'de key'i kontrol et
  next();
});
```

### 3️⃣ Rate Limiting
```javascript
// n8n'de her workflow için rate limit:
// Gmail: 1 email/dakika
// YouTube: 1 comment/dakika (quota kısıtlaması)
// Twitter: 1 mention/dakika (v2 limited)
// TikTok: 1 comment/dakika
```

### 4️⃣ Retry Policy
```
N8N:
- Retry Count: 3
- Retry Interval: 30 saat (exponential backoff)
- Timeout: 30 saniye
```

---

## 📊 Webhook Flow Diyagramı

```
┌─────────────────┐
│ Gmail           │
│ (Yeni mail)     │
└────────┬────────┘
         │
         ↓
    ┌─────────────────┐
    │ N8N Workflow    │
    │ (Email Sınıfla) │
    └────────┬────────┘
             │
             ├─→ Slack #destek-acil
             ├─→ Slack #satis
             ├─→ Slack #proje
             ├─→ Slack #musteri-hiz.
             │
             ├─→ POST /api/inbox
             │   (AI Beyin)
             │
             └─→ Auto-reply Email
                 (Müşterilerin emailine)
```

---

## 🧪 Test Komutları

### Test 1: /api/inbox
```bash
curl -X POST http://localhost:4000/api/inbox \
  -H "Content-Type: application/json" \
  -d '{
    "source": "gmail",
    "category": "ACIL_DESTEK",
    "priority": "high",
    "ai_summary": "Test email",
    "ai_sentiment": "positive",
    "ai_topics": ["test"],
    "ai_confidence": 0.95,
    "sla_target": "1 saat",
    "action_required": true,
    "from": "test@example.com",
    "subject": "Test Subject",
    "body": "Test body",
    "messageId": "test_123",
    "timestamp": "2026-03-13T10:30:00Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "threadId": "thread_abc123",
  "status": "PROCESSING"
}
```

### Test 2: /api/approve
```bash
curl -X POST http://localhost:4000/api/approve \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "thread_abc123",
    "approved": true
  }'
```

### Test 3: Slack Webhook
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test message from n8n"
  }'
```

---

## 📝 Logging & Monitoring

### N8N Logs
```
N8N Dashboard → Executions → Workflow'ı tıkla
- Status: Success/Failed
- Execution Time
- Error Messages
```

### Node.js Logs
```bash
# Terminal'de çalışan server'ı göz et
node src/index.js

# MongoDB'de thread'ları kontrol et
db.threads.find({}).sort({_id: -1}).limit(5)
```

---

**Sorular?** N8N workflow'ları test ederken sorun yaşarsan, `N8N_SETUP_GUIDE.md`'ye bak!
