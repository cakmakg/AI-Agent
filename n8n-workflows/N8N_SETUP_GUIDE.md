# 📧 N8N + AI Orchestra Setup Rehberi

## Sistem Mimarisi

```
Gmail (Dinleyici)
    ↓
n8n (23 Node)
├─ Email Parse
├─ GPT-4o Sınıflandırma
├─ 6 Kategori Branşı
│  ├─→ 🔴 Acil Destek (1 saat SLA)
│  ├─→ 💰 Teklif Talebi (24 saat SLA)
│  ├─→ 📋 İhtiyaç Analizi (48 saat SLA)
│  ├─→ 💲 Fiyat Soruşturması (24 saat SLA)
│  ├─→ 😤 Şikayet/İade (4 saat SLA)
│  └─→ ℹ️ Genel Bilgi (72 saat SLA)
├─ Her kategori için:
│  ├─ Slack bildirim (kanala göre)
│  ├─ AI Beyin'e POST /api/inbox (metadata ile)
│  └─ Otomatik yanıt maili gönder
```

---

## 🚀 Kurulum Adımları

### 1️⃣ N8N Environment Variables Ayarla

N8N Settings → Variables bölümüne git ve şunları ekle:

| Variable | Değer | Nereden |
|----------|-------|--------|
| `OPENAI_API_KEY` | sk-... | platform.openai.com |
| `SLACK_WEBHOOK_URL` | https://hooks.slack.com/... | Slack → Apps → Incoming Webhooks |
| `GMAIL_OAUTH` | (Credentials'da) | N8N Credentials |
| `NODE_JS_BASE_URL` | http://localhost:4000 | Senin Node.js sunucun |

### 2️⃣ Gmail Credentials Kur (OAuth2)

1. N8N → Credentials → New
2. **Type:** Gmail OAuth2
3. Google hesapla login yap
4. Trigger'da kullan

### 3️⃣ OpenAI Credentials Kur

1. N8N → Credentials → New
2. **Type:** OpenAI
3. API Key gir: https://platform.openai.com/api-keys
4. Model: `gpt-4o-mini` seç

### 4️⃣ Slack Webhook Kur

```
Slack → Apps → Incoming Webhooks → Create New
Channel: #bildirim-hub (veya istediğin kanal)
Webhook URL'ni kopyala → N8N Variables'a SLACK_WEBHOOK_URL olarak ekle
```

### 5️⃣ Node.js Backend Webhook Endpoints

Senin `server/src/controllers/` klasöründe şu endpoints var mı kontrol et:

```javascript
// POST /api/inbox
// Gelen kutusu — AI Beyin'e yönlendir

// POST /api/approve
// Onay düğmesi — Publisher'ı trigger et

// GET /api/artifact/:threadId
// Sonuç okuma
```

Eğer yoksa, eklemem gerekiyor!

---

## 📥 Workflow İçe Aktar

### Seçenek 1: JSON Import (Kolay)
```
1. N8N Dashboard → Create Workflow
2. Sağ üst → "..." → Import from JSON
3. email-classifier-workflow.json seç
4. Test et
```

### Seçenek 2: Manuel Oluştur
Workflow'u adım adım oluşturursan, aşağıdaki 7 Node sırasını izle:

1. **Gmail Trigger** (Listen for new emails)
2. **Prepare Email Data** (Function: clean subject/body)
3. **GPT-4o Classification** (OpenAI node)
4. **Parse Category** (Function: extract JSON)
5. **Category Switch** (6 branches)
6. **Slack Webhook** (for each branch)
7. **HTTP Request → /api/inbox** (send to Brain)
8. **Auto-Reply Email** (optional)

---

## 🧪 Test Ederken Nelere Dikkat Et

### Test 1: Gmail Gelen Kutusu
```
cakmak4834@gmail.com'e yeni bir mail gönder
↓
Gmail Trigger tetiklenecek mi? (Canlı testte)
```

### Test 2: AI Sınıflandırma
```
Subject: "Acil Sorun: Yazılım Çöktü"
Body: "Sistemimiz offline, lütfen yardım edin!"

Beklenen: {"category": "ACIL_DESTEK", "priority": "critical"}
```

### Test 3: Slack Bildirim
```
Slack webhook URL doğru mu?
Token expire mi?
Channel var mı?
```

### Test 4: Node.js Brain Webhook
```
curl -X POST http://localhost:4000/api/inbox \
  -H "Content-Type: application/json" \
  -d '{
    "source": "gmail",
    "category": "ACIL_DESTEK",
    "priority": "high",
    "ai_summary": "Test"
  }'

Response: {"success": true, "threadId": "xxx"}
```

---

## 🔧 Sorun Giderme

### ❌ "Gmail Trigger bağlanmıyor"
- Gmail OAuth credential'ı N8N'de kur
- 2FA'yı aç (Google hesabında)
- App Password oluştur (Gmail settings)

### ❌ "OpenAI API Error"
- API Key doğru mu?
- Credit var mı?
- Model adı: `gpt-4o-mini`

### ❌ "Slack webhook 401"
- Token expire mi? Yeni URL oluştur
- URL format: `https://hooks.slack.com/services/T.../B.../X...`
- Channel adı doğru mu?

### ❌ "Node.js /api/inbox 404"
- Backend çalışıyor mu? (`node src/index.js`)
- PORT 4000'de mi?
- Firewall blokluyor mu?

---

## 📊 Workflow Performans Metrikleri

| Metrik | Hedef | Gerçek |
|--------|-------|--------|
| Email Parse | <100ms | |
| GPT Classification | <2s | |
| Slack Webhook | <500ms | |
| AI Brain Response | <5s | |
| **Toplam SLA** | <10s | |

---

## 🎯 Sonraki Adımlar

- [ ] Gmail OAuth setup
- [ ] OpenAI API ekle
- [ ] Slack webhook kur
- [ ] Node.js /api/inbox endpoint kontrol et
- [ ] Workflow JSON import et
- [ ] Test mail gönder
- [ ] Slack'te bildirim gözlemle
- [ ] Node.js server logs'ta "status: PROCESSING" gör

---

## 📝 Platform Entegrasyonları (Sonra Eklenecek)

Aynı mimarı kullanarak:

1. **YouTube Yorum Dinleyici** → /api/inbox
2. **Twitter Mention Dinleyici** → /api/inbox
3. **TikTok Yorum Dinleyici** → /api/inbox
4. **Instagram DM Dinleyici** → /api/inbox
5. **Slack Mesaj Dinleyici** → /api/inbox

Her biri kendi sınıflandırma + Slack kanal + Brain webhook ile çalışacak.

---

**Yardım lazımsa:** N8N workflow test ederken sorun yaşarsan, `test_webhooks.js` dosyasını çalıştır.
