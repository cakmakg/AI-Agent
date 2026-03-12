# AI Orchestra — Backend & Frontend Özellik Raporu

## 1. API Endpoint'leri (12 Grup)

### Agent & SSE (Real-time)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/events/:threadId` | SSE Stream — Ajan aktivasyonlarını frontend'e anlık (real-time) iletir. |
| `POST` | `/api/analyze` | Senkron görev çalıştırır → direkt sonuç döndürür. |
| `POST` | `/api/rnd` | Manuel R&D (Ar-Ge) / Innovation Radar döngüsünü tetikler. |

### HITL (İnsan) Onay Kapısı
| Method | Path | Açıklama |
|---|---|---|
| `POST` | `/api/approve` | Raporu/Görevi onayla veya reddet (feedback + kategori belirterek). |

### Raporlar & Artifact
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/artifact/latest` | Veritabanındaki **en son** bekleyen raporu getirir. |
| `GET` | `/api/artifact/:threadId` | Belirtilen göreve ait spesifik raporu getirir. |

### Görev Geçmişi (Mission History)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/missions` | Tüm görevler (Sayfalama + Durum filtresi destekler). |
| `GET` | `/api/missions/:threadId` | Görev detayını getirir. |

### Kampanya (CMO Bot)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/campaign/pending` | Onay bekleyen taslak kampanyaları getirir. |
| `GET` | `/api/campaign/:id` | Kampanya detayını getirir. |
| `POST` | `/api/campaign/:id/approve` | Kampanyayı onayla/reddet → Kanallarda yayınla. |

### Destek Ticket (Support Bot)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/support/pending` | Bekleyen müşteri destek taleplerini (Inbox) listeler. |
| `POST` | `/api/support/:ticketId/approve` | Destek yanıtını onayla (Gönder) veya CTO'ya eskalasyon yap. |

### Gelen Mesaj (Inbox Webhook)
| Method | Path | Açıklama |
|---|---|---|
| `POST` | `/api/inbox` | Dış sistemden mesaj al (SMS/Email/Chat) → LangGraph workflow başlat. |

### Bilgi Tabanı (Knowledge / RAG)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/knowledge/:clientId` | İlgili tenant'a (müşteriye) ait tüm vektörel belgeleri listeler. |
| `POST` | `/api/knowledge` | Manuel metin (saf string) vektörleştirerek ekler. |
| `DELETE` | `/api/knowledge/:clientId/:id` | Sisteme kayıtlı bir belgeyi siler. |
| `POST` | `/api/knowledge/search` | Google Gemini ile Semantic Vector Arama yapar. |
| `POST` | `/api/knowledge/upload` | **[Premium]** PDF yükle → Parse + Chunking + Gemini Embeding işlemi yapar. |
| `POST` | `/api/knowledge/url` | **[Premium]** URL Ver → Siteyi Scrape Et + Parse + Özeti Embedle. |

### Finans (CFO Dashboard)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/finance/summary` | Aylık P&L (Kâr/Zarar), Ajan bazlı token/dolar ($) maliyet analizleri. |
| `POST` | `/api/finance/stripe-webhook` | Stripe ödeme olaylarını sisteme aktarır. |

### Tenant / Ayarlar (Multi-Tenant)
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/tenant/config` | Geçerli Agent ayarlarını ve kimliğini (Persona/Tone) getirir. |
| `PUT` | `/api/tenant/config` | Persona, iletişim tonu, şirket bağlamı ve aktif yetenekleri günceller. |

### Skill Store
| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/skills` | Sisteme entegre edilebilecek tüm dış skill/plugin'leri listeler. |

---

## 2. Ajanlar (10 Akıllı Modül)

| # | Ajan | Rol ve Yetenek Özeti |
|---|---|---|
| 1 | **Orchestrator (CEO)** | Tüm LangGraph akışını yönetir. Gelen talebi analiz edip işi böler, ajan sıralamasını belirler. |
| 2 | **Scraper (🕵️)** | Tavily API kullanarak derinlemesine web araştırması (Scraping) yapar. |
| 3 | **Analyzer (🧠)** | Gelen ham veriyi analiz edip 3 stratejik/aksiyoner hedef üretir. |
| 4 | **Writer (✍️)** | İş raporu, Twitter thread, LinkedIn post ve makaleler yazar. |
| 5 | **Critic (QA - 🧐)** | Yazarlardan çıkan metnin dil, ton, yazım ve format doğruluğunu kontrol eder (Revizyon döngüsünü tetikleyebilir). |
| 6 | **Architect (CTO - 👨‍💻)** | Yazılım (Kodlama) talepleri için Master Blueprint ve teknik dokümantasyon üretir. |
| 7 | **File Saver (💾)** | Kritik AI çıktılarını MongoDB Artifact koleksiyonuna kaydeder. |
| 8 | **Publisher (📢)** | Onaylanmış içerikleri Telegram, WhatsApp ve Discord kanallarına eş zamanlı dağıtır. |
| 9 | **Customer Bot (🤖)** | Gelen mail/mesajı okur, sınıflandırır (SPAM / HOT_LEAD / SUPPORT / BUG) ve RAG veritabanına bakarak yanıt yazar. |
| 10| **CMO (📣)** | Yayınlanan bir rapordan sosyal medya kanalları (LinkedIn, X, Meta Ads) için yaratıcı pazarlama metni (Campaign) üretir. |

---

## 3. LangGraph Workflow (İş Akışı)

**1. Çekirdek Akış (Core Lead / Rapor Üretimi):**
```text
START → ORCHESTRATOR 
       ↳ SCRAPER → ORCHESTRATOR
       ↳ ANALYZER → ORCHESTRATOR
       ↳ WRITER ↔ CRITIC (Kalite kontrolden geçene kadar revizyon döngüsü)
       ↳ ARCHITECT (Sadece teknik kodlama/yazılım hedefleri için)
       ↳ FILE_SAVER (Veriyi Atlas'a kaydet)
       ↳ HUMAN_APPROVAL [⛔ PAUSE — Görev sahibinin onayı (HITL) bekleniyor]
       ↳ PUBLISHER (Kabul edilirse kanallara bas) → END
```

**2. Arka Plan Senkron Döngüleri:**
- `runHotLeadWorkflow`: Ana workflow. SSE (Server-Sent Events) ile Frontend'e sinyal yollar.
- `runPublishWorkflow`: HITL (İnsan) onayı verildikten sonra Publisher ajanını tekil uyandıran akış.
- `runCMOWorkflow`: Yayın yapıldıktan sonra otomatik başlayan ve reklam kampanyası yaratan akış.
- `runRevisionWorkflow`: Kullanıcı raporu reddedip feedback verdiğinde metnin tekrar Writer-Critic döngüsüne girmesi.

---

## 4. Servisler ve Dış Entegrasyonlar

| Servis | Açıklama ve Görevi |
|---|---|
| **Gmail (OAuth2)** | Node-Cron ile her 5 dakikada inbox taraması yapar; müşteri şikayetlerini okuyup RAG ile bularak otomatik "Draft" reply çeker. |
| **Telegram Bot** | 2-yönlü sohbet (Long polling). Telegram üzerinden patronun gönderdiği mesaj doğrudan `HOT_LEAD` başlatır. |
| **WhatsApp (Twilio)** | Kritik rapor ve şirket özetlerini SMS ağından Push mantığıyla müşteriye ulaştırır. |
| **Discord Webhooks** | Gelişmiş "Rich Embed" yapısıyla üretilen raporları ve kampanya duyurularını ekip sunucusuna basar. |
| **Tavily Search** | Scraper ajanının gözü kulağıdır. |
| **Google Gemini Embeddings** | Ücretsiz tier'ında muazzam güçlü Vektör oluşturma servisi (`gemini-embedding-001`). RAG aramalarının kalbi. |
| **MongoDB Atlas** | Database ve `%vectorSearch` kullanarak RAG Indexing/arama katmanı. |
| **Stripe** | SaaS ürün ödeme entegrasyonu ve CFO ajanına canlı gelir verisi yollama (`webhook`). |
| **AWS Bedrock** | Ana Anthropic / Claude Sonnet 3.5 LLM motor çağrıları. |
| **Node-Cron** | Saat 08:00 R&D Radar'ı ve 5 dk Inbox tarayıcı ritim motoru. |

---

## 5. MongoDB Şemaları (Veritabanı Modelleri)

| Model Adı | Kullanım Amacı |
|---|---|
| `Report` | AI üretimi Artifact'lar (AWAITING_APPROVAL → APPROVED → PUBLISHED evreleri). |
| `SupportTicket` | E-posta destek talepleri + müşteri detayları + taslak bot yanıtları. |
| `Knowledge` | RAG veritabanı yığını. (PDF, URL veya manuel text'lerin `vector` karşılıkları ve Chunk'ları). |
| `CampaignDraft` | CMO ajanı tarafından üretilen taslak dijital pazarlama kampanyaları. |
| `Transaction` | AI Token harcamaları (Ajan bazlı dolar $ maliyeti hesaplaması) + Stripe Gelir logları. |
| `TenantConfig` | Çoklu kiracı (Multi-tenant) sisteminde şirket başına Ajan Persona'sı, Ton, genel Context ve aktif Yetenekler. |
| `Client` | Platforma üye olan ana şirket (Tenant) hesap bilgileri (API key, abonelik modeli, limitler). |
| `Skill` | Şirketin aktif/pasif hale getirebileceği Plugin (Yetki) koleksiyonu kataloğudur. |

---

## 6. Frontend'in Mevcut Durumu ve Eksikler

**Tamamlanan Bölümler (Var Olanlar):**
✅ **Sidebar & Layout:** UI yapıları ve Routing tamam.
✅ **Command Center (Chat):** Çekirdek akışı (SSE ile Ajan çalışma ikonları vb.) kısmen bağlı, sistem komut yolluyor.
✅ **Settings Panel (`/api/tenant/config`):** Müşteri Persona ve şirket bilgisi kayıt formu MongoDB'ye bağlı çalışıyor.
✅ **Skill Store (`/api/skills`):** Plugin listeleme ve Enable/Disable UI sistemi çalışıyor.

**Eksik/Geliştirilecek Paneller (UI Olmayanlar):**
❌ **Dashboard (Finans):** `CfoDashboard` paneli bağlı değil. Aylık ciro, token analizleri (`/api/finance/summary`) tasarlanıp bağlanmalı.
❌ **Knowledge Base:** Sadece `KnowledgeView` var içi boş. PDF yükleme, URL kazıma (`/api/knowledge/upload`) tasarımları/istekleri yazılmalı.
❌ **Campaign Viewer:** CMO'nun ürettiği LinkedIn ve Twitter metinlerinin gösterildiğini Inbox içindeki "Campaigns" tabına tam layout giydirilmesi gerek.
❌ **Mission History View:** Oynatılan eski raporların ve AI çıktılarının loglarını gösterecek `/api/missions` bağlı UX tablo tasarımı yok.
❌ **CTO / Architect Panel:** Yazılım mimarisi oluşturulduğunda Mavi Temalı "Teknik Blueprint" renderlayacak özel Markdown bileşeni yapılması daha estetik olacaktır.

### Sosyal Medya (CMO) Akışı Nasıl Görünmeli/Tasarlanmalı?
1. Kullanıcı chat üzerinden bir "Lead/Rapor" görevi yaratır.
2. Hitl Onayı verilir ve "Publisher" makaleyi dağıtır.
3. Node arkada tetiklenip "CMO" agent'a işi aktarır. 
4. CMO ajanı taslakları (LinkedIn/Meta vb.) oluşturup `CampaignDraft`'a yazar.
5. Kullanıcı arayüzde **Inbox** -> **Campaign** sekmesine geldiğinde bu kartları seçer -> Yanda detaylar çıkar -> *Launch Campaign* butonu üzerinden API son yayını yapar.
*(Bu yapı arka planda API olarak çalışıyor, UI tarafında kartlara bağlanması lazım).*