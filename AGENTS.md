# Multi-Agent + n8n Otomasyon Sistemi — Antigravity Talimatları

## Sistem Mimarisi

Bu proje iki katmandan oluşur:

### 🧠 Beyin — Node.js / LangGraph (bu repodaki kod)
- Multi-agent orkestrasyon (LangGraph)
- RAG pipeline (vektör veritabanı)
- İş mantığı, karar alma, taslak üretimi
- REST API endpoint'leri (`/api/inbox`, `/api/approve`, `/api/classify-email`)

### 🤝 Eller & Kulaklar — n8n (http://localhost:5678)
- Platform entegrasyonları: Gmail, YouTube, TikTok, Instagram, Twitter/X, Slack
- Webhook dinleyiciler (n8n → Beyin)
- Yanıt göndericiler (Beyin → n8n → Platform)
- Email AI sınıflandırıcı (6 kategori)

### Veri Akışı
```
Platform (Gmail/YouTube/Slack...) 
    → n8n (veri toplar, temizler)
    → POST /api/inbox (Node.js Beyin)
    → AI Agents (RAG + LangGraph işler)
    → Onay gerekirse: Command Center UI'a taslak düşer
    → Onay sonrası: POST n8n webhook
    → n8n platforma yanıt basar
```

---

## n8n Workflow Kuralları

n8n-MCP araçlarını kullanırken şu sırayı takip et:

### 1. Her zaman önce template ara
```
search_templates({searchMode: 'by_task', task: '...'})
search_templates({query: '...', searchMode: 'keyword'})
```

### 2. Node konfigürasyonu için
```
get_node({nodeType: 'n8n-nodes-base.X', detail: 'standard', includeExamples: true})
validate_node({nodeType: 'n8n-nodes-base.X', config: {...}, mode: 'minimal'})
validate_node({nodeType: 'n8n-nodes-base.X', config: {...}, mode: 'full', profile: 'runtime'})
```

### 3. Workflow oluşturmadan önce doğrula
```
validate_workflow(workflowJson)
validate_workflow_connections(workflowJson)
validate_workflow_expressions(workflowJson)
```

### 4. Deploy et
```
n8n_create_workflow(workflow)
n8n_validate_workflow({id: 'workflow-id'})
```

---

## Mevcut n8n Workflow'ları

| Workflow | ID | Durum | Açıklama |
|---|---|---|---|
| 📧 Email AI Sınıflandırıcı | PHpZSDhLt5ySqnI7 | 🟢 Aktif | 6 kategori, GPT-4o-mini |
| 🎬 YouTube Yorum Dinleyici | yt1 | ⏸ Pasif | Her 5 dk polling |
| 📩 Gmail Dinleyici | gm1 | ⏸ Pasif | Her dk, okunmamış |
| 💬 Slack Dinleyici | sl1 | ⏸ Pasif | Real-time |
| 📱 Instagram DM+Yorum | ig1 | ⏸ Pasif | Meta Webhook |
| 🐦 Twitter/X Mention | tw1 | ⏸ Pasif | Her 2 dk |
| 🎵 TikTok Yorum | tk1 | ⏸ Pasif | Her 10 dk |

---

## Email Kategorileri (6 Adet)

| Kategori | Slack Kanalı | SLA | Öncelik |
|---|---|---|---|
| 🔴 ACIL_DESTEK | #destek-acil | 1 saat | critical |
| 💰 TEKLIF_TALEBI | #satis | 24 saat | high |
| 📋 IHTIYAC_ANALIZI | #proje | 48 saat | medium |
| 💲 FIYAT_SORUSTURMASI | #satis | 24 saat | medium |
| 😤 SIKAYET_IADE | #musteri-hizmetleri | 4 saat | high |
| ℹ️ GENEL_BILGI | #genel | 72 saat | low |

---

## Node.js Beyin — API Endpoint'leri

n8n'in çağırdığı endpoint'ler. Bunları koruyun:

### POST /api/inbox
n8n'den gelen tüm mesajlar buraya düşer.
```json
{
  "source": "gmail|youtube|slack|instagram|twitter|tiktok",
  "type": "email|comment|dm|mention|message",
  "category": "ACIL_DESTEK|TEKLIF_TALEBI|...",
  "platform_id": "platform_specific_id",
  "author": "Gönderen adı",
  "author_email": "email@domain.com",
  "subject": "Email konusu (sadece email için)",
  "content": "Mesaj içeriği",
  "received_at": "ISO 8601",
  "ai_summary": "GPT özeti",
  "ai_confidence": 0.97,
  "ai_sentiment": "positive|neutral|negative",
  "priority": "critical|high|medium|low",
  "sla_target": "1 saat",
  "action_required": true
}
```

### POST /api/approve
Onaylanan taslakları n8n'e gönderir.
```json
{
  "inbox_id": "...",
  "platform": "gmail|youtube|slack|instagram|twitter|tiktok",
  "reply_text": "Onaylanan metin",
  "platform_id": "reply_hedef_id",
  "thread_id": "thread_id (opsiyonel)"
}
```

### POST /api/classify-email (opsiyonel)
Manuel email sınıflandırma tetikleyicisi.

---

## n8n Webhook URL'leri (Beyin → Platforma)

| Platform | Webhook Path | Açıklama |
|---|---|---|
| YouTube | `POST /webhook/youtube-reply` | Yorum yanıtı |
| Slack | `POST /webhook/slack-reply` | Mesaj yanıtı |
| Instagram | `POST /webhook/instagram-reply` | DM/yorum yanıtı |
| Twitter/X | `POST /webhook/twitter-reply` | Tweet yanıtı |
| Gmail | n8n Gmail node'u | Email cevabı |

---

## Çevre Değişkenleri (n8n Variables)

n8n arayüzünde ayarlanması gerekenler:

| Değişken | Açıklama |
|---|---|
| `OPENAI_API_KEY` | GPT-4o-mini için |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook |
| `GMAIL_ACCESS_TOKEN` | Gmail OAuth2 token |
| `YOUTUBE_API_KEY` | YouTube Data API v3 |
| `YOUTUBE_VIDEO_ID` | İzlenecek video ID |
| `META_ACCESS_TOKEN` | Instagram/Facebook Graph API |
| `INSTAGRAM_PAGE_ID` | Instagram sayfa ID |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 Bearer Token |
| `TWITTER_USER_ID` | Twitter kullanıcı ID |
| `TIKTOK_ACCESS_TOKEN` | TikTok Research API |

---

## Geliştirme Kuralları

### n8n Workflow Geliştirirken
1. **Varsayılan değerlere güvenme** — Tüm parametreleri açıkça yaz
2. **Paralel çalıştır** — Bağımsız tool çağrılarını aynı anda yap  
3. **Template önce** — `search_templates()` ile başla
4. **Doğrula, sonra deploy et** — Her zaman `validate_workflow()` çağır
5. **Code node son çare** — Standart node yoksa kullan

### Node.js Beyin Geliştirirken
1. Sistem beyni burada kalır — iş mantığı Node.js'te
2. n8n sadece veri taşır — karar vermez
3. Webhook güvenliği — `X-Source: n8n` header kontrolü
4. Hata toleransı — n8n'den gelen her veri validate edilmeli
5. İdempotency — Aynı `platform_id` iki kez işlenmemeli

### Güvenlik
- n8n webhook'larına `X-Webhook-Secret` header ekle
- Rate limiting: platform başına max istek sayısı
- Duplicate detection: `platform_id` cache'le

---

## Örnek Kullanım Komutları

```
# Yeni bir LinkedIn workflow ekle
"LinkedIn mention'larını dinleyen ve AI beyne gönderen bir n8n workflow oluştur"

# Mevcut workflow'u güncelle  
"Email sınıflandırıcıya 'SPONSORLUK_TEKLIFI' kategorisi ekle"

# Test et
"YouTube workflow'unu test et ve sonuçları göster"

# Hata ayıkla
"Email workflow'unda son 5 execution'ın hatalarını analiz et"
```
