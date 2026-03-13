# 🎯 Platform Workflow Şablonları

Bu dosya, diğer sosyal medya platformları için n8n workflow'ı nasıl oluşturacağını gösteriyor. Hepsi **aynı mimarı** kullanıyor.

---

## 📋 Genel Akış (Tüm Platformlar)

```
Dinleyici (Trigger)
    ↓
Veri Hazırla (Parse)
    ↓
GPT-4o Sınıflandırma
    ↓
Kategori Switch (6 Yol)
    ↓
├─ Slack Bildirim
├─ /api/inbox POST (Brain'e)
└─ Otomatik Yanıt (Platform'a)
```

---

## 🎥 YouTube Workflow

### Trigger: YouTube Yorum Dinleyici
```
N8N Node Type: HTTP Request (Polling)
Interval: Her 5 dakika
URL: https://www.googleapis.com/youtube/v3/comments
Query Params:
  - allThreadsRelated: true
  - textFormat: plainText
  - key: {{$env.YOUTUBE_API_KEY}}
  - part: snippet
  - channelId: {{$env.YOUTUBE_CHANNEL_ID}}

Response Parse:
items.forEach(item => {
  return {
    commentId: item.id,
    videoId: item.snippet.videoId,
    author: item.snippet.authorDisplayName,
    text: item.snippet.textDisplay,
    timestamp: item.snippet.publishedAt
  }
})
```

### AI Classification (Same as Email)
```
System Prompt:
"YouTube yorumunu analiz et. JSON dönüş: category, priority, sentiment, confidence"

Input: {{$json.text}}
```

### Yanıt Gönder (YouTube'a)
```
N8N HTTP Node:

POST https://www.googleapis.com/youtube/v3/comments
Authorization: Bearer {{$env.YOUTUBE_ACCESS_TOKEN}}

{
  "snippet": {
    "parentId": "{{$json.commentId}}",
    "textOriginal": "{{$json.ai_generated_reply}}"
  }
}
```

---

## 🐦 Twitter/X Workflow

### Trigger: Mention Dinleyici
```
N8N Node Type: HTTP Request (Polling)
Interval: Her 2 dakika
URL: https://api.twitter.com/2/tweets/search/recent
Headers:
  Authorization: Bearer {{$env.TWITTER_BEARER_TOKEN}}

Query:
  query: "@{{$env.TWITTER_HANDLE}} -is:retweet"
  max_results: 10
  tweet.fields: author_id,public_metrics,created_at
  expansions: author_id

Response Parse:
data.forEach(tweet => {
  return {
    tweetId: tweet.id,
    authorId: tweet.author_id,
    text: tweet.text,
    timestamp: tweet.created_at,
    replyCount: tweet.public_metrics.reply_count
  }
})
```

### AI Classification
```
Sentiment: Negative tweets → Acil Destek
Questions: İhtiyaç Analizi
Links: Teklif Talebi / Fiyat Soruşturması
```

### Yanıt Gönder (Twitter'a)
```
POST https://api.twitter.com/2/tweets
Authorization: Bearer {{$env.TWITTER_BEARER_TOKEN}}

{
  "text": "{{$json.ai_generated_reply}} {{$json.replyHandle}}",
  "reply": {
    "in_reply_to_tweet_id": "{{$json.tweetId}}"
  }
}
```

---

## 📱 TikTok Workflow

### Trigger: Video Yorum Dinleyici
```
N8N Node Type: HTTP Request (Polling)
Interval: Her 10 dakika
URL: https://open.tiktokapis.com/v1/video/query/
Headers:
  Authorization: Bearer {{$env.TIKTOK_ACCESS_TOKEN}}

Body:
{
  "filters": {
    "video_ids": ["{{$env.TIKTOK_VIDEO_ID}}"]
  }
}

Response Parse:
data.videos.forEach(video => {
  return {
    videoId: video.id,
    commentCount: video.comment_count,
    // Yorumları ayrı request ile al
  }
})

// Ardından: Yorum Alma (Comment Query)
GET https://open.tiktokapis.com/v1/video/comments/
  ?video_id={{$json.videoId}}

comments.forEach(comment => {
  return {
    commentId: comment.id,
    author: comment.user_name,
    text: comment.text,
    timestamp: comment.create_time
  }
})
```

### AI Classification (Same)
```
Genç dinleyici hedefi:
- Emojiler önemli
- Kısaca cevap ver
- Arkadaş canlısı ton
```

### Yanıt Gönder (TikTok'a)
```
POST https://open.tiktokapis.com/v1/comment/create/
Authorization: Bearer {{$env.TIKTOK_ACCESS_TOKEN}}

{
  "video_id": "{{$json.videoId}}",
  "comment_text": "{{$json.ai_generated_reply}}",
  "reply_comment_id": "{{$json.commentId}}" // Reply varsa
}
```

---

## 📲 Instagram Workflow

### Trigger: DM + Yorum Dinleyici
```
// Seçenek 1: Webhook (Real-time)
Instagram Meta Webhook:
  - Event: messages, comments
  - POST /n8n-webhook-instagram

// Seçenek 2: Polling (Her dakika)
GET https://graph.instagram.com/me/conversations
  ?access_token={{$env.INSTAGRAM_ACCESS_TOKEN}}

conversations.forEach(conv => {
  return {
    conversationId: conv.id,
    senders: conv.senders,
    snippet: conv.snippet
  }
})

// Ardından: Mesajları Al
GET https://graph.instagram.com/{{$json.conversationId}}/messages
  ?access_token={{$env.INSTAGRAM_ACCESS_TOKEN}}

messages.forEach(msg => {
  return {
    messageId: msg.id,
    sender: msg.from.name,
    text: msg.message,
    timestamp: msg.created_time
  }
})
```

### AI Classification
```
DM ise: Genellikle Teklif Talebi
Yorum ise: Shout-out / İhtiyaç Analizi
```

### Yanıt Gönder (Instagram'a)
```
POST https://graph.instagram.com/me/messages
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

---

## 💬 Slack Workflow

### Trigger: Kanal Mesaj Dinleyici
```
N8N Node Type: Slack Trigger (Webhook)

Setup:
1. Slack App → OAuth & Permissions
2. Scopes: chat:read, channels:read
3. Event Subscriptions:
   - app_mention
   - message.channels

Trigger Event:
{
  "event_type": "message",
  "channel": "#general",
  "user": "U12345",
  "text": "Hey bot, what should I do about...",
  "ts": "1615384000.000100"
}
```

### AI Classification
```
Keywords:
- "acil", "urgent" → Acil Destek
- "fiyat", "teklif" → Teklif Talebi
- "nasıl", "nedir" → Genel Bilgi
```

### Yanıt Gönder (Slack'a)
```
N8N Slack Node:

POST https://slack.com/api/chat.postMessage

{
  "channel": "{{$json.channelId}}",
  "text": "{{$json.ai_generated_reply}}",
  "thread_ts": "{{$json.messageTimestamp}}"
}
```

---

## 🔗 Webhook URL'leri (N8N'de Oluştur)

Tüm platform workflow'ları için:

```
Email:     http://localhost:5678/webhook/email-classifier
YouTube:   http://localhost:5678/webhook/youtube-listener
Twitter:   http://localhost:5678/webhook/twitter-listener
TikTok:    http://localhost:5678/webhook/tiktok-listener
Instagram: http://localhost:5678/webhook/instagram-listener
Slack:     http://localhost:5678/webhook/slack-listener
```

---

## 📊 Workflow Mimarı (N8N içinde)

Tüm workflow'lar **23-30 node** arasında olacak:

| Node Tipi | Sayı | Görev |
|-----------|------|-------|
| Trigger | 1 | Platform'u dinle |
| Function | 2-3 | Veri hazırla + parse |
| HTTP (GPT) | 1 | AI Sınıflandırma |
| Switch | 1 | 6 kategoriye ayır |
| HTTP (Slack) | 1 | Slack bildirimi |
| HTTP (Brain) | 1 | /api/inbox gönder |
| HTTP (Platform) | 1 | Platform'a yanıt gönder |
| **TOPLAM** | **~30** | - |

---

## 🔐 Environment Variables (Hepsi)

N8N Settings → Variables:

```env
# Genel
NODE_JS_BASE_URL=http://localhost:4000
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
OPENAI_API_KEY=sk-...

# YouTube
YOUTUBE_API_KEY=AIza...
YOUTUBE_CHANNEL_ID=UCxxx...
YOUTUBE_ACCESS_TOKEN=ya29...

# Twitter
TWITTER_API_KEY=xxx...
TWITTER_API_SECRET=xxx...
TWITTER_BEARER_TOKEN=AAAAA...
TWITTER_HANDLE=@yourhandle

# TikTok
TIKTOK_CLIENT_KEY=xxx...
TIKTOK_CLIENT_SECRET=xxx...
TIKTOK_ACCESS_TOKEN=xxx...
TIKTOK_VIDEO_ID=7xxx...

# Instagram
INSTAGRAM_ACCESS_TOKEN=EAABsx...
INSTAGRAM_PAGE_ID=17xxx...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C12345...
```

---

## 🚀 Kurulum Sırası

1. ✅ **Email Classifier** (Şu anda yapıyoruz)
2. ⏳ **YouTube Listener** (Kolay, en az kısıtlama)
3. ⏳ **Twitter Listener** (Orta zorluk, rate limit var)
4. ⏳ **TikTok Listener** (Zor, API Limited)
5. ⏳ **Instagram Listener** (Orta, Meta webhook öneriliyor)
6. ⏳ **Slack Listener** (Kolay, gerçek-time)

---

## 📝 Best Practices

### 1. Rate Limiting
```
Gmail:    1/dakika (N8N default scheduling)
YouTube:  1/5dk (quota limited)
Twitter:  1/2dk (API v2 limited)
TikTok:   1/10dk (Sandbox limited)
Instagram: 1/dakika
Slack:    Real-time (webhook)
```

### 2. Error Handling
```
Tüm HTTP nodes'da:
- Retry Count: 3
- Retry Interval: 30 saat exponential
- Timeout: 30 saniye
```

### 3. Logging
```
Her workflow'ın sonunda:
- Slack #n8n-logs'a execution summary gönder
- Error'lar #n8n-errors'a gönder
```

---

## 🧪 Test Checklist

- [ ] Trigger çalışıyor mu? (X platform'dan test veri gel)
- [ ] Data parse doğru mu? (Function node'u kontrol et)
- [ ] GPT classification doğru? (JSON output kontrol)
- [ ] Slack bildirimi geliyor mu?
- [ ] /api/inbox webhook başarılı?
- [ ] Otomatik yanıt platforma gidiyor mu?
- [ ] Slack #n8n-logs'ta execution log var mı?

---

**Devam?** Email classifier'ı test ettikten sonra, en kolay olanı (YouTube) oluşturalım!
